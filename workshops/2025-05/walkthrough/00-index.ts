async function hello(): Promise<void> {
    console.log('hello, world!')
}

async function main() {
    await hello()
}

main().catch(console.error)