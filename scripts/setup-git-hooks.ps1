# Setup Git Hooks for Security (PowerShell version)
# This script installs pre-commit hooks to prevent committing secrets

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Setting up Git Security Hooks" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Get the repository root
try {
    $RepoRoot = git rev-parse --show-toplevel 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Not in a git repository"
    }
} catch {
    Write-Host "Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

Set-Location $RepoRoot

Write-Host "Repository: $RepoRoot"
Write-Host ""

# Create hooks directory if it doesn't exist
$HooksDir = Join-Path $RepoRoot ".git\hooks"
if (-not (Test-Path $HooksDir)) {
    New-Item -ItemType Directory -Path $HooksDir | Out-Null
    Write-Host "✓ Created .git/hooks directory" -ForegroundColor Green
}

# Copy pre-commit hook (convert to PowerShell if on Windows)
Write-Host "Installing pre-commit hook..." -ForegroundColor Yellow

$GitHookSource = Join-Path $RepoRoot ".githooks\pre-commit"
$GitHookDest = Join-Path $HooksDir "pre-commit"

if (Test-Path $GitHookSource) {
    # On Windows, we need to create a wrapper that calls bash or use PowerShell
    # For simplicity, we'll create a bash script that works with Git Bash
    Copy-Item $GitHookSource $GitHookDest -Force
    Write-Host "✓ Pre-commit hook installed" -ForegroundColor Green

    # Also create a PowerShell version for native Windows
    $PsHookDest = Join-Path $HooksDir "pre-commit.ps1"

    $PsHookContent = @'
# PowerShell Pre-commit Hook for Security
# Checks for sensitive information before commit

Write-Host "🔍 Running security checks..." -ForegroundColor Cyan

$FoundIssues = 0

# Get files to be committed
$Files = git diff --cached --name-only --diff-filter=ACM

if (-not $Files) {
    Write-Host "✓ No files to commit" -ForegroundColor Green
    exit 0
}

Write-Host "Checking $($Files.Count) files..."

# Forbidden file patterns
$ForbiddenFiles = @(
    '\.env$',
    'appsettings\.json$',
    'appsettings\.Development\.json$',
    'appsettings\.Production\.json$',
    'setup-environment\.ps1$',
    'setup-environment\.bat$',
    '\.pfx$',
    '\.key$',
    '\.pem$'
)

# Check for forbidden files
Write-Host ""
Write-Host "Checking for forbidden files..." -ForegroundColor Yellow
foreach ($File in $Files) {
    $FileName = Split-Path -Leaf $File

    foreach ($Pattern in $ForbiddenFiles) {
        if ($FileName -match $Pattern) {
            Write-Host "✗ BLOCKED: Forbidden file: $File" -ForegroundColor Red
            Write-Host "  This file should not be committed (contains sensitive data)" -ForegroundColor Red
            $FoundIssues++
        }
    }
}

# Patterns to search for
$SecretPatterns = @(
    'password\s*[=:]\s*["'']?[^\s"'']{3,}',
    'api[_-]?key\s*[=:]\s*["'']?[^\s"'']{10,}',
    'secret[_-]?key\s*[=:]\s*["'']?[^\s"'']{10,}',
    'connectionstring.*password',
    'AKIA[0-9A-Z]{16}'
)

# Check file contents
Write-Host ""
Write-Host "Scanning file contents for secrets..." -ForegroundColor Yellow
foreach ($File in $Files) {
    if (-not (Test-Path $File)) { continue }

    $Content = git diff --cached $File

    foreach ($Pattern in $SecretPatterns) {
        if ($Content -match $Pattern) {
            Write-Host "✗ POTENTIAL SECRET FOUND in $File" -ForegroundColor Red
            Write-Host "  Pattern: $Pattern" -ForegroundColor Red
            $FoundIssues++
        }
    }
}

# Final verdict
Write-Host ""
Write-Host "---------------------------------------------------" -ForegroundColor Cyan
if ($FoundIssues -eq 0) {
    Write-Host "✓ All security checks passed!" -ForegroundColor Green
    Write-Host ""
    exit 0
} else {
    Write-Host "✗ Security check FAILED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Your commit contains potential secrets or forbidden files."
    Write-Host ""
    Write-Host "To fix this:"
    Write-Host "1. Remove sensitive data from the files"
    Write-Host "2. Use environment variables instead"
    Write-Host "3. Use .example files as templates"
    Write-Host ""
    Write-Host "To bypass (USE WITH CAUTION):"
    Write-Host "  git commit --no-verify"
    Write-Host ""
    exit 1
}
'@

    $PsHookContent | Out-File -FilePath $PsHookDest -Encoding UTF8
    Write-Host "✓ PowerShell pre-commit hook installed" -ForegroundColor Green

} else {
    Write-Host "✗ Error: .githooks/pre-commit not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Git Hooks Setup Complete!" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The pre-commit hook will now:" -ForegroundColor Green
Write-Host "  • Check for forbidden files (.env, appsettings.json, etc.)"
Write-Host "  • Scan for passwords, API keys, and secrets"
Write-Host "  • Warn about IP addresses in code"
Write-Host "  • Block commits that contain sensitive data"
Write-Host ""
Write-Host "To bypass the hook (use with caution):" -ForegroundColor Yellow
Write-Host "  git commit --no-verify"
Write-Host ""
Write-Host "To test the hook:" -ForegroundColor Yellow
Write-Host "  Try committing a file with a password"
Write-Host ""
