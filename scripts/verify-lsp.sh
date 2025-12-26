#!/bin/bash
# LSP Verification Script
# Run after Claude Code restart to verify LSP is working

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}   Claude Code LSP Verification                ${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check 1: Environment variable
echo -e "${YELLOW}[1/4] Checking ENABLE_LSP_TOOLS...${NC}"
if [ "$ENABLE_LSP_TOOLS" = "1" ]; then
    echo -e "${GREEN}✓ ENABLE_LSP_TOOLS=1${NC}"
else
    echo -e "${RED}✗ ENABLE_LSP_TOOLS not set. Run: source ~/.zshrc${NC}"
fi

# Check 2: TypeScript language server
echo ""
echo -e "${YELLOW}[2/4] Checking TypeScript LSP...${NC}"
if command -v typescript-language-server &> /dev/null; then
    VERSION=$(typescript-language-server --version)
    echo -e "${GREEN}✓ typescript-language-server v$VERSION${NC}"
else
    echo -e "${RED}✗ typescript-language-server not found${NC}"
    echo "  Install: npm install -g typescript-language-server"
fi

# Check 3: Python language server
echo ""
echo -e "${YELLOW}[3/4] Checking Python LSP (pyright)...${NC}"
if command -v pyright-langserver &> /dev/null; then
    VERSION=$(pyright --version)
    echo -e "${GREEN}✓ pyright-langserver ($VERSION)${NC}"
else
    echo -e "${RED}✗ pyright-langserver not found${NC}"
    echo "  Install: npm install -g pyright"
fi

# Check 4: Settings.json LSP config
echo ""
echo -e "${YELLOW}[4/4] Checking settings.json LSP config...${NC}"
if grep -q '"lsp"' ~/.claude/settings.json 2>/dev/null; then
    echo -e "${GREEN}✓ LSP configuration found in settings.json${NC}"
else
    echo -e "${RED}✗ LSP configuration missing in settings.json${NC}"
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "To test LSP in Claude Code, try:"
echo ""
echo '  LSP(operation="documentSymbol", filePath="example.ts", line=1, character=1)'
echo '  LSP(operation="goToDefinition", filePath="example.ts", line=10, character=5)'
echo ""
echo -e "${GREEN}If LSP still doesn't work, restart Claude Code.${NC}"
echo ""
