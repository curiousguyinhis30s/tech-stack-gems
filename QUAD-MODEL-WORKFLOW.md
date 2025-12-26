# QUAD-MODEL WORKFLOW: LSP + TRI-MODEL INTEGRATION

## The Evolution: Tri-Model → Quad-Model

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     PHASE 0: LSP - DETERMINISTIC LAYER                    │
│  BEFORE any model inference, use deterministic code navigation:           │
│  ✓ Go to definition (0 tokens vs ~1000 with grep)                        │
│  ✓ Find references (0 tokens vs ~2000 with search)                       │
│  ✓ Get hover info/types (0 tokens vs ~500 reading files)                 │
│  ✓ Document symbols (0 tokens vs ~5000 reading full files)               │
│                                                                          │
│  LSP saves Claude tokens by providing EXACT answers without inference.   │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         CLAUDE OPUS - THE BRAIN                           │
│  ONLY use Claude for:                                                     │
│  ✓ Understanding user intent                                              │
│  ✓ Strategic planning & architecture decisions                            │
│  ✓ Complex debugging requiring chain-of-thought                           │
│  ✓ Synthesizing results from LSP + workers                                │
│  ✓ Final quality review & approval                                        │
└───────────────────────────┬──────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ GEMINI PRO    │   │  GLM 4.7      │   │  GLM 4.7      │
│ Researcher    │   │  Builder      │   │  Validator    │
│               │   │               │   │               │
│ • Research    │   │ • Code impl   │   │ • Tests       │
│ • Current     │   │ • APIs        │   │ • Lint        │
│   events      │   │ • Features    │   │ • Review      │
│ • Standards   │   │ • Docs        │   │ • Security    │
└───────────────┘   └───────────────┘   └───────────────┘
```

## 4-PHASE WORKFLOW (MANDATORY)

### PHASE 0: LSP FIRST (Deterministic - 0 Tokens)

**Before ANY LLM inference, use LSP for code understanding:**

```
When user asks about code:
1. LSP goToDefinition → Get exact function location
2. LSP findReferences → Get all usages
3. LSP hover → Get type information
4. LSP documentSymbol → Get file structure

Claude receives EXACT data, no inference needed.
```

**LSP Operations in Claude Code:**
```bash
# Go to definition
LSP(operation="goToDefinition", filePath="src/auth.ts", line=42, character=15)

# Find all references
LSP(operation="findReferences", filePath="src/auth.ts", line=42, character=15)

# Get hover info (types, docs)
LSP(operation="hover", filePath="src/auth.ts", line=42, character=15)

# Get all symbols in file
LSP(operation="documentSymbol", filePath="src/auth.ts", line=1, character=1)

# Search symbols across workspace
LSP(operation="workspaceSymbol", filePath="src/auth.ts", line=1, character=1)

# Find implementations
LSP(operation="goToImplementation", filePath="src/types.ts", line=10, character=20)

# Call hierarchy
LSP(operation="prepareCallHierarchy", filePath="src/api.ts", line=50, character=10)
LSP(operation="incomingCalls", filePath="src/api.ts", line=50, character=10)
LSP(operation="outgoingCalls", filePath="src/api.ts", line=50, character=10)
```

### PHASE 1: RESEARCH (Gemini)

**After LSP provides deterministic facts, use Gemini for contextual research:**
```bash
~/.claude/gemini-execute.sh "best practices for [topic] 2025"
~/.claude/gemini-execute.sh "security considerations for [pattern]"
```

### PHASE 2: IMPLEMENTATION (GLM)

**Use GLM for code generation based on LSP facts + research:**
```bash
~/.claude/glm-execute.sh "implement [feature] following [pattern from LSP]"
~/.claude/glm-execute.sh "write tests for [function LSP showed]"
```

### PHASE 3: SYNTHESIS (Claude)

**Claude synthesizes all inputs:**
- LSP deterministic facts
- Gemini research findings
- GLM implementation outputs
- Final integration and approval

## TOKEN SAVINGS MATRIX

| Operation | Without LSP | With LSP | Savings |
|-----------|-------------|----------|---------|
| Find definition | ~1000 tokens (grep + read) | 0 tokens | 100% |
| Find references | ~2000 tokens (search) | 0 tokens | 100% |
| Get types | ~500 tokens (read file) | 0 tokens | 100% |
| File structure | ~5000 tokens (read full) | 0 tokens | 100% |
| Code understanding | ~8500 tokens total | 0 tokens | 100% |

**Per-session savings: 10,000-50,000 tokens**

## DECISION TREE: LSP vs LLM

```
CODE NAVIGATION TASK
       │
       ▼
┌────────────────────┐
│ Need exact         │
│ definition/refs?   │──YES──▶ LSP (0 tokens)
└─────────┬──────────┘
          │ NO
          ▼
┌────────────────────┐
│ Need current       │
│ info/research?     │──YES──▶ GEMINI
└─────────┬──────────┘
          │ NO
          ▼
┌────────────────────┐
│ Need code/tests/   │
│ implementation?    │──YES──▶ GLM
└─────────┬──────────┘
          │ NO
          ▼
┌────────────────────┐
│ Complex decision   │
│ or architecture?   │──YES──▶ CLAUDE
└─────────┬──────────┘
          │ NO
          ▼
       DEFAULT: GLM
```

## EXAMPLE: DEBUGGING A BUG

**Without Quad-Model (wasteful):**
```
1. Read file to find function → ~500 tokens
2. Search for all usages → ~2000 tokens
3. Read each file → ~3000 tokens
4. Claude thinks → ~1000 tokens
Total: ~6500 Claude tokens
```

**With Quad-Model (efficient):**
```
1. LSP goToDefinition → 0 tokens
2. LSP findReferences → 0 tokens
3. Claude gets exact facts → ~100 tokens
4. GLM suggests fix → external
Total: ~100 Claude tokens (98% savings)
```

## INTEGRATION WITH WORKFLOWS

### For "Where is X defined?"
```
1. LSP goToDefinition → Exact location
2. Done. No LLM needed.
```

### For "How is X used?"
```
1. LSP findReferences → All usages
2. Claude summarizes patterns → Minimal tokens
```

### For "Refactor X to Y"
```
1. LSP findReferences → All locations
2. GLM generates refactored code
3. Claude reviews and applies
```

### For "Add feature to module"
```
1. LSP documentSymbol → Module structure
2. Gemini research → Best practices
3. GLM implementation → Code
4. Claude integration → Final review
```

## SUPPORTED LANGUAGES

| Language | LSP Server | Status |
|----------|------------|--------|
| TypeScript/JavaScript | typescript-language-server | ✅ Installed |
| Python | pyright | ✅ Installed |
| Go | gopls | ✅ Installed |
| Rust | rust-analyzer | Available |
| Elixir | elixir-ls | Available |

## SETUP VERIFICATION

```bash
# Check if LSP is enabled
echo $ENABLE_LSP_TOOLS  # Should be 1

# Verify language servers
which typescript-language-server  # TypeScript
which pyright                      # Python
which gopls                        # Go

# Test cclsp
npx cclsp --version
```

---

*Quad-Model Workflow v1.0*
*LSP + Gemini + GLM + Claude*
*Maximum efficiency through deterministic-first architecture*
