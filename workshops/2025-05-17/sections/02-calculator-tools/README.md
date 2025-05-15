# Chapter 2 - Add Calculator Tools

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

