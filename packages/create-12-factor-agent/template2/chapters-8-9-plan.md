# Chapter 8 - API Endpoints

## Implementation Steps

1. Add Express dependencies and setup basic server:
```ts
import express from 'express'
const app = express()
app.use(express.json())
```

2. Create endpoints in `src/server.ts`:
```ts
// POST /thread - Start new thread
app.post('/thread', async (req, res) => {
  const thread = new Thread([{
    type: "user_input",
    data: req.body.message
  }])
  const result = await agentLoop(thread)
  res.json(result)
})

// GET /thread/:id - Get thread status
app.get('/thread/:id', (req, res) => {
  // Return thread state
})
```

3. Update agent loop to work with HTTP responses

4. Add example API usage to walkthrough

# Chapter 9 - In-memory State

## Implementation Steps

1. Create ThreadStore class:
```ts
class ThreadStore {
  private threads: Map<string, Thread> = new Map()
  
  create(thread: Thread): string {
    const id = crypto.randomUUID()
    this.threads.set(id, thread)
    return id
  }

  get(id: string): Thread | undefined {
    return this.threads.get(id)
  }
}
```

2. Modify ClarificationRequest to include response URL:
```ts
class ClarificationRequest {
  intent "request_more_information"
  message string
  response_url string
}
```

3. Update server to use ThreadStore:
```ts
const store = new ThreadStore()

app.post('/thread/:id/response', async (req, res) => {
  const thread = store.get(req.params.id)
  thread.events.push({
    type: "human_response",
    data: req.body.message
  })
  const result = await agentLoop(thread)
  res.json(result)
})
```

4. Update agent loop to include response URL in clarification requests

5. Add example async conversation flow to walkthrough

## Testing
- Add API tests using supertest
- Test thread persistence
- Test async clarification flow