#!/bin/bash
# L3 Deep Mod Fork Automation Script
# Forks all hackable tool repositories to your GitHub org

set -e

# Configuration
GITHUB_ORG="${GITHUB_ORG:-your-org}"
FORK_PREFIX="${FORK_PREFIX:-hacked}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   L3 Deep Mod - Fork Automation Script     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"

# Tool repositories to fork
declare -A REPOS=(
    ["activepieces"]="activepieces/activepieces"
    ["formbricks"]="formbricks/formbricks"
    ["calcom"]="calcom/cal.com"
    ["uptime-kuma"]="louislam/uptime-kuma"
    ["novu"]="novuhq/novu"
    ["growthbook"]="growthbook/growthbook"
    ["payload"]="payloadcms/payload"
    ["typesense"]="typesense/typesense"
    ["infisical"]="Infisical/infisical"
    ["chatwoot"]="chatwoot/chatwoot"
)

# Check gh CLI
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) not found. Install it first.${NC}"
    exit 1
fi

# Check authentication
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}Not logged in. Running 'gh auth login'...${NC}"
    gh auth login
fi

echo ""
echo -e "${YELLOW}Forking repositories to: ${GITHUB_ORG}${NC}"
echo ""

for tool in "${!REPOS[@]}"; do
    repo="${REPOS[$tool]}"
    fork_name="${tool}-${FORK_PREFIX}"

    echo -e "📦 ${GREEN}Forking${NC} ${repo} → ${GITHUB_ORG}/${fork_name}"

    # Check if fork already exists
    if gh repo view "${GITHUB_ORG}/${fork_name}" &> /dev/null 2>&1; then
        echo -e "   ${YELLOW}⚠ Already exists, skipping${NC}"
    else
        gh repo fork "${repo}" --org "${GITHUB_ORG}" --fork-name "${fork_name}" --clone=false
        echo -e "   ${GREEN}✓ Forked${NC}"
    fi
done

echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}Fork automation complete!${NC}"
echo ""
echo -e "Next steps:"
echo -e "1. Clone forks: ${YELLOW}gh repo clone ${GITHUB_ORG}/<tool>-${FORK_PREFIX}${NC}"
echo -e "2. Apply L3 mods from: ${YELLOW}~/tech-stack-gems/hacked-tools/<tool>-mods/${NC}"
echo -e "3. Set up upstream: ${YELLOW}git remote add upstream <original-repo>${NC}"
echo -e "4. Sync regularly: ${YELLOW}git fetch upstream && git merge upstream/main${NC}"
