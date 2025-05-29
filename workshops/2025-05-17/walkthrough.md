# Building the 12-factor agent template from scratch

Steps to start from a bare TS repo and build up a 12-factor agent. This walkthrough will guide you through creating a TypeScript agent that follows the 12-factor methodology.

## Cleanup

Make sure you're starting from a clean slate

Clean up existing files

    rm -rf baml_src/ && rm -rf src/

## Chapter 0 - Hello World

Let's start with a basic TypeScript setup and a hello world program.

This guide is written in TypeScript (yes, a python version is coming soon)

There are many checkpoints between the every file edit in theworkshop steps, 
so even if you aren't super familiar with typescript,
you should be able to keep up and run each example.

To run this guide, you'll need a relatively recent version of nodejs and npm installed

You can use whatever nodejs version manager you want, [homebrew](https://formulae.brew.sh/formula/node) is fine


    brew install node@20

You should see the node version

    node --version

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
baml_client/
node_modules/
```

</details>

Create src folder

Add a simple hello world index.ts

    cp ./walkthrough/00-index.ts src/index.ts

<details>
<summary>show file</summary>

```ts
// ./walkthrough/00-index.ts
async function hello(): Promise<void> {
    console.log('hello, world!')
}

async function main() {
    await hello()
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

First, we'll need to install [BAML](https://github.com/boundaryml/baml)
which is a tool for prompting and structured outputs.


    npm install @boundaryml/baml

Initialize BAML

    npx baml-cli init

Remove default resume.baml

    rm baml_src/resume.baml

Add our starter agent, a single baml prompt that we'll build on

    cp ./walkthrough/01-agent.baml baml_src/agent.baml

<details>
<summary>show file</summary>

```rust
// ./walkthrough/01-agent.baml
class DoneForNow {
  intent "done_for_now"
  message string 
}

client<llm> Qwen3 {
  provider "openai-generic"
  options {
    base_url env.BASETEN_BASE_URL
    api_key env.BASETEN_API_KEY 
  }
}

function DetermineNextStep(
    thread: string 
) -> DoneForNow {
    client Qwen3
    // client "openai/gpt-4o"

    // use /nothink for now because the thinking tokens (or streaming thereof) screw with baml (i think (no pun intended))
    prompt #"
        {{ _.role("system") }}

        /nothink 

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

Enable BAML logging for this section

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

```diff
src/index.ts
+import { cli } from "./cli"
+
 async function hello(): Promise<void> {
     console.log('hello, world!')
 
 async function main() {
-    await hello()
+    await cli()
 }
 
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/01-index.ts src/index.ts

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

The the BAML code is configured to use BASETEN_API_KEY by default

To get a Baseten API key and URL, create an account at [baseten.co](https://baseten.co),
and then deploy [Qwen3 32B from the model library](https://www.baseten.co/library/qwen-3-32b/).

```rust 
  function DetermineNextStep(thread: string) -> DoneForNow {
      client Qwen3
      // ...
```

If you want to run the example with no changes, you can set the BASETEN_API_KEY env var to any valid baseten key.

If you want to try swapping out the model, you can change the `client` line.

[Docs on baml clients can be found here](https://docs.boundaryml.com/guide/baml-basics/switching-llms)

For example, you can configure [gemini](https://docs.boundaryml.com/ref/llm-client-providers/google-ai-gemini) 
or [anthropic](https://docs.boundaryml.com/ref/llm-client-providers/anthropic) as your model provider.

For example, to use openai with an OPENAI_API_KEY, you can do:

    client "openai/gpt-4o"


Set your env vars

    export BASETEN_API_KEY=...
export BASETEN_BASE_URL=...

Try it out

    npx tsx src/index.ts hello

you should see a familiar response from the model

    {
      intent: 'done_for_now',
      message: 'Hello! How can I assist you today?'
    }

## Chapter 2 - Add Calculator Tools

Let's add some calculator tools to our agent.

Let's start by adding a tool definition for the calculator

These are simpile structured outputs that we'll ask the model to 
return as a "next step" in the agentic loop.


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

Now, let's update the agent's DetermineNextStep method to
expose the calculator tools as potential next steps


```diff
baml_src/agent.baml
 function DetermineNextStep(
     thread: string 
-) -> DoneForNow {
+) -> CalculatorTools | DoneForNow {
     client Qwen3
+
     // client "openai/gpt-4o"
 
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/02-agent.baml baml_src/agent.baml

</details>

Generate updated BAML client

    npx baml-cli generate

Try out the calculator

    npx tsx src/index.ts 'can you add 3 and 4'

You should see a tool call to the calculator

    {
      intent: 'add',
      a: 3,
      b: 4
    }

## Chapter 3 - Process Tool Calls in a Loop

Now let's add a real agentic loop that can run the tools and get a final answer from the LLM.

First, lets update the agent to handle the tool call


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

Now, lets try it out


    npx tsx src/index.ts 'can you add 3 and 4'

you should see the agent call the tool and then return the result

    {
      intent: 'done_for_now',
      message: 'The sum of 3 and 4 is 7.'
    }

For the next step, we'll do a more complex calculation, let's turn off the baml logs for more concise output

    export BAML_LOG=off

Try a multi-step calculation

    npx tsx src/index.ts 'can you add 3 and 4, then add 6 to that result'

you'll notice that tools like multiply and divide are not available

    npx tsx src/index.ts 'can you multiply 3 and 4'

next, let's add handlers for the rest of the calculator tools


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

now, let's test the multiplication tool


    npx tsx src/index.ts 'can you multiply 3 and 4'

finally, let's test a more complex calculation with multiple operations


    npx tsx src/index.ts 'can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result'

congratulations, you've taking your first step into hand-rolling an agent loop.

from here, we're going to start incorporating some more intermediate and advanced
concepts for 12-factor agents.


## Chapter 4 - Add Tests to agent.baml

Let's add some tests to our BAML agent.

to start, leave the baml logs enabled

    export BAML_LOG=debug

next, let's add some tests to the agent

We'll start with a simple test that checks the agent's ability to handle
a basic calculation.


```diff
baml_src/agent.baml
 ) -> CalculatorTools | DoneForNow {
     client Qwen3
-
     // client "openai/gpt-4o"
 
-    // use /nothink for now because the thinking tokens (or streaming thereof) screw with baml (i think (no pun intended))
     prompt #"
         {{ _.role("system") }}
 
 
         You are a helpful assistant that can help with tasks.
     "#
   }
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

now, let's improve the test with assertions!

Assertions are a great way to make sure the agent is working as expected,
and can easily be extended to check for more complex behavior.


```diff
baml_src/agent.baml
 ) -> CalculatorTools | DoneForNow {
     client Qwen3
 
     prompt #"
     "#
   }
+  @@assert(hello, {{this.intent == "done_for_now"}})
 }
 
     "#
   }
+  @@assert(math_operation, {{this.intent == "multiply"}})
 }
 
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/04b-agent.baml baml_src/agent.baml

</details>

Run the tests

    npx baml-cli test

as you add more tests, you can disable the logs to keep the output clean.
You may want to turn them on as you iterate on specific tests.


    export BAML_LOG=off

now, let's add some more complex test cases,
where we resume from in the middle of an in-progress
agentic context window


```diff
baml_src/agent.baml
   }
 }
-
 function DetermineNextStep(
     thread: string 
 ) -> CalculatorTools | DoneForNow {
     client Qwen3
+
     prompt #"
         {{ _.role("system") }}
     "#
   }
-  @@assert(hello, {{this.intent == "done_for_now"}})
+  @@assert(intent, {{this.intent == "done_for_now"}})
 }
 
     "#
   }
-  @@assert(math_operation, {{this.intent == "multiply"}})
+  @@assert(intent, {{this.intent == "multiply"}})
 }
 
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

let's try to run it


    npx baml-cli test

## Chapter 5 - Multiple Human Tools

In this section, we'll add support for multiple tools that serve to
contact humans.


for this section, we'll disable the baml logs. You can optionally enable them if you want to see more details.

    export BAML_LOG=off

first, let's add a tool that can request clarification from a human

this will be different from the "done_for_now" tool,
and can be used to more flexibly handle different types of human interactions
in your agent.


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
 class DoneForNow {
   intent "done_for_now"
-  message string 
+
+  message string @description(#"
+    message to send to the user about the work that was done. 
+  "#)
 }
 
   }
 }
+
 function DetermineNextStep(
     thread: string 
-) -> CalculatorTools | DoneForNow {
+) -> HumanTools | CalculatorTools {
     client Qwen3
 
 }
 
+
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/05-agent.baml baml_src/agent.baml

</details>

next, let's re-generate the client code

NOTE - if you're using the VSCode extension for BAML,
the client will be regenerated automatically when you save the file
in your editor.


    npx baml-cli generate

now, let's update the agent to use the new tool


```diff
src/agent.ts
 }
 
-export async function agentLoop(thread: Thread): Promise<string> {
+export async function agentLoop(thread: Thread): Promise<Thread> {
 
     while (true) {
         switch (nextStep.intent) {
             case "done_for_now":
-                // response to human, return the next step object
-                return nextStep.message;
+            case "request_more_information":
+                // response to human, return the thread
+                return thread;
             case "add":
             case "subtract":
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/05-agent.ts src/agent.ts

</details>

next, let's update the CLI to handle clarification requests
by requesting input from the user on the CLI


```diff
src/cli.ts
 // cli.ts lets you invoke the agent loop from the command line
 
-import { agentLoop, Thread, Event } from "./agent";
+import { agentLoop, Thread, Event } from "../src/agent";
 
+
+
 export async function cli() {
     // Get command line arguments, skipping the first two (node and script name)
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
 }
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

let's try it out


    npx tsx src/index.ts 'can you multiply 3 and FD*(#F&& '

next, let's add a test that checks the agent's ability to handle
a clarification request


```diff
baml_src/agent.baml
 ) -> HumanTools | CalculatorTools {
     client Qwen3
-
     // client "openai/gpt-4o"
 
 
 
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

and now we can run the tests again


    npx baml-cli test

you'll notice the new test passes, but the hello world test fails

This is because the agent's default behavior is to return "done_for_now"


```diff
baml_src/agent.baml
     api_key env.BASETEN_API_KEY 
   }
 
 function DetermineNextStep(
 ) -> HumanTools | CalculatorTools {
     client Qwen3
+
     // client "openai/gpt-4o"
 
     "#
   }
-  @@assert(intent, {{this.intent == "done_for_now"}})
+  @@assert(intent, {{this.intent == "request_more_information"}})
 }
 
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/05c-agent.baml baml_src/agent.baml

</details>

Verify tests pass

    npx baml-cli test

## Chapter 6 - Customize Your Prompt with Reasoning

In this section, we'll explore how to customize the prompt of the agent
with reasoning steps.

this is core to [factor 2 - own your prompts](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-2-own-your-prompts.md)

there's a deep dive on reasoning on AI That Works [reasoning models versus reasoning steps](https://github.com/hellovai/ai-that-works/tree/main/2025-04-07-reasoning-models-vs-prompts)


for this section, it will be helpful to leave the baml logs enabled

    export BAML_LOG=debug

update the agent prompt to include a reasoning step


```diff
baml_src/agent.baml
     api_key env.BASETEN_API_KEY 
   }
 
 function DetermineNextStep(
 
         {{ ctx.output_format }}
+
+        First, always plan out what to do next, for example:
+
+        - ...
+        - ...
+        - ...
+
+        {...} // schema
     "#
 }
   @@assert(b, {{this.a == 3}})
 }
-        
-
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/06-agent.baml baml_src/agent.baml

</details>

generate the updated client

    npx baml-cli generate

now, you can try it out with a simple prompt


    npx tsx src/index.ts 'can you multiply 3 and 4'

you should see output from the baml logs showing the reasoning steps

#### optional challenge

add a field to your tool output format that includes the reasoning steps in the output!


## Chapter 7 - Customize Your Context Window

In this section, we'll explore how to customize the context window
of the agent.

this is core to [factor 3 - own your context window](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-3-own-your-context-window.md)


update the agent to pretty-print the Context window for the model


```diff
src/agent.ts
         // can change this to whatever custom serialization you want to do, XML, etc
         // e.g. https://github.com/got-agents/agents/blob/59ebbfa236fc376618f16ee08eb0f3bf7b698892/linear-assistant-ts/src/agent.ts#L66-L105
-        return JSON.stringify(this.events);
+        return JSON.stringify(this.events, null, 2);
     }
 }
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/07-agent.ts src/agent.ts

</details>

Test the formatting

    BAML_LOG=info npx tsx src/index.ts 'can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result'

next, let's update the agent to use XML formatting instead

this is a very popular format for passing data to a model,

among other things, because of the token efficiency of XML.


```diff
src/agent.ts
 
     serializeForLLM() {
-        // can change this to whatever custom serialization you want to do, XML, etc
-        // e.g. https://github.com/got-agents/agents/blob/59ebbfa236fc376618f16ee08eb0f3bf7b698892/linear-assistant-ts/src/agent.ts#L66-L105
-        return JSON.stringify(this.events, null, 2);
+        return this.events.map(e => this.serializeOneEvent(e)).join("\n");
     }
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
 }
 
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/07b-agent.ts src/agent.ts

</details>

let's try it out


    BAML_LOG=info npx tsx src/index.ts 'can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result'

lets update our tests to match the new output format


```diff
baml_src/agent.baml
         {{ ctx.output_format }}
 
-        First, always plan out what to do next, for example:
+        Always think about what to do next first, like:
 
         - ...
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
   args {
     thread #"
-          [{"type":"user_input","data":"can you multiply 3 and feee9ff10"}]
+          <user_input>
+          can you multiply 3 and fe1iiaff10
+          </user_input>
       "#
   }
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
 }
         
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/07c-agent.baml baml_src/agent.baml

</details>

check out the updated tests


    npx baml-cli test

## Chapter 8 - Adding API Endpoints

Add an Express server to expose the agent via HTTP.

for this section, we'll disable the baml logs. You can optionally enable them if you want to see more details.

    export BAML_LOG=off

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
app.set('json spaces', 2);

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
  -d '{"message":"can you add 3 and 4"}'

You should get an answer from the agent which includes the
agentic trace, ending in a message like:


    {"intent":"done_for_now","message":"The sum of 3 and 4 is 7."}

## Chapter 9 - In-Memory State and Async Clarification

Add state management and async clarification support.

for this section, we'll disable the baml logs. You can optionally enable them if you want to see more details.

    export BAML_LOG=off

Add some simple in-memory state management for threads

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

update the server to use the state management

* Add thread state management using `ThreadStore`
* return thread IDs and response URLs from the /thread endpoint
* implement GET /thread/:id
* implement POST /thread/:id/response


```diff
src/server.ts
 import express from 'express';
 import { Thread, agentLoop } from '../src/agent';
+import { ThreadStore } from '../src/state';
 
 const app = express();
 app.set('json spaces', 2);
 
+const store = new ThreadStore();
+
 // POST /thread - Start new thread
 app.post('/thread', async (req, res) => {
         data: req.body.message
     }]);
-    const result = await agentLoop(thread);
-    res.json(result);
+    
+    const threadId = store.create(thread);
+    const newThread = await agentLoop(thread);
+    
+    store.update(threadId, newThread);
+
+    const lastEvent = newThread.events[newThread.events.length - 1];
+    // If we exited the loop, include the response URL so the client can
+    // push a new message onto the thread
+    lastEvent.data.response_url = `/thread/${threadId}/response`;
+
+    console.log("returning last event from endpoint", lastEvent);
+
+    res.json({ 
+        thread_id: threadId,
+        ...newThread 
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
+    let thread = store.get(req.params.id);
+    if (!thread) {
+        return res.status(404).json({ error: "Thread not found" });
+    }
+    
+    thread.events.push({
+        type: "human_response",
+        data: req.body.message
+    });
+    
+    // loop until stop event
+    const newThread = await agentLoop(thread);
+    
+    store.update(req.params.id, newThread);
+
+    const lastEvent = newThread.events[newThread.events.length - 1];
+    lastEvent.data.response_url = `/thread/${req.params.id}/response`;
+
+    console.log("returning last event from endpoint", lastEvent);
+    
+    res.json(newThread);
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

## Chapter 10 - Adding Human Approval

Add support for human approval of operations.

for this section, we'll disable the baml logs. You can optionally enable them if you want to see more details.

    export BAML_LOG=off

update the server to handle human approvals

* Import `handleNextStep` to execute approved actions
* Add two payload types to distinguish approvals from responses
* Handle responses and approvals differently in the endpoint
* Show better error messages when things go wrongs


```diff
src/server.ts
 import express from 'express';
-import { Thread, agentLoop } from '../src/agent';
+import { Thread, agentLoop, handleNextStep } from '../src/agent';
 import { ThreadStore } from '../src/state';
 
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
         return res.status(404).json({ error: "Thread not found" });
     }
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
+    } else if (thread.awaitingHumanApproval() && body.type === 'approval' && body.approved) {
+        // approved, run the tool, pushing results onto the thread
+        await handleNextStep(lastEvent.data, thread);
+    } else {
+        res.status(400).json({
+            error: "Invalid request: " + body.type,
+            awaitingHumanResponse: thread.awaitingHumanResponse(),
+            awaitingHumanApproval: thread.awaitingHumanApproval()
+        });
+        return;
+    }
+
     
-    thread.events.push({
-        type: "human_response",
-        data: req.body.message
-    });
-    
     // loop until stop event
     const newThread = await agentLoop(thread);
     store.update(req.params.id, newThread);
 
-    const lastEvent = newThread.events[newThread.events.length - 1];
+    lastEvent = newThread.events[newThread.events.length - 1];
     lastEvent.data.response_url = `/thread/${req.params.id}/response`;
 
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/10-server.ts src/server.ts

</details>

Add a few methods to the agent to handle approvals and responses

```diff
src/agent.ts
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
  -d '{"message":"can you divide 3 by 4"}'

You should see:

    {
      "thread_id": "2b243b66-215a-4f37-8bc6-9ace3849043b",
      "events": [
        {
          "type": "user_input",
          "data": "can you divide 3 by 4"
        },
        {
          "type": "tool_call",
          "data": {
            "intent": "divide",
            "a": 3,
            "b": 4,
            "response_url": "/thread/2b243b66-215a-4f37-8bc6-9ace3849043b/response"
          }
        }
      ]
    }

reject the request with another curl call, changing the thread ID

    curl -X POST 'http://localhost:3000/thread/{thread_id}/response' \
  -H "Content-Type: application/json" \
  -d '{"type": "approval", "approved": false, "comment": "I dont think thats right, use 5 instead of 4"}'

You should see: the last tool call is now `"intent":"divide","a":3,"b":5`

    {
      "events": [
        {
          "type": "user_input",
          "data": "can you divide 3 by 4"
        },
        {
          "type": "tool_call",
          "data": {
            "intent": "divide",
            "a": 3,
            "b": 4,
            "response_url": "/thread/2b243b66-215a-4f37-8bc6-9ace3849043b/response"
          }
        },
        {
          "type": "tool_response",
          "data": "user denied the operation with feedback: \"I dont think thats right, use 5 instead of 4\""
        },
        {
          "type": "tool_call",
          "data": {
            "intent": "divide",
            "a": 3,
            "b": 5,
            "response_url": "/thread/1f1f5ff5-20d7-4114-97b4-3fc52d5e0816/response"
          }
        }
      ]
    }

now you can approve the operation

    curl -X POST 'http://localhost:3000/thread/{thread_id}/response' \
  -H "Content-Type: application/json" \
  -d '{"type": "approval", "approved": true}'

you should see the final message includes the tool response and final result!

    ...
    {
      "type": "tool_response",
      "data": 0.5
    },
    {
      "type": "done_for_now",
      "message": "I divided 3 by 6 and the result is 0.5. If you have any more operations or queries, feel free to ask!",
      "response_url": "/thread/2b469403-c497-4797-b253-043aae830209/response"
    }

## Chapter 11 - Human Approvals over email

in this section, we'll add support for human approvals over email.

This will start a little bit contrived, just to get the concepts down -

We'll start by invoking the workflow from the CLI but approvals for `divide`
and `request_more_information` will be handled over email,
then the final `done_for_now` answer will be printed back to the CLI

While contrived, this is a great example of the flexibility you get from
[factor 7 - contact humans with tools](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-7-contact-humans-with-tools.md)


for this section, we'll disable the baml logs. You can optionally enable them if you want to see more details.

    export BAML_LOG=off

Install HumanLayer

    npm install humanlayer

Update CLI to send `divide` and `request_more_information` to a human via email

```diff
src/cli.ts
 // cli.ts lets you invoke the agent loop from the command line
 
+import { humanlayer } from "humanlayer";
 import { agentLoop, Thread, Event } from "../src/agent";
 
-
-
 export async function cli() {
     // Get command line arguments, skipping the first two (node and script name)
 
     // Run the agent loop with the thread
-    const result = await agentLoop(thread);
-    let lastEvent = result.events.slice(-1)[0];
+    let newThread = await agentLoop(thread);
+    let lastEvent = newThread.events.slice(-1)[0];
 
-    while (lastEvent.data.intent === "request_more_information") {
-        const message = await askHuman(lastEvent.data.message);
-        thread.events.push({ type: "human_response", data: message });
-        const result = await agentLoop(thread);
-        lastEvent = result.events.slice(-1)[0];
+    while (lastEvent.data.intent !== "done_for_now") {
+        const responseEvent = await askHuman(lastEvent);
+        thread.events.push(responseEvent);
+        newThread = await agentLoop(thread);
+        lastEvent = newThread.events.slice(-1)[0];
     }
 
     // print the final result
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
+        runId: "12fa-cli-agent",
+        verbose: true,
+        contactChannel: {
+            // agent should request permission via email
+            email: {
+                address: process.env.HUMANLAYER_EMAIL,
+            }
+        }
+    }) 
+
+    if (lastEvent.data.intent === "divide") {
+        // fetch approval synchronously - this will block until reply
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
+                "data": `user denied operation ${lastEvent.data.intent}
+                with feedback: ${response.comment}`
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

    npx tsx src/index.ts 'can you divide 4 by 5'

The last line of your program should mention human review step

    nextStep { intent: 'divide', a: 4, b: 5 }
    HumanLayer: Requested human approval from HumanLayer cloud

go ahead and respond to the email with some feedback:

![reject-email](https://github.com/humanlayer/12-factor-agents/blob/main/workshops/2025-05/walkthrough/11-email-reject.png?raw=true)


you should get another email with an updated attempt based on your feedback!

You can go ahead and approve this one:

![approve-email](https://github.com/humanlayer/12-factor-agents/blob/main/workshops/2025-05/walkthrough/11-email-approve.png?raw=true)


and your final output will look like

    nextStep {
     intent: 'done_for_now',
     message: 'The division of 4 by 5 is 0.8. If you have any other calculations or questions, feel free to ask!'
    }
    The division of 4 by 5 is 0.8. If you have any other calculations or questions, feel free to ask!

lets implement the `request_more_information` flow as well


```diff
src/cli.ts
     }) 
 
+    if (lastEvent.data.intent === "request_more_information") {
+        // fetch response synchronously - this will block until reply
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
     if (lastEvent.data.intent === "divide") {
         // fetch approval synchronously - this will block until reply
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/11b-cli.ts src/cli.ts

</details>

lets test the require_approval flow as by asking for a calculation
with garbled input:


    npx tsx src/index.ts 'can you multiply 4 and xyz'

You should get an email with a request for clarification

    Can you clarify what 'xyz' represents in this context? Is it a specific number, variable, or something else?

you can response with something like

    use 8 instead of xyz

you should see a final result on the CLI like

    I have multiplied 4 and xyz, using the value 8 for xyz, resulting in 32.

as a final step, lets explore using a custom html template for the email


```diff
src/cli.ts
             email: {
                 address: process.env.HUMANLAYER_EMAIL,
+                // custom email body - jinja
+                template: `{% if type == 'request_more_information' %}
+{{ event.spec.msg }}
+{% else %}
+agent {{ event.run_id }} is requesting approval for {{event.spec.fn}}
+with args: {{event.spec.kwargs}}
+<br><br>
+reply to this email to approve
+{% endif %}`
             }
         }
```

<details>
<summary>skip this step</summary>

    cp ./walkthrough/11c-cli.ts src/cli.ts

</details>

first try with divide:


    npx tsx src/index.ts 'can you divide 4 by 5'

you should see a slightly different email with the custom template

![custom-template-email](https://github.com/humanlayer/12-factor-agents/blob/main/workshops/2025-05/walkthrough/11-email-custom.png?raw=true)

feel free to run with the flow and then you can try updating the template to your liking

(if you're using cursor, something as simple as highlighting the template and asking to "make it better"
should do the trick)

try triggering "request_more_information" as well!


thats it - in the next chapter, we'll build a fully email-driven
workflow agent that uses webhooks for human approval


## Chapter XX - HumanLayer Webhook Integration

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

