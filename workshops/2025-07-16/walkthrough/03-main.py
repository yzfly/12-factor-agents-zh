def main(message="hello from the notebook!"):
    # Create a new thread with the user's message
    thread = Thread([{"type": "user_input", "data": message}])
    
    # Run the agent loop with full tool handling
    result = agent_loop(thread)
    
    # Print the final response
    print(f"\nFinal response: {result}")