#!/bin/bash
# SSH Deploy Script with ntfy.sh notifications
# Usage: ./ssh-deploy.sh <project-name> [server]
#
# Configure these:
DEFAULT_SERVER="user@your-vps.com"
REMOTE_BASE="/var/www"
NTFY_TOPIC="deploys"  # Change to your topic

set -e

PROJECT=$1
SERVER=${2:-$DEFAULT_SERVER}
REMOTE_PATH="$REMOTE_BASE/$PROJECT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

notify() {
  local message=$1
  local title=${2:-"Deploy"}
  local priority=${3:-"default"}
  local tags=${4:-""}

  curl -s \
    -d "$message" \
    -H "Title: $title" \
    -H "Priority: $priority" \
    ${tags:+-H "Tags: $tags"} \
    "https://ntfy.sh/$NTFY_TOPIC" > /dev/null 2>&1 || true
}

if [ -z "$PROJECT" ]; then
  echo -e "${RED}Usage: ./ssh-deploy.sh <project-name> [server]${NC}"
  echo "Example: ./ssh-deploy.sh yes-my"
  exit 1
fi

echo -e "${YELLOW}📦 Deploying $PROJECT to $SERVER...${NC}"
notify "🚀 Starting deploy: $PROJECT" "Deploy Started" "default" "rocket"

# Build locally if package.json exists
if [ -f "package.json" ]; then
  echo -e "${YELLOW}Building...${NC}"
  npm run build 2>&1 || {
    notify "❌ Build failed for $PROJECT" "Build Failed" "urgent" "x"
    exit 1
  }
fi

# Deploy via rsync
echo -e "${YELLOW}Syncing files...${NC}"
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env.local' \
  --exclude '.env' \
  --exclude '*.log' \
  ./ "$SERVER:$REMOTE_PATH/"

# Install dependencies and restart
echo -e "${YELLOW}Installing deps and restarting...${NC}"
ssh "$SERVER" << EOF
  cd $REMOTE_PATH
  npm install --production --silent
  pm2 restart $PROJECT 2>/dev/null || pm2 start npm --name "$PROJECT" -- start
EOF

if [ $? -eq 0 ]; then
  notify "✅ $PROJECT deployed successfully" "Deploy Success" "high" "white_check_mark"
  echo -e "${GREEN}✅ Deployed successfully!${NC}"
else
  notify "❌ $PROJECT deployment FAILED" "Deploy Failed" "urgent" "rotating_light"
  echo -e "${RED}❌ Deployment failed!${NC}"
  exit 1
fi
