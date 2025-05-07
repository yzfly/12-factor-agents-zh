import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as Diff from 'diff';

interface Section {
  title: string;
  text?: string;
  name?: string; // Optional, used for folder naming
  steps?: Array<{
    text?: string; // Make text optional
    file?: { src: string; dest: string };
    command?: string;
    dir?: { create: boolean; path: string }; // Added dir step type
    results?: Array<{ text: string; code: string }>;
  }>;
}

interface WalkthroughData {
  title: string;
  text: string;
  sections?: Section[];
  targets?: Array<{
    markdown?: string;
    folders?: string; // Path for section folders, e.g. "./build/by-section"
    onChange?: { diff?: boolean; cp?: boolean };
    newFiles?: { cat?: boolean; cp?: boolean };
  }>;
}

function getSectionFolderName(section: Section, index: number): string {
  const name = section.name || section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${String(index).padStart(2, '0')}-${name}`;
}

function copySourceFiles(srcFile: string, projectRoot: string, sectionDir: string): void {
  const srcAbsPath = path.resolve(projectRoot, srcFile);
  const relPath = path.relative(projectRoot, srcAbsPath);
  const destPath = path.join(sectionDir, relPath);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcAbsPath, destPath);
}

function copyWorkingFile(srcFile: string, destFile: string, sectionDir: string): void {
  const srcPath = path.join(sectionDir, srcFile);
  const destPath = path.join(sectionDir, destFile);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
}

function copyDirectory(src: string, dest: string): void {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function generateSectionMarkdown(section: Section): string {
  let markdown = `# ${section.title}\n\n`;
  if (section.text) {
    markdown += `${section.text}\n\n`;
  }
  if (section.steps) {
    for (const step of section.steps) {
      if (step.text) {
        markdown += `${step.text}\n\n`;
      }
      if (step.dir?.create) {
        markdown += `    mkdir -p ${step.dir.path}\n\n`; // Add mkdir command to README
      }
      if (step.file) {
        markdown += `    cp ${step.file.src} ${step.file.dest}\n\n`;
      }
      if (step.command) {
        markdown += `    ${step.command.trim()}\n\n`;
      }
      if (step.results) {
        for (const result of step.results) {
          markdown += `${result.text}\n\n`;
          if (result.code) {
            markdown += `    ${result.code.trim()}\n\n`;
          }
        }
      }
    }
  }
  return markdown;
}

export const cli = (argv: string[]) => {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(`
USAGE:
    walkthroughgen generate <yaml-file> [options]

OPTIONS:
    --help, -h    Show help
    generate <yaml-file>    Generate markdown from YAML file
        `);
    return;
  }

  if (argv[0] === "generate") {
    if (!argv[1]) {
      console.error("Error: YAML file path is required for 'generate' command.");
      console.log("Usage: walkthroughgen generate <yaml-file>");
      return;
    }

    const yamlPath = argv[1];
    let yamlContent;
    try {
      yamlContent = fs.readFileSync(yamlPath, 'utf8');
    } catch (error: any) {
      console.error(`Error: Could not read YAML file at '${yamlPath}'.`);
      console.error(error.message);
      return;
    }
    
    let data: WalkthroughData;
    try {
      data = yaml.load(yamlContent) as WalkthroughData;
    } catch (error: any) {
      console.error(`Error: Could not parse YAML content from '${yamlPath}'.`);
      console.error(error.message);
      return;
    }

    if (!data || typeof data.title !== 'string' || typeof data.text !== 'string') {
      console.error(`Error: Invalid YAML structure in '${yamlPath}'. Missing required 'title' or 'text' fields.`);
      return;
    }

    // Track virtual file state for diff generation
    const projectRoot = path.dirname(yamlPath);
    const virtualFileState = new Map<string, string>();
    
    // Process folders target first
    if (data.targets) {
      for (const target of data.targets) {
        if (target.folders) {
          const foldersBasePath = path.join(path.dirname(yamlPath), target.folders);
          fs.mkdirSync(foldersBasePath, { recursive: true });

          // Create section folders
          if (data.sections) {
            data.sections.forEach((section, index) => {
              const sectionName = getSectionFolderName(section, index);
              const sectionPath = path.join(foldersBasePath, sectionName);
              fs.mkdirSync(sectionPath, { recursive: true });

              // If not the first section, copy previous section's working directory
              if (index > 0) {
                const prevSectionName = getSectionFolderName(data.sections![index - 1], index - 1);
                const prevSectionPath = path.join(foldersBasePath, prevSectionName);
                // Copy everything except walkthrough/ and README.md
                const entries = fs.readdirSync(prevSectionPath, { withFileTypes: true });
                for (const entry of entries) {
                  if (entry.name !== 'walkthrough' && entry.name !== 'README.md') {
                    const srcPath = path.join(prevSectionPath, entry.name);
                    const destPath = path.join(sectionPath, entry.name);
                    if (entry.isDirectory()) {
                      copyDirectory(srcPath, destPath);
                    } else {
                      fs.copyFileSync(srcPath, destPath);
                    }
                  }
                }
              }

              // Process steps for the current section
              if (section.steps) {
                for (const step of section.steps) {
                  // Handle dir creation step
                  if (step.dir?.create) {
                    const dirToCreate = path.join(sectionPath, step.dir.path);
                    fs.mkdirSync(dirToCreate, { recursive: true });
                  }
                  // Handle file copy step
                  if (step.file?.src) {
                    copySourceFiles(step.file.src, projectRoot, sectionPath);
                    copyWorkingFile(step.file.src, step.file.dest, sectionPath);
                  }
                }
              }

              // Generate and write section README
              const sectionMarkdown = generateSectionMarkdown(section);
              fs.writeFileSync(path.join(sectionPath, 'README.md'), sectionMarkdown);
            });
          }
        }
      }
    }
    
    let markdown = `# ${data.title}\n\n${data.text}\n\n`;
    
    if (data.sections) {
      for (const section of data.sections) {
        markdown += `## ${section.title}\n\n`;
        if (section.text) {
          markdown += `${section.text}\n\n`;
        }
        if (section.steps) {
          for (const step of section.steps) {
            if (step.text) { // Only add step.text if it exists
              markdown += `${step.text}\n\n`;
            }
            if (step.file) {
              const srcAbsolutePath = path.resolve(projectRoot, step.file.src);
              const destRelativePath = path.normalize(step.file.dest);

              let newContent: string;
              try {
                newContent = fs.readFileSync(srcAbsolutePath, 'utf8');
              } catch (error: any) {
                console.warn(`Warning: Could not read source file ${srcAbsolutePath} for step: ${step.text || 'Unnamed step'}`);
                continue;
              }

              const isExistingVirtualFile = virtualFileState.has(destRelativePath);
              const oldContent = isExistingVirtualFile ? virtualFileState.get(destRelativePath)! : '';

              if (isExistingVirtualFile) {
                // File is being changed/overwritten
                const shouldDiff = data.targets?.[0]?.onChange?.diff === true;
                let diffPrintedThisStep = false;

                if (shouldDiff && oldContent !== newContent) {
                  const patch = Diff.createPatch(destRelativePath, oldContent, newContent, '', '', { context: 2 });
                  
                  // Process the patch to show only filename and changed lines
                  const patchLines = patch.split('\n');
                  const minimalDiffOutput = [destRelativePath]; // Start with filename
                  for (const line of patchLines) {
                    if ((line.startsWith('+') && !line.startsWith('+++')) || 
                        (line.startsWith('-') && !line.startsWith('---'))) {
                      minimalDiffOutput.push(line);
                    }
                  }
                  // Only add diff block if there are actual changes
                  if (minimalDiffOutput.length > 1) { // more than just the filename
                    markdown += `\`\`\`diff\n${minimalDiffOutput.join('\n')}\n\`\`\`\n\n`;
                    diffPrintedThisStep = true;
                  }
                }
                const showCp = data.targets?.[0]?.onChange?.cp !== false;
                if (showCp) {
                  const cpCommand = `cp ${step.file.src} ${step.file.dest}`;
                  if (diffPrintedThisStep) {
                    markdown += `<details>\n<summary>skip this step</summary>\n\n`;
                    markdown += `    ${cpCommand}\n\n`;
                    markdown += `</details>\n\n`;
                  } else {
                    markdown += `    ${cpCommand}\n\n`;
                    
                    // Add "show file" details block
                    let lang = path.extname(step.file.src).substring(1);
                    if (lang === 'baml') {
                      lang = 'rust';
                    }
                    markdown += `<details>\n<summary>show file</summary>\n\n`;
                    markdown += `\`\`\`${lang}\n`;
                    markdown += `// ${step.file.src}\n`;
                    markdown += `${newContent.trim()}\n`;
                    markdown += `\`\`\`\n\n`;
                    markdown += `</details>\n\n`;
                  }
                }
              } else {
                // New file
                const showCpForNew = data.targets?.[0]?.newFiles?.cp !== false;
                if (showCpForNew) {
                  const cpCommand = `cp ${step.file.src} ${step.file.dest}`;
                  markdown += `    ${cpCommand}\n\n`;

                  // Add "show file" details block
                  let lang = path.extname(step.file.src).substring(1);
                  if (lang === 'baml') {
                    lang = 'rust';
                  }
                  markdown += `<details>\n<summary>show file</summary>\n\n`;
                  markdown += `\`\`\`${lang}\n`;
                  markdown += `// ${step.file.src}\n`;
                  markdown += `${newContent.trim()}\n`;
                  markdown += `\`\`\`\n\n`;
                  markdown += `</details>\n\n`;
                }
              }

              virtualFileState.set(destRelativePath, newContent);
            }
            if (step.command) {
              let commandLine = `    ${step.command.trim()}`;
              markdown += commandLine;
              markdown += "\n\n";
            }
            if (step.results) {
              for (const result of step.results) {
                markdown += `${result.text}\n\n`;
                if (result.code) {
                  let codeLine = `    ${result.code.trim()}`;
                  markdown += codeLine;
                  markdown += "\n\n";
                }
              }
            }
          }
        }
      }
    }

    const outputPath = data.targets?.[0]?.markdown 
      ? path.join(path.dirname(yamlPath), data.targets[0].markdown)
      : path.join(path.dirname(yamlPath), 'walkthrough.md');
    
    try {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, markdown);
      console.log(`Successfully generated walkthrough to ${outputPath}`);
    } catch (error: any) {
      console.error(`Error: Could not write markdown file to '${outputPath}'.`);
      console.error(error.message);
      return;
    }
    return;
  }

  console.log("Unknown command. Available commands: generate. Use --help for more info.");
};
