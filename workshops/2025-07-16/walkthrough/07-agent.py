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
        import yaml
        xml_parts = ["<thread>"]
        
        for event in self.events:
            event_type = event['type']
            event_data = event['data']
            
            if event_type == 'user_input':
                xml_parts.append(f'  <user_input>{event_data}</user_input>')
            elif event_type == 'tool_call':
                # Use YAML for tool call args - more compact than nested XML
                yaml_content = yaml.dump(event_data, default_flow_style=False).strip()
                xml_parts.append(f'  <{event_data["tool"]}>')
                xml_parts.append('    ' + '\n    '.join(yaml_content.split('\n')))
                xml_parts.append(f'  </{event_data["tool"]}>')
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