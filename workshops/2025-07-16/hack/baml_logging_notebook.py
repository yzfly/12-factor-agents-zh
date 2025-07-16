#!/usr/bin/env python3
"""Helper utilities for capturing BAML logs in Jupyter notebooks."""

import os
import sys
import logging
import contextlib
from io import StringIO

# Configure Python logging to display in Jupyter
def setup_jupyter_logging():
    """Configure logging to work properly in Jupyter notebooks."""
    # Remove any existing handlers
    root_logger = logging.getLogger()
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create a new handler that outputs to stdout
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    
    # Set up the root logger
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)
    
    # Also set up BAML-specific logger
    baml_logger = logging.getLogger('baml')
    baml_logger.setLevel(logging.DEBUG)
    
    return root_logger

@contextlib.contextmanager
def capture_baml_output():
    """Context manager to capture BAML output in Jupyter notebooks."""
    # Capture stdout and stderr
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    
    stdout_capture = StringIO()
    stderr_capture = StringIO()
    
    try:
        # Redirect stdout and stderr
        sys.stdout = stdout_capture
        sys.stderr = stderr_capture
        
        yield stdout_capture, stderr_capture
        
    finally:
        # Restore original stdout/stderr
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        
        # Print captured output
        stdout_content = stdout_capture.getvalue()
        stderr_content = stderr_capture.getvalue()
        
        if stdout_content:
            print("=== BAML Output ===")
            print(stdout_content)
        
        if stderr_content:
            print("=== BAML Logs ===")
            print(stderr_content)

def run_with_baml_logging(func, *args, **kwargs):
    """Run a function and capture its BAML output."""
    # Ensure BAML_LOG is set
    if 'BAML_LOG' not in os.environ:
        os.environ['BAML_LOG'] = 'info'
    
    print(f"BAML_LOG is set to: {os.environ.get('BAML_LOG')}")
    
    with capture_baml_output() as (stdout_cap, stderr_cap):
        result = func(*args, **kwargs)
    
    return result

# Example usage in notebook:
# from baml_logging_notebook import run_with_baml_logging, setup_jupyter_logging
# setup_jupyter_logging()
# result = run_with_baml_logging(main, "can you multiply 3 and 4")