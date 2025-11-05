#!/bin/bash
# Setup Git Hooks for Security
# This script installs pre-commit hooks to prevent committing secrets

echo "=================================================="
echo " Setting up Git Security Hooks"
echo "=================================================="
echo ""

# Get the repository root
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)

if [ -z "$REPO_ROOT" ]; then
    echo "Error: Not in a git repository"
    exit 1
fi

cd "$REPO_ROOT"

echo "Repository: $REPO_ROOT"
echo ""

# Create hooks directory if it doesn't exist
HOOKS_DIR="$REPO_ROOT/.git/hooks"
if [ ! -d "$HOOKS_DIR" ]; then
    mkdir -p "$HOOKS_DIR"
    echo "✓ Created .git/hooks directory"
fi

# Copy pre-commit hook
echo "Installing pre-commit hook..."
if [ -f ".githooks/pre-commit" ]; then
    cp .githooks/pre-commit "$HOOKS_DIR/pre-commit"
    chmod +x "$HOOKS_DIR/pre-commit"
    echo "✓ Pre-commit hook installed"
else
    echo "✗ Error: .githooks/pre-commit not found"
    exit 1
fi

# Test the hook
echo ""
echo "Testing pre-commit hook..."
if [ -x "$HOOKS_DIR/pre-commit" ]; then
    echo "✓ Hook is executable"
else
    echo "✗ Hook is not executable"
    chmod +x "$HOOKS_DIR/pre-commit"
    echo "✓ Fixed permissions"
fi

echo ""
echo "=================================================="
echo " Git Hooks Setup Complete!"
echo "=================================================="
echo ""
echo "The pre-commit hook will now:"
echo "  • Check for forbidden files (.env, appsettings.json, etc.)"
echo "  • Scan for passwords, API keys, and secrets"
echo "  • Warn about IP addresses in code"
echo "  • Block commits that contain sensitive data"
echo ""
echo "To bypass the hook (use with caution):"
echo "  git commit --no-verify"
echo ""
echo "To test the hook:"
echo "  Try committing a file with a password"
echo ""
