"""
Snippet to add to notebooks for capturing BAML logs.

Add this code cell after the BAML setup cells in the notebook:
"""

notebook_logging_cell = '''# Enable BAML logging capture in Jupyter
import os
import sys
from IPython.utils.capture import capture_output

# Set BAML logging level
os.environ['BAML_LOG'] = 'info'

# Helper function to run code with BAML log capture
def run_with_baml_logs(func, *args, **kwargs):
    """Run a function and display BAML logs in the notebook."""
    print(f"Running with BAML_LOG={os.environ.get('BAML_LOG')}...")
    
    # Capture all output
    with capture_output() as captured:
        result = func(*args, **kwargs)
    
    # Display the result first
    if result is not None:
        print("=== Result ===")
        print(result)
    
    # Display captured stdout
    if captured.stdout:
        print("\\n=== Output ===")
        print(captured.stdout)
    
    # Display BAML logs from stderr
    if captured.stderr:
        print("\\n=== BAML Logs ===")
        # Format the logs for better readability
        log_lines = captured.stderr.strip().split('\\n')
        for line in log_lines:
            if 'reasoning' in line.lower() or '<reasoning>' in line:
                print(f"🤔 {line}")
            elif 'error' in line.lower():
                print(f"❌ {line}")
            elif 'warn' in line.lower():
                print(f"⚠️  {line}")
            else:
                print(f"   {line}")
    
    return result

# Alternative: Monkey-patch the main function to always capture logs
def with_baml_logging(original_func):
    """Decorator to add BAML logging to any function."""
    def wrapper(*args, **kwargs):
        return run_with_baml_logs(original_func, *args, **kwargs)
    return wrapper

print("BAML logging helper functions loaded! Use run_with_baml_logs(main, 'your message') to see logs.")
'''

# For section 6 (reasoning), add this special cell
reasoning_logging_cell = '''# Special logging setup for reasoning visualization
import os
import re
from IPython.utils.capture import capture_output
from IPython.display import display, HTML

os.environ['BAML_LOG'] = 'info'

def run_and_show_reasoning(func, *args, **kwargs):
    """Run a function and highlight the reasoning steps from BAML logs."""
    with capture_output() as captured:
        result = func(*args, **kwargs)
    
    # Extract and format reasoning from logs
    if captured.stderr:
        # Look for reasoning sections
        log_text = captured.stderr
        
        # Find reasoning blocks
        reasoning_pattern = r'<reasoning>(.*?)</reasoning>'
        reasoning_matches = re.findall(reasoning_pattern, log_text, re.DOTALL)
        
        if reasoning_matches:
            display(HTML("<h3>🧠 Model Reasoning:</h3>"))
            for reasoning in reasoning_matches:
                display(HTML(f"""
                <div style='background-color: #f0f8ff; border-left: 4px solid #4169e1; 
                            padding: 10px; margin: 10px 0; font-family: monospace;'>
                    {reasoning.strip().replace('\\n', '<br>')}
                </div>
                """))
        
        # Show the full response
        display(HTML("<h3>📤 Response:</h3>"))
        display(HTML(f"<pre>{str(result)}</pre>"))
        
        # Optionally show full logs
        if os.environ.get('SHOW_FULL_LOGS', 'false').lower() == 'true':
            display(HTML("<details><summary>View Full BAML Logs</summary><pre style='font-size: 0.8em;'>" + 
                        log_text + "</pre></details>"))
    
    return result

print("Enhanced reasoning visualization loaded! Use run_and_show_reasoning(main, 'your message') to see reasoning steps.")
'''

print("Notebook logging snippets created. Add these to the notebook generator.")
print("\nUsage in notebook:")
print("1. Add notebook_logging_cell after BAML setup")
print("2. Use: run_with_baml_logs(main, 'can you multiply 3 and 4')")
print("3. For reasoning section, use reasoning_logging_cell")