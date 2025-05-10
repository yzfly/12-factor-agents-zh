# Chapter 12 - HumanLayer Webhook Integration

Add webhook support for HumanLayer.

Update server with webhook support

```diff
src/server.ts
 import { Thread, agentLoop, handleNextStep } from '../src/agent';
 import { ThreadStore } from '../src/state';
+import { V1Beta2EmailEventReceived } from 'humanlayer';
 
 const app = express();
     lastEvent.data.response_url = `/thread/${threadId}/response`;
 
-    console.log("returning last event from endpoint", lastEvent);
-
     res.json({ 
         thread_id: threadId,
 // POST /thread/:id/response - Handle clarification response
 app.post('/thread/:id/response', async (req, res) => {
-    let thread = store.get(req.params.id);
+    const thread = store.get(req.params.id);
     if (!thread) {
         return res.status(404).json({ error: "Thread not found" });
             data: `user denied the operation with feedback: "${body.comment}"`
         });
-    } else if (thread.awaitingHumanApproval() && body.type === 'approval' && body.approved) {
+    } else if (thread.awaitingHumanApproval() && body.type === 'approval' && !body.approved) {
         // approved, run the tool, pushing results onto the thread
-        await handleNextStep(lastEvent.data, thread);
+        await handleNextStep(lastEvent, thread);
     } else {
         res.status(400).json({
             awaitingHumanApproval: thread.awaitingHumanApproval()
         });
-        return;
     }
 
     lastEvent = result.events[result.events.length - 1];
     lastEvent.data.response_url = `/thread/${req.params.id}/response`;
-
-    console.log("returning last event from endpoint", lastEvent);
     
     res.json(result);
 });
 
+
+app.post('/webhook', async (req, res) => {
+    //todo verify webhook
+    const payload: V1Beta2EmailEventReceived = req.body
+
+    const { subject, body, to_address, from_address} = payload.event;
+
+    const thread = new Thread([{
+        type: "user_input",
+        data: {
+            subject,
+            body,
+            to_address,
+            from_address,
+        }
+    }]);
+    
+    const threadId = store.create(thread);
+    const newThread = await agentLoop(thread);
+    
+    store.update(threadId, newThread);
+
+    const lastEvent = newThread.events[newThread.events.length - 1];
+
+    
+
+
+
+
+    // don't return any content, we sent the next step to a human
+    res.json({ status: "ok" });
+})
+
 const port = process.env.PORT || 3000;
 app.listen(port, () => {
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/12-server.ts src/server.ts

</details>

Start the server

    npx tsx src/server.ts

