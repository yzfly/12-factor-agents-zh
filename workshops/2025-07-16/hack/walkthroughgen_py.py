#!/usr/bin/env python3
"""Convert walkthrough.yaml to Jupyter notebook for BAML Python tutorials."""

import yaml
import nbformat
from nbformat.v4 import new_notebook, new_markdown_cell, new_code_cell
import os
import sys
from pathlib import Path
import argparse

def create_baml_setup_cells(nb):
    """Add BAML setup cells with explanation."""
    # Add explanation markdown
    explanation = """### BAML Setup

Don't worry too much about this setup code - it will make sense later! For now, just know that:
- BAML is a tool for working with language models
- We need some special setup code to make it work nicely in Google Colab
- The `get_baml_client()` function will be used to interact with AI models"""
    nb.cells.append(new_markdown_cell(explanation))
    
    # First cell: Install baml-py and pydantic
    install_code = "!pip install baml-py==0.202.0 pydantic"
    nb.cells.append(new_code_cell(install_code))
    
    # Second cell: Helper functions
    setup_code = '''import subprocess
import os

# Try to import Google Colab userdata, but don't fail if not in Colab
try:
    from google.colab import userdata
    IN_COLAB = True
except ImportError:
    IN_COLAB = False

def baml_generate():
    try:
        result = subprocess.run(
            ["baml-cli", "generate"],
            check=True,
            capture_output=True,
            text=True
        )
        if result.stdout:
            print("[baml-cli generate]\\n", result.stdout)
        if result.stderr:
            print("[baml-cli generate]\\n", result.stderr)
    except subprocess.CalledProcessError as e:
        msg = (
            f"`baml-cli generate` failed with exit code {e.returncode}\\n"
            f"--- STDOUT ---\\n{e.stdout}\\n"
            f"--- STDERR ---\\n{e.stderr}"
        )
        raise RuntimeError(msg) from None

def get_baml_client():
    """
    a bunch of fun jank to work around the google colab import cache
    """
    # Set API key from Colab secrets or environment
    if IN_COLAB:
        os.environ['OPENAI_API_KEY'] = userdata.get('OPENAI_API_KEY')
    elif 'OPENAI_API_KEY' not in os.environ:
        print("Warning: OPENAI_API_KEY not set. Please set it in your environment.")
    
    baml_generate()
    
    # Force delete all baml_client modules from sys.modules
    import sys
    modules_to_delete = [key for key in sys.modules.keys() if key.startswith('baml_client')]
    for module in modules_to_delete:
        del sys.modules[module]
    
    # Now import fresh
    import baml_client
    return baml_client.sync_client.b
'''
    nb.cells.append(new_code_cell(setup_code))
    
    # Third cell: Initialize BAML
    init_code = "!baml-cli init"
    nb.cells.append(new_code_cell(init_code))
    
    # Fourth cell: Add BAML logging helper
    logging_helper = '''# Helper function to capture BAML logs in notebook output
import os
import sys
from IPython.utils.capture import capture_output
import contextlib

def run_with_baml_logs(func, *args, **kwargs):
    """Run a function and capture BAML logs in the notebook output."""
    # Ensure BAML_LOG is set
    if 'BAML_LOG' not in os.environ:
        os.environ['BAML_LOG'] = 'info'
    
    print(f"Running with BAML_LOG={os.environ.get('BAML_LOG')}...")
    
    # Capture both stdout and stderr
    with capture_output() as captured:
        result = func(*args, **kwargs)
    
    # Display the result first
    if result is not None:
        print("=== Result ===")
        print(result)
    
    # Display captured stdout if any
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

# Alternative: Force stderr to stdout redirection
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
    """Run a function with stderr redirected to stdout for immediate display."""
    if 'BAML_LOG' not in os.environ:
        os.environ['BAML_LOG'] = 'info'
    
    print(f"Running with BAML_LOG={os.environ.get('BAML_LOG')} (stderr→stdout)...")
    
    with redirect_stderr_to_stdout():
        result = func(*args, **kwargs)
    
    if result is not None:
        print("\\n=== Result ===")
        print(result)
    
    return result

# Set BAML log level (options: error, warn, info, debug, trace)
os.environ['BAML_LOG'] = 'info'
print("BAML logging helpers loaded!")
print("- Use run_with_baml_logs() to capture and display logs after execution")
print("- Use run_with_baml_logs_redirect() to see logs in real-time as they're generated")
'''
    nb.cells.append(new_code_cell(logging_helper))

def process_step(nb, step, base_path, current_functions, section_name=None):
    """Process different step types."""
    if 'text' in step:
        # Add markdown cell
        nb.cells.append(new_markdown_cell(step['text']))
    
    if 'baml_setup' in step:
        # Add BAML setup cells
        create_baml_setup_cells(nb)
    
    if 'file' in step:
        src = step['file']['src']
        # For Python files, add the entire file content as a code cell
        if src.endswith('.py'):
            # Handle relative paths that start with ./
            if src.startswith('./'):
                file_path = base_path.parent / src[2:]
            else:
                file_path = base_path / src
            
            if file_path.exists():
                with open(file_path, 'r') as f:
                    content = f.read()
                # Add filename as comment at top
                code_with_header = f"# {src}\n{content}"
                nb.cells.append(new_code_cell(code_with_header))
            else:
                print(f"Warning: File not found: {file_path}")
                nb.cells.append(new_markdown_cell(f"**Error: File not found: {src}**"))
    
    if 'fetch_file' in step:
        # Fetch BAML file from GitHub
        src = step['fetch_file']['src']
        dest = step['fetch_file']['dest']
        github_url = f"https://raw.githubusercontent.com/humanlayer/12-factor-agents/refs/heads/main/workshops/2025-07-16/{src}"
        command = f"!curl -fsSL -o {dest} {github_url} && cat {dest}"
        nb.cells.append(new_code_cell(command))
    
    if 'dir' in step:
        # Create directory
        path = step['dir']['path']
        command = f"!mkdir -p {path}"
        nb.cells.append(new_code_cell(command))
    
    if 'command' in step:
        # Add command as code cell
        command = step['command'].strip()
        # Convert to notebook-style command
        if not command.startswith('!'):
            command = f"!{command}"
        nb.cells.append(new_code_cell(command))
    
    if 'run_main' in step:
        # Run main function
        regenerate = step['run_main'].get('regenerate_baml', False)
        if regenerate:
            nb.cells.append(new_code_cell("baml_generate()"))
        
        # Build the main() call
        call_parts = []
        
        # Check if args are provided
        args = step['run_main'].get('args', '')
        if args:
            call_parts.append(f'"{args}"')
        
        # Check if kwargs are provided
        kwargs = step['run_main'].get('kwargs', {})
        for key, value in kwargs.items():
            if isinstance(value, str):
                call_parts.append(f'{key}="{value}"')
            else:
                call_parts.append(f'{key}={value}')
        
        # Generate the function call
        if call_parts:
            main_call = f'main({", ".join(call_parts)})'
        else:
            main_call = "main()"
        
        # Check if we should use logging wrapper
        use_logging = step['run_main'].get('show_logs', False)
        
        if use_logging:
            # Use logging wrapper
            if call_parts:
                nb.cells.append(new_code_cell(f'run_with_baml_logs(main, {", ".join(call_parts)})'))
            else:
                nb.cells.append(new_code_cell('run_with_baml_logs(main)'))
        else:
            # Normal execution without logging
            nb.cells.append(new_code_cell(main_call))

def convert_walkthrough_to_notebook(yaml_path, output_path):
    """Convert walkthrough.yaml to Jupyter notebook."""
    # Load YAML
    with open(yaml_path, 'r') as f:
        walkthrough = yaml.safe_load(f)
    
    # Create notebook
    nb = new_notebook()
    
    # Add title
    title = walkthrough.get('title', 'Walkthrough')
    nb.cells.append(new_markdown_cell(f"# {title}"))
    
    # Add description
    if 'text' in walkthrough:
        nb.cells.append(new_markdown_cell(walkthrough['text']))
    
    # Process sections
    base_path = Path(yaml_path).parent
    current_functions = {}
    
    for section in walkthrough.get('sections', []):
        # Add section title
        section_title = section.get('title', section.get('name', 'Section'))
        section_name = section.get('name', '')
        nb.cells.append(new_markdown_cell(f"## {section_title}"))
        
        # Add section description
        if 'text' in section:
            nb.cells.append(new_markdown_cell(section['text']))
        
        # Process steps
        for step in section.get('steps', []):
            process_step(nb, step, base_path, current_functions, section_name)
    
    # Write notebook
    with open(output_path, 'w') as f:
        nbformat.write(nb, f)
    
    print(f"Generated notebook: {output_path}")

def main():
    parser = argparse.ArgumentParser(description='Convert walkthrough.yaml to Jupyter notebook')
    parser.add_argument('yaml_file', help='Path to walkthrough.yaml')
    parser.add_argument('-o', '--output', default='output.ipynb', help='Output notebook file')
    
    args = parser.parse_args()
    
    convert_walkthrough_to_notebook(args.yaml_file, args.output)

if __name__ == '__main__':
    main()