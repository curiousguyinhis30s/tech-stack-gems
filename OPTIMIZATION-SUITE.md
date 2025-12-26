# Claude Code Optimization Suite
## Token Reduction & Speed Improvements

Based on research into biggest token wasters and deterministic replacements.

---

## Current Optimizations (Active)

### 1. cclsp - LSP for Claude Code
**Token Savings: ~10,000 tokens/session**

| Operation | Before (grep/read) | After (cclsp) |
|-----------|-------------------|---------------|
| Go to definition | ~1,000 tokens | 0 tokens |
| Find references | ~2,000 tokens | 0 tokens |
| Code structure | ~5,000 tokens | 0 tokens |
| Rename symbol | ~3,000 tokens | 0 tokens |

**Tools Available:**
- `find_definition` - Find where a symbol is defined
- `find_references` - Find all usages of a symbol
- `rename_symbol` - Rename across codebase
- `get_diagnostics` - Get errors and warnings
- `restart_server` - Restart LSP for a language

**Config:** `~/.cclsp.json`
```json
{
  "servers": [
    {"extensions": ["ts","tsx","js","jsx"], "command": ["typescript-language-server","--stdio"]},
    {"extensions": ["py"], "command": ["pyright-langserver","--stdio"]}
  ]
}
```

---

### 2. Memory MCP - Project Memory
**Token Savings: ~5,000 tokens/session**

Replaces:
- Re-reading project structure each session
- Remembering past decisions
- Context about codebase patterns

**Tools Available:**
- `create_entities` - Store knowledge
- `create_relations` - Link entities
- `search_nodes` - Find stored knowledge

---

### 3. Tri-Model Workflow (Gemini + GLM + Claude)
**Token Savings: ~80% Claude tokens**

| Model | Role | Use For |
|-------|------|---------|
| Gemini | Research | Web search, docs, current standards |
| GLM 4.7 | Builder | Code generation, tests, docs |
| Claude | Brain | Orchestration, synthesis, decisions |

**Commands:**
```bash
~/.claude/gemini-execute.sh "research query"
~/.claude/glm-execute.sh "implementation task"
```

---

## Recommended Additions

### 4. tree-sitter CLI (AST Parsing)
**Potential Savings: ~3,000 tokens/session**

```bash
npm install -g tree-sitter-cli
```

Use for:
- Structural code queries
- Syntax-aware refactoring
- Language-agnostic parsing

---

### 5. turbo (Build Caching)
**Potential Savings: ~50% build time**

```bash
npm install -g turbo
```

Use for:
- Incremental builds
- Test caching
- Monorepo optimization

---

### 6. Exa MCP (Fast Doc Search)
**Requires: Exa API key**

Better than web search for:
- Technical documentation
- Library usage examples
- Current best practices

---

## Optimization Decision Tree

```
NEW CODE NAVIGATION TASK
       │
       ▼
┌──────────────────┐
│ Need definition  │──YES──▶ cclsp:find_definition (0 tokens)
│ or references?   │
└────────┬─────────┘
         │ NO
         ▼
┌──────────────────┐
│ Need project     │──YES──▶ Memory MCP (cached context)
│ context?         │
└────────┬─────────┘
         │ NO
         ▼
┌──────────────────┐
│ Need current     │──YES──▶ Gemini (research)
│ info/research?   │
└────────┬─────────┘
         │ NO
         ▼
┌──────────────────┐
│ Code generation  │──YES──▶ GLM (implementation)
│ or testing?      │
└────────┬─────────┘
         │ NO
         ▼
      Claude (reasoning/synthesis)
```

---

## Token Waste Patterns to Avoid

| Pattern | Token Cost | Replacement |
|---------|------------|-------------|
| Reading entire files | 500-2000 | cclsp:find_definition |
| Grep for definitions | 1000+ | cclsp:find_references |
| Re-learning project | 3000+ | Memory MCP |
| Web research | 2000+ | Gemini |
| Code generation | 1000+ | GLM |
| Full file rewrites | 500+ | Edit tool with diff |

---

## Summary of Savings

| Optimization | Tokens Saved |
|--------------|--------------|
| cclsp (LSP) | ~10,000/session |
| Memory MCP | ~5,000/session |
| Tri-Model | ~80% reduction |
| tree-sitter | ~3,000/session |
| **TOTAL** | **~90%+ reduction** |

---

## Quick Setup

```bash
# Already configured:
# - cclsp MCP (LSP)
# - Memory MCP

# Run full optimization:
~/tech-stack-gems/scripts/optimize-claude.sh

# Verify setup:
~/tech-stack-gems/scripts/verify-lsp.sh
```

---

*Part of: AI OS / Command Center*
*Last updated: 2025-12-26*
