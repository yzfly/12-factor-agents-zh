# Building the 12-factor agent template from scratch

Steps to start from a bare TS repo and build up a 12-factor agent. This walkthrough will guide you through creating a TypeScript agent that follows the 12-factor methodology.

## Cleanup

Make sure you're starting from a clean slate

Clean up existing files

    rm -rf baml_src/ && rm -rf src/

## Chapter 0 - Hello World

Let's start with a basic TypeScript setup and a hello world program.

Copy initial package.json

    cp ./walkthrough/00-package.json package.json

<details>
<summary>show file</summary>

```json
// ./walkthrough/00-package.json
{
    "name": "my-agent",
    "version": "0.1.0",
    "private": true,
    "scripts": {
      "dev": "tsx src/index.ts",
      "build": "tsc"
    },
    "dependencies": {
      "tsx": "^4.15.0",
      "typescript": "^5.0.0"
    },
    "devDependencies": {
      "@types/node": "^20.0.0",
      "@typescript-eslint/eslint-plugin": "^6.0.0",
      "@typescript-eslint/parser": "^6.0.0",
      "eslint": "^8.0.0"
    }
  }
```

</details>

Install dependencies

    npm install

Copy tsconfig.json

    cp ./walkthrough/00-tsconfig.json tsconfig.json

<details>
<summary>show file</summary>

```json
// ./walkthrough/00-tsconfig.json
{
    "compilerOptions": {
      "target": "ES2017",
      "lib": ["esnext"],
      "allowJs": true,
      "skipLibCheck": true,
      "strict": true,
      "noEmit": true,
      "esModuleInterop": true,
      "module": "esnext",
      "moduleResolution": "bundler",
      "resolveJsonModule": true,
      "isolatedModules": true,
      "jsx": "preserve",
      "incremental": true,
      "plugins": [],
      "paths": {
        "@/*": ["./*"]
      }
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules", "walkthrough"]
  }
```

</details>

add .gitignore

    cp ./walkthrough/00-.gitignore .gitignore

<details>
<summary>show file</summary>

```gitignore
// ./walkthrough/00-.gitignore
baml_src/
node_modules/
```

</details>

Create src folder

Add a simple hello world index.ts

    cp ./walkthrough/01-index.ts src/index.ts

<details>
<summary>show file</summary>

```ts
// ./walkthrough/01-index.ts
import { cli } from "./cli"

async function hello(): Promise<void> {
    console.log('hello, world!')
}

async function main() {
    await cli()
}

main().catch(console.error)
```

</details>

Run it to verify

    npx tsx src/index.ts

You should see:

    hello, world!

## Chapter 1 - CLI and Agent Loop

Now let's add BAML and create our first agent with a CLI interface.

Install BAML

    npm i baml

Initialize BAML

    npx baml-cli init

Remove default resume.baml

    rm baml_src/resume.baml

Add our starter agent

    cp ./walkthrough/01-agent.baml baml_src/agent.baml

<details>
<summary>show file</summary>

```rust
// ./walkthrough/01-agent.baml
class DoneForNow {
  intent "done_for_now"
  message string 
}

function DetermineNextStep(
    thread: string 
) -> DoneForNow {
    client "openai/gpt-4o"

    prompt #"
        {{ _.role("system") }}

        You are a helpful assistant that can help with tasks.

        {{ _.role("user") }}

        You are working on the following thread:

        {{ thread }}

        What should the next step be?

        {{ ctx.output_format }}
    "#
}

test HelloWorld {
  functions [DetermineNextStep]
  args {
    thread #"
      {
        "type": "user_input",
        "data": "hello!"
      }
    "#
  }
}
```

</details>

Generate BAML client code

    npx baml-cli generate

Enable BAML logging for development

    export BAML_LOG=debug

Add the CLI interface

    cp ./walkthrough/01-cli.ts src/cli.ts

<details>
<summary>show file</summary>

```ts
// ./walkthrough/01-cli.ts
// cli.ts lets you invoke the agent loop from the command line

import { agentLoop, Thread, Event } from "./agent";

export async function cli() {
    // Get command line arguments, skipping the first two (node and script name)
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error("Error: Please provide a message as a command line argument");
        process.exit(1);
    }

    // Join all arguments into a single message
    const message = args.join(" ");

    // Create a new thread with the user's message as the initial event
    const thread = new Thread([{ type: "user_input", data: message }]);

    // Run the agent loop with the thread
    const result = await agentLoop(thread);
    console.log(result);
}
```

</details>

Update index.ts to use the CLI

    cp ./walkthrough/01-index.ts src/index.ts

<details>
<summary>show file</summary>

```ts
// ./walkthrough/01-index.ts
import { cli } from "./cli"

async function hello(): Promise<void> {
    console.log('hello, world!')
}

async function main() {
    await cli()
}

main().catch(console.error)
```

</details>

Add the agent implementation

    cp ./walkthrough/01-agent.ts src/agent.ts

<details>
<summary>show file</summary>

```ts
// ./walkthrough/01-agent.ts
import { b } from "../baml_client";

// tool call or a respond to human tool
type AgentResponse = Awaited<ReturnType<typeof b.DetermineNextStep>>;

export interface Event {
    type: string
    data: any;
}

export class Thread {
    events: Event[] = [];

    constructor(events: Event[]) {
        this.events = events;
    }

    serializeForLLM() {
        // can change this to whatever custom serialization you want to do, XML, etc
        // e.g. https://github.com/got-agents/agents/blob/59ebbfa236fc376618f16ee08eb0f3bf7b698892/linear-assistant-ts/src/agent.ts#L66-L105
        return JSON.stringify(this.events);
    }
}

// right now this just runs one turn with the LLM, but
// we'll update this function to handle all the agent logic
export async function agentLoop(thread: Thread): Promise<AgentResponse> {
    const nextStep = await b.DetermineNextStep(thread.serializeForLLM());
    return nextStep;
}
```

</details>

Try it out

    npx tsx src/index.ts hello

## Chapter 2 - Add Calculator Tools

Let's add some calculator tools to our agent.

Add calculator tools definition

    cp ./walkthrough/02-tool_calculator.baml baml_src/tool_calculator.baml

<details>
<summary>show file</summary>

```rust
// ./walkthrough/02-tool_calculator.baml
type CalculatorTools = AddTool | SubtractTool | MultiplyTool | DivideTool


class AddTool {
    intent "add"
    a int | float
    b int | float
}

class SubtractTool {
    intent "subtract"
    a int | float
    b int | float
}

class MultiplyTool {
    intent "multiply"
    a int | float
    b int | float
}

class DivideTool {
    intent "divide"
    a int | float
    b int | float
}
```

</details>

Update agent to use calculator tools

```diff
baml_src/agent.baml
-) -> DoneForNow {
+) -> CalculatorTools | DoneForNow {
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/02-agent.baml baml_src/agent.baml

</details>

Generate updated BAML client

    npx baml-cli generate

Try out the calculator

    npx tsx src/index.ts 'can you add 3 and 4?'

## Chapter 3 - Process Tool Calls in a Loop

Now let's add a real agentic loop that can run the tools and get a final answer from the LLM.

Update agent with tool handling

```diff
src/agent.ts
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
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/03-agent.ts src/agent.ts

</details>

Try a simple calculation

    npx tsx src/index.ts 'can you add 3 and 4?'

Turn off BAML logs for cleaner output

    export BAML_LOG=off

Try a multi-step calculation

    npx tsx src/index.ts 'can you add 3 and 4, then add 6 to that result?'

Add handlers for all calculator tools

```diff
src/agent.ts
-import { b } from "../baml_client";
+import { AddTool, SubtractTool, DivideTool, MultiplyTool, b } from "../baml_client";
-// tool call or a respond to human tool
-type AgentResponse = Awaited<ReturnType<typeof b.DetermineNextStep>>;
-
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
+        thread.events.push({
+            "type": "tool_call",
+            "data": nextStep
+        });
+
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
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/03b-agent.ts src/agent.ts

</details>

Test subtraction

    npx tsx src/index.ts 'can you subtract 3 from 4?'

Test multiplication

    npx tsx src/index.ts 'can you multiply 3 and 4?'

Test a complex calculation

    npx tsx src/index.ts 'can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result?'

## Chapter 4 - Add Tests to agent.baml

Let's add some tests to our BAML agent.

Update agent with tests

```diff
baml_src/agent.baml
-}
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

<details>
<summary>skip this step</summary>

    cp ./walkthrough/04-agent.baml baml_src/agent.baml

</details>

Run the tests

    npx baml-cli test

Add more complex test cases

```diff
baml_src/agent.baml
+  @@assert(intent, {{this.intent == "done_for_now"}})
+  @@assert(intent, {{this.intent == "multiply"}})
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
+}
+
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/04c-agent.baml baml_src/agent.baml

</details>

Run the expanded test suite

    npx baml-cli test

## Chapter 5 - Multiple Human Tools

Add support for requesting clarification from humans.

Update agent with clarification support

```diff
baml_src/agent.baml
+// human tools are async requests to a human
+type HumanTools = ClarificationRequest | DoneForNow
+
+class ClarificationRequest {
+  intent "request_more_information" @description("you can request more information from me")
+  message string
+}
+
-  message string 
+
+  message string @description(#"
+    message to send to the user about the work that was done. 
+  "#)
-) -> CalculatorTools | DoneForNow {
+) -> HumanTools | CalculatorTools {
+
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/05-agent.baml baml_src/agent.baml

</details>

Generate updated client

    npx baml-cli generate

Update agent implementation

```diff
src/agent.ts
-export async function agentLoop(thread: Thread): Promise<string> {
+export async function agentLoop(thread: Thread): Promise<Thread> {
-                // response to human, return the next step object
-                return nextStep.message;
+            case "request_more_information":
+                // response to human, return the thread
+                return thread;
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/05-agent.ts src/agent.ts

</details>

Update CLI to handle clarification requests

```diff
src/cli.ts
-import { agentLoop, Thread, Event } from "./agent";
+import { agentLoop, Thread, Event } from "../src/agent";
+
+
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
+}
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/05-cli.ts src/cli.ts

</details>

Test clarification flow

    npx tsx src/index.ts 'can you multiply 3 and FD*(#F&& ?'

Add tests for clarification

```diff
baml_src/agent.baml
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

<details>
<summary>skip this step</summary>

    cp ./walkthrough/05b-agent.baml baml_src/agent.baml

</details>

Run the tests

    npx baml-cli test

Fix hello world test

```diff
baml_src/agent.baml
-  @@assert(intent, {{this.intent == "done_for_now"}})
+  @@assert(intent, {{this.intent == "request_more_information"}})
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/05c-agent.baml baml_src/agent.baml

</details>

Verify tests pass

    npx baml-cli test

## Chapter 6 - Customize Your Prompt with Reasoning

Improve the agent's prompting by adding reasoning steps.

Update agent with reasoning steps

```diff
baml_src/agent.baml
+
+        Always think about what to do next first, like:
+
+        - ...
+        - ...
+        - ...
+
+        {...} // schema
-        
-
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/06-agent.baml baml_src/agent.baml

</details>

Generate updated client

    npx baml-cli generate

## Chapter 7 - Customize Your Context Window

Improve the context window formatting.

Update agent with better JSON formatting

```diff
src/agent.ts
-        return JSON.stringify(this.events);
+        return JSON.stringify(this.events, null, 2);
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/07-agent.ts src/agent.ts

</details>

Test the formatting

    BAML_LOG=info npx tsx src/index.ts 'can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result?'

Switch to XML formatting

```diff
src/agent.ts
-        // can change this to whatever custom serialization you want to do, XML, etc
-        // e.g. https://github.com/got-agents/agents/blob/59ebbfa236fc376618f16ee08eb0f3bf7b698892/linear-assistant-ts/src/agent.ts#L66-L105
-        return JSON.stringify(this.events, null, 2);
+        return this.events.map(e => this.serializeOneEvent(e)).join("\n");
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
+    }
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/07b-agent.ts src/agent.ts

</details>

Test XML formatting

    BAML_LOG=info npx tsx src/index.ts 'can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result?'

Update tests for XML format

```diff
baml_src/agent.baml
-      {
-        "type": "user_input",
-        "data": "hello!"
-      }
+      <user_input>
+        hello!
+      </user_input>
-      {
-        "type": "user_input",
-        "data": "can you multiply 3 and 4?"
-      }
+      <user_input>
+        can you multiply 3 and 4?
+      </user_input>
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
-          [{"type":"user_input","data":"can you multiply 3 and feee9ff10"}]
+          <user_input>
+          can you multiply 3 and fe1iiaff10
+          </user_input>
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
-  @@assert(a, {{this.b == 12}})
+  @@assert(a, {{this.b == 12}})
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/07c-agent.baml baml_src/agent.baml

</details>

Run the tests

    npx baml-cli test

## Chapter 8 - Adding API Endpoints

Add an Express server to expose the agent via HTTP.

Install Express and types

    npm install express && npm install --save-dev @types/express supertest

Add the server implementation

    cp ./walkthrough/08-server.ts src/server.ts

<details>
<summary>show file</summary>

```ts
// ./walkthrough/08-server.ts
import express from 'express';
import { Thread, agentLoop } from '../src/agent';

const app = express();
app.use(express.json());

// POST /thread - Start new thread
app.post('/thread', async (req, res) => {
    const thread = new Thread([{
        type: "user_input",
        data: req.body.message
    }]);
    const result = await agentLoop(thread);
    res.json(result);
});

// GET /thread/:id - Get thread status 
app.get('/thread/:id', (req, res) => {
    // optional - add state
    res.status(404).json({ error: "Not implemented yet" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

export { app };
```

</details>

Start the server

    npx tsx src/server.ts

Test with curl (in another terminal)

    curl -X POST http://localhost:3000/thread \
  -H "Content-Type: application/json" \
  -d '{"message":"can you add 3 and 4?"}'

## Chapter 9 - In-Memory State and Async Clarification

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
+import { ThreadStore } from '../src/state';
+const store = new ThreadStore();
+
+    
+    const threadId = store.create(thread);
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
-    // optional - add state
-    res.status(404).json({ error: "Not implemented yet" });
+    const thread = store.get(req.params.id);
+    if (!thread) {
+        return res.status(404).json({ error: "Thread not found" });
+    }
+    res.json(thread);
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
  -d '{"message":"can you multiply 3 and xyz?"}'

## Chapter 10 - Adding Human Approval

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

## Chapter 11 - Human Approval with HumanLayer

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

## Chapter 12 - HumanLayer Webhook Integration

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

