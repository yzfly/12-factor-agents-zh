#!/bin/bash
set -e

echo "🧪 Testing BAML Log Capture..."

# Clean up any previous test
rm -f test_capture.ipynb
rm -rf tmp/test_capture_*

# Generate test notebook
echo "📝 Generating test notebook..."
uv run python walkthroughgen_py.py simple_log_test.yaml -o test_capture.ipynb

# Run in sim
echo "🚀 Running test in sim..."
./test_notebook_colab_sim.sh test_capture.ipynb > /dev/null 2>&1

# Find the executed notebook in the timestamped directory
NOTEBOOK_DIR=$(ls -1dt tmp/test_* | head -1)
NOTEBOOK_PATH="$NOTEBOOK_DIR/test_notebook.ipynb"

echo "📋 Analyzing results from $NOTEBOOK_PATH..."

# First dump debug info
echo "🔍 Dumping debug info..."
python3 inspect_notebook.py "$NOTEBOOK_PATH" "run_with_baml_logs"

echo ""
echo "📊 Running log capture analysis..."

# Check for BAML log patterns in the executed notebook
python3 analyze_log_capture.py "$NOTEBOOK_PATH"

echo "🧹 Cleaning up..."
rm -f test_capture.ipynb