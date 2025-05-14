import { cli } from "./cli"

async function hello(): Promise<void> {
    console.log('hello, world!')
}

async function main() {
    await cli()
}

main().catch(console.error)