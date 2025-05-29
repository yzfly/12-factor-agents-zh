import * as fs from 'fs';
import * as path from 'path';
import { cli } from "../../src/cli";
import { withMockedConsole } from "../utils/console-mock";
import { withTmpDir } from "../utils/temp-dir";

describe("CLI basics", () => {
  it("should handle --help flag", () => {
    const output = withMockedConsole(() => {
      cli(["--help"]);
    });

    expect(output).toContain("USAGE:");
    expect(output).toContain("OPTIONS:");
    expect(output).toContain("--help, -h");
  });

  it("should handle -h flag", () => {
    const output = withMockedConsole(() => {
      cli(["-h"]);
    });

    expect(output).toContain("USAGE:");
    expect(output).toContain("OPTIONS:");
    expect(output).toContain("--help, -h");
  });

  it("should show error for missing yaml file path", () => {
    const output = withMockedConsole(() => {
      cli(["generate"]);
    });

    expect(output).toContain("Error: YAML file path is required");
  });

  it("should show error for non-existent yaml file", () => {
    const output = withMockedConsole(() => {
      cli(["generate", "non-existent.yaml"]);
    });

    expect(output).toContain("Error: Could not read YAML file");
  });

  it("should show error for invalid yaml content", () => {
    withTmpDir((tempDir: string) => {
      fs.writeFileSync(
        path.join(tempDir, 'invalid.yaml'),
        `invalid: yaml: content: [}`
      );

      const output = withMockedConsole(() => {
        cli(["generate", path.join(tempDir, "invalid.yaml")]);
      });

      expect(output).toContain("Error: Could not parse YAML content");
    });
  });

  it("should show error for missing required fields", () => {
    withTmpDir((tempDir: string) => {
      fs.writeFileSync(
        path.join(tempDir, 'missing-fields.yaml'),
        `some_field: "some value"`
      );

      const output = withMockedConsole(() => {
        cli(["generate", path.join(tempDir, "missing-fields.yaml")]);
      });

      expect(output).toContain("Error: Invalid YAML structure");
      expect(output).toContain("Missing required 'title' or 'text' fields");
    });
  });

  it("should show unknown command message", () => {
    const output = withMockedConsole(() => {
      cli(["unknown"]);
    });

    expect(output).toContain("Unknown command");
    expect(output).toContain("Available commands: generate");
  });
}); 

describe("CLI generate basic markdown", () => {
  it("should generate basic markdown", () => {
    withTmpDir((tempDir: string) => {
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough.yaml'),
        `title: "setting up a typescript cli"
text: "this is a walkthrough for setting up a typescript cli"`
      );

      const output = withMockedConsole(() => {
        cli(["generate", path.join(tempDir, "walkthrough.yaml")]);
      });

      expect(fs.existsSync(path.join(tempDir, 'walkthrough.md'))).toBe(true);
      const content = fs.readFileSync(path.join(tempDir, 'walkthrough.md'), 'utf8');
      expect(content).toContain("# setting up a typescript cli");
      expect(content).toContain("this is a walkthrough for setting up a typescript cli");
      expect(output).toContain("Successfully generated walkthrough");
    });
  });

  it("should generate markdown with a section", () => {
    withTmpDir((tempDir: string) => {
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough.yaml'),
        `title: "setting up a typescript cli"
text: "this is a walkthrough for setting up a typescript cli"
sections:
  - title: "Installation"
    text: "First, let's install the necessary dependencies"`
      );

      const output = withMockedConsole(() => {
        cli(["generate", path.join(tempDir, "walkthrough.yaml")]);
      });

      expect(fs.existsSync(path.join(tempDir, 'walkthrough.md'))).toBe(true);
      const content = fs.readFileSync(path.join(tempDir, 'walkthrough.md'), 'utf8');
      expect(content).toContain("# setting up a typescript cli");
      expect(content).toContain("this is a walkthrough for setting up a typescript cli");
      expect(content).toContain("## Installation");
      expect(content).toContain("First, let's install the necessary dependencies");
      expect(output).toContain("Successfully generated walkthrough");
    });
  });

  it("should generate markdown with sections and steps", () => {
    withTmpDir((tempDir: string) => {
      fs.mkdirSync(path.join(tempDir, 'walkthrough'), { recursive: true });
      
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough.yaml'),
        `title: "setting up a typescript cli"
text: "this is a walkthrough for setting up a typescript cli"
targets:
  - markdown: "./build/walkthrough.md"
    onChange:
      diff: true
      cp: true
sections:
  - name: setup
    title: "Initial Setup"
    steps:
      - text: "Create package.json"
        file: {src: ./walkthrough/00-package.json, dest: package.json}
      - text: "Install dependencies"
        command: |
          npm install
        results:
          - text: "You should see packages being installed"
            code: |
              added 123 packages`
      );
      
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough/00-package.json'),
        `{
          "name": "walkthroughgen",
          "version": "1.0.0",
          "description": "A CLI tool for generating walkthroughs",
          "dependencies": {
            "typescript": "^5.0.0"
          }
        }`
      );
      
      const output = withMockedConsole(() => {
        cli(["generate", path.join(tempDir, "walkthrough.yaml")]);
      });

      expect(fs.existsSync(path.join(tempDir, 'build/walkthrough.md'))).toBe(true);
      const content = fs.readFileSync(path.join(tempDir, 'build/walkthrough.md'), 'utf8').replace(/\r\n/g, '\n');
      expect(content).toContain(`
# setting up a typescript cli

this is a walkthrough for setting up a typescript cli

## Initial Setup

Create package.json

    cp ./walkthrough/00-package.json package.json

<details>
<summary>show file</summary>

\`\`\`json
// ./walkthrough/00-package.json
{
          "name": "walkthroughgen",
          "version": "1.0.0",
          "description": "A CLI tool for generating walkthroughs",
          "dependencies": {
            "typescript": "^5.0.0"
          }
        }
\`\`\`

</details>

Install dependencies

    npm install

You should see packages being installed

    added 123 packages
    `.trim());
      expect(output).toContain("Successfully generated walkthrough");
    });
  });
});

describe("CLI generate from example", () => {
  it("should generate markdown from the typescript example", () => {
    withTmpDir((tempDir: string) => {
      const exampleBasePath = path.resolve(__dirname, '../../examples/typescript');
      const exampleWalkthroughDir = path.join(exampleBasePath, 'walkthrough');
      
      // Copy walkthrough.yaml
      const sourceYamlPath = path.join(exampleBasePath, 'walkthrough.yaml');
      const destYamlPath = path.join(tempDir, 'walkthrough.yaml');
      fs.copyFileSync(sourceYamlPath, destYamlPath);

      // Copy walkthrough directory recursively
      const destWalkthroughSubDir = path.join(tempDir, 'walkthrough');
      fs.cpSync(exampleWalkthroughDir, destWalkthroughSubDir, { recursive: true });

      // Run CLI
      const output = withMockedConsole(() => {
        cli(["generate", destYamlPath]);
      });

      // Assertions
      const expectedMarkdownPath = path.join(tempDir, 'build/walkthrough.md');
      expect(fs.existsSync(expectedMarkdownPath)).toBe(true);
      expect(output).toContain("Successfully generated walkthrough");

      // Content checks
      const markdownContent = fs.readFileSync(expectedMarkdownPath, 'utf8').replace(/\r\n/g, '\n');
      expect(markdownContent).toContain("# setting up a typescript cli");
      expect(markdownContent).toContain("## Copy initial files");
      expect(markdownContent).toContain("cp ./walkthrough/00-package.json package.json");
    });
  });
});

describe("CLI generate with diffs", () => {
  it("should show diffs when files are overwritten", () => {
    withTmpDir((tempDir: string) => {
      fs.mkdirSync(path.join(tempDir, 'walkthrough'), { recursive: true });
      
      // Create initial package.json
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough/v1-package.json'),
        `{
  "name": "example",
  "version": "1.0.0",
  "dependencies": {
    "typescript": "^5.0.0"
  }
}`
      );

      // Create updated package.json with a new dependency
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough/v2-package.json'),
        `{
  "name": "example",
  "version": "1.0.0",
  "dependencies": {
    "typescript": "^5.0.0",
    "express": "^4.18.0"
  }
}`
      );

      // Create walkthrough.yaml that updates package.json
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough.yaml'),
        `title: "Test Diff Generation"
text: "Testing diff generation for file updates"
targets:
  - markdown: "./walkthrough.md"
    onChange:
      diff: true
      cp: true
sections:
  - title: "Initial Setup"
    steps:
      - text: "Create initial package.json"
        file: {src: ./walkthrough/v1-package.json, dest: package.json}
  - title: "Add Express"
    steps:
      - text: "Add express dependency"
        file: {src: ./walkthrough/v2-package.json, dest: package.json}`
      );

      const output = withMockedConsole(() => {
        cli(["generate", path.join(tempDir, "walkthrough.yaml")]);
      });

      expect(fs.existsSync(path.join(tempDir, 'walkthrough.md'))).toBe(true);
      const content = fs.readFileSync(path.join(tempDir, 'walkthrough.md'), 'utf8').replace(/\r\n/g, '\n');

      // First file copy should not have a diff (it's new)
      expect(content).toContain("Create initial package.json");
      expect(content).toContain("cp ./walkthrough/v1-package.json package.json");
      expect(content).toContain(`<details>
<summary>show file</summary>

\`\`\`json
// ./walkthrough/v1-package.json
{
  "name": "example",
  "version": "1.0.0",
  "dependencies": {
    "typescript": "^5.0.0"
  }
}
\`\`\`

</details>`);

      // Second file copy should have a diff (it's an update)
      expect(content).toContain("Add express dependency");
      expect(content).toContain("```diff\npackage.json\n   \"version\": \"1.0.0\",\n   \"dependencies\": {\n-    \"typescript\": \"^5.0.0\"\n+    \"typescript\": \"^5.0.0\",\n+    \"express\": \"^4.18.0\"\n   }\n }");
      expect(content).toContain(`<details>
<summary>skip this step</summary>

    cp ./walkthrough/v2-package.json package.json

</details>`);

      expect(output).toContain("Successfully generated walkthrough");
    });
  });
});

describe("CLI generate with folders target", () => {
  it("should create base folders directory", () => {
    withTmpDir((tempDir: string) => {
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough.yaml'),
        `title: "Test Folders"
text: "Testing folders target"
targets:
  - folders: { path: "./build/by-section" }
sections:
  - title: "First Section"
    text: "First section text"`
      );

      const output = withMockedConsole(() => {
        cli(["generate", path.join(tempDir, "walkthrough.yaml")]);
      });

      expect(fs.existsSync(path.join(tempDir, 'build/by-section'))).toBe(true);
      expect(output).toContain("Successfully generated walkthrough");
    });
  });

  it("should create first section folder with README", () => {
    withTmpDir((tempDir: string) => {
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough.yaml'),
        `title: "Test Folders"
text: "Testing folders target"
targets:
  - folders: { path: "./build/by-section" }
sections:
  - name: first-section
    title: "First Section"
    text: "First section text"`
      );

      const output = withMockedConsole(() => {
        cli(["generate", path.join(tempDir, "walkthrough.yaml")]);
      });

      const sectionPath = path.join(tempDir, 'build/by-section/00-first-section');
      expect(fs.existsSync(sectionPath)).toBe(true);
      expect(fs.existsSync(path.join(sectionPath, 'README.md'))).toBe(true);

      // Check README content
      const readmeContent = fs.readFileSync(path.join(sectionPath, 'README.md'), 'utf8');
      expect(readmeContent).toContain("# First Section");
      expect(readmeContent).toContain("First section text");
    });
  });

  it("should copy files to the section's working directory", () => {
    withTmpDir((tempDir: string) => {
      // Create source file
      fs.mkdirSync(path.join(tempDir, 'walkthrough'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough/file.ts'),
        'console.log("hello");'
      );

      // Create walkthrough.yaml
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough.yaml'),
        `title: "Test Folders"
text: "Testing folders target"
targets:
  - folders: { path: "./build/by-section" }
sections:
  - name: first-section
    title: "First Section"
    text: "First section text"
    steps:
      - text: "Add a file"
        file: {src: ./walkthrough/file.ts, dest: src/file.ts}`
      );

      const output = withMockedConsole(() => {
        cli(["generate", path.join(tempDir, "walkthrough.yaml")]);
      });

      // Check source file was copied to section's walkthrough directory
      const sectionPath = path.join(tempDir, 'build/by-section/00-first-section');
      expect(fs.existsSync(path.join(sectionPath, 'walkthrough/file.ts'))).toBe(true);

      // Check file was NOT copied to its destination within the section
      // (section folders only contain state BEFORE their own steps)
      expect(fs.existsSync(path.join(sectionPath, 'src/file.ts'))).toBe(false);

      // Check README includes the step
      const readmeContent = fs.readFileSync(path.join(sectionPath, 'README.md'), 'utf8');
      expect(readmeContent).toContain("Add a file");
      expect(readmeContent).toContain("cp ./walkthrough/file.ts src/file.ts");
    });
  });

  it("should include files from previous sections", () => {
    withTmpDir((tempDir: string) => {
      // Create source files
      fs.mkdirSync(path.join(tempDir, 'walkthrough'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough/file1.ts'),
        'console.log("hello 1");'
      );
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough/file2.ts'),
        'console.log("hello 2");'
      );

      // Create walkthrough.yaml with two sections
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough.yaml'),
        `title: "Test Folders"
text: "Testing folders target"
targets:
  - folders: { path: "./build/by-section" }
sections:
  - name: first-section
    title: "First Section"
    text: "First section text"
    steps:
      - text: "Add first file"
        file: {src: ./walkthrough/file1.ts, dest: src/file1.ts}
  - name: second-section
    title: "Second Section"
    text: "Second section text"
    steps:
      - text: "Add second file"
        file: {src: ./walkthrough/file2.ts, dest: src/file2.ts}`
      );

      const output = withMockedConsole(() => {
        cli(["generate", path.join(tempDir, "walkthrough.yaml")]);
      });

      // Check first section does NOT have its own file
      // (section folders only contain state BEFORE their own steps)
      const firstSectionPath = path.join(tempDir, 'build/by-section/00-first-section');
      expect(fs.existsSync(path.join(firstSectionPath, 'src/file1.ts'))).toBe(false);

      // Check second section has first section's file but NOT its own file
      const secondSectionPath = path.join(tempDir, 'build/by-section/01-second-section');
      expect(fs.existsSync(path.join(secondSectionPath, 'src/file1.ts'))).toBe(true);
      expect(fs.existsSync(path.join(secondSectionPath, 'src/file2.ts'))).toBe(false);

      // Check READMEs
      const firstReadme = fs.readFileSync(path.join(firstSectionPath, 'README.md'), 'utf8');
      expect(firstReadme).toContain("Add first file");
      expect(firstReadme).toContain("cp ./walkthrough/file1.ts src/file1.ts");

      const secondReadme = fs.readFileSync(path.join(secondSectionPath, 'README.md'), 'utf8');
      expect(secondReadme).toContain("Add second file");
      expect(secondReadme).toContain("cp ./walkthrough/file2.ts src/file2.ts");
    });
  });

  it("should correctly generate section folders with dir creation and specific file content", () => {
    withTmpDir((tempDir: string) => {
      // --- Setup source files ---
      fs.mkdirSync(path.join(tempDir, 'walkthrough'), { recursive: true });
      
      // package.json for hello-world section
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough/00-package.json'),
        JSON.stringify({ name: "hello-world-pkg", dependencies: {} }, null, 2)
      );
      // tsconfig.json for hello-world section
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough/00-tsconfig.json'),
        JSON.stringify({ compilerOptions: { target: "esnext" } }, null, 2)
      );

      // This is the content EXPECTED in hello-world/src/index.ts
      const expectedHelloWorldIndexContent = 'console.log("hello, world!"); // Simple version';
      // The YAML for hello-world section will point to this source file.
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough/01-index.ts'), // As per user's YAML for hello-world
        expectedHelloWorldIndexContent
      );

      // This is the content that the user sees INCORRECTLY appearing in hello-world/src/index.ts.
      // This file won't be directly referenced by the hello-world section in this test's YAML.
      // If this content appears, it means something is wrong with file sourcing or cumulative logic.
      const cliIndexContent = 'import { cli } from "./cli"; cli(); // CLI version';
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough/02-index.ts'), // A different file
        cliIndexContent
      );

      const cliTSContent = 'export function cli() { console.log("cli"); }';
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough/02-cli.ts'), // A different file
        cliTSContent
      );

      // --- Setup walkthrough.yaml ---
      const walkthroughYamlContent = `
title: "Test Folders Feature"
text: "Testing dir creation and file content isolation between sections."
targets:
  - folders:
      path: "./build/sections"
      skip:
        - "cleanup"
      final:
        dirName: "final"
      
sections:
  - name: cleanup
    title: "Cleanup Section"
    steps:
      - text: "Simulate cleanup (command is illustrative, not run by folders target)"
        command: "rm -rf src/"
  - name: hello-world
    title: "Hello World Section"
    steps:
      - text: "Copy package.json"
        file: {src: ./walkthrough/00-package.json, dest: package.json}
      - text: "Copy tsconfig.json"
        file: {src: ./walkthrough/00-tsconfig.json, dest: tsconfig.json}
      - text: "Create src folder"
        dir: {create: true, path: src}
      - text: "Add simple hello world index.ts"
        file: {src: ./walkthrough/01-index.ts, dest: src/index.ts} # Points to expectedHelloWorldIndexContent
  - name: cli-version # A subsequent section
    title: "CLI Version Section"
    steps:
      - text: "add a CLI"
        file: {src: ./walkthrough/02-cli.ts, dest: src/cli.ts} # adds src/cli.ts
      - text: "Update index.ts to CLI version"
        file: {src: ./walkthrough/02-index.ts, dest: src/index.ts} # Overwrites src/index.ts
  - name: runnable
    title: "run the cli"
    steps:
      - text: "run the cli"
        command: "npx tsx src/index.ts"
`;
      fs.writeFileSync(path.join(tempDir, 'walkthrough.yaml'), walkthroughYamlContent);

      // --- Run CLI ---
      cli(["generate", path.join(tempDir, "walkthrough.yaml")]);

      // --- Assertions ---
      const cleanupSectionPath = path.join(tempDir, 'build/sections/00-cleanup');
      const helloWorldSectionPath = path.join(tempDir, 'build/sections/00-hello-world');
      const cliSectionPath = path.join(tempDir, 'build/sections/01-cli-version');
      const finalSectionPath = path.join(tempDir, 'build/sections/final');

      //
      // Cleanup Section
      //
      // cleanup has skip:true so it should not exist
      expect(fs.existsSync(cleanupSectionPath)).toBe(false);

      //
      // Hello World Section
      //
      // Assert hello-world section - this should have the results of the previous step (NOTHING)
      expect(fs.existsSync(helloWorldSectionPath)).toBe(true);
      // Check package.json and tsconfig.json don't exist yet
      expect(fs.existsSync(path.join(helloWorldSectionPath, 'src'))).toBe(false); 
      expect(fs.existsSync(path.join(helloWorldSectionPath, 'package.json'))).toBe(false);
      expect(fs.existsSync(path.join(helloWorldSectionPath, 'tsconfig.json'))).toBe(false);
      

      //
      // CLI Section
      //
      // The cli section should contain the results of the hell-world section
      const packageJSONPath = path.join(cliSectionPath, 'package.json');
      const tsconfigJSONPath = path.join(cliSectionPath, 'tsconfig.json');
      const indexTSPath = path.join(cliSectionPath, 'src/index.ts');

      expect(fs.existsSync(packageJSONPath)).toBe(true); 
      expect(fs.existsSync(tsconfigJSONPath)).toBe(true);
      expect(fs.existsSync(indexTSPath)).toBe(true);
      const packageJSONContent = fs.readFileSync(packageJSONPath, 'utf8');
      expect(packageJSONContent).toContain("hello-world-pkg");
      const tsconfigJSONContent = fs.readFileSync(tsconfigJSONPath, 'utf8');
      expect(tsconfigJSONContent).toContain("\"target\": \"esnext\"");
      const indexTSContent = fs.readFileSync(indexTSPath, 'utf8');
      expect(indexTSContent).toContain("console.log(\"hello, world!\");");

      //
      // Final Section
      //
      // the final folder, marked by "final: dirName: final" should contain all the files from the last section
      expect(fs.existsSync(finalSectionPath)).toBe(true);
      expect(fs.existsSync(path.join(finalSectionPath, 'src/index.ts'))).toBe(true);
      expect(fs.existsSync(path.join(finalSectionPath, 'src/cli.ts'))).toBe(true);
      expect(fs.existsSync(path.join(finalSectionPath, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(finalSectionPath, 'tsconfig.json'))).toBe(true);
      // Verify index.ts calls the cli function
      const finalIndexContent = fs.readFileSync(path.join(finalSectionPath, 'src/index.ts'), 'utf8');
      expect(finalIndexContent).toContain(cliIndexContent);
      const finalCliContent = fs.readFileSync(path.join(finalSectionPath, 'src/cli.ts'), 'utf8');
      expect(finalCliContent).toContain(cliTSContent);
    });
  });

  it("should execute commands in the working directory for folders target", () => {
    withTmpDir((tempDir: string) => {
      // Create walkthrough.yaml
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough.yaml'),
        `title: "Test Command Execution in Folders"
text: "Testing command execution"
targets:
  - folders:
      path: "./build/cmd-test"
      final:
        dirName: "final-cmd"
sections:
  - name: section-with-command
    title: "Section with Command"
    steps:
      - text: "Create a file via command"
        command: "echo 'command content' > command_file.txt"
        incremental: true
  - name: next-section
    title: "Next Section"
    steps:
      - text: "Another step"
        command: "echo 'another' > another_file.txt"
        incremental: true`
      );

      // Run CLI
      cli(["generate", path.join(tempDir, "walkthrough.yaml")]);

      // Assertions
      const firstSectionPath = path.join(tempDir, 'build/cmd-test/00-section-with-command');
      const secondSectionPath = path.join(tempDir, 'build/cmd-test/01-next-section');
      const finalPath = path.join(tempDir, 'build/cmd-test/final-cmd');

      // First section should NOT have its own command's file
      expect(fs.existsSync(path.join(firstSectionPath, 'command_file.txt'))).toBe(false);

      // Second section SHOULD have first section's command's file
      expect(fs.existsSync(path.join(secondSectionPath, 'command_file.txt'))).toBe(true);
      // But should NOT have its own command's file
      expect(fs.existsSync(path.join(secondSectionPath, 'another_file.txt'))).toBe(false);

      // Final folder should have both files
      expect(fs.existsSync(path.join(finalPath, 'command_file.txt'))).toBe(true);
      expect(fs.existsSync(path.join(finalPath, 'another_file.txt'))).toBe(true);

      // Check file contents
      const commandFileContent = fs.readFileSync(path.join(secondSectionPath, 'command_file.txt'), 'utf8').trim();
      expect(commandFileContent).toBe('command content');
      const finalAnotherFileContent = fs.readFileSync(path.join(finalPath, 'another_file.txt'), 'utf8').trim();
      expect(finalAnotherFileContent).toBe('another');
    });
  });

  it("should handle incremental commands correctly", () => {
    withTmpDir((tempDir: string) => {
      // Create walkthrough.yaml
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough.yaml'),
        `title: "Test Incremental Commands"
text: "Testing incremental command behavior"
targets:
  - markdown: "./walkthrough.md"
  - folders:
      path: "./build/cmd-test"
      final:
        dirName: "final"
sections:
  - name: section-with-commands
    title: "Section with Commands"
    steps:
      - text: "Regular command (not executed in folders, shown in MD)"
        command: "echo 'regular command' > regular.txt"
      - text: "Incremental command (executed in folders, shown in MD)"
        command: "echo 'incremental command' > incremental.txt"
        incremental: true
      - text: "Another regular command (not executed in folders, shown in MD)"
        command: "echo 'another regular' > another_regular.txt"
        incremental: false`
      );

      // Run CLI
      cli(["generate", path.join(tempDir, "walkthrough.yaml")]);

      // Check markdown output - ALL commands should be in markdown
      const markdownContent = fs.readFileSync(path.join(tempDir, 'walkthrough.md'), 'utf8');
      expect(markdownContent).toContain("echo 'regular command' > regular.txt");
      expect(markdownContent).toContain("echo 'incremental command' > incremental.txt");
      expect(markdownContent).toContain("echo 'another regular' > another_regular.txt");

      // Check folders output - only incremental commands should have run
      const finalPath = path.join(tempDir, 'build/cmd-test/final');
      expect(fs.existsSync(path.join(finalPath, 'regular.txt'))).toBe(false);
      expect(fs.existsSync(path.join(finalPath, 'incremental.txt'))).toBe(true);
      expect(fs.existsSync(path.join(finalPath, 'another_regular.txt'))).toBe(false);

      // Check file contents for incremental command
      const incrementalContent = fs.readFileSync(path.join(finalPath, 'incremental.txt'), 'utf8').trim();
      expect(incrementalContent).toBe('incremental command');
    });
  });

  it("should generate section READMEs with diffs and show file blocks", () => {
    withTmpDir((tempDir: string) => {
      // Create source files
      fs.mkdirSync(path.join(tempDir, 'walkthrough'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough/v1-index.ts'),
        'console.log("hello");'
      );
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough/v2-index.ts'),
        'console.log("hello");\nconsole.log("world");'
      );

      // Create walkthrough.yaml
      fs.writeFileSync(
        path.join(tempDir, 'walkthrough.yaml'),
        `title: "Test Section README Diffs"
text: "Testing section README diff generation"
targets:
  - folders:
      path: "./build/sections"
      final:
        dirName: "final"
    onChange:
      diff: true
      cp: true
    newFiles:
      cat: false
      cp: true
sections:
  - name: first-section
    title: "First Section"
    text: "First section text"
    steps:
      - text: "Add initial index.ts"
        file: {src: ./walkthrough/v1-index.ts, dest: src/index.ts}
  - name: second-section
    title: "Second Section"
    text: "Second section text"
    steps:
      - text: "Update index.ts"
        file: {src: ./walkthrough/v2-index.ts, dest: src/index.ts}`
      );

      // Run CLI
      cli(["generate", path.join(tempDir, "walkthrough.yaml")]);

      // Check first section README
      const firstSectionPath = path.join(tempDir, 'build/sections/00-first-section');
      const firstReadme = fs.readFileSync(path.join(firstSectionPath, 'README.md'), 'utf8');
      expect(firstReadme).toContain("Add initial index.ts");
      expect(firstReadme).toContain("cp ./walkthrough/v1-index.ts src/index.ts");
      expect(firstReadme).toContain("<details>\n<summary>show file</summary>");
      expect(firstReadme).toContain("```ts\n// ./walkthrough/v1-index.ts");
      expect(firstReadme).toContain('console.log("hello");');

      // Check second section README
      const secondSectionPath = path.join(tempDir, 'build/sections/01-second-section');
      const secondReadme = fs.readFileSync(path.join(secondSectionPath, 'README.md'), 'utf8');
      expect(secondReadme).toContain("Update index.ts");
      expect(secondReadme).toContain("```diff\nsrc/index.ts\n+console.log(\"world\");");
      expect(secondReadme).toContain("<details>\n<summary>skip this step</summary>");
      expect(secondReadme).toContain("cp ./walkthrough/v2-index.ts src/index.ts");
    });
  });
});