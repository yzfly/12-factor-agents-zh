# Chapter XX - HumanLayer Webhook Integration

the previous sections used the humanlayer SDK in "synchronous mode" - that 
means every time we wait for human approval, we sit in a loop 
polling until the human response if received.

That's obviously not ideal, especially for production workloads,
so in this section we'll implement [factor 6 - launch / pause / resume with simple APIs](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-6-launch-pause-resume.md)
by updating the server to end processing after contacting a human, and use webhooks to receive the results. 


add code to initialize humanlayer in the server


```diff
src/server.ts
 import { Thread, agentLoop, handleNextStep } from '../src/agent';
 import { ThreadStore } from '../src/state';
+import { humanlayer } from 'humanlayer';
 
 const app = express();
 const store = new ThreadStore();
 
+const getHumanlayer = () => {
+    const HUMANLAYER_EMAIL = process.env.HUMANLAYER_EMAIL;
+    if (!HUMANLAYER_EMAIL) {
+        throw new Error("missing or invalid parameters: HUMANLAYER_EMAIL");
+    }
+
+    const HUMANLAYER_API_KEY = process.env.HUMANLAYER_API_KEY;
+    if (!HUMANLAYER_API_KEY) {
+        throw new Error("missing or invalid parameters: HUMANLAYER_API_KEY");
+    }
+    return humanlayer({
+        runId: `12fa-agent`,
+        contactChannel: {
+            email: { address: HUMANLAYER_EMAIL }
+        }
+    });
+}
+
 // POST /thread - Start new thread
 app.post('/thread', async (req, res) => {
     
     // loop until stop event
-    const newThread = await agentLoop(thread);
+    const result = await agentLoop(thread);
 
-    store.update(req.params.id, newThread);
+    store.update(req.params.id, result);
 
-    lastEvent = newThread.events[newThread.events.length - 1];
+    lastEvent = result.events[result.events.length - 1];
     lastEvent.data.response_url = `/thread/${req.params.id}/response`;
 
     console.log("returning last event from endpoint", lastEvent);
     
-    res.json(newThread);
+    res.json(result);
 });
 
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/12-1-server-init.ts src/server.ts

</details>

next, lets update the /thread endpoint to 
  
1. handle requests asynchronously, returning immediately
2. create a human contact on request_more_information and done_for_now calls


Update the server to be able to handle request_clarification responses

- remove the old /response endpoint and types
- update the /thread endpoint to run processing asynchronously, return immediately
- send a state.threadId when requesting human responses
- add a handleHumanResponse function to process the human response
- add a /webhook endpoint to handle the webhook response


```diff
src/server.ts
-import express from 'express';
+import express, { Request, Response } from 'express';
 import { Thread, agentLoop, handleNextStep } from '../src/agent';
 import { ThreadStore } from '../src/state';
-import { humanlayer } from 'humanlayer';
+import { humanlayer, V1Beta2HumanContactCompleted } from 'humanlayer';
 
 const app = express();
     });
 }
-
 // POST /thread - Start new thread
-app.post('/thread', async (req, res) => {
+app.post('/thread', async (req: Request, res: Response) => {
     const thread = new Thread([{
         type: "user_input",
     }]);
     
-    const threadId = store.create(thread);
-    const newThread = await agentLoop(thread);
-    
-    store.update(threadId, newThread);
+    // run agent loop asynchronously, return immediately
+    Promise.resolve().then(async () => {
+        const threadId = store.create(thread);
+        const newThread = await agentLoop(thread);
+        
+        store.update(threadId, newThread);
 
-    const lastEvent = newThread.events[newThread.events.length - 1];
-    // If we exited the loop, include the response URL so the client can
-    // push a new message onto the thread
-    lastEvent.data.response_url = `/thread/${threadId}/response`;
+        const lastEvent = newThread.events[newThread.events.length - 1];
 
-    console.log("returning last event from endpoint", lastEvent);
-
-    res.json({ 
-        thread_id: threadId,
-        ...newThread 
+        if (thread.awaitingHumanResponse()) {
+            const hl = getHumanlayer();
+            // create a human contact - returns immediately
+            hl.createHumanContact({
+                spec: {
+                    msg: lastEvent.data.message,
+                    state: {
+                        thread_id: threadId,
+                    }
+                }
+            });
+        }
     });
+
+    res.json({ status: "processing" });
 });
 
 // GET /thread/:id - Get thread status
-app.get('/thread/:id', (req, res) => {
+app.get('/thread/:id', (req: Request, res: Response) => {
     const thread = store.get(req.params.id);
     if (!thread) {
 });
 
+type WebhookResponse = V1Beta2HumanContactCompleted;
 
-type ApprovalPayload = {
-    type: "approval";
-    approved: boolean;
-    comment?: string;
-}
+const handleHumanResponse = async (req: Request, res: Response) => {
 
-type ResponsePayload = {
-    type: "response";
-    response: string;
 }
 
-type Payload = ApprovalPayload | ResponsePayload;
+app.post('/webhook', async (req: Request, res: Response) => {
+    console.log("webhook response", req.body);
+    const response = req.body as WebhookResponse;
 
-// POST /thread/:id/response - Handle clarification response
-app.post('/thread/:id/response', async (req, res) => {
-    let thread = store.get(req.params.id);
+    // response is guaranteed to be set on a webhook
+    const humanResponse: string = response.event.status?.response as string;
+
+    const threadId = response.event.spec.state?.thread_id;
+    if (!threadId) {
+        return res.status(400).json({ error: "Thread ID not found" });
+    }
+
+    const thread = store.get(threadId);
     if (!thread) {
         return res.status(404).json({ error: "Thread not found" });
     }
 
-    const body: Payload = req.body;
-
-    let lastEvent = thread.events[thread.events.length - 1];
-
-    if (thread.awaitingHumanResponse() && body.type === 'response') {
-        thread.events.push({
-            type: "human_response",
-            data: body.response
-        });
-    } else if (thread.awaitingHumanApproval() && body.type === 'approval' && !body.approved) {
-        // push feedback onto the thread
-        thread.events.push({
-            type: "tool_response",
-            data: `user denied the operation with feedback: "${body.comment}"`
-        });
-    } else if (thread.awaitingHumanApproval() && body.type === 'approval' && body.approved) {
-        // approved, run the tool, pushing results onto the thread
-        await handleNextStep(lastEvent.data, thread);
-    } else {
-        res.status(400).json({
-            error: "Invalid request: " + body.type,
-            awaitingHumanResponse: thread.awaitingHumanResponse(),
-            awaitingHumanApproval: thread.awaitingHumanApproval()
-        });
-        return;
+    if (!thread.awaitingHumanResponse()) {
+        return res.status(400).json({ error: "Thread is not awaiting human response" });
     }
 
-    
-    // loop until stop event
-    const result = await agentLoop(thread);
-
-    store.update(req.params.id, result);
-
-    lastEvent = result.events[result.events.length - 1];
-    lastEvent.data.response_url = `/thread/${req.params.id}/response`;
-
-    console.log("returning last event from endpoint", lastEvent);
-    
-    res.json(result);
 });
 
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/12a-server.ts src/server.ts

</details>

Start the server in another terminal

    npx tsx src/server.ts

now that the server is running, send a payload to the '/thread' endpoint


__ do the response step

__ now handle approvals for divide

__ now also handle done_for_now

