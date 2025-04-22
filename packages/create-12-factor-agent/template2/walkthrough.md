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
npx tsx src/index.ts
```


```
git add . && git commit -m "clean up" && git show HEAD --color=always | cat
```

#### chapter 1 - cli and agent loop

```
npm i baml
npx baml-cli init
# clean up default files
rm baml_src/resume.baml
```

add our baml starter agent

```
cp walkthrough/01-agent.baml baml_src/agent.baml
npx baml-cli generate
```

for now, lets enable baml logging

```
export BAML_LOG=debug
```

call it from our ts files

```
cp walkthrough/01-cli.ts src/cli.ts
cp walkthrough/01-index.ts src/index.ts
cp walkthrough/01-agent.ts src/agent.ts
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
cp walkthrough/02-agent.baml baml_src/agent.baml
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
```

Now let's build a test with a much more complex tool call

```
BAML_LOG=info npx tsx src/index.ts 'can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result?'
```

copy the thread from the output into another test 


```
cp walkthrough/04c-agent.baml baml_src/agent.baml
```

```
npx baml-cli test
```
```
git add . && git commit -m "add tests to agent.baml" && git show HEAD --color=always | cat
```

### chapter 5 - multiple human tools

cp statements 

```
cp walkthrough/05-agent.baml baml_src/agent.baml
```

```
npx baml-cli generate
```

We can test the `request_more_information` intent by sending the llm a
garbled message.

```
npx tsx src/index.ts 'can you multiply 3 and FD*(#F&& ?'
```

lets update our cli loop to ask the human for input if the agent returns a `request_more_information` intent

```
cp walkthrough/05-agent.ts src/agent.ts
cp walkthrough/05-cli.ts src/cli.ts
```

```
npx tsx src/index.ts 'can you multiply 3 and FD*(#F&& ?'
```

lets add some tests for this behavior

```
cp walkthrough/05b-agent.baml baml_src/agent.baml
```

```
npx baml-cli test
```

looks like we also broke our hello world test, lets fix that

```
cp walkthrough/05c-agent.baml baml_src/agent.baml
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
```

```
BAML_LOG=info npx tsx src/index.ts 'can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result?'
```

mixing in xml

```
cp walkthrough/07b-agent.ts src/agent.ts
```

```
BAML_LOG=info npx tsx src/index.ts 'can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result?'
```

updating tests

```
cp walkthrough/07c-agent.baml baml_src/agent.baml
```

```
npx baml-cli test
```

### chapter 8 - adding api endpoints

First, let's add the required dependencies:

```bash
npm install express
npm install --save-dev @types/express supertest
```

Now let's create our API server:

```bash
cp walkthrough/08-server.ts src/server.ts
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

```bash
npx jest src/server.test.ts
```

```
git add . && git commit -m "add api endpoints" && git show HEAD --color=always | cat
```

### chapter 9 - in-memory state and async clarification

Now let's add state management and async clarification support:

```bash
cp walkthrough/09-state.ts src/state.ts
cp walkthrough/09-server.ts src/server.ts
```

Try out the clarification flow:

```bash
# Start a thread with unclear input
curl -X POST http://localhost:3000/thread \
  -H "Content-Type: application/json" \
  -d '{"message":"can you multiply 3 and xyz?"}'

# You'll get back a response with a response_url - use that URL to send clarification
curl -X POST 'http://localhost:3000/thread/{thread_id}/response' \
  -H "Content-Type: application/json" \
  -d '{"message":"lets use 5 instead of xyz"}'
```

Run the tests:


### chapter N - adding api endpoints server

### chapter N - making the server asynchronous


### chapter N - launching from email


### cleaning up

```
rm src/*.ts
rm -r baml_src
```

```
git add . && git commit -m "clean up" && git show HEAD --color=always | cat
```

## Todos
- fix up the reasoning prompt I can't get it to think out loud
-