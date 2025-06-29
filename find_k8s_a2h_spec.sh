#!/bin/bash

# Script to find kubernetes-style A2H spec with kind: declarations

echo "=== Searching for Kubernetes-style A2H spec across all repositories ==="
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
        
        echo "  📋 Files containing 'kind:' in current branch:"
        find . -name "*.md" -type f -exec grep -l "kind:" {} \; 2>/dev/null || true
        find . -name "*.yaml" -type f -exec grep -l "kind:" {} \; 2>/dev/null || true
        find . -name "*.yml" -type f -exec grep -l "kind:" {} \; 2>/dev/null || true
        
        echo "  📋 Files containing 'apiVersion.*a2h' in current branch:"
        find . -name "*.md" -type f -exec grep -l "apiVersion.*a2h" {} \; 2>/dev/null || true
        find . -name "*.yaml" -type f -exec grep -l "apiVersion.*a2h" {} \; 2>/dev/null || true
        find . -name "*.yml" -type f -exec grep -l "apiVersion.*a2h" {} \; 2>/dev/null || true
        
        echo "  🔍 Searching git history for kind: declarations:"
        git log --all --name-only --pretty=format: | grep -E "\.(md|yaml|yml)$" | sort -u | while read file; do
            if [ -n "$file" ]; then
                # Check if file contains kind: in any branch
                for branch in $(git branch -r | grep -v HEAD | sed 's/origin\///'); do
                    content=$(git show "$branch:$file" 2>/dev/null)
                    if [[ "$content" =~ kind:[[:space:]]*[A-Za-z] ]]; then
                        echo "    Found kind: in $branch:$file"
                        echo "$content" | grep -n "kind:" || true
                    fi
                    if [[ "$content" =~ apiVersion.*a2h ]]; then
                        echo "    Found apiVersion.*a2h in $branch:$file"
                        echo "$content" | grep -n "apiVersion.*a2h" || true
                    fi
                done
            fi
        done
        
        echo "  🔍 Commits mentioning kubernetes-style objects:"
        git log --all --oneline --grep="kind:" --grep="apiVersion" --grep="HumanContact" --grep="FunctionCall" -i || true
        
        echo "  📝 Search for specific A2H object types:"
        find . -type f \( -name "*.md" -o -name "*.yaml" -o -name "*.yml" \) -exec grep -l -i "humancontact\|functioncall\|contactchannel" {} \; 2>/dev/null || true
        
        echo
    else
        echo "❌ Not a git repo: $repo"
    fi
done

echo "=== Detailed content search ==="

# More detailed search for yaml-like content in markdown files
for repo in "${REPOS[@]}"; do
    if [ -d "$repo/.git" ]; then
        echo "🔍 Detailed search in: $repo"
        cd "$repo"
        
        # Search for yaml blocks in markdown files that contain kind:
        find . -name "*.md" -type f -exec sh -c '
            file="$1"
            # Look for yaml code blocks containing kind:
            awk "/^```(yaml|yml)$/,/^```$/" "$file" | grep -q "kind:" && echo "YAML block with kind: found in $file"
            # Look for any kind: declaration in markdown
            grep -n "kind:" "$file" 2>/dev/null && echo "kind: found in $file"
        ' _ {} \; 2>/dev/null || true
        
        echo
    fi
done

echo "=== Done searching ==="