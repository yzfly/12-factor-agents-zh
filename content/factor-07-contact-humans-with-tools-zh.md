[← 返回README](https://github.com/humanlayer/12-factor-agents/blob/main/README.md)

### 7. 通过 Tool Calling 联系人类

默认情况下，大语言模型 API 依赖于一个基本的高风险 token 选择：我们是返回纯文本内容，还是返回结构化数据？

![170-contact-humans-with-tools](https://github.com/humanlayer/12-factor-agents/blob/main/img/170-contact-humans-with-tools.png)

你在第一个 token 的选择上投入了很大的权重，在 `the weather in tokyo` 的情况下，是

> "the"

但在 `fetch_weather` 的情况下，它是一些特殊的 token 来表示 JSON 对象的开始。

> |JSON>

你可能通过让大语言模型 **始终** 输出 json，然后用一些自然语言 token 如 `request_human_input` 或 `done_for_now` 来声明它的意图 (而不是像 `check_weather_in_city` 这样的"正确"工具) 来获得更好的结果。

再次强调，你可能不会从中获得任何性能提升，但你应该实验，并确保你可以自由地尝试奇怪的东西来获得最佳结果。

```python

class Options:
  urgency: Literal["low", "medium", "high"]
  format: Literal["free_text", "yes_no", "multiple_choice"]
  choices: List[str]

# Tool definition for human interaction
class RequestHumanInput:
  intent: "request_human_input"
  question: str
  context: str
  options: Options

# Example usage in the agent loop
if nextStep.intent == 'request_human_input':
  thread.events.append({
    type: 'human_input_requested',
    data: nextStep
  })
  thread_id = await save_state(thread)
  await notify_human(nextStep, thread_id)
  return # Break loop and wait for response to come back with thread ID
else:
  # ... other cases
```

稍后，你可能会从处理 slack、email、sms 或其他事件的系统接收 webhook。

```python

@app.post('/webhook')
def webhook(req: Request):
  thread_id = req.body.threadId
  thread = await load_state(thread_id)
  thread.events.push({
    type: 'response_from_human',
    data: req.body
  })
  # ... simplified for brevity, you likely don't want to block the web worker here
  next_step = await determine_next_step(thread_to_prompt(thread))
  thread.events.append(next_step)
  result = await handle_next_step(thread, next_step)
  # todo - loop or break or whatever you want

  return {"status": "ok"}
```

上述内容包括来自[因子 5 - 统一执行状态和业务状态](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-05-unify-execution-state.md)、[因子 8 - 掌控你的控制流](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-08-own-your-control-flow.md)、[因子 3 - 掌控你的上下文窗口](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-03-own-your-context-window.md)和[因子 4 - 工具只是结构化输出](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-04-tools-are-structured-outputs.md)以及其他几个的模式。

如果我们使用来自[因子 3 - 掌控你的上下文窗口](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-03-own-your-context-window.md)的 XML 格式，我们的上下文窗口在几轮之后可能看起来像这样：

```xml

(snipped for brevity)

<slack_message>
    From: @alex
    Channel: #deployments
    Text: Can you deploy backend v1.2.3 to production?
    Thread: []
</slack_message>

<request_human_input>
    intent: "request_human_input"
    question: "Would you like to proceed with deploying v1.2.3 to production?"
    context: "This is a production deployment that will affect live users."
    options: {
        urgency: "high"
        format: "yes_no"
    }
</request_human_input>

<human_response>
    response: "yes please proceed"
    approved: true
    timestamp: "2024-03-15T10:30:00Z"
    user: "alex@company.com"
</human_response>

<deploy_backend>
    intent: "deploy_backend"
    tag: "v1.2.3"
    environment: "production"
</deploy_backend>

<deploy_backend_result>
    status: "success"
    message: "Deployment v1.2.3 to production completed successfully."
    timestamp: "2024-03-15T10:30:00Z"
</deploy_backend_result>
```


好处：

1. **清晰指令**：不同类型人类联系的工具允许大语言模型更具体
2. **内循环 vs 外循环**：支持传统 chatGPT 样式界面**之外**的 Agent 工作流程，其中控制流和上下文初始化可能是 `Agent->人类` 而不是 `人类->Agent` (例如，由 cron 或事件启动的 Agent)
3. **多人类访问**：可以通过结构化事件轻松跟踪和协调来自不同人类的输入
4. **多 Agent**：简单的抽象可以轻松扩展以支持 `Agent->Agent` 请求和响应
5. **持久性**：与[因子 6 - 使用简单 API 启动/暂停/恢复](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-06-launch-pause-resume.md)结合，这使得持久、可靠和可内省的多人工作流程成为可能

[更多关于外循环 Agent 的信息在这里](https://theouterloop.substack.com/p/openais-realtime-api-is-a-step-towards)

![175-outer-loop-agents](https://github.com/humanlayer/12-factor-agents/blob/main/img/175-outer-loop-agents.png)

与[因子 11 - 从任何地方触发，在用户所在的地方与他们会面](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-11-trigger-from-anywhere.md)配合得很好

[← 启动/暂停/恢复](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-06-launch-pause-resume.md) | [掌控你的控制流 →](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-08-own-your-control-flow.md)