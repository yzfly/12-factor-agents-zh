[← 回到README](https://github.com/humanlayer/12-factor-agents/blob/main/README.md)

## 详细版本：我们如何走到这里

### 你不必听我的

无论你是智能体新手还是像我这样固执的老手，我都会试图说服你抛弃对AI智能体的大部分认知，退一步，从第一性原理重新思考它们。（剧透警告，如果你没有注意到几周前OpenAI响应的发布，但将更多智能体逻辑推到API后面并不是解决方案）


## 智能体是软件，以及软件简史

让我们谈谈我们是如何走到这里的

### 60年前

我们将大量讨论有向图(DG)和它们的无环朋友DAG。我首先要指出的是...软件就是一个有向图。我们过去用流程图表示程序是有原因的。

![010-software-dag](https://github.com/humanlayer/12-factor-agents/blob/main/img/010-software-dag.png)

### 20年前

大约20年前，我们开始看到DAG编排器变得流行。我们说的是经典工具如[Airflow](https://airflow.apache.org/)、[Prefect](https://www.prefect.io/)、一些前身以及一些较新的工具如([dagster](https://dagster.io/)、[inngest](https://www.inngest.com/)、[windmill](https://www.windmill.dev/))。这些遵循相同的图模式，额外的好处是可观察性、模块化、重试、管理等。

![015-dag-orchestrators](https://github.com/humanlayer/12-factor-agents/blob/main/img/015-dag-orchestrators.png)

### 10-15年前

当ML模型开始变得足够好用时，我们开始看到在DAG中撒入ML模型。你可能会想象像"将此列中的文本摘要到新列中"或"按严重性或情感分类支持问题"这样的步骤。

![020-dags-with-ml](https://github.com/humanlayer/12-factor-agents/blob/main/img/020-dags-with-ml.png)

但归根结底，它仍主要是相同的老式确定性软件。

### 智能体的承诺

我不是第一个[这样说的人](https://youtu.be/Dc99-zTMyMg?si=bcT0hIwWij2mR-40&t=73)，但当我开始学习智能体时，我最大的收获是你可以抛弃DAG。软件工程师不需要编码每个步骤和边缘情况，你可以给智能体一个目标和一组转换：

![025-agent-dag](https://github.com/humanlayer/12-factor-agents/blob/main/img/025-agent-dag.png)

让LLM实时做决定来找出路径

![026-agent-dag-lines](https://github.com/humanlayer/12-factor-agents/blob/main/img/026-agent-dag-lines.png)

这里的承诺是你写更少的软件，你只需给LLM图的"边缘"，让它找出节点。你可以从错误中恢复，你可以写更少的代码，你可能会发现LLM为问题找到新颖的解决方案。

### 智能体作为循环

换句话说，你有这个由3个步骤组成的循环：

1. LLM确定工作流中的下一步，输出结构化json（"工具调用"）
2. 确定性代码执行工具调用
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

我们的初始上下文只是起始事件（可能是用户消息，可能是cron触发，可能是webhook等），
我们请求llm选择下一步（工具）或确定我们已经完成。

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

- 当上下文窗口变得太长时，智能体会迷失 - 它们会反复尝试同样的错误方法
- 字面意思就是这样，但这足以让这种方法失效

即使你没有手动构建智能体，你可能在使用智能化编码工具时也看到过这种长上下文问题。它们会在一段时间后迷失，你需要开始新的对话。

我甚至可能会提出一个我经常听到的观点，你可能也已经形成了自己的直觉：

> ### **即使模型支持越来越长的上下文窗口，你总能通过小而专注的提示和上下文获得更好的结果**

我交谈过的大多数构建者**将"工具调用循环"的想法推到一边**，因为他们意识到超过10-20轮的任何操作都会变成LLM无法恢复的大混乱。即使智能体90%的时候都能做对，这距离"足够好可以交给客户"还相差甚远。你能想象一个在10%的页面加载时崩溃的网络应用吗？

**2025年6月9日更新** - 我真的很喜欢[@swyx](https://x.com/swyx/status/1932125643384455237)的表述：

<a href="https://x.com/swyx/status/1932125643384455237"><img width="593" alt="Screenshot 2025-07-02 at 11 50 50 AM" src="https://github.com/user-attachments/assets/c7d94042-e4b9-4b87-87fd-55c7ff94bb3b" /></a>

### 真正有效的方法 - 微智能体

我在实际应用中**确实**经常看到的一件事是采用智能体模式并将其撒入更广泛的确定性DAG中。

![micro-agent-dag](https://github.com/humanlayer/12-factor-agents/blob/main/img/028-micro-agent-dag.png)

你可能会问 - "在这种情况下为什么还要使用智能体？" - 我们稍后会讨论这个，但基本上，让语言模型管理良好范围的任务集合使得很容易整合实时人类反馈，将其转换为工作流步骤而不会陷入上下文错误循环。([因子1](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-01-natural-language-to-tool-calls.md)、[因子3](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-03-own-your-context-window.md)、[因子7](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-07-contact-humans-with-tools.md))。

> #### 让语言模型管理良好范围的任务集合使得很容易整合实时人类反馈...而不会陷入上下文错误循环

### 现实生活中的微智能体

这里是一个确定性代码如何运行一个负责处理部署人在环路步骤的微智能体的例子。

![029-deploybot-high-level](https://github.com/humanlayer/12-factor-agents/blob/main/img/029-deploybot-high-level.png)

* **人类** 将PR合并到GitHub主分支
* **确定性代码** 部署到测试环境
* **确定性代码** 对测试环境运行端到端(e2e)测试
* **确定性代码** 交给智能体进行生产部署，初始上下文："将SHA 4af9ec0部署到生产环境"
* **智能体** 调用 `deploy_frontend_to_prod(4af9ec0)`
* **确定性代码** 请求人类对此操作的批准
* **人类** 拒绝操作并反馈"你能先部署后端吗？"
* **智能体** 调用 `deploy_backend_to_prod(4af9ec0)`
* **确定性代码** 请求人类对此操作的批准
* **人类** 批准操作
* **确定性代码** 执行后端部署
* **智能体** 调用 `deploy_frontend_to_prod(4af9ec0)`
* **确定性代码** 请求人类对此操作的批准
* **人类** 批准操作
* **确定性代码** 执行前端部署
* **智能体** 确定任务成功完成，我们完成了！
* **确定性代码** 对生产环境运行端到端测试
* **确定性代码** 任务完成，或传递给回滚智能体审查失败并可能回滚

[![033-deploybot-animation](https://github.com/humanlayer/12-factor-agents/blob/main/img/033-deploybot.gif)](https://github.com/user-attachments/assets/deb356e9-0198-45c2-9767-231cb569ae13)

<details>
<summary><a href="https://github.com/humanlayer/12-factor-agents/blob/main/img/033-deploybot.gif">GIF版本</a></summary>

![033-deploybot-animation](https://github.com/humanlayer/12-factor-agents/blob/main/img/033-deploybot.gif)]

</details>

这个例子基于我们在Humanlayer运送的一个真实的[OSS智能体来管理我们的部署](https://github.com/got-agents/agents/tree/main/deploybot-ts) - 这是我上周与它进行的真实对话：

![035-deploybot-conversation](https://github.com/humanlayer/12-factor-agents/blob/main/img/035-deploybot-conversation.png)


我们没有给这个智能体一大堆工具或任务。LLM的主要价值在于解析人类的纯文本反馈并提出更新的行动方案。我们尽可能地隔离任务和上下文，以保持LLM专注于小型的5-10步工作流。

这里是另一个[更经典的支持/聊天机器人演示](https://x.com/chainlit_io/status/1858613325921480922)。

### 那么智能体到底是什么？

- **提示** - 告诉LLM如何行为，以及它有哪些"工具"可用。提示的输出是一个描述工作流中下一步的JSON对象（"工具调用"或"函数调用"）。([因子2](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-02-own-your-prompts.md))
- **switch语句** - 基于LLM返回的JSON决定如何处理它。([因子8](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-08-own-your-control-flow.md)的一部分)
- **累积上下文** - 存储已发生的步骤列表及其结果 ([因子3](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-03-own-your-context-window.md))
- **for循环** - 直到LLM发出某种"终端"工具调用（或纯文本响应），将switch语句的结果添加到上下文窗口并要求LLM选择下一步。([因子8](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-08-own-your-control-flow.md))

![040-4-components](https://github.com/humanlayer/12-factor-agents/blob/main/img/040-4-components.png)

在"deploybot"例子中，我们通过拥有控制流和上下文累积获得了几个好处：

- 在我们的**switch语句**和**for循环**中，我们可以劫持控制流来暂停人类输入或等待长时间运行任务的完成
- 我们可以轻松地序列化**上下文**窗口以进行暂停+恢复
- 在我们的**提示**中，我们可以优化如何向LLM传递指令和"到目前为止发生了什么"

[第二部分](https://github.com/humanlayer/12-factor-agents/blob/main/README.md#12-factor-agents)将**正式化这些模式**，以便它们可以应用于为任何软件项目添加令人印象深刻的AI功能，而无需全力投入"AI智能体"的传统实现/定义。


[因子1 - 自然语言到工具调用 →](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-01-natural-language-to-tool-calls.md)