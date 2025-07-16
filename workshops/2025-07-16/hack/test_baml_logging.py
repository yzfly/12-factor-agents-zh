#!/usr/bin/env python3
"""Test script to verify BAML logging capture."""

import os
import sys
from contextlib import redirect_stderr
from io import StringIO

# Set BAML log level
os.environ['BAML_LOG'] = 'info'

print("Testing BAML logging capture methods...")
print("=" * 60)

# Method 1: Using sys.stderr redirection
print("\nMethod 1: Direct stderr redirection")
old_stderr = sys.stderr
sys.stderr = sys.stdout

# Simulate BAML logging to stderr
print("This would be a BAML log message", file=old_stderr)
print("BAML logs should appear here if redirected properly")

# Restore stderr
sys.stderr = old_stderr

# Method 2: Using context manager
print("\nMethod 2: Context manager with StringIO")
stderr_capture = StringIO()

with redirect_stderr(stderr_capture):
    # Simulate BAML logging
    print("This is a BAML log to stderr", file=sys.stderr)
    print("Another BAML log message", file=sys.stderr)

# Get captured content
captured = stderr_capture.getvalue()
if captured:
    print("Captured stderr content:")
    print(captured)
else:
    print("No stderr content captured")

print("\n" + "=" * 60)
print("Test complete!")