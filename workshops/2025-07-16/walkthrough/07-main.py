def main(message="hello from the notebook!", use_xml=True):
    # Function to handle clarification requests
    def handle_clarification(question):
        return get_human_input(f"The agent needs clarification: {question}")
    
    # Create a new thread with the user's message
    thread = Thread([{"type": "user_input", "data": message}])
    
    print(f"🚀 Starting agent with message: '{message}'")
    print(f"📋 Using {'XML' if use_xml else 'JSON'} format for thread serialization")
    
    # Run the agent loop with XML serialization
    result = agent_loop(thread, handle_clarification, use_xml=use_xml)
    
    # Print the final response
    print(f"\n✅ Final response: {result}")