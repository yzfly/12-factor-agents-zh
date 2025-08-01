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

class ClarificationRequest {
    intent "request_more_information"
    message string @description("you can request more information from the user")
}

function DetermineNextStep(
    thread: string 
) -> DoneForNow | AddTool | SubtractTool | MultiplyTool | DivideTool | ClarificationRequest {
    client "openai/gpt-4o"

    prompt #"
        {{ _.role("system") }}

        You are a helpful assistant that can help with tasks.

        {{ _.role("user") }}

        You are working on the following thread:

        {{ thread }}

        Before deciding on the next step, think through the situation:
        1. What has been asked?
        2. What information do I have?
        3. What tools are available to me?
        4. What is the most logical next step?

        <reasoning>
        Think step by step about what needs to be done next.
        </reasoning>

        What should the next step be?

        {{ ctx.output_format }}
    "#
}