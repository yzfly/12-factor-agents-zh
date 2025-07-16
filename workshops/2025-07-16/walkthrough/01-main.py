def main(message="hello from the notebook!"):
    # Create a new thread with the user's message as the initial event
    thread = Thread([{"type": "user_input", "data": message}])
    
    # Run the agent loop with the thread
    result = agent_loop(thread)
    print(result)