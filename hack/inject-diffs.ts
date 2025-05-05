import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Create a temporary directory for the entire simulation
const TEMP_DIR = '.tmp-walkthrough';

// Clean up temp dir if it exists
if (fs.existsSync(TEMP_DIR)) {
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TEMP_DIR);

// Helper: Generate diff between old and new files
function generateDiff(source: string, dest: string, tempDir: string): string {
  // Create a temporary directory just for this diff
  const diffTempDir = fs.mkdtempSync(path.join(tempDir, 'diff-'));

  try {
    // Resolve paths
    const sourcePath = path.resolve(source); // relative to CWD
    const destPath = path.join(tempDir, dest); // relative to temp dir
    
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

    try {
      // Generate diff
      const diff = execSync(
        `git diff --no-index --patch-with-raw --unified=3 "${oldFile}" "${newFile}"`,
        { stdio: 'pipe' }
      ).toString();

      // Clean up the diff output
      return diff
        .split('\n')
        .filter((line: string) => !line.startsWith('diff --git') && !line.startsWith('index '))
        .join('\n');
    } catch (e: any) {
      // git diff returns exit code 1 if files are different, which is expected
      if (e.status === 1) {
        return e.stdout
          .toString()
          .split('\n')
          .filter((line: string) => !line.startsWith('diff --git') && !line.startsWith('index '))
          .join('\n');
      }
      throw e;
    }
  } finally {
    // Clean up diff temp dir
    fs.rmSync(diffTempDir, { recursive: true, force: true });
  }
}

// Helper: Execute cp command in temp dir
function executeCpInTemp(source: string, dest: string, tempDir: string) {
  const sourcePath = path.resolve(source); // relative to CWD
  const destPath = path.join(tempDir, dest); // relative to temp dir
  
  // Ensure destination parent directory exists
  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  // Copy the file
  fs.copyFileSync(sourcePath, destPath);
}

// Copy initial project state to temp dir
const initialDirs = ['src', 'baml_src'];
for (const dir of initialDirs) {
  if (fs.existsSync(dir)) {
    fs.mkdirSync(path.join(TEMP_DIR, dir), { recursive: true });
    execSync(`cp -R "${dir}/." "${path.join(TEMP_DIR, dir)}/"`, { stdio: 'inherit' });
  }
}

// Read the walkthrough markdown
const walkthrough = fs.readFileSync('walkthrough.md', 'utf8');

// Split into lines while preserving line endings
const lines = walkthrough.split(/(\r?\n)/);

// Initialize output content
let output: string[] = [];

// Track code block state
let inCodeBlock = false;
let currentCodeBlockContent: string[] = [];
let currentCodeBlockLang = '';
let precedingText: string[] = []; // Store text lines before a cp block

// Process each line
for (const line of lines) {
  if (line.match(/^```(\w*)/)) {
    if (inCodeBlock) { // End of block
      // Process the completed block
      const blockContent = currentCodeBlockContent.join('\n');
      const cpMatch = blockContent.match(/^\s*cp\s+(\S+)\s+(\S+)\s*$/);

      if (cpMatch && currentCodeBlockLang !== 'diff') { // It's a cp command block
        const [_, source, dest] = cpMatch;
        // Generate diff
        const diff = generateDiff(source, dest, TEMP_DIR);

        // Append preceding text if any
        output.push(...precedingText);
        precedingText = []; // Clear preceding text

        // Append cp command block
        output.push(`\`\`\`${currentCodeBlockLang}\n${blockContent}\n\`\`\``);
        // Append diff block
        if (diff) {
           output.push('\n```diff\n' + diff + '```\n');
        }

        // Execute cp in temp dir
        executeCpInTemp(source, dest, TEMP_DIR);

      } else { // Not a cp block, or already a diff block
         // Append preceding text if any
        output.push(...precedingText);
        precedingText = []; // Clear preceding text
        // Append the original block
        output.push(`\`\`\`${currentCodeBlockLang}\n${blockContent}\n\`\`\``);
      }

      inCodeBlock = false;
      currentCodeBlockContent = [];
      currentCodeBlockLang = '';
    } else { // Start of block
      inCodeBlock = true;
      currentCodeBlockLang = line.match(/^```(\w*)/)?.[1] || '';
    }
    // Don't add the ``` line itself to preceding text
    precedingText = [];
  } else if (inCodeBlock) {
    currentCodeBlockContent.push(line);
  } else { // Regular text line
    // If the line is not blank or just whitespace, add to preceding text
    if (line.trim()) {
       precedingText.push(line);
    } else {
       // If it's blank, and we have preceding text, append it and the blank line
       if (precedingText.length > 0) {
          output.push(...precedingText);
          precedingText = [];
       }
       output.push(line); // Append the blank line
    }
  }
}

// Append any remaining preceding text at the end
if (precedingText.length > 0) {
  output.push(...precedingText);
}

// Write the output
fs.writeFileSync('walkthrough-with-diffs.md', output.join(''));

// Clean up temp dir
fs.rmSync(TEMP_DIR, { recursive: true, force: true });

console.log('Generated walkthrough-with-diffs.md');