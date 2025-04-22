import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

// Extract file operations from a chapter in walkthrough.md
function extractFileOperations(markdown: string, upToChapter: number): { source: string; dest: string }[] {
    const operations: { source: string; dest: string }[] = [];
    const chapterRegex = /^#{2,4}\s+(?:chapter\s+)?(\d+|cleanup)\s*-\s*(.+?)$/gim;
    const cpCommandRegex = /^cp\s+(\S+)\s+(\S+)\s*$/gm;
    
    let lastIndex = 0;
    let matches = [...markdown.matchAll(chapterRegex)];
    
    // Process each chapter
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const nextMatch = matches[i + 1];
        
        const chapterNum = match[1].toLowerCase() === 'cleanup' ? 0 : parseInt(match[1]);
        
        // Skip if this chapter is beyond our target
        if (chapterNum > upToChapter) {
            break;
        }
        
        // Get content up to the next chapter or end of file
        const startIndex = match.index! + match[0].length;
        const endIndex = nextMatch ? nextMatch.index : markdown.length;
        const chapterContent = markdown.slice(startIndex, endIndex);
        
        // Extract cp commands from this chapter
        let cpMatch;
        while ((cpMatch = cpCommandRegex.exec(chapterContent)) !== null) {
            operations.push({
                source: cpMatch[1],
                dest: cpMatch[2]
            });
        }
    }
    
    return operations;
}

// Delete a directory and all its contents
function deleteDirRecursive(dirPath: string): void {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`${chalk.yellow('✗')} Removed ${chalk.cyan(dirPath)}`);
    }
}

// Copy a file, creating directories if needed
function copyFile(source: string, dest: string): void {
    try {
        // Ensure the destination directory exists
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Copy the file
        if (fs.existsSync(source)) {
            fs.copyFileSync(source, dest);
            console.log(`${chalk.green('✓')} Copied ${chalk.cyan(source)} to ${chalk.cyan(dest)}`);
        } else {
            console.log(`${chalk.yellow('!')} Source file not found: ${chalk.cyan(source)}`);
        }
    } catch (error: any) {
        console.error(`${chalk.red('✗')} Error copying ${source} to ${dest}: ${error.message}`);
    }
}

async function main() {
    // Get chapter number from command line
    const chapterArg = process.argv[2];
    if (!chapterArg || !/^\d+$/.test(chapterArg)) {
        console.error('Please provide a chapter number as an argument');
        process.exit(1);
    }
    
    const targetChapter = parseInt(chapterArg);
    
    // Read the walkthrough.md file
    try {
        const markdown = fs.readFileSync('walkthrough.md', 'utf-8');
        const operations = extractFileOperations(markdown, targetChapter);
        
        console.log(`\nRestoring files up to chapter ${targetChapter}:`);
        
        // Clean up target directories first
        console.log('\nCleaning up target directories:');
        deleteDirRecursive('src');
        deleteDirRecursive('baml_src');
        
        // Create necessary directories
        fs.mkdirSync('src', { recursive: true });
        fs.mkdirSync('baml_src', { recursive: true });
        
        // Execute all file operations
        console.log('\nCopying files:');
        for (const op of operations) {
            copyFile(op.source, op.dest);
        }
        
        console.log(`\n${chalk.green('✓')} Completed restoring files up to chapter ${targetChapter}`);
    } catch (error: any) {
        console.error(`\n${chalk.red('✗')} Error reading walkthrough.md: ${error.message}`);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('\nScript error:', error.message);
    process.exit(1);
});