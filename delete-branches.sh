#!/bin/bash

# Branch Cleanup Script for Notebook_Studio
# This script helps delete unneeded branches both locally and remotely

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="HaggisSupper"
REPO_NAME="Notebook_Studio"

# Branches to delete (merged branch)
BRANCHES_TO_DELETE=(
  "copilot/fix-navigation-and-enhance-ui"
)

# Branches requiring review (draft PRs)
BRANCHES_REQUIRING_REVIEW=(
  "copilot/code-review-and-bug-hunting"
  "copilot/verify-output-functionality"
  "copilot/uiux-recommendations-genx"
  "copilot/uiux-genx-dark-interface"
  "copilot/update-build-and-installer-strategy"
  "copilot/merge-needed-changes"
  "copilot/check-app-compilation-status"
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

# Function to check if running in dry-run mode
is_dry_run() {
  [[ "${DRY_RUN:-false}" == "true" ]] || [[ "$1" == "--dry-run" ]]
}

# Function to delete local branch
delete_local_branch() {
  local branch=$1
  local force=${2:-false}
  
  if git show-ref --verify --quiet "refs/heads/$branch"; then
    if is_dry_run "$@"; then
      print_color "$YELLOW" "[DRY RUN] Would delete local branch: $branch"
    else
      if [[ "$force" == "true" ]]; then
        git branch -D "$branch" && print_color "$GREEN" "✓ Deleted local branch: $branch"
      else
        git branch -d "$branch" && print_color "$GREEN" "✓ Deleted local branch: $branch"
      fi
    fi
  else
    print_color "$YELLOW" "! Local branch not found: $branch"
  fi
}

# Function to delete remote branch
delete_remote_branch() {
  local branch=$1
  
  if git ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then
    if is_dry_run "$@"; then
      print_color "$YELLOW" "[DRY RUN] Would delete remote branch: $branch"
    else
      git push origin --delete "$branch" && print_color "$GREEN" "✓ Deleted remote branch: $branch"
    fi
  else
    print_color "$YELLOW" "! Remote branch not found: $branch"
  fi
}

# Function to show branch info
show_branch_info() {
  local branch=$1
  
  echo ""
  print_color "$BLUE" "Branch: $branch"
  
  # Check if branch exists locally
  if git show-ref --verify --quiet "refs/heads/$branch"; then
    print_color "$GREEN" "  ✓ Exists locally"
    local last_commit=$(git log -1 --format="%h - %s (%ar)" "$branch" 2>/dev/null || echo "N/A")
    echo "    Last commit: $last_commit"
  else
    print_color "$YELLOW" "  ! Not found locally"
  fi
  
  # Check if branch exists remotely
  if git ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then
    print_color "$GREEN" "  ✓ Exists remotely"
  else
    print_color "$YELLOW" "  ! Not found remotely"
  fi
}

# Function to display usage
usage() {
  cat << EOF
Usage: $0 [OPTIONS]

Delete unneeded branches from the Notebook_Studio repository.

OPTIONS:
  --dry-run           Show what would be deleted without actually deleting
  --merged-only       Only delete branches that are confirmed merged
  --force             Force delete unmerged branches (use with caution)
  --local-only        Only delete local branches
  --remote-only       Only delete remote branches
  --review            Interactive review mode for draft PR branches
  --info              Show information about branches without deleting
  --help              Display this help message

EXAMPLES:
  # Preview what will be deleted
  $0 --dry-run

  # Delete only merged branches (safest)
  $0 --merged-only

  # Delete merged branches locally and remotely
  $0

  # Show branch information
  $0 --info

  # Interactive review of draft PR branches
  $0 --review

EOF
}

# Main script logic
main() {
  local mode="all"
  local force=false
  
  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case $1 in
      --dry-run)
        DRY_RUN=true
        shift
        ;;
      --merged-only)
        mode="merged"
        shift
        ;;
      --force)
        force=true
        shift
        ;;
      --local-only)
        mode="local"
        shift
        ;;
      --remote-only)
        mode="remote"
        shift
        ;;
      --review)
        mode="review"
        shift
        ;;
      --info)
        mode="info"
        shift
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
  
  # Display header
  print_header "Branch Cleanup for $REPO_OWNER/$REPO_NAME"
  
  if is_dry_run; then
    print_color "$YELLOW" "🔍 DRY RUN MODE - No changes will be made"
    echo ""
  fi
  
  # Info mode
  if [[ "$mode" == "info" ]]; then
    print_header "Branch Information"
    
    print_color "$GREEN" "Merged Branches (safe to delete):"
    for branch in "${BRANCHES_TO_DELETE[@]}"; do
      show_branch_info "$branch"
    done
    
    echo ""
    print_color "$YELLOW" "Branches Requiring Review:"
    for branch in "${BRANCHES_REQUIRING_REVIEW[@]}"; do
      show_branch_info "$branch"
    done
    
    exit 0
  fi
  
  # Review mode
  if [[ "$mode" == "review" ]]; then
    print_header "Interactive Review Mode"
    
    for branch in "${BRANCHES_REQUIRING_REVIEW[@]}"; do
      show_branch_info "$branch"
      
      echo ""
      read -p "Delete this branch? (y/N): " -n 1 -r
      echo ""
      
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ "$mode" != "remote" ]]; then
          delete_local_branch "$branch" "$force"
        fi
        if [[ "$mode" != "local" ]]; then
          delete_remote_branch "$branch"
        fi
      else
        print_color "$BLUE" "Skipping: $branch"
      fi
      echo ""
    done
    
    exit 0
  fi
  
  # Delete merged branches
  print_header "Deleting Merged Branches"
  
  for branch in "${BRANCHES_TO_DELETE[@]}"; do
    print_color "$BLUE" "Processing: $branch"
    
    if [[ "$mode" == "all" || "$mode" == "merged" || "$mode" == "local" ]]; then
      delete_local_branch "$branch"
    fi
    
    if [[ "$mode" == "all" || "$mode" == "merged" || "$mode" == "remote" ]]; then
      delete_remote_branch "$branch"
    fi
  done
  
  # Summary
  print_header "Cleanup Summary"
  
  if is_dry_run; then
    print_color "$YELLOW" "This was a dry run. No branches were actually deleted."
    print_color "$YELLOW" "Run without --dry-run to perform actual deletion."
  else
    print_color "$GREEN" "✓ Cleanup completed successfully!"
  fi
  
  echo ""
  print_color "$BLUE" "Branches requiring review:"
  for branch in "${BRANCHES_REQUIRING_REVIEW[@]}"; do
    echo "  - $branch"
  done
  
  echo ""
  print_color "$YELLOW" "💡 Use --review flag to interactively review and delete draft PR branches"
  print_color "$YELLOW" "💡 See BRANCH_CLEANUP.md for detailed documentation"
  echo ""
}

# Run main function
main "$@"
