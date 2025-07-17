# Jupyter Notebook Testing Framework

This document describes the general testing framework for validating any functionality in Jupyter notebooks, with a specific example of testing BAML log capture.

## General Framework

### Overview

The testing framework provides a complete iteration loop for testing notebook implementations:

1. **Generate** test notebooks with specific functionality 
2. **Execute** notebooks in a simulated Google Colab environment  
3. **Analyze** executed notebooks for expected outputs and behaviors
4. **Report** clear pass/fail results

### Core Components

#### Notebook Simulator (`test_notebook_colab_sim.sh`)

The simulation script creates a realistic Google Colab environment for any notebook:

**Environment Setup:**
- Creates timestamped test directory: `./tmp/test_YYYYMMDD_HHMMSS/`
- Sets up fresh Python virtual environment
- Installs Jupyter dependencies (`notebook`, `nbconvert`, `ipykernel`)

**Notebook Execution:**
- Copies test notebook to clean environment
- Uses `ExecutePreprocessor` to run all cells (simulates Colab execution)
- **Critical:** Activates virtual environment before execution
- **Critical:** Saves executed notebook with cell outputs back to disk

**Usage:**
```bash
./test_notebook_colab_sim.sh your_notebook.ipynb
```

The simulator will:
- Execute all cells in the notebook
- Preserve the test directory for inspection
- Show final directory structure
- Report success/failure

#### Output Inspector (`inspect_notebook.py`)

Debug utility for examining notebook cell outputs in detail:

**Features:**
- Shows cell source code and execution counts  
- Displays all output types (stream, execute_result, error)
- Highlights patterns in output text
- Shows execution errors with tracebacks
- Filters cells by keywords for focused debugging

**Usage:**
```bash
# Inspect all cells
python3 inspect_notebook.py path/to/notebook.ipynb

# Filter for specific content
python3 inspect_notebook.py path/to/notebook.ipynb "keyword"

# Look for errors
python3 inspect_notebook.py path/to/notebook.ipynb "error"
```

**Sample Output:**
```
🔍 CELL 0 (code)
📝 SOURCE:
import sys
print("Hello!")
print("Error!", file=sys.stderr)

📤 OUTPUTS (2 outputs):
  Output 0: type=stream
    Text length: 7 chars
    > Hello!...
  Output 1: type=stream  
    Text length: 7 chars
    > Error!...
    🎯 Found patterns: ['Error']
```

### Key Insights for Notebook Testing

#### Execution Environment
1. **Virtual environment activation is critical** - Without it, execution fails silently
2. **Output persistence must be explicit** - `ExecutePreprocessor` only modifies notebook in memory
3. **Check execution counts** - `execution_count=None` means cell never executed
4. **Handle different output types** - stream, execute_result, error, display_data

#### Common Debugging Steps
1. **Verify basic execution:**
   ```bash
   python3 -c "
   import json
   nb = json.load(open('path/to/notebook.ipynb'))
   print('Execution counts:', [cell.get('execution_count') for cell in nb['cells'] if cell['cell_type']=='code'])
   "
   ```

2. **Check for execution errors:**
   ```bash
   python3 inspect_notebook.py path/to/notebook.ipynb "error"
   ```

3. **Look for specific output patterns:**
   ```bash
   python3 inspect_notebook.py path/to/notebook.ipynb "your_pattern"
   ```

### Creating Custom Tests

#### 1. Minimal Test Template

Create a simple notebook that tests basic functionality:

```json
{
  "cells": [
    {
      "cell_type": "code",
      "execution_count": null,
      "metadata": {},
      "outputs": [],
      "source": [
        "# Test basic execution\n",
        "print('Hello from notebook!')\n",
        "\n",
        "# Test file creation\n",
        "with open('test.txt', 'w') as f:\n",
        "    f.write('Test successful\\n')\n",
        "\n",
        "# Test error handling\n",
        "try:\n",
        "    result = your_function_to_test()\n",
        "    print(f'Result: {result}')\n",
        "except Exception as e:\n",
        "    print(f'Error: {e}')"
      ]
    }
  ],
  "metadata": {
    "kernelspec": {
      "display_name": "Python 3",
      "language": "python", 
      "name": "python3"
    }
  },
  "nbformat": 4,
  "nbformat_minor": 4
}
```

#### 2. Test Script Template

```bash
#!/bin/bash
set -e

echo "🧪 Testing [Your Feature]..."

# Clean up any previous test
rm -f test_notebook.ipynb

# Generate or copy your test notebook
cp your_test_notebook.ipynb test_notebook.ipynb

# Run in simulator
echo "🚀 Running test in sim..."
./test_notebook_colab_sim.sh test_notebook.ipynb

# Find the executed notebook
NOTEBOOK_DIR=$(ls -1dt tmp/test_* | head -1)
NOTEBOOK_PATH="$NOTEBOOK_DIR/test_notebook.ipynb"

# Analyze results
echo "📋 Analyzing results..."
python3 inspect_notebook.py "$NOTEBOOK_PATH" "your_search_term"

# Add your custom analysis
python3 -c "
import json
with open('$NOTEBOOK_PATH') as f:
    nb = json.load(f)

# Your custom analysis logic here
success = check_for_expected_outputs(nb)

if success:
    print('✅ PASS: Test succeeded!')
else:
    print('❌ FAIL: Test failed!')
    exit(1)
"

echo "🧹 Cleaning up..."
rm -f test_notebook.ipynb
```

---

## Use Case: BAML Log Capture Testing

This section demonstrates how to use the general framework for a specific use case: testing BAML log capture in notebooks.

### Problem Statement

BAML (a language model framework) uses FFI bindings to a Rust binary and outputs logs to stderr. We need to test whether different log capture methods can successfully capture these logs in Jupyter notebook cells.

### Test Implementation

#### Test Configuration (`simple_log_test.yaml`)

```yaml
title: "BAML Log Capture Test"
text: "Simple test for log capture"

sections:
  - title: "Log Capture Test"
    steps:
      - baml_setup: true
      - fetch_file:
          src: "walkthrough/01-agent.baml"
          dest: "baml_src/agent.baml"
      - file:
          src: "./simple_main.py"
      - text: "Testing log capture with show_logs=true:"
      - run_main:
          args: "What is 2+2?"
          show_logs: true
```

#### Test Function (`simple_main.py`)

```python
def main(message="What is 2+2?"):
    """Simple main function that calls BAML directly"""
    client = get_baml_client()
    
    # Call the BAML function - this should generate logs
    result = client.DetermineNextStep(f"User asked: {message}")
    
    print(f"Input: {message}")
    print(f"Result: {result}")
    return result
```

#### Log Capture Implementation

The current working implementation in `walkthroughgen_py.py`:

```python
def run_with_baml_logs(func, *args, **kwargs):
    """Test log capture using IPython capture_output"""
    # Ensure BAML_LOG is set
    if 'BAML_LOG' not in os.environ:
        os.environ['BAML_LOG'] = 'info'
    
    print(f"[LOG CAPTURE TEST] Running with BAML_LOG={os.environ.get('BAML_LOG')}...")
    
    # Capture both stdout and stderr
    with capture_output() as captured:
        result = func(*args, **kwargs)
    
    # Display captured outputs
    if captured.stdout:
        print("=== Captured Stdout ===")
        print(captured.stdout)
    
    if captured.stderr:
        print("=== Captured BAML Logs ===")
        print(captured.stderr)
    else:
        print("=== No BAML Logs Captured ===")
    
    print("=== Function Result ===")
    print(result)
    
    return result
```

### Test Execution

#### Main Test Script (`test_log_capture.sh`)

```bash
#!/bin/bash
set -e

echo "🧪 Testing BAML Log Capture..."

# Generate test notebook from YAML config
echo "📝 Generating test notebook..."
uv run python walkthroughgen_py.py simple_log_test.yaml -o test_capture.ipynb

# Run in simulator  
echo "🚀 Running test in sim..."
./test_notebook_colab_sim.sh test_capture.ipynb

# Find the executed notebook
NOTEBOOK_DIR=$(ls -1dt tmp/test_* | head -1)
NOTEBOOK_PATH="$NOTEBOOK_DIR/test_notebook.ipynb"

echo "📋 Analyzing results from $NOTEBOOK_PATH..."

# Debug output
echo "🔍 Dumping debug info..."
python3 inspect_notebook.py "$NOTEBOOK_PATH" "run_with_baml_logs"

# Analyze for BAML log patterns
echo "📊 Running log capture analysis..."
python3 analyze_log_capture.py "$NOTEBOOK_PATH"

echo "🧹 Cleaning up..."
rm -f test_capture.ipynb
```

#### Analysis Script (`analyze_log_capture.py`)

```python
#!/usr/bin/env python3
import json
import sys
import os

def check_logs(notebook_path):
    """Check if BAML logs were captured in the notebook"""
    
    with open(notebook_path) as f:
        nb = json.load(f)
    
    found_log_pattern = False
    found_capture_test = False
    
    for i, cell in enumerate(nb['cells']):
        if cell['cell_type'] == 'code' and 'outputs' in cell:
            source = ''.join(cell.get('source', []))
            if 'run_with_baml_logs' in source:
                found_capture_test = True
                print(f'Found log capture test in cell {i}')
                
                # Check outputs for BAML logs
                for output in cell['outputs']:
                    if output.get('output_type') == 'stream' and 'text' in output:
                        text = ''.join(output['text'])
                        # Look for the specific BAML log pattern
                        if '---Parsed Response (class DoneForNow)---' in text:
                            found_log_pattern = True
                            print(f'✅ FOUND BAML LOG PATTERN in cell {i} output!')
    
    return found_capture_test, found_log_pattern

# Run analysis and return pass/fail
capture_test_found, log_pattern_found = check_logs(sys.argv[1])

if not capture_test_found:
    print('❌ FAIL: No log capture test found in notebook')
    sys.exit(1)

if log_pattern_found:
    print('✅ PASS: BAML logs successfully captured in notebook output!')
    sys.exit(0)
else:
    print('❌ FAIL: BAML log pattern not found in captured output')
    sys.exit(1)
```

### Expected Output Flow

#### Successful Test Run:
```bash
$ ./test_log_capture.sh

🧪 Testing BAML Log Capture...
📝 Generating test notebook...
Generated notebook: test_capture.ipynb
🚀 Running test in sim...
🧪 Creating clean test environment in: ./tmp/test_20250716_191106
📁 Test directory will be preserved for inspection
🐍 Creating fresh Python virtual environment...
📦 Installing Jupyter dependencies...
🏃 Running notebook in clean environment...
✅ Notebook executed successfully!
💾 Executed notebook saved with outputs

📋 Analyzing results from tmp/test_20250716_191106/test_notebook.ipynb...
🔍 Dumping debug info...
Found log capture test in cell 11

📤 OUTPUTS (3 outputs):
  Output 0: type=stream
    Text length: 49 chars
    > [LOG CAPTURE TEST] Running with BAML_LOG=info......
  Output 1: type=stream
    Text length: 1272 chars
    > 2025-07-16T19:11:22.445 [BAML [92mINFO[0m] [35mFunction DetermineNextStep[0m...
    🎯 Found patterns: ['BAML', 'Parsed', 'Response']

📊 Running log capture analysis...
Found log capture test in cell 11
✅ FOUND BAML LOG PATTERN in cell 11 output!
✅ PASS: BAML logs successfully captured in notebook output!
🧹 Cleaning up...
```

### Key BAML-Specific Insights

1. **BAML logs go to stderr** - Due to FFI bindings to Rust binary
2. **Requires `BAML_LOG=info`** - Environment variable controls verbosity  
3. **Logs include ANSI color codes** - Need to handle terminal formatting
4. **Pattern matching** - Look for `---Parsed Response (class DoneForNow)---` to confirm successful execution
5. **IPython capture_output() works** - Successfully captures stderr in notebook context

### Iteration Loop Benefits

This framework enables rapid testing of different log capture approaches:

1. **Modify** the `run_with_baml_logs` function in `walkthroughgen_py.py`
2. **Run** `./test_log_capture.sh`  
3. **Get** immediate pass/fail feedback
4. **Debug** with `inspect_notebook.py` if needed
5. **Repeat** until working implementation found

This same pattern can be applied to test any notebook functionality: library integrations, environment setup, output formatting, error handling, etc.