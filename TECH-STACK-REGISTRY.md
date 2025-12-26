# Tech Stack Registry
# Claude Code Reference Repository
# Part of: Command Center / AI OS
#
# This file serves as the canonical reference for approved technologies.
# Claude should consult this when making technology recommendations.

---

## Registry Format

Each technology entry includes:
- **Status**: `active` | `learning` | `evaluating` | `deprecated`
- **Category**: Infrastructure, Backend, Frontend, DevOps, etc.
- **Priority**: `core` | `preferred` | `optional`
- **Replaces**: What this supersedes (if any)

---

## INFRASTRUCTURE

### Operating Systems

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| **FreeBSD** | learning | preferred | Netflix/WhatsApp use. Superior networking, ZFS native. |
| **OpenBSD** | evaluating | optional | Security-critical systems. PF firewall. |
| Linux (Ubuntu/Debian) | active | core | Current production. Migrate to FreeBSD over time. |

### Filesystems

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| **ZFS** | learning | core | Self-healing, snapshots, compression. Use on all data. |
| ext4 | active | fallback | Linux default. Replace with ZFS. |

### Virtualization

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| Docker | active | core | Container runtime. |
| **FreeBSD Jails** | learning | preferred | Superior isolation. Replaces Docker on FreeBSD. |
| bhyve | evaluating | optional | FreeBSD hypervisor. |

---

## BACKEND

### Backend-as-a-Service

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| **PocketBase** | active | core | Self-hosted. Simple projects. |
| **Supabase** | active | core | PostgreSQL. Complex projects. |
| Firebase | deprecated | avoid | Vendor lock-in. Use PocketBase/Supabase. |

### Databases

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| PostgreSQL | active | core | Via Supabase or self-hosted. |
| SQLite | active | core | Via PocketBase. Local-first. |
| **Meilisearch** | active | preferred | Full-text search. Replaces Elasticsearch. |
| Redis | active | optional | Caching only. |

### Programming Languages

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| TypeScript | active | core | All JavaScript projects. |
| Python | active | core | Scripts, automation, AI. |
| **Elixir/Erlang** | learning | preferred | Real-time features. Replaces Node for concurrency. |
| **Lua** | learning | optional | Embeddable scripting. |
| Go | active | optional | CLI tools, high-performance APIs. |
| Rust | evaluating | optional | Performance-critical code. |

### Web Frameworks

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| Next.js | active | core | React + SSR. |
| **Phoenix LiveView** | learning | preferred | Real-time without JS. Elixir. |
| Express | active | optional | Simple Node APIs. |
| FastAPI | active | optional | Python APIs. |

---

## DEVOPS & AUTOMATION

### Configuration Management

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| **Ansible** | active | core | Agentless. SSH-based. YAML playbooks. |
| pyinfra | evaluating | optional | Python-based. Faster than Ansible. |
| SaltStack | evaluating | optional | Event-driven. Large scale. |

### Container Orchestration

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| **Nomad** | learning | preferred | Simple. Single binary. Replaces K8s for us. |
| Docker Compose | active | core | Local dev. Small production. |
| Kubernetes | evaluating | avoid | Overkill for our scale. |

### CI/CD

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| GitHub Actions | active | core | Repo-integrated CI. |
| **SSH + rsync** | active | core | Direct deployment. Simple. |
| Custom scripts | active | core | deploy.sh pattern. |

### Monitoring & Notifications

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| **ntfy.sh** | active | core | Push notifications. Self-hostable. |
| Grafana | active | optional | Dashboards. |
| Prometheus | active | optional | Metrics. |

---

## FRONTEND

### UI Frameworks

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| React | active | core | Via Next.js. |
| **Phoenix LiveView** | learning | preferred | Server-rendered real-time. No React needed. |
| Vue | active | optional | Alternative to React. |
| Svelte | evaluating | optional | Compiler-based. |

### Styling

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| Tailwind CSS | active | core | Utility-first. |
| shadcn/ui | active | core | Component library. |
| CSS Modules | active | optional | Scoped CSS. |

### Design Systems & Component Libraries

| Technology | Status | Priority | Hackability | Notes |
|------------|--------|----------|-------------|-------|
| **shadcn/ui** | active | core | 10/10 | Copy-paste components. NOT npm. Full ownership. |
| **Radix UI** | active | core | 9/10 | Headless primitives. ARIA-compliant. shadcn foundation. |
| **Ark UI** | evaluating | optional | 9/10 | Chakra team. State machines. Multi-framework. |
| Headless UI | active | optional | 8/10 | Tailwind Labs. Fewer components than Radix. |
| React Aria | evaluating | optional | 7/10 | Adobe. Most accessible. Complex API. |
| Kobalte | evaluating | optional | 9/10 | SolidJS only. Radix alternative for Solid. |

**Recommended Stack:**
```
shadcn/ui (copy-paste) → Radix (primitives) → Tailwind (styling)
```

- **Design Systems Research**: `~/tech-stack-gems/research/design-systems.md`

### Animation Libraries

| Technology | Status | Priority | Hackability | Notes |
|------------|--------|----------|-------------|-------|
| **Framer Motion** | active | core | 9/10 | React standard. Layout animations. 130KB. |
| **GSAP** | evaluating | preferred | 10/10 | ScrollTrigger, morphing. Pro features. 60KB. |
| **Motion One** | evaluating | optional | 7/10 | WAAPI wrapper. 18KB. Native performance. |
| **React Spring** | active | optional | 9/10 | Physics-based. Gesture support. 25KB. |
| **Auto-animate** | active | optional | 3/10 | Zero config. 4KB. Limited control. |
| Lottie | active | optional | 5/10 | After Effects → JSON. Vector animations. |

**Recommended Stack:**
```
Framer Motion (React layouts) + GSAP (scroll/complex) + Motion One (micro)
```

- **Animation Research**: `~/tech-stack-gems/research/animation-libraries.md`

---

## AI DEVELOPMENT TOOLS

### Code Intelligence (Token Savers)

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| **LSP (Native)** | active | core | Deterministic code nav. 0 Claude tokens. |
| **cclsp** | active | core | MCP bridge for LSP. npm package. |
| typescript-language-server | active | core | TypeScript/JS LSP. |
| pyright | active | core | Python LSP. Fast types. |
| gopls | active | optional | Go LSP. |
| rust-analyzer | evaluating | optional | Rust LSP. |

### AI Workflow

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| **Quad-Model Workflow** | active | core | LSP → Gemini → GLM → Claude |
| Claude Opus | active | core | Orchestration. 20% of work. |
| GLM 4.7 | active | core | Code/tests. 60% of work. |
| Gemini Pro | active | core | Research. 20% of work. |

---

## TOOLS & UTILITIES

### Text Processing

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| **awk** | active | core | Column-based processing. |
| **sed** | active | core | Stream editing. |
| jq | active | core | JSON processing. |
| ripgrep (rg) | active | core | Fast grep. |

### Version Control

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| Git | active | core | Standard. |
| **Fossil** | evaluating | optional | SQLite-based. All-in-one. |

### Build Tools

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| npm/pnpm | active | core | JavaScript. |
| Make | active | preferred | Universal. Simple. |
| **Ninja** | evaluating | optional | Fast incremental builds. |

---

## SECURITY

### Authentication

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| Supabase Auth | active | core | Built-in. |
| PocketBase Auth | active | core | Built-in. |
| **SuperTokens** | evaluating | optional | Self-hosted Auth0 alternative. |
| **Authentik** | evaluating | optional | Full SSO/SAML. |

### Secrets Management

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| .env files | active | core | Local dev. |
| **1Password CLI** | active | preferred | Production secrets. |
| Vault | evaluating | optional | Enterprise. |

---

## HOSTING & DEPLOYMENT

### VPS Providers

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| Current VPS | active | core | SSH deployment. |
| DigitalOcean | active | optional | Backup provider. |
| Hetzner | evaluating | optional | Cost-effective. EU. |

### CDN & Edge

| Technology | Status | Priority | Hackability | Notes |
|------------|--------|----------|-------------|-------|
| **Cloudflare R2 + Workers** | learning | preferred | 10/10 | Edge computing, image transform, zero egress. |
| Cloudflare | active | core | 7/10 | DNS, CDN, protection. |
| **BunnyCDN** | evaluating | optional | 7/10 | High-volume media. Storage API. Cheap. |
| **Caddy** | learning | preferred | 8/10 | Self-hosted. Auto-HTTPS. JSON API config. |
| **Varnish** | evaluating | optional | 9/10 | Self-hosted. VCL scripting. Complex caching. |
| **Fly.io** | evaluating | optional | 6/10 | Elixir deployment. Global edge. |

- **CDN Research**: `~/tech-stack-gems/research/cdn-tools.md`

### Object Storage

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| **MinIO** | active | preferred | Self-hosted S3. |
| Cloudflare R2 | active | optional | Zero egress. |
| **SeaweedFS** | evaluating | optional | Distributed. Many files. |

---

## E-COMMERCE

### Headless Commerce Platforms

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| **Medusa.js** | learning | preferred | Node.js/TS headless commerce. v2.0 modular. No fees. |
| Vendure | evaluating | optional | TypeScript alternative. Simpler than Medusa. |
| Saleor | evaluating | optional | Python/Django. Best GraphQL. High scale. |

### Medusa.js Details
- **Stack**: Node.js 20+, PostgreSQL, Redis, TypeScript
- **Payment Gateways**: Stripe, PayPal, Braintree, Mollie, Razorpay, BTCPay
- **Best For**: Custom checkout, subscriptions, marketplaces
- **Replaces**: Shopify (with fees), WooCommerce (PHP)
- **Our Setup**: `~/tech-stack-gems/medusa-setup/`
  - `docker-compose.yml` - Minimal production setup
  - `stripe-setup.md` - Stripe integration guide

### PocketBase Modifications (100x Enhanced)
- **Location**: `~/tech-stack-gems/pocketbase-mods/`
- **Enhancements Built**:
  - `redis-cache.go` - Redis caching layer (10k→100k+ req/s)
  - `rate-limiter.go` - Sliding window rate limiting with Redis
  - `structured-logging.go` - JSON logging with correlation IDs (Loki-ready)
  - `docker-compose.yml` - Production deployment with nginx, SSL, S3 backup
  - `vector-search.go` - AI semantic search via sqlite-vec
  - `faas-hooks.go` - Hot-reload JS functions system
  - `test-cache.sh` - Performance test script
- **Additional Ideas**: `~/tech-stack-gems/research/additional-improvements.md`

### Authentication (Self-Hosted)

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| **Authentik** | learning | preferred | Modern, lightweight (512MB RAM), easy UI. Best for small teams. |
| Keycloak | evaluating | avoid | Java-heavy (2GB+ RAM), enterprise overkill, ugly UI. |

- **Authentik Setup**: `~/tech-stack-gems/research/authentik-setup.yml`
- **Authentik Mods**: `~/tech-stack-gems/research/authentik-mods.md`
- **Comparison**: `~/tech-stack-gems/research/auth-comparison.md`

### Analytics (Self-Hosted)

| Technology | Status | Priority | Hackability | Category | Notes |
|------------|--------|----------|-------------|----------|-------|
| **Tianji (Enhanced)** | active | core | 10/10 | SaaS Analytics | Next.js + our 10000x mods. WebSocket live, ClickHouse, AI anomalies. |
| PostHog | evaluating | optional | 5/10 | Product Analytics | Session replay, feature flags. 8GB+ RAM. Enterprise-grade. |
| Plausible | evaluating | optional | 6/10 | Traffic Analytics | Privacy-focused, simple. 512MB RAM. No funnels. |
| Umami | evaluating | optional | 7/10 | Traffic Analytics | Ultra-light. No funnels. Tiny footprint. |

- **Tianji Analysis**: `~/tech-stack-gems/research/tianji.md`
- **Tianji 10000x Mods**: `~/tech-stack-gems/tianji-mods/` (3,187 lines)
  - Live WebSocket stream, ClickHouse, AI anomaly detection
  - Natural language queries, Webhook factory, Middleware plugins
  - Edge proxy for GDPR compliance
- **PostHog Analysis**: `~/tech-stack-gems/research/posthog-analysis.md`
- **Verdict**: Tianji Enhanced for SaaS (10/10 hackability), Plausible/Umami for blogs

### Monitoring & Observability (Self-Hosted)

| Technology | Status | Priority | Hackability | Category | Notes |
|------------|--------|----------|-------------|----------|-------|
| **Uptime Kuma** | active | core | 9/10 | Uptime/Synthetic | Node.js/Vue. 100-200MB RAM. Status pages. |
| **Beszel** | learning | preferred | 8/10 | Container Stats | Go-based. 50-150MB RAM. Docker-focused. |
| **Netdata** | learning | preferred | 7/10 | Infrastructure | Plugin-friendly. 100-200MB RAM. Zero-config. |
| Prometheus+Grafana | active | optional | 6/10 | Metrics/Dashboards | Industry standard. 2.5GB+ RAM. K8s focused. |
| Checkmk | avoid | - | 3/10 | Enterprise Mon. | GUI-only config. Not hackable. Enterprise lock-in. |

- **Best Combo**: Uptime Kuma (synthetic) + Netdata (infra) = ~300MB total
- **Monitoring Research**: `~/tech-stack-gems/research/monitoring-comparison.md`

### Project Management (Self-Hosted)

| Technology | Status | Priority | Hackability | Notes |
|------------|--------|----------|-------------|-------|
| **Plane** | learning | preferred | 6/10 | Linear-like, free self-hosted. Django monolith. |
| Linear | active | optional | 0/10 | Best UX, but $20+/user, closed source. |
| Jira | avoid | - | 2/10 | Bloated, expensive, enterprise overkill. |

- **Plane Research**: `~/tech-stack-gems/research/plane.md`

### Video Conferencing (Self-Hosted)

| Technology | Status | Priority | Hackability | Notes |
|------------|--------|----------|-------------|-------|
| **Jitsi Meet** | learning | preferred | 4/10 | E2E encryption, WebRTC. Hard to mod (requires fork). |
| Zoom/Meet | active | fallback | 0/10 | Better AI, worse privacy. |

- **Jitsi Research**: `~/tech-stack-gems/research/jitsi-meet.md`
- **Jitsi Hacking Guide**: `~/tech-stack-gems/research/jitsi-hacking-guide.md`
- **Future Project**: E2E encrypted video platform

### Hackability Ratings (All Tools)

| Tool | Score | Category | Plugin System | No-Fork Mods |
|------|-------|----------|---------------|--------------|
| **Medusa** | 10/10 | E-Commerce | ✅ Modules | ✅ Yes |
| **Uptime Kuma** | 9/10 | Monitoring | ✅ Plugins | ✅ Yes |
| **PocketBase** | 9/10 | BaaS | JS Hooks | ✅ Yes |
| **Authentik** | 8/10 | Auth | Blueprints | ✅ Yes |
| **Tianji (Enhanced)** | 10/10 | Analytics | ✅ Full Plugin | ✅ Yes |
| **Beszel** | 8/10 | Monitoring | Go-based | ✅ Yes |
| **Umami** | 7/10 | Analytics | React | ✅ Yes |
| **Netdata** | 7/10 | Monitoring | C/Python | ✅ Yes |
| Prometheus | 6/10 | Monitoring | Exporters | ⚠️ Config |
| Plausible | 6/10 | Analytics | Elixir | ⚠️ Elixir |
| **Plane** | 6/10 | PM | ❌ No | ⚠️ Django |
| PostHog | 5/10 | Analytics | ❌ Limited | ⚠️ Complex |
| **Jitsi** | 4/10 | Video | ❌ No | ❌ Requires fork |
| Checkmk | 3/10 | Monitoring | ❌ No | ❌ GUI-locked |

**Minimum Score for Tech Stack: 6/10** (exceptions only for unique features like Jitsi E2E encryption)

- **Full Ratings**: `~/tech-stack-gems/research/hackability-ratings.md`

---

## INTEGRATION LAYER (Authentik + PocketBase + Medusa)

Full stack integration for unified auth across all services.

- **Location**: `~/tech-stack-gems/integration-layer/`
- **Files**:
  - `docker-compose-full-stack.yml` - Complete stack deployment
  - `pb-medusa-sync.go` - PocketBase→Medusa user sync hook
  - `medusa-authentik-middleware.ts` - Medusa JWT validation
  - `IntegrationDashboard.tsx` - React monitoring component
  - `test-integration.sh` - Integration test suite
- **Architecture**: `~/tech-stack-gems/research/auth-integration-architecture.md`

---

## PAYMENTS & BILLING

| Technology | Status | Priority | Notes |
|------------|--------|----------|-------|
| Stripe | active | core | Standard payment processor. Works with Medusa. |
| **Lago** | evaluating | preferred | Self-hosted billing. Usage-based. |
| Lemon Squeezy | evaluating | optional | Digital products. Tax handling. |

---

## ANTI-PATTERNS (AVOID)

| Technology | Category | Why Avoid | Alternative |
|------------|----------|-----------|-------------|
| Kubernetes | Orchestration | Overkill for our scale | Nomad, Docker Compose |
| Firebase | BaaS | Vendor lock-in, expensive | PocketBase, Supabase |
| Elasticsearch | Search | Heavy, complex | Meilisearch |
| AWS/GCP | Cloud | Complexity, cost | VPS + self-hosted |
| Vercel | Hosting | Moved to VPS | SSH deploy |
| MongoDB | Database | Schema flexibility overrated | PostgreSQL, SQLite |
| Checkmk | Monitoring | GUI-locked, 3/10 hackability | Uptime Kuma, Netdata |
| Keycloak | Auth | 2GB+ RAM, Java bloat | Authentik |
| Jira | PM | Expensive, bloated | Plane |
| PostHog (self-host) | Analytics | 8GB+ RAM, complex | Tianji |

---

## AUTOMATION & WORKFLOWS

| Technology | Status | Priority | Hackability | Category | Notes |
|------------|--------|----------|-------------|----------|-------|
| **Activepieces** | learning | preferred | 8/10 | Workflow | NestJS/TypeScript. Zapier replacement. 2GB RAM. |
| **n8n** | evaluating | optional | 10/10 | Workflow | Custom nodes. More complex than Activepieces. |
| Windmill | evaluating | optional | 10/10 | Scripts | Rust backend. Scripts-as-functions. 500MB. |

- **Activepieces Research**: `~/tech-stack-gems/research/activepieces.md`
- **Automation Comparison**: `~/tech-stack-gems/research/hackable-automation.md`

---

## FORMS & SURVEYS

| Technology | Status | Priority | Hackability | Category | Notes |
|------------|--------|----------|-------------|----------|-------|
| **Formbricks** | learning | preferred | 10/10 | Surveys | AI/LLM native. Next.js. 2GB RAM. |
| Typebot | evaluating | optional | 9/10 | Chat Forms | Visual flow builder. 2GB RAM. |

- **Forms Research**: `~/tech-stack-gems/research/hackable-forms.md`

---

## SCHEDULING & BOOKING

| Technology | Status | Priority | Hackability | Category | Notes |
|------------|--------|----------|-------------|----------|-------|
| **Cal.com** | learning | preferred | 10/10 | Booking | App Store, webhooks. Calendly replacement. 2GB. |
| Gauzy | evaluating | optional | 9.5/10 | Agency | CRM+HR+Scheduling. NestJS. 2GB. |

- **Scheduling Research**: `~/tech-stack-gems/research/hackable-scheduling.md`

---

## FEATURE FLAGS & A/B TESTING

| Technology | Status | Priority | Hackability | Category | Notes |
|------------|--------|----------|-------------|----------|-------|
| **GrowthBook** | learning | preferred | 10/10 | Flags+A/B | SQL-native, data warehouse. 256MB. |
| Flagr | evaluating | optional | 9.5/10 | Flags | Go binary. 100MB. Simple. |
| Flipt | evaluating | optional | 9/10 | Flags | gRPC/Protobuf. Edge-ready. 50MB. |

- **Feature Flags Research**: `~/tech-stack-gems/research/hackable-feature-flags.md`

---

## NOTIFICATIONS & PUSH

| Technology | Status | Priority | Hackability | Category | Notes |
|------------|--------|----------|-------------|----------|-------|
| **Novu** | learning | preferred | 10/10 | Multi-channel | Custom providers, workflow engine. 1GB. |
| ntfy.sh | active | core | 8/10 | Push | Already integrated. 32MB. |
| Gotify | evaluating | optional | 9/10 | Push | Go binary, WebSocket. 50MB. |

- **Notifications Research**: `~/tech-stack-gems/research/hackable-notifications.md`

---

## TESTING STACK

| Technology | Status | Priority | Hackability | Category | Notes |
|------------|--------|----------|-------------|----------|-------|
| **Playwright** | active | core | 10/10 | E2E | Auto-wait, multi-browser, trace viewer. |
| **Bruno** | learning | preferred | 9/10 | API | Git-friendly, file-based. Postman replacement. |
| **k6** | learning | preferred | 10/10 | Load | JS tests, Grafana integration. Go runtime. |
| Artillery | evaluating | optional | 9/10 | Load | Node.js, hooks system, AWS-friendly. |
| Terratest | evaluating | optional | 11/10 | Infra | Go. Real infra testing. |

- **Testing Research**: `~/tech-stack-gems/research/testing-tools.md`

---

## SECURITY TESTING

| Technology | Status | Priority | Hackability | Category | Notes |
|------------|--------|----------|-------------|----------|-------|
| **Semgrep** | learning | core | 9/10 | SAST | Static code analysis. Write custom rules. Fast. |
| **Nuclei** | learning | core | 10/10 | DAST | Template-based scanning. YAML. Super fast. |
| **TruffleHog** | active | core | 9/10 | Secrets | Detects exposed keys. Verifies against APIs. |
| **Gitleaks** | active | core | 8/10 | Secrets | Pre-commit hook. Fast binary. |
| **Trivy** | learning | preferred | 9/10 | Container | Docker image vulnerability scanner. |
| ZAP | evaluating | optional | 8/10 | DAST | Web security Swiss-army knife. |
| CodeQL | evaluating | optional | 7/10 | SAST | GitHub's deep analysis. Complex but powerful. |

**Small Team Security Stack:**
1. **Pre-commit**: TruffleHog + Gitleaks (prevent secrets)
2. **CI Pipeline**: Semgrep (code) + Trivy (containers)
3. **Weekly Scan**: Nuclei (running app)

- **Security Research**: `~/tech-stack-gems/research/security-testing.md`

---

## PERFORMANCE TESTING

| Technology | Status | Priority | Hackability | Category | Notes |
|------------|--------|----------|-------------|----------|-------|
| **k6** | learning | core | 10/10 | Load | JS tests, Grafana native. |
| **Parca** | evaluating | preferred | 10/10 | Profiling | Continuous profiling. eBPF. |
| **Toxiproxy** | evaluating | optional | 9/10 | Chaos | Network failure simulation. Go. |
| Chaos Mesh | evaluating | optional | 9/10 | Chaos | K8s chaos testing. CRD-based. |
| Pyroscope | evaluating | optional | 9/10 | Profiling | Grafana ecosystem. |

- **Performance Research**: `~/tech-stack-gems/research/performance-testing.md`

---

## INFRASTRUCTURE & DEVOPS

| Technology | Status | Priority | Hackability | Category | Notes |
|------------|--------|----------|-------------|----------|-------|
| **Ansible** | active | core | 9/10 | Config Mgmt | SSH-based. YAML playbooks. Server setup. |
| **Woodpecker CI** | learning | preferred | 9/10 | CI/CD | Drone fork. Container-based pipelines. |
| Terraform | evaluating | optional | 8/10 | Provisioning | Cloud resource creation. Use with Ansible. |

**Ansible = Configuration Management, NOT Testing**
- Use for: Server setup, deploying code, managing users
- Don't use for: Testing, monitoring, observability

- **Ansible Research**: `~/tech-stack-gems/research/ansible-clarified.md`

---

## MISSING TOOLS (NEW ADDITIONS)

### Logging & Observability
| Technology | Status | Priority | Hackability | Notes |
|------------|--------|----------|-------------|-------|
| **Grafana Loki** | learning | preferred | 8/10 | Lightweight log aggregation. Labels-only indexing. |
| **OpenObserve** | evaluating | optional | 9/10 | All-in-one: logs, metrics, traces. Single binary. |
| **GlitchTip** | learning | preferred | 9/10 | Error tracking. Sentry alternative. Open source. |

### Search
| Technology | Status | Priority | Hackability | Notes |
|------------|--------|----------|-------------|-------|
| **Typesense** | learning | preferred | 9/10 | Typo-tolerant. Vector search. Fast. |
| **Meilisearch** | active | core | 8/10 | Already in stack. |

### CMS
| Technology | Status | Priority | Hackability | Notes |
|------------|--------|----------|-------------|-------|
| **Payload CMS** | learning | preferred | 10/10 | TypeScript-native headless CMS. React admin. |

### Secrets Management
| Technology | Status | Priority | Hackability | Notes |
|------------|--------|----------|-------------|-------|
| **Infisical** | learning | preferred | 9/10 | Vault alternative. Audit logs. .env sync. |

### Customer Support
| Technology | Status | Priority | Hackability | Notes |
|------------|--------|----------|-------------|-------|
| **Chatwoot** | evaluating | optional | 9/10 | Intercom replacement. WhatsApp+Email+Web. |

- **Missing Tools Research**: `~/tech-stack-gems/research/missing-tools.md`

---

## SCM / INVENTORY (For E-Commerce)

| Technology | Status | Priority | Hackability | Category | Notes |
|------------|--------|----------|-------------|----------|-------|
| Medusa (internal) | active | core | 9.5/10 | OMS | Native integration. Same stack. |
| **Odoo CE** | evaluating | optional | 8.5/10 | Full ERP | Python. Medusa connector available. 4GB. |
| ERPNext | avoid | - | 8/10 | Full ERP | Overkill. Frappe framework. 4GB. |

- **SCM Research**: `~/tech-stack-gems/research/hackable-scm.md`
- **Medusa Enhancements**: `~/tech-stack-gems/research/medusa-enhancements.md`

---

## MASTER HACKABLE TOOLS REFERENCE

**Full research compiled**: `~/tech-stack-gems/research/MASTER-HACKABLE-TOOLS.md`

---

## AUDIO/VIDEO PROCESSING

| Technology | Status | Priority | Hackability | Category | Notes |
|------------|--------|----------|-------------|----------|-------|
| **FFmpeg** | active | core | 10/10 | Transcoding | THE foundation. Format conversion, filters. |
| **GStreamer** | learning | preferred | 9/10 | Streaming | Real-time pipelines. WebRTC. Plugin arch. |
| **Faster-Whisper** | learning | core | 9/10 | Speech-to-Text | Local transcription. GPU accelerated. |
| **yt-dlp** | active | core | 8/10 | Archiving | Video downloads. youtube-dl fork. |
| **Vosk** | evaluating | optional | 8/10 | STT | Lightweight. Runs on Raspberry Pi. |
| **Piper TTS** | learning | preferred | 8/10 | Text-to-Speech | Fast neural TTS. 40+ voices. |
| **MLT** | evaluating | optional | 7/10 | Editing | Kdenlive/Shotcut engine. Automated editing. |
| MediaPipe | evaluating | optional | 8/10 | AI Vision | Face/pose detection. Google. |

**Recommended Audio/Video Stack:**
```
FFmpeg (transcode) → GStreamer (real-time) → Faster-Whisper (transcribe)
yt-dlp (archive) → Piper (TTS) → MLT (edit)
```

- **Audio/Video Research**: `~/tech-stack-gems/research/audio-video-tools.md`

---

## HACKABLE EDITORS & DEV TOOLS

| Technology | Status | Priority | Hackability | Category | Notes |
|------------|--------|----------|-------------|----------|-------|
| **Helix** | learning | preferred | 8/10 | Editor | Rust. Kakoune-like. LSP native. Modal. |
| **Kakoune** | evaluating | optional | 9/10 | Editor | Multiple selections. C++. Unix philosophy. |
| **Zed** | evaluating | optional | 7/10 | Editor | Rust. GPU-rendered. Collaborative. |
| **Zellij** | learning | preferred | 10/10 | Terminal Mux | Rust. Tmux replacement. WASM plugins. |
| **Nix** | learning | preferred | 10/10 | Package Mgmt | Reproducible builds. Declarative. |
| **Aider** | active | core | 9/10 | AI Coding | Terminal pair programming. Multi-model. |
| **Bun** | active | core | 8/10 | JS Runtime | Fast npm/node replacement. All-in-one. |
| **Rye** | evaluating | optional | 9/10 | Python Mgmt | Rust-based. pyenv+pip+venv replacement. |

**Recommended Dev Stack:**
```
Helix/Zed (editor) → Zellij (terminal) → Nix (packages)
Aider (AI pair) → Bun (JS) → Rye (Python)
```

- **Hackable Editors Research**: `~/tech-stack-gems/research/hackable-editors-tools.md`

---

## LEARNING QUEUE

Technologies to learn in order:

1. **ntfy.sh** ✅ - Already integrated
2. **Playwright** 🔄 - E2E testing (priority)
3. **Activepieces** - Zapier replacement
4. **Cal.com** - Scheduling
5. **Formbricks** - Forms + AI
6. **GrowthBook** - Feature flags
7. **Novu** - Notifications
8. **Meilisearch** - Search
9. **ZFS** - Filesystem
10. **Ansible** - Config management (NOT testing)
11. **FFmpeg/GStreamer** - Audio/video processing
12. **Faster-Whisper** - Local speech-to-text
13. **Helix/Zellij** - Modern terminal workflow
14. **Nix** - Reproducible package management

---

## INTEGRATION PATTERNS

### Deploy Pattern
```
Local → Git Push → SSH rsync → PM2 restart → ntfy.sh notification
```

### Search Pattern
```
Supabase/PocketBase → Webhook → Meilisearch sync → Frontend instant search
```

### Monitoring Pattern
```
Cron health-check.sh → ntfy.sh → Phone notification
```

### Backup Pattern
```
ZFS auto-snapshot → Hourly/Daily → Offsite sync
```

---

## CLAUDE DIRECTIVE

When making technology recommendations:

1. **Check this registry first** for approved technologies
2. **Prefer `core` and `preferred`** status technologies
3. **Avoid `deprecated`** and anti-pattern technologies
4. **Suggest `learning`** technologies when appropriate
5. **Use quad-model workflow** (LSP → Gemini → GLM → Claude)
6. **Update this registry** when user approves new tech

### Quad-Model Workflow Rules

1. **PHASE 0 - LSP FIRST**: Use deterministic code navigation before any inference
   - `LSP(goToDefinition)` → Find exact function location
   - `LSP(findReferences)` → Find all usages
   - `LSP(hover)` → Get type information
   - `LSP(documentSymbol)` → Get file structure

2. **PHASE 1 - Gemini**: Research best practices and current standards
3. **PHASE 2 - GLM**: Implement code, tests, documentation
4. **PHASE 3 - Claude**: Synthesize and approve

### Token Savings Target
- LSP: 100% savings on code navigation (~10,000 tokens/session)
- Tri-model delegation: 80% savings on generation
- Total: 90%+ Claude token reduction

---

## HACKED-TOOLS LIBRARY

Custom enhancement modules for hackable tools.

**Location**: `~/tech-stack-gems/hacked-tools/`

| Directory | Tool | Enhancements |
|-----------|------|--------------|
| `activepieces-mods/` | Activepieces | Webhook factory, n8n migration |
| `formbricks-mods/` | Formbricks | Conditional logic engine |
| `calcom-mods/` | Cal.com | Resource scheduler, team availability |
| `novu-mods/` | Novu | Template builder (planned) |
| `growthbook-mods/` | GrowthBook | Visual editor (planned) |
| `semgrep-rules/` | Semgrep | Custom SAST rules (API, React, Node) |
| `nuclei-templates/` | Nuclei | Custom DAST templates |
| `trufflehog-mods/` | TruffleHog | Custom secret detectors |
| `woodpecker-mods/` | Woodpecker CI | Monorepo + K8s pipelines |
| `uptime-kuma-mods/` | Uptime Kuma | SLA reports, multi-region, alerts |

---

*Registry Version: 2.0*
*Last Updated: 2025-12-26*
*Owner: Command Center / AI OS*
