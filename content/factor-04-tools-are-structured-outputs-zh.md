[← 返回README](https://github.com/humanlayer/12-factor-agents/blob/main/README.md)

### 4. 工具只是结构化输出

工具不需要复杂。在其核心，它们只是来自LLM的结构化输出，触发确定性代码。

![140-tools-are-just-structured-outputs](https://github.com/humanlayer/12-factor-agents/blob/main/img/140-tools-are-just-structured-outputs.png)

例如，假设你有两个工具`CreateIssue`和`SearchIssues`。要求LLM"使用几个工具中的一个"，只是要求它输出我们可以解析为代表这些工具的对象的JSON。

```python

class Issue:
  title: str
  description: str
  team_id: str
  assignee_id: str

class CreateIssue:
  intent: "create_issue"
  issue: Issue

class SearchIssues:
  intent: "search_issues"
  query: str
  what_youre_looking_for: str
```

模式很简单：
1. LLM输出结构化JSON
3. 确定性代码执行适当的操作（如调用外部API）
4. 结果被捕获并反馈到上下文中

这在LLM的决策制定和你的应用程序操作之间创建了清晰的分离。LLM决定要做什么，但你的代码控制如何做。仅仅因为LLM"调用了一个工具"并不意味着你必须每次都以相同的方式执行特定的对应函数。

如果你回想一下我们上面的switch语句

```python
if nextStep.intent == 'create_payment_link':
    stripe.paymentlinks.create(nextStep.parameters)
    return # or whatever you want, see below
elif nextStep.intent == 'wait_for_a_while': 
    # do something monadic idk
else: #... the model didn't call a tool we know about
    # do something else
```

**注意**：关于"纯提示"vs"工具调用"vs"JSON模式"的好处以及每种方法的性能权衡，已经有很多讨论。我们很快会链接一些相关资源，但这里不会深入讨论。参见[Prompting vs JSON Mode vs Function Calling vs Constrained Generation vs SAP](https://www.boundaryml.com/blog/schema-aligned-parsing)、[什么时候应该使用函数调用、结构化输出或JSON模式？](https://www.vellum.ai/blog/when-should-i-use-function-calling-structured-outputs-or-json-mode#:~:text=We%20don%27t%20recommend%20using%20JSON,always%20use%20Structured%20Outputs%20instead)和[OpenAI JSON vs Function Calling](https://docs.llamaindex.ai/en/stable/examples/llm/openai_json_vs_function_calling/)。

"下一步"可能不像"运行纯函数并返回结果"那样原子化。当你把"工具调用"看作是模型输出描述确定性代码应该做什么的JSON时，你就释放了很多灵活性。将这与[因子8 掌控你的控制流](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-08-own-your-control-flow.md)结合起来。

[← 掌控你的上下文窗口](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-03-own-your-context-window.md) | [统一执行状态 →](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-05-unify-execution-state.md)