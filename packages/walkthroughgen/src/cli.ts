import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface Section {
  title: string;
  text?: string;
  steps?: Array<{
    text: string;
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
  }>;
}

export const cli = (argv: string[]) => {
  if (argv.includes("--help")) {
    console.log(`
USAGE:
    walkthroughgen [options]

OPTIONS:
    --help, -h    Show help
    generate <yaml-file>    Generate markdown from YAML file
        `);
    return;
  }

  if (argv[0] === "generate" && argv[1]) {
    const yamlPath = argv[1];
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const data = yaml.load(yamlContent) as WalkthroughData;
    
    let markdown = `# ${data.title}\n\n${data.text}\n\n`;
    
    if (data.sections) {
      for (const section of data.sections) {
        markdown += `## ${section.title}\n\n`;
        if (section.text) {
          markdown += `${section.text}\n\n`;
        }
        if (section.steps) {
          for (const step of section.steps) {
            markdown += `${step.text}\n\n`;
            if (step.file) {
              markdown += `    cp ${step.file.src} ${step.file.dest}\n\n`;
            }
            if (step.command) {
              markdown += `    ${step.command}\n\n`;
            }
            if (step.results) {
              for (const result of step.results) {
                markdown += `${result.text}\n\n    ${result.code}\n\n`;
              }
            }
          }
        }
      }
    }

    const outputPath = data.targets?.[0]?.markdown 
      ? path.join(path.dirname(yamlPath), data.targets[0].markdown)
      : path.join(path.dirname(yamlPath), 'walkthrough.md');
    
    fs.writeFileSync(outputPath, markdown);
    return;
  }

  console.log(argv);
};
