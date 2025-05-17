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
) -> CalculatorTools | DoneForNow {
    client Qwen3
    // client "openai/gpt-4o" 

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
  @@assert(hello, {{this.intent == "done_for_now"}})
}

test MathOperation {
  functions [DetermineNextStep]
  args {
    thread #"
      {
        "type": "user_input",
        "data": "can you multiply 3 and 4?"
      }
    "#
  }
  @@assert(math_operation, {{this.intent == "multiply"}})
}

