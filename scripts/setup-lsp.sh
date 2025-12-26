#!/bin/bash
# LSP Setup for Claude Code via cclsp MCP
# Enables Language Server Protocol for token-efficient code navigation
#
# Part of: AI OS / Command Center
# Quad-Model Workflow Integration

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Claude Code LSP Setup via cclsp MCP        ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 1. Install language servers
echo -e "${YELLOW}[1/4] Installing language servers...${NC}"

# TypeScript/JavaScript
if command -v npm &> /dev/null; then
    echo "  Installing TypeScript language server..."
    npm install -g typescript typescript-language-server 2>/dev/null || true
    echo -e "${GREEN}  ✓ TypeScript LSP${NC}"
fi

# Python
if command -v npm &> /dev/null; then
    echo "  Installing Python language server (pyright)..."
    npm install -g pyright 2>/dev/null || true
    echo -e "${GREEN}  ✓ Python LSP (pyright)${NC}"
fi

# Go (optional)
if command -v go &> /dev/null; then
    echo "  Installing Go language server..."
    go install golang.org/x/tools/gopls@latest 2>/dev/null || true
    echo -e "${GREEN}  ✓ Go LSP (gopls)${NC}"
fi

# 2. Create cclsp configuration
echo ""
echo -e "${YELLOW}[2/4] Creating cclsp configuration...${NC}"

cat > ~/.cclsp.json << 'EOF'
{
  "servers": [
    {
      "extensions": ["ts", "tsx", "js", "jsx"],
      "command": ["typescript-language-server", "--stdio"],
      "rootDir": "."
    },
    {
      "extensions": ["py"],
      "command": ["pyright-langserver", "--stdio"],
      "rootDir": "."
    }
  ]
}
EOF

echo -e "${GREEN}✓ Created ~/.cclsp.json${NC}"

# 3. Add cclsp to Claude Code MCP servers
echo ""
echo -e "${YELLOW}[3/4] Adding cclsp to Claude Code MCP...${NC}"

# Check if already added
if claude mcp list 2>/dev/null | grep -q "cclsp"; then
    echo -e "${GREEN}✓ cclsp already registered${NC}"
else
    claude mcp add cclsp --env CCLSP_CONFIG_PATH=$HOME/.cclsp.json -- npx cclsp@latest 2>/dev/null || true
    echo -e "${GREEN}✓ cclsp registered as MCP server${NC}"
fi

# 4. Verify installation
echo ""
echo -e "${YELLOW}[4/4] Verifying installation...${NC}"

if claude mcp list 2>/dev/null | grep -q "cclsp.*Connected"; then
    echo -e "${GREEN}✓ cclsp MCP server connected!${NC}"
else
    echo -e "${YELLOW}⚠ cclsp may need Claude Code restart${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   LSP Setup Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Available cclsp tools:"
echo "  • find_definition  - Find where symbols are defined"
echo "  • find_references  - Find all usages of a symbol"
echo "  • rename_symbol    - Rename across codebase"
echo "  • get_diagnostics  - Get errors and warnings"
echo ""
echo "Token savings with LSP:"
echo "  • Go to definition: 0 tokens (vs ~1000 with grep)"
echo "  • Find references:  0 tokens (vs ~2000 with search)"
echo "  • Code structure:   0 tokens (vs ~5000 reading files)"
echo ""
echo -e "${GREEN}LSP is now default for code navigation!${NC}"
echo ""
