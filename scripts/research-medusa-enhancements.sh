#!/bin/bash
# Medusa.js Enhancement Research Script
# Run this in a NEW session to have GLM research Medusa best practices
# Part of: Tech Stack Gems

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

OUTPUT_DIR="$HOME/tech-stack-gems/research/medusa"
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Medusa.js Enhancement Research (via GLM)   ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Research topics - GLM will search and summarize each
TOPICS=(
    "Medusa.js best plugins and extensions 2025|plugins.md"
    "Medusa.js production deployment best practices Docker Kubernetes|deployment.md"
    "Medusa.js custom storefront Next.js integration guide|storefront.md"
    "Medusa.js multi-vendor marketplace setup tutorial|marketplace.md"
    "Medusa.js subscription billing recurring payments implementation|subscriptions.md"
    "Medusa.js performance optimization caching Redis|performance.md"
    "Medusa.js vs Shopify migration guide|migration.md"
)

for TOPIC_FILE in "${TOPICS[@]}"; do
    IFS='|' read -r TOPIC FILE <<< "$TOPIC_FILE"
    echo -e "${GREEN}Researching: $TOPIC${NC}"

    # Use GLM for research (cheaper than Claude)
    ~/.claude/glm-execute.sh "Search the internet and summarize: $TOPIC. Format as markdown with bullet points. Include code examples where helpful. Be comprehensive but concise." > "$OUTPUT_DIR/$FILE" 2>/dev/null &
done

echo ""
echo "Research running in parallel..."
echo "Output directory: $OUTPUT_DIR"
wait

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   Research Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Files created:"
ls -la "$OUTPUT_DIR"
echo ""
echo "Read with: cat $OUTPUT_DIR/<filename>"
