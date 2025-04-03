<!--
### DRAFT

Preview - this is a draft of everything I've learned in a year working with agents, and I imagine it may evolve a bit as we go.

The source is public at https://github.com/humanlayer/12-factor-agents, and I welcome your feedback and contributions. Let's figure this out together!


--> 

## 12 Factor Agents - Principles for building great LLM applications

*In the spirit of [12 Factor Apps](https://12factor.net/)*

Hi, I'm Dex. I've been hacking on AI agents for a while. 

**I've tried every agent framework out there**, from the plug-and-play crew/langchains to the "minimalist" smolagents of the world to the "production grade" langraph, griptape, etc. 

**I've talked to a lot of really strong founders**, in and out of YC, who are all building really impressive things with AI. Most of them are rolling the stack themselves. Almost none of them are using a "framework".

**I've been surprised to find** that most of the products out there billing themselves as "AI Agents" are not all that agentic. A lot of them are mostly deterministic code, with LLM steps sprinkled in at just the right points to make the experience truly magical.

Agents, at least the good ones, don't follow the "here's your prompt, here's a bag of tools, loop until you hit the goal" pattern. Rather, they are comprised of mostly just software. So, I wanted to answer:

> ### **What are the principles we can use to build LLM-powered software that is actually good enough to put in the hands of production customers?**

Welcome to 12-factor agents. As every Chicago mayor since Daley has consistently plastered all over the city's major airports, we're glad you're here.

## The Short Version: The 12 Factors

Jump to Part II: [12-Factor Agents](#12-factor-agents), or into any of the particular factors below.

- [Factor 1: Natural Language to Tool Calls](#1-natural-language-to-tool-calls)
- [Factor 2: Own your prompts](#2-own-your-prompts)
- [Factor 3: Own your context window](#3-own-your-context-window)
- [Factor 4: Tools are just structured outputs](#4-tools-are-just-structured-outputs)
- [Factor 5: Unify execution state and business state](#5-unify-execution-state-and-business-state)
- [Factor 6: Launch/Pause/Resume with simple APIs](#6-launch-pause-resume-with-simple-apis)
- [Factor 7: Contact humans with tool calls](#7-contact-humans-with-tool-calls)
- [Factor 8: Own your control flow](#8-own-your-control-flow)
- [Factor 9: Compact Errors into Context Window](#9-compact-errors-into-context-window)
- [Factor 10: Small, Focused Agents](#10-small-focused-agents)
- [Factor 11: Trigger from anywhere, meet users where they are](#11-trigger-from-anywhere-meet-users-where-they-are)
- [Factor 12: Make your agent a stateless reducer](#12-make-your-agent-a-stateless-reducer)

<!-- ![12 factors in a grid](https://github.com/humanlayer/12-factor-agents/blob/main/img/12-factors-in-a-grid.png) -->


## The longer version: how we got here

### you don't have to listen to me

Whether you're new to agents or an ornery old veteran like me, I'm going to try to convince you to throw out most of what you think about AI Agents, take a step back, and rethink them from first principles. (spoiler alert if you didn't catch the OpenAI responses launch a few weeks back, but pushing MORE agent logic behind an API ain't it)


## agents are software, and a brief history thereof

let's talk about how we got here

### 60 years ago

We're gonna talk a lot about Directed Graphs (DGs) and their Acyclic friends, DAGs. I'll start by pointing out that...well...software is a directed graph. There's a reason we used to represent programs as flow charts.

![010-software-dag](https://github.com/humanlayer/12-factor-agents/blob/main/img/010-software-dag.png)

### 20 years ago

Around 20 years ago, we started to see DAG orchestrators become popular. We're talking classics like [Airflow](https://airflow.apache.org/), [Prefect](https://www.prefect.io/), some predecessors, and some newer ones like ([dagster](https://dagster.io/), [inggest](https://www.inngest.dev/), [windmill](https://www.windmill.dev/)). These followed the same graph pattern, with the added benefit of observability, modularity, retries, administration, etc.

![015-dag-orchestrators](https://github.com/humanlayer/12-factor-agents/blob/main/img/015-dag-orchestrators.png)

### 10-15 years ago

When ML models started to get good enough to be useful, we started to see DAGs with ML models sprinkled in. You might imagine steps like "summarize the text in this column into a new column" or "classify the support issues by severity or sentiment".

![020-dags-with-ml](https://github.com/humanlayer/12-factor-agents/blob/main/img/020-dags-with-ml.png)

But at the end of the day, it's still mostly the same good old deterministic software.

### the promise of agents

I'm not the first [person to say this](https://youtu.be/Dc99-zTMyMg?si=bcT0hIwWij2mR-40&t=73), but my biggest takeaway when I started learning about agents, was that you get to throw the DAG away. Instead of software engineers coding each step and edge case, you can give the agent a goal and a set of transitions:

![025-agent-dag](https://github.com/humanlayer/12-factor-agents/blob/main/img/025-agent-dag.png)

And let the LLM make decisions in real time to figure out the path

![026-agent-dag-lines](https://github.com/humanlayer/12-factor-agents/blob/main/img/026-agent-dag-lines.png)

The promise here is that you write less software, you just give the LLM the "edges" of the graph and let it figure out the nodes. You can recover from errors, you can write less code, and you may find that LLMs find novel solutions to problems.

### agents as loops

Put another way, you've got this loop consisting of 3 steps:

1. LLM determines the next step in the workflow, outputting structured json ("tool calling")
2. Deterministic code executes the tool call
3. The result is appended to the context window 
4. repeat until the next step is determined to be "done"

```python
initial_event = {"message": "..."}
context = [initial_event]
while True:
  next_step = await llm.determine_next_step(context)
  context.append(next_step)

  if (next_step.intent === "done"):
    return next_step.final_answer

  result = await execute_step(next_step)
  context.append(result)
```

Our initial context is just the starting event (maybe a user message, maybe a cron fired, maybe a webhook, etc),
and we ask the llm to choose the next step (tool) or to determine that we're done.

Here's a multi-step example:

[![027-agent-loop-animation](https://github.com/humanlayer/12-factor-agents/blob/main/img/027-agent-loop-animation.gif)](https://github.com/user-attachments/assets/3beb0966-fdb1-4c12-a47f-ed4e8240f8fd)

<details>
<summary>[GIF Version](https://github.com/humanlayer/12-factor-agents/blob/main/img/027-agent-loop-animation.gif)</summary>

![027-agent-loop-animation](https://github.com/humanlayer/12-factor-agents/blob/main/img/027-agent-loop-animation.gif)]

</details>

And the "materialized" DAG that was generated would look something like:

![027-agent-loop-dag](https://github.com/humanlayer/12-factor-agents/blob/main/img/027-agent-loop-dag.png)

### the problem with this "loop until you solve it" pattern

The biggest problems with this pattern:

- Agents get lost when the context window gets too long - they spin out trying the same broken approach over and over again
- literally thats it, but that's enough to kneecap the approach

Even if you haven't hand-rolled an agent, you've probably seen this long-context problem in working with agentic coding tools. They just get lost after a while and you need to start a new chat.

I'll even perhaps posit something I've heard in passing quite a bit, and that YOU probably have developed your own intuition around:

> ### **Even as models support longer and longer context windows, you'll ALWAYS get better results with a small, focused prompt and context**

Most builders I've talked to **pushed the "tool calling loop" idea to the side** when they realized that anything more than 10-20 turns becomes a big mess that the LLM can't recover from. Even if the agent gets it right 90% of the time, that's miles away from "good enough to put in customer hands". Can you imagine a web app that crashed on 10% of page loads?

### what actually works - micro agents

One thing that I **have** seen in the wild quite a bit is taking the agent pattern and sprinkling it into a broader more deterministic DAG. 

![micro-agent-dag](https://github.com/humanlayer/12-factor-agents/blob/main/img/028-micro-agent-dag.png)

You might be asking - "why use agents at all in this case?" - we'll get into that shortly, but basically, having language models managing well-scoped sets of tasks makes it easy to incorporate live human feedback, translating it into workflow steps without spinning out into context error loops. ([factor 1](#1-natural-language-to-tool-calls), [factor 4](#4-use-tools-for-human-interaction)).

> #### having language models managing well-scoped sets of tasks makes it easy to incorporate live human feedback...without spinning out into context error loops

### a real life micro agent 

Here's an example of how deterministic code might run one micro agent responsible for handling the human-in-the-loop steps for deployment. 

![029-deploybot-high-level](https://github.com/humanlayer/12-factor-agents/blob/main/img/029-deploybot-high-level.png)

* **Human** Merges PR to GitHub main branch
* **Deterministic Code** Deploys to staging env
* **Deterministic Code** Runs end-to-end (e2e) tests against staging
* **Deterministic Code** Hands to agent for prod deployment, with initial context: "deploy SHA 4af9ec0 to production"
* **Agent** calls `deploy_frontend_to_prod(4af9ec0)`
* **Deterministic code** requests human approval on this action
* **Human** Rejects the action with feedback "can you deploy the backend first?"
* **Agent** calls `deploy_backend_to_prod(4af9ec0)`
* **Deterministic code** requests human approval on this action
* **Human** approves the action
* **Deterministic code** executed the backend deployment
* **Agent** calls `deploy_frontend_to_prod(4af9ec0)`
* **Deterministic code** requests human approval on this action
* **Human** approves the action
* **Deterministic code** executed the frontend deployment
* **Agent** determines that the task was completed successfully, we're done!
* **Deterministic code** run the end-to-end tests against production
* **Deterministic code** task completed, OR pass to rollback agent to review failures and potentially roll back

[![033-deploybot-animation](https://github.com/humanlayer/12-factor-agents/blob/main/img/033-deploybot.gif)](https://github.com/user-attachments/assets/deb356e9-0198-45c2-9767-231cb569ae13)

<details>
<summary>[GIF Version](https://github.com/humanlayer/12-factor-agents/blob/main/img/033-deploybot.gif)</summary>

![033-deploybot-animation](https://github.com/humanlayer/12-factor-agents/blob/main/img/033-deploybot.gif)]

</details>

This example is based on a real life [OSS agent we've shipped to manage our deployments at Humanlayer](https://github.com/got-agents/agents/tree/main/deploybot-ts) - here is a real conversation I had with it last week:

![035-deploybot-conversation](https://github.com/humanlayer/12-factor-agents/blob/main/img/035-deploybot-conversation.png)


We haven't given this agent a huge pile of tools or tasks. The primary value in the LLM is parsing the human's plaintext feedback and proposing an updated course of action. We isolate tasks and contexts as much as possible to keep
Here's another [more classic support / chatbot demo](https://x.com/chainlit_io/status/1858613325921480922).

### so what's an agent really?

- **prompt** - tell an LLM how to behave, and what "tools" it has available. The output of the prompt is a JSON object that describe the next step in the workflow (the "tool call" or "function call").
- **switch statement** - based on the JSON that the LLM returns, decide what to do with it.
- **accumulated context** - store the list of steps that have happened and their results
- **for loop** - until the LLM emits some sort of "Terminal" tool call (or plaintext response), add the result of the switch statement to the context window and ask the LLM to choose the next step.

![040-4-components](https://github.com/humanlayer/12-factor-agents/blob/main/img/040-4-components.png)

In the "deploybot" example, we gain a couple benefits from owning the control flow and context accumulation:

- In our **switch statement** and **for loop**, we can hijack control flow to pause for human input or to wait for completion of long-running tasks
- We can trivially serialize the **context** window for pause+resume
- In our **prompt**, we can optimize the heck out of how we pass instructions and "what happened so far" to the LLM


[Part II](#12-factor-agents) will **formalize these patterns** so they can be applied to add impressive AI features to any software project, without needing to go all in on conventional implementations/definitions of "AI agent".

## 12-factor agents


In building HumanLayer, I've talked to at least 100 SaaS builders (mostly technical founders) looking to make their existing product more agentic. The journey usually goes something like:

1. Decide you want to build an agent
2. Product design, UX mapping, what problems to solve
3. Want to move fast, so grab $FRAMEWORK and *get to building*
4. Get to 70-80% quality bar 
5a. Realize that 80% isn't good enough for most customer-facing features
5b. Realize that getting past 80% requires reverse-engineering the framework, prompts, flow, etc
6. Start over from scratch

<details>
<summary>Random Disclaimers</summary>

**DISCLAIMER**: I'm not sure the exact right place to say this, but here seems as good as any: **this in BY NO MEANS meant to be a dig on either the many frameworks out there, or the pretty dang smart people who work on them**. They enable incredible things and have accelerated the AI ecosystem. 

I hope that one outcome of this post is that agent framework builders can learn from the journeys of myself and others, and make frameworks even better. 

Especially for builders who want to move fast but need deep control.

**DISCLAIMER 2**: I'm not going to talk about MCP. I'm sure you can see where it fits in.

**DISCLAIMER 3**: I'm using mostly typescript, for [reasons](https://www.linkedin.com/posts/dexterihorthy_llms-typescript-aiagents-activity-7290858296679313408-Lh9e?utm_source=share&utm_medium=member_desktop&rcm=ACoAAA4oHTkByAiD-wZjnGsMBUL_JT6nyyhOh30) but all this stuff works in python or any other language you prefer. 


Anyways back to the thing...

</details>

### why 12 factors?

After digging hundreds of AI libriaries and working with dozens of founders, my instinct is this:

1. There are some core things that make agents great
2. Going all in on a framework and building what is essentially a greenfield rewrite may be counter-productive
3. There are some core principles that make agents great, and you will get most/all of them if you pull in a framework
4. BUT, the fastest way I've seen for builders to get high-quality AI software in the hands of customers is to take small, modular concepts from agent building, and incorporate them into their existing product
5. These modular concepts from agents can be defined and applied by most skilled software engineers, even if they don't have an AI background

> #### The fastest way I've seen for builders to get good AI software in the hands of customers is to take small, modular concepts from agent building, and incorporate them into their existing product

## the twelve factors

OK. After 5 pages of preamble, lets get into it

- [Factor 1: Natural Language to Tool Calls](#1-natural-language-to-tool-calls)
- [Factor 2: Own your prompts](#2-own-your-prompts)
- [Factor 3: Own your context window](#3-own-your-context-window)
- [Factor 4: Tools are just structured outputs](#4-tools-are-just-structured-outputs)
- [Factor 5: Unify execution state and business state](#5-unify-execution-state-and-business-state)
- [Factor 6: Launch/Pause/Resume with simple APIs](#6-launch-pause-resume-with-simple-apis)
- [Factor 7: Contact humans with tool calls](#7-contact-humans-with-tool-calls)
- [Factor 8: Own your control flow](#8-own-your-control-flow)
- [Factor 9: Compact Errors into Context Window](#9-compact-errors-into-context-window)
- [Factor 10: Small, Focused Agents](#10-small-focused-agents)
- [Factor 11: Trigger from anywhere, meet users where they are](#11-trigger-from-anywhere-meet-users-where-they-are)
- [Factor 12: Make your agent a stateless reducer](#12-make-your-agent-a-stateless-reducer)

### 1. Natural Language to Tool Calls 

One of the most common patterns in agent building is to convert natural language to structured tool calls. This is a powerful pattern that allows you to build agents that can reason about tasks and execute them.

![110-natural-language-tool-calls](https://github.com/humanlayer/12-factor-agents/blob/main/img/110-natural-language-tool-calls.png)

This pattern, when applied atomically, is the simple translation of a phrase like

> can you create a payment link for $750 to Terri for sponsoring the february AI tinkerers meetup? 

to a structured object that describes a Stripe API call like

```json
{
  "function": {
    "name": "create_payment_link",
    "parameters": {
      "amount": 750,
      "customer": "cust_128934ddasf9",
      "product": "prod_8675309",
      "price": "prc_09874329fds",
      "quantity": 1,
      "memo": "Hey Jeff - see below for the payment link for the february ai tinkerers meetup"
    }
  }
}
```

**Note**: in reality the stripe API is a bit more complex, a [real agent that does this](https://github.com/dexhorthy/mailcrew) ([video](https://www.youtube.com/watch?v=f_cKnoPC_Oo)) would list customers, list products, list prices, etc to build this payload with the proper ids, or include those ids in the prompt/context window (we'll see below how those are kinda the same thing though!)

From there, deterministic code can pick up the payload and do something with it. (More on this in [factor 3](#))

```typescript
// The LLM takes natural language and returns a structured object
const nextStep = await determineNextStep(
  `create a payment link for $750 to Jeff 
  for sponsoring the february AI tinkerers meetup`
  )

// Handle the structured output based on its function
switch (nextStep.function) {
  case 'create_payment_link':
    stripe.paymentlinks.create(nextStep.parameters)
    return // or whatever you want, see below
  case 'something_else': 
    // ... more cases
  default: //... the model didn't call a tool we know about
    // do something else
}
```

**NOTE**: While a full agent would then receive the API call result and loop with it, eventually returning something like

> I've successfully created a payment link for $750 to Terri for sponsoring the february AI tinkerers meetup. Here's the link: https://buy.stripe.com/test_1234567890

**Instead**, We're actually going to skip that step here, and save it for another factor, which you may or may not want to also incorporate (up to you!)

### 2. Own your prompts


Don't outsource your prompt engineering to a framework. 

![120-own-your-prompts](https://github.com/humanlayer/12-factor-agents/blob/main/img/120-own-your-prompts.png)

Some frameworks provide a "black box" approach like this:

```typescript
const agent = new Agent({
  role: "...",
  goal: "...",
  personality: "...",
  tools: [tool1, tool2, tool3]
})

const task = {
  instructions: "...",
  expected_output: z.object({
    field1: z.string(),
    field2: z.string(),
    field3: z.string(),
  })
}

const result = agent.run(task)
```

This is great for pulling in some TOP NOTCH prompt engineering to get you started, but it is often difficult to tune and/or reverse engineer to get exactly the right tokens into your model.

Instead, own your prompts and treat them as first-class code:

```rust
function DetermineNextStep(thread: string) -> DoneForNow | ListGitTags | DeployBackend | DeployFrontend | RequestMoreInformation {
  prompt #"
    {{ _.role("system") }}
    
    You are a helpful assistant that manages deployments for frontend and backend systems.
    You work diligently to ensure safe and successful deployments by following best practices
    and proper deployment procedures.
    
    Before deploying any system, you should check:
    - The deployment environment (staging vs production)
    - The correct tag/version to deploy
    - The current system status
    
    You can use tools like deploy_backend, deploy_frontend, and check_deployment_status
    to manage deployments. For sensitive deployments, use request_approval to get
    human verification.
    
    Always think about what to do first, like:
    - Check current deployment status
    - Verify the deployment tag exists
    - Request approval if needed
    - Deploy to staging before production
    - Monitor deployment progress
    
    {{ _.role("user") }}

    {{ thread }}
    
    What should the next step be?
  "#
}
```

(the above example uses [BAML](https://github.com/boundaryml/baml) to generate the prompt, but you can do this with any prompt engineering tool you want, or even just template it manually)

If the signature looks a little funny, we'll get to that in [factor 4 - tools are just structured outputs](#4-tools-are-just-structured-outputs)

```typescript
function DetermineNextStep(thread: string) -> DoneForNow | ListGitTags | DeployBackend | DeployFrontend | RequestMoreInformation {
```

Key benefits of owning your prompts:

1. **Full Control**: Write exactly the instructions your agent needs, no black box abstractions
2. **Testing and Evals**: Build tests and evals for your prompts just like you would for any other code
3. **Iteration**: Quickly modify prompts based on real-world performance
4. **Transparency**: Know exactly what instructions your agent is working with
5. **Role Hacking**: take advantage of APIs that support nonstandard usage of user/assistant roles - for example, the now-deprecated non-chat flavor of OpenAI "completions" API. This includes some so-called "model gaslighting" techniques

Remember: Your prompts are the primary interface between your application logic and the LLM.

Having full control over your prompts gives you the flexibility and prompt control you need for production-grade agents.

I don't know what's the best prompt, but I know you want the flexibility to be able to try EVERYTHING.

### 3. Own your context window

You don't necessarily need to use standard message-based formats for conveying context to an LLM.

> #### At any given point, your input to an LLM in an agent is "here's what's happened so far, what's the next step"

![130-own-your-context-building](https://github.com/humanlayer/12-factor-agents/blob/main/img/130-own-your-context-building.png)

Again, I don't know what's the best way to hand context to an LLM, but I know you want the flexibility to be able to try EVERYTHING.


#### Standard vs Custom Context Formats

Most LLM clients use a standard message-based format like this:

```json
[
  {
    "role": "system",
    "content": "You are a helpful assistant..."
  },
  {
    "role": "user",
    "content": "Can you deploy the backend?"
  },
  {
    "role": "assistant",
    "content": null,
    "tool_calls": [
      {
        "id": "1",
        "name": "list_git_tags",
        "arguments": "{}"
      }
    ]
  },
  {
    "role": "tool",
    "name": "list_git_tags",
    "content": "{\"tags\": [{\"name\": \"v1.2.3\", \"commit\": \"abc123\", \"date\": \"2024-03-15T10:00:00Z\"}, {\"name\": \"v1.2.2\", \"commit\": \"def456\", \"date\": \"2024-03-14T15:30:00Z\"}, {\"name\": \"v1.2.1\", \"commit\": \"abe033d\", \"date\": \"2024-03-13T09:15:00Z\"}]}",
    "tool_call_id": "1"
  }
]
```

While this works great for most use cases, if you want to really get THE MOST out of today's LLMs, you need to get your context into the LLM is the most token- and attention-efficient way you can.

As an alternative to the standard message-based format, you can build your own context format that's optimized for your use case. For example, you can using custom objects and pack/spread them into one or more user, system, assistant, or tool messages as makes sense.

Here's an example of putting the whole context window into a single user message:

```typescript

interface Thread {
  events: Event[]
}

interface Event {
  // could just use string, or could be explicit - up to you
  type: "list_git_tags" | "deploy_backend" | "deploy_frontend" | "request_more_information" | "done_for_now" |
        "list_git_tags_result" | "deploy_backend_result" | "deploy_frontend_result" | "request_more_information_result" | "done_for_now_result" |
        "error"
  // could just use any, or could be explicit - up to you
  data: ListGitTags | DeployBackend | DeployFrontend | RequestMoreInformation |  
        ListGitTagsResult | DeployBackendResult | DeployFrontendResult | RequestMoreInformationResult | string
}

const eventToPrompt = (event: Event) => {
    const data = typeof event.data !== 'string' ? stringifyToYaml(event.data) : event.data
    return `<${event.type}>
        ${data}
</${event.type}>
    `
}

const threadToPrompt = (thread: Thread) => {
  return thread.events.map(eventToPrompt).join('\n\n')
}
```

#### Example Context Windows

Here's how context windows might look with this approach:

**Initial Slack Request:**
```xml
<slack_message>
    From: @alex
    Channel: #deployments
    Text: Can you deploy the latest backend to production?
</slack_message>
```

**After Listing Git Tags:**
```xml
<slack_message>
    From: @alex
    Channel: #deployments
    Text: Can you deploy the latest backend to production?
    Thread: []
</slack_message>

<list_git_tags>
    intent: "list_git_tags"
</list_git_tags>

<list_git_tags_result>
    tags:
      - name: "v1.2.3"
        commit: "abc123"
        date: "2024-03-15T10:00:00Z"
      - name: "v1.2.2"
        commit: "def456"
        date: "2024-03-14T15:30:00Z"
      - name: "v1.2.1"
        commit: "ghi789"
        date: "2024-03-13T09:15:00Z"
</list_git_tags_result>
```

**After Error and Recovery:**
```xml
<slack_message>
    From: @alex
    Channel: #deployments
    Text: Can you deploy the latest backend to production?
    Thread: []
</slack_message>

<deploy_backend>
    intent: "deploy_backend"
    tag: "v1.2.3"
    environment: "production"
</deploy_backend>

<error>
    error running deploy_backend: Failed to connect to deployment service
</error>

<request_more_information>
    intent: "request_more_information_from_human"
    question: "I had trouble connecting to the deployment service, can you provide more details and/or check on the status of the service?"
</request_more_information>

<human_response>
    data:
      response: "I'm not sure what's going on, can you check on the status of the latest workflow?"
</human_response>
```

From here your next step might be: 

```typescript
const nextStep = await determineNextStep(threadToPrompt(thread))
```

```typescript
{
  "intent": "get_workflow_status",
  "workflow_name": "tag_push_prod.yaml",
}
```

The XML-style format is just one example - the point is you can build your own format that makes sense for your application. You'll get better quality if you have the flexibility to experiment with different context structures and what you store vs. what you pass to the LLM. 

Key benefits of owning your context window:
1. **Information Density**: Structure information in ways that maximize the LLM's understanding
2. **Error Handling**: Include error information in a format that helps the LLM recover
3. **Safety**: Control what information gets passed to the LLM, filtering out sensitive data
4. **Flexibility**: Adapt the format as you learn what works best for your use case

Remember: The context window is your primary interface with the LLM. Taking control of how you structure and present information can dramatically improve your agent's performance.

Recurring theme here: I don't know what's the best approach, but I know you want the flexibility to be able to try EVERYTHING.

### 4. Tools are just structured outputs

Tools don't need to be complex. At their core, they're just structured output from your LLM that triggers deterministic code.

![140-tools-are-just-structured-outputs](https://github.com/humanlayer/12-factor-agents/blob/main/img/140-tools-are-just-structured-outputs.png)

```typescript
class CreateIssue {
  intent: "create_issue"
  issue: {
    title: string
    description: string
    team_id: string
    assignee_id: string
  }
}

class SearchIssues {
  intent: "search_issues"
  query: string
  what_youre_looking_for: string
}
```

The pattern is simple:
1. LLM outputs structured JSON
2. Your code validates the structure
3. Deterministic code executes the appropriate action (like calling an external API)
4. Results are captured and fed back into the context

This creates a clean separation between the LLM's decision-making and your application's actions. The LLM decides what to do, but your code controls how it's done. This separation makes your system more reliable and easier to debug when things go wrong.

If you recall our switch statement from above

```typescript
switch (nextStep.intent) {
  case 'create_payment_link':
    stripe.paymentlinks.create(nextStep.parameters)
    return // or whatever you want, see below
  case 'wait_for_a_while': 
    // do something monadic idk
  default: //... the model didn't call a tool we know about
    // do something else
}
```

**Note**: there has been a lot said about the benefits of "plain prompting" vs. "tool calling" vs. "JSON mode" and the performance tradeoffs of each. We'll link some resources to that stuff soon, but not gonna get into it here. See [Prompting vs JSON Mode vs Function Calling vs Constrained Generation vs SAP](https://www.boundaryml.com/blog/schema-aligned-parsing), [When should I use function calling, structured outputs, or JSON mode?](https://www.vellum.ai/blog/when-should-i-use-function-calling-structured-outputs-or-json-mode#:~:text=We%20don%27t%20recommend%20using%20JSON,always%20use%20Structured%20Outputs%20instead) and [OpenAI JSON vs Function Calling](https://docs.llamaindex.ai/en/stable/examples/llm/openai_json_vs_function_calling/).

The "next step" might not be as atomic as just "run a pure function and return the result". You unlock a lot of flexibility when you think of "tool calls" as just a model outputting JSON describing what deterministic code should do. Put this together with [factor 8 own your control flow](#8-own-your-control-flow).

### 5. Unify execution state and business state

Even outside the AI world, many infrastructure systems try to separate "execution state" from "business state". For AI apps, this might involve complex abstractions to track things like current step, next step, waiting status, retry counts, etc. This separation creates complexity that may be worthwhile, but may be overkill for your use case. 

As always, it's up to you to decide what's right for your application. But don't think you *have* to manage them separately.

More clearly:

- **Execution state**: current step, next step, waiting status, retry counts, etc. 
- **Business state**: What's happened in the agent workflow so far (e.g. list of OpenAI messages, list of tool calls and results, etc.)

If possible, SIMPLIFY - unify these as much as possible. 

[![155-unify-state](https://github.com/humanlayer/12-factor-agents/blob/main/img/155-unify-state-animation.gif)](https://github.com/user-attachments/assets/e5a851db-f58f-43d8-8b0c-1926c99fc68d)


<details>
<summary>[GIF Version](https://github.com/humanlayer/12-factor-agents/blob/main/img/155-unify-state-animation.gif)</summary>

![155-unify-state](https://github.com/humanlayer/12-factor-agents/blob/main/img/155-unify-state-animation.gif)]

</details>

In reality, you can engineer your application so that you can infer all execution state from the context window. In many cases, execution state (current step, waiting status, etc.) is just metadata about what has happened so far.

You may have things that can't going in the context window, like session ids, password contexts, etc, but your goal should be to minimize those things. BY embracing [factor 3](#3-own-your-context-window) you can control what actually goes into the LLM 

This approach has several benefits:

1. **Simplicity**: One source of truth for all state
2. **Serialization**: The thread is trivially serializable/deserializable
3. **Debugging**: The entire history is visible in one place
4. **Flexibility**: Easy to add new state by just adding new event types
5. **Recovery**: Can resume from any point by just loading the thread
6. **Forking**: Can fork the thread at any point by copying some subset of the thread into a new context / state ID
7. **Human Interfaces and Observability**: Trivial to convert a thread into a human-readable markdown or a rich Web app UI

### 6. Launch/Pause/Resume with simple APIs

Agents are just programs, and we have things we expect from how to launch, query, resume, and stop them.

[![pause-resume animation](https://github.com/humanlayer/12-factor-agents/blob/main/img/165-pause-resume-animation.gif)](https://github.com/user-attachments/assets/feb1a425-cb96-4009-a133-8bd29480f21f)

<details>
<summary>[GIF Version](https://github.com/humanlayer/12-factor-agents/blob/main/img/165-pause-resume-animation.gif)</summary>

![pause-resume animation](https://github.com/humanlayer/12-factor-agents/blob/main/img/165-pause-resume-animation.gif)]

</details>


It should be easy for users, apps, pipelines, and other agents to launch an agent with a simple API.

Agents and their orchestrating deterministic code should be able to pause an agent when a long-running operation is needed.

External triggers like webhooks should enable agents to resume from where they left off without deep integration with the agent orchestrator.

Closely related to [factor 5](#5-unify-execution-state-and-business-state) and [factor 8](#8-own-your-control-flow), but can be implemented independently.



**Note** - often AI orchestrators will allow for pause and resume, but not between the moment of tool selection and tool execution. See also [factor 7 - contact humans with tool calls](#7-contact-humans-with-tool-calls) and [factor 11 - trigger from anywhere, meet users where they are](#11-trigger-from-anywhere-meet-users-where-they-are).

### 7. Contact humans with tool calls

By default, LLM APIs rely on a fundamental HIGH-STAKES token choice: Are we returning plaintext content, or are we returning structured data?

![170-contact-humans-with-tools](https://github.com/humanlayer/12-factor-agents/blob/main/img/170-contact-humans-with-tools.png)

You're putting a lot of weight on that choice of first token, which, in the `the weather in tokyo` case, is

> "the"

but in the `fetch_weather` case, it's some special token to denote the start of a JSON object.

> |JSON>


You might get better results by having the LLM *always* output json, and then declare it's intent with some natural language tokens like `request_human_input` or `done_for_now` (as opposed to a "proper" tool like `check_weather_in_city`). 

Again, you might not get any performance boost from this, but you should experiment, and ensure you're free to try weird stuff to get the best results.

```typescript

// Tool definition for human interaction
interface RequestHumanInput {
  intent: "request_human_input"
  question: string
  context: string
  options?: {
    urgency: "low" | "medium" | "high"
    format?: "free_text" | "yes_no" | "multiple_choice"
    choices?: string[]
  }
}

// Example usage in the agent loop
switch (nextStep.intent) {
  case 'request_human_input':
    thread.events.push({
      type: 'human_input_requested',
      data: nextStep
    })
    const threadId = await saveState(thread)
    await notifyHuman(nextStep, threadId)
    return // Break loop and wait for response to come back with thread ID
  case '...':
    // ... other cases
}
```

Later, you might receive a webhook from a system that handles slack, email, sms, or other events.

```typescript

app.post('/webhook', async (req, res) => {
  const threadId = req.body.threadId
  const thread = await loadState(threadId)
  thread.events.push({
    type: 'response_from_human',
    data: req.body
  })
  // ... simplified for brevity, you likely don't want to block the web worker here
  const nextStep = await determineNextStep(threadToPrompt(thread))
  await handleNextStep(thread, nextStep)
  // todo - loop or break or whatever you want

  res.json({"status": "ok"})
})
```

The above includes patterns from [factor 5](#5-unify-execution-state-and-business-state) and [factor 8](#8-own-your-control-flow), [factor 3](#3-own-your-context-window), and [factor 4](#4-tools-are-just-structured-outputs), and several others.

If we were using the XML-y formatted from [factor 3](#3-own-your-context-window), our context window after a few turns might look like this:

```xml

(snipped for brevity)

<slack_message>
    From: @alex
    Channel: #deployments
    Text: Can you deploy backend v1.2.3 to production?
    Thread: []
</slack_message>

<request_human_input>
    intent: "request_human_input"
    question: "Would you like to proceed with deploying v1.2.3 to production?"
    context: "This is a production deployment that will affect live users."
    options: {
        urgency: "high"
        format: "yes_no"
    }
</request_human_input>

<human_response>
    response: "yes please proceed"
    approved: true
    timestamp: "2024-03-15T10:30:00Z"
    user: "alex@company.com"
</human_response>

<deploy_backend>
    intent: "deploy_backend"
    tag: "v1.2.3"
    environment: "production"
</deploy_backend>

<deploy_backend_result>
    status: "success"
    message: "Deployment v1.2.3 to production completed successfully."
    timestamp: "2024-03-15T10:30:00Z"
</deploy_backend_result>
```


Benefits:

1. **Clear Instructions**: Tools for different types of human contact allow for more specifity from the LLM 
2. **Inner vs Outer Loop**: Enables agents workflows **outside** of the traditional chatGPT-style interface, where the control flow and context initialization may be Agent->Human rather than Human->Agent (think, agents kicked off on a cron or an event)
3. **Multiple Human Access**: Can easily track and coordinate input from different humans through structured events
4. **Multi-Agent**: Simple abstraction can be easily extended to support Agent->Agent requests and responses. 
5. **Durable**: Combined with [factor 6 - pause and resume](#6-launchpauseresume-with-simple-apis), this makes for durable, reliable, and introspectable multiplayer workflows.

[More on Outer Loop Agents over here](https://theouterloop.substack.com/p/openais-realtime-api-is-a-step-towards)

![175-outer-loop-agents](https://github.com/humanlayer/12-factor-agents/blob/main/img/175-outer-loop-agents.png)

Works great with [factor 11 - trigger from anywhere, meet users where they are](#11-trigger-from-anywhere-meet-users-where-they-are)

### 8. Own your control flow

If you own your control flow, you can do lots of fun things.

![180-control-flow](https://github.com/humanlayer/12-factor-agents/blob/main/img/180-control-flow.png)


Build your own control structures that make sense for your specific use case. Specifically, certain types of tool calls may be reason to break out of the loop and wait for a response from a human or another long-running task like a training pipeline. You may also want to incorporate custom implementation of:

- summarization or caching of of tool call results
- LLM as judge on structured output
- context window compaction or other [memory management](#factor-14---everything-is-context-engineering)
- logging, tracing, and metrics
- client-side rate limiting
- durable sleep / pause / "wait for event"


The below example shows three possible control flow patterns:


- request_clarification: model asked for more info, break the loop and wait for a response from a human
- fetch_git_tags: model asked for a list of git tags, fetch the tags, append to context window, and pass straight back to the model
- deploy_backend: model asked to deploy a backend, this is a high-stakes thing, so break the loop and wait for human approval

```typescript
const handleNextStep = async (thread: Thread): Promise<void> => {

  while (true) {
    const nextStep = await b.DetermineNextStep(threadToPrompt(nextThread))
    
    // inlined for clarity - in reality you could put 
    // this in a method, use exceptions for control flow, or whatever you want
    switch (nextStep.intent) {
      case 'request_clarification':
        thread.events.push({
          type: 'request_clarification',
          data: nextStep,
        })

        await sendMessageToHuman(nextStep)
        await db.saveThread(thread)
        // async step - break the loop, we'll get a webhook later
        break
      case 'fetch_open_issues':
        thread.events.push({
          type: 'fetch_open_issues',
          data: nextStep,
        })

        const issues = await linearClient.issues()

        thread.events.push({
          type: 'fetch_open_issues_result',
          data: issues,
        })
        // sync step - pass the new context to the LLM to determine the NEXT next step
        continue
      case 'create_issue':
        thread.events.push({
          type: 'create_issue',
          data: nextStep,
        })

        await requestHumanApproval(nextStep)
        await db.saveThread(thread)
        // async step - break the loop, we'll get a webhook later
        break
      
    }
    
    
  }
}
```

This pattern allows you to interrupt and resume your agent's flow as needed, creating more natural conversations and workflows.

**Example** - the number one feature request I have for every AI framework out there is we need to be able to interrupt 
a working agent and resume later, ESPECIALLY between the moment of tool **selection** and the moment of tool **invocation**.

Without this level of resumability/granularity, there's no way to review/approve the tool call before it runs, which means
you're forced to either:

1. Pause the task in memory while waiting for the long-running thing to complete (think `while...sleep`) and restart it from the beginning if the process is interrupted.
2. Restrict the agent to only low-stakes, low-risk calls like research and summarization
3. Give the agent access to do bigger, more useful things, and just yolo hope it doesn't screw up


You may notice this is closely related to [factor 5 - unify execution state and business state](#5-unify-execution-state-and-business-state) and [factor 6 - launch/pause/resume with simple APIs](#6-launchpauseresume-with-simple-apis), but can be implemented independently.

### 9. Compact Errors into Context Window

This one is a little short but is worth mentioning. One of these benefits of agents is "self-healing" - for short tasks, an LLM might call a tool that fails. Good LLMs have a fairly good chance of reading an error message or stack trace and figuring out what to change in a subsequent tool call.


Most frameworks implement this, but you can do JUST THIS without doing any of the other 11 factors. Here's an example of 


```typescript
const thread = {events: [inital_message]}

while (true) {
  const nextStep = await determineNextStep(threadToPrompt(thread))
  thread.events.push({
    type: nextStep.intent,
    data: nextStep,
  })
  try {
    const result = await handleNextStep(thread, nextStep) // our switch statement
  } catch (e) {
    // if we get an error, we can add it to the context window and try again
    thread.events.push({
      type: 'error',
      data: formatError(e),
    })
    // loop, or do whatever else here to try to recover
  }
}
```

You may want to implement an errorCounter for a specific tool call, to limit to ~3 attempts of a single tool, or whatever other logic makes sense for your use case.

```typescript
let consecutiveErrors = 0

while (true) {

  // ... existing code ...

  try {
    const result = await handleNextStep(thread, nextStep)
    thread.events.push({
      type: nextStep.intent + '_result',
      data: result,
    })
    // success! reset the error counter
    consecutiveErrors = 0
  } catch (e) {
    consecutiveErrors++
    if (consecutiveErrors < 3) {
      // do the loop and try again
      thread.events.push({
        type: 'error',
        data: formatError(e),
      })
    } else {
      // break the loop, reset parts of the context window, or whatever else you want to do
    }
  }
}
```

[![195-factor-9-errors](https://github.com/humanlayer/12-factor-agents/blob/main/img/195-factor-9-errors.gif)](https://github.com/user-attachments/assets/cd7ed814-8309-4baf-81a5-9502f91d4043)


<details>
<summary>[GIF Version](https://github.com/humanlayer/12-factor-agents/blob/main/img/195-factor-9-errors.gif)</summary>

![195-factor-9-errors](https://github.com/humanlayer/12-factor-agents/blob/main/img/195-factor-9-errors.gif)

</details>

Benefits:

1. **Self-Healing**: The LLM can read the error message and figure out what to change in a subsequent tool call.
2. **Durable**: The agent can continue to run even if one tool call fails.

I'm sure you will find that if you do this TOO much, your agent will start to spin out and might repeat the same error over and over again. 

That's where [factor 8 - own your control flow](#8-own-your-control-flow) and [factor 3 - own your context building](#3-own-your-context-building) come in - you don't need to just put the raw error back on, you can completely restructure how it's represented, remove previous events from the context window, or whatever deterministic thing you find works to get an agent back on track. 

But the number one way to prevent error spin-outs is to embrace [factor 10 - small, focused agents](#10-small-focused-agents).

### 10. Small, Focused Agents

Rather than building monolithic agents that try to do everything, build small, focused agents that do one thing well. Agents are just one building block in a larger, mostly deterministic system.

![1a0-small-focused-agents](https://github.com/humanlayer/12-factor-agents/blob/main/img/1a0-small-focused-agents.png)

The key insight here is about LLM limitations: the bigger and more complex a task is, the more steps it will take, which means a longer context window. As context grows, LLMs are more likely to get lost or lose focus. By keeping agents focused on specific domains with 3-10, maybe 20 steps max, we keep context windows manageable and LLM performance high.

> #### As context grows, LLMs are more likely to get lost or lose focus

Benefits of small, focused agents:

1. **Manageable Context**: Smaller context windows mean better LLM performance
2. **Clear Responsibilities**: Each agent has a well-defined scope and purpose
3. **Better Reliability**: Less chance of getting lost in complex workflows
4. **Easier Testing**: Simpler to test and validate specific functionality
5. **Improved Debugging**: Easier to identify and fix issues when they occur

As agents and LLMs improve, they **might** naturally expand to be able to handle longer context windows. This means handling MORE of a larger DAG. This small, focused approach ensures you can get results TODAY, while preparing you to slowly expand agent scope as LLM context windows become more reliable. (If you've refactored large deterministic code bases before, you may be nodding your head right now.)

### 11. Trigger from anywhere, meet users where they are

If you're waiting for the [humanlayer](https://humanlayer.dev) pitch, you made it. If you're doing [factor 6 - launch/pause/resume with simple APIs](#6-launchpauseresume-with-simple-apis) and [factor 7 - contact humans with tool calls](#7-contact-humans-with-tool-calls), you're ready to incorporate this factor.

![1b0-trigger-from-anywhere](https://github.com/humanlayer/12-factor-agents/blob/main/img/1b0-trigger-from-anywhere.png)

Enable users to trigger agents from slack, email, sms, or whatever other channel they want. Enable agents to respond via the same channels.

Benefits:

- **Meet users where they are**: This helps you build AI applications that feel like real humans, or at the very least, digital coworkers.
- **Outer Loop Agents**: Enable agents to be triggered by non-humans, e.g. events, crons, outages, whatever else. They may work for 5, 20, 90 minutes, but when they get to a critical point, they can contact a human for help, feedback, or approval.


### 12. Make your agent a stateless reducer

Okay so we're over 1000 lines of markdown at this point. This one is mostly just for fun.

![1c0-stateless-reducer](https://github.com/humanlayer/12-factor-agents/blob/main/img/1c0-stateless-reducer.png)


![1c5-agent-foldl](https://github.com/humanlayer/12-factor-agents/blob/main/img/1c5-agent-foldl.png)

## Honorable Mentions / other advice

### Factor 13 - pre-fetch all the context you might need

If there's a high chance that your model will call tool X, don't waste token round trips telling the model to fetch it, that is, instead of a pseudo-prompt like:

```jinja
When looking at deployments, you will likely want to fetch the list of published git tags,
so you can use it to deploy to prod.

Here's what happened so far:

{{ thread.events }}

What's the next step?

Answer in JSON format with one of the following intents:

{
  intent: 'deploy_backend_to_prod',
  tag: string
} OR {
  intent: 'list_git_tags'
} OR {
  intent: 'done_for_now',
  message: string
}
```

and your code looks like

```typescript
const thread = {events: [inital_message]}
const nextStep = await determineNextStep(thread)

while (true) {
  switch (nextStep.intent) {
    case 'list_git_tags':
      const tags = await fetch_git_tags()
      thread.events.push({
        type: 'list_git_tags',
        data: tags,
      })
    case 'deploy_backend_to_prod':
      const deploy_result = await deploy_backend_to_prod(nextStep.data.tag)
      thread.events.push({
        type: 'deploy_backend_to_prod',
        data: deploy_result,
      })
    case 'done_for_now':
      await notify_human(nextStep.message)
      break
    // ...
  }
}
```

You might as well just fetch the tags and include them in the context window, like:

```jinja
When looking at deployments, you will likely want to fetch the list of published git tags,
so you can use it to deploy to prod.

The current git tags are:

{{ git_tags }}


Here's what happened so far:

{{ thread.events }}

What's the next step?

Answer in JSON format with one of the following intents:

{
  intent: 'deploy_backend_to_prod',
  tag: string
} OR {
  intent: 'list_git_tags'
} OR {
  intent: 'done_for_now',
  message: string
}

```

and your code looks like

```typescript
const thread = {events: [inital_message]}
const git_tags = await fetch_git_tags()

const nextStep = await determineNextStep(thread, git_tags)

while (true) {
  switch (nextStep.intent) {
    case 'deploy_backend_to_prod':
      const deploy_result = await deploy_backend_to_prod(nextStep.data.tag)
      thread.events.push({
        type: 'deploy_backend_to_prod',
        data: deploy_result,
      })
    case 'done_for_now':
      await notify_human(nextStep.message)
      break
    // ...
  }
}
```

or even just include the tags in the thread and remove the specific parameter from your prompt template:

```typescript
const thread = {events: [inital_message]}
thread.events.push({
  type: 'list_git_tags',
  data: git_tags,
})

const git_tags = await fetch_git_tags()
thread.events.push({
  type: 'list_git_tags_result',
  data: git_tags,
})
const nextStep = await determineNextStep(thread)

while (true) {
  switch (nextStep.intent) {
    case 'deploy_backend_to_prod':
      const deploy_result = await deploy_backend_to_prod(nextStep.data.tag)
      thread.events.push({
        type: 'deploy_backend_to_prod',
        data: deploy_result,
      })
    case 'done_for_now':
      await notify_human(nextStep.message)
      break
    // ...
  }
}
```

Overall:

> #### If you already know what tools you'll want the model to call, just call them DETERMINISTICALLY and let the model do the hard part of figuring out how to use their outputs

Again, AI engineering is all about Context Engineering - to wit:


### Factor 14 - everything is context engineering
 on GitHub
Everything is context engineering. LLMs are stateless functions that turn inputs into outputs. To get the best outputs, you need to give them the best inputs.

Creating great context means:

- The prompt and instructions you give to the model
- Any documents or external data you retrieve (e.g. RAG)
- Any past state, tool calls, results, or other history 
- Any past messages or events from related but separate histories/conversations (Memory)
- Instructions about what sorts of structured data to output


![220-context-engineering](https://github.com/humanlayer/12-factor-agents/blob/main/img/220-context-engineering.png)


### Factor 15 - Good things that are not context engineering

This guide is all about getting as much as possible out of today's models Notably not mentioned are 

- changes to the models parameters- parameters like temperature, top_p, frequency_penalty, presence_penalty, etc.
- training your own completion or embedding models
- Fine-tuning existing models
- All kinds of other tricks probably


## Related Resources

- Contribute to this guide [here](https://github.com/humanlayer/12-factor-agents)
- I write about some of this stuff at [The Outer Loop](https://theouterloop.substack.com)
- I do [webinars about Maximizing LLM Performance](https://github.com/hellovai/ai-that-works/tree/main) with [@hellovai](https://github.com/hellovai)
- We build OSS agents with this methodology under [got-agents/agents](https://github.com/got-agents/agents)
- We ignored all our own advice and built a [framework for running distributed agents in the kubernetes](https://github.com/humanlayer/kubechain)
- Other links from this guide:
  - [The AI Agent Index (MIT)](https://aiagentindex.mit.edu/)
  - [Mailcrew Agent](https://github.com/dexhorthy/mailcrew)
  - [Mailcrew Demo Video](https://www.youtube.com/watch?v=f_cKnoPC_Oo)
  - [Chainlit Demo](https://x.com/chainlit_io/status/1858613325921480922)
  - [TypeScript for LLMs](https://www.linkedin.com/posts/dexterihorthy_llms-typescript-aiagents-activity-7290858296679313408-Lh9e)
  - [Schema Aligned Parsing](https://www.boundaryml.com/blog/schema-aligned-parsing)
  - [Function Calling vs Structured Outputs vs JSON Mode](https://www.vellum.ai/blog/when-should-i-use-function-calling-structured-outputs-or-json-mode)
  - [BAML on GitHub](https://github.com/boundaryml/baml)
  - [OpenAI JSON vs Function Calling](https://docs.llamaindex.ai/en/stable/examples/llm/openai_json_vs_function_calling/)
  - [Outer Loop Agents](https://theouterloop.substack.com/p/openais-realtime-api-is-a-step-towards)
  - [Airflow](https://airflow.apache.org/)
  - [Prefect](https://www.prefect.io/)
  - [Dagster](https://dagster.io/)
  - [Inngest](https://www.inngest.dev/)
  - [Windmill](https://www.windmill.dev/)



