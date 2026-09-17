set -e
 
# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
 
# Parse arguments
ALIAS="$1"
COMMIT_MSG="$2"
REMOTE="${3:-origin}"
BRANCH="${4:-$(git rev-parse --abbrev-ref HEAD)}"
 
# Validate arguments
if [[ -z "$ALIAS" ]] || [[ -z "$COMMIT_MSG" ]]; then
    echo -e "${RED}Error: Missing arguments${NC}"
    echo "Usage: $0 <alias> \"commit message\" [remote] [branch]"
    echo ""
    echo "Available users:"
    for user in "${!USERS[@]}"; do
        IFS='|' read -r username email <<< "${USERS[$user]}"
        printf "  ${GREEN}%-12s${NC} %s <%s>\n" "$user" "$username" "$email"
    done | sort
    exit 1
fi
 
# Look up user from USERS array
if [[ -z "${USERS[$ALIAS]}" ]]; then
    echo -e "${RED}Error: Unknown user '$ALIAS'${NC}"
    exit 1
fi
 
IFS='|' read -r USER_NAME USER_EMAIL <<< "${USERS[$ALIAS]}"
 
# Check if we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi
 
# Store original config
ORIGINAL_NAME=$(git config --local user.name 2>/dev/null || git config --global user.name 2>/dev/null || echo "")
ORIGINAL_EMAIL=$(git config --local user.email 2>/dev/null || git config --global user.email 2>/dev/null || echo "")
 
if [[ -n "$ORIGINAL_NAME" ]]; then
    echo -e "${YELLOW}Current user: ${ORIGINAL_NAME} <${ORIGINAL_EMAIL}>${NC}"
fi
 
# Check if there are changes to commit
if git diff-index --quiet HEAD -- && git diff --quiet; then
    echo -e "${RED}Error: No changes to commit${NC}"
    exit 1
fi
 
# Switch to new user (local config only)
echo -e "${YELLOW}Switching to: ${USER_NAME} <${USER_EMAIL}>${NC}"
git config user.name "$USER_NAME"
git config user.email "$USER_EMAIL"
 
# Show what will be committed
echo -e "${YELLOW}Files to commit:${NC}"
git diff --cached --name-only || git diff --name-only
 
# Commit
echo -e "${YELLOW}Creating commit...${NC}"
git commit -m "$COMMIT_MSG"
COMMIT_SHA=$(git rev-parse --short HEAD)
echo -e "${GREEN}✓ Committed: ${COMMIT_SHA}${NC}"
 
# Verify commit author
COMMIT_AUTHOR=$(git log -1 --format="%an <%ae>")
echo -e "${GREEN}✓ Commit author: ${COMMIT_AUTHOR}${NC}"
 
# Push
echo -e "${YELLOW}Pushing to ${REMOTE}/${BRANCH}...${NC}"
git push "$REMOTE" "$BRANCH"
echo -e "${GREEN}✓ Pushed successfully${NC}"
 
# Restore original user
if [[ -n "$ORIGINAL_NAME" ]]; then
    echo -e "${YELLOW}Restoring original user: ${ORIGINAL_NAME}${NC}"
    git config user.name "$ORIGINAL_NAME"
fi
if [[ -n "$ORIGINAL_EMAIL" ]]; then
    git config user.email "$ORIGINAL_EMAIL"
fi
 
echo -e "${GREEN}✓ Done!${NC}"
 
