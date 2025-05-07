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
});