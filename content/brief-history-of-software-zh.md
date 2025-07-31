[← 回到README](https://github.com/humanlayer/12-factor-agents/blob/main/README.md)

## 详细版本：我们如何走到这里

### 你不必听我的建议

无论你是 Agent 新手还是像我这样经验丰富的老手，我都会尝试说服你抛弃对 Agent 的大部分既有认知，退一步，从第一性原理重新思考它们。 (剧透提醒：如果你错过了几周前 OpenAI 发布的回应，那么将更多 Agent 逻辑推到 API 后面并不是正确的方向)


## Agent 是软件，以及软件简史

让我们谈谈我们是如何走到这里的

### 60 年前

我们将大量讨论有向图 (DG) 和它们的无环朋友 DAG。我首先要指出的是...软件本质上就是一个有向图。我们过去用流程图表示程序是有原因的。

![010-software-dag](https://github.com/humanlayer/12-factor-agents/blob/main/img/010-software-dag.png)

### 20 年前

大约 20 年前，我们开始看到 DAG 编排器变得流行起来。我们说的是经典工具如 [Airflow](https://airflow.apache.org/)、[Prefect](https://www.prefect.io/)、一些前身以及一些较新的工具如 ([dagster](https://dagster.io/)、[inngest](https://www.inngest.com/)、[windmill](https://www.windmill.dev/))。这些工具遵循相同的图模式，额外带来了可观测性、模块化、重试、管理等优势。

![015-dag-orchestrators](https://github.com/humanlayer/12-factor-agents/blob/main/img/015-dag-orchestrators.png)

### 10-15 年前

当机器学习模型开始变得足够实用时，我们开始看到在 DAG 中嵌入 ML 模型。你可能会想象像"将此列中的文本摘要到新列中"或"按严重性或情感分类支持问题"这样的步骤。

![020-dags-with-ml](https://github.com/humanlayer/12-factor-agents/blob/main/img/020-dags-with-ml.png)

但归根结底，这仍然主要是相同的传统确定性软件。

### Agent 的承诺

我不是第一个[这样说的人](https://youtu.be/Dc99-zTMyMg?si=bcT0hIwWij2mR-40&t=73)，但当我开始学习 Agent 时，我最大的收获是你可以抛弃 DAG。软件工程师不需要为每个步骤和边缘情况编写代码，你可以给 Agent 一个目标和一组转换：

![025-agent-dag](https://github.com/humanlayer/12-factor-agents/blob/main/img/025-agent-dag.png)

让大语言模型实时做出决策来找出路径

![026-agent-dag-lines](https://github.com/humanlayer/12-factor-agents/blob/main/img/026-agent-dag-lines.png)

这里的承诺是你需要编写更少的软件，你只需给大语言模型图的"边缘"，让它找出节点。你可以从错误中恢复，可以编写更少的代码，还可能发现大语言模型为问题找到新颖的解决方案。

### Agent 作为循环

换句话说，你有这个由 3 个步骤组成的循环：

1. 大语言模型确定工作流中的下一步，输出结构化 JSON ("Tool Calling")
2. 确定性代码执行 Tool Call
3. 结果被附加到上下文窗口
4. 重复直到下一步被确定为"完成"

```python
initial_event = {"message": "..."}
context = [initial_event]
while True:
  next_step = await llm.determine_next_step(context)
  context.append(next_step)

  if (next_step.intent === "done"):
    return next_step.final_answer

  result = await execute_step(next_step)
  context.append(result)
```

我们的初始上下文只是起始事件 (可能是用户消息，可能是 cron 触发，可能是 webhook 等)，
我们请求大语言模型选择下一步 (工具) 或确定我们已经完成。

这里是一个多步骤示例：

[![027-agent-loop-animation](https://github.com/humanlayer/12-factor-agents/blob/main/img/027-agent-loop-animation.gif)](https://github.com/user-attachments/assets/3beb0966-fdb1-4c12-a47f-ed4e8240f8fd)

<details>
<summary><a href="https://github.com/humanlayer/12-factor-agents/blob/main/img/027-agent-loop-animation.gif">GIF版本</a></summary>

![027-agent-loop-animation](https://github.com/humanlayer/12-factor-agents/blob/main/img/027-agent-loop-animation.gif)]

</details>

生成的"物化"DAG看起来像这样：

![027-agent-loop-dag](https://github.com/humanlayer/12-factor-agents/blob/main/img/027-agent-loop-dag.png)

### "循环直到解决"模式的问题

这种模式的最大问题：

- 当上下文窗口变得过长时，Agent 会迷失方向 — 它们会陷入反复尝试同样错误方法的循环
- 就是这么简单，但这已经足以让整个方法失效

即使你没有手工构建 Agent，你可能在使用智能化编程工具时也遇到过这种长上下文问题。它们会在一段时间后迷失方向，你需要重新开始对话。

我甚至可能会提出一个我经常听到的观点，你可能也已经形成了自己的直觉：

> ### **即使模型支持越来越长的上下文窗口，你总是能通过小而专注的提示词和上下文获得更好的结果**

我交谈过的大多数构建者都**将"Tool Calling 循环"的想法搁置**，因为他们意识到超过 10-20 轮的任何操作都会变成大语言模型无法恢复的巨大混乱。即使 Agent 90% 的时候都能正确执行，这距离"足够好可以交给客户"还相差甚远。你能想象一个在 10% 的页面加载时崩溃的 Web 应用吗？

**2025 年 6 月 9 日更新** - 我非常认同 [@swyx](https://x.com/swyx/status/1932125643384455237) 的表述：

<a href="https://x.com/swyx/status/1932125643384455237"><img width="593" alt="Screenshot 2025-07-02 at 11 50 50 AM" src="https://github.com/user-attachments/assets/c7d94042-e4b9-4b87-87fd-55c7ff94bb3b" /></a>

### 真正有效的方法 - 微 Agent

我在实际应用中**确实**经常看到的一件事是采用 Agent 模式并将其嵌入到更广泛的确定性 DAG 中。

![micro-agent-dag](https://github.com/humanlayer/12-factor-agents/blob/main/img/028-micro-agent-dag.png)

你可能会问 — "在这种情况下为什么还要使用 Agent？" — 我们稍后会讨论这个问题，但基本上，让语言模型管理范围明确的任务集合能够很容易地整合实时人类反馈，将其转换为工作流步骤而不会陷入上下文错误循环 ([因子 1](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-01-natural-language-to-tool-calls.md)、[因子 3](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-03-own-your-context-window.md)、[因子 7](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-07-contact-humans-with-tools.md))。

> #### 让语言模型管理范围明确的任务集合能够很容易地整合实时人类反馈...而不会陷入上下文错误循环

### 现实生活中的微 Agent

这里有一个例子，展示确定性代码如何运行一个负责处理部署人工参与步骤的微 Agent。

![029-deploybot-high-level](https://github.com/humanlayer/12-factor-agents/blob/main/img/029-deploybot-high-level.png)

* **人类** 将 PR 合并到 GitHub 主分支
* **确定性代码** 部署到测试环境
* **确定性代码** 对测试环境运行端到端 (e2e) 测试
* **确定性代码** 交给 Agent 进行生产部署，初始上下文："将 SHA 4af9ec0 部署到生产环境"
* **Agent** 调用 `deploy_frontend_to_prod(4af9ec0)`
* **确定性代码** 请求人类对此操作的批准
* **人类** 拒绝操作并反馈"你能先部署后端吗？"
* **Agent** 调用 `deploy_backend_to_prod(4af9ec0)`
* **确定性代码** 请求人类对此操作的批准
* **人类** 批准操作
* **确定性代码** 执行后端部署
* **Agent** 调用 `deploy_frontend_to_prod(4af9ec0)`
* **确定性代码** 请求人类对此操作的批准
* **人类** 批准操作
* **确定性代码** 执行前端部署
* **Agent** 确定任务成功完成，我们完成了！
* **确定性代码** 对生产环境运行端到端测试
* **确定性代码** 任务完成，或传递给回滚 Agent 审查失败并可能回滚

[![033-deploybot-animation](https://github.com/humanlayer/12-factor-agents/blob/main/img/033-deploybot.gif)](https://github.com/user-attachments/assets/deb356e9-0198-45c2-9767-231cb569ae13)

<details>
<summary><a href="https://github.com/humanlayer/12-factor-agents/blob/main/img/033-deploybot.gif">GIF版本</a></summary>

![033-deploybot-animation](https://github.com/humanlayer/12-factor-agents/blob/main/img/033-deploybot.gif)]

</details>

这个例子基于我们在 Humanlayer 交付的一个真实的 [OSS Agent 来管理我们的部署](https://github.com/got-agents/agents/tree/main/deploybot-ts) — 这是我上周与它进行的真实对话：

![035-deploybot-conversation](https://github.com/humanlayer/12-factor-agents/blob/main/img/035-deploybot-conversation.png)


我们没有给这个 Agent 一大堆工具或任务。大语言模型的主要价值在于解析人类的纯文本反馈并提出更新的行动方案。我们尽可能地将任务和上下文隔离，以保持大语言模型专注于小型的 5-10 步工作流。

这里是另一个[更经典的支持/聊天机器人演示](https://x.com/chainlit_io/status/1858613325921480922)。

### 那么 Agent 到底是什么？

- **Prompt** - 告诉大语言模型如何行为，以及它有哪些"工具"可用。Prompt 的输出是一个描述工作流中下一步的 JSON 对象 ("Tool Calling"或"函数调用")。([因子 2](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-02-own-your-prompts.md))
- **switch 语句** - 基于大语言模型返回的 JSON 决定如何处理它。([因子 8](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-08-own-your-control-flow.md) 的一部分)
- **累积上下文** - 存储已发生的步骤列表及其结果 ([因子 3](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-03-own-your-context-window.md))
- **for 循环** - 直到大语言模型发出某种"终端"工具调用 (或纯文本响应)，将 switch 语句的结果添加到上下文窗口并要求大语言模型选择下一步。([因子 8](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-08-own-your-control-flow.md))

![040-4-components](https://github.com/humanlayer/12-factor-agents/blob/main/img/040-4-components.png)

在"deploybot"例子中，我们通过拥有控制流和上下文累积获得了几个好处：

- 在我们的 **switch 语句**和 **for 循环**中，我们可以劫持控制流来暂停等待人类输入或等待长时间运行任务的完成
- 我们可以轻松地序列化**上下文**窗口以进行暂停+恢复
- 在我们的 **Prompt** 中，我们可以优化如何向大语言模型传递指令和"到目前为止发生了什么"

[第二部分](https://github.com/humanlayer/12-factor-agents/blob/main/README.md#12-factor-agents) 将**正式化这些模式**，以便它们可以应用于为任何软件项目添加令人印象深刻的 AI 功能，而无需全面采用"Agent"的传统实现/定义。


[因子 1 - 自然语言到 Tool Calling →](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-01-natural-language-to-tool-calls.md)