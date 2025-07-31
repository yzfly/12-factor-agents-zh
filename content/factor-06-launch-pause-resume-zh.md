[← 返回README](https://github.com/humanlayer/12-factor-agents/blob/main/README.md)

### 6. 使用简单API启动/暂停/恢复

Agent 只是程序，我们对如何启动、查询、恢复和停止它们有预期。

[![pause-resume animation](https://github.com/humanlayer/12-factor-agents/blob/main/img/165-pause-resume-animation.gif)](https://github.com/user-attachments/assets/feb1a425-cb96-4009-a133-8bd29480f21f)

<details>
<summary><a href="https://github.com/humanlayer/12-factor-agents/blob/main/img/165-pause-resume-animation.gif">GIF版本</a></summary>

![pause-resume animation](https://github.com/humanlayer/12-factor-agents/blob/main/img/165-pause-resume-animation.gif)]

</details>


用户、应用程序、管道和其他 Agent 应该能够通过简单的 API 轻松启动 Agent。

Agent 及其编排确定性代码应该能够在需要长时间运行的操作时暂停 Agent。

像 webhooks 这样的外部触发器应该能够让 Agent 从停止的地方恢复，而无需与 Agent 编排器深度集成。

与[因子 5 - 统一执行状态和业务状态](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-05-unify-execution-state.md)和[因子 8 - 掌控你的控制流](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-08-own-your-control-flow.md)密切相关，但可以独立实现。



**注意** - AI 编排器通常允许暂停和恢复，但不是在工具选择和工具执行之间的时刻。另见[因子 7 - 通过 Tool Calling 联系人类](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-07-contact-humans-with-tools.md)和[因子 11 - 从任何地方触发，在用户所在的地方与他们会面](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-11-trigger-from-anywhere.md)。

[← 统一执行状态](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-05-unify-execution-state.md) | [通过工具联系人类 →](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-07-contact-humans-with-tools.md)