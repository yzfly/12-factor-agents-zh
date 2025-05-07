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
      expect(markdownContent).toContain("## Copy inital files");
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
      expect(content).toContain("```diff\npackage.json\n-    \"typescript\": \"^5.0.0\"\n+    \"typescript\": \"^5.0.0\",\n+    \"express\": \"^4.18.0\"");
      expect(content).toContain(`<details>
<summary>skip this step</summary>

    cp ./walkthrough/v2-package.json package.json

</details>`);

      expect(output).toContain("Successfully generated walkthrough");
    });
  });
});