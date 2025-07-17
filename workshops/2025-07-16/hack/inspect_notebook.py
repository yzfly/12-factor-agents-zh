#!/usr/bin/env python3
"""
Utility to inspect notebook cell outputs for debugging
"""
import json
import sys
import os

def inspect_notebook(notebook_path, filter_keyword=None):
    """Inspect notebook cells and outputs"""
    
    if not os.path.exists(notebook_path):
        print(f"❌ Notebook not found: {notebook_path}")
        return
        
    with open(notebook_path) as f:
        nb = json.load(f)
    
    print(f"📓 Inspecting notebook: {notebook_path}")
    print(f"📊 Total cells: {len(nb['cells'])}")
    print("=" * 60)
    
    for i, cell in enumerate(nb['cells']):
        if cell['cell_type'] == 'code':
            source = ''.join(cell.get('source', []))
            
            # Filter by keyword if provided
            if filter_keyword and filter_keyword.lower() not in source.lower():
                continue
                
            print(f"\n🔍 CELL {i} ({'code'})")
            print("📝 SOURCE:")
            print(source[:300] + "..." if len(source) > 300 else source)
            
            if 'outputs' in cell and cell['outputs']:
                print(f"\n📤 OUTPUTS ({len(cell['outputs'])} outputs):")
                for j, output in enumerate(cell['outputs']):
                    output_type = output.get('output_type', 'unknown')
                    print(f"  Output {j}: type={output_type}")
                    
                    if 'text' in output:
                        text = ''.join(output['text'])
                        print(f"    Text length: {len(text)} chars")
                        
                        # Show first few lines for context
                        lines = text.split('\n')[:5]
                        for line in lines:
                            if line.strip():
                                print(f"    > {line[:80]}...")
                                
                        # Check for interesting patterns
                        patterns = ['BAML', 'Parsed', 'Response', 'Error', 'Exception']
                        found_patterns = [p for p in patterns if p in text]
                        if found_patterns:
                            print(f"    🎯 Found patterns: {found_patterns}")
                            
                    elif 'data' in output:
                        data_keys = list(output['data'].keys())
                        print(f"    Data keys: {data_keys}")
                        
                    # Check for execution errors
                    if output_type == 'error':
                        print(f"    ❌ ERROR: {output.get('ename', 'Unknown')}")
                        print(f"    💬 Message: {output.get('evalue', 'No message')}")
                        if 'traceback' in output:
                            print(f"    📍 Traceback: {len(output['traceback'])} lines")
                            # Show last few lines of traceback
                            for line in output['traceback'][-3:]:
                                print(f"    🔍 {line.strip()}")
                        
            else:
                print("\n📤 No outputs")
                
            print("-" * 40)

def main():
    if len(sys.argv) < 2:
        print("Usage: python inspect_notebook.py <notebook_path> [filter_keyword]")
        sys.exit(1)
        
    notebook_path = sys.argv[1]
    filter_keyword = sys.argv[2] if len(sys.argv) > 2 else None
    
    inspect_notebook(notebook_path, filter_keyword)

if __name__ == '__main__':
    main()