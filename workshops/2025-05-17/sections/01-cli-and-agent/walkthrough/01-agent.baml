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