# Chapter 0 - Hello World

Let's start with a basic TypeScript setup and a hello world program.

Copy initial package.json

    cp ./walkthrough/00-package.json package.json

Install dependencies

    npm install

Copy tsconfig.json

    cp ./walkthrough/00-tsconfig.json tsconfig.json

add .gitignore

    cp ./walkthrough/00-.gitignore .gitignore

Create src folder

    mkdir -p src

Add a simple hello world index.ts

    cp ./walkthrough/00-index.ts src/index.ts

Run it to verify

    npx tsx src/index.ts

You should see:

    hello, world!


# Chapter 1 - CLI and Agent Loop

Now let's add BAML and create our first agent with a CLI interface.

Install BAML

    npm i baml

Initialize BAML

    npx baml-cli init

Remove default resume.baml

    rm baml_src/resume.baml

Add our starter agent

    cp ./walkthrough/01-agent.baml baml_src/agent.baml

Generate BAML client code

    npx baml-cli generate

Enable BAML logging for development

    export BAML_LOG=debug

Add the CLI interface

    cp ./walkthrough/01-cli.ts src/cli.ts

Update index.ts to use the CLI

    cp ./walkthrough/01-index.ts src/index.ts

Add the agent implementation

    cp ./walkthrough/01-agent.ts src/agent.ts

Try it out

    npx tsx src/index.ts hello


# Chapter 2 - Add Calculator Tools

Let's add some calculator tools to our agent.

Add calculator tools definition

    cp ./walkthrough/02-tool_calculator.baml baml_src/tool_calculator.baml

Update agent to use calculator tools

    cp ./walkthrough/02-agent.baml baml_src/agent.baml

Generate updated BAML client

    npx baml-cli generate

Try out the calculator

    npx tsx src/index.ts 'can you add 3 and 4'


# Chapter 3 - Process Tool Calls in a Loop

Now let's add a real agentic loop that can run the tools and get a final answer from the LLM.

Update agent with tool handling

    cp ./walkthrough/03-agent.ts src/agent.ts

Try a simple calculation

    npx tsx src/index.ts 'can you add 3 and 4'

Turn off BAML logs for cleaner output

    export BAML_LOG=off

Try a multi-step calculation

    npx tsx src/index.ts 'can you add 3 and 4, then add 6 to that result'

Add handlers for all calculator tools

    cp ./walkthrough/03b-agent.ts src/agent.ts

Test subtraction

    npx tsx src/index.ts 'can you subtract 3 from 4'

Test multiplication

    npx tsx src/index.ts 'can you multiply 3 and 4'

Test a complex calculation

    npx tsx src/index.ts 'can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result'


# Chapter 4 - Add Tests to agent.baml

Let's add some tests to our BAML agent.

Update agent with tests

    cp ./walkthrough/04-agent.baml baml_src/agent.baml

Run the tests

    npx baml-cli test

Add more complex test cases

    cp ./walkthrough/04b-agent.baml baml_src/agent.baml

Run the tests

    npx baml-cli test

Add more complex test cases

    cp ./walkthrough/04c-agent.baml baml_src/agent.baml

Run the expanded test suite

    npx baml-cli test


# Chapter 5 - Multiple Human Tools

Add support for requesting clarification from humans.

Update agent with clarification support

    cp ./walkthrough/05-agent.baml baml_src/agent.baml

Generate updated client

    npx baml-cli generate

Update agent implementation

    cp ./walkthrough/05-agent.ts src/agent.ts

Update CLI to handle clarification requests

    cp ./walkthrough/05-cli.ts src/cli.ts

Test clarification flow

    npx tsx src/index.ts 'can you multiply 3 and FD*(#F&& '

Add tests for clarification

    cp ./walkthrough/05b-agent.baml baml_src/agent.baml

Run the tests

    npx baml-cli test

Fix hello world test

    cp ./walkthrough/05c-agent.baml baml_src/agent.baml

Verify tests pass

    npx baml-cli test


# Chapter 6 - Customize Your Prompt with Reasoning

Improve the agent's prompting by adding reasoning steps.

Update agent with reasoning steps

    cp ./walkthrough/06-agent.baml baml_src/agent.baml

Generate updated client

    npx baml-cli generate


# Chapter 7 - Customize Your Context Window

Improve the context window formatting.

Update agent with better JSON formatting

    cp ./walkthrough/07-agent.ts src/agent.ts

Test the formatting

    BAML_LOG=info npx tsx src/index.ts 'can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result'

Switch to XML formatting

    cp ./walkthrough/07b-agent.ts src/agent.ts

Test XML formatting

    BAML_LOG=info npx tsx src/index.ts 'can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result'

Update tests for XML format

    cp ./walkthrough/07c-agent.baml baml_src/agent.baml

Run the tests

    npx baml-cli test


# Chapter 8 - Adding API Endpoints

Add an Express server to expose the agent via HTTP.

Install Express and types

    npm install express && npm install --save-dev @types/express supertest

Add the server implementation

    cp ./walkthrough/08-server.ts src/server.ts

Start the server

    npx tsx src/server.ts

Test with curl (in another terminal)

    curl -X POST http://localhost:3000/thread \
  -H "Content-Type: application/json" \
  -d '{"message":"can you add 3 and 4"}'


# Chapter 9 - In-Memory State and Async Clarification

Add state management and async clarification support.

Add state management

    cp ./walkthrough/09-state.ts src/state.ts

Update server with state support

    cp ./walkthrough/09-server.ts src/server.ts

Start the server

    npx tsx src/server.ts

Test clarification flow

    curl -X POST http://localhost:3000/thread \
  -H "Content-Type: application/json" \
  -d '{"message":"can you multiply 3 and xyz"}'


# Chapter 10 - Adding Human Approval

Add support for human approval of operations.

Update server with approval flow

    cp ./walkthrough/10-server.ts src/server.ts

Update agent with approval checks

    cp ./walkthrough/10-agent.ts src/agent.ts

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


# Chapter 11 - Human Approval with HumanLayer

Integrate with HumanLayer for approvals.

Install HumanLayer

    npm install humanlayer

Update agent with HumanLayer integration

    cp ./walkthrough/11-agent.ts src/agent.ts

Update CLI with HumanLayer support

    cp ./walkthrough/11-cli.ts src/cli.ts

Run the CLI

    npx tsx src/index.ts 'can divide 4 by 5'


# Chapter 12 - HumanLayer Webhook Integration

Add webhook support for HumanLayer.

Update server with webhook support

    cp ./walkthrough/12-server.ts src/server.ts

Start the server

    npx tsx src/server.ts

