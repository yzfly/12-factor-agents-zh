import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

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
    const data = yaml.load(yamlContent) as { title: string; text: string };
    
    const markdown = `# ${data.title}\n\n${data.text}`;
    const outputPath = path.join(path.dirname(yamlPath), 'walkthrough.md');
    fs.writeFileSync(outputPath, markdown);
    return;
  }

  console.log(argv);
};
