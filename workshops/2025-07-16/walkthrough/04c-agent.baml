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
  @@assert(intent_check, {{this.intent == "done_for_now"}})
}

test SimpleMath {
  functions [DetermineNextStep]
  args {
    thread #"
      [{"type": "user_input", "data": "can you multiply 3 and 4"}]
    "#
  }
  @@assert(intent_check, {{this.intent == "multiply"}})
  @@assert(a_check, {{this.a == 3}})
  @@assert(b_check, {{this.b == 4}})
}

test LongMath {
  functions [DetermineNextStep]
  args {
    thread #"
      [
        {"type": "user_input", "data": "can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result"},
        {"type": "tool_call", "data": {"intent": "multiply", "a": 3, "b": 4}},
        {"type": "tool_response", "data": 12},
        {"type": "tool_call", "data": {"intent": "divide", "a": 12, "b": 2}},
        {"type": "tool_response", "data": 6}
      ]
    "#
  }
  @@assert(intent_check, {{this.intent == "add"}})
  @@assert(a_check, {{this.a == 6}})
  @@assert(b_check, {{this.b == 12}})
}

test CompleteConversation {
  functions [DetermineNextStep]
  args {
    thread #"
      [
        {"type": "user_input", "data": "can you multiply 3 and 4, then divide the result by 2 and then add 12 to that result"},
        {"type": "tool_call", "data": {"intent": "multiply", "a": 3, "b": 4}},
        {"type": "tool_response", "data": 12},
        {"type": "tool_call", "data": {"intent": "divide", "a": 12, "b": 2}},
        {"type": "tool_response", "data": 6},
        {"type": "tool_call", "data": {"intent": "add", "a": 6, "b": 12}},
        {"type": "tool_response", "data": 18}
      ]
    "#
  }
  @@assert(intent_check, {{this.intent == "done_for_now"}})
  @@assert(answer_check, {{"18" in this.message}})
}