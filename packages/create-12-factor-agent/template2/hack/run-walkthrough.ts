import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import chalk from 'chalk';

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Promise-based wrapper for readline question
function askToContinue(message: string): Promise<void> {
    return new Promise((resolve) => {
        rl.question(message, () => {
            resolve();
        });
    });
}

function showDiff(command: string) {
    try {
        const [_, sourcePath, destPath] = command.split(' ');
        
        // Create a temporary directory for baseline file
        const tempDir = fs.mkdtempSync('/tmp/walkthrough-');
        const tempPath = path.join(tempDir, path.basename(destPath));
        
        if (fs.existsSync(destPath)) {
            fs.writeFileSync(tempPath, ''); // Empty file as baseline
        }
        
        // Use --no-index to compare files directly
        const diff = execSync(`git --no-pager diff --no-index --color ${tempPath} ${destPath}`, { 
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        // Clean up temp directory
        fs.rmSync(tempDir, { recursive: true, force: true });
        
        if (diff) {
            console.log('\n>> File diff after copy:');
            console.log(diff);
        }
    } catch (error: any) {
        // git diff --no-index returns exit code 1 if files are different
        if (error.status === 1 && error.stdout) {
            console.log('\n>> File diff after copy:');
            console.log(error.stdout);
        } else {
            console.error('\nError showing diff:', error.message);
        }
    }
}

async function runCommand(command: string, interactive: boolean, showDiffs: boolean) {
    console.log(`\n    ${chalk.green(command)}`);
    
    // In interactive mode, prompt before each command
    if (interactive) {
        await new Promise<void>((resolve) => {
            rl.question('\n[ENTER]', async () => {
                try {
                    execSync(command, { stdio: 'inherit' });
                    // Show diff after copy commands if -d flag is set
                    if (showDiffs && command.startsWith('cp ')) {
                        showDiff(command);
                    }
                    resolve();
                } catch (error: any) {
                    console.error(`\nError running command: ${chalk.red(command)}`);
                    if (error.stdout) console.error('\nCommand output:', error.stdout.toString());
                    if (error.stderr) console.error('\nError output:', error.stderr.toString());
                    process.exit(1);
                }
            });
        });
    } else {
        // Non-interactive mode
        try {
            execSync(command, { stdio: 'inherit' });
            // Show diff after copy commands if -d flag is set
            if (showDiffs && command.startsWith('cp ')) {
                showDiff(command);
            }
        } catch (error: any) {
            console.error(`\nError running command: ${chalk.red(command)}`);
            if (error.stdout) console.error('\nCommand output:', error.stdout.toString());
            if (error.stderr) console.error('\nError output:', error.stderr.toString());
            process.exit(1);
        }
    }
}

function extractCommands(markdown: string): { chapter: string; commands: string[] }[] {
    const chapters: { chapter: string; commands: string[] }[] = [];
    const chapterRegex = /^#{2,4}\s+(.+?)$/gm;
    const codeBlockRegex = /```(?:bash)?\n([\s\S]*?)```/g;
    
    let lastIndex = 0;
    let currentChapter = '';
    
    // Find all chapters
    let chapterMatch;
    while ((chapterMatch = chapterRegex.exec(markdown)) !== null) {
        const chapterTitle = chapterMatch[1];
        const startIndex = chapterMatch.index;
        
        // If we have a previous chapter, process it
        if (currentChapter) {
            const chapterContent = markdown.slice(lastIndex, startIndex);
            const commands: string[] = [];
            
            // Find all code blocks in this chapter
            let codeMatch;
            while ((codeMatch = codeBlockRegex.exec(chapterContent)) !== null) {
                const commandBlock = codeMatch[1].trim();
                // Split into individual commands and filter out empty lines and comments
                const blockCommands = commandBlock
                    .split('\n')
                    .map(cmd => cmd.trim())
                    .filter(cmd => cmd && !cmd.startsWith('#'));
                commands.push(...blockCommands);
            }
            
            if (commands.length > 0) {
                chapters.push({ chapter: currentChapter, commands });
            }
        }
        
        currentChapter = chapterTitle;
        lastIndex = startIndex;
    }
    
    // Process the last chapter
    if (currentChapter) {
        const chapterContent = markdown.slice(lastIndex);
        const commands: string[] = [];
        
        let codeMatch;
        while ((codeMatch = codeBlockRegex.exec(chapterContent)) !== null) {
            const commandBlock = codeMatch[1].trim();
            const blockCommands = commandBlock
                .split('\n')
                .map(cmd => cmd.trim())
                .filter(cmd => cmd && !cmd.startsWith('#'));
            commands.push(...blockCommands);
        }
        
        if (commands.length > 0) {
            chapters.push({ chapter: currentChapter, commands });
        }
    }
    
    return chapters;
}

async function main() {
    // Check for flags
    const interactive = process.argv.includes('-i');
    const showDiffs = process.argv.includes('-d');
    
    // Read the walkthrough.md file
    const markdown = fs.readFileSync('walkthrough.md', 'utf-8');
    const chapters = extractCommands(markdown);
    
    // Execute commands chapter by chapter
    for (const chapter of chapters) {
        console.log(`\n=== ${chalk.cyan(chapter.chapter)} ===`);
        
        for (const command of chapter.commands) {
            // Handle environment variable settings
            if (command.startsWith('export ')) {
                const [_, key, value] = command.match(/export\s+(\w+)=(.*)/) || [];
                if (key && value) {
                    process.env[key] = value;
                    console.log(`\n>> Set environment variable ${chalk.yellow(`${key}=${value}`)}`);
                }
                continue;
            }
            
            // Execute the command
            await runCommand(command, interactive, showDiffs);
        }
        
        console.log(`\n${chalk.green('✓')} Completed chapter: ${chalk.cyan(chapter.chapter)}`);
    }
    
    // Close readline interface
    rl.close();
}

main().catch((error) => {
    console.error('\nScript error:', error.message);
    process.exit(1);
});