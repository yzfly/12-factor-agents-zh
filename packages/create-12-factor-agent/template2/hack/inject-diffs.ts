import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as os from 'os';

// Create a temporary directory for the entire simulation
const mainTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'walkthrough-'));

// Read the walkthrough markdown from template2/walkthrough.md
const walkthrough = fs.readFileSync(path.resolve(__dirname, '..', 'walkthrough.md'), 'utf8');

// Split into lines while preserving line endings
const lines = walkthrough.split(/(\r?\n)/);

// Initialize output content
let output: string[] = [];

// Copy initial project state to main temp dir
const initialDirs = ['src', 'baml_src'];
for (const dir of initialDirs) {
  if (fs.existsSync(dir)) {
    fs.mkdirSync(path.join(mainTempDir, dir), { recursive: true });
    execSync(`cp -R "${dir}/." "${path.join(mainTempDir, dir)}/"`, { stdio: 'inherit' });
  }
}

// Process each line
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  output.push(line);

  // Look for cp commands
  const cpMatch = line.match(/^\s*cp\s+(\S+)\s+(\S+)\s*$/);
  if (cpMatch) {
    const [_, source, dest] = cpMatch;

    // Create a temporary directory for this diff
    const diffTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'diff-'));

    try {
      // Resolve paths relative to template2 directory
      const sourcePath = path.resolve(__dirname, '..', source); // relative to template2
      const destPath = path.join(mainTempDir, dest); // relative to main temp dir
      
      // Ensure destination parent directory exists
      fs.mkdirSync(path.dirname(destPath), { recursive: true });

      // Copy old destination (if it exists) to diff temp dir
      const oldFile = path.join(diffTempDir, 'old_file');
      if (fs.existsSync(destPath)) {
        fs.copyFileSync(destPath, oldFile);
      } else {
        fs.writeFileSync(oldFile, '');
      }

      // Copy new source to diff temp dir
      const newFile = path.join(diffTempDir, 'new_file');
      fs.copyFileSync(sourcePath, newFile);

      // Generate diff
      try {
        const diff = execSync(
          `git diff --no-index --patch-with-raw --unified=3 "${oldFile}" "${newFile}"`,
          { stdio: 'pipe' }
        ).toString();

        // Add the diff after the cp command, but strip the "diff --git" line and the index line
        const cleanDiff = diff
          .split('\n')
          .filter((line: string) => !line.startsWith('diff --git') && !line.startsWith('index '))
          .join('\n');

        output.push('\n```diff\n' + cleanDiff + '```\n');
      } catch (e: any) {
        // git diff returns exit code 1 if files are different, which is expected
        if (e.status === 1) {
          const cleanDiff = e.stdout
            .toString()
            .split('\n')
            .filter((line: string) => !line.startsWith('diff --git') && !line.startsWith('index '))
            .join('\n');

          output.push
          output.push('\n```diff\n' + cleanDiff + '```\n');
        } else {
          throw e;
        }
      }

      // Update main temp dir state by copying the source file to destination
      fs.copyFileSync(sourcePath, destPath);
    } finally {
      // Clean up diff temp dir
      fs.rmSync(diffTempDir, { recursive: true, force: true });
    }
  }
}

// Write the output alongside the original walkthrough.md
fs.writeFileSync(path.resolve(__dirname, '..', 'walkthrough-with-diffs.md'), output.join(''));

// Clean up main temp dir
fs.rmSync(mainTempDir, { recursive: true, force: true });

console.log('Generated walkthrough-with-diffs.md');