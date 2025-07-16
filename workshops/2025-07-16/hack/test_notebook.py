#!/usr/bin/env python3
"""Test notebook execution without requiring Google Colab."""

import nbformat
from nbconvert.preprocessors import ExecutePreprocessor
import sys

def test_notebook(notebook_path):
    """Execute notebook and check for errors."""
    print(f"Testing notebook: {notebook_path}")
    
    # Read notebook
    with open(notebook_path, 'r') as f:
        nb = nbformat.read(f, as_version=4)
    
    # Skip cells that require Google Colab
    cells_to_execute = []
    for cell in nb.cells:
        if cell.cell_type == 'code':
            # Skip cells with Google Colab imports or baml-cli commands
            if 'google.colab' in cell.source or 'baml-cli' in cell.source:
                print(f"Skipping cell with Colab/BAML dependencies: {cell.source[:50]}...")
                continue
            # Skip pip install cells
            if cell.source.strip().startswith('!pip'):
                print(f"Skipping pip install cell")
                continue
        cells_to_execute.append(cell)
    
    # Create a new notebook with only executable cells
    test_nb = nbformat.v4.new_notebook()
    test_nb.cells = cells_to_execute
    
    # Execute
    ep = ExecutePreprocessor(timeout=10, kernel_name='python3')
    try:
        ep.preprocess(test_nb, {'metadata': {'path': '.'}})
        print("✅ Notebook executed successfully!")
        return True
    except Exception as e:
        print(f"❌ Error executing notebook: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_notebook(sys.argv[1])
    else:
        print("Usage: python test_notebook.py <notebook_path>")