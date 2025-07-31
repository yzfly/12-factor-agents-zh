[← 回到README](https://github.com/humanlayer/12-factor-agents/blob/main/README.md)

### 1. 自然语言到 Tool Calling

在 Agent 构建中最常见的模式之一是将自然语言转换为结构化 Tool Call。这是一个强大的模式，允许你构建能够对任务进行推理并执行它们的 Agent。

![110-natural-language-tool-calls](https://github.com/humanlayer/12-factor-agents/blob/main/img/110-natural-language-tool-calls.png)

这种模式在原子化应用时，是将以下短语进行简单转换

> 你能为 Terri 创建一个 750 美元的付款链接，用于赞助 2 月 AI Tinkerers 聚会吗？

转换为描述 Stripe API 调用的结构化对象，如

```json
{
  "function": {
    "name": "create_payment_link",
    "parameters": {
      "amount": 750,
      "customer": "cust_128934ddasf9",
      "product": "prod_8675309",
      "price": "prc_09874329fds",
      "quantity": 1,
      "memo": "嘿 Jeff - 请看下面 2 月 AI Tinkerers 聚会的付款链接"
    }
  }
}
```

**注意**：实际上 Stripe API 要复杂一些，一个[真正做这件事的 Agent](https://github.com/dexhorthy/mailcrew) ([视频](https://www.youtube.com/watch?v=f_cKnoPC_Oo)) 会列出客户、列出产品、列出价格等，以使用正确的 ID 构建这个负载，或在 Prompt/上下文窗口中包含这些 ID (我们将在下面看到这些本质上是相同的！)

从那里，确定性代码可以获取负载并对其进行处理。 (更多信息见[因子 3](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-03-own-your-context-window.md))

```python
# 大语言模型接受自然语言并返回结构化对象
nextStep = await llm.determineNextStep(
  """
  为 Jeff 创建一个 750 美元的付款链接
  用于赞助 2 月 AI Tinkerers 聚会
  """
  )

# 根据其函数处理结构化输出
if nextStep.function == 'create_payment_link':
    stripe.paymentlinks.create(nextStep.parameters)
    return  # 或者其他你希望的操作，见下文
elif nextStep.function == 'something_else':
    # ... 更多情况
    pass
else:  # 模型没有调用我们识别的工具
    # 做其他事情
    pass
```

**注意**：虽然完整的 Agent 会接收 API 调用结果并循环处理，最终返回类似这样的内容

> 我已成功为 Terri 创建了 750 美元的付款链接，用于赞助 2 月 AI Tinkerers 聚会。这里是链接：https://buy.stripe.com/test_1234567890

**相反**，我们实际上要跳过这一步，将其保留给另一个因子，你可能想要也可能不想要整合 (由你决定！)

[← 我们如何走到这里](https://github.com/humanlayer/12-factor-agents/blob/main/content/brief-history-of-software.md) | [掌控你的 Prompt →](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-02-own-your-prompts.md)