[← 返回README](https://github.com/humanlayer/12-factor-agents/blob/main/README.md)

### 5. 统一执行状态和业务状态

即使在AI世界之外，许多基础设施系统也试图将"执行状态"与"业务状态"分离。对于AI应用程序，这可能涉及复杂的抽象来跟踪当前步骤、下一步、等待状态、重试计数等。这种分离创造了可能有价值的复杂性，但对你的用例来说可能过于复杂。

一如既往，决定什么适合你的应用程序取决于你。但不要认为你*必须*单独管理它们。

更清楚地说：

- **执行状态**：当前步骤、下一步、等待状态、重试计数等。
- **业务状态**：到目前为止在智能体工作流程中发生的事情（例如OpenAI消息列表、工具调用和结果列表等）

如果可能，简化——尽可能统一这些状态。

[![155-unify-state](https://github.com/humanlayer/12-factor-agents/blob/main/img/155-unify-state-animation.gif)](https://github.com/user-attachments/assets/e5a851db-f58f-43d8-8b0c-1926c99fc68d)


<details>
<summary><a href="https://github.com/humanlayer/12-factor-agents/blob/main/img/155-unify-state-animation.gif">GIF版本</a></summary>

![155-unify-state](https://github.com/humanlayer/12-factor-agents/blob/main/img/155-unify-state-animation.gif)]

</details>

实际上，你可以设计你的应用程序，使你能够从上下文窗口推断出所有执行状态。在许多情况下，执行状态（当前步骤、等待状态等）只是关于到目前为止发生了什么的元数据。

你可能有一些不能放入上下文窗口的东西，如会话ID、密码上下文等，但你的目标应该是最小化这些东西。通过采用[因子3](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-03-own-your-context-window.md)，你可以控制实际进入LLM的内容。

这种方法有几个好处：

1. **简洁性**：所有状态的单一真实来源
2. **序列化**：线程是可简单序列化/反序列化的
3. **调试**：整个历史记录在一个地方可见
4. **灵活性**：通过添加新的事件类型就可以轻松添加新状态
5. **恢复**：可以通过加载线程从任何点恢复
6. **分叉**：可以通过将线程的某个子集复制到新的上下文/状态ID中来在任何点分叉线程
7. **人机接口和可观察性**：将线程转换为人类可读的markdown或丰富的Web应用程序UI是轻而易举的

[← 工具是结构化输出](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-04-tools-are-structured-outputs.md) | [启动/暂停/恢复 →](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-06-launch-pause-resume.md)