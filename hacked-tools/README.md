# Hacked Tools Library - L3 Deep Mods

A collection of **L3 Deep Mod** architectures for hackable open-source tools. Each mod transforms the original tool from a standard installation to a fully customizable, enterprise-grade platform.

## Quick Start

```bash
# Fork all repositories
export GITHUB_ORG="your-github-org"
./FORK-AUTOMATION.sh

# Apply mods
cd activepieces-hacked
cp -r ../activepieces-mods/enhancements/* ./packages/api/src/
```

## Tool Status

| Tool | Hackability | L3 Architecture | Status |
|------|:-----------:|:---------------:|:------:|
| **Activepieces** | 8→11/10 | ✅ Complete | Ready |
| **Formbricks** | 10→12/10 | ✅ Complete | Ready |
| **Cal.com** | 10→12/10 | ✅ Complete | Ready |
| **Uptime Kuma** | 9→11/10 | ✅ Complete | Ready |
| **Novu** | 10→12/10 | ✅ Complete | Ready |
| **GrowthBook** | 10→12/10 | ✅ Complete | Ready |

## L3 Deep Mod Levels

```
🟢 L1: Sidecar     → Plugins/configs alongside tool (lowest effort)
🟡 L2: Fork+Patch  → Cloned repo with modifications
🔴 L3: Deep Mod    → Full plugin systems, AI features, architecture changes
```

## Directory Structure

```
hacked-tools/
├── activepieces-mods/
│   ├── L3-DEEP-MOD.md          # Architecture doc
│   └── enhancements/
│       ├── piece-factory.service.ts
│       ├── ai-flow-builder.service.ts
│       ├── hot-reload-dev.service.ts
│       ├── multi-tenant-middleware.ts
│       └── n8n-importer.service.ts
│
├── formbricks-mods/
│   ├── L3-DEEP-MOD.md
│   └── enhancements/
│       ├── conditional-engine.ts
│       ├── ai-question-generator.ts
│       ├── payment-integration.ts
│       └── question-type-registry.ts
│
├── calcom-mods/
│   ├── L3-DEEP-MOD.md
│   └── enhancements/
│       ├── resource-scheduler.ts
│       ├── team-availability-matrix.ts
│       ├── ai-slot-optimizer.ts
│       └── webhook-publisher.ts
│
├── uptime-kuma-mods/
│   ├── L3-DEEP-MOD.md
│   └── enhancements/
│       ├── multi-region-orchestrator.ts
│       ├── clickhouse-adapter.ts
│       ├── ai-anomaly-detector.ts
│       └── monitor-plugin-system.ts
│
├── novu-mods/
│   ├── L3-DEEP-MOD.md
│   └── enhancements/
│       ├── visual-template-builder.tsx
│       ├── delivery-optimizer.ts
│       ├── ai-content-generator.ts
│       └── custom-provider-sdk.ts
│
├── growthbook-mods/
│   ├── L3-DEEP-MOD.md
│   └── enhancements/
│       ├── visual-flag-editor.tsx
│       ├── realtime-sync-server.ts
│       ├── ai-experiment-analyzer.ts
│       └── sdk-generator.ts
│
├── semgrep-rules/          # SAST custom rules
├── nuclei-templates/       # DAST templates
├── trufflehog-mods/        # Secret detectors
├── woodpecker-mods/        # CI/CD pipelines
│
├── FORK-AUTOMATION.sh      # Auto-fork script
└── README.md               # This file
```

## Common L3 Patterns

### 1. AI Integration
Every mod includes AI-powered features:
- Flow/content generation (Activepieces, Novu)
- Anomaly detection (Uptime Kuma)
- Experiment analysis (GrowthBook)
- Slot optimization (Cal.com)

### 2. Multi-Tenant Middleware
All mods support multi-tenancy:
- X-Tenant-Id header extraction
- Database query isolation
- White-label branding

### 3. Real-time Sync
WebSocket-based live updates:
- Socket.IO server
- Delta synchronization
- Channel subscriptions

### 4. Plugin Systems
Extensibility patterns:
- Custom pieces (Activepieces)
- Question types (Formbricks)
- Monitor types (Uptime Kuma)
- Metrics plugins (GrowthBook)

## Maintenance with AI

These mods are designed for AI-assisted maintenance:

```bash
# Use Claude/Aider to sync upstream changes
aider --model claude-3-opus "Merge upstream changes and resolve conflicts"

# Auto-update dependencies
aider "Update all dependencies to latest versions, fix breaking changes"

# Extend features
aider "Add Slack notification channel to Novu custom provider SDK"
```

## Related Research

- CDN Tools: `~/tech-stack-gems/research/cdn-tools.md`
- Design Systems: `~/tech-stack-gems/research/design-systems.md`
- Animation Libraries: `~/tech-stack-gems/research/animation-libraries.md`
- Audio/Video Tools: `~/tech-stack-gems/research/audio-video-tools.md`
- Hackable Editors: `~/tech-stack-gems/research/hackable-editors-tools.md`

---

*Part of the Tech Stack Gems collection*
*Registry: ~/tech-stack-gems/TECH-STACK-REGISTRY.md*
