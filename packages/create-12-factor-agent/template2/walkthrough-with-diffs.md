### Building the 12-factor agent template from scratch

Steps to start from an bare TS repo and build up a 12-factor agent.

Won't cover setting up package.json or tsconfig.json here, but you can copy them from the
final template.

You can walk through each step interactively with `npx tsx hack/run-walkthrough.ts -i -d` 


#### cleanup

make sure you're starting from a clean slate

```
rm -rf baml_src/ && rm -rf src/ && mkdir src
```

#### chapter 0 - hello world

```
cp walkthrough/00-index.ts src/index.ts
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-IRJjJT/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-IRJjJT/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-IRJjJT/new_file
@@ -1,11 +1,9 @@
-import { cli } from "./cli"
-
 async function hello(): Promise<void> {
     console.log('hello, world!')
 }
 
 async function main() {
-    await cli()
+    await hello()
 }
 
 main().catch(console.error)
\ No newline at end of file
```

```

```
npx tsx src/index.ts
```

```
git add . && git commit -m "clean up" && git show HEAD --color=always | cat
```

#### chapter 1 - cli and agent loop

```
npm i baml
```

```
npx baml-cli init
```

```
rm baml_src/resume.baml
```

add our baml starter agent

```
cp walkthrough/01-agent.baml baml_src/agent.baml
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-tiSasI/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-tiSasI/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-tiSasI/new_file
@@ -1,22 +1,11 @@
-// human tools are async requests to a human
-type HumanTools = ClarificationRequest | DoneForNow
-
-class ClarificationRequest {
-  intent "request_more_information" @description("you can request more information from me")
-  message string
-}
-
 class DoneForNow {
   intent "done_for_now"
-
-  message string @description(#"
-    message to send to the user about the work that was done. 
-  "#)
+  message string 
 }
 
 function DetermineNextStep(
     thread: string 
-) -> HumanTools | CalculatorTools {
+) -> DoneForNow {
     client "openai/gpt-4o"
 
     prompt #"
@@ -33,14 +22,6 @@ function DetermineNextStep(
         What should the next step be?
 
         {{ ctx.output_format }}
-
-        Always think about what to do next first, like:
-
-        - ...
-        - ...
-        - ...
-
-        {...} // schema
     "#
 }
 
@@ -48,106 +29,10 @@ test HelloWorld {
   functions [DetermineNextStep]
   args {
     thread #"
-      <user_input>
-        hello!
-      </user_input>
-    "#
-  }
-  @@assert(intent, {{this.intent == "request_more_information"}})
-}
-
-test MathOperation {
-  functions [DetermineNextStep]
-  args {
-    thread #"
-      <user_input>
-        can you multiply 3 and 4?
-      </user_input>
+      {
+        "type": "user_input",
+        "data": "hello!"
+      }
     "#
   }
-  @@assert(intent, {{this.intent == "multiply"}})
-}
-
-test LongMath {
-  functions [DetermineNextStep]
-  args {
-    thread #"
-         <user_input>
-    can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result?
-    </user_input>
-
-
-    <multiply>
-    a: 3
-    b: 4
-    </multiply>
-
-
-    <tool_response>
-    12
-    </tool_response>
-
-
-    <divide>
-    a: 12
-    b: 2
-    </divide>
-
-
-    <tool_response>
-    6
-    </tool_response>
-
-
-    <add>
-    a: 6
-    b: 12
-    </add>
-
-
-    <tool_response>
-    18
-    </tool_response>
-
-    "#
-  }
-  @@assert(intent, {{this.intent == "done_for_now"}})
-  @@assert(answer, {{"18" in this.message}})
-}
-
-
-
-test MathOperationWithClarification {
-  functions [DetermineNextStep]
-  args {
-    thread #"
-          <user_input>
-          can you multiply 3 and fe1iiaff10
-          </user_input>
-      "#
-  }
-  @@assert(intent, {{this.intent == "request_more_information"}})
-}
-
-test MathOperationPostClarification {
-  functions [DetermineNextStep]
-  args {
-    thread #"
-        <user_input>
-        can you multiply 3 and FD*(#F&& ?
-        </user_input>
-
-        <request_more_information>
-        message: It seems like there was a typo or mistake in your request. Could you please clarify or provide the correct numbers you would like to multiply?
-        </request_more_information>
-
-        <human_response>
-        lets try 12 instead
-        </human_response>
-      "#
-  }
-  @@assert(intent, {{this.intent == "multiply"}})
-  @@assert(b, {{this.a == 3}})
-  @@assert(a, {{this.b == 12}})
-}
-        
\ No newline at end of file
+}
\ No newline at end of file
```

```

```
npx baml-cli generate
```

for now, lets enable baml logging

```
export BAML_LOG=debug
```

call it from our ts files

```
cp walkthrough/01-cli.ts src/cli.ts
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-xNL5DC/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-xNL5DC/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-xNL5DC/new_file
@@ -1,7 +1,6 @@
 // cli.ts lets you invoke the agent loop from the command line
 
-import { humanlayer } from "humanlayer";
-import { agentLoop, Thread, Event } from "../src/agent";
+import { agentLoop, Thread, Event } from "./agent";
 
 export async function cli() {
     // Get command line arguments, skipping the first two (node and script name)
@@ -19,106 +18,6 @@ export async function cli() {
     const thread = new Thread([{ type: "user_input", data: message }]);
 
     // Run the agent loop with the thread
-    let newThread = await agentLoop(thread);
-    let lastEvent = newThread.events.slice(-1)[0];
-
-    let needsResponse = 
-        newThread.awaitingHumanResponse() ||
-        newThread.awaitingHumanApproval();
-
-    while (needsResponse) {
-        lastEvent = newThread.events.slice(-1)[0];
-        const responseEvent = await askHuman(lastEvent);
-        thread.events.push(responseEvent);
-        newThread = await agentLoop(thread);
-        // determine if we should loop or if we're done
-        needsResponse = newThread.awaitingHumanResponse() 
-            || newThread.awaitingHumanApproval();
-    }
-
-    // print the final result
-    // optional - you could loop here too
-    console.log(lastEvent.data.message);
-    process.exit(0);
-}
-
-async function askHuman(lastEvent: Event): Promise<Event> {
-    if (process.env.HUMANLAYER_API_KEY) {
-        return await askHumanHumanlayer(lastEvent);
-    } else {
-        return await askHumanCLI(lastEvent.data.message);
-    }
-}
-
-async function askHumanCLI(message: string): Promise<Event> {
-    const readline = require('readline').createInterface({
-        input: process.stdin,
-        output: process.stdout
-    });
-
-    return new Promise((resolve) => {
-        readline.question(`${message}\n> `, (answer: string) => {
-            resolve({ type: "human_response", data: answer });
-        });
-    });
+    const result = await agentLoop(thread);
+    console.log(result);
 }
-
-async function askHumanHumanlayer(lastEvent: Event): Promise<Event> {
-    if (!process.env.HUMANLAYER_EMAIL) {
-        throw new Error("missing or invalid parameters: HUMANLAYER_EMAIL");
-    }
-    const hl = humanlayer({ //reads apiKey from env
-        // name of this agent
-        runId: "cli-agent",
-        contactChannel: {
-            // agent should request permission via email
-            email: {
-                address: process.env.HUMANLAYER_EMAIL,
-            }
-        }
-    }) 
-
-    if (lastEvent.data.intent === "request_more_information") {
-        console.log("requesting response from human via email")
-        const response = await hl.fetchHumanResponse({
-            spec: {
-                msg: lastEvent.data.message
-            }
-        })
-        return {
-            "type": "tool_response",
-            "data": response
-        }
-    }
-    
-    if (lastEvent.data.intent === "divide") {
-        // fetch approval synchronously
-        console.log("requesting approval from human via email")
-        const response = await hl.fetchHumanApproval({
-            spec: {
-                fn: "divide",
-                kwargs: {
-                    a: lastEvent.data.a,
-                    b: lastEvent.data.b
-                }
-            }
-        })
-
-        if (response.approved) {
-            const result = lastEvent.data.a / lastEvent.data.b;
-            console.log("tool_response", result);
-            return {
-                "type": "tool_response",
-                "data": result
-            };
-        } else {
-            return {
-                "type": "tool_response",
-                "data": `user denied operation ${lastEvent.data.intent}`
-            };
-        }
-    }
-
-    
-
-}
\ No newline at end of file
```

```

```
cp walkthrough/01-index.ts src/index.ts
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-7klpGO/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-7klpGO/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-7klpGO/new_file
@@ -1,9 +1,11 @@
+import { cli } from "./cli"
+
 async function hello(): Promise<void> {
     console.log('hello, world!')
 }
 
 async function main() {
-    await hello()
+    await cli()
 }
 
 main().catch(console.error)
\ No newline at end of file
```

```

```
cp walkthrough/01-agent.ts src/agent.ts
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-M6B0ap/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-M6B0ap/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-M6B0ap/new_file
@@ -1,4 +1,7 @@
-import { AddTool, SubtractTool, DivideTool, MultiplyTool, b } from "../baml_client";
+import { b } from "../baml_client";
+
+// tool call or a respond to human tool
+type AgentResponse = Awaited<ReturnType<typeof b.DetermineNextStep>>;
 
 export interface Event {
     type: string
@@ -13,100 +16,17 @@ export class Thread {
     }
 
     serializeForLLM() {
-        return this.events.map(e => this.serializeOneEvent(e)).join("\n");
-    }
-
-    trimLeadingWhitespace(s: string) {
-        return s.replace(/^[ \t]+/gm, '');
-    }
-
-    serializeOneEvent(e: Event) {
-        return this.trimLeadingWhitespace(`
-            <${e.data?.intent || e.type}>
-            ${
-            typeof e.data !== 'object' ? e.data :
-            Object.keys(e.data).filter(k => k !== 'intent').map(k => `${k}: ${e.data[k]}`).join("\n")}
-            </${e.data?.intent || e.type}>
-        `)
-    }
-
-    awaitingHumanResponse(): boolean {
-        const lastEvent = this.events[this.events.length - 1];
-        return ['request_more_information', 'done_for_now'].includes(lastEvent.data.intent);
-    }
-
-    awaitingHumanApproval(): boolean {
-        const lastEvent = this.events[this.events.length - 1];
-        return lastEvent.data.intent === 'divide';
+        // can change this to whatever custom serialization you want to do, XML, etc
+        // e.g. https://github.com/got-agents/agents/blob/59ebbfa236fc376618f16ee08eb0f3bf7b698892/linear-assistant-ts/src/agent.ts#L66-L105
+        return JSON.stringify(this.events);
     }
 }
 
-export type CalculatorTool = AddTool | SubtractTool | MultiplyTool | DivideTool;
-
-export async function handleNextStep(nextStep: CalculatorTool, thread: Thread): Promise<Thread> {
-    let result: number;
-    switch (nextStep.intent) {
-        case "add":
-            result = nextStep.a + nextStep.b;
-            console.log("tool_response", result);
-            thread.events.push({
-                "type": "tool_response",
-                "data": result
-            });
-            return thread;
-        case "subtract":
-            result = nextStep.a - nextStep.b;
-            console.log("tool_response", result);
-            thread.events.push({
-                "type": "tool_response",
-                "data": result
-            });
-            return thread;
-        case "multiply":
-            result = nextStep.a * nextStep.b;
-            console.log("tool_response", result);
-            thread.events.push({
-                "type": "tool_response",
-                "data": result
-            });
-            return thread;
-        case "divide":
-            result = nextStep.a / nextStep.b;
-            console.log("tool_response", result);
-            thread.events.push({
-                "type": "tool_response",
-                "data": result
-            });
-            return thread;
-    }
-}
-
-export async function agentLoop(thread: Thread): Promise<Thread> {
-
-    while (true) {
-        const nextStep = await b.DetermineNextStep(thread.serializeForLLM());
-        console.log("nextStep", nextStep);
-
-        thread.events.push({
-            "type": "tool_call",
-            "data": nextStep
-        });
-
-        switch (nextStep.intent) {
-            case "done_for_now":
-            case "request_more_information":
-                // response to human, return the next step object
-                return thread;
-            case "divide":
-                // divide is scary, return it for human approval
-                return thread;
-            case "add":
-            case "subtract":
-            case "multiply":
-                thread = await handleNextStep(nextStep, thread);
-                break;
-        }
-    }
+// right now this just runs one turn with the LLM, but
+// we'll update this function to handle all the agent logic
+export async function agentLoop(thread: Thread): Promise<AgentResponse> {
+    const nextStep = await b.DetermineNextStep(thread.serializeForLLM());
+    return nextStep;
 }
 
 
```

```

say hello

```
npx tsx src/index.ts hello
```

```
git add . && git commit -m "add cli and agent loop" && git show HEAD --color=always | cat
```

#### chapter 2 - add calculator tools

now lets add a calculator tool to our baml agent

```
cp walkthrough/02-tool_calculator.baml baml_src/tool_calculator.baml
```diff
```

```

```
cp walkthrough/02-agent.baml baml_src/agent.baml
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-aNdsN7/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-aNdsN7/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-aNdsN7/new_file
@@ -5,7 +5,7 @@ class DoneForNow {
 
 function DetermineNextStep(
     thread: string 
-) -> DoneForNow {
+) -> CalculatorTools | DoneForNow {
     client "openai/gpt-4o"
 
     prompt #"
```

```

```
npx baml-cli generate
```

No changes are necessary to the TS files

```
npx tsx src/index.ts 'can you add 3 and 4?'
```

```
git add . && git commit -m "add calculator tools" && git show HEAD --color=always | cat
```

### chapter 3 - process tool call in a loop

Now lets add a real agentic loop that can run the tools and get a final answer from the LLM.

```
cp walkthrough/03-agent.ts src/agent.ts
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-NU1Nyq/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-NU1Nyq/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-NU1Nyq/new_file
@@ -22,11 +22,34 @@ export class Thread {
     }
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

```

```
npx tsx src/index.ts 'can you add 3 and 4?'
```

lets turn the baml logs  off and run it again

```
export BAML_LOG=off
# turn back on with export BAML_LOG=info
```

```
npx tsx src/index.ts 'can you add 3 and 4, then add 6 to that result?'
```

note that the others don't work yet, becasue we're not handling them in the agent loop

```
npx tsx src/index.ts 'can you subtract 3 from 4?'
```

Let's handlers for the rest of the tools

```
cp walkthrough/03b-agent.ts src/agent.ts
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-vAZ4d8/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-vAZ4d8/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-vAZ4d8/new_file
@@ -1,7 +1,4 @@
-import { b } from "../baml_client";
-
-// tool call or a respond to human tool
-type AgentResponse = Awaited<ReturnType<typeof b.DetermineNextStep>>;
+import { AddTool, SubtractTool, DivideTool, MultiplyTool, b } from "../baml_client";
 
 export interface Event {
     type: string
@@ -22,7 +19,45 @@ export class Thread {
     }
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
 
@@ -30,24 +65,20 @@ export async function agentLoop(thread: Thread): Promise<string> {
         const nextStep = await b.DetermineNextStep(thread.serializeForLLM());
         console.log("nextStep", nextStep);
 
+        thread.events.push({
+            "type": "tool_call",
+            "data": nextStep
+        });
+
         switch (nextStep.intent) {
             case "done_for_now":
                 // response to human, return the next step object
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
 }
```

```

```
npx tsx src/index.ts 'can you subtract 3 from 4?'
```

```
npx tsx src/index.ts 'can you multiply 3 and 4?'
```

```
npx tsx src/index.ts 'can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result?'
```

```
git add . && git commit -m "add agent loop" && git show HEAD --color=always | cat
```

### chapter 4 - add tests to agent.baml

```
cp walkthrough/04-agent.baml baml_src/agent.baml
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-oT2UnT/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-oT2UnT/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-oT2UnT/new_file
@@ -35,4 +35,17 @@ test HelloWorld {
       }
     "#
   }
-}
\ No newline at end of file
+}
+
+test MathOperation {
+  functions [DetermineNextStep]
+  args {
+    thread #"
+      {
+        "type": "user_input",
+        "data": "can you multiply 3 and 4?"
+      }
+    "#
+  }
+}
+
```

```

try in playground

```
npx baml-cli test
```

add an assert that fails and test again

```
npx baml-cli test
```

change the assert to pass

```
cp walkthrough/04b-agent.baml baml_src/agent.baml
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-dpw5nT/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-dpw5nT/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-dpw5nT/new_file
@@ -35,6 +35,7 @@ test HelloWorld {
       }
     "#
   }
+  @@assert(hello, {{this.intent == "done_for_now"}})
 }
 
 test MathOperation {
@@ -47,5 +48,6 @@ test MathOperation {
       }
     "#
   }
+  @@assert(math_operation, {{this.intent == "multiply"}})
 }
 
```

```

Now let's build a test with a much more complex tool call

```
BAML_LOG=info npx tsx src/index.ts 'can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result?'
```

copy the thread from the output into another test 

```
cp walkthrough/04c-agent.baml baml_src/agent.baml
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-dPMD4p/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-dPMD4p/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-dPMD4p/new_file
@@ -35,7 +35,7 @@ test HelloWorld {
       }
     "#
   }
-  @@assert(hello, {{this.intent == "done_for_now"}})
+  @@assert(intent, {{this.intent == "done_for_now"}})
 }
 
 test MathOperation {
@@ -48,6 +48,58 @@ test MathOperation {
       }
     "#
   }
-  @@assert(math_operation, {{this.intent == "multiply"}})
+  @@assert(intent, {{this.intent == "multiply"}})
+}
+
+test LongMath {
+  functions [DetermineNextStep]
+  args {
+    thread #"
+      [
+        {
+          "type": "user_input",
+          "data": "can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result?"
+        },
+        {
+          "type": "tool_call",
+          "data": {
+            "intent": "multiply",
+            "a": 3,
+            "b": 4
+          }
+        },
+        {
+          "type": "tool_response",
+          "data": 12
+        },
+        {
+          "type": "tool_call", 
+          "data": {
+            "intent": "divide",
+            "a": 12,
+            "b": 2
+          }
+        },
+        {
+          "type": "tool_response",
+          "data": 6
+        },
+        {
+          "type": "tool_call",
+          "data": {
+            "intent": "add", 
+            "a": 6,
+            "b": 12
+          }
+        },
+        {
+          "type": "tool_response",
+          "data": 18
+        }
+      ]
+    "#
+  }
+  @@assert(intent, {{this.intent == "done_for_now"}})
+  @@assert(answer, {{"18" in this.message}})
 }
 
```

```

```
npx baml-cli test
```

```
git add . && git commit -m "add tests to agent.baml" && git show HEAD --color=always | cat
```

### chapter 5 - multiple human tools

```
cp walkthrough/05-agent.baml baml_src/agent.baml
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-8IJp34/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-8IJp34/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-8IJp34/new_file
@@ -1,11 +1,22 @@
+// human tools are async requests to a human
+type HumanTools = ClarificationRequest | DoneForNow
+
+class ClarificationRequest {
+  intent "request_more_information" @description("you can request more information from me")
+  message string
+}
+
 class DoneForNow {
   intent "done_for_now"
-  message string 
+
+  message string @description(#"
+    message to send to the user about the work that was done. 
+  "#)
 }
 
 function DetermineNextStep(
     thread: string 
-) -> CalculatorTools | DoneForNow {
+) -> HumanTools | CalculatorTools {
     client "openai/gpt-4o"
 
     prompt #"
@@ -103,3 +114,4 @@ test LongMath {
   @@assert(answer, {{"18" in this.message}})
 }
 
+
```

```

```
npx baml-cli generate
```

We can test the `request_more_information` intent by sending the llm a
garbled message.

```
npx tsx src/index.ts 'can you multiply 3 and FD*(#F&x& ?'
```

lets update our cli loop to ask the human for input if the agent returns a `request_more_information` intent

```
cp walkthrough/05-agent.ts src/agent.ts
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-L1Qwsk/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-L1Qwsk/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-L1Qwsk/new_file
@@ -59,7 +59,7 @@ export async function handleNextStep(nextStep: CalculatorTool, thread: Thread):
     }
 }
 
-export async function agentLoop(thread: Thread): Promise<string> {
+export async function agentLoop(thread: Thread): Promise<Thread> {
 
     while (true) {
         const nextStep = await b.DetermineNextStep(thread.serializeForLLM());
@@ -72,8 +72,9 @@ export async function agentLoop(thread: Thread): Promise<string> {
 
         switch (nextStep.intent) {
             case "done_for_now":
-                // response to human, return the next step object
-                return nextStep.message;
+            case "request_more_information":
+                // response to human, return the thread
+                return thread;
             case "add":
             case "subtract":
             case "multiply":
```

```

```
cp walkthrough/05-cli.ts src/cli.ts
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-MlsK5b/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-MlsK5b/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-MlsK5b/new_file
@@ -1,6 +1,8 @@
 // cli.ts lets you invoke the agent loop from the command line
 
-import { agentLoop, Thread, Event } from "./agent";
+import { agentLoop, Thread, Event } from "../src/agent";
+
+
 
 export async function cli() {
     // Get command line arguments, skipping the first two (node and script name)
@@ -19,5 +21,30 @@ export async function cli() {
 
     // Run the agent loop with the thread
     const result = await agentLoop(thread);
-    console.log(result);
+    let lastEvent = result.events.slice(-1)[0];
+
+    while (lastEvent.data.intent === "request_more_information") {
+        const message = await askHuman(lastEvent.data.message);
+        thread.events.push({ type: "human_response", data: message });
+        const result = await agentLoop(thread);
+        lastEvent = result.events.slice(-1)[0];
+    }
+
+    // print the final result
+    // optional - you could loop here too
+    console.log(lastEvent.data.message);
+    process.exit(0);
+}
+
+async function askHuman(message: string) {
+    const readline = require('readline').createInterface({
+        input: process.stdin,
+        output: process.stdout
+    });
+
+    return new Promise((resolve) => {
+        readline.question(`${message}\n> `, (answer: string) => {
+            resolve(answer);
+        });
+    });
 }
```

```

```
npx tsx src/index.ts 'can you multiply 3 and FD*(#F&& ?'
```

lets add some tests for this behavior

```
cp walkthrough/05b-agent.baml baml_src/agent.baml
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-fpCXcL/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-fpCXcL/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-fpCXcL/new_file
@@ -115,3 +115,32 @@ test LongMath {
 }
 
 
+
+test MathOperationWithClarification {
+  functions [DetermineNextStep]
+  args {
+    thread #"
+          [{"type":"user_input","data":"can you multiply 3 and feee9ff10"}]
+      "#
+  }
+  @@assert(intent, {{this.intent == "request_more_information"}})
+}
+
+test MathOperationPostClarification {
+  functions [DetermineNextStep]
+  args {
+    thread #"
+        [
+        {"type":"user_input","data":"can you multiply 3 and FD*(#F&& ?"},
+        {"type":"tool_call","data":{"intent":"request_more_information","message":"It seems like there was a typo or mistake in your request. Could you please clarify or provide the correct numbers you would like to multiply?"}},
+        {"type":"human_response","data":"lets try 12 instead"},
+      ]
+      "#
+  }
+  @@assert(intent, {{this.intent == "multiply"}})
+  @@assert(a, {{this.b == 12}})
+  @@assert(b, {{this.a == 3}})
+}
+        
+
+
```

```

```
npx baml-cli test
```

looks like we also broke our hello world test, lets fix that

```
cp walkthrough/05c-agent.baml baml_src/agent.baml
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-4Be8dG/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-4Be8dG/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-4Be8dG/new_file
@@ -46,7 +46,7 @@ test HelloWorld {
       }
     "#
   }
-  @@assert(intent, {{this.intent == "done_for_now"}})
+  @@assert(intent, {{this.intent == "request_more_information"}})
 }
 
 test MathOperation {
```

```

```
npx baml-cli test
```

```
git add . && git commit -m "add request more information and fix tests" && git show HEAD --color=always | cat
```

### chapter 6 - customize your prompt with reasoning

If we want to make our prompt event better, lets add some reasoning

```
cp walkthrough/06-agent.baml baml_src/agent.baml
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-BLGrn3/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-BLGrn3/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-BLGrn3/new_file
@@ -33,6 +33,14 @@ function DetermineNextStep(
         What should the next step be?
 
         {{ ctx.output_format }}
+
+        Always think about what to do next first, like:
+
+        - ...
+        - ...
+        - ...
+
+        {...} // schema
     "#
 }
 
@@ -141,6 +149,4 @@ test MathOperationPostClarification {
   @@assert(a, {{this.b == 12}})
   @@assert(b, {{this.a == 3}})
 }
-        
-
-
+        
\ No newline at end of file
```

```

```
npx baml-cli generate
```

>        Always think about what to do next first, like
>
>        - ...
>        - ...
>        - ...

```
git add . && git commit -m "add reasoning to agent.baml" && git show HEAD --color=always | cat
```

### chapter 7 - customize your context window

Our context windows could be better, lets 
demonstrate context window customization

- json display indent=2

```
cp walkthrough/07-agent.ts src/agent.ts
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-egHXE2/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-egHXE2/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-egHXE2/new_file
@@ -15,7 +15,7 @@ export class Thread {
     serializeForLLM() {
         // can change this to whatever custom serialization you want to do, XML, etc
         // e.g. https://github.com/got-agents/agents/blob/59ebbfa236fc376618f16ee08eb0f3bf7b698892/linear-assistant-ts/src/agent.ts#L66-L105
-        return JSON.stringify(this.events);
+        return JSON.stringify(this.events, null, 2);
     }
 }
 
```

```

```
BAML_LOG=info npx tsx src/index.ts 'can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result?'
```

mixing in xml

```
cp walkthrough/07b-agent.ts src/agent.ts
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-pa9LEU/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-pa9LEU/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-pa9LEU/new_file
@@ -13,9 +13,21 @@ export class Thread {
     }
 
     serializeForLLM() {
-        // can change this to whatever custom serialization you want to do, XML, etc
-        // e.g. https://github.com/got-agents/agents/blob/59ebbfa236fc376618f16ee08eb0f3bf7b698892/linear-assistant-ts/src/agent.ts#L66-L105
-        return JSON.stringify(this.events, null, 2);
+        return this.events.map(e => this.serializeOneEvent(e)).join("\n");
+    }
+
+    trimLeadingWhitespace(s: string) {
+        return s.replace(/^[ \t]+/gm, '');
+    }
+
+    serializeOneEvent(e: Event) {
+        return this.trimLeadingWhitespace(`
+            <${e.data?.intent || e.type}>
+            ${
+            typeof e.data !== 'object' ? e.data :
+            Object.keys(e.data).filter(k => k !== 'intent').map(k => `${k}: ${e.data[k]}`).join("\n")}
+            </${e.data?.intent || e.type}>
+        `)
     }
 }
 
```

```

```
BAML_LOG=info npx tsx src/index.ts 'can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result?'
```

updating tests

```
cp walkthrough/07c-agent.baml baml_src/agent.baml
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-tIBW0d/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-tIBW0d/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-tIBW0d/new_file
@@ -48,10 +48,9 @@ test HelloWorld {
   functions [DetermineNextStep]
   args {
     thread #"
-      {
-        "type": "user_input",
-        "data": "hello!"
-      }
+      <user_input>
+        hello!
+      </user_input>
     "#
   }
   @@assert(intent, {{this.intent == "request_more_information"}})
@@ -61,10 +60,9 @@ test MathOperation {
   functions [DetermineNextStep]
   args {
     thread #"
-      {
-        "type": "user_input",
-        "data": "can you multiply 3 and 4?"
-      }
+      <user_input>
+        can you multiply 3 and 4?
+      </user_input>
     "#
   }
   @@assert(intent, {{this.intent == "multiply"}})
@@ -74,48 +72,43 @@ test LongMath {
   functions [DetermineNextStep]
   args {
     thread #"
-      [
-        {
-          "type": "user_input",
-          "data": "can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result?"
-        },
-        {
-          "type": "tool_call",
-          "data": {
-            "intent": "multiply",
-            "a": 3,
-            "b": 4
-          }
-        },
-        {
-          "type": "tool_response",
-          "data": 12
-        },
-        {
-          "type": "tool_call", 
-          "data": {
-            "intent": "divide",
-            "a": 12,
-            "b": 2
-          }
-        },
-        {
-          "type": "tool_response",
-          "data": 6
-        },
-        {
-          "type": "tool_call",
-          "data": {
-            "intent": "add", 
-            "a": 6,
-            "b": 12
-          }
-        },
-        {
-          "type": "tool_response",
-          "data": 18
-        }
-      ]
+         <user_input>
+    can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result?
+    </user_input>
+
+
+    <multiply>
+    a: 3
+    b: 4
+    </multiply>
+
+
+    <tool_response>
+    12
+    </tool_response>
+
+
+    <divide>
+    a: 12
+    b: 2
+    </divide>
+
+
+    <tool_response>
+    6
+    </tool_response>
+
+
+    <add>
+    a: 6
+    b: 12
+    </add>
+
+
+    <tool_response>
+    18
+    </tool_response>
+
     "#
   }
   @@assert(intent, {{this.intent == "done_for_now"}})
@@ -128,7 +121,9 @@ test MathOperationWithClarification {
   functions [DetermineNextStep]
   args {
     thread #"
-          [{"type":"user_input","data":"can you multiply 3 and feee9ff10"}]
+          <user_input>
+          can you multiply 3 and fe1iiaff10
+          </user_input>
       "#
   }
   @@assert(intent, {{this.intent == "request_more_information"}})
@@ -138,15 +133,21 @@ test MathOperationPostClarification {
   functions [DetermineNextStep]
   args {
     thread #"
-        [
-        {"type":"user_input","data":"can you multiply 3 and FD*(#F&& ?"},
-        {"type":"tool_call","data":{"intent":"request_more_information","message":"It seems like there was a typo or mistake in your request. Could you please clarify or provide the correct numbers you would like to multiply?"}},
-        {"type":"human_response","data":"lets try 12 instead"},
-      ]
+        <user_input>
+        can you multiply 3 and FD*(#F&& ?
+        </user_input>
+
+        <request_more_information>
+        message: It seems like there was a typo or mistake in your request. Could you please clarify or provide the correct numbers you would like to multiply?
+        </request_more_information>
+
+        <human_response>
+        lets try 12 instead
+        </human_response>
       "#
   }
   @@assert(intent, {{this.intent == "multiply"}})
-  @@assert(a, {{this.b == 12}})
   @@assert(b, {{this.a == 3}})
+  @@assert(a, {{this.b == 12}})
 }
         
\ No newline at end of file
```

```

```
npx baml-cli test
```

### chapter 8 - adding api endpoints

First, let's add the required dependencies:

```bash
npm install express && npm install --save-dev @types/express supertest
```

Now let's create our API server:

```bash
cp walkthrough/08-server.ts src/server.ts
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-elBbCE/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-elBbCE/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-elBbCE/new_file
@@ -1,101 +1,23 @@
 import express from 'express';
-import { Thread, agentLoop, handleNextStep } from '../src/agent';
-import { ThreadStore } from '../src/state';
+import { Thread, agentLoop } from '../src/agent';
 
 const app = express();
 app.use(express.json());
 
-const store = new ThreadStore();
-
 // POST /thread - Start new thread
 app.post('/thread', async (req, res) => {
     const thread = new Thread([{
         type: "user_input",
         data: req.body.message
     }]);
-    
-    const threadId = store.create(thread);
-    const newThread = await agentLoop(thread);
-    
-    store.update(threadId, newThread);
-
-    const lastEvent = newThread.events[newThread.events.length - 1];
-    // If we exited the loop, include the response URL so the client can
-    // push a new message onto the thread
-    lastEvent.data.response_url = `/thread/${threadId}/response`;
-
-    res.json({ 
-        thread_id: threadId,
-        ...newThread 
-    });
+    const result = await agentLoop(thread);
+    res.json(result);
 });
 
-// GET /thread/:id - Get thread status
+// GET /thread/:id - Get thread status 
 app.get('/thread/:id', (req, res) => {
-    const thread = store.get(req.params.id);
-    if (!thread) {
-        return res.status(404).json({ error: "Thread not found" });
-    }
-    res.json(thread);
-});
-
-
-type ApprovalPayload = {
-    type: "approval";
-    approved: boolean;
-    comment?: string;
-}
-
-type ResponsePayload = {
-    type: "response";
-    response: string;
-}
-
-type Payload = ApprovalPayload | ResponsePayload;
-
-// POST /thread/:id/response - Handle clarification response
-app.post('/thread/:id/response', async (req, res) => {
-    const thread = store.get(req.params.id);
-    if (!thread) {
-        return res.status(404).json({ error: "Thread not found" });
-    }
-
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
-    } else if (thread.awaitingHumanApproval() && body.type === 'approval' && !body.approved) {
-        // approved, run the tool, pushing results onto the thread
-        await handleNextStep(lastEvent, thread);
-    } else {
-        res.status(400).json({
-            error: "Invalid request: " + body.type,
-            awaitingHumanResponse: thread.awaitingHumanResponse(),
-            awaitingHumanApproval: thread.awaitingHumanApproval()
-        });
-    }
-
-    
-    // loop until stop event
-    const result = await agentLoop(thread);
-
-    store.update(req.params.id, result);
-
-    lastEvent = result.events[result.events.length - 1];
-    lastEvent.data.response_url = `/thread/${req.params.id}/response`;
-    
-    res.json(result);
+    // optional - add state
+    res.status(404).json({ error: "Not implemented yet" });
 });
 
 const port = process.env.PORT || 3000;
```

```

You can now start the server:

```bash
npx tsx src/server.ts
```

And in another terminal, you can try it out:

```bash
curl -X POST http://localhost:3000/thread \
  -H "Content-Type: application/json" \
  -d '{"message":"can you add 3 and 4?"}'
```

Run the tests:

```
git add . && git commit -m "add api endpoints" && git show HEAD --color=always | cat
```

### chapter 9 - in-memory state and async clarification

Now let's add state management and async clarification support:

```bash
cp walkthrough/09-state.ts src/state.ts
```diff
```

```

```bash
cp walkthrough/09-server.ts src/server.ts
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-2rYLe7/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-2rYLe7/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-2rYLe7/new_file
@@ -1,23 +1,66 @@
 import express from 'express';
 import { Thread, agentLoop } from '../src/agent';
+import { ThreadStore } from '../src/state';
 
 const app = express();
 app.use(express.json());
 
+const store = new ThreadStore();
+
 // POST /thread - Start new thread
 app.post('/thread', async (req, res) => {
     const thread = new Thread([{
         type: "user_input",
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
 
-// GET /thread/:id - Get thread status 
+// GET /thread/:id - Get thread status
 app.get('/thread/:id', (req, res) => {
-    // optional - add state
-    res.status(404).json({ error: "Not implemented yet" });
+    const thread = store.get(req.params.id);
+    if (!thread) {
+        return res.status(404).json({ error: "Thread not found" });
+    }
+    res.json(thread);
+});
+
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
 });
 
 const port = process.env.PORT || 3000;
```

```

Try out the clarification flow:

```bash
# Start a thread with unclear input
curl -X POST http://localhost:3000/thread \
  -H "Content-Type: application/json" \
  -d '{"message":"can you multiply 3 and xyz?"}'
```

```bash
# You'll get back a response with a response_url - use that URL to send clarification
curl -X POST 'http://localhost:3000/thread/{thread_id}/response' \
  -H "Content-Type: application/json" \
  -d '{"message":"lets use 5 instead of xyz"}'
```

### chapter 10 - adding human approval

```
cp walkthrough/10-server.ts src/server.ts
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-v2mrGk/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-v2mrGk/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-v2mrGk/new_file
@@ -1,5 +1,5 @@
 import express from 'express';
-import { Thread, agentLoop } from '../src/agent';
+import { Thread, agentLoop, handleNextStep } from '../src/agent';
 import { ThreadStore } from '../src/state';
 
 const app = express();
@@ -15,18 +15,18 @@ app.post('/thread', async (req, res) => {
     }]);
     
     const threadId = store.create(thread);
-    const result = await agentLoop(thread);
-    
-    // If clarification is needed, include the response URL
-    const lastEvent = result.events[result.events.length - 1];
-    if (lastEvent.data.intent === 'request_more_information') {
-        lastEvent.data.response_url = `/thread/${threadId}/response`;
-    }
+    const newThread = await agentLoop(thread);
     
-    store.update(threadId, result);
+    store.update(threadId, newThread);
+
+    const lastEvent = newThread.events[newThread.events.length - 1];
+    // If we exited the loop, include the response URL so the client can
+    // push a new message onto the thread
+    lastEvent.data.response_url = `/thread/${threadId}/response`;
+
     res.json({ 
         thread_id: threadId,
-        ...result 
+        ...newThread 
     });
 });
 
@@ -39,27 +39,62 @@ app.get('/thread/:id', (req, res) => {
     res.json(thread);
 });
 
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
 // POST /thread/:id/response - Handle clarification response
 app.post('/thread/:id/response', async (req, res) => {
     const thread = store.get(req.params.id);
     if (!thread) {
         return res.status(404).json({ error: "Thread not found" });
     }
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
     }
+
     
+    // loop until stop event
+    const result = await agentLoop(thread);
+
     store.update(req.params.id, result);
+
+    lastEvent = result.events[result.events.length - 1];
+    lastEvent.data.response_url = `/thread/${req.params.id}/response`;
+    
     res.json(result);
 });
 
```

```

```
cp walkthrough/10-agent.ts src/agent.ts
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-1enCqw/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-1enCqw/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-1enCqw/new_file
@@ -29,6 +29,16 @@ export class Thread {
             </${e.data?.intent || e.type}>
         `)
     }
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
 }
 
 export type CalculatorTool = AddTool | SubtractTool | MultiplyTool | DivideTool;
@@ -87,10 +97,12 @@ export async function agentLoop(thread: Thread): Promise<Thread> {
             case "request_more_information":
                 // response to human, return the thread
                 return thread;
+            case "divide":
+                // divide is scary, return it for human approval
+                return thread;
             case "add":
             case "subtract":
             case "multiply":
-            case "divide":
                 thread = await handleNextStep(nextStep, thread);
         }
     }
```

```

```
npx tsx src/server.ts
```

```
curl -X POST http://localhost:3000/thread \
  -H "Content-Type: application/json" \
  -d '{"message":"can you divide 3 by 4?"}'
```

then reply with a rejection

```
curl -X POST 'http://localhost:3000/thread/{thread_id}/response' \
  -H "Content-Type: application/json" \
  -d '{"approved": false, comment: "lets use 5 instead of 4"}'
```

when the next operation comes back, approve it

```
curl -X POST 'http://localhost:3000/thread/{thread_id}/response' \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'
```

### chapter 11 - human approval with humanlayer

head over the https://humanlayer.dev and get your api key

get your humanlayer api key and use your personal email for approvals

```
export HUMANLAYER_API_KEY=your_api_key && export HUMANLAYER_EMAIL=your_email@example.com
```

install humanlayer

```
npm install humanlayer
```

```
cp walkthrough/11-agent.ts src/agent.ts
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-QHkl42/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-QHkl42/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-QHkl42/new_file
@@ -95,7 +95,7 @@ export async function agentLoop(thread: Thread): Promise<Thread> {
         switch (nextStep.intent) {
             case "done_for_now":
             case "request_more_information":
-                // response to human, return the thread
+                // response to human, return the next step object
                 return thread;
             case "divide":
                 // divide is scary, return it for human approval
```

```

```
cp walkthrough/11-cli.ts src/cli.ts
```diff
:100644 100644 0000000 0000000 M	/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-FfIaQh/old_file

--- a/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-FfIaQh/old_file
+++ b/var/folders/38/3tndpln553v6d6xs9pfy69s40000gn/T/diff-FfIaQh/new_file
@@ -1,9 +1,8 @@
 // cli.ts lets you invoke the agent loop from the command line
 
+import { humanlayer } from "humanlayer";
 import { agentLoop, Thread, Event } from "../src/agent";
 
-
-
 export async function cli() {
     // Get command line arguments, skipping the first two (node and script name)
     const args = process.argv.slice(2);
@@ -20,23 +19,38 @@ export async function cli() {
     const thread = new Thread([{ type: "user_input", data: message }]);
 
     // Run the agent loop with the thread
-    const result = await agentLoop(thread);
-    let lastEvent = result.events.slice(-1)[0];
-
-    while (lastEvent.data.intent === "request_more_information") {
-        const message = await askHuman(lastEvent.data.message);
-        thread.events.push({ type: "human_response", data: message });
-        const result = await agentLoop(thread);
-        lastEvent = result.events.slice(-1)[0];
+    let newThread = await agentLoop(thread);
+    let lastEvent = newThread.events.slice(-1)[0];
+
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
     }
 
     // print the final result
-    // optional - you could loop here too
+    // optional - you could loop here too 
     console.log(lastEvent.data.message);
     process.exit(0);
 }
 
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
     const readline = require('readline').createInterface({
         input: process.stdin,
         output: process.stdout
@@ -44,7 +58,63 @@ async function askHuman(message: string) {
 
     return new Promise((resolve) => {
         readline.question(`${message}\n> `, (answer: string) => {
-            resolve(answer);
+            resolve({ type: "human_response", data: answer });
         });
     });
 }
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
\ No newline at end of file
```

```

customize the email template


### chapter 12 - human approval with humanlayer (async)


### chapter 13 - launching new requests with an email



### exercises

launch jobs over slack



### cleaning up

```
rm src/*.ts && rm -r baml_src
```

```
git add . && git commit -m "clean up" && git show HEAD --color=always | cat
```