// cli.ts lets you invoke the agent loop from the command line

import { humanlayer } from "humanlayer";
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
    let newThread = await agentLoop(thread);
    let lastEvent = newThread.events.slice(-1)[0];

    while (lastEvent.data.intent !== "done_for_now") {
        const responseEvent = await askHuman(lastEvent);
        thread.events.push(responseEvent);
        newThread = await agentLoop(thread);
        lastEvent = newThread.events.slice(-1)[0];
    }

    // print the final result
    // optional - you could loop here too 
    console.log(lastEvent.data.message);
    process.exit(0);
}

async function askHuman(lastEvent: Event): Promise<Event> {
    if (process.env.HUMANLAYER_API_KEY) {
        return await askHumanEmail(lastEvent);
    } else {
        return await askHumanCLI(lastEvent.data.message);
    }
}

async function askHumanCLI(message: string): Promise<Event> {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        readline.question(`${message}\n> `, (answer: string) => {
            resolve({ type: "human_response", data: answer });
        });
    });
}

export async function askHumanEmail(lastEvent: Event): Promise<Event> {
    if (!process.env.HUMANLAYER_EMAIL) {
        throw new Error("missing or invalid parameters: HUMANLAYER_EMAIL");
    }
    const hl = humanlayer({ //reads apiKey from env
        // name of this agent
        runId: "12fa-cli-agent",
        verbose: true,
        contactChannel: {
            // agent should request permission via email
            email: {
                address: process.env.HUMANLAYER_EMAIL,
            }
        }
    }) 

    if (lastEvent.data.intent === "request_more_information") {
        // fetch response synchronously - this will block until reply
        const response = await hl.fetchHumanResponse({
            spec: {
                msg: lastEvent.data.message
            }
        })
        return {
            "type": "tool_response",
            "data": response
        }
    }
    
    if (lastEvent.data.intent === "divide") {
        // fetch approval synchronously - this will block until reply
        const response = await hl.fetchHumanApproval({
            spec: {
                fn: "divide",
                kwargs: {
                    a: lastEvent.data.a,
                    b: lastEvent.data.b
                }
            }
        })

        if (response.approved) {
            const result = lastEvent.data.a / lastEvent.data.b;
            console.log("tool_response", result);
            return {
                "type": "tool_response",
                "data": result
            };
        } else {
            return {
                "type": "tool_response",
                "data": `user denied operation ${lastEvent.data.intent}
                with feedback: ${response.comment}`
            };
        }
    }
    throw new Error(`unknown tool: ${lastEvent.data.intent}`)
}