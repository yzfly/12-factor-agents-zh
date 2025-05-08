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

// right now this just runs one turn with the LLM, but
// we'll update this function to handle all the agent logic
export async function agentLoop(thread: Thread): Promise<AgentResponse> {
    const nextStep = await b.DetermineNextStep(thread.serializeForLLM());
    return nextStep;
}


