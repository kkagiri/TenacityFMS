#!/bin/bash
# ===============================================================================
# Git History Cleanup Script
# Automated cleanup of sensitive data from git history using BFG Repo-Cleaner
# ===============================================================================
#
# PREREQUISITES:
# 1. All passwords MUST be changed first!
# 2. All developers MUST be notified
# 3. Schedule maintenance window (no commits during cleanup)
# 4. Backup repository first!
#
# USAGE:
#   ./cleanup-history.sh --backup      # Create backup only
#   ./cleanup-history.sh --verify      # Verify cleanup (after running)
#   ./cleanup-history.sh --full        # Full cleanup process
#
# ===============================================================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/your-org/Tenacy.FMS.git"
WORK_DIR="$HOME/git-cleanup"
BACKUP_DIR="$HOME/git-cleanup-backups"
BFG_JAR="$HOME/tools/bfg.jar"
BFG_URL="https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar"

# Functions
print_header() {
    echo ""
    echo -e "${BLUE}===============================================================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}===============================================================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check Java
    if ! command -v java &> /dev/null; then
        print_error "Java is not installed"
        echo "Please install Java 8 or higher:"
        echo "  Ubuntu/Debian: sudo apt-get install default-jre"
        echo "  Mac: brew install openjdk"
        exit 1
    fi
    print_success "Java is installed: $(java -version 2>&1 | head -1)"

    # Check git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    print_success "Git is installed: $(git --version)"

    # Check BFG
    if [ ! -f "$BFG_JAR" ]; then
        print_warning "BFG Repo-Cleaner not found at $BFG_JAR"
        print_info "Downloading BFG..."

        mkdir -p "$(dirname "$BFG_JAR")"
        wget -O "$BFG_JAR" "$BFG_URL"

        if [ -f "$BFG_JAR" ]; then
            print_success "BFG downloaded successfully"
        else
            print_error "Failed to download BFG"
            exit 1
        fi
    fi

    # Test BFG
    if java -jar "$BFG_JAR" --version &> /dev/null; then
        print_success "BFG is ready: $(java -jar "$BFG_JAR" --version 2>&1 | head -1)"
    else
        print_error "BFG test failed"
        exit 1
    fi
}

confirm_action() {
    print_warning "⚠️  CRITICAL WARNING ⚠️"
    echo ""
    echo "This script will:"
    echo "  • Rewrite ALL git history"
    echo "  • Remove sensitive files permanently"
    echo "  • Require force push to remote"
    echo "  • Require all developers to re-clone"
    echo ""
    print_warning "Have you completed these prerequisites?"
    echo "  [ ] Changed all exposed passwords"
    echo "  [ ] Configured environment variables"
    echo "  [ ] Notified all developers"
    echo "  [ ] Scheduled maintenance window"
    echo "  [ ] Created backup of repository"
    echo ""

    read -p "Are you SURE you want to continue? (type 'yes' to proceed): " -r
    echo ""

    if [[ ! $REPLY =~ ^yes$ ]]; then
        print_error "Aborted by user"
        exit 1
    fi
}

create_backup() {
    print_header "Creating Backup"

    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/backup-$TIMESTAMP"

    mkdir -p "$BACKUP_PATH"
    cd "$BACKUP_PATH"

    print_info "Cloning repository as mirror..."
    git clone --mirror "$REPO_URL"

    print_info "Creating archive..."
    tar -czf "Tenacy.FMS-backup-$TIMESTAMP.tar.gz" Tenacy.FMS.git

    BACKUP_SIZE=$(du -sh "Tenacy.FMS-backup-$TIMESTAMP.tar.gz" | cut -f1)
    print_success "Backup created: $BACKUP_PATH/Tenacy.FMS-backup-$TIMESTAMP.tar.gz ($BACKUP_SIZE)"

    echo "$BACKUP_PATH/Tenacy.FMS-backup-$TIMESTAMP.tar.gz" > "$BACKUP_DIR/latest-backup.txt"
}

prepare_cleanup_files() {
    print_header "Preparing Cleanup Configuration"

    cd "$WORK_DIR"

    # Create files to delete list
    cat > files-to-delete.txt << 'EOF'
.env
appsettings.json
appsettings.Development.json
appsettings.Production.json
appsettings.development.json
appsettings.production.json
appsettings.Testing.json
setup-environment.ps1
setup-environment.bat
setup-pts-env.ps1
setup-pts-env.bat
setup-frontend-env.ps1
EOF

    print_success "Created files-to-delete.txt"

    # Create passwords to remove list
    cat > passwords-to-remove.txt << 'EOF'
Niwewenamimi1000==>***REMOVED***
Tenacy2030==>***REMOVED***
Niwewe1000==>***REMOVED***
hk%2bXL3thlikm31JLAon0FjBxyyOtnrUOMCHIP%2bFfrhEXQPffqSrPDVGperVhCXPA==>***REMOVED***
hy.gps@example.com==>***REMOVED***
EOF

    print_success "Created passwords-to-remove.txt"

    echo ""
    print_info "Files that will be removed from history:"
    cat files-to-delete.txt | sed 's/^/  • /'

    echo ""
    print_info "Passwords that will be scrubbed (showing first 10 chars only):"
    cat passwords-to-remove.txt | cut -d'=' -f1 | cut -c1-10 | sed 's/^/  • /'
    echo ""
}

clone_mirror() {
    print_header "Cloning Repository Mirror"

    mkdir -p "$WORK_DIR"
    cd "$WORK_DIR"

    if [ -d "Tenacy.FMS.git" ]; then
        print_warning "Tenacy.FMS.git already exists"
        read -p "Delete and re-clone? (y/n): " -r
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf Tenacy.FMS.git
        else
            print_error "Aborted"
            exit 1
        fi
    fi

    print_info "Cloning as mirror (this may take a few minutes)..."
    git clone --mirror "$REPO_URL"

    cd Tenacy.FMS.git
    ORIG_SIZE=$(du -sh . | cut -f1)
    print_success "Repository cloned: $ORIG_SIZE"
}

run_bfg_cleanup() {
    print_header "Running BFG Repo-Cleaner"

    cd "$WORK_DIR"

    # Remove sensitive files
    print_info "Removing sensitive files from history..."
    java -jar "$BFG_JAR" \
        --delete-files '{appsettings.json,appsettings.*.json,.env,setup-environment.ps1,setup-*.ps1,setup-*.bat}' \
        Tenacy.FMS.git

    echo ""

    # Replace passwords
    print_info "Scrubbing passwords from remaining files..."
    java -jar "$BFG_JAR" \
        --replace-text passwords-to-remove.txt \
        Tenacy.FMS.git

    print_success "BFG cleanup complete"
}

cleanup_refs() {
    print_header "Cleaning References and Garbage Collection"

    cd "$WORK_DIR/Tenacy.FMS.git"

    print_info "Expiring reflog..."
    git reflog expire --expire=now --all

    print_info "Running aggressive garbage collection (this may take a while)..."
    git gc --prune=now --aggressive

    NEW_SIZE=$(du -sh . | cut -f1)
    print_success "Repository cleaned: $NEW_SIZE (was $ORIG_SIZE)"
}

verify_cleanup() {
    print_header "Verifying Cleanup"

    cd "$WORK_DIR/Tenacy.FMS.git"

    ISSUES=0

    # Check for sensitive files
    print_info "Checking for removed files..."

    if git log --all --full-history -- '**/setup-environment.ps1' 2>&1 | grep -q 'commit'; then
        print_error "Found setup-environment.ps1 in history"
        ((ISSUES++))
    else
        print_success "setup-environment.ps1 removed from history"
    fi

    if git log --all --full-history -- '**/.env' 2>&1 | grep -q 'commit'; then
        print_error "Found .env in history"
        ((ISSUES++))
    else
        print_success ".env removed from history"
    fi

    # Check for passwords
    print_info "Checking for exposed passwords..."

    if git log --all -S "Niwewenamimi1000" | grep -q 'commit'; then
        print_error "Found password 'Niwewenamimi1000' in history"
        ((ISSUES++))
    else
        print_success "Password 'Niwewenamimi1000' removed"
    fi

    if git log --all -S "Tenacy2030" | grep -q 'commit'; then
        print_error "Found password 'Tenacy2030' in history"
        ((ISSUES++))
    else
        print_success "Password 'Tenacy2030' removed"
    fi

    # Check that example files still exist
    print_info "Checking that example files remain..."

    if git ls-tree -r HEAD | grep -q 'appsettings.example.json'; then
        print_success "appsettings.example.json still exists"
    else
        print_warning "appsettings.example.json not found (may need to be re-added)"
    fi

    echo ""
    if [ $ISSUES -eq 0 ]; then
        print_success "✓ All verification checks passed!"
        return 0
    else
        print_error "✗ Found $ISSUES issues"
        return 1
    fi
}

force_push() {
    print_header "Force Pushing to Remote"

    cd "$WORK_DIR/Tenacy.FMS.git"

    print_warning "⚠️  About to force push - this REWRITES history!"
    echo ""
    read -p "Continue with force push? (type 'yes'): " -r
    echo ""

    if [[ ! $REPLY =~ ^yes$ ]]; then
        print_error "Force push aborted"
        exit 1
    fi

    print_info "Force pushing all branches..."
    git push --force --all

    print_info "Force pushing all tags..."
    git push --force --tags

    print_success "Force push complete!"
}

show_next_steps() {
    print_header "Cleanup Complete - Next Steps"

    echo "1. Notify all developers to re-clone:"
    echo "   • Send team notification email"
    echo "   • Include re-sync instructions"
    echo "   • Set deadline for completion"
    echo ""

    echo "2. Verify on GitHub:"
    echo "   • Search for old passwords (should show no results)"
    echo "   • Check repository size decreased"
    echo "   • Verify files are gone from history"
    echo ""

    echo "3. Team re-sync (each developer):"
    echo "   • Save work: git stash"
    echo "   • Delete local: rm -rf Tenacy.FMS"
    echo "   • Clone fresh: git clone $REPO_URL"
    echo "   • Restore config files from .example"
    echo ""

    echo "4. Update documentation:"
    echo "   • Mark cleanup as complete"
    echo "   • Document completion date"
    echo "   • Update security audit status"
    echo ""

    print_info "Backup location:"
    if [ -f "$BACKUP_DIR/latest-backup.txt" ]; then
        cat "$BACKUP_DIR/latest-backup.txt"
    fi

    print_info "Work directory: $WORK_DIR"
    echo ""
}

# Main script
main() {
    print_header "Git History Cleanup - Tenacy.FMS"

    case "${1:-}" in
        --backup)
            check_prerequisites
            create_backup
            ;;

        --verify)
            if [ ! -d "$WORK_DIR/Tenacy.FMS.git" ]; then
                print_error "No repository to verify. Run with --full first."
                exit 1
            fi
            verify_cleanup
            ;;

        --full)
            check_prerequisites
            confirm_action
            create_backup
            prepare_cleanup_files
            clone_mirror
            run_bfg_cleanup
            cleanup_refs

            if verify_cleanup; then
                force_push
                show_next_steps
            else
                print_error "Verification failed. Fix issues before force pushing."
                exit 1
            fi
            ;;

        --help|*)
            echo "Usage: $0 [OPTION]"
            echo ""
            echo "Options:"
            echo "  --backup    Create backup only"
            echo "  --verify    Verify cleanup (after running)"
            echo "  --full      Run full cleanup process"
            echo "  --help      Show this help message"
            echo ""
            echo "Documentation: Documentation/Security/GIT_HISTORY_CLEANUP_GUIDE.md"
            exit 0
            ;;
    esac
}

main "$@"
