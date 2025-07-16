def main(message="hello from the notebook!"):
    # Create a new thread with the user's message
    thread = Thread([{"type": "user_input", "data": message}])
    
    # Get BAML client
    b = get_baml_client()
    
    # Get the next step from the agent - just show the tool call
    next_step = b.DetermineNextStep(thread.serialize_for_llm())
    
    # Print the raw response to show the tool call
    print(next_step)