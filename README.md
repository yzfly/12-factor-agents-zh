# 12 因子智能体 - 构建可靠大语言模型应用的原则

<div align="center">
<a href="https://www.apache.org/licenses/LICENSE-2.0">
        <img src="https://img.shields.io/badge/Code-Apache%202.0-blue.svg" alt="代码许可证: Apache 2.0"></a>
<a href="https://creativecommons.org/licenses/by-sa/4.0/">
        <img src="https://img.shields.io/badge/Content-CC%20BY--SA%204.0-lightgrey.svg" alt="内容许可证: CC BY-SA 4.0"></a>
<a href="https://humanlayer.dev/discord">
    <img src="https://img.shields.io/badge/chat-discord-5865F2" alt="Discord 服务器"></a>
<a href="https://www.youtube.com/watch?v=8kMaTybvDUw">
    <img src="https://img.shields.io/badge/aidotengineer-conf_talk_(17m)-white" alt="YouTube 深度解析"></a>
<a href="https://www.youtube.com/watch?v=yxJDyQ8v6P0">
    <img src="https://img.shields.io/badge/youtube-deep_dive-crimson" alt="YouTube 深度解析"></a>
    
</div>

<p></p>

*遵循 [12 因子应用](https://12factor.net/) 的设计理念*。

> **📋 关于本翻译版本**  
> **原文**：https://github.com/humanlayer/12-factor-agents  
> **中文翻译**：云中江树  
> *本项目源代码完全开放，欢迎您提供反馈和贡献。让我们共同探索！*

> [!TIP]
> 错过了 AI 工程师世界博览会？[点击观看演讲](https://www.youtube.com/watch?v=8kMaTybvDUw)
>
> 寻找上下文工程相关内容？[直接跳转到因子 3](./content/factor-03-own-your-context-window-zh.md)
>
> 想要为 `npx/uvx create-12-factor-agent` 做贡献 - 查看[讨论帖](https://github.com/humanlayer/12-factor-agents/discussions/61)
>
> 想要阅读英文版本？[English Version](./README-en.md)


<img referrerpolicy="no-referrer-when-downgrade" src="https://static.scarf.sh/a.png?x-pxid=2acad99a-c2d9-48df-86f5-9ca8061b7bf9" />

<a href="#visual-nav"><img width="907" alt="Screenshot 2025-04-03 at 2 49 07 PM" src="https://github.com/user-attachments/assets/23286ad8-7bef-4902-b371-88ff6a22e998" /></a>


大家好，我是 Dex。我在 [AI 智能体](https://theouterloop.substack.com) 领域[深耕](https://youtu.be/8bIHcttkOTE)已有[相当长的时间](https://humanlayer.dev)。


**我已经试用过市面上所有的智能体框架**，从即插即用的 crew/langchains 到号称"极简主义"的 smolagents，再到"生产级"的 langraph、griptape 等等。

**我与许多实力强劲的创始人进行过深入交流**，无论是否来自 YC，他们都在利用 AI 构建令人印象深刻的产品。其中大多数都在自主构建技术栈。我发现在生产环境的面向客户的智能体中，框架的使用并不多见。

**令我意外的发现是**，大多数标榜为"AI 智能体"的产品实际上并没有那么"智能化"。它们中的很多本质上是确定性代码，只是在关键节点巧妙地融入大语言模型步骤，从而创造出真正神奇的用户体验。

智能体，至少是优秀的智能体，并不遵循 ["给你提示词，给你一堆工具，循环执行直到达成目标"](https://www.anthropic.com/engineering/building-effective-agents#agents) 这种模式。相反，它们主要由传统软件构成。

因此，我开始思考这样一个问题：

> ### **我们可以运用哪些原则来构建真正优秀的大语言模型驱动软件，使其足以交付给生产环境的客户？**

欢迎来到 12 因子智能体的世界。正如芝加哥自戴利市长以来的每一任市长都会在该市主要机场张贴的标语一样，我们很高兴您的到来。

*特别感谢 [@iantbutler01](https://github.com/iantbutler01)、[@tnm](https://github.com/tnm)、[@hellovai](https://www.github.com/hellovai)、[@stantonk](https://www.github.com/stantonk)、[@balanceiskey](https://www.github.com/balanceiskey)、[@AdjectiveAllison](https://www.github.com/AdjectiveAllison)、[@pfbyjy](https://www.github.com/pfbyjy)、[@a-churchill](https://www.github.com/a-churchill) 以及旧金山 MLOps 社区对本指南提供的早期反馈。*

## 精简版本：12 个因子

即使大语言模型[持续呈指数级发展](./content/factor-10-small-focused-agents-zh.md#what-if-llms-get-smarter)，仍然存在一些核心工程技术，能够让大语言模型驱动的软件变得更可靠、更可扩展、更易于维护。

- [发展历程：软件简史](./content/brief-history-of-software-zh.md)
- [因子 1：从自然语言到工具调用](./content/factor-01-natural-language-to-tool-calls-zh.md)
- [因子 2：掌控你的提示词](./content/factor-02-own-your-prompts-zh.md)
- [因子 3：掌控你的上下文窗口](./content/factor-03-own-your-context-window-zh.md)
- [因子 4：工具本质上是结构化输出](./content/factor-04-tools-are-structured-outputs-zh.md)
- [因子 5：统一执行状态与业务状态](./content/factor-05-unify-execution-state-zh.md)
- [因子 6：通过简单 API 实现启动/暂停/恢复](./content/factor-06-launch-pause-resume-zh.md)
- [因子 7：通过工具调用与人类交互](./content/factor-07-contact-humans-with-tools-zh.md)
- [因子 8：掌控你的控制流](./content/factor-08-own-your-control-flow-zh.md)
- [因子 9：将错误信息压缩到上下文窗口](./content/factor-09-compact-errors-zh.md)
- [因子 10：小型、专注的智能体](./content/factor-10-small-focused-agents-zh.md)
- [因子 11：随时随地触发，在用户所在之处与之相遇](./content/factor-11-trigger-from-anywhere-zh.md)
- [因子 12：将你的智能体设计为无状态归约器](./content/factor-12-stateless-reducer-zh.md)

### 可视化导航

|    |    |    |
|----|----|-----|
|[![因子 1](https://github.com/humanlayer/12-factor-agents/blob/main/img/110-natural-language-tool-calls.png)](./content/factor-01-natural-language-to-tool-calls-zh.md) | [![因子 2](https://github.com/humanlayer/12-factor-agents/blob/main/img/120-own-your-prompts.png)](./content/factor-02-own-your-prompts-zh.md) | [![因子 3](https://github.com/humanlayer/12-factor-agents/blob/main/img/130-own-your-context-building.png)](./content/factor-03-own-your-context-window-zh.md) |
|[![因子 4](https://github.com/humanlayer/12-factor-agents/blob/main/img/140-tools-are-just-structured-outputs.png)](./content/factor-04-tools-are-structured-outputs-zh.md) | [![因子 5](https://github.com/humanlayer/12-factor-agents/blob/main/img/150-unify-state.png)](./content/factor-05-unify-execution-state-zh.md) | [![因子 6](https://github.com/humanlayer/12-factor-agents/blob/main/img/160-pause-resume-with-simple-apis.png)](./content/factor-06-launch-pause-resume-zh.md) |
| [![因子 7](https://github.com/humanlayer/12-factor-agents/blob/main/img/170-contact-humans-with-tools.png)](./content/factor-07-contact-humans-with-tools-zh.md) | [![因子 8](https://github.com/humanlayer/12-factor-agents/blob/main/img/180-control-flow.png)](./content/factor-08-own-your-control-flow-zh.md) | [![因子 9](https://github.com/humanlayer/12-factor-agents/blob/main/img/190-factor-9-errors-static.png)](./content/factor-09-compact-errors-zh.md) |
| [![因子 10](https://github.com/humanlayer/12-factor-agents/blob/main/img/1a0-small-focused-agents.png)](./content/factor-10-small-focused-agents-zh.md) | [![因子 11](https://github.com/humanlayer/12-factor-agents/blob/main/img/1b0-trigger-from-anywhere.png)](./content/factor-11-trigger-from-anywhere-zh.md) | [![因子 12](https://github.com/humanlayer/12-factor-agents/blob/main/img/1c0-stateless-reducer.png)](./content/factor-12-stateless-reducer-zh.md) |

## 发展历程

要深入了解我的智能体探索之旅以及促成本指南的原因，请查看[软件简史](./content/brief-history-of-software-zh.md) - 以下是简要概述：

### 智能体的愿景

我们将大量讨论有向图 (DG) 及其无环版本 DAG。首先我想指出的是...软件本质上就是一个有向图。我们过去用流程图来表示程序是有其道理的。

![010-software-dag](https://github.com/humanlayer/12-factor-agents/blob/main/img/010-software-dag.png)

### 从代码到 DAG

大约 20 年前，我们开始看到 DAG 编排器变得流行起来。这里说的是像 [Airflow](https://airflow.apache.org/)、[Prefect](https://www.prefect.io/) 这样的经典工具，以及一些前驱产品，还有像 [dagster](https://dagster.io/)、[inngest](https://www.inngest.com/)、[windmill](https://www.windmill.dev/) 这样的新兴工具。它们遵循相同的图模式，同时具备可观测性、模块化、重试机制、管理功能等附加优势。

![015-dag-orchestrators](https://github.com/humanlayer/12-factor-agents/blob/main/img/015-dag-orchestrators.png)

### 智能体的愿景

我不是第一个[提出这个观点的人](https://youtu.be/Dc99-zTMyMg?si=bcT0hIwWij2mR-40&t=73)，但当我开始学习智能体时，最大的收获是你可以抛弃 DAG。软件工程师无需为每个步骤和边界情况编写代码，你只需给智能体一个目标和一组状态转换：

![025-agent-dag](https://github.com/humanlayer/12-factor-agents/blob/main/img/025-agent-dag.png)

让大语言模型实时决策来确定路径

![026-agent-dag-lines](https://github.com/humanlayer/12-factor-agents/blob/main/img/026-agent-dag-lines.png)

这里的愿景是：你编写更少的软件，只需给大语言模型提供图的"边"，让它找出节点。你可以从错误中恢复，编写更少的代码，甚至可能发现大语言模型为问题找到新颖的解决方案。


### 智能体作为循环结构

正如我们稍后将看到的，事实证明这种方法并不完全奏效。

让我们深入一步 - 对于智能体，你有这样一个由 3 个步骤组成的循环：

1. 大语言模型确定工作流中的下一步，输出结构化 JSON ("工具调用")
2. 确定性代码执行工具调用
3. 结果被追加到上下文窗口中
4. 重复上述过程，直到下一步被确定为"完成"

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

我们的初始上下文就是起始事件 (可能是用户消息、定时任务触发或 webhook 调用等)，然后我们请求大语言模型选择下一步 (工具) 或确定已经完成。

以下是一个多步骤示例：

[![027-agent-loop-animation](https://github.com/humanlayer/12-factor-agents/blob/main/img/027-agent-loop-animation.gif)](https://github.com/user-attachments/assets/3beb0966-fdb1-4c12-a47f-ed4e8240f8fd)

<details>
<summary><a href="https://github.com/humanlayer/12-factor-agents/blob/main/img/027-agent-loop-animation.gif">GIF 版本</a></summary>

![027-agent-loop-animation](https://github.com/humanlayer/12-factor-agents/blob/main/img/027-agent-loop-animation.gif)

</details>

## 为什么需要 12 因子智能体？

归根结底，这种方法的效果并不如我们期望的那样好。

在构建 HumanLayer 的过程中，我与至少 100 位 SaaS 构建者 (主要是技术创始人) 进行了交流，他们都希望让现有产品更加智能化。这个过程通常是这样的：

1. 决定构建一个智能体
2. 产品设计、用户体验规划、确定要解决的问题
3. 希望快速推进，于是选择某个框架并*开始构建*
4. 达到 70-80% 的质量标准
5. 意识到 80% 对于大多数面向客户的功能来说还不够好
6. 意识到要超越 80% 需要对框架、提示词、流程等进行逆向工程
7. 从零开始重新构建

<details>
<summary>相关声明</summary>

**免责声明**：我不确定在哪里说这个最合适，但这里似乎是个好地方：**这绝不是对市面上众多框架或致力于这些框架的聪明人才的贬低**。它们实现了令人难以置信的成就，并推动了 AI 生态系统的发展。

我希望这篇文章的一个成果是，智能体框架的构建者可以从我和其他人的经历中学习，让框架变得更好。

特别是对于那些希望快速行动但需要深度控制的构建者。

**免责声明 2**：我不会讨论 MCP。我相信你能看出它的适用场景。

**免责声明 3**：我主要使用 TypeScript，基于[某些考虑](https://www.linkedin.com/posts/dexterihorthy_llms-typescript-aiagents-activity-7290858296679313408-Lh9e?utm_source=share&utm_medium=member_desktop&rcm=ACoAAA4oHTkByAiD-wZjnGsMBUL_JT6nyyhOh30)，但所有这些内容在 Python 或你偏好的任何其他语言中都同样适用。


言归正传...

</details>

### 优秀大语言模型应用的设计模式

在深入研究数百个 AI 库并与数十位创始人合作后，我的直觉是：

1. 有一些核心要素让智能体变得出色
2. 完全依赖某个框架来进行全面重构可能会产生反效果。
3. 存在一些让智能体出色的核心原则，如果你采用框架，你会获得其中的大部分或全部
4. 但是，我见过的让构建者将高质量 AI 软件交付给客户的最快方式是从智能体构建中提取小型、模块化的概念，并将它们整合到现有产品中
5. 这些来自智能体的模块化概念可以由大多数熟练的软件工程师定义和应用，即使他们没有 AI 背景

> #### 我见过的让构建者将优秀 AI 软件交付给客户的最快方式是从智能体构建中提取小型、模块化的概念，并将它们整合到现有产品中


## 12 个因子 (再次展示)


- [发展历程：软件简史](./content/brief-history-of-software-zh.md)
- [因子 1：从自然语言到工具调用](./content/factor-01-natural-language-to-tool-calls-zh.md)
- [因子 2：掌控你的提示词](./content/factor-02-own-your-prompts-zh.md)
- [因子 3：掌控你的上下文窗口](./content/factor-03-own-your-context-window-zh.md)
- [因子 4：工具本质上是结构化输出](./content/factor-04-tools-are-structured-outputs-zh.md)
- [因子 5：统一执行状态与业务状态](./content/factor-05-unify-execution-state-zh.md)
- [因子 6：通过简单 API 实现启动/暂停/恢复](./content/factor-06-launch-pause-resume-zh.md)
- [因子 7：通过工具调用与人类交互](./content/factor-07-contact-humans-with-tools-zh.md)
- [因子 8：掌控你的控制流](./content/factor-08-own-your-control-flow-zh.md)
- [因子 9：将错误信息压缩到上下文窗口](./content/factor-09-compact-errors-zh.md)
- [因子 10：小型、专注的智能体](./content/factor-10-small-focused-agents-zh.md)
- [因子 11：随时随地触发，在用户所在之处与之相遇](./content/factor-11-trigger-from-anywhere-zh.md)
- [因子 12：将你的智能体设计为无状态归约器](./content/factor-12-stateless-reducer-zh.md)

## 相关推荐/其他建议

- [因子 13：预取所有可能需要的上下文](./content/appendix-13-pre-fetch-zh.md)

## 相关资源

- 在[这里](https://github.com/humanlayer/12-factor-agents)为本指南做贡献
- [我在 2025 年 3 月的 Tool Use 播客节目中讨论了其中很多内容](https://youtu.be/8bIHcttkOTE)
- 我在 [The Outer Loop](https://theouterloop.substack.com) 上撰写相关内容
- 我与 [@hellovai](https://github.com/hellovai) 一起举办[关于最大化大语言模型性能的网络研讨会](https://github.com/hellovai/ai-that-works/tree/main)
- 我们使用这种方法在 [got-agents/agents](https://github.com/got-agents/agents) 下构建开源智能体
- 我们忽略了自己的所有建议，构建了一个[在 Kubernetes 中运行分布式智能体的框架](https://github.com/humanlayer/kubechain)
- 本指南的其他相关链接：
  - [12 因子应用](https://12factor.net)
  - [构建有效的智能体 (Anthropic)](https://www.anthropic.com/engineering/building-effective-agents#agents)
  - [提示词即函数](https://thedataexchange.media/baml-revolution-in-ai-engineering/)
  - [库模式：为什么框架是邪恶的](https://tomasp.net/blog/2015/library-frameworks/)
  - [错误的抽象](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction)
  - [Mailcrew 智能体](https://github.com/dexhorthy/mailcrew)
  - [Mailcrew 演示视频](https://www.youtube.com/watch?v=f_cKnoPC_Oo)
  - [Chainlit 演示](https://x.com/chainlit_io/status/1858613325921480922)
  - [大语言模型的 TypeScript](https://www.linkedin.com/posts/dexterihorthy_llms-typescript-aiagents-activity-7290858296679313408-Lh9e)
  - [模式对齐解析](https://www.boundaryml.com/blog/schema-aligned-parsing)
  - [函数调用 vs 结构化输出 vs JSON 模式](https://www.vellum.ai/blog/when-should-i-use-function-calling-structured-outputs-or-json-mode)
  - [GitHub 上的 BAML](https://github.com/boundaryml/baml)
  - [OpenAI JSON vs 函数调用](https://docs.llamaindex.ai/en/stable/examples/llm/openai_json_vs_function_calling/)
  - [外循环智能体](https://theouterloop.substack.com/p/openais-realtime-api-is-a-step-towards)
  - [Airflow](https://airflow.apache.org/)
  - [Prefect](https://www.prefect.io/)
  - [Dagster](https://dagster.io/)
  - [Inngest](https://www.inngest.com/)
  - [Windmill](https://www.windmill.dev/)
  - [AI 智能体指数 (MIT)](https://aiagentindex.mit.edu/)
  - [NotebookLM 关于寻找模型能力边界](https://open.substack.com/pub/swyx/p/notebooklm?selection=08e1187c-cfee-4c63-93c9-71216640a5f8)

## 贡献者

感谢所有为 12 因子智能体做出贡献的人！

[<img src="https://avatars.githubusercontent.com/u/3730605?v=4&s=80" width="80px" alt="dexhorthy" />](https://github.com/dexhorthy) [<img src="https://avatars.githubusercontent.com/u/50557586?v=4&s=80" width="80px" alt="Sypherd" />](https://github.com/Sypherd) [<img src="https://avatars.githubusercontent.com/u/66259401?v=4&s=80" width="80px" alt="tofaramususa" />](https://github.com/tofaramususa) [<img src="https://avatars.githubusercontent.com/u/18105223?v=4&s=80" width="80px" alt="a-churchill" />](https://github.com/a-churchill) [<img src="https://avatars.githubusercontent.com/u/4084885?v=4&s=80" width="80px" alt="Elijas" />](https://github.com/Elijas) [<img src="https://avatars.githubusercontent.com/u/39267118?v=4&s=80" width="80px" alt="hugolmn" />](https://github.com/hugolmn) [<img src="https://avatars.githubusercontent.com/u/1882972?v=4&s=80" width="80px" alt="jeremypeters" />](https://github.com/jeremypeters)

[<img src="https://avatars.githubusercontent.com/u/380402?v=4&s=80" width="80px" alt="kndl" />](https://github.com/kndl) [<img src="https://avatars.githubusercontent.com/u/16674643?v=4&s=80" width="80px" alt="maciejkos" />](https://github.com/maciejkos) [<img src="https://avatars.githubusercontent.com/u/85041180?v=4&s=80" width="80px" alt="pfbyjy" />](https://github.com/pfbyjy) [<img src="https://avatars.githubusercontent.com/u/36044389?v=4&s=80" width="80px" alt="0xRaduan" />](https://github.com/0xRaduan) [<img src="https://avatars.githubusercontent.com/u/7169731?v=4&s=80" width="80px" alt="zyuanlim" />](https://github.com/zyuanlim) [<img src="https://avatars.githubusercontent.com/u/15862501?v=4&s=80" width="80px" alt="lombardo-chcg" />](https://github.com/lombardo-chcg) [<img src="https://avatars.githubusercontent.com/u/160066852?v=4&s=80" width="80px" alt="sahanatvessel" />](https://github.com/sahanatvessel)

## 版本

这是 12 因子智能体的当前版本，版本 1.0。[v1.1 分支](https://github.com/humanlayer/12-factor-agents/tree/v1.1)上有版本 1.1 的草案。有一些[问题用于跟踪 v1.1 的工作](https://github.com/humanlayer/12-factor-agents/issues?q=is%3Aissue%20state%3Aopen%20label%3Aversion%3A%3A1.1)。

 
## 许可证

所有内容和图像均在 <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0 许可证</a> 下授权

代码在 <a href="https://www.apache.org/licenses/LICENSE-2.0">Apache 2.0 许可证</a> 下授权