# Workshop 2025-07-16: Python/Jupyter Notebook Implementation

• **Main Tool**: `walkthroughgen_py.py` - Converts TypeScript walkthrough to Jupyter notebooks
• **Config**: `walkthrough.yaml` - Defines notebook structure and content
• **Output**: `workshop_final.ipynb` - Generated notebook with Chapters 0-7
• **Testing**: `test_notebook_colab_sim.sh` - Simulates Google Colab environment

## Key Implementation Learnings

• **No async/await in notebooks** - All BAML calls must be synchronous, remove all async patterns
• **No sys.argv** - Main functions accept parameters directly: `main("hello")` not command line args
• **Global namespace** - Functions defined in cells persist globally, no module imports between cells
• **BAML setup is optional** - Use `baml_setup: true` step only when introducing BAML (Chapter 1+)
• **get_baml_client() pattern** - Required workaround for Google Colab import cache issues
• **BAML files from GitHub** - Fetch with curl since Colab can't display local BAML files
• **Regenerate BAML** - Use `regenerate_baml: true` in run_main when BAML files change
• **Import removal** - Remove `from baml_client import get_baml_client` imports from Python files
• **IN_COLAB detection** - Use try/except on google.colab import to detect environment
• **Human input handling** - get_human_input() uses real input() in Colab, auto-responses locally

## Implementation Patterns

• **walkthroughgen_py.py enhancements** - Added kwargs support for run_main steps
• **Test simulation** - test_notebook_colab_sim.sh creates clean venv with all dependencies
• **Debug artifacts** - Test runs preserved in ./tmp/test_TIMESTAMP/ directories
• **BAML test support** - baml-cli test works fine in notebooks, contrary to initial assumption
• **Tool execution** - All calculator operations (add/subtract/multiply/divide) in agent loop
• **Clarification flow** - ClarificationRequest tool for handling ambiguous inputs
• **Serialization formats** - JSON vs XML for thread history (XML more token-efficient)
• **Progressive complexity** - Start with hello world, gradually add BAML, tools, loops, tests

## Chapter Implementation Status

• **Chapter 0**: Hello World - Simple Python program, no BAML ✅
• **Chapter 1**: CLI and Agent - BAML introduction, basic agent ✅
• **Chapter 2**: Calculator Tools - Tool definitions without execution ✅
• **Chapter 3**: Tool Loop - Full agent loop with tool execution ✅
• **Chapter 4**: BAML Tests - Test cases with assertions ✅
• **Chapter 5**: Human Tools - Clarification requests with input handling ✅
• **Chapter 6**: Improved Prompting - Reasoning steps in prompts ✅
• **Chapter 7**: Context Serialization - JSON/XML thread formats ✅
• **Chapters 8-12**: Skipped - Server-based features not suitable for notebooks ⚠️

## Common Pitfalls Avoided

• **Import errors** - baml_client imports fail in notebooks, use global get_baml_client
• **Async patterns** - Notebooks can't handle async/await, everything must be sync
• **File paths** - Use absolute paths from notebook directory, handle ./ prefixes
• **BAML file conflicts** - Each chapter updates same files (agent.baml) not chapter-specific
• **Tool registration** - Ensure all tool types handled in agent loop switch statement
• **Test expectations** - BAML tests may have varying outputs, assertions verify key properties
• **Environment differences** - Code must work in both Colab and local testing environments

## Testing Commands

• Generate notebook: `uv run python walkthroughgen_py.py walkthrough.yaml -o test.ipynb`
• Full Colab sim: `./test_notebook_colab_sim.sh`
• Run BAML tests: `baml-cli test` (from directory with baml_src)

## File Structure

• `walkthrough/*.py` - Python implementations of each chapter's code
• `walkthrough/*.baml` - BAML files fetched from GitHub during notebook execution
• `walkthroughgen_py.py` - Main conversion tool
• `walkthrough.yaml` - Notebook definition with all chapters
• `test_notebook_colab_sim.sh` - Full Colab environment simulation
• `workshop_final.ipynb` - Final generated notebook ready for workshop
