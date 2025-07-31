[← 返回README](https://github.com/humanlayer/12-factor-agents/blob/main/README.md)

### 10. 小而专注的 Agent

与其构建试图做所有事情的巨大 Agent，不如构建小而专注的 Agent，专门做好一件事。Agent 只是更大的、主要是确定性系统中的一个构建块。

![1a0-small-focused-agents](https://github.com/humanlayer/12-factor-agents/blob/main/img/1a0-small-focused-agents.png)

这里的关键洞察是关于大语言模型的局限性：任务越大越复杂，需要的步骤就越多，这意味着更长的上下文窗口。随着上下文的增长，大语言模型更有可能迷失或失去焦点。通过让 Agent 专注于特定领域，最多 3-10 步，也许最多 20 步，我们保持上下文窗口的可管理性和大语言模型性能的高水平。

> #### 随着上下文的增长，大语言模型更有可能迷失或失去焦点

小而专注的 Agent 的好处：

1. **可管理的上下文**：更小的上下文窗口意味着更好的大语言模型性能
2. **明确的职责**：每个 Agent 都有明确定义的范围和目的
3. **更好的可靠性**：在复杂工作流程中迷失的可能性更小
4. **更容易测试**：更容易测试和验证特定功能
5. **改进的调试**：发生问题时更容易识别和修复

### 如果大语言模型变得更聪明呢？

如果大语言模型变得足够聪明来处理 100 步以上的工作流程，我们还需要这个吗？

简而言之是的。随着 Agent 和大语言模型的改进，它们**可能**自然扩展到能够处理更长的上下文窗口。这意味着处理更大 DAG 的更多部分。这种小而专注的方法确保你今天就能获得结果，同时为随着大语言模型上下文窗口变得更可靠而慢慢扩展 Agent 范围做好准备。(如果你以前重构过大型确定性代码库，你现在可能在点头)。

[![gif](https://github.com/humanlayer/12-factor-agents/blob/main/img/1a5-agent-scope-grow.gif)](https://github.com/user-attachments/assets/0cd3f52c-046e-4d5e-bab4-57657157c82f
)

<details>
<summary><a href="https://github.com/humanlayer/12-factor-agents/blob/main/img/1a5-agent-scope-grow.gif">GIF版本</a></summary>
![gif](https://github.com/humanlayer/12-factor-agents/blob/main/img/1a5-agent-scope-grow.gif)
</details>

对 Agent 的大小/范围保持刻意，并且仅以允许你保持质量的方式增长，这是关键所在。正如[构建 NotebookLM 的团队所说](https://open.substack.com/pub/swyx/p/notebooklm?selection=08e1187c-cfee-4c63-93c9-71216640a5f8&utm_campaign=post-share-selection&utm_medium=web)：

> 我觉得一直以来，AI 构建中最神奇的时刻出现在我真正、真正、真正接近模型能力边缘的时候

无论边界在哪里，如果你能找到那个边界并始终如一地做对，你就会构建神奇的体验。这里有许多护城河可以建设，但像往常一样，它们需要一些工程严谨性。

[← 紧凑错误](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-09-compact-errors.md) | [从任何地方触发 →](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-11-trigger-from-anywhere.md)