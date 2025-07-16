# Agent implementation with clarification support
import json

def agent_loop(thread, clarification_handler):
    """Run the agent loop until we get a final answer."""
    while True:
        # Get the client
        baml_client = get_baml_client()
        
        # Serialize the thread
        thread_json = json.dumps(thread.events, indent=2)
        
        # Call the agent
        result = baml_client.DetermineNextStep(thread_json)
        
        # Check what type of result we got
        if result.done_for_now:
            return result.done_for_now.message
        elif result.clarification_request:
            # Get clarification from the human
            clarification = clarification_handler(result.clarification_request.question)
            
            # Add the clarification to the thread
            thread.events.append({
                "type": "clarification_request",
                "data": result.clarification_request.question
            })
            thread.events.append({
                "type": "clarification_response",
                "data": clarification
            })
            
            # Continue the loop with the clarification
        elif result.calculator_tool:
            # Extract tool details
            tool = result.calculator_tool
            
            # Execute the appropriate tool
            if hasattr(tool, 'add') and tool.add:
                result_value = tool.add.a + tool.add.b
                operation = f"add({tool.add.a}, {tool.add.b})"
            elif hasattr(tool, 'subtract') and tool.subtract:
                result_value = tool.subtract.a - tool.subtract.b
                operation = f"subtract({tool.subtract.a}, {tool.subtract.b})"
            elif hasattr(tool, 'multiply') and tool.multiply:
                result_value = tool.multiply.a * tool.multiply.b
                operation = f"multiply({tool.multiply.a}, {tool.multiply.b})"
            elif hasattr(tool, 'divide') and tool.divide:
                if tool.divide.b == 0:
                    result_value = "Error: Division by zero"
                else:
                    result_value = tool.divide.a / tool.divide.b
                operation = f"divide({tool.divide.a}, {tool.divide.b})"
            else:
                result_value = "Error: Unknown tool"
                operation = "unknown"
            
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

class Thread:
    """Simple thread to track conversation history."""
    def __init__(self, events):
        self.events = events