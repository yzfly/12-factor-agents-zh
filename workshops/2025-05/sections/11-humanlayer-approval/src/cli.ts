// cli.ts lets you invoke the agent loop from the command line

import { agentLoop, Thread, Event } from "../src/agent";



export async function cli() {
    // Get command line arguments, skipping the first two (node and script name)
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error("Error: Please provide a message as a command line argument");
        process.exit(1);
    }

    // Join all arguments into a single message
    const message = args.join(" ");

    // Create a new thread with the user's message as the initial event
    const thread = new Thread([{ type: "user_input", data: message }]);

    // Run the agent loop with the thread
    const result = await agentLoop(thread);
    let lastEvent = result.events.slice(-1)[0];

    while (lastEvent.data.intent === "request_more_information") {
        const message = await askHuman(lastEvent.data.message);
        thread.events.push({ type: "human_response", data: message });
        const result = await agentLoop(thread);
        lastEvent = result.events.slice(-1)[0];
    }

    // print the final result
    // optional - you could loop here too
    console.log(lastEvent.data.message);
    process.exit(0);
}

async function askHuman(message: string) {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        readline.question(`${message}\n> `, (answer: string) => {
            resolve(answer);
        });
    });
}
