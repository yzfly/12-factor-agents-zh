import json
from typing import Dict, Any, List

# tool call or a respond to human tool
AgentResponse = Any  # This will be the return type from b.DetermineNextStep

class Event:
    def __init__(self, type: str, data: Any):
        self.type = type
        self.data = data

class Thread:
    def __init__(self, events: List[Dict[str, Any]]):
        self.events = events
    
    def serialize_for_llm(self):
        # can change this to whatever custom serialization you want to do, XML, etc
        # e.g. https://github.com/got-agents/agents/blob/59ebbfa236fc376618f16ee08eb0f3bf7b698892/linear-assistant-ts/src/agent.ts#L66-L105
        return json.dumps(self.events)

# right now this just runs one turn with the LLM, but
# we'll update this function to handle all the agent logic
def agent_loop(thread: Thread) -> AgentResponse:
    b = get_baml_client()  # This will be defined by the BAML setup
    next_step = b.DetermineNextStep(thread.serialize_for_llm())
    return next_step