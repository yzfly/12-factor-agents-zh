[← 返回README](https://github.com/humanlayer/12-factor-agents/blob/main/README.md)

### 9. 将错误压缩到上下文窗口

这个因子比较简单但值得一提。Agent 的好处之一是"自我修复" - 对于短任务，大语言模型可能调用一个失败的工具。优秀的大语言模型有相当大的机会读取错误消息或堆栈跟踪，并找出在后续 Tool Calling 中需要更改什么。


大多数框架都实现了这一点，但你可以只做这一点而不做其他 11 个因子中的任何一个。这里是一个例子：


```python
thread = {"events": [initial_message]}

while True:
  next_step = await determine_next_step(thread_to_prompt(thread))
  thread["events"].append({
    "type": next_step.intent,
    "data": next_step,
  })
  try:
    result = await handle_next_step(thread, next_step) # our switch statement
  except Exception as e:
    # if we get an error, we can add it to the context window and try again
    thread["events"].append({
      "type": 'error',
      "data": format_error(e),
    })
    # loop, or do whatever else here to try to recover
```

你可能想为特定的 Tool Calling 实现一个错误计数器，将单个工具的尝试次数限制在大约 3 次，或者任何其他对你的用例有意义的逻辑。

```python
consecutive_errors = 0

while True:

  # ... existing code ...

  try:
    result = await handle_next_step(thread, next_step)
    thread["events"].append({
      "type": next_step.intent + '_result',
      data: result,
    })
    # success! reset the error counter
    consecutive_errors = 0
  except Exception as e:
    consecutive_errors += 1
    if consecutive_errors < 3:
      # do the loop and try again
      thread["events"].append({
        "type": 'error',
        "data": format_error(e),
      })
    else:
      # break the loop, reset parts of the context window, escalate to a human, or whatever else you want to do
      break
  }
}
```
达到某个连续错误阈值可能是[升级给人类](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-07-contact-humans-with-tools.md)的好地方，无论是通过模型决策还是通过控制流的确定性接管。

[![195-factor-09-errors](https://github.com/humanlayer/12-factor-agents/blob/main/img/195-factor-09-errors.gif)](https://github.com/user-attachments/assets/cd7ed814-8309-4baf-81a5-9502f91d4043)


<details>
<summary>[GIF版本](https://github.com/humanlayer/12-factor-agents/blob/main/img/195-factor-09-errors.gif)</summary>

![195-factor-09-errors](https://github.com/humanlayer/12-factor-agents/blob/main/img/195-factor-09-errors.gif)

</details>

好处：

1. **自我修复**：大语言模型可以读取错误消息并找出在后续 Tool Calling 中需要更改什么
2. **持久性**：即使一个 Tool Calling 失败，Agent 也可以继续运行

我确信你会发现，如果你过度使用这个功能，你的 Agent 会开始失控，可能会一遍又一遍地重复同样的错误。

这就是[因子 8 - 掌控你的控制流](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-08-own-your-control-flow.md)和[因子 3 - 掌控你的上下文构建](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-03-own-your-context-window.md)发挥作用的地方 - 你不需要只是把原始错误放回去，你可以完全重构它的表示方式，从上下文窗口中删除以前的事件，或者任何你发现有效的确定性方法来让 Agent 回到正轨。

但防止错误失控的第一方法是采用[因子 10 - 小而专注的 Agent](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-10-small-focused-agents.md)。

[← 掌控你的控制流](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-08-own-your-control-flow.md) | [小而专注的智能体 →](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-10-small-focused-agents.md)