#!/bin/bash
# Simulate Google Colab environment for testing notebooks

set -e

NOTEBOOK_PATH="$1"

if [ -z "$NOTEBOOK_PATH" ]; then
    echo "Usage: $0 <notebook_path>"
    exit 1
fi

# Get absolute path of notebook
NOTEBOOK_PATH=$(realpath "$NOTEBOOK_PATH")

# Create test directory in current folder
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEMP_DIR="./tmp/test_${TIMESTAMP}"
mkdir -p "$TEMP_DIR"
echo "🧪 Creating clean test environment in: $TEMP_DIR"

# Don't auto-cleanup so we can inspect it
echo "📁 Test directory will be preserved for inspection"

# Change to temp directory
cd "$TEMP_DIR"

# Create fresh Python virtual environment
echo "🐍 Creating fresh Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install jupyter dependencies
echo "📦 Installing Jupyter dependencies..."
pip install --quiet notebook nbconvert ipykernel

# Copy notebook to temp directory
cp "$NOTEBOOK_PATH" test_notebook.ipynb

# Create a Python script to execute the notebook
cat > run_notebook.py << 'EOF'
import nbformat
from nbconvert.preprocessors import ExecutePreprocessor
import sys
import os

# Ensure OPENAI_API_KEY is passed through
if 'OPENAI_API_KEY' in os.environ:
    print(f"✅ OPENAI_API_KEY is set")
else:
    print("⚠️  Warning: OPENAI_API_KEY not set")

# Read notebook
with open('test_notebook.ipynb', 'r') as f:
    nb = nbformat.read(f, as_version=4)

# Execute ALL cells (just like Colab)
ep = ExecutePreprocessor(timeout=120, kernel_name='python3')

print("🚀 Executing notebook (this simulates Google Colab)...")
print("=" * 60)

try:
    ep.preprocess(nb, {'metadata': {'path': '.'}})
    print("\n✅ Notebook executed successfully!")
    
    # Save the executed notebook back to disk
    with open('test_notebook.ipynb', 'w') as f:
        nbformat.write(nb, f)
    print("💾 Executed notebook saved with outputs")
    
    # Show final directory structure
    print("\n📁 Final directory structure:")
    for root, dirs, files in os.walk('.'):
        level = root.replace('.', '').count(os.sep)
        indent = ' ' * 2 * level
        print(f"{indent}{os.path.basename(root)}/")
        subindent = ' ' * 2 * (level + 1)
        for file in files[:10]:  # Limit output
            if not file.startswith('.'):
                print(f"{subindent}{file}")
                
except Exception as e:
    print(f"\n❌ Error executing notebook: {e}")
    if hasattr(e, 'traceback'):
        print("\nTraceback:")
        print(e.traceback)
    sys.exit(1)
EOF

# Run the notebook
echo "🏃 Running notebook in clean environment..."
source venv/bin/activate && python run_notebook.py

# Check what BAML files were created
echo -e "\n📄 BAML files created:"
if [ -d "baml_src" ]; then
    ls -la baml_src/
else
    echo "No baml_src directory found"
fi

# Check if Python BAML client was generated
echo -e "\n🐍 Python BAML client:"
if [ -d "baml_client" ]; then
    # Check if it's Python or TypeScript
    if [ -f "baml_client/__init__.py" ]; then
        echo "✅ Python client generated"
        ls baml_client/*.py 2>/dev/null | head -5
    else
        echo "❌ TypeScript client generated (not Python)"
        ls baml_client/*.ts 2>/dev/null | head -5
    fi
else
    echo "No baml_client directory found"
fi

echo -e "\n✨ Test complete!"