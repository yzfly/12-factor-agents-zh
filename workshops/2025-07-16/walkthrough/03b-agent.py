import json
from typing import Dict, Any, List, Union

class Thread:
    def __init__(self, events: List[Dict[str, Any]]):
        self.events = events
    
    def serialize_for_llm(self):
        # can change this to whatever custom serialization you want to do, XML, etc
        # e.g. https://github.com/got-agents/agents/blob/59ebbfa236fc376618f16ee08eb0f3bf7b698892/linear-assistant-ts/src/agent.ts#L66-L105
        return json.dumps(self.events)

def handle_next_step(next_step, thread: Thread) -> Thread:
    result: float
    
    if next_step.intent == "add":
        result = next_step.a + next_step.b
        print("tool_response", result)
        thread.events.append({
            "type": "tool_response",
            "data": result
        })
        return thread
    elif next_step.intent == "subtract":
        result = next_step.a - next_step.b
        print("tool_response", result)
        thread.events.append({
            "type": "tool_response",
            "data": result
        })
        return thread
    elif next_step.intent == "multiply":
        result = next_step.a * next_step.b
        print("tool_response", result)
        thread.events.append({
            "type": "tool_response",
            "data": result
        })
        return thread
    elif next_step.intent == "divide":
        result = next_step.a / next_step.b
        print("tool_response", result)
        thread.events.append({
            "type": "tool_response",
            "data": result
        })
        return thread

def agent_loop(thread: Thread) -> str:
    b = get_baml_client()
    
    while True:
        next_step = b.DetermineNextStep(thread.serialize_for_llm())
        print("nextStep", next_step)
        
        thread.events.append({
            "type": "tool_call",
            "data": next_step.__dict__
        })
        
        if next_step.intent == "done_for_now":
            # response to human, return the next step object
            return next_step.message
        elif next_step.intent in ["add", "subtract", "multiply", "divide"]:
            thread = handle_next_step(next_step, thread)