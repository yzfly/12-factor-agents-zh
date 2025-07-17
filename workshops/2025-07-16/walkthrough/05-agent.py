# Agent implementation with clarification support
import json

def agent_loop(thread, clarification_handler, max_iterations=3):
    """Run the agent loop until we get a final answer (max 3 iterations)."""
    iteration_count = 0
    while iteration_count < max_iterations:
        iteration_count += 1
        print(f"🔄 Agent loop iteration {iteration_count}/{max_iterations}")
        
        # Get the client
        baml_client = get_baml_client()
        
        # Serialize the thread
        thread_json = json.dumps(thread.events, indent=2)
        
        # Call the agent
        result = baml_client.DetermineNextStep(thread_json)
        
        # Check what type of result we got based on intent
        if hasattr(result, 'intent'):
            if result.intent == 'done_for_now':
                return result.message
            elif result.intent == 'request_more_information':
                # Get clarification from the human
                clarification = clarification_handler(result.message)
                
                # Add the clarification to the thread
                thread.events.append({
                    "type": "clarification_request",
                    "data": result.message
                })
                thread.events.append({
                    "type": "clarification_response",
                    "data": clarification
                })
                
                # Continue the loop with the clarification
            elif result.intent in ['add', 'subtract', 'multiply', 'divide']:
                # Execute the appropriate tool based on intent
                if result.intent == 'add':
                    result_value = result.a + result.b
                    operation = f"add({result.a}, {result.b})"
                elif result.intent == 'subtract':
                    result_value = result.a - result.b
                    operation = f"subtract({result.a}, {result.b})"
                elif result.intent == 'multiply':
                    result_value = result.a * result.b
                    operation = f"multiply({result.a}, {result.b})"
                elif result.intent == 'divide':
                    if result.b == 0:
                        result_value = "Error: Division by zero"
                    else:
                        result_value = result.a / result.b
                    operation = f"divide({result.a}, {result.b})"
                
                print(f"🔧 Calling tool: {operation} = {result_value}")
                
                # Add the tool call and result to the thread
                thread.events.append({
                    "type": "tool_call",
                    "data": {
                        "tool": "calculator",
                        "operation": operation,
                        "result": result_value
                    }
                })
        else:
            return "Error: Unexpected result type"
    
    # If we've reached max iterations without a final answer
    return f"Agent reached maximum iterations ({max_iterations}) without completing the task."

class Thread:
    """Simple thread to track conversation history."""
    def __init__(self, events):
        self.events = events