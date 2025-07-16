class DoneForNow {
  intent "done_for_now"
  message string 
}

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

function DetermineNextStep(
    thread: string 
) -> DoneForNow | AddTool | SubtractTool | MultiplyTool | DivideTool {
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

test SimpleMath {
  functions [DetermineNextStep]
  args {
    thread #"
      [{"type": "user_input", "data": "can you multiply 3 and 4"}]
    "#
  }
}