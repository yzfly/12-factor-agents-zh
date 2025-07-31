[← 返回README](https://github.com/humanlayer/12-factor-agents/blob/main/README.md)

### 3. 掌控你的上下文窗口

你不一定需要使用基于标准消息的格式来向LLM传达上下文。

> #### 在任何给定时刻，你向智能体中LLM的输入都是"这是到目前为止发生的事情，下一步是什么"

<!-- todo syntax highlighting -->
<!-- ![130-own-your-context-building](https://github.com/humanlayer/12-factor-agents/blob/main/img/130-own-your-context-building.png) -->

一切都是上下文工程。[LLM是无状态函数](https://thedataexchange.media/baml-revolution-in-ai-engineering/)，将输入转换为输出。要获得最佳输出，你需要给它们最佳输入。

创建优秀的上下文意味着：

- 你给模型的提示和指令
- 你检索的任何文档或外部数据（例如RAG）
- 任何过去的状态、工具调用、结果或其他历史记录
- 来自相关但独立历史记录/对话的任何过去消息或事件（记忆）
- 关于要输出什么样的结构化数据的指令

![image](https://github.com/user-attachments/assets/0f1f193f-8e94-4044-a276-576bd7764fd0)


### 关于上下文工程

本指南的重点是从当今的模型中获得尽可能多的价值。特别需要说明的是，以下内容没有涉及：

- 更改模型参数，如temperature、top_p、frequency_penalty、presence_penalty等
- 训练你自己的补全或嵌入模型
- 微调现有模型

再次强调，我不知道向LLM传递上下文的最佳方式是什么，但我知道你希望有足够的灵活性来尝试一切。

#### 标准vs自定义上下文格式

大多数LLM客户端使用基于标准消息的格式，如下所示：

```yaml
[
  {
    "role": "system",
    "content": "You are a helpful assistant..."
  },
  {
    "role": "user",
    "content": "Can you deploy the backend?"
  },
  {
    "role": "assistant",
    "content": null,
    "tool_calls": [
      {
        "id": "1",
        "name": "list_git_tags",
        "arguments": "{}"
      }
    ]
  },
  {
    "role": "tool",
    "name": "list_git_tags",
    "content": "{\"tags\": [{\"name\": \"v1.2.3\", \"commit\": \"abc123\", \"date\": \"2024-03-15T10:00:00Z\"}, {\"name\": \"v1.2.2\", \"commit\": \"def456\", \"date\": \"2024-03-14T15:30:00Z\"}, {\"name\": \"v1.2.1\", \"commit\": \"abe033d\", \"date\": \"2024-03-13T09:15:00Z\"}]}",
    "tool_call_id": "1"
  }
]
```

虽然这对大多数用例都很有效，但如果你想真正从当今的LLM中获得最大价值，你需要以最高效的token和注意力方式将上下文传递给LLM。

作为标准基于消息格式的替代方案，你可以构建针对你的用例优化的自定义上下文格式。例如，你可以使用自定义对象并将它们打包/展开到一个或多个用户、系统、助手或工具消息中。

这是一个将整个上下文窗口放入单个用户消息的例子：
```yaml

[
  {
    "role": "system",
    "content": "You are a helpful assistant..."
  },
  {
    "role": "user",
    "content": |
            Here's everything that happened so far:
        
        <slack_message>
            From: @alex
            Channel: #deployments
            Text: Can you deploy the backend?
        </slack_message>
        
        <list_git_tags>
            intent: "list_git_tags"
        </list_git_tags>
        
        <list_git_tags_result>
            tags:
              - name: "v1.2.3"
                commit: "abc123"
                date: "2024-03-15T10:00:00Z"
              - name: "v1.2.2"
                commit: "def456"
                date: "2024-03-14T15:30:00Z"
              - name: "v1.2.1"
                commit: "ghi789"
                date: "2024-03-13T09:15:00Z"
        </list_git_tags_result>
        
        what's the next step?
    }
]
```

模型可能会通过你提供的工具模式推断出你在问它`下一步是什么`，但将其融入你的提示模板中永远不会有害。

### 代码示例

我们可以用类似这样的方式构建：

```python

class Thread:
  events: List[Event]

class Event:
  # could just use string, or could be explicit - up to you
  type: Literal["list_git_tags", "deploy_backend", "deploy_frontend", "request_more_information", "done_for_now", "list_git_tags_result", "deploy_backend_result", "deploy_frontend_result", "request_more_information_result", "done_for_now_result", "error"]
  data: ListGitTags | DeployBackend | DeployFrontend | RequestMoreInformation |  
        ListGitTagsResult | DeployBackendResult | DeployFrontendResult | RequestMoreInformationResult | string

def event_to_prompt(event: Event) -> str:
    data = event.data if isinstance(event.data, str) \
           else stringifyToYaml(event.data)

    return f"<{event.type}>\n{data}\n</{event.type}>"


def thread_to_prompt(thread: Thread) -> str:
  return '\n\n'.join(event_to_prompt(event) for event in thread.events)
```

#### 上下文窗口示例

使用这种方法，上下文窗口可能如下所示：

**初始Slack请求：**
```xml
<slack_message>
    From: @alex
    Channel: #deployments
    Text: Can you deploy the latest backend to production?
</slack_message>
```

**列出Git标签后：**
```xml
<slack_message>
    From: @alex
    Channel: #deployments
    Text: Can you deploy the latest backend to production?
    Thread: []
</slack_message>

<list_git_tags>
    intent: "list_git_tags"
</list_git_tags>

<list_git_tags_result>
    tags:
      - name: "v1.2.3"
        commit: "abc123"
        date: "2024-03-15T10:00:00Z"
      - name: "v1.2.2"
        commit: "def456"
        date: "2024-03-14T15:30:00Z"
      - name: "v1.2.1"
        commit: "ghi789"
        date: "2024-03-13T09:15:00Z"
</list_git_tags_result>
```

**错误和恢复后：**
```xml
<slack_message>
    From: @alex
    Channel: #deployments
    Text: Can you deploy the latest backend to production?
    Thread: []
</slack_message>

<deploy_backend>
    intent: "deploy_backend"
    tag: "v1.2.3"
    environment: "production"
</deploy_backend>

<error>
    error running deploy_backend: Failed to connect to deployment service
</error>

<request_more_information>
    intent: "request_more_information_from_human"
    question: "I had trouble connecting to the deployment service, can you provide more details and/or check on the status of the service?"
</request_more_information>

<human_response>
    data:
      response: "I'm not sure what's going on, can you check on the status of the latest workflow?"
</human_response>
```

从这里你的下一步可能是：

```python
nextStep = await determine_next_step(thread_to_prompt(thread))
```

```python
{
  "intent": "get_workflow_status",
  "workflow_name": "tag_push_prod.yaml",
}
```

XML样式格式只是一个例子——重点是你可以构建适合你应用程序的自定义格式。如果你有灵活性来尝试不同的上下文结构以及存储什么vs传递什么给LLM，你会获得更好的质量。

掌控上下文窗口的关键好处：

1. **信息密度**：以最大化LLM理解的方式结构化信息
2. **错误处理**：以帮助LLM恢复的格式包含错误信息。考虑在错误和失败的调用被解决后从上下文窗口中隐藏它们。
3. **安全性**：控制传递给LLM的信息，过滤敏感数据
4. **灵活性**：在了解最适合你用例的内容时调整格式
5. **Token效率**：优化上下文格式以提高token效率和LLM理解

上下文包括：提示、指令、RAG文档、历史记录、工具调用、记忆


记住：上下文窗口是你与LLM的主要接口。控制如何结构化和呈现信息可以显著提高你的智能体性能。

示例 - 信息密度 - 相同消息，更少的token：

![Loom Screenshot 2025-04-22 at 09 00 56](https://github.com/user-attachments/assets/5cf041c6-72da-4943-be8a-99c73162b12a)


### 不要只听我的话

在12-factor agents发布约2个月后，上下文工程开始成为一个相当流行的术语。

<a href="https://x.com/karpathy/status/1937902205765607626"><img width="378" alt="Screenshot 2025-06-25 at 4 11 45 PM" src="https://github.com/user-attachments/assets/97e6e667-c35f-4855-8233-af40f05d6bce" /></a> <a href="https://x.com/tobi/status/1935533422589399127"><img width="378" alt="Screenshot 2025-06-25 at 4 12 59 PM" src="https://github.com/user-attachments/assets/7e6f5738-0d38-4910-82d1-7f5785b82b99" /></a>

还有一个来自[@lenadroid](https://x.com/lenadroid)的2025年7月的非常好的[上下文工程速查表](https://x.com/lenadroid/status/1943685060785524824)。

<a href="https://x.com/lenadroid/status/1943685060785524824"><img width="256" alt="image" src="https://github.com/user-attachments/assets/cac88aa3-8faf-440b-9736-cab95a9de477" /></a>



这里的反复主题是：我不知道什么是最佳方法，但我知道你希望有足够的灵活性来尝试一切。


[← 掌控你的提示](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-02-own-your-prompts.md) | [工具是结构化输出 →](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-04-tools-are-structured-outputs.md)