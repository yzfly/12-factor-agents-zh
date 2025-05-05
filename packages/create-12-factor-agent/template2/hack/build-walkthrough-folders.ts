import * as fs from 'fs'
import path from 'path'
import chalk from 'chalk'


const fileGroupings: Record<string, string> = {
    '00': '00-hello-world',
    '01': '01-tool-calling-agent',
    '02': '01-tool-calling-agent',
    '03': '01-tool-calling-agent',
    '04': '01-tool-calling-agent',
    '05': '01-tool-calling-agent',
    '06': '02-advanced-prompting',
    '07': '02-advanced-prompting',
    '08': '03-apis-and-humans',
    '09': '03-apis-and-humans',
    '10': '03-apis-and-humans',
    '11': '03-apis-and-humans',
    '12': '03-apis-and-humans',
    '13': '03-apis-and-humans',
    // afternoon


}

const main = async () => {
    console.log(chalk.blue('\nBuilding walkthrough folders...\n'))
    
    const files = fs.readdirSync(path.join(__dirname, '..', 'walkthrough'))
    console.log(chalk.green('✓') + ' Found ' + chalk.cyan(files.length) + ' walkthrough files')
    
    const walkthroughFoldersPath = path.join(__dirname, '..', 'walkthrough-folders')
    if (fs.existsSync(walkthroughFoldersPath)) {
        fs.rmSync(walkthroughFoldersPath, { recursive: true, force: true })
        console.log(chalk.yellow('✗') + ' Removed existing walkthrough folders')
    }
    fs.mkdirSync(walkthroughFoldersPath, { recursive: true })
    console.log(chalk.green('✓') + ' Created walkthrough folders directory')

    const groups: Record<string, string[]> = {}
    files.forEach(file => {
        const key = file.split('-')[0]
        groups[key] = groups[key] || []
        groups[key].push(file)
    })

    const sorted = Object.entries(groups).toSorted((a, b) => a[0].localeCompare(b[0]))
    console.log(chalk.blue('\nProcessing files by chapter...\n'))

    let lastFolder = '';
    for (const [key, files] of sorted) {
        if (!fileGroupings[key]) {
            console.log(chalk.yellow('⚠') + ' Skipping files ' + chalk.cyan(files.join(', ')) + ' - no folder mapping found for key ' + chalk.cyan(key))
            continue
        }
        
        const folder = path.join(__dirname, '..', 'walkthrough-folders', fileGroupings[key])
        if (lastFolder && lastFolder !== fileGroupings[key]) {
            // copy the last folder into the new folder path
            fs.cpSync(
                path.join(__dirname, '..', 'walkthrough-folders', lastFolder),
                folder,
                { recursive: true }
            )
            console.log(chalk.green('✓') + ' Copied folder ' + chalk.cyan(lastFolder) + ' to ' + chalk.cyan(fileGroupings[key]))
        } else if (!fs.existsSync(folder)) {
            console.log(chalk.blue('Creating folder ' + folder))
            fs.mkdirSync(folder, { recursive: true })
            console.log(chalk.blue('Creating folder ' + path.join(folder, 'src')))
            fs.mkdirSync(path.join(folder, 'src'), { recursive: true })
            console.log(chalk.blue('Creating folder ' + path.join(folder, 'baml_src')))
            fs.mkdirSync(path.join(folder, 'baml_src'), { recursive: true })
        }

        console.log(chalk.blue('Processing chapter ' + chalk.cyan(files.join(', ')) + ' -> ' + chalk.cyan(fileGroupings[key])))
        files.forEach(file => {
            const targetFileName = file.replace(/^[0-9]{2}-/, '')
            let targetPath: string
            
            if (file.endsWith('.baml')) {
                targetPath = path.join('baml_src', targetFileName)
            } else if (file.endsWith('.ts')) {
                targetPath = path.join('src', targetFileName)
            } else {
                targetPath = path.join(targetFileName)
            }
            
            // copy it into place
            fs.copyFileSync(path.join(__dirname, '..', 'walkthrough', file), path.join(folder, targetPath))
            console.log(chalk.green('✓') + ' Copied ' + chalk.cyan(file) + ' to ' + chalk.cyan(path.join(fileGroupings[key], targetPath)))
        })
        lastFolder = fileGroupings[key]
    }
    
    console.log(chalk.green('\n✓') + ' Successfully built all walkthrough folders!')
}

main().catch(error => {
    console.error(chalk.red('\n✗') + ' Error building walkthrough folders:', error.message)
    process.exit(1)
})