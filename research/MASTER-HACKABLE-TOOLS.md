# Master Hackable Tools List (2025)

**Minimum Hackability Score: 8/10**
**Focus: Modular, API-first, TypeScript/Python/Go, Self-hosted**

---

## SUMMARY TABLE

| Category | Winner | Hackability | RAM | Tech Stack |
|----------|--------|-------------|-----|------------|
| **E-Commerce** | Medusa.js | 10/10 | 2GB | TypeScript/Node |
| **Automation** | n8n / Activepieces | 10/10 / 8/10 | 1GB / 2GB | TypeScript |
| **Analytics** | Tianji (Enhanced) | 10/10 | 2GB | Next.js |
| **Scheduling** | Cal.com | 10/10 | 2GB | Next.js |
| **Forms** | Formbricks | 10/10 | 2GB | Next.js |
| **Feature Flags** | GrowthBook | 10/10 | 256MB | TypeScript/Python |
| **Notifications** | Novu | 10/10 | 1GB | NestJS |
| **Testing (E2E)** | Playwright | 10/10 | - | TypeScript |
| **Testing (API)** | Bruno | 9/10 | - | Electron |
| **Testing (Load)** | k6 | 10/10 | - | Go/JS |
| **Auth** | Authentik | 8/10 | 512MB | Python |
| **BaaS** | PocketBase | 9/10 | 128MB | Go |
| **Monitoring** | Uptime Kuma | 9/10 | 100MB | Node.js |
| **SCM/Inventory** | Odoo CE | 8.5/10 | 4GB | Python |

---

## BY CATEGORY

### AUTOMATION & WORKFLOWS

| Tool | Score | RAM | Why Hackable |
|------|-------|-----|--------------|
| **n8n** | 10/10 | 1GB | Custom nodes in TypeScript, any npm library |
| **Windmill** | 10/10 | 500MB | Scripts-as-functions, Rust backend |
| **Activepieces** | 8/10 | 2GB | NestJS, "Piece" plugin system |
| Huginn | 9/10 | 512MB | Ruby agents, max flexibility |

**Winner for us: Activepieces** (TypeScript, NestJS, clean codebase)

---

### FORMS & SURVEYS

| Tool | Score | RAM | Why Hackable |
|------|-------|-----|--------------|
| **Formbricks** | 10/10 | 2GB | AI/LLM native, Next.js, component-based |
| **Typebot** | 9/10 | 2GB | Visual flow graph, custom blocks |
| Flatfile | 10/10 | 4GB | Data ingestion focus, heavy |

**Winner for us: Formbricks** (AI-native, clean TypeScript)

---

### SCHEDULING & BOOKING

| Tool | Score | RAM | Why Hackable |
|------|-------|-----|--------------|
| **Cal.com** | 10/10 | 2GB | App Store, Turborepo, webhook hooks |
| Gauzy | 9.5/10 | 2GB | NestJS, modular ERP features |
| Thunderbird Appointment | 9/10 | 512MB | FastAPI, Python, lightweight |

**Winner for us: Cal.com** (TypeScript, huge community)

---

### FEATURE FLAGS & A/B

| Tool | Score | RAM | Why Hackable |
|------|-------|-----|--------------|
| **GrowthBook** | 10/10 | 256MB | SQL-based, data warehouse native |
| Flagr | 9.5/10 | 100MB | Go binary, embeddable |
| Flipt | 9/10 | 50MB | gRPC/Protobuf, edge-ready |

**Winner for us: GrowthBook** (Product analytics + flags)

---

### NOTIFICATIONS & PUSH

| Tool | Score | RAM | Why Hackable |
|------|-------|-----|--------------|
| **Novu** | 10/10 | 1GB | Custom providers, workflow engine |
| Gotify | 9/10 | 50MB | Go binary, WebSocket native |
| Apprise | 8.5/10 | 50MB | Python library, 100+ services |
| ntfy.sh | 8/10 | 32MB | Already in stack |

**Winner for us: Novu** (Enterprise-grade, custom channels)

---

### TESTING STACK

| Type | Tool | Score | Why |
|------|------|-------|-----|
| **E2E** | Playwright | 10/10 | Auto-wait, multi-browser, trace viewer |
| **API** | Bruno | 9/10 | Git-friendly, file-based collections |
| **Load** | k6 | 10/10 | JS tests, Grafana integration |
| **Infra** | Terratest | 11/10 | Go, spins up real infra |

**Ansible is NOT for testing** - it's config management. Use Playwright + Bruno + k6.

---

### SCM / INVENTORY

| Tool | Score | RAM | Why Hackable |
|------|-------|-----|--------------|
| Medusa (internal) | 9.5/10 | 2GB | Same stack, native |
| **Odoo CE** | 8.5/10 | 4GB | Python, module system, huge features |
| ERPNext | 8/10 | 4GB | Frappe framework, low-code |

**Winner for us: Use Medusa + Odoo connector for inventory**

---

## WHAT WE ALREADY HAVE HACKED

| Tool | Our Mods | Lines | Status |
|------|----------|-------|--------|
| **PocketBase** | Redis cache, rate limiting, logging, vector search | 1,500+ | ✅ Done |
| **Tianji** | WebSocket live, ClickHouse, AI anomalies, NL queries | 3,187 | ✅ Done |
| **Medusa** | Setup + Stripe guide | 300+ | ✅ Basic |

---

## RECOMMENDED ADDITIONS TO TECH STACK

### Tier 1: Core (Add Now)
1. **Activepieces** - Automation (Zapier replacement)
2. **Cal.com** - Scheduling
3. **Formbricks** - Forms + surveys
4. **Novu** - Notifications
5. **GrowthBook** - Feature flags

### Tier 2: Testing Stack
1. **Playwright** - E2E testing
2. **Bruno** - API testing
3. **k6** - Load testing

### Tier 3: When Needed
1. **Odoo CE** - When inventory/SCM needed
2. **Windmill** - When complex script automation needed

---

## TOOLS TO AVOID (Low Hackability)

| Tool | Score | Why Avoid |
|------|-------|-----------|
| Checkmk | 3/10 | GUI-locked |
| Keycloak | 4/10 | Java bloat |
| Apache OFBiz | 2/10 | XML minilang nightmare |
| Jira | 2/10 | Closed source, expensive |
| PostHog (self-host) | 5/10 | 8GB+ RAM, complex |

---

*Research conducted via GLM 4.7 | December 2024*
