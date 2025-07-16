def get_human_input(prompt):
    """Get input from human, handling both Colab and local environments."""
    print(f"\n🤔 {prompt}")
    
    if IN_COLAB:
        # In Colab, use actual input
        response = input("Your response: ")
    else:
        # In local testing, return a fixed response
        response = "I meant to multiply 3 and 4"
        print(f"📝 [Auto-response for testing]: {response}")
    
    return response

def main(message="hello from the notebook!"):
    # Function to handle clarification requests
    def handle_clarification(question):
        return get_human_input(f"The agent needs clarification: {question}")
    
    # Create a new thread with the user's message
    thread = Thread([{"type": "user_input", "data": message}])
    
    print(f"🚀 Starting agent with message: '{message}'")
    
    # Run the agent loop
    result = agent_loop(thread, handle_clarification)
    
    # Print the final response
    print(f"\n✅ Final response: {result}")