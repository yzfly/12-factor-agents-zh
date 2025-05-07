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

    // Assert that the help flag was received
    expect(output).toContain("USAGE:");
    expect(output).toContain("OPTIONS:");
    expect(output).toContain("--help, -h");
  });
}); 

describe("CLI generate basic markdown", () => {
  it("should generate basic markdown", () => {
    withTmpDir((tempDir: string) => {
      const output = withMockedConsole(() => {
        const fs = require('fs');
        const path = require('path');
        
        fs.writeFileSync(
          path.join(tempDir, 'walkthrough.yaml'),
          `title: "setting up a typescript cli"
text: "this is a walkthrough for setting up a typescript cli"`
        );
        cli(["generate", path.join(tempDir, "walkthrough.yaml")]);
      });

      expect(fs.existsSync(path.join(tempDir, 'walkthrough.md'))).toBe(true);
      const content = fs.readFileSync(path.join(tempDir, 'walkthrough.md'), 'utf8');
      expect(content).toContain("# setting up a typescript cli");
      expect(content).toContain("this is a walkthrough for setting up a typescript cli");

    });
  });

  it("should generate markdown with a section", () => {
    withTmpDir((tempDir: string) => {
      const output = withMockedConsole(() => {
        const fs = require('fs');
        const path = require('path');
        
        fs.writeFileSync(
          path.join(tempDir, 'walkthrough.yaml'),
          `title: "setting up a typescript cli"
text: "this is a walkthrough for setting up a typescript cli"
sections:
  - title: "Installation"
    text: "First, let's install the necessary dependencies"`
        );
        cli(["generate", path.join(tempDir, "walkthrough.yaml")]);
      });

      expect(fs.existsSync(path.join(tempDir, 'walkthrough.md'))).toBe(true);
      const content = fs.readFileSync(path.join(tempDir, 'walkthrough.md'), 'utf8');
      expect(content).toContain("# setting up a typescript cli");
      expect(content).toContain("this is a walkthrough for setting up a typescript cli");
      expect(content).toContain("## Installation");
      expect(content).toContain("First, let's install the necessary dependencies");
    });
  });

  it("should generate markdown with sections and steps", () => {
    withTmpDir((tempDir: string) => {
      const output = withMockedConsole(() => {
        const fs = require('fs');
        const path = require('path');
        
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
        
        cli(["generate", path.join(tempDir, "walkthrough.yaml")]);
      });

      expect(fs.existsSync(path.join(tempDir, 'build/walkthrough.md'))).toBe(true);
      const content = fs.readFileSync(path.join(tempDir, 'build/walkthrough.md'), 'utf8');
      expect(content).toContain(`
# setting up a typescript cli

this is a walkthrough for setting up a typescript cli

## Initial Setup

Create package.json

    cp ./walkthrough/00-package.json package.json

Install dependencies

    npm install

You should see packages being installed

    added 123 packages
    `.trim());
    });
  });
});