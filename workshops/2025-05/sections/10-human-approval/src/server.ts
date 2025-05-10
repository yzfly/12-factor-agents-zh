import express from 'express';
import { Thread, agentLoop } from '../src/agent';
import { ThreadStore } from '../src/state';

const app = express();
app.use(express.json());

const store = new ThreadStore();

// POST /thread - Start new thread
app.post('/thread', async (req, res) => {
    const thread = new Thread([{
        type: "user_input",
        data: req.body.message
    }]);
    
    const threadId = store.create(thread);
    const result = await agentLoop(thread);
    
    // If clarification is needed, include the response URL
    const lastEvent = result.events[result.events.length - 1];
    if (lastEvent.data.intent === 'request_more_information') {
        lastEvent.data.response_url = `/thread/${threadId}/response`;
    }
    
    store.update(threadId, result);
    res.json({ 
        thread_id: threadId,
        ...result 
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

// POST /thread/:id/response - Handle clarification response
app.post('/thread/:id/response', async (req, res) => {
    const thread = store.get(req.params.id);
    if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
    }
    
    thread.events.push({
        type: "human_response",
        data: req.body.message
    });
    
    const result = await agentLoop(thread);
    
    // If another clarification is needed, include the response URL
    const lastEvent = result.events[result.events.length - 1];
    if (lastEvent.data.intent === 'request_more_information') {
        lastEvent.data.response_url = `/thread/${req.params.id}/response`;
    }
    
    store.update(req.params.id, result);
    res.json(result);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

export { app };