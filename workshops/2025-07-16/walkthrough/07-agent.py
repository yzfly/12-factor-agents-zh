# Agent with configurable serialization formats
import json

class Thread:
    """Thread that can serialize to different formats."""
    def __init__(self, events):
        self.events = events
    
    def serialize_as_json(self):
        """Serialize thread events to pretty-printed JSON."""
        return json.dumps(self.events, indent=2)
    
    def serialize_as_xml(self):
        """Serialize thread events to XML format for better token efficiency."""
        xml_parts = ["<thread>"]
        
        for event in self.events:
            event_type = event['type']
            event_data = event['data']
            
            if event_type == 'user_input':
                xml_parts.append(f'  <user_input>{event_data}</user_input>')
            elif event_type == 'tool_call':
                xml_parts.append(f'  <tool_call>')
                xml_parts.append(f'    <tool>{event_data["tool"]}</tool>')
                xml_parts.append(f'    <operation>{event_data["operation"]}</operation>')
                xml_parts.append(f'    <result>{event_data["result"]}</result>')
                xml_parts.append(f'  </tool_call>')
            elif event_type == 'clarification_request':
                xml_parts.append(f'  <clarification_request>{event_data}</clarification_request>')
            elif event_type == 'clarification_response':
                xml_parts.append(f'  <clarification_response>{event_data}</clarification_response>')
        
        xml_parts.append("</thread>")
        return "\n".join(xml_parts)

def agent_loop(thread, clarification_handler, use_xml=True):
    """Run the agent loop with configurable serialization."""
    while True:
        # Get the client
        baml_client = get_baml_client()
        
        # Serialize the thread based on format preference
        if use_xml:
            thread_str = thread.serialize_as_xml()
            print(f"📄 Using XML serialization ({len(thread_str)} chars)")
        else:
            thread_str = thread.serialize_as_json()
            print(f"📄 Using JSON serialization ({len(thread_str)} chars)")
        
        # Call the agent
        result = baml_client.DetermineNextStep(thread_str)
        
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