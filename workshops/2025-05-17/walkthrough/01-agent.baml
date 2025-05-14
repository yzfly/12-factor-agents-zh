class DoneForNow {
  intent "done_for_now"
  message string 
}

client<llm> Qwen3 {
  provider "openai-generic"
  options {
    base_url "https://model-4w7jrl6w.api.baseten.co/environments/production/predict"
    api_key "QQksI6f4.mFAZX9D0DevBQMUWs2OV8gcfzMUinN9N"
  }
}

function DetermineNextStep(
    thread: string 
) -> DoneForNow {
    client Qwen3

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