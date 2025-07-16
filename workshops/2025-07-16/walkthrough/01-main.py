import sys

def main():
    # Set default args if none provided
    if len(sys.argv) < 2:
        sys.argv = ["notebook", "hello from the notebook!"]
    
    # Get command line arguments, skipping the first one (script name)
    args = sys.argv[1:]
    
    if len(args) == 0:
        print("Error: Please provide a message as a command line argument", file=sys.stderr)
        return
    
    # Join all arguments into a single message
    message = " ".join(args)
    
    # Create a new thread with the user's message as the initial event
    thread = Thread([{"type": "user_input", "data": message}])
    
    # Run the agent loop with the thread
    result = agent_loop(thread)
    print(result)