#!/bin/bash

# Automated Branch Merge Script for Notebook_Studio
# Attempts to merge all branches to main, handling conflicts appropriately

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="HaggisSupper"
REPO_NAME="Notebook_Studio"

# Branches already merged
MERGED_BRANCHES=(
  "copilot/fix-navigation-and-enhance-ui"
  "copilot/check-app-compilation-status"
  "copilot/merge-needed-changes"
  "copilot/update-build-and-installer-strategy"
)

# Branches pending merge (likely with conflicts)
PENDING_BRANCHES=(
  "copilot/code-review-and-bug-hunting"
  "copilot/verify-output-functionality"
  "copilot/uiux-recommendations-genx"
  "copilot/uiux-genx-dark-interface"
)

# Function to print colored output
print_color() {
  local color=$1
  shift
  echo -e "${color}$@${NC}"
}

# Function to print section header
print_header() {
  echo ""
  print_color "$BLUE" "============================================"
  print_color "$BLUE" "$1"
  print_color "$BLUE" "============================================"
  echo ""
}

# Function to check if in dry-run mode
is_dry_run() {
  [[ "${DRY_RUN:-false}" == "true" ]] || [[ "$1" == "--dry-run" ]]
}

# Function to check if branch exists
branch_exists() {
  git show-ref --verify --quiet "refs/heads/$1" 2>/dev/null
}

# Function to check if remote branch exists
remote_branch_exists() {
  git ls-remote --exit-code --heads origin "$1" >/dev/null 2>&1
}

# Function to attempt merge
try_merge() {
  local branch=$1
  local merge_msg=$2
  
  print_color "$BLUE" "Attempting to merge: $branch"
  
  if ! branch_exists "$branch"; then
    print_color "$YELLOW" "! Branch not found locally, fetching..."
    if remote_branch_exists "$branch"; then
      git fetch origin "$branch:$branch" || {
        print_color "$RED" "✗ Failed to fetch $branch"
        return 1
      }
    else
      print_color "$RED" "✗ Branch $branch not found remotely"
      return 1
    fi
  fi
  
  if is_dry_run "$@"; then
    print_color "$YELLOW" "[DRY RUN] Would attempt merge of: $branch"
    # Test merge without committing
    git merge --no-commit --no-ff "$branch" 2>&1 | head -20
    local result=$?
    git merge --abort 2>/dev/null
    return $result
  else
    # Attempt merge with unrelated histories flag
    if git merge --no-ff --allow-unrelated-histories "$branch" -m "$merge_msg" 2>&1 | tee /tmp/merge-output.txt; then
      print_color "$GREEN" "✓ Successfully merged: $branch"
      return 0
    else
      # Check if it's a conflict
      if git status | grep -q "Unmerged paths"; then
        print_color "$YELLOW" "⚠ Merge conflicts detected in $branch"
        git status --short | grep "^UU\\|^AA\\|^DD" || true
        
        print_color "$YELLOW" "Conflict details:"
        git diff --name-only --diff-filter=U | head -10
        
        print_color "$RED" "Please resolve conflicts manually and then run:"
        echo "  git add ."
        echo "  git commit -m \"$merge_msg\""
        echo "  git push origin main"
        echo ""
        print_color "$YELLOW" "Or abort this merge with: git merge --abort"
        return 1
      else
        print_color "$RED" "✗ Merge failed: $branch"
        cat /tmp/merge-output.txt
        return 1
      fi
    fi
  fi
}

# Function to display usage
usage() {
  cat << EOF
Usage: $0 [OPTIONS]

Merge all branches into main for the Notebook_Studio repository.

OPTIONS:
  --dry-run           Show what would be merged without actually merging
  --already-merged    Show branches already merged
  --pending-only      Only attempt pending branches
  --interactive       Interactive mode with prompts for each branch
  --strategy <name>   Merge strategy: ours, theirs, patience (default: recursive)
  --help              Display this help message

EXAMPLES:
  # Preview what will be merged
  $0 --dry-run

  # Attempt all pending merges
  $0 --pending-only

  # Interactive mode
  $0 --interactive

  # Use specific merge strategy
  $0 --strategy ours

NOTES:
  - This script expects you to be on the 'main' branch
  - It will stop on the first merge conflict for manual resolution
  - Already merged branches will be skipped automatically

EOF
}

# Main script logic
main() {
  local mode="all"
  local strategy="recursive"
  local interactive=false
  
  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case $1 in
      --dry-run)
        DRY_RUN=true
        shift
        ;;
      --already-merged)
        mode="already"
        shift
        ;;
      --pending-only)
        mode="pending"
        shift
        ;;
      --interactive)
        interactive=true
        shift
        ;;
      --strategy)
        strategy="$2"
        shift 2
        ;;
      --help)
        usage
        exit 0
        ;;
      *)
        print_color "$RED" "Unknown option: $1"
        usage
        exit 1
        ;;
    esac
  done
  
  # Check if on main branch
  current_branch=$(git branch --show-current)
  if [[ "$current_branch" != "main" && "$DRY_RUN" != "true" ]]; then
    print_color "$RED" "Error: You must be on the 'main' branch to run this script"
    print_color "$YELLOW" "Current branch: $current_branch"
    print_color "$YELLOW" "Run: git checkout main"
    exit 1
  fi
  
  # Display header
  print_header "Branch Merge Automation for $REPO_OWNER/$REPO_NAME"
  
  if is_dry_run; then
    print_color "$YELLOW" "🔍 DRY RUN MODE - No actual merges will be performed"
    echo ""
  fi
  
  # Show already merged branches
  if [[ "$mode" == "already" || "$mode" == "all" ]]; then
    print_header "Already Merged Branches"
    
    for branch in "${MERGED_BRANCHES[@]}"; do
      print_color "$GREEN" "✓ $branch"
    done
  fi
  
  # Attempt pending merges
  if [[ "$mode" == "pending" || "$mode" == "all" ]]; then
    print_header "Pending Branches (Requiring Merge)"
    
    local success_count=0
    local fail_count=0
    
    for branch in "${PENDING_BRANCHES[@]}"; do
      if [[ "$interactive" == "true" ]]; then
        echo ""
        read -p "Merge $branch? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
          print_color "$BLUE" "Skipping: $branch"
          continue
        fi
      fi
      
      local msg="Merge $branch into main"
      
      if try_merge "$branch" "$msg"; then
        ((success_count++))
      else
        ((fail_count++))
        if [[ "$DRY_RUN" != "true" ]]; then
          print_color "$RED" "Stopping due to merge conflict or error"
          print_color "$YELLOW" "Please resolve conflicts and re-run this script"
          break
        fi
      fi
    done
    
    # Summary
    print_header "Merge Summary"
    print_color "$GREEN" "✓ Successful merges: $success_count"
    if [[ $fail_count -gt 0 ]]; then
      print_color "$RED" "✗ Failed merges: $fail_count"
    fi
  fi
  
  # Final instructions
  echo ""
  print_color "$BLUE" "Next Steps:"
  if [[ "$DRY_RUN" == "true" ]]; then
    print_color "$YELLOW" "1. Review the dry-run output above"
    print_color "$YELLOW" "2. Run without --dry-run to perform actual merges"
  else
    print_color "$YELLOW" "1. Review merged changes: git log --oneline -10"
    print_color "$YELLOW" "2. Test the application: npm run build && npm run dev"
    print_color "$YELLOW" "3. Push to remote: git push origin main"
    print_color "$YELLOW" "4. Delete merged branches (see delete-branches.sh)"
  fi
  
  echo ""
  print_color "$BLUE" "For detailed merge instructions, see: MERGE_GUIDE.md"
  echo ""
}

# Run main function
main "$@"
