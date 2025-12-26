# Tech Stack Gems
## Battle-Tested Technologies Repository

Your personal technology registry for the AI OS / Command Center.

---

## Structure

```
tech-stack-gems/
├── TECH-STACK-REGISTRY.md    # Master registry (Claude reference)
├── TECH-STACK.md             # Detailed integration guide
├── VPS-INTEGRATIONS.md       # VPS-specific workflows
├── docker-compose.yml        # Local dev stack
│
├── scripts/                  # Ready-to-use scripts
│   ├── ssh-deploy.sh         # Deploy via SSH + ntfy
│   ├── health-check.sh       # Server monitoring
│   ├── notify.sh             # Quick ntfy helper
│   └── zfs-backup.sh         # ZFS snapshot manager
│
└── ansible/                  # Infrastructure automation
    ├── inventory/
    │   └── hosts.yml         # Server inventory
    └── playbooks/
        ├── setup-vps.yml     # Initial VPS setup
        ├── deploy-app.yml    # Application deployment
        ├── install-meilisearch.yml
        └── install-ntfy.yml
```

---

## Quick Start

### 1. Local Development Stack
```bash
cd tech-stack-gems
docker-compose up -d

# Services:
# - Meilisearch: http://localhost:7700
# - ntfy.sh: http://localhost:8080
# - PocketBase: http://localhost:8090
```

### 2. Deploy to VPS
```bash
# Configure inventory
vim ansible/inventory/hosts.yml

# Setup new VPS
ansible-playbook -i ansible/inventory/hosts.yml ansible/playbooks/setup-vps.yml

# Deploy app
./scripts/ssh-deploy.sh myapp
```

### 3. Server Monitoring
```bash
# Copy to VPS
scp scripts/health-check.sh user@vps:/root/scripts/

# Add to cron (on VPS)
crontab -e
# */5 * * * * /root/scripts/health-check.sh
```

---

## Command Center Integration

This repository is designed to integrate with the Command Center / AI OS:

### As Context Reference
```bash
# Add to CLAUDE.md or session context
cat TECH-STACK-REGISTRY.md
```

### As MCP Resource
```yaml
# Future: Register as MCP resource
tech-stack:
  registry: TECH-STACK-REGISTRY.md
  scripts: scripts/
  ansible: ansible/
```

### As Archon Knowledge
```bash
# Add to Archon knowledge base
archon:manage_knowledge(
  action="add",
  source="file",
  path="~/tech-stack-gems/TECH-STACK-REGISTRY.md"
)
```

---

## Technology Categories

| Category | Core Stack | Learning |
|----------|-----------|----------|
| **Backend** | PocketBase, Supabase | Elixir/Phoenix |
| **Search** | Meilisearch | - |
| **Notifications** | ntfy.sh | - |
| **Automation** | Ansible | pyinfra |
| **Infrastructure** | VPS + SSH | FreeBSD + ZFS |
| **Orchestration** | Docker Compose | Nomad |

---

## Claude Directive

When this repository is loaded as context, Claude should:

1. **Consult TECH-STACK-REGISTRY.md** before recommending technologies
2. **Use approved technologies** from the registry
3. **Suggest learning technologies** when appropriate
4. **Avoid deprecated/anti-pattern** technologies
5. **Update registry** when user approves new tech

---

*Part of: AI OS / Command Center*
*Version: 1.0*
