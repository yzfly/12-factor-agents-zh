[← 回到README](https://github.com/humanlayer/12-factor-agents/blob/main/README.md)

### 2. 掌控你的 Prompt

不要将你的 Prompt 工程外包给框架。

![120-own-your-prompts](https://github.com/humanlayer/12-factor-agents/blob/main/img/120-own-your-prompts.png)

顺便说一下，[这远非新颖的建议：](https://hamel.dev/blog/posts/prompt/)

![image](https://github.com/user-attachments/assets/575bab37-0f96-49fb-9ce3-9a883cdd420b)

一些框架提供这样的"黑盒"方法：

```python
agent = Agent(
  role="...",
  goal="...",
  personality="...",
  tools=[tool1, tool2, tool3]
)

task = Task(
  instructions="...",
  expected_output=OutputModel
)

result = agent.run(task)
```

这对于引入一些顶级的 Prompt 工程来帮助你开始是很好的，但通常很难调优和/或逆向工程以获得完全正确的 Token 输入到你的模型中。

相反，掌控你的 Prompt 并将它们视为一等代码：

```rust
function DetermineNextStep(thread: string) -> DoneForNow | ListGitTags | DeployBackend | DeployFrontend | RequestMoreInformation {
  prompt #"
    {{ _.role("system") }}
    
    你是一个管理前端和后端系统部署的有用助手。
    你勤奋工作，通过遵循最佳实践确保安全和成功的部署
    和适当的部署程序。
    
    在部署任何系统之前，你应该检查：
    - 部署环境（测试环境 vs 生产环境）
    - 要部署的正确标签/版本
    - 当前系统状态
    
    你可以使用deploy_backend、deploy_frontend和check_deployment_status等工具
    来管理部署。对于敏感部署，使用request_approval获取
    人工验证。
    
    总是思考首先要做什么，比如：
    - 检查当前部署状态
    - 验证部署标签是否存在
    - 如果需要请求批准
    - 在生产环境之前部署到测试环境
    - 监控部署进度
    
    {{ _.role("user") }}

    {{ thread }}
    
    下一步应该做什么？
  "#
}
```

 (上面的例子使用 [BAML](https://github.com/boundaryml/baml) 来生成 Prompt，但你可以使用任何你想要的 Prompt 工程工具，甚至只是手动模板化它)

如果这个签名看起来有点奇怪，我们将在[因子 4 - 工具只是结构化输出](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-04-tools-are-structured-outputs.md)中讨论

```typescript
function DetermineNextStep(thread: string) -> DoneForNow | ListGitTags | DeployBackend | DeployFrontend | RequestMoreInformation {
```

掌控 Prompt 的主要好处：

1. **完全控制**：编写你的 Agent 需要的确切指令，没有黑盒抽象
2. **测试和评估**：为你的 Prompt 构建测试和评估，就像你对任何其他代码一样
3. **迭代**：基于真实世界的性能快速修改 Prompt
4. **透明度**：确切知道你的 Agent 正在使用什么指令
5. **角色黑客**：利用支持用户/助手角色非标准使用的 API — 例如，现已弃用的 OpenAI "completions" API 的非聊天版本。这包括一些所谓的"模型操控"技术

记住：你的 Prompt 是你的应用程序逻辑和大语言模型之间的主要接口。

完全控制你的 Prompt 给你生产级 Agent 所需的灵活性和 Prompt 控制。

我不知道什么是最好的 Prompt，但我知道你想要能够尝试一切的灵活性。

[← 自然语言到 Tool Calling](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-01-natural-language-to-tool-calls.md) | [掌控你的上下文窗口 →](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-03-own-your-context-window.md)