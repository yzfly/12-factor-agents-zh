# Chapter 9 - In-Memory State and Async Clarification

Add state management and async clarification support.

Add state management

    cp ./walkthrough/09-state.ts src/state.ts

<details>
<summary>show file</summary>

```ts
// ./walkthrough/09-state.ts
import crypto from 'crypto';
import { Thread } from '../src/agent';


// you can replace this with any simple state management,
// e.g. redis, sqlite, postgres, etc
export class ThreadStore {
    private threads: Map<string, Thread> = new Map();
    
    create(thread: Thread): string {
        const id = crypto.randomUUID();
        this.threads.set(id, thread);
        return id;
    }
    
    get(id: string): Thread | undefined {
        return this.threads.get(id);
    }
    
    update(id: string, thread: Thread): void {
        this.threads.set(id, thread);
    }
}
```

</details>

Update server with state support

```diff
src/server.ts
 import express from 'express';
 import { Thread, agentLoop } from '../src/agent';
+import { ThreadStore } from '../src/state';
 
 const app = express();
 app.use(express.json());
 
+const store = new ThreadStore();
+
 // POST /thread - Start new thread
 app.post('/thread', async (req, res) => {
         data: req.body.message
     }]);
+    
+    const threadId = store.create(thread);
     const result = await agentLoop(thread);
-    res.json(result);
+    
+    // If clarification is needed, include the response URL
+    const lastEvent = result.events[result.events.length - 1];
+    if (lastEvent.data.intent === 'request_more_information') {
+        lastEvent.data.response_url = `/thread/${threadId}/response`;
+    }
+    
+    store.update(threadId, result);
+    res.json({ 
+        thread_id: threadId,
+        ...result 
+    });
 });
 
 app.get('/thread/:id', (req, res) => {
-    // optional - add state
-    res.status(404).json({ error: "Not implemented yet" });
+    const thread = store.get(req.params.id);
+    if (!thread) {
+        return res.status(404).json({ error: "Thread not found" });
+    }
+    res.json(thread);
 });
 
+// POST /thread/:id/response - Handle clarification response
+app.post('/thread/:id/response', async (req, res) => {
+    const thread = store.get(req.params.id);
+    if (!thread) {
+        return res.status(404).json({ error: "Thread not found" });
+    }
+    
+    thread.events.push({
+        type: "human_response",
+        data: req.body.message
+    });
+    
+    const result = await agentLoop(thread);
+    
+    // If another clarification is needed, include the response URL
+    const lastEvent = result.events[result.events.length - 1];
+    if (lastEvent.data.intent === 'request_more_information') {
+        lastEvent.data.response_url = `/thread/${req.params.id}/response`;
+    }
+    
+    store.update(req.params.id, result);
+    res.json(result);
+});
+
 const port = process.env.PORT || 3000;
 app.listen(port, () => {
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/09-server.ts src/server.ts

</details>

Start the server

    npx tsx src/server.ts

Test clarification flow

    curl -X POST http://localhost:3000/thread \
  -H "Content-Type: application/json" \
  -d '{"message":"can you multiply 3 and xyz"}'

