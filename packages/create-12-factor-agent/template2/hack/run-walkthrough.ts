import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import chalk from 'chalk';

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Track Ctrl+C presses
let lastCtrlC = 0;
const DOUBLE_CTRL_C_TIMEOUT = 1000; // 1 second timeout for double Ctrl+C

// Handle Ctrl+C (SIGINT) at process level
process.on('SIGINT', () => {
    const now = Date.now();
    if (now - lastCtrlC < DOUBLE_CTRL_C_TIMEOUT) {
        console.log('\nReceived double Ctrl+C, killing all processes...');
        process.exit(1);
    }
    lastCtrlC = now;
    console.log('\nPress Ctrl+C again within 1 second to force quit');
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
        
        // Create a temporary directory for both files
        const tempDir = fs.mkdtempSync('/tmp/walkthrough-');
        const tempOldPath = path.join(tempDir, 'old-' + path.basename(destPath));
        const tempNewPath = path.join(tempDir, 'new-' + path.basename(destPath));
        
        // If destination exists, use its content as baseline, otherwise empty file
        if (fs.existsSync(destPath)) {
            const currentContent = fs.readFileSync(destPath, 'utf8');
            fs.writeFileSync(tempOldPath, currentContent);
        } else {
            fs.writeFileSync(tempOldPath, '');
        }
        
        // Copy source content to temp new file
        const newContent = fs.readFileSync(sourcePath, 'utf8');
        fs.writeFileSync(tempNewPath, newContent);
        
        // Use --no-index to compare files directly
        const diff = execSync(`git --no-pager diff --no-index --color ${tempOldPath} ${tempNewPath}`, { 
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        // Clean up temp directory
        fs.rmSync(tempDir, { recursive: true, force: true });
        
        if (diff) {
            console.log('\n>> File diff:');
            console.log(diff);
            console.log(chalk.dim('─'.repeat(process.stdout.columns || 80))); // Add separator line
        }
    } catch (error: any) {
        // git diff --no-index returns exit code 1 if files are different
        if (error.status === 1 && error.stdout) {
            console.log('\n>> File diff:');
            console.log(error.stdout);
            console.log(chalk.dim('─'.repeat(process.stdout.columns || 80))); // Add separator line
        } else {
            console.error('\nError showing diff:', error.message);
        }
    }
}

async function runCommand(command: string, interactive: boolean, showDiffs: boolean) {
    // Skip the specific problematic command
    if (command === `npx tsx src/index.ts 'can you multiply 3 and FD*(#F&x& ?'`) {
        console.log(`\n    ${chalk.yellow('Skipping known problematic command')}`);
        return;
    }

    console.log(`\n    ${chalk.green(command)}`);
    
    // In interactive mode, prompt before each command
    if (interactive) {
        await new Promise<void>((resolve) => {
            rl.question('\n[ENTER]', async () => {
                try {
                    // For cp commands, show diff before executing
                    if (showDiffs && command.startsWith('cp ')) {
                        showDiff(command);
                    }
                    
                    // Use spawn for better signal handling
                    if (command.startsWith('npx ') || command.startsWith('npm ')) {
                        const parts = command.split(' ');
                        const proc = spawn(parts[0], parts.slice(1), {
                            stdio: 'inherit',
                            shell: true
                        });

                        // Forward SIGINT to child process, but track double Ctrl+C
                        const sigintHandler = () => {
                            const now = Date.now();
                            if (now - lastCtrlC < DOUBLE_CTRL_C_TIMEOUT) {
                                console.log('\nReceived double Ctrl+C, killing process...');
                                proc.kill('SIGKILL'); // Force kill
                                process.exit(1);
                            } else {
                                proc.kill('SIGINT'); // Normal interrupt
                            }
                            lastCtrlC = now;
                        };

                        process.on('SIGINT', sigintHandler);

                        await new Promise((resolve, reject) => {
                            proc.on('exit', (code) => {
                                // Clean up SIGINT handler
                                process.removeListener('SIGINT', sigintHandler);
                                
                                if (code === 0 || code === null) {
                                    resolve(undefined);
                                } else {
                                    reject(new Error(`Command failed with code ${code}`));
                                }
                            });
                            proc.on('error', (err) => {
                                // Clean up SIGINT handler
                                process.removeListener('SIGINT', sigintHandler);
                                reject(err);
                            });
                        });
                    } else {
                        // Use execSync for other commands
                        execSync(command, { stdio: 'inherit' });
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
            // For cp commands, show diff before executing
            if (showDiffs && command.startsWith('cp ')) {
                showDiff(command);
            }
            
            // Use spawn for better signal handling
            if (command.startsWith('npx ') || command.startsWith('npm ')) {
                const parts = command.split(' ');
                const proc = spawn(parts[0], parts.slice(1), {
                    stdio: 'inherit',
                    shell: true
                });

                // Forward SIGINT to child process, but track double Ctrl+C
                const sigintHandler = () => {
                    const now = Date.now();
                    if (now - lastCtrlC < DOUBLE_CTRL_C_TIMEOUT) {
                        console.log('\nReceived double Ctrl+C, killing process...');
                        proc.kill('SIGKILL'); // Force kill
                        process.exit(1);
                    } else {
                        proc.kill('SIGINT'); // Normal interrupt
                    }
                    lastCtrlC = now;
                };

                process.on('SIGINT', sigintHandler);

                await new Promise((resolve, reject) => {
                    proc.on('exit', (code) => {
                        // Clean up SIGINT handler
                        process.removeListener('SIGINT', sigintHandler);
                        
                        if (code === 0 || code === null) {
                            resolve(undefined);
                        } else {
                            reject(new Error(`Command failed with code ${code}`));
                        }
                    });
                    proc.on('error', (err) => {
                        // Clean up SIGINT handler
                        process.removeListener('SIGINT', sigintHandler);
                        reject(err);
                    });
                });
            } else {
                // Use execSync for other commands
                execSync(command, { stdio: 'inherit' });
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