# Chapter 3 - Process Tool Calls in a Loop

Now let's add a real agentic loop that can run the tools and get a final answer from the LLM.

Update agent with tool handling

```diff
src/agent.ts
 }
 
-// right now this just runs one turn with the LLM, but
-// we'll update this function to handle all the agent logic
-export async function agentLoop(thread: Thread): Promise<AgentResponse> {
-    const nextStep = await b.DetermineNextStep(thread.serializeForLLM());
-    return nextStep;
+
+
+export async function agentLoop(thread: Thread): Promise<string> {
+
+    while (true) {
+        const nextStep = await b.DetermineNextStep(thread.serializeForLLM());
+        console.log("nextStep", nextStep);
+
+        switch (nextStep.intent) {
+            case "done_for_now":
+                // response to human, return the next step object
+                return nextStep.message;
+            case "add":
+                thread.events.push({
+                    "type": "tool_call",
+                    "data": nextStep
+                });
+                const result = nextStep.a + nextStep.b;
+                console.log("tool_response", result);
+                thread.events.push({
+                    "type": "tool_response",
+                    "data": result
+                });
+                continue;
+            default:
+                throw new Error(`Unknown intent: ${nextStep.intent}`);
+        }
+    }
 }
 
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/03-agent.ts src/agent.ts

</details>

Try a simple calculation

    npx tsx src/index.ts 'can you add 3 and 4'

Turn off BAML logs for cleaner output

    export BAML_LOG=off

Try a multi-step calculation

    npx tsx src/index.ts 'can you add 3 and 4, then add 6 to that result'

Add handlers for all calculator tools

```diff
src/agent.ts
-import { b } from "../baml_client";
+import { AddTool, SubtractTool, DivideTool, MultiplyTool, b } from "../baml_client";
 
-// tool call or a respond to human tool
-type AgentResponse = Awaited<ReturnType<typeof b.DetermineNextStep>>;
-
 export interface Event {
     type: string
 }
 
+export type CalculatorTool = AddTool | SubtractTool | MultiplyTool | DivideTool;
 
+export async function handleNextStep(nextStep: CalculatorTool, thread: Thread): Promise<Thread> {
+    let result: number;
+    switch (nextStep.intent) {
+        case "add":
+            result = nextStep.a + nextStep.b;
+            console.log("tool_response", result);
+            thread.events.push({
+                "type": "tool_response",
+                "data": result
+            });
+            return thread;
+        case "subtract":
+            result = nextStep.a - nextStep.b;
+            console.log("tool_response", result);
+            thread.events.push({
+                "type": "tool_response",
+                "data": result
+            });
+            return thread;
+        case "multiply":
+            result = nextStep.a * nextStep.b;
+            console.log("tool_response", result);
+            thread.events.push({
+                "type": "tool_response",
+                "data": result
+            });
+            return thread;
+        case "divide":
+            result = nextStep.a / nextStep.b;
+            console.log("tool_response", result);
+            thread.events.push({
+                "type": "tool_response",
+                "data": result
+            });
+            return thread;
+    }
+}
 
 export async function agentLoop(thread: Thread): Promise<string> {
         console.log("nextStep", nextStep);
 
+        thread.events.push({
+            "type": "tool_call",
+            "data": nextStep
+        });
+
         switch (nextStep.intent) {
             case "done_for_now":
                 return nextStep.message;
             case "add":
-                thread.events.push({
-                    "type": "tool_call",
-                    "data": nextStep
-                });
-                const result = nextStep.a + nextStep.b;
-                console.log("tool_response", result);
-                thread.events.push({
-                    "type": "tool_response",
-                    "data": result
-                });
-                continue;
-            default:
-                throw new Error(`Unknown intent: ${nextStep.intent}`);
+            case "subtract":
+            case "multiply":
+            case "divide":
+                thread = await handleNextStep(nextStep, thread);
         }
     }
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/03b-agent.ts src/agent.ts

</details>

Test subtraction

    npx tsx src/index.ts 'can you subtract 3 from 4'

Test multiplication

    npx tsx src/index.ts 'can you multiply 3 and 4'

Test a complex calculation

    npx tsx src/index.ts 'can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result'

