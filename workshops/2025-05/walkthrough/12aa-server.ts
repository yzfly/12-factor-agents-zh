import express, { Request, Response } from 'express';
import { Thread, agentLoop, handleNextStep } from '../src/agent';
import { ThreadStore } from '../src/state';
import { humanlayer, V1Beta2HumanContactCompleted } from 'humanlayer';

const app = express();
app.use(express.json());
app.set('json spaces', 2);

const store = new ThreadStore();


const getHumanlayer = () => {
    const HUMANLAYER_EMAIL = process.env.HUMANLAYER_EMAIL;
    if (!HUMANLAYER_EMAIL) {
        throw new Error("missing or invalid parameters: HUMANLAYER_EMAIL");
    }

    const HUMANLAYER_API_KEY = process.env.HUMANLAYER_API_KEY;
    if (!HUMANLAYER_API_KEY) {
        throw new Error("missing or invalid parameters: HUMANLAYER_API_KEY");
    }
    return humanlayer({
        runId: `12fa-agent`,
        contactChannel: {
            email: { address: HUMANLAYER_EMAIL }
        }
    });
}
// POST /thread - Start new thread
app.post('/thread', async (req: Request, res: Response) => {
    const thread = new Thread([{
        type: "user_input",
        data: req.body.message
    }]);
    
    // run agent loop asynchronously, return immediately
    Promise.resolve().then(async () => {
        const threadId = store.create(thread);
        const newThread = await agentLoop(thread);
        
        store.update(threadId, newThread);

        const lastEvent = newThread.events[newThread.events.length - 1];

        if (thread.awaitingHumanResponse()) {
            const hl = getHumanlayer();
            // create a human contact - returns immediately
            hl.createHumanContact({
                spec: {
                    msg: lastEvent.data.message,
                    state: {
                        thread_id: threadId,
                    }
                }
            });
        }
    });

    res.json({ status: "processing" });
});

// GET /thread/:id - Get thread status
app.get('/thread/:id', (req: Request, res: Response) => {
    const thread = store.get(req.params.id);
    if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
    }
    res.json(thread);
});

type WebhookResponse = V1Beta2HumanContactCompleted;

const handleHumanResponse = async (req: Request, res: Response) => {

}

app.post('/webhook', async (req: Request, res: Response) => {
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

});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

export { app };