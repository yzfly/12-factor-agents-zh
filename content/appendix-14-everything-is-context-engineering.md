
## Closing thoughts - everything is context engineering
Everything is context engineering. LLMs are stateless functions that turn inputs into outputs. To get the best outputs, you need to give them the best inputs.

Creating great context means:

- The prompt and instructions you give to the model
- Any documents or external data you retrieve (e.g. RAG)
- Any past state, tool calls, results, or other history 
- Any past messages or events from related but separate histories/conversations (Memory)
- Instructions about what sorts of structured data to output


![220-context-engineering](https://github.com/humanlayer/12-factor-agents/blob/main/img/220-context-engineering.png)

This guide is all about getting as much as possible out of today's models. Notably not mentioned are 

- changes to models parameters like temperature, top_p, frequency_penalty, presence_penalty, etc.
- training your own completion or embedding models
- Fine-tuning existing models
- All kinds of other tricks probably