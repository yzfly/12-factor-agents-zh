import { b } from "../baml_client";

// tool call or a respond to human tool
type AgentResponse = Awaited<ReturnType<typeof b.DetermineNextStep>>;

export interface Event {
    type: string
    data: any;
}

export class Thread {
    events: Event[] = [];

    constructor(events: Event[]) {
        this.events = events;
    }

    serializeForLLM() {
        // can change this to whatever custom serialization you want to do, XML, etc
        // e.g. https://github.com/got-agents/agents/blob/59ebbfa236fc376618f16ee08eb0f3bf7b698892/linear-assistant-ts/src/agent.ts#L66-L105
        return JSON.stringify(this.events);
    }
}



export async function agentLoop(thread: Thread): Promise<string> {

    while (true) {
        const nextStep = await b.DetermineNextStep(thread.serializeForLLM());
        console.log("nextStep", nextStep);

        switch (nextStep.intent) {
            case "done_for_now":
                // response to human, return the next step object
                return nextStep.message;
            case "add":
                thread.events.push({
                    "type": "tool_call",
                    "data": nextStep
                });
                const result = nextStep.a + nextStep.b;
                console.log("tool_response", result);
                thread.events.push({
                    "type": "tool_response",
                    "data": result
                });
                continue;
            default:
                throw new Error(`Unknown intent: ${nextStep.intent}`);
        }
    }
}


