import express from 'express';
import { Thread, agentLoop, handleNextStep } from '../src/agent';
import { ThreadStore } from '../src/state';
import { V1Beta2EmailEventReceived, V1Beta2FunctionCallCompleted, V1Beta2HumanContactCompleted } from 'humanlayer';

const app = express();
app.use(express.json());
app.set('json spaces', 2);

const store = new ThreadStore();

// POST /thread - Start new thread
app.post('/thread', async (req, res) => {
    const thread = new Thread([{
        type: "user_input",
        data: req.body.message
    }]);
    
    const threadId = store.create(thread);
    const newThread = await agentLoop(thread);
    
    store.update(threadId, newThread);

    const lastEvent = newThread.events[newThread.events.length - 1];
    // If we exited the loop, include the response URL so the client can
    // push a new message onto the thread
    lastEvent.data.response_url = `/thread/${threadId}/response`;

    console.log("returning last event from endpoint", lastEvent);

    res.json({ 
        thread_id: threadId,
        ...newThread 
    });
});

// GET /thread/:id - Get thread status
app.get('/thread/:id', (req, res) => {
    const thread = store.get(req.params.id);
    if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
    }
    res.json(thread);
});


type ApprovalPayload = {
    type: "approval";
    approved: boolean;
    comment?: string;
}

type ResponsePayload = {
    type: "response";
    response: string;
}

type Payload = ApprovalPayload | ResponsePayload;

// POST /thread/:id/response - Handle clarification response
app.post('/thread/:id/response', async (req, res) => {
    let thread = store.get(req.params.id);
    if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
    }

    const body: Payload = req.body;

    let lastEvent = thread.events[thread.events.length - 1];

    if (thread.awaitingHumanResponse() && body.type === 'response') {
        thread.events.push({
            type: "human_response",
            data: body.response
        });
    } else if (thread.awaitingHumanApproval() && body.type === 'approval' && !body.approved) {
        // push feedback onto the thread
        thread.events.push({
            type: "tool_response",
            data: `user denied the operation with feedback: "${body.comment}"`
        });
    } else if (thread.awaitingHumanApproval() && body.type === 'approval' && body.approved) {
        // approved, run the tool, pushing results onto the thread
        await handleNextStep(lastEvent.data, thread);
    } else {
        res.status(400).json({
            error: "Invalid request: " + body.type,
            awaitingHumanResponse: thread.awaitingHumanResponse(),
            awaitingHumanApproval: thread.awaitingHumanApproval()
        });
        return;
    }

    
    // loop until stop event
    const result = await agentLoop(thread);

    store.update(req.params.id, result);

    lastEvent = result.events[result.events.length - 1];
    lastEvent.data.response_url = `/thread/${req.params.id}/response`;

    console.log("returning last event from endpoint", lastEvent);
    
    res.json(result);
});

type WebhookResponse = V1Beta2HumanContactCompleted;

app.post('/webhook/response', async (req, res) => {
    console.log("webhook response", req.body);
    const response = req.body as WebhookResponse;

    // response is guaranteed to be set on a webhook
    const humanResponse: string = response.event.status?.response as string;

    const threadId = response.event.spec.state?.thread_id;
    if (!threadId) {
        return res.status(400).json({ error: "Thread ID not found" });
    }

    const thread = store.get(threadId);
    if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
    }

    if (!thread.awaitingHumanResponse()) {
        return res.status(400).json({ error: "Thread is not awaiting human response" });
    }

    thread.events.push({
        type: "human_response",
        data: response.event.status?.response
    });

});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

export { app };