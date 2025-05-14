[← Back to README](https://github.com/humanlayer/12-factor-agents/blob/main/README.md)

### 5. Unify execution state and business state

Even outside the AI world, many infrastructure systems try to separate "execution state" from "business state". For AI apps, this might involve complex abstractions to track things like current step, next step, waiting status, retry counts, etc. This separation creates complexity that may be worthwhile, but may be overkill for your use case. 

As always, it's up to you to decide what's right for your application. But don't think you *have* to manage them separately.

More clearly:

- **Execution state**: current step, next step, waiting status, retry counts, etc. 
- **Business state**: What's happened in the agent workflow so far (e.g. list of OpenAI messages, list of tool calls and results, etc.)

If possible, SIMPLIFY - unify these as much as possible. 

[![155-unify-state](https://github.com/humanlayer/12-factor-agents/blob/main/img/155-unify-state-animation.gif)](https://github.com/user-attachments/assets/e5a851db-f58f-43d8-8b0c-1926c99fc68d)


<details>
<summary><a href="https://github.com/humanlayer/12-factor-agents/blob/main/img/155-unify-state-animation.gif">GIF Version</a></summary>

![155-unify-state](https://github.com/humanlayer/12-factor-agents/blob/main/img/155-unify-state-animation.gif)]

</details>

In reality, you can engineer your application so that you can infer all execution state from the context window. In many cases, execution state (current step, waiting status, etc.) is just metadata about what has happened so far.

You may have things that can't go in the context window, like session ids, password contexts, etc, but your goal should be to minimize those things. By embracing [factor 3](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-03-own-your-context-window.md) you can control what actually goes into the LLM 

This approach has several benefits:

1. **Simplicity**: One source of truth for all state
2. **Serialization**: The thread is trivially serializable/deserializable
3. **Debugging**: The entire history is visible in one place
4. **Flexibility**: Easy to add new state by just adding new event types
5. **Recovery**: Can resume from any point by just loading the thread
6. **Forking**: Can fork the thread at any point by copying some subset of the thread into a new context / state ID
7. **Human Interfaces and Observability**: Trivial to convert a thread into a human-readable markdown or a rich Web app UI

[← Tools Are Structured Outputs](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-04-tools-are-structured-outputs.md) | [Launch/Pause/Resume →](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-06-launch-pause-resume.md)
