# BAML Logging in Jupyter Notebooks

## Overview

BAML uses the `BAML_LOG` environment variable to control logging output. However, in Jupyter notebooks, these logs are sent to stderr and aren't automatically captured in the cell output. This guide explains how to capture and display BAML logs in Jupyter notebooks.

## The Problem

When you set `os.environ["BAML_LOG"] = "info"` and run BAML functions in a Jupyter notebook, the logs are written to stderr but don't appear in the notebook cell output. This is because:

1. BAML logs to stderr at the system level
2. Jupyter notebooks don't automatically capture subprocess stderr
3. The logs bypass Python's standard logging module

## The Solution

The solution is to use IPython's `capture_output` context manager to capture both stdout and stderr when running BAML functions.

### Basic Usage

```python
from IPython.utils.capture import capture_output
import os

# Set BAML logging level
os.environ['BAML_LOG'] = 'info'

# Helper function to run code with BAML log capture
def run_with_baml_logs(func, *args, **kwargs):
    """Run a function and display BAML logs in the notebook."""
    with capture_output() as captured:
        result = func(*args, **kwargs)
    
    # Display the result
    if result is not None:
        print("=== Result ===")
        print(result)
    
    # Display BAML logs from stderr
    if captured.stderr:
        print("\n=== BAML Logs ===")
        print(captured.stderr)
    
    return result

# Use it like this:
run_with_baml_logs(main, "can you multiply 3 and 4")
```

## BAML Log Levels

Set `BAML_LOG` to one of these levels:

- `error`: Fatal errors only
- `warn`: Function failures (default)
- `info`: All function calls, prompts, and responses
- `debug`: Includes detailed parsing errors
- `trace`: Most comprehensive logging
- `off`: No logging

## Enhanced Reasoning Visualization

For sections that use reasoning prompts, you can extract and highlight the reasoning steps:

```python
import re
from IPython.display import display, HTML

def run_and_show_reasoning(func, *args, **kwargs):
    """Run a function and highlight reasoning steps."""
    with capture_output() as captured:
        result = func(*args, **kwargs)
    
    if captured.stderr:
        # Extract reasoning blocks
        reasoning_pattern = r'<reasoning>(.*?)</reasoning>'
        reasoning_matches = re.findall(reasoning_pattern, captured.stderr, re.DOTALL)
        
        if reasoning_matches:
            display(HTML("<h3>🧠 Model Reasoning:</h3>"))
            for reasoning in reasoning_matches:
                display(HTML(f'''
                <div style='background-color: #f0f8ff; 
                            border-left: 4px solid #4169e1; 
                            padding: 10px; margin: 10px 0;'>
                    {reasoning.strip().replace(chr(10), '<br>')}
                </div>
                '''))
    
    return result
```

## Implementation in Notebook Generator

The updated `walkthroughgen_py.py` automatically includes:

1. A logging helper cell after BAML setup
2. Automatic wrapping of `main()` calls with `run_with_baml_logs()`
3. Enhanced reasoning visualization for the reasoning chapter
4. Proper handling of different log levels with icons

## What You'll See

With logging enabled, you'll see:

- **Prompt sent to the model**: The full prompt including system and user messages
- **Raw model response**: The complete response from the LLM
- **Parsed output**: How BAML parsed the response into structured data
- **Reasoning steps**: If using reasoning prompts, the model's thought process
- **Timing information**: How long each call took
- **Token usage**: Number of tokens used (if available)

## Troubleshooting

If logs aren't appearing:

1. Verify `BAML_LOG` is set: `print(os.environ.get('BAML_LOG'))`
2. Ensure you're using the capture wrapper functions
3. Check that BAML is properly initialized
4. Try setting `BAML_LOG='debug'` for more verbose output

## Environment Variables

- `BAML_LOG`: Controls logging level (info, debug, trace, etc.)
- `BOUNDARY_MAX_LOG_CHUNK_CHARS`: Truncate log entries (e.g., 3000)

## Notes

- Logs are captured per cell execution
- Full logs can be quite verbose - start with 'info' level
- The reasoning visualization works best with prompts that include `<reasoning>` tags
- In Google Colab, the capture functions work the same way as local Jupyter