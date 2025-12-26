#!/bin/bash
# =============================================================================
# PRE-DEPLOY VALIDATION SCRIPT
# =============================================================================
# Runs comprehensive checks before deployment
# Usage: ./validate-before-deploy.sh [staging|production] [app_directory]
#
# Exit codes:
#   0 - All checks passed
#   1 - Tests failed
#   2 - Secrets detected in code
#   3 - Build failed
#   4 - Other validation error
# =============================================================================

set -e

ENV="${1:-staging}"
APP_DIR="${2:-.}"
SOUND_HOOKS="$HOME/.claude/sound-hooks.sh"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "==========================================="
echo "🔍 PRE-DEPLOY VALIDATION"
echo "==========================================="
echo "Environment: $ENV"
echo "Directory: $APP_DIR"
echo "==========================================="

cd "$APP_DIR"

# Track failures
FAILED=0
WARNINGS=0

# =============================================================================
# 1. CHECK FOR SECRETS IN CODE
# =============================================================================
echo ""
echo "📌 Checking for exposed secrets..."

SECRET_PATTERNS=(
    "password\s*=\s*['\"][^'\"]+['\"]"
    "api_key\s*=\s*['\"][^'\"]+['\"]"
    "secret\s*=\s*['\"][^'\"]+['\"]"
    "token\s*=\s*['\"][^'\"]+['\"]"
    "mongodb://[^[:space:]]+"
    "postgres://[^[:space:]]+"
    "mysql://[^[:space:]]+"
    "sk_live_[a-zA-Z0-9]+"
    "sk_test_[a-zA-Z0-9]+"
    "AKIA[A-Z0-9]{16}"
    "eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+"
)

SECRETS_FOUND=0
for pattern in "${SECRET_PATTERNS[@]}"; do
    if grep -rE "$pattern" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" --include="*.json" --exclude-dir=node_modules --exclude-dir=.git . 2>/dev/null; then
        SECRETS_FOUND=1
    fi
done

if [ $SECRETS_FOUND -eq 1 ]; then
    echo -e "${RED}❌ SECRETS DETECTED IN CODE!${NC}"
    if [ "$ENV" == "production" ]; then
        echo -e "${RED}BLOCKING: Cannot deploy to production with exposed secrets.${NC}"
        exit 2
    else
        echo -e "${YELLOW}WARNING: Secrets detected. Review before production deploy.${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${GREEN}✅ No secrets found in code${NC}"
fi

# =============================================================================
# 2. CHECK .ENV FILES NOT COMMITTED
# =============================================================================
echo ""
echo "📌 Checking .env files..."

if git ls-files --error-unmatch .env .env.local .env.production 2>/dev/null; then
    echo -e "${RED}❌ .env files are tracked in git!${NC}"
    if [ "$ENV" == "production" ]; then
        exit 2
    fi
    ((WARNINGS++))
else
    echo -e "${GREEN}✅ .env files not tracked${NC}"
fi

# =============================================================================
# 3. RUN TESTS (if available)
# =============================================================================
echo ""
echo "📌 Running tests..."

if [ -f "package.json" ] && grep -q '"test"' package.json; then
    if npm test 2>&1; then
        echo -e "${GREEN}✅ Tests passed${NC}"
    else
        echo -e "${RED}❌ Tests failed!${NC}"
        if [ "$ENV" == "production" ]; then
            exit 1
        fi
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠️ No test script found${NC}"
    ((WARNINGS++))
fi

# =============================================================================
# 4. BUILD CHECK
# =============================================================================
echo ""
echo "📌 Running build check..."

if [ -f "package.json" ] && grep -q '"build"' package.json; then
    if npm run build 2>&1; then
        echo -e "${GREEN}✅ Build successful${NC}"
    else
        echo -e "${RED}❌ Build failed!${NC}"
        exit 3
    fi
else
    echo -e "${YELLOW}⚠️ No build script found${NC}"
fi

# =============================================================================
# 5. LINT CHECK (if available)
# =============================================================================
echo ""
echo "📌 Running lint check..."

if [ -f "package.json" ] && grep -q '"lint"' package.json; then
    if npm run lint 2>&1; then
        echo -e "${GREEN}✅ Lint passed${NC}"
    else
        echo -e "${YELLOW}⚠️ Lint warnings/errors${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠️ No lint script found${NC}"
fi

# =============================================================================
# 6. TYPE CHECK (for TypeScript)
# =============================================================================
echo ""
echo "📌 Running type check..."

if [ -f "tsconfig.json" ]; then
    if npx tsc --noEmit 2>&1; then
        echo -e "${GREEN}✅ Type check passed${NC}"
    else
        echo -e "${YELLOW}⚠️ Type errors found${NC}"
        ((WARNINGS++))
    fi
else
    echo "ℹ️ No TypeScript config found (skipping)"
fi

# =============================================================================
# 7. DEPENDENCY AUDIT
# =============================================================================
echo ""
echo "📌 Checking for vulnerable dependencies..."

if npm audit --production 2>&1 | grep -q "found 0 vulnerabilities"; then
    echo -e "${GREEN}✅ No vulnerabilities found${NC}"
else
    VULN_COUNT=$(npm audit --production 2>&1 | grep -oP '\d+ vulnerabilities' | head -1 || echo "unknown")
    echo -e "${YELLOW}⚠️ Vulnerabilities found: $VULN_COUNT${NC}"
    ((WARNINGS++))
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo "==========================================="
echo "📊 VALIDATION SUMMARY"
echo "==========================================="

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️ Warnings: $WARNINGS${NC}"
fi

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ VALIDATION FAILED${NC}"
    [[ -x "$SOUND_HOOKS" ]] && $SOUND_HOOKS error "deploy validation" 2>/dev/null &
    exit 4
else
    echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
    echo ""
    echo "Ready to deploy to $ENV"
    [[ -x "$SOUND_HOOKS" ]] && $SOUND_HOOKS success "deploy validation" 2>/dev/null &
    exit 0
fi
