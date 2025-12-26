# Hackable Text Editors & Cool Dev Tools - 2025

*Generated via GLM ultra-deep research*

## 1. Hackable Code Editors (Beyond VS Code)

| Editor | Hackability | Self-Hosted | Use Case |
|--------|:-----------:|:-----------:|----------|
| **Kakoune** | **9/10** | ✅ Yes | Multiple selections, Unix philosophy |
| **Helix** | **8/10** | ✅ Yes | Modern modal editor, Rust, built-in LSP |
| **Zed** | **7/10** | ✅ Partial | Collaboration-first, AI agent built-in |
| **Neovim** | **10/10** | ✅ Yes | Lua-based config, infinite extensibility |

### Kakoune (9/10)
- Multiple cursor by default (not addon)
- Client-server model (attach terminals to sessions)
- Grammar feels like regex for text structures

### Helix (8/10)
- Rust-based, batteries included
- Built-in LSP + Tree-sitter
- No config needed, just works
- Kakoune-inspired selection model

### Zed (7/10)
- Rust, GPU-accelerated
- Built-in AI coding agent
- Declarative UI customization
- Real-time collaboration

---

## 2. Terminal Tools (Beyond tmux)

| Tool | Hackability | Self-Hosted | Use Case |
|------|:-----------:|:-----------:|----------|
| **Zellij** | **10/10** | ✅ Yes | Terminal multiplexer, Lua scripting |
| **Warp** | **6/10** | ❌ No | GPU terminal, block-based UI |
| **Xremap** | **9/10** | ✅ Yes | System-wide key remapping |
| **Starship** | **8/10** | ✅ Yes | Cross-shell prompt |

### Zellij (10/10) - THE tmux KILLER
```bash
# Install
cargo install zellij

# Features:
# - Lua scripting for behavior
# - Persistent layouts
# - Floating panes
# - Session management
```

### Xremap (9/10)
- System-level key remapper (Wayland/X11/macOS)
- YAML config for complex keybindings
- Create "modes" at OS level
- Turn any keyboard into programmable macro keyboard

---

## 3. Developer Productivity

| Tool | Hackability | Self-Hosted | Use Case |
|------|:-----------:|:-----------:|----------|
| **Nix** | **10/10** | ✅ Yes | Declarative system config |
| **Turborepo** | **8/10** | ✅ Yes | Monorepo build optimization |
| **Supabase** | **8/10** | ✅ Yes | Open Firebase (Postgres) |
| **Bun** | **8/10** | ✅ Yes | All-in-one JS runtime |

### Nix (10/10) - THE ULTIMATE HACKABLE TOOL
```nix
# shell.nix - Reproducible dev environment
{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs-20_x
    pkgs.python311
    pkgs.postgresql_15
    pkgs.redis
  ];
}
```
- Solves "works on my machine"
- Atomic, immutable packages
- Declarative everything

### Bun (8/10)
```bash
# Replace Node + npm + Webpack + Jest
bun install  # 10x faster than npm
bun run dev  # Native TypeScript
bun test     # Built-in test runner
bun build    # Bundler included
```

---

## 4. AI-Powered Dev Tools

| Tool | Hackability | Self-Hosted | Use Case |
|------|:-----------:|:-----------:|----------|
| **Aider** | **9/10** | ✅ Yes | AI pair programmer (CLI) |
| **Continue** | **8/10** | ✅ Yes | Open Copilot alternative |
| **GraphRAG** | **7/10** | ✅ Yes | Knowledge graphs from code |

### Aider (9/10) - AI THAT WRITES CODE
```bash
# Install
pip install aider-chat

# Use with local model
aider --model ollama/llama3

# Features:
# - Tracks git changes
# - Modifies files directly
# - Runs tests to verify edits
# - Works offline with local LLMs
```

### Continue (8/10)
- Open-source Copilot Chat
- Custom slash commands (Python/TypeScript)
- Works with any OpenAI-compatible API
- Deep codebase context awareness

---

## 5. Unique/Obscure Power Tools

| Tool | Hackability | Self-Hosted | Use Case |
|------|:-----------:|:-----------:|----------|
| **Visidata** | **8/10** | ✅ Yes | Terminal spreadsheet |
| **Zoxide** | **7/10** | ✅ Yes | Smart `cd` command |
| **Atuin** | **8/10** | ✅ Yes | Shell history sync |
| **Lazygit** | **7/10** | ✅ Yes | Terminal git UI |

### Visidata (8/10)
```bash
# Open any data file in terminal
vd data.csv
vd data.json
vd sqlite:///database.db

# Features:
# - Filter, aggregate, pivot
# - Millions of rows instantly
# - Keyboard-driven
# - Unix pipeline friendly
```

### Zoxide (7/10)
```bash
# Smart directory jumping
z projects      # → ~/projects
z ai exp        # → ~/projects/2025/experiments/ai

# Learns your habits
# Frecency algorithm
```

### Atuin (8/10)
```bash
# Shell history sync across machines
# SQLite backend
# Encrypted sync
# Search with Ctrl+R on steroids
```

---

## Recommended Stack

```
Development Environment:
├── Editor: Helix or Neovim
├── Terminal: Zellij + Starship
├── Shell: Fish + Zoxide + Atuin
├── Runtime: Bun
├── Package Manager: Nix
├── AI Pair: Aider + Continue
├── Data: Visidata
└── Git: Lazygit
```

## Installation Script

```bash
#!/bin/bash
# Install hackable dev stack

# Helix
brew install helix

# Zellij
cargo install zellij

# Zoxide
curl -sS https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | bash

# Atuin
curl --proto '=https' --tlsv1.2 -LsSf https://setup.atuin.sh | sh

# Bun
curl -fsSL https://bun.sh/install | bash

# Aider
pip install aider-chat

# Lazygit
brew install lazygit

# Visidata
pip install visidata
```
