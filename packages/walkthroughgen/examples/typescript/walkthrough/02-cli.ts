const cli = () => {
    const args = process.argv.slice(2);
    const command = args[0];
    const name = args[1];
    if (command === "create") {
        console.log(`Creating ${name}`);
    } else {
        console.log("Invalid command: ", command);
        console.log("available commands: create");
    }
};

cli();

