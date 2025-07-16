#!/usr/bin/env python3
"""Create a Jupyter notebook with example cells."""

import nbformat
from nbformat.v4 import new_notebook, new_markdown_cell, new_code_cell

def create_sample_notebook():
    nb = new_notebook()
    
    # Cell 1: Markdown header
    nb.cells.append(new_markdown_cell("""# Workshop Notebook - July 16, 2025

Welcome to today's workshop! This notebook contains some basic examples to get started.

## Overview
- Basic Python operations
- Simple calculations
- String manipulation"""))
    
    # Cell 2: Hello World
    nb.cells.append(new_code_cell("""# Classic Hello World
print("Hello, World!")
print("Welcome to the workshop!")"""))
    
    # Cell 3: Markdown for math section
    nb.cells.append(new_markdown_cell("""## Basic Mathematics

Let's perform some simple calculations:"""))
    
    # Cell 4: Basic addition
    nb.cells.append(new_code_cell("""# Basic arithmetic operations
a = 42
b = 17
c = a + b

print(f"{a} + {b} = {c}")
print(f"{a} - {b} = {a - b}")
print(f"{a} * {b} = {a * b}")
print(f"{a} / {b} = {a / b:.2f}")"""))
    
    # Cell 5: Markdown for list operations
    nb.cells.append(new_markdown_cell("""## Working with Lists

Python lists are versatile data structures:"""))
    
    # Cell 6: List operations
    nb.cells.append(new_code_cell("""# Working with lists
numbers = [1, 2, 3, 4, 5]
print("Original list:", numbers)

# Add more numbers
numbers.extend([6, 7, 8, 9, 10])
print("Extended list:", numbers)

# Calculate sum and average
total = sum(numbers)
average = total / len(numbers)

print(f"Sum: {total}")
print(f"Average: {average}")
print(f"Max: {max(numbers)}")
print(f"Min: {min(numbers)}")"""))
    
    # Cell 7: Markdown for functions
    nb.cells.append(new_markdown_cell("""## Creating Functions

Let's define some simple functions:"""))
    
    # Cell 8: Function definition
    nb.cells.append(new_code_cell("""# Define a simple function
def greet(name):
    return f"Hello, {name}! Welcome to the workshop."

def calculate_area(length, width):
    return length * width

# Use the functions
print(greet("Python Developer"))
print(f"Area of a 5x3 rectangle: {calculate_area(5, 3)} square units")"""))
    
    # Cell 9: Markdown conclusion
    nb.cells.append(new_markdown_cell("""## Next Steps

Feel free to add your own cells below and experiment with Python!

Some ideas to try:
- Create a function that calculates fibonacci numbers
- Work with dictionaries
- Try list comprehensions
- Import and use external libraries"""))
    
    # Cell 10: Empty code cell for user
    nb.cells.append(new_code_cell("# Your code here\n"))
    
    return nb

if __name__ == "__main__":
    notebook = create_sample_notebook()
    
    # Write the notebook
    with open("2025-07-16-workshop.ipynb", "w") as f:
        nbformat.write(notebook, f)
    
    print("Notebook created successfully!")