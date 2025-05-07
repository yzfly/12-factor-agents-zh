import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as Diff from 'diff';

interface Section {
  title: string;
  text?: string;
  steps?: Array<{
    text?: string; // Make text optional
    file?: { src: string; dest: string };
    command?: string;
    results?: Array<{ text: string; code: string }>;
  }>;
}

interface WalkthroughData {
  title: string;
  text: string;
  sections?: Section[];
  targets?: Array<{
    markdown?: string;
    onChange?: { diff?: boolean; cp?: boolean };
    newFiles?: { cat?: boolean; cp?: boolean };
  }>;
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
                if (shouldDiff && oldContent !== newContent) {
                  const patch = Diff.createPatch(destRelativePath, oldContent, newContent, '', '', { context: 2 });
                  markdown += `\`\`\`diff\n${patch}\n\`\`\`\n\n`;
                }
                const showCp = data.targets?.[0]?.onChange?.cp !== false;
                if (showCp) {
                  markdown += `    cp ${step.file.src} ${step.file.dest}\n\n`;
                }
              } else {
                // New file
                const showCpForNew = data.targets?.[0]?.newFiles?.cp !== false;
                if (showCpForNew) {
                  markdown += `    cp ${step.file.src} ${step.file.dest}\n\n`;
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
