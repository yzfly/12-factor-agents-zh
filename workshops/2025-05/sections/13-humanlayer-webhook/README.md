# Chapter 12 - HumanLayer Webhook Integration

Add webhook support for HumanLayer.

Update server with webhook support

```diff
src/server.ts
+import { V1Beta2EmailEventReceived } from 'humanlayer';
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
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/12-server.ts src/server.ts

</details>

Start the server

    npx tsx src/server.ts

