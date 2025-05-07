# Chapter 10 - Adding Human Approval

Add support for human approval of operations.

Update server with approval flow

```diff
src/server.ts
-import { Thread, agentLoop } from '../src/agent';
+import { Thread, agentLoop, handleNextStep } from '../src/agent';
-    const result = await agentLoop(thread);
+    const newThread = await agentLoop(thread);
-    // If clarification is needed, include the response URL
-    const lastEvent = result.events[result.events.length - 1];
-    if (lastEvent.data.intent === 'request_more_information') {
-        lastEvent.data.response_url = `/thread/${threadId}/response`;
-    }
-    
-    store.update(threadId, result);
+    store.update(threadId, newThread);
+
+    const lastEvent = newThread.events[newThread.events.length - 1];
+    // If we exited the loop, include the response URL so the client can
+    // push a new message onto the thread
+    lastEvent.data.response_url = `/thread/${threadId}/response`;
+
-        ...result 
+        ...newThread 
+
+type ApprovalPayload = {
+    type: "approval";
+    approved: boolean;
+    comment?: string;
+}
+
+type ResponsePayload = {
+    type: "response";
+    response: string;
+}
+
+type Payload = ApprovalPayload | ResponsePayload;
+
-    
-    thread.events.push({
-        type: "human_response",
-        data: req.body.message
-    });
-    
-    const result = await agentLoop(thread);
-    
-    // If another clarification is needed, include the response URL
-    const lastEvent = result.events[result.events.length - 1];
-    if (lastEvent.data.intent === 'request_more_information') {
-        lastEvent.data.response_url = `/thread/${req.params.id}/response`;
+
+    const body: Payload = req.body;
+
+    let lastEvent = thread.events[thread.events.length - 1];
+
+    if (thread.awaitingHumanResponse() && body.type === 'response') {
+        thread.events.push({
+            type: "human_response",
+            data: body.response
+        });
+    } else if (thread.awaitingHumanApproval() && body.type === 'approval' && !body.approved) {
+        // push feedback onto the thread
+        thread.events.push({
+            type: "tool_response",
+            data: `user denied the operation with feedback: "${body.comment}"`
+        });
+    } else if (thread.awaitingHumanApproval() && body.type === 'approval' && !body.approved) {
+        // approved, run the tool, pushing results onto the thread
+        await handleNextStep(lastEvent, thread);
+    } else {
+        res.status(400).json({
+            error: "Invalid request: " + body.type,
+            awaitingHumanResponse: thread.awaitingHumanResponse(),
+            awaitingHumanApproval: thread.awaitingHumanApproval()
+        });
+
+    // loop until stop event
+    const result = await agentLoop(thread);
+
+
+    lastEvent = result.events[result.events.length - 1];
+    lastEvent.data.response_url = `/thread/${req.params.id}/response`;
+    
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/10-server.ts src/server.ts

</details>

Update agent with approval checks

```diff
src/agent.ts
+
+    awaitingHumanResponse(): boolean {
+        const lastEvent = this.events[this.events.length - 1];
+        return ['request_more_information', 'done_for_now'].includes(lastEvent.data.intent);
+    }
+
+    awaitingHumanApproval(): boolean {
+        const lastEvent = this.events[this.events.length - 1];
+        return lastEvent.data.intent === 'divide';
+    }
+            case "divide":
+                // divide is scary, return it for human approval
+                return thread;
-            case "divide":
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/10-agent.ts src/agent.ts

</details>

Start the server

    npx tsx src/server.ts

Test division with approval

    curl -X POST http://localhost:3000/thread \
  -H "Content-Type: application/json" \
  -d '{"message":"can you divide 3 by 4?"}'

