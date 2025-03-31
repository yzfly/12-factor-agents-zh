BF Preview - this is a draft of everything I've learned in a year working with agents, and I imagine it may evolve a bit as we go.

The source is public at github.com/humanlayer/12-factor-agents, and I welcome your feedback and contributions. Let's figure this out together!


## 12 Factor Agents OR "Agents the Hard Way"

*An open letter to AI Agent builders and the makers of AI Agent tooling*

## you don't have to listen to me

Whether you're new to agents or an ornery old veteran like me, I'm going to try to convince you to throw out most of what you think about AI Agents, take a step back, and rethink them from first principles. (spoiler alert if you didn't catch the OpenAI responses launch a few weeks back, but pushing MORE agent logic behind an API ain't it)

### but first, some context

I've been hacking on agents for a while. 

**I've tried every agent framework out there**, from the plug-and-play crew/langchains to the "minimalist" smolagents of the world to the "production grade" langraph, griptape, etc. 

I've talked to a lot of really strong founders, in and out of YC, who are all building really impressive things with AI. Most of them are rolling the stack themselves. Almost none of them are using a "framework".

**I've been surprised to find** that most of the products out there billing themselves as "AI Agents" are not  all that agentic. A lot of them are mostly deterministic code, with LLM steps sprinkled in at just the right points to make the experience truly magical.

Agents, at least the good ones, don't follow the "here's your prompt, here's a bag of tools, loop until you hit the goal" pattern. Rather, they are comprised of mostly just software.


**So if this magical "here's your prompt, here's your tools, go figure it out"** workflow that we see everywhere isn't the answer, then what makes an agent an agent? That is,

> **What are the principles we can use to build LLM-powered software that is actually good enough to put in the hands of production customers?**

Welcome to 12-factor agents. As every Chicago mayor since Daley has consistently plastered all over the city's major airports, we're glad you're here.

## agents are software, and a brief history thereof

let's talk about how we got here

### 60 years ago

We're gonna talk alot about Directed Graphs (DGs) and their Acyclic friends, DAGs. I'll start by pointing out that...well...software is a directed graph. There's a reason we used to represent programs as flow charts.

![010-software-dag](./img/010-software-dag.png)

### 20 years ago

Around 20 years ago, we started to see DAG orchestrators become popular. We're talking [Airflow](https://airflow.apache.org/), [Prefect](https://www.prefect.io/), some predecessors, and some more modern successors ([dagster](https://dagster.io/), [inggest](https://www.inngest.dev/), [windmill](https://www.windmill.dev/)). These followed the same graph pattern, with the added benefit of observability, modularity, retries, administration, etc.

![015-dag-orchestrators](./img/015-dag-orchestrators.png)

### 10-15 years ago

When ML models started to get good enough to be useful, we started to see DAGs with ML models sprinkled in. You might imagine steps like "summarize the text in this column into a new column" or "classify the support issues by severity or sentiment".

![020-dags-with-ml](./img/020-dags-with-ml.png)

But at the end of the day, it's still mostly the same good old deterministic software.

### the promise of agents

I'm not the first [person to say this](https://youtu.be/Dc99-zTMyMg?si=bcT0hIwWij2mR-40&t=73), but my biggest takeaway when I started learning about agents, was that you get to throw the DAG away. Instead of software engineers coding each step and edge case, you can give the agent a goal and a set of transitions:

![025-agent-dag](./img/025-agent-dag.png)

And let the LLM make decisions in real time to figure out the path

![026-agent-dag-lines](./img/026-agent-dag-lines.png)

The promise here is that you write less software, you just give the LLM the "edges" of the graph and let it figure out the nodes. You can recover from errors, you can write less code, and you may find that LLMs find novel solutions to problems.

### agents as loops

Put another way, you've got this loop consisting of 3 steps:

1. LLM determines the next step in the workflow, outputting structured json ("tool calling")
2. Deterministic code executes the tool call
3. The result is appended to the context window 
4. repeat until the next step is determined to be "done"

![027-agent-loop](./img/027-agent-loop.png)

Our initial context is just the starting event (maybe a user message, maybe a cron fired, maybe a webhook, etc),
and we ask the llm to choose the next step (tool) or to determine that we're done.


After a few steps we are passing in longer context to the LLM, telling it what happened so far and asking it to choose the next step.

![027-agent-loop-animation](./img/027-agent-loop-animation.gif)
![027-agent-loop-animation](./img/027-agent-loop-animation.mp4)



https://github.com/user-attachments/assets/3beb0966-fdb1-4c12-a47f-ed4e8240f8fd



([view as webm](./img/027-agent-loop-animation.mp4))

This is a pretty common mental model, and you could see how this leads to a lot of interesting end states where agents build whole complex software DAGs in real time, just knowing which **edges** are available.

### the problem with this "loop until you solve it" pattern

The biggest problems with this pattern:

- Agents get lost when the context window gets too long - they spin out trying the same broken approach over and over again
- literally thats it, but that's enough to kneecap the approach

Most of us put the "tool calling loop" idea to the side when we realized that anything more than 10-20 turns becomes a big mess that the LLM can't recover from.

Even if you haven't hand-rolled an agent, you've probable seen this long-context problem in working with agentic coding tools. They just get lost after a while and you need to start a new chat.

I'll even perhaps posit something I've heard in passing quite a bit:

> **Even as model context windows get longer, you'll ALWAYS get better results with a small, focused prompt and context**

### what actually works - micro agents

One thing that I **have** seen in the wild quite a bit is taking the agent pattern and sprinkling it into a broader more deterministic DAG. Having language models managing well-scoped sets of tasks makes it easy to incorporate live human feedback, translating it into workflow steps.

![micro-agent-dag](./img/028-micro-agent-dag.png)


### a real life micro agent 

Here's an example of how deterministic code might run one micro agent responsible for handling the human-in-the-loop steps for deployment. 

* **Human** Merges PR to GitHub main branch
* **Deterministic Code** Deploys to staging env
* **Deterministic Code** Runs end-to-end (e2e) tests against staging
* **Deterministic Code** Hands to agent for prod deployment, with initial context: "deploy SHA 4af9ec0 to production"
* **Agent** calls `deploy_frontend(4af9ec0)`
* **Deterministic code** requests human approval on this action
* **Human** Rejects the action with feedback "can you deploy the backend first?"
* **Agent** calls `deploy_backend(4af9ec0)`
* **Deterministic code** requests human approval on this action
* **Human** approves the action
* **Deterministic code** executed the backend deployment
* **Agent** calls `deploy_frontend(4af9ec0)`
* **Deterministic code** requests human approval on this action
* **Human** approves the action
* **Deterministic code** executed the frontend deployment
* **Agent** determines that the task was completed successfully, we're done!
* **Deterministic code** 

![031-deploybot-animation](./img/031-deploybot-animation-5.gif)

This example is based on a real life [OSS agent we've shipped to manage our deployments at Humanlayer](https://github.com/got-agents/agents/tree/main/deploybot-ts) - here is a real conversation I had with it last week:


We haven't given this agent a huge pile of tools or tasks. The primary value in the LLM is parsing the human's plaintext feedback and proposing an updated course of action. We isolate tasks and contexts as much as possible to keep

Another [more classic support / chatbot demo](https://x.com/chainlit_io/status/1858613325921480922).

### what actually works - full control vs. black boxes

You'll notice we're doing a copule things that are not compatible with the more black-boxy frameworks out there.


!black box - tool-calling loop

### so what's an agent really?

prompt
switch statement + control flow
for loop
accumlated context

In the above example, we gain a couple benefits from owning the control flow and context accumulation:

- We can hijack control flow to pause for human input or to wait for completion of long-running tasks
- We can serialize the context window trivially for pause+resume
- We can add arbitrary steps in between any step
- We can optimize the heck out of how we pass "what happened so far" to the LLM

Anyways, if that's interesting, the rest of this will formalize these patterns into a methodology that can be applied to add impressive AI features to any software project.

## Enter 12-factor agents

In building HumanLayer, I've talked to at least 100 SaaS builders (mostly technical founders) looking to make their existing product more agentic. The journey usually goes something like:

1. Decide you want to build an agent
2. Product design, UX mapping, what problems to solve
3. Want to move fast, so grab $FRAMEWORK and get to building*
4. Get to 80-90% quality bar 
5a. Realize that 90% isn't good enough for most customer-facing features
5b. Realize that getting past 90% requires reverse-engineering the framework, prompts, flow, etc
6. Start over from scratch

**DISCLAIMER**: I'm not sure the exact right place to say this, but here seems as good as any: **this in BY NO MEANS meant to be a dig on either the many frameworks out there, or the pretty dang smart people who work on them**. They enable incredible things and have accelerated the AI ecosystem. 

I hope that one outcome of this post is that agent framework builders can learn from the journeys of myself and others, and make frameworks even better. Especially for builders who wanna move fast but need deep control.

**DISCLAIMER 2**: I'm not going to talk about MCP. I'm sure you can see where it fits in.

Anyways back to the thing...

### Goals for the rest of this

After digging hundreds of AI libriaries and working with dozens of founders, my instinct is this:

1. There are some core things that make agents great
2. Going all in on a framework and building what is essentially a greenfield rewrite may be counter-productive
3. There are some core principles that make agents great, and you will get most/all of them if you pull in a framework
4. The fastest way I've seen for builders to get good AI software in the hands of customers is to take small, modular concepts from agent building, and incorporate them into their existing product
5. These modular concepts from agents can be defined and applied by most skilled software engineers, even if they don't have an AI background

> ### The fastest way I've seen for builders to get good AI software in the hands of customers is to take small, modular concepts from agent building, and incorporate them into their existing product

## the twelve factors

enough with the fluff, let's dig into the 12 factors that define our methodology.

### 1. Natural Language → Tool Calls

One of the most common patterns in agent building is to convert natural language to structured tool calls. This is a powerful pattern that allows you to build agents that can reason about tasks and execute them.

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
      "memo": "Hey Terri - see below for the payment link for the february ai tinkerers meetup"
    }
  }
}
```

**Note**: this is greatly simplified, a [real agent that does this](https://github.com/dexhorthy/mailcrew) ([video](https://www.youtube.com/watch?v=f_cKnoPC_Oo)) would list customers, list products, list prices, etc to build this payload with the proper ids, or include those ids in the prompt/context window (we'll see below how those are kinda the same thing though!)

From there, deterministic code can pick up the payload and do something with it.

```typescript
// The LLM takes natural language and returns a structured object
const nextStep = await determineNextStep("create a payment link for $750 to Terri for sponsoring the february AI tinkerers meetup")

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

### 2. Small, Focused Agents

The next factor is about building 







































These early experiments revealed significant challenges when deploying agent systems to production:

1. **Reliability issues**: Agents would get stuck in loops, hallucinate capabilities, or fail to make progress
2. **Quality Limitations**: no matter how much I tuned prompts, it was quite hard .

2. **Debugging difficulties**: Tracing through chains of thought to find errors was nearly impossible
3. **Context management problems**: As conversations grew, agents would lose track of context and spin out into error loops, trying the same broken approach over and over again
4. **Framework limitations**: Existing frameworks struggled to find the right balance between productivity and flexibility. They either abstracted away too much into black boxes that were hard to customize, or became so flexible they offered little value over building from scratch. We found ourselves digging through layers of abstractions and prompt templates just to make minor improvements.

After testing multiple frameworks and encountering similar limitations with each, we recognized the need for a different approach. Instead of adapting frameworks to our requirements, we decided to build from first principles, focusing on:

- Clear separation between reasoning and action
- Maintainable code with familiar patterns
- Robust error handling
- Effective human oversight

This led to a simpler architecture: using LLMs to convert natural language to structured tool calls, then handling those tool calls with traditional programming patterns. Our first production system built on these principles was the Linear Assistant - an agent that helps teams manage their project workflows in Linear through email interactions. It was deliberately focused on a narrow domain, but within that domain, it was remarkably effective. What made this approach different was its simplicity. Instead of trying to be everything to everyone, it did one thing well. And instead of relying on complex frameworks, it used patterns familiar to any software developer.

We stripped everything back to basics. We defined clear interfaces between components. We separated reasoning from action. We built testable, maintainable systems that happened to use LLMs, rather than LLM systems that happened to be software.

Our first production system built on these principles was the Linear Assistant - an agent that helps teams manage their project workflows in Linear through email interactions. It was deliberately focused on a narrow domain, but within that domain, it was remarkably effective. What made this approach different was its simplicity. Instead of trying to be everything to everyone, it did one thing well. And instead of relying on complex frameworks, it used patterns familiar to any software developer.

As we built more agents using this approach, we began to see common patterns emerge. These patterns weren't specific to any particular domain or use case - they were fundamental principles for building robust agent systems. We codified these principles as the "12-Factor Agents" methodology, inspired by Heroku's influential 12-Factor App framework for building cloud-native applications.

- Breaking out of chat interfaces to build [outer loop agents](https://theouterloop.substack.com/p/openais-realtime-api-is-a-step-towards)
We codified these principles as the "12-Factor Agents" methodology, inspired by Heroku's influential 12-Factor App framework. Just as the original 12-Factor App methodology helped developers navigate the transition to cloud computing, we hope our 12-Factor Agents methodology will help teams build robust, maintainable AI agents that deliver real value in production environments.

## How We Got Here

Our journey to this approach wasn't straightforward. When we first started building AI agents in early 2023, we were captivated by the promise of fully autonomous systems. The viral success of AutoGPT had everyone imagining agents that could independently tackle complex tasks with minimal human oversight. We jumped on this bandwagon, experimenting with various frameworks that promised to deliver this autonomous future.

Our first attempts were built on top of LangChain, using its agent frameworks to create systems that could reason about tasks and execute them. While these worked well for demos and simple use cases, we quickly hit limitations when trying to deploy them in production:

1. **Reliability issues**: The agents would sometimes get stuck in loops, hallucinate capabilities, or simply fail to make progress. One agent confidently told a customer we offered a product that didn't exist, then proceeded to make up pricing details!
2. **Debugging nightmares**: When things went wrong, it was nearly impossible to understand why or how to fix it. Tracing through 50KB of nested JSON chains felt like archaeological work, not software engineering.
3. **Context window bloat**: As conversations grew longer, the agents would lose track of earlier context, spiraling into error loops trying the same thing over and over again. We watched in horror as one agent tried the same API call with the same parameters five times in a row, each time getting the same error.
4. **Lack of control**: The frameworks made too many decisions for us, leaving us unable to customize critical behaviors. We spent more time fighting the framework than building features.


Next, we tried other frameworks - each promising to solve the problems of the last. We experimented with CrewAI for multi-agent collaboration, AutoGen for more structured agent interactions, and even built our own mini-frameworks on top of these tools. While each framework had its strengths, they all shared a common weakness: they abstracted away too much of the underlying mechanics, making it difficult to build truly robust systems.

The breaking point came when we tried to implement a seemingly simple feature: having an agent remember the context of a conversation across multiple sessions. What should have been straightforward turned into a complex integration challenge that required hacking around the framework's assumptions. After three days of fighting with serialization issues and context management, we realized we were solving the wrong problem.

In late 2023, we decided to take a step back and reconsider our approach. Instead of starting with a framework and trying to bend it to our needs, what if we started with first principles and built exactly what we needed? We began by defining the core capabilities we wanted in our agents:
- Reliable execution of tasks
- Clear separation between reasoning and action
- Maintainable codebase that developers could understand
- Ability to handle errors gracefully
- Human oversight for critical operations

This led us to a much simpler architecture: use LLMs to convert natural language to structured tool calls, then use traditional programming patterns to handle those tool calls. No complex frameworks, no black-box reasoning - just clean interfaces between components.

Our first production system built on these principles was the Linear Assistant - an agent that helps teams manage their project workflows in Linear through email interactions. It was deliberately focused on a narrow domain, but within that domain, it was remarkably effective. What made this approach different was its simplicity. Instead of trying to be everything to everyone, it did one thing well. And instead of relying on complex frameworks, it used patterns familiar to any software developer.

As we built more agents using this approach, we began to see common patterns emerge. These patterns weren't specific to any particular domain or use case - they were fundamental principles for building robust agent systems. We codified these principles as the "12-Factor Agents" methodology, inspired by Heroku's influential 12-Factor App framework for building cloud-native applications.

## Our Example: The Linear Assistant

Throughout this article, we'll reference a real-world agent we've built: the Linear Assistant. This agent helps teams manage their project workflows in Linear (a project management tool) through natural language interactions via email. Users can email the assistant to create issues, add comments, update statuses, and more.

The Linear Assistant demonstrates all 12 factors in action:
- It processes natural language emails and converts them to structured tool calls
- It maintains context across multiple interactions
- It handles errors gracefully and adapts its approach
- It knows when to ask humans for clarification or approval
- It can be triggered from various channels (primarily email)


With this example in mind, let's dive into the 12 factors that define our methodology.

## 1. Natural Language → Tool Calls

```mermaid
graph LR
    A[Natural Language] --> B[LLM]
    B --> C[Structured Tool Call]
    C --> D[Application Logic]
```

At the core of our approach is a simple pattern: convert natural language to structured tool calls. Instead of building complex chains of prompts and hoping for the best, we focus on teaching our LLMs to output structured data that our systems can reliably act upon.

```typescript
// The LLM takes natural language and returns a structured tool call
const nextStep = await b.DetermineNextStep("make an issue for austin to stock the fridges")

// Handle the structured output based on its intent
switch (nextStep.intent) {
  case 'create_issue':
    // Code to create an issue
    break;
  case 'request_more_information':
    // Code to ask the user for more info
    break;
}
```

This pattern creates a clean interface between the LLM's reasoning and your application logic. It makes your code more maintainable, easier to test, and simpler to extend with new capabilities. When the LLM's output is structured, you can validate it before execution, preventing many common failure modes.

## 2. Small, Focused Agents

```mermaid
graph TD
    A[Monolithic Agent] --> B[Too Complex]
    C[Small Focused Agent] --> D[Manageable Context Window]
    C --> E[Clear Responsibility]
    C --> F[Better LLM Performance]
```

Rather than building monolithic agents that try to do everything, build small, focused agents that do one thing well. Each agent should have a clear responsibility boundary.

The key insight here is about LLM limitations: the bigger and more complex a task is, the more steps it will take, which means a longer context window. As context grows, LLMs are more likely to get lost or lose focus! By keeping agents focused on specific domains, we keep context windows manageable and LLM performance high.

Our Linear Assistant handles email-based issue management in Linear. It doesn't try to also manage GitHub issues, calendar scheduling, or data analysis. This focus allows it to excel at its specific task.

We learned this lesson the hard way when we initially tried to build a "super agent" that could handle multiple tools and workflows. The agent would frequently confuse which API to use for which task and lose track of multi-step processes. By splitting this into focused agents with clear responsibilities, reliability improved dramatically.

## 3. Compact Errors into Context Window

```mermaid
graph LR
    A[Operation] -->|Fails| B[Error]
    B --> C[Compact Error]
    C --> D[Add to Context]
    D --> E[LLM Processes Error]
    E --> F[Adapt Approach]
```

When something goes wrong, don't hide it from your agent. Compact the error information and include it in the context window:

```typescript
try {
  // Operation that might fail
} catch (e) {
  console.error(e)
  thread.events.push({
    type: 'error',
    data: `error running ${thread.events.slice(-1)[0].type}: ${e}`,
  })
  
  // Feed the error back to the LLM
  const nextStep = await b.DetermineNextStep(threadToPrompt(thread))
  // Continue processing with awareness of the error
}
```

This allows your agent to learn from mistakes and adapt its approach in real-time, just like a human would. In practice, this approach has been transformative. When our Linear Assistant encounters an error like "Invalid team ID format," it doesn't just fail – it recognizes the error, lists available teams, and tries again with the correct ID. Users often don't even realize an error occurred because the agent recovered so seamlessly.

## 4. Use Tools for Human Interaction

```mermaid
graph TD
    A[LLM Decision] --> B{Need Human Input?}
    B -->|Yes| C[Request Clarification]
    B -->|No| D[Continue Processing]
    B -->|Done| E[Done For Now]
    C --> F[Wait for Response]
    F --> G[Resume Processing]
```

Human interaction should be treated as just another tool call. By modeling human input requests as structured outputs, you create a uniform pattern throughout your codebase:

```typescript
// Tool definitions for human interaction
class RequestClarification {
  intent: "request_clarification"
  question: string
  context: string
}

class DoneForNow {
  intent: "done_for_now"
  message: string
  summary: string
}
```

This approach gives the LLM specific options for how and when to contact humans, with clear structures for what information to include, rather than generic "text OR json" outputs that are common in chat interfaces.

By treating human interaction as a first-class concept in your agent architecture, you make it easier to build systems that know when to operate autonomously and when to involve humans. This creates a more natural collaboration between humans and AI, where each contributes their strengths.

## 5. Tools Are Just Structured Output

```mermaid
graph LR
    A[LLM] -->|JSON Output| B[Structured Data]
    B --> C[Validation]
    C --> D[External API Call]
    D --> E[Result]
```

Tools don't need to be complex. At their core, they're just structured output from your LLM that triggers deterministic code:

```baml
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
}
```

The pattern is simple:
1. LLM outputs structured JSON
2. Your code validates the structure
3. Deterministic code executes the appropriate action (like calling an external API)
4. Results are captured and fed back into the context

This creates a clean separation between the LLM's decision-making and your application's actions. The LLM decides what to do, but your code controls how it's done. This separation makes your system more reliable and easier to debug when things go wrong.

## 6. Own Your Prompts

```mermaid
graph TD
    A[Prompt as Code] --> B[Version Control]
    A --> C[Testing]
    A --> D[Iteration]
    C --> E[Evaluation]
    D --> E
    E --> D
```

Don't outsource your prompt engineering to a framework. Own your prompts and treat them as first-class citizens in your codebase:

```baml
function DetermineNextStep(thread: string) -> /* various tool types */ {
    client CustomGPT4o

    prompt #"
        {{ _.role("system") }}

        You are a helpful assistant that helps the user with their linear issue management.
        You work hard for whoever sent the inbound initial email, and want to do your best
        to help them do their job by carrying out tasks against the linear api.

        // ... rest of prompt ...

        {{ _.role("user") }}

        // ... user-specific instructions ...

        {{ thread }}

        What should the next step be?

        {{ ctx.output_format }}
    "#
}
```

By maintaining direct control over your prompts, you can:
1. Version control them alongside your code
2. Test them with specific examples
3. Iterate based on real-world performance

Testing is particularly powerful with this approach:

```baml
test TeamIDErrorAsksForMoreInput {
  functions [DetermineNextStep]
  args {
    thread #"
      
          Events:
              <email_received>:
                  {"from_address":"test@example.com","to_address":"support@company.com","subject":"New Ticket","body":"Can you make a new issue for Austin to restock the fridges with tasty beers?","message_id":"test123","previous_thread":[],"raw_email":"raw email content","is_test":null}
              </email_received>
              
      <create_issue> 
                  Title: Restock fridges with tasty beers
                  Description: Austin is requested to restock the fridges with tasty beers.
                  Team ID: team_supply_maintenance
              </create_issue>
              
      <issue_create_result>: 
                  {"errors": [{"message": "Argument Validation Error", "path": ["issueCreate"], "locations": [{"line": 3, "column": 13}], "extensions": {"code": "INVALID_INPUT", "type": "invalid input", "userError": true, "userPresentableMessage": "teamId must be a UUID.", "meta": {}}}], "data: null}"
              </issue_create_result>
              
          
    "#
  }
  @@assert({{this.intent == "list_teams"}})
}
```

This allows you to verify that your agent behaves as expected in specific scenarios. By writing tests for your prompts, you can catch regressions before they affect users and systematically improve your agent's behavior over time.

## 7. Own How You Build Context

```mermaid
graph TD
    A[Events] --> B[Format Events]
    B --> C[Build Context]
    C --> D[Send to LLM]
```

Don't be constrained by the standard message-based context building of most frameworks. Build your context however makes sense for your application.

### Standard OpenAI Message Format

Most frameworks use the OpenAI message format, which, for tool calling, might look like this:

```json
[
  {
    "role": "system",
    "content": "You are a helpful assistant that helps users manage their Linear issues."
  },
  {
    "role": "user",
    "content": "Can you create an issue for Austin to restock the fridges?"
  },
  {
    "role": "assistant",
    "content": null,
    "function_call": {
      "name": "list_teams",
      "arguments": "{}"
    }
  },
  {
    "role": "tool",
    "name": "list_teams",
    "content": "{\"teams\": [{\"id\": \"team-123\", \"name\": \"Operations\", \"members\": [{\"id\": \"user-456\", \"name\": \"Austin\"}]}]}"
  },
  {
    "role": "assistant",
    "content": "I'll create an issue for Austin to restock the fridges in the Operations team."
  }
]
```

This format works well for simple chat applications, but it has limitations for complex agents:
- It's difficult to include structured data
- It's hard to represent tool calls and their results
- It's challenging to maintain context across multiple interactions
- It's not optimized for error handling and recovery

### Custom Context Format

Instead, we can build our own context format that's optimized for our specific use case:

```typescript
const eventToPrompt = (event: Event) => {
  switch (event.type) {
    case 'email_received':
      const email = event.data as EmailPayload
      return `<${event.type}>
            From: ${email.from_address}
            To: ${email.to_address}
            Subject: ${email.subject}
            Body: ${email.body}
            Previous Thread: ${stringifyToYaml(email.previous_thread)}
</${event.type}>
        `
    default:
      const data = typeof event.data !== 'string' ? stringifyToYaml(event.data) : event.data
      return `<${event.type}>
          ${data}
</${event.type}>
      `
  }
}

const threadToPrompt = (thread: Thread) => {
  return thread.events.map(eventToPrompt).join('\n\n')
}
```

This approach gives you complete control over the information density and format of your context window.

### Example Context Windows

Here are some examples of how context windows might look with this approach.

In our case, these just become part of our [single user message](https://github.com/got-agents/agents/blob/main/linear-assistant-ts/baml_src/agent.baml#L28-L58) that we repeatedly pass to the LLM during `DetermineNextStep`.

**Example 1: Initial Email Request**
```
<email_received>
    From: user@example.com
    To: linear-assistant@company.com
    Subject: Create issue for restocking
    Body: Can you please create an issue for Austin to restock the fridges with drinks? It's getting empty.
    Previous Thread: []
</email_received>
```

**Example 2: After Listing Teams**
```
<email_received>
    From: user@example.com
    To: linear-assistant@company.com
    Subject: Create issue for restocking
    Body: Can you please create an issue for Austin to restock the fridges with drinks? It's getting empty.
    Previous Thread: []
</email_received>

<list_teams>
    intent: "list_teams"
</list_teams>

<list_teams_result>
    data:
      teams:
        nodes:
          - id: "team-123"
            name: "Operations"
            members:
              nodes:
                - id: "user-456"
                  name: "Austin"
                - id: "user-789"
                  name: "Sarah"
</list_teams_result>
```

**Example 3: After Error and Recovery**
```
<email_received>
    From: user@example.com
    To: linear-assistant@company.com
    Subject: Create issue for restocking
    Body: Can you please create an issue for Austin to restock the fridges with drinks? It's getting empty.
    Previous Thread: []
</email_received>

<create_issue>
    intent: "create_issue"
    issue:
      title: "Restock fridges with drinks"
      description: "The fridges are getting empty and need to be restocked with drinks."
      team_id: "wrong-id"
      assignee_id: "user-456"
</create_issue>

<error>
    error running create_issue: Invalid team ID format
</error>

<list_teams>
    intent: "list_teams"
</list_teams>

<list_teams_result>
    data:
      teams:
        nodes:
          - id: "team-123"
            name: "Operations"
            members:
              nodes:
                - id: "user-456"
                  name: "Austin"
                - id: "user-789"
                  name: "Sarah"
</list_teams_result>

<create_issue>
    intent: "create_issue"
    issue:
      title: "Restock fridges with drinks"
      description: "The fridges are getting empty and need to be restocked with drinks."
      team_id: "team-123"
      assignee_id: "user-456"
</create_issue>

<issue_create_result>
    data:
      issueCreate:
        success: true
        issue:
          id: "issue-001"
          title: "Restock fridges with drinks"
          url: "https://linear.app/company/issue/OPS-42"
</issue_create_result>
```

**Example 4: Human Interaction**
```
<email_received>
    From: user@example.com
    To: linear-assistant@company.com
    Subject: Create issue for project
    Body: Can you create an issue for the new project?
    Previous Thread: []
</email_received>

<request_more_information>
    intent: "request_more_information"
    message: "I'd be happy to create an issue for the new project. Could you please provide more details about what the issue should contain? For example, what's the title, description, and who should be assigned to it?"
</request_more_information>

<human_response>
    message: "The issue should be titled 'Set up new marketing project', assigned to Sarah, with description 'Initialize the new Q3 marketing campaign project with initial tasks and timeline'."
</human_response>

<list_users>
    intent: "list_users"
</list_users>

<list_users_result>
    data:
      users:
        nodes:
          - id: "user-789"
            name: "Sarah"
            email: "sarah@company.com"
          - id: "user-456"
            name: "Austin"
            email: "austin@company.com"
</list_users_result>
```

The XML-style format is an arbitrary thing that I happen to like, the point is you can build your own format that makes sense for your application. I don't know what is the best way to pass agentic context windows, but I do know that you'll get better quality if you have the flexibility to experiment.

## 8. Own Your Control Flow

```mermaid
graph TD
    A[Start or Resume] --> B[Get Next Step]
    B --> C[Handle Step]
    C --> D{Continue?}
    D -->|Yes| B
    D -->|No| E[End Processing]
    E -->|Later| F[Resolved/Approved/Responded]
    F --> A
```

Don't let frameworks dictate your application's flow. Build your own control structures that make sense for your specific use case. Specifically, certain types of tool calls may be reason to break out of the loop and wait for a response from a human or another long-running task like a training pipeline. The below example shows three possible control flow patterns:

- request_clarification: model asked for more info, break the loop and wait for a response from a human
- fetch_open_issues: model asked for a list of open issues, fetch the issues, append to context window, and pass straight back to the model
- create_issue: model asked to create an issue, this is a high-stakes thing, so break the loop and wait for human approval

```typescript
const handleNextStep = async (thread: Thread): Promise<void> => {

  while (true) {
    const nextStep = await b.DetermineNextStep(threadToPrompt(nextThread))
    
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

1. Pause the task in memory (think `while...sleep`) and restart it from the beginning if the process is interrupted.
2. Restrict the agent to only low-stakes, low-risk calls
3. Give the agent access to do bigger, more useful things, and just yolo hope it doesn't screw up

## 9. Simplify with Context Window State

```mermaid
graph TD
    A[Thread State] --> B[Serialize]
    B --> C[Store in Database]
    C --> D[Webhook Received]
    D --> E[Load from Database]
    E --> F[Resume Processing]
```

Keep your state management simple by storing all state in a serializable thread object:

```typescript
// Append events to the thread
thread.events.push({
  type: 'create_issue',
  data: nextStep,
})

// Serialize and save state to database
const threadId = await db.saveThread(thread)

// In webhook handler, load state and resume
const handleWebhook = async (req: Request, res: Response) => {
  const { threadId, response } = req.body
  
  // Load thread state from database
  const thread = await db.getThread(threadId)
  
  // Add the human response to the thread
  thread.events.push({
    type: 'human_response',
    data: response,
  })
  
  // Resume processing
  await handleNextStep(thread)
}
```

This approach makes your agent stateless between requests, improving reliability and scalability.

## 10. APIs to Kick Off and Resume Agents

```mermaid
graph TD
    A[New Request] --> B[Initialize Thread]
    C[Human Response] --> D[Load Thread]
    B --> E[Process Thread]
    D --> E
```

Design clear APIs for starting new agent threads and resuming existing ones:

```typescript

type EmailWebhookPayload = {
  event: {
    from_address: string
    to_address: string
    subject: string
    body: string
    // more fields snipped for brevity
  }
}

app.post('/new-email-thread', async (req: Request, res: Response) => {
  const payload = req.body as EmailWebhookPayload
  await newEmailThreadHandler(payload, res)
})

// New email handler to start a thread
const newEmailThreadHandler = async (payload: EmailWebhookPayload, res: Response) => {
  // Initialize a new thread
  let thread: Thread = {
    initial_email: payload.event,
    events: [
      {
        type: 'email_received',
        data: payload.event,
      },
    ],
  }
  
  // Start processing
  await handleNextStep(thread)
}
```

```typescript

app.post('/resume-email-thread', async (req: Request, res: Response) => {
  const payload = req.body as {
    threadId: string
    response: string
  }
  await handleHumanResponse(payload, res)
})

// Handler for human responses to resume a thread
const handleHumanResponse = async (thread: Thread, response: string): Promise<void> => {
  // Add the human response to the thread
  thread.events.push({
    type: 'human_response',
    data: response,
  })
  
  // Continue processing from where we left off
  await handleNextStep(thread)
}
```

These APIs create clean boundaries for thread lifecycle management.

## 11. Trigger Agents from Anywhere

```mermaid
graph LR
    A[Email] --> D[Agent]
    B[Slack] --> D
    C[SMS] --> D
    D --> E[Email]
    D --> F[Slack]
    D --> G[SMS]
```

Meet users where they are by designing your agents to be triggered from various channels. This flexibility allows your agents to integrate seamlessly with email, Slack, SMS, or any other communication channel.

The key is to abstract the input and output channels from the core agent logic, allowing the same agent to be triggered from and respond through multiple channels.

## 12. Make Your Agent a Stateless Reducer

```mermaid
graph LR
    A[Current State] --> C[Agent Function]
    B[Event] --> C
    C --> D[New State]
    D --> E[Continue or Break]
```

Design your agent as a stateless reducer that takes the current state and an event, then returns a new state:

```typescript
// The agent is a pure function: (state, event) => new state
const _handleNextStep = async (
  thread: Thread,  // Current state
  nextStep: Action,  // Event
): Promise<Thread | false> => {
  // Create a new state based on the current state and event
  switch (nextStep.intent) {
    case 'list_teams':
      thread.events.push({
        type: 'list_teams',
        data: nextStep,
      })
      thread = await appendResult(thread, () => linearClient.teams(), 'teams')
      return thread
    case 'request_clarification':
      thread.events.push({
        type: 'request_clarification',
        data: nextStep,
      })
      // Save state and wait for human input
      await db.saveThread(thread)
      return false
    // ... other cases
  }
}

// The overall pattern is:
// 1. Prompt (DetermineNextStep)
// 2. Switch (handle the intent)
// 3. Loop or Break (continue processing or wait for input)
```

This functional approach makes your agent easier to test, debug, and scale.

## Bringing It All Together

By following these 12 factors, we've built agents that are robust, maintainable, and effective at solving real business problems. The Linear Assistant we've created can:

1. Receive emails requesting Linear issue creation or updates
2. Parse and understand complex natural language requests
3. Take appropriate actions through the Linear API
4. Request human approval for sensitive operations
5. Ask for clarification when needed
6. Maintain context across multiple interactions
7. Respond naturally to users via email

And it does all this through a simple, clear architecture that our team can easily maintain and extend.

## Conclusion

Building agents "the hard way" might seem like more work initially, but the benefits are substantial. You gain complete control over your agent's behavior, eliminating the black-box problems that plague many framework-based approaches.

The 12-Factor Agent methodology creates a clear separation of concerns:
- LLMs handle natural language understanding and decision-making
- Your code handles structured actions and external integrations
- Humans provide oversight and handle edge cases

This separation allows each part of the system to do what it does best, creating agents that are truly useful rather than merely impressive demos.

As we look to the future, we see these principles becoming even more important. As LLM capabilities continue to advance, the bottleneck in agent development will shift from "can the model understand this task?" to "can we build reliable systems around these models?" The teams that master these engineering challenges will be the ones that successfully deploy AI agents that create lasting business value.

Whether you're building customer service agents, internal tools, or complex workflow automation, the 12-Factor approach provides a solid foundation that will scale with both your ambitions and the rapidly evolving capabilities of foundation models.





### The challenge 

My personal challenge is primarily in trying to drive adoption of agent building blocks when most SaaS builders I talk to want to go all in 

I don't think frameworks are the answer, but I also don't think they're the problem. The problem is 

Building agent frameworks is hard. Make them too easy, and they become black boxes you can't customize. Make them too flexible, and why use a framework at all?

We've all been there. The framework gets you to 80% fast. Then you spend weeks digging through abstractions just to get to 85%.

This isn't just agents. It's LLM evals, prompt registries, observability - the whole AI tooling ecosystem. Everyone wants that sweet spot between productivity and flexibility. No one's found it yet.

That's why I'm proposing that we still need to be building agents the hard way. Most YC founders I talk to have been on similar journeys, and opted to pay the cost of building from scratch for the benefit of controlling your own destiny


### Where we go from here

If you made it this far, thanks for reading and hope this was useful or at least thought provoking.

We've got some ideas on where we go from here. Please share your thoughts, what you might be interested to collaborate on, or where else you think the agents ecosystem is headed.

- Building agent frameworks that provide these building blocks, or that provide scaffolding to implement them (think `npx create` for 12-factor agents)
- Putting on an all day hands-on workshop to dive deep on these concepts, perhaps with some other YC founders
- Shipping more OSS agents that demonstrate these concepts, we're all out here learning in the open

What else did I miss? Where can we collab?


### Credits


*Thanks to @vaibhav @jj @meji, Ted Nyman, and Marc Campbell for feedback on early drafts of this article.*

The code referenced uses 

- []
