[← 回到README](https://github.com/humanlayer/12-factor-agents/blob/main/README.md)

### 1. 自然语言到工具调用

在智能体构建中最常见的模式之一是将自然语言转换为结构化工具调用。这是一个强大的模式，允许你构建能够推理任务并执行它们的智能体。

![110-natural-language-tool-calls](https://github.com/humanlayer/12-factor-agents/blob/main/img/110-natural-language-tool-calls.png)

这种模式，当原子化应用时，是将如下短语的简单转换

> 你能为Terri创建一个750美元的付款链接，用于赞助2月AI修补者聚会吗？

转换为描述Stripe API调用的结构化对象，如

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
      "memo": "嘿Jeff - 请看下面2月AI修补者聚会的付款链接"
    }
  }
}
```

**注意**：实际上stripe API要复杂一些，一个[真正做这件事的智能体](https://github.com/dexhorthy/mailcrew)（[视频](https://www.youtube.com/watch?v=f_cKnoPC_Oo)）会列出客户、列出产品、列出价格等，以使用正确的ID构建这个负载，或在提示/上下文窗口中包含这些ID（我们将在下面看到这些本质上是相同的！）

从那里，确定性代码可以获取负载并对其进行处理。（更多信息见[因子3](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-03-own-your-context-window.md))

```python
# LLM接受自然语言并返回结构化对象
nextStep = await llm.determineNextStep(
  """
  为Jeff创建一个750美元的付款链接
  用于赞助2月AI修补者聚会
  """
  )

# 根据其函数处理结构化输出
if nextStep.function == 'create_payment_link':
    stripe.paymentlinks.create(nextStep.parameters)
    return  # 或者任何你想要的，见下文
elif nextStep.function == 'something_else':
    # ... 更多情况
    pass
else:  # 模型没有调用我们知道的工具
    # 做其他事情
    pass
```

**注意**：虽然完整的智能体会接收API调用结果并循环处理，最终返回类似这样的内容

> 我已成功为Terri创建了750美元的付款链接，用于赞助2月AI修补者聚会。这里是链接：https://buy.stripe.com/test_1234567890

**相反**，我们实际上要跳过这一步，将其保存给另一个因子，你可能想要也可能不想要整合（由你决定！）

[← 我们如何走到这里](https://github.com/humanlayer/12-factor-agents/blob/main/content/brief-history-of-software.md) | [掌控你的提示 →](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-02-own-your-prompts.md)