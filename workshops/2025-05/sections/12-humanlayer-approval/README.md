# Chapter 11 - Human Approval with HumanLayer

Integrate with HumanLayer for approvals.

Install HumanLayer

    npm install humanlayer

Update agent with HumanLayer integration

```diff
src/agent.ts
-                // response to human, return the thread
+                // response to human, return the next step object
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/11-agent.ts src/agent.ts

</details>

Update CLI with HumanLayer support

```diff
src/cli.ts
+import { humanlayer } from "humanlayer";
-
-
-    const result = await agentLoop(thread);
-    let lastEvent = result.events.slice(-1)[0];
+    let newThread = await agentLoop(thread);
+    let lastEvent = newThread.events.slice(-1)[0];
-    while (lastEvent.data.intent === "request_more_information") {
-        const message = await askHuman(lastEvent.data.message);
-        thread.events.push({ type: "human_response", data: message });
-        const result = await agentLoop(thread);
-        lastEvent = result.events.slice(-1)[0];
+    let needsResponse = 
+        newThread.awaitingHumanResponse() ||
+        newThread.awaitingHumanApproval();
+
+    while (needsResponse) {
+        lastEvent = newThread.events.slice(-1)[0];
+        const responseEvent = await askHuman(lastEvent);
+        thread.events.push(responseEvent);
+        newThread = await agentLoop(thread);
+        // determine if we should loop or if we're done
+        needsResponse = newThread.awaitingHumanResponse() 
+            || newThread.awaitingHumanApproval();
-async function askHuman(message: string) {
+async function askHuman(lastEvent: Event): Promise<Event> {
+    if (process.env.HUMANLAYER_API_KEY) {
+        return await askHumanEmail(lastEvent);
+    } else {
+        return await askHumanCLI(lastEvent.data.message);
+    }
+}
+
+async function askHumanCLI(message: string): Promise<Event> {
-            resolve(answer);
+            resolve({ type: "human_response", data: answer });
+
+export async function askHumanEmail(lastEvent: Event): Promise<Event> {
+    if (!process.env.HUMANLAYER_EMAIL) {
+        throw new Error("missing or invalid parameters: HUMANLAYER_EMAIL");
+    }
+    const hl = humanlayer({ //reads apiKey from env
+        // name of this agent
+        runId: "cli-agent",
+        contactChannel: {
+            // agent should request permission via email
+            email: {
+                address: process.env.HUMANLAYER_EMAIL,
+            }
+        }
+    }) 
+
+    if (lastEvent.data.intent === "request_more_information") {
+        const response = await hl.fetchHumanResponse({
+            spec: {
+                msg: lastEvent.data.message
+            }
+        })
+        return {
+            "type": "tool_response",
+            "data": response
+        }
+    }
+    
+    if (lastEvent.data.intent === "divide") {
+        // fetch approval synchronously
+        const response = await hl.fetchHumanApproval({
+            spec: {
+                fn: "divide",
+                kwargs: {
+                    a: lastEvent.data.a,
+                    b: lastEvent.data.b
+                }
+            }
+        })
+
+        if (response.approved) {
+            const result = lastEvent.data.a / lastEvent.data.b;
+            console.log("tool_response", result);
+            return {
+                "type": "tool_response",
+                "data": result
+            };
+        } else {
+            return {
+                "type": "tool_response",
+                "data": `user denied operation ${lastEvent.data.intent}`
+            };
+        }
+    }
+    throw new Error(`unknown tool: ${lastEvent.data.intent}`)
+}
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/11-cli.ts src/cli.ts

</details>

Run the CLI

    npx tsx src/index.ts 'can divide 4 by 5?'

