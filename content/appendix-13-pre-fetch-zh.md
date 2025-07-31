### 因子13 - 预取所有你可能需要的上下文

如果你的模型很有可能调用工具X，不要浪费token往返让模型去获取它，也就是说，与其使用像这样的伪提示：

```jinja
When looking at deployments, you will likely want to fetch the list of published git tags,
so you can use it to deploy to prod.

Here's what happened so far:

{{ thread.events }}

What's the next step?

Answer in JSON format with one of the following intents:

{
  intent: 'deploy_backend_to_prod',
  tag: string
} OR {
  intent: 'list_git_tags'
} OR {
  intent: 'done_for_now',
  message: string
}
```

你的代码看起来像

```python
thread = {"events": [initial_message]}
next_step = await determine_next_step(thread)

while True:
  switch next_step.intent:
    case 'list_git_tags':
      tags = await fetch_git_tags()
      thread["events"].append({
        type: 'list_git_tags',
        data: tags,
      })
    case 'deploy_backend_to_prod':
      deploy_result = await deploy_backend_to_prod(next_step.data.tag)
      thread["events"].append({
        "type": 'deploy_backend_to_prod',
        "data": deploy_result,
      })
    case 'done_for_now':
      await notify_human(next_step.message)
      break
    # ...
```

你不如直接获取标签并将它们包含在上下文窗口中，像这样：

```diff
- When looking at deployments, you will likely want to fetch the list of published git tags,
- so you can use it to deploy to prod.

+ The current git tags are:

+ {{ git_tags }}


Here's what happened so far:

{{ thread.events }}

What's the next step?

Answer in JSON format with one of the following intents:

{
  intent: 'deploy_backend_to_prod',
  tag: string
- } OR {
-   intent: 'list_git_tags'
} OR {
  intent: 'done_for_now',
  message: string
}

```

你的代码看起来像

```diff
thread = {"events": [initial_message]}
+ git_tags = await fetch_git_tags()

- next_step = await determine_next_step(thread)
+ next_step = await determine_next_step(thread, git_tags)

while True:
  switch next_step.intent:
-    case 'list_git_tags':
-      tags = await fetch_git_tags()
-      thread["events"].append({
-        type: 'list_git_tags',
-        data: tags,
-      })
    case 'deploy_backend_to_prod':
      deploy_result = await deploy_backend_to_prod(next_step.data.tag)
      thread["events"].append({
        "type": 'deploy_backend_to_prod',
        "data": deploy_result,
      })
    case 'done_for_now':
      await notify_human(next_step.message)
      break
    # ...
```

或者甚至只是将标签包含在线程中，并从提示模板中删除特定参数：

```diff
thread = {"events": [initial_message]}
+ # add the request
+ thread["events"].append({
+  "type": 'list_git_tags',
+ })

git_tags = await fetch_git_tags()

+ # add the result
+ thread["events"].append({
+  "type": 'list_git_tags_result',
+  "data": git_tags,
+ })

- next_step = await determine_next_step(thread, git_tags)
+ next_step = await determine_next_step(thread)

while True:
  switch next_step.intent:
    case 'deploy_backend_to_prod':
      deploy_result = await deploy_backend_to_prod(next_step.data.tag)
      thread["events"].append(deploy_result)
    case 'done_for_now':
      await notify_human(next_step.message)
      break
    # ...
```

总的来说：

> #### 如果你已经知道你希望模型调用什么工具，就确定性地调用它们，让模型做找出如何使用它们输出的困难部分

再次强调，AI工程完全是关于[上下文工程](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-03-own-your-context-window.md)。

[← 无状态归约器](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-12-stateless-reducer.md) | [延伸阅读 →](https://github.com/humanlayer/12-factor-agents/blob/main/README.md#related-resources)