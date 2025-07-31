[← 返回README](https://github.com/humanlayer/12-factor-agents/blob/main/README.md)

### 8. 掌控你的控制流

如果你掌控了你的控制流，你可以做很多有趣的事情。

![180-control-flow](https://github.com/humanlayer/12-factor-agents/blob/main/img/180-control-flow.png)


构建适合你特定用例的控制结构。具体来说，某些类型的工具调用可能是跳出循环并等待人类响应或其他长时间运行任务（如训练管道）的理由。你可能还想合并以下内容的自定义实现：

- 工具调用结果的摘要或缓存
- 结构化输出上的LLM作为评判者
- 上下文窗口压缩或其他[内存管理](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-03-own-your-context-window.md)
- 日志记录、跟踪和指标
- 客户端速率限制
- 持久化休眠/暂停/"等待事件"


下面的示例显示了三种可能的控制流模式：


- request_clarification：模型请求更多信息，跳出循环并等待人类的响应
- fetch_git_tags：模型请求git标签列表，获取标签，追加到上下文窗口，并直接传回模型
- deploy_backend：模型请求部署后端，这是一个高风险的事情，所以跳出循环并等待人类批准

```python
def handle_next_step(thread: Thread):

  while True:
    next_step = await determine_next_step(thread_to_prompt(thread))
    
    # inlined for clarity - in reality you could put 
    # this in a method, use exceptions for control flow, or whatever you want
    if next_step.intent == 'request_clarification':
      thread.events.append({
        type: 'request_clarification',
          data: nextStep,
        })

      await send_message_to_human(next_step)
      await db.save_thread(thread)
      # async step - break the loop, we'll get a webhook later
      break
    elif next_step.intent == 'fetch_open_issues':
      thread.events.append({
        type: 'fetch_open_issues',
        data: next_step,
      })

      issues = await linear_client.issues()

      thread.events.append({
        type: 'fetch_open_issues_result',
        data: issues,
      })
      # sync step - pass the new context to the LLM to determine the NEXT next step
      continue
    elif next_step.intent == 'create_issue':
      thread.events.append({
        type: 'create_issue',
        data: next_step,
      })

      await request_human_approval(next_step)
      await db.save_thread(thread)
      # async step - break the loop, we'll get a webhook later
      break
```

这种模式允许你根据需要中断和恢复智能体的流程，创建更自然的对话和工作流程。

**示例** - 我对每个AI框架的第一大功能请求是我们需要能够中断正在工作的智能体并稍后恢复，特别是在工具**选择**和工具**调用**之间的时刻。

没有这种级别的可恢复性/粒度性，就无法在工具调用运行之前审查/批准它，这意味着你被迫要么：

1. 在等待长时间运行的任务完成时在内存中暂停任务（想想`while...sleep`），如果进程被中断就从头开始重启
2. 限制智能体只能进行低风险、低影响的调用，如研究和摘要
3. 给智能体访问权限去做更大、更有用的事情，然后只能祈祷它不会搞砸


你可能会注意到这与[因子5 - 统一执行状态和业务状态](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-05-unify-execution-state.md)和[因子6 - 使用简单API启动/暂停/恢复](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-06-launch-pause-resume.md)密切相关，但可以独立实现。

[← 通过工具联系人类](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-07-contact-humans-with-tools.md) | [紧凑错误 →](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-09-compact-errors.md)