# Chapter 11 - Human Approvals over email

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


