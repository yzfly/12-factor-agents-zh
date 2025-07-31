# 12因子智能体 - 构建可靠LLM应用程序的原则

<div align="center">
<a href="https://www.apache.org/licenses/LICENSE-2.0">
        <img src="https://img.shields.io/badge/Code-Apache%202.0-blue.svg" alt="代码许可证: Apache 2.0"></a>
<a href="https://creativecommons.org/licenses/by-sa/4.0/">
        <img src="https://img.shields.io/badge/Content-CC%20BY--SA%204.0-lightgrey.svg" alt="内容许可证: CC BY-SA 4.0"></a>
<a href="https://humanlayer.dev/discord">
    <img src="https://img.shields.io/badge/chat-discord-5865F2" alt="Discord服务器"></a>
<a href="https://www.youtube.com/watch?v=8kMaTybvDUw">
    <img src="https://img.shields.io/badge/aidotengineer-conf_talk_(17m)-white" alt="YouTube
深度解析"></a>
<a href="https://www.youtube.com/watch?v=yxJDyQ8v6P0">
    <img src="https://img.shields.io/badge/youtube-deep_dive-crimson" alt="YouTube
深度解析"></a>
    
</div>

<p></p>

*秉承[12因子应用](https://12factor.net/)的精神*。

> **📋 关于本翻译版本**  
> **原文**：https://github.com/humanlayer/12-factor-agents  
> **中文翻译**：云中江树  
> *本项目源代码公开，欢迎您的反馈和贡献。让我们一起探索！*

> [!TIP]
> 错过了AI工程师世界博览会？[在这里观看演讲](https://www.youtube.com/watch?v=8kMaTybvDUw)
>
> 正在寻找上下文工程？[直接跳转到因子3](./content/factor-03-own-your-context-window-zh.md)
>
> 想要为 `npx/uvx create-12-factor-agent` 做贡献 - 查看[讨论帖](https://github.com/humanlayer/12-factor-agents/discussions/61)
>
> 想要阅读英文版本？[English Version](./README-en.md)


<img referrerpolicy="no-referrer-when-downgrade" src="https://static.scarf.sh/a.png?x-pxid=2acad99a-c2d9-48df-86f5-9ca8061b7bf9" />

<a href="#visual-nav"><img width="907" alt="Screenshot 2025-04-03 at 2 49 07 PM" src="https://github.com/user-attachments/assets/23286ad8-7bef-4902-b371-88ff6a22e998" /></a>


大家好，我是Dex。我在[AI智能体](https://theouterloop.substack.com)方面[钻研](https://youtu.be/8bIHcttkOTE)了[很长时间](https://humanlayer.dev)。


**我已经尝试过市面上的每一个智能体框架**，从即插即用的crew/langchains到世界上的"极简主义"smolagents，再到"生产级"的langraph、griptape等等。

**我与许多非常强大的创始人交谈过**，无论是否来自YC，他们都在用AI构建非常令人印象深刻的产品。他们中的大多数都在自己构建技术栈。我没有看到很多框架在生产环境的面向客户的智能体中使用。

**我惊讶地发现**，大多数宣传自己为"AI智能体"的产品实际上并没有那么智能化。它们中的很多主要是确定性代码，只是在恰当的地方撒上LLM步骤，让体验变得真正神奇。

智能体，至少是好的智能体，不遵循["这是你的提示，这是一袋工具，循环直到达到目标"](https://www.anthropic.com/engineering/building-effective-agents#agents)的模式。相反，它们主要由软件组成。

因此，我开始回答：

> ### **我们可以使用什么原则来构建真正足够好的LLM驱动软件，将其交到生产环境客户手中？**

欢迎来到12因子智能体。正如芝加哥自戴利以来的每一任市长一直在该市主要机场贴满的标语，我们很高兴您来到这里。

*特别感谢[@iantbutler01](https://github.com/iantbutler01)、[@tnm](https://github.com/tnm)、[@hellovai](https://www.github.com/hellovai)、[@stantonk](https://www.github.com/stantonk)、[@balanceiskey](https://www.github.com/balanceiskey)、[@AdjectiveAllison](https://www.github.com/AdjectiveAllison)、[@pfbyjy](https://www.github.com/pfbyjy)、[@a-churchill](https://www.github.com/a-churchill)和旧金山MLOps社区对本指南的早期反馈。*

## 简化版本：12个因子

即使LLM[继续呈指数级增长](./content/factor-10-small-focused-agents-zh.md#what-if-llms-get-smarter)，也会有核心工程技术使LLM驱动的软件更可靠、更可扩展、更易于维护。

- [我们如何走到这里：软件简史](./content/brief-history-of-software-zh.md)
- [因子1：自然语言到工具调用](./content/factor-01-natural-language-to-tool-calls-zh.md)
- [因子2：掌控你的提示](./content/factor-02-own-your-prompts-zh.md)
- [因子3：掌控你的上下文窗口](./content/factor-03-own-your-context-window-zh.md)
- [因子4：工具只是结构化输出](./content/factor-04-tools-are-structured-outputs-zh.md)
- [因子5：统一执行状态和业务状态](./content/factor-05-unify-execution-state-zh.md)
- [因子6：使用简单API启动/暂停/恢复](./content/factor-06-launch-pause-resume-zh.md)
- [因子7：通过工具调用联系人类](./content/factor-07-contact-humans-with-tools-zh.md)
- [因子8：掌控你的控制流](./content/factor-08-own-your-control-flow-zh.md)
- [因子9：将错误压缩到上下文窗口](./content/factor-09-compact-errors-zh.md)
- [因子10：小型、专注的智能体](./content/factor-10-small-focused-agents-zh.md)
- [因子11：从任何地方触发，在用户所在的地方与他们见面](./content/factor-11-trigger-from-anywhere-zh.md)
- [因子12：让你的智能体成为无状态化简器](./content/factor-12-stateless-reducer-zh.md)

### 可视化导航

|    |    |    |
|----|----|-----|
|[![因子1](https://github.com/humanlayer/12-factor-agents/blob/main/img/110-natural-language-tool-calls.png)](./content/factor-01-natural-language-to-tool-calls-zh.md) | [![因子2](https://github.com/humanlayer/12-factor-agents/blob/main/img/120-own-your-prompts.png)](./content/factor-02-own-your-prompts-zh.md) | [![因子3](https://github.com/humanlayer/12-factor-agents/blob/main/img/130-own-your-context-building.png)](./content/factor-03-own-your-context-window-zh.md) |
|[![因子4](https://github.com/humanlayer/12-factor-agents/blob/main/img/140-tools-are-just-structured-outputs.png)](./content/factor-04-tools-are-structured-outputs-zh.md) | [![因子5](https://github.com/humanlayer/12-factor-agents/blob/main/img/150-unify-state.png)](./content/factor-05-unify-execution-state-zh.md) | [![因子6](https://github.com/humanlayer/12-factor-agents/blob/main/img/160-pause-resume-with-simple-apis.png)](./content/factor-06-launch-pause-resume-zh.md) |
| [![因子7](https://github.com/humanlayer/12-factor-agents/blob/main/img/170-contact-humans-with-tools.png)](./content/factor-07-contact-humans-with-tools-zh.md) | [![因子8](https://github.com/humanlayer/12-factor-agents/blob/main/img/180-control-flow.png)](./content/factor-08-own-your-control-flow-zh.md) | [![因子9](https://github.com/humanlayer/12-factor-agents/blob/main/img/190-factor-9-errors-static.png)](./content/factor-09-compact-errors-zh.md) |
| [![因子10](https://github.com/humanlayer/12-factor-agents/blob/main/img/1a0-small-focused-agents.png)](./content/factor-10-small-focused-agents-zh.md) | [![因子11](https://github.com/humanlayer/12-factor-agents/blob/main/img/1b0-trigger-from-anywhere.png)](./content/factor-11-trigger-from-anywhere-zh.md) | [![因子12](https://github.com/humanlayer/12-factor-agents/blob/main/img/1c0-stateless-reducer.png)](./content/factor-12-stateless-reducer-zh.md) |

## 我们如何走到这里

要更深入地了解我的智能体之旅以及什么引导我们来到这里，请查看[软件简史](./content/brief-history-of-software-zh.md) - 这里是一个快速总结：

### 智能体的承诺

我们将大量讨论有向图(DG)和它们的无环朋友DAG。我首先要指出的是...软件就是一个有向图。我们过去用流程图表示程序是有原因的。

![010-software-dag](https://github.com/humanlayer/12-factor-agents/blob/main/img/010-software-dag.png)

### 从代码到DAG

大约20年前，我们开始看到DAG编排器变得流行。我们说的是经典工具如[Airflow](https://airflow.apache.org/)、[Prefect](https://www.prefect.io/)、一些前身以及一些较新的工具如([dagster](https://dagster.io/)、[inngest](https://www.inngest.com/)、[windmill](https://www.windmill.dev/))。这些遵循相同的图模式，额外的好处是可观察性、模块化、重试、管理等。

![015-dag-orchestrators](https://github.com/humanlayer/12-factor-agents/blob/main/img/015-dag-orchestrators.png)

### 智能体的承诺

我不是第一个[这样说的人](https://youtu.be/Dc99-zTMyMg?si=bcT0hIwWij2mR-40&t=73)，但当我开始学习智能体时，我最大的收获是你可以抛弃DAG。软件工程师不需要编码每个步骤和边缘情况，你可以给智能体一个目标和一组转换：

![025-agent-dag](https://github.com/humanlayer/12-factor-agents/blob/main/img/025-agent-dag.png)

让LLM实时做决定来找出路径

![026-agent-dag-lines](https://github.com/humanlayer/12-factor-agents/blob/main/img/026-agent-dag-lines.png)

这里的承诺是你写更少的软件，你只需给LLM图的"边缘"，让它找出节点。你可以从错误中恢复，你可以写更少的代码，你可能会发现LLM为问题找到新颖的解决方案。


### 智能体作为循环

正如我们稍后将看到的，事实证明这并不完全有效。

让我们深入一步 - 对于智能体，你有这个由3个步骤组成的循环：

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

我们的初始上下文只是起始事件（可能是用户消息，可能是cron触发，可能是webhook等），我们请求llm选择下一步（工具）或确定我们已经完成。

这里是一个多步骤示例：

[![027-agent-loop-animation](https://github.com/humanlayer/12-factor-agents/blob/main/img/027-agent-loop-animation.gif)](https://github.com/user-attachments/assets/3beb0966-fdb1-4c12-a47f-ed4e8240f8fd)

<details>
<summary><a href="https://github.com/humanlayer/12-factor-agents/blob/main/img/027-agent-loop-animation.gif">GIF版本</a></summary>

![027-agent-loop-animation](https://github.com/humanlayer/12-factor-agents/blob/main/img/027-agent-loop-animation.gif)]

</details>

## 为什么要12因子智能体？

归根结底，这种方法并不能如我们希望的那样有效。

在构建HumanLayer的过程中，我与至少100个SaaS构建者（主要是技术创始人）交谈，他们希望让他们现有的产品更具智能化。这个旅程通常是这样的：

1. 决定你想要构建一个智能体
2. 产品设计、UX映射、要解决什么问题
3. 想要快速行动，所以抓取$框架并*开始构建*
4. 达到70-80%的质量标准
5. 意识到80%对大多数面向客户的功能来说还不够好
6. 意识到超过80%需要逆向工程框架、提示、流程等
7. 从头开始重新开始

<details>
<summary>随机免责声明</summary>

**免责声明**：我不确定在哪里说这个合适，但这里似乎是一个好地方：**这绝不是对市面上众多框架或在这些框架上工作的相当聪明的人的贬低**。它们实现了令人难以置信的事情，并加速了AI生态系统的发展。

我希望这篇文章的一个结果是智能体框架构建者可以从我和其他人的旅程中学习，并使框架变得更好。

特别是对于想要快速行动但需要深度控制的构建者。

**免责声明2**：我不打算讨论MCP。我相信你能看出它的适用之处。

**免责声明3**：我主要使用TypeScript，出于[某些原因](https://www.linkedin.com/posts/dexterihorthy_llms-typescript-aiagents-activity-7290858296679313408-Lh9e?utm_source=share&utm_medium=member_desktop&rcm=ACoAAA4oHTkByAiD-wZjnGsMBUL_JT6nyyhOh30)，但所有这些东西在Python或你偏好的任何其他语言中都有效。


总之回到正题...

</details>

### 出色LLM应用程序的设计模式

在深入研究数百个AI库并与数十位创始人合作后，我的直觉是：

1. 有一些核心因素使智能体出色
2. 全力投入框架并构建本质上是绿地重写可能适得其反
3. 有一些核心原则使智能体出色，如果你引入框架，你将获得其中的大部分/全部
4. 但是，我见过构建者将高质量AI软件交到客户手中的最快方式是从智能体构建中采用小而模块化的概念，并将它们整合到现有产品中
5. 这些来自智能体的模块化概念可以由大多数熟练的软件工程师定义和应用，即使他们没有AI背景

> #### 我见过构建者将优秀AI软件交到客户手中的最快方式是从智能体构建中采用小而模块化的概念，并将它们整合到现有产品中


## 12个因子（再次）


- [我们如何走到这里：软件简史](./content/brief-history-of-software-zh.md)
- [因子1：自然语言到工具调用](./content/factor-01-natural-language-to-tool-calls-zh.md)
- [因子2：掌控你的提示](./content/factor-02-own-your-prompts-zh.md)
- [因子3：掌控你的上下文窗口](./content/factor-03-own-your-context-window-zh.md)
- [因子4：工具只是结构化输出](./content/factor-04-tools-are-structured-outputs-zh.md)
- [因子5：统一执行状态和业务状态](./content/factor-05-unify-execution-state-zh.md)
- [因子6：使用简单API启动/暂停/恢复](./content/factor-06-launch-pause-resume-zh.md)
- [因子7：通过工具调用联系人类](./content/factor-07-contact-humans-with-tools-zh.md)
- [因子8：掌控你的控制流](./content/factor-08-own-your-control-flow-zh.md)
- [因子9：将错误压缩到上下文窗口](./content/factor-09-compact-errors-zh.md)
- [因子10：小型、专注的智能体](./content/factor-10-small-focused-agents-zh.md)
- [因子11：从任何地方触发，在用户所在的地方与他们见面](./content/factor-11-trigger-from-anywhere-zh.md)
- [因子12：让你的智能体成为无状态化简器](./content/factor-12-stateless-reducer-zh.md)

## 荣誉提及/其他建议

- [因子13：预取你可能需要的所有上下文](./content/appendix-13-pre-fetch-zh.md)

## 相关资源

- 在[这里](https://github.com/humanlayer/12-factor-agents)为本指南做贡献
- [我在2025年3月的Tool Use播客节目中谈论了其中的很多内容](https://youtu.be/8bIHcttkOTE)
- 我在[The Outer Loop](https://theouterloop.substack.com)写一些这方面的内容
- 我与[@hellovai](https://github.com/hellovai)一起做[关于最大化LLM性能的网络研讨会](https://github.com/hellovai/ai-that-works/tree/main)
- 我们用这种方法在[got-agents/agents](https://github.com/got-agents/agents)下构建OSS智能体
- 我们忽略了自己所有的建议，构建了一个[在kubernetes中运行分布式智能体的框架](https://github.com/humanlayer/kubechain)
- 本指南的其他链接：
  - [12因子应用](https://12factor.net)
  - [构建有效的智能体(Anthropic)](https://www.anthropic.com/engineering/building-effective-agents#agents)
  - [提示即函数](https://thedataexchange.media/baml-revolution-in-ai-engineering/ )
  - [库模式：为什么框架是邪恶的](https://tomasp.net/blog/2015/library-frameworks/)
  - [错误的抽象](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction)
  - [Mailcrew智能体](https://github.com/dexhorthy/mailcrew)
  - [Mailcrew演示视频](https://www.youtube.com/watch?v=f_cKnoPC_Oo)
  - [Chainlit演示](https://x.com/chainlit_io/status/1858613325921480922)
  - [LLM的TypeScript](https://www.linkedin.com/posts/dexterihorthy_llms-typescript-aiagents-activity-7290858296679313408-Lh9e)
  - [模式对齐解析](https://www.boundaryml.com/blog/schema-aligned-parsing)
  - [函数调用 vs 结构化输出 vs JSON模式](https://www.vellum.ai/blog/when-should-i-use-function-calling-structured-outputs-or-json-mode)
  - [GitHub上的BAML](https://github.com/boundaryml/baml)
  - [OpenAI JSON vs 函数调用](https://docs.llamaindex.ai/en/stable/examples/llm/openai_json_vs_function_calling/)
  - [外层循环智能体](https://theouterloop.substack.com/p/openais-realtime-api-is-a-step-towards)
  - [Airflow](https://airflow.apache.org/)
  - [Prefect](https://www.prefect.io/)
  - [Dagster](https://dagster.io/)
  - [Inngest](https://www.inngest.com/)
  - [Windmill](https://www.windmill.dev/)
  - [AI智能体指数(MIT)](https://aiagentindex.mit.edu/)
  - [NotebookLM关于寻找模型能力边界](https://open.substack.com/pub/swyx/p/notebooklm?selection=08e1187c-cfee-4c63-93c9-71216640a5f8)

## 贡献者

感谢所有为12因子智能体做出贡献的人！

[<img src="https://avatars.githubusercontent.com/u/3730605?v=4&s=80" width="80px" alt="dexhorthy" />](https://github.com/dexhorthy) [<img src="https://avatars.githubusercontent.com/u/50557586?v=4&s=80" width="80px" alt="Sypherd" />](https://github.com/Sypherd) [<img src="https://avatars.githubusercontent.com/u/66259401?v=4&s=80" width="80px" alt="tofaramususa" />](https://github.com/tofaramususa) [<img src="https://avatars.githubusercontent.com/u/18105223?v=4&s=80" width="80px" alt="a-churchill" />](https://github.com/a-churchill) [<img src="https://avatars.githubusercontent.com/u/4084885?v=4&s=80" width="80px" alt="Elijas" />](https://github.com/Elijas) [<img src="https://avatars.githubusercontent.com/u/39267118?v=4&s=80" width="80px" alt="hugolmn" />](https://github.com/hugolmn) [<img src="https://avatars.githubusercontent.com/u/1882972?v=4&s=80" width="80px" alt="jeremypeters" />](https://github.com/jeremypeters)

[<img src="https://avatars.githubusercontent.com/u/380402?v=4&s=80" width="80px" alt="kndl" />](https://github.com/kndl) [<img src="https://avatars.githubusercontent.com/u/16674643?v=4&s=80" width="80px" alt="maciejkos" />](https://github.com/maciejkos) [<img src="https://avatars.githubusercontent.com/u/85041180?v=4&s=80" width="80px" alt="pfbyjy" />](https://github.com/pfbyjy) [<img src="https://avatars.githubusercontent.com/u/36044389?v=4&s=80" width="80px" alt="0xRaduan" />](https://github.com/0xRaduan) [<img src="https://avatars.githubusercontent.com/u/7169731?v=4&s=80" width="80px" alt="zyuanlim" />](https://github.com/zyuanlim) [<img src="https://avatars.githubusercontent.com/u/15862501?v=4&s=80" width="80px" alt="lombardo-chcg" />](https://github.com/lombardo-chcg) [<img src="https://avatars.githubusercontent.com/u/160066852?v=4&s=80" width="80px" alt="sahanatvessel" />](https://github.com/sahanatvessel)

## 版本


这是12因子智能体的当前版本，版本1.0。在[v1.1分支](https://github.com/humanlayer/12-factor-agents/tree/v1.1)上有版本1.1的草案。有一些[问题来跟踪v1.1的工作](https://github.com/humanlayer/12-factor-agents/issues?q=is%3Aissue%20state%3Aopen%20label%3Aversion%3A%3A1.1)。

 
## 许可证

所有内容和图像都在<a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0许可证</a>下授权

代码在<a href="https://www.apache.org/licenses/LICENSE-2.0">Apache 2.0许可证</a>下授权
