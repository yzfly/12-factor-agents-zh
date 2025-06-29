#!/bin/bash

# Script to find A2H spec in git history across all repos

echo "=== Searching for A2H spec across all repositories ==="
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
        
        echo "  📋 All branches:"
        git branch -a | grep -E "(a2h|agent.*human)" || true
        
        echo "  🔍 Branches containing A2H in name:"
        git branch -a | grep -i a2h || true
        
        echo "  📝 Commits mentioning A2H:"
        git log --all --oneline --grep="humanMessage" -i || true
        
        echo "  📁 Files in git history containing A2H:"
        git log --all --name-only --pretty=format: | grep -i "a2h\|agent.*human" | sort -u || true
        
        echo "  🔍 Search file contents in all branches:"
        for branch in $(git branch -r | grep -v HEAD | sed 's/origin\///'); do
            echo "    Checking branch: $branch"
            git show "$branch" 2>/dev/null | grep -l -i "a2h\|agent.*human\|agent-to-human\|humanMessage" 2>/dev/null || true
        done
        
        echo "  📋 Recent commits (last 50):"
        git log --all --oneline -50 | grep -i "spec\|a2h\|agent.*human\|humanMessage" || true
        
        echo
    else
        echo "❌ Not a git repo: $repo"
    fi
done

echo "=== Done searching ==="