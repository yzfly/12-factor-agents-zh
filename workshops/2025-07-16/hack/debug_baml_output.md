# BAML Output Capture in Notebooks - Debug Report

## Summary

The current implementation successfully captures BAML output in notebooks. Based on my investigation, the BAML logs are being captured correctly using the helper functions in `walkthroughgen_py.py`.

## Key Findings

### 1. BAML Logs Output to stderr
- BAML sends all logs (prompts, responses, reasoning) to stderr by default
- The log level is controlled by the `BAML_LOG` environment variable
- Options: error, warn, info, debug, trace

### 2. Current Capture Methods

The workshop notebooks use two primary methods:

#### Method A: IPython capture_output (Recommended)
```python
from IPython.utils.capture import capture_output

def run_with_baml_logs(func, *args, **kwargs):
    """Run a function and capture BAML logs in the notebook output."""
    with capture_output() as captured:
        result = func(*args, **kwargs)
    
    # Display result
    if result is not None:
        print("=== Result ===")
        print(result)
    
    # Display BAML logs from stderr
    if captured.stderr:
        print("\n=== BAML Logs ===")
        # Format logs for readability
        log_lines = captured.stderr.strip().split('\n')
        for line in log_lines:
            if 'reasoning' in line.lower():
                print(f"🤔 {line}")
            else:
                print(f"   {line}")
    
    return result
```

#### Method B: stderr Redirection (Real-time)
```python
@contextlib.contextmanager
def redirect_stderr_to_stdout():
    """Context manager to redirect stderr to stdout."""
    old_stderr = sys.stderr
    sys.stderr = sys.stdout
    try:
        yield
    finally:
        sys.stderr = old_stderr

def run_with_baml_logs_redirect(func, *args, **kwargs):
    """Run with stderr redirected to stdout for immediate display."""
    with redirect_stderr_to_stdout():
        result = func(*args, **kwargs)
    return result
```

### 3. Test Results

From running `test_notebook_colab_sim.sh`:
- ✅ BAML logs are successfully captured and displayed
- ✅ Python BAML client is generated correctly
- ✅ All notebook cells execute without errors
- ✅ The logging helpers work in both local and Colab environments

### 4. Usage Pattern

The notebooks selectively enable logging for specific calls:

```python
# Normal execution (no logs)
main("Hello world")

# With log capture (when you want to see prompts/reasoning)
run_with_baml_logs(main, "Hello world")
```

### 5. Configuration in walkthrough_python.yaml

The YAML config uses `show_logs: true` to enable logging:

```yaml
steps:
  - run_main:
      args: "Hello"
      show_logs: true  # This triggers use of run_with_baml_logs()
```

## Recommendations

1. **The current implementation is working correctly** - BAML logs are being captured
2. **Use `run_with_baml_logs()` when you need to see prompts/reasoning** in notebooks
3. **Set `BAML_LOG=info` for optimal verbosity** (shows prompts without too much noise)
4. **For Colab testing, always validate with the sim script** before uploading

## Common Issues

1. **baml-cli generate failures**: Ensure baml_src directory exists and has valid BAML files
2. **Missing logs**: Check that `BAML_LOG` environment variable is set
3. **Import errors**: Use the `get_baml_client()` pattern to handle Colab's import cache

## Testing Workflow

1. Generate notebook: `uv run python hack/walkthroughgen_py.py hack/walkthrough_python.yaml -o hack/test.ipynb`
2. Test locally: `cd hack && ./test_notebook_colab_sim.sh test.ipynb`
3. Check preserved test directory in `./tmp/test_TIMESTAMP/` for debugging
4. Upload to Colab for final validation