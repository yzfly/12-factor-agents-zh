#!/bin/bash

# Focused search for kubernetes-style A2H spec

echo "=== Focused search for Kubernetes-style A2H declarations ==="
echo

REPOS=(
    "/Users/dex/go/src/github.com/humanlayer/12-factor-agents"
    "/Users/dex/go/src/github.com/humanlayer/humanlayer"
    "/Users/dex/go/src/github.com/humanlayer/agentcontrolplane"
    "/Users/dex/go/src/github.com/metalytics-dev/metalytics"
)

for repo in "${REPOS[@]}"; do
    if [ -d "$repo/.git" ]; then
        echo "🔍 Searching in: $repo"
        cd "$repo"
        
        # Search for apiVersion with a2h in any markdown files
        echo "  📋 Files with apiVersion.*a2h:"
        find . -name "*.md" -not -path "*/node_modules/*" -exec grep -l "apiVersion.*a2h" {} \; 2>/dev/null || true
        
        # Search for kind: followed by common A2H object names
        echo "  📋 Files with kind: HumanContact|FunctionCall|Contact:"
        find . -name "*.md" -not -path "*/node_modules/*" -exec grep -l "kind:.*\(HumanContact\|FunctionCall\|Contact\|Human\)" {} \; 2>/dev/null || true
        
        # Search in all branches for files with these patterns
        echo "  📋 Git history search for apiVersion.*a2h:"
        git log --all --name-only --pretty=format: | grep "\.md$" | sort -u | head -20 | while read file; do
            if [ -n "$file" ]; then
                for branch in $(git branch -r | grep -v HEAD | sed 's/origin\///' | head -10); do
                    content=$(git show "$branch:$file" 2>/dev/null)
                    if echo "$content" | grep -q "apiVersion.*a2h"; then
                        echo "    Found apiVersion.*a2h in $branch:$file"
                        break
                    fi
                done
            fi
        done
        
        echo
    fi
done

echo "=== Manual content check of key files ==="

# Check specific files that might contain the spec
for repo in "${REPOS[@]}"; do
    if [ -d "$repo" ]; then
        echo "🔍 Checking key files in: $repo"
        
        # Look for README, spec, docs files
        find "$repo" -name "*.md" -not -path "*/node_modules/*" | grep -E "(spec|doc|readme|acep|crd|k8s|kubernetes)" | head -10 | while read file; do
            if grep -q "kind:" "$file" 2>/dev/null; then
                echo "  📝 Found kind: in: $file"
                grep -n "kind:" "$file" 2>/dev/null | head -3
            fi
            if grep -q "apiVersion.*a2h" "$file" 2>/dev/null; then
                echo "  📝 Found apiVersion.*a2h in: $file"
                grep -n "apiVersion.*a2h" "$file" 2>/dev/null | head -3
            fi
        done
        
        echo
    fi
done

echo "=== Done focused search ==="