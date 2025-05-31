// cli.ts lets you invoke the agent loop from the command line

import { humanlayer } from "humanlayer";
import { agentLoop, Thread, Event, handleNextStep } from "../src/agent";
import chalk from "chalk";

export async function cliOuterLoop(message: string) {
    // Create a new thread with the user's message as the initial event
    const thread = new Thread([{ type: "user_input", data: message }]);

    // Run the agent loop with the thread
    let newThread = await agentLoop(thread);
    let lastEvent = newThread.events.slice(-1)[0];

    // loop until ctrl+c
    // optional, you could exit on done_for_now and print the final result
    // while (lastEvent.data.intent !== "done_for_now") {
    while (true) {
        const responseEvent = await askHuman(lastEvent);
        thread.events.push(responseEvent);
        newThread = await agentLoop(thread);
        lastEvent = newThread.events.slice(-1)[0];
    }
}

export async function cli() {
    // Get command line arguments, skipping the first two (node and script name)
    const args = process.argv.slice(2);

    const message = args.length === 0 ? "hello!" : args.join(" ");

    await cliOuterLoop(message);
}

async function askHuman(lastEvent: Event): Promise<Event> {
    if (process.env.HUMANLAYER_API_KEY && process.env.HUMANLAYER_EMAIL) {
        return await askHumanEmail(lastEvent);
    } else {
        switch (lastEvent.data.intent) {
            case "divide":
                const result = await askHumanCLI(`agent wants to run ${chalk.green(JSON.stringify(lastEvent.data))}\nPress Enter to approve, or type feedback to cancel:`);
                if (result.data.approved) {
                    const thread = new Thread([lastEvent]);
                    const result = await handleNextStep(lastEvent.data, thread);
                    return result.events[result.events.length - 1];
                } else {
                    return {
                        type: "tool_response",
                        data: `user denied operation ${lastEvent.data.intent} with feedback: ${result.data.comment}`
                    };
                }
            case "request_more_information":
            case "done_for_now":
                return await askHumanCLI(lastEvent.data.message);
            default:
                throw new Error(`unknown tool in outer loop: ${lastEvent.data.intent}`)
        }
    }
}

async function askHumanCLI(message: string): Promise<Event> {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        readline.question(`${message}\n> `, (answer: string) => {
            readline.close();
            // If the answer is empty (just pressed enter), treat it as approval
            if (answer.trim() === '') {
                resolve({ type: "human_response", data: { approved: true } });
            } else {
                // Any non-empty response is treated as rejection with feedback
                resolve({ type: "human_response", data: { approved: false, comment: answer } });
            }
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
                // custom email body - jinja
                template: `{% if type == 'request_more_information' %}
{{ event.spec.msg }}
{% else %}
agent {{ event.run_id }} is requesting approval for {{event.spec.fn}}
with args: {{event.spec.kwargs}}
<br><br>
reply to this email to approve
{% endif %}`
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