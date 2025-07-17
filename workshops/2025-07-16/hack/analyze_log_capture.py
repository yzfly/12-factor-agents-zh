#!/usr/bin/env python3
"""
Analyze notebook for BAML log capture success/failure
"""
import json
import sys
import os

def check_logs(notebook_path):
    """Check if BAML logs were captured in the notebook"""
    
    if not os.path.exists(notebook_path):
        print(f"❌ Notebook not found: {notebook_path}")
        return False, False
        
    with open(notebook_path) as f:
        nb = json.load(f)
    
    found_log_pattern = False
    found_capture_test = False
    
    for i, cell in enumerate(nb['cells']):
        if cell['cell_type'] == 'code' and 'outputs' in cell:
            # Check if this is a log capture test cell
            source = ''.join(cell.get('source', []))
            if 'run_with_baml_logs' in source:
                found_capture_test = True
                print(f'Found log capture test in cell {i}')
                
                # Check outputs for BAML logs
                for output in cell['outputs']:
                    if output.get('output_type') == 'stream' and 'text' in output:
                        text = ''.join(output['text'])
                        # Look for the specific BAML log pattern
                        if '---Parsed Response (class DoneForNow)---' in text:
                            found_log_pattern = True
                            print(f'✅ FOUND BAML LOG PATTERN in cell {i} output!')
                            log_lines = [line for line in text.split('\n') if 'Parsed Response' in line]
                            if log_lines:
                                print(f'Log excerpt: {log_lines[0]}')
                        
                        # Also check for our test markers
                        if 'Captured BAML Logs' in text:
                            print(f'Found "Captured BAML Logs" section in cell {i}')
                        if 'No BAML Logs Captured' in text:
                            print(f'Found "No BAML Logs Captured" section in cell {i}')
    
    return found_capture_test, found_log_pattern

def main():
    if len(sys.argv) != 2:
        print("Usage: python analyze_log_capture.py <notebook_path>")
        sys.exit(1)
        
    notebook_path = sys.argv[1]
    capture_test_found, log_pattern_found = check_logs(notebook_path)

    if not capture_test_found:
        print('❌ FAIL: No log capture test found in notebook')
        sys.exit(1)

    if log_pattern_found:
        print('✅ PASS: BAML logs successfully captured in notebook output!')
        sys.exit(0)
    else:
        print('❌ FAIL: BAML log pattern not found in captured output')
        print('This means the log capture method is NOT working')
        sys.exit(1)

if __name__ == '__main__':
    main()