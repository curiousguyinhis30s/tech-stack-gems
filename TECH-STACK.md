# Battle-Tested Tech Stack Integration Guide

Your hidden gems arsenal, integrated with your existing workflow.

## Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR TECH STACK                              │
├─────────────────────────────────────────────────────────────────┤
│ CURRENT         │ NEW ADDITIONS                                 │
│ ─────────────── │ ──────────────────────────────────────────── │
│ PocketBase      │ + Meilisearch (search)                       │
│ Supabase        │ + ntfy.sh (notifications)                    │
│ Vercel          │ + FreeBSD + ZFS (production servers)         │
│ Next.js         │ + Elixir/Phoenix (real-time features)        │
│ GitHub          │                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. ntfy.sh - Push Notifications

**What:** Simple pub-sub notifications via HTTP
**Why:** Know instantly when deployments fail, servers go down, or users sign up

### Quick Start
```bash
# Self-host (optional)
docker run -p 8080:80 binwiederhier/ntfy

# Or use hosted: ntfy.sh
```

### Your Workflows Integration

#### A) Vercel Deployments → Phone
```bash
# Add to your deploy script or GitHub Action
curl -d "✅ $PROJECT deployed to production" \
  -H "Title: Deploy Success" \
  -H "Priority: high" \
  -H "Click: $VERCEL_URL" \
  https://ntfy.sh/your-private-topic
```

#### B) Supabase Triggers → Phone
```sql
-- Enable in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS http;

-- Notify on new user signup
CREATE OR REPLACE FUNCTION notify_new_user()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM http((
    'POST',
    'https://ntfy.sh/your-topic',
    ARRAY[http_header('Title', 'New User!')],
    'application/json',
    format('{"message": "New signup: %s"}', NEW.email)
  )::http_request);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION notify_new_user();
```

#### C) Server Monitoring Script
```bash
#!/bin/bash
# ~/scripts/monitor.sh - Add to cron

SITES=("https://yes.my" "https://hendshake.com")
TOPIC="server-alerts"

for site in "${SITES[@]}"; do
  if ! curl -sf "$site" -o /dev/null; then
    curl -d "❌ $site is DOWN!" \
      -H "Priority: urgent" \
      -H "Tags: warning" \
      https://ntfy.sh/$TOPIC
  fi
done
```

#### D) Tri-Model Workflow Notifications
```bash
# Add to your glm-execute.sh and gemini-execute.sh
# Notify when long tasks complete
curl -d "GLM task completed" https://ntfy.sh/claude-tasks
```

---

## 2. Meilisearch - Lightning Search

**What:** Typo-tolerant, instant search engine
**Why:** When PocketBase/Supabase search isn't enough

### Docker Setup
```yaml
# docker-compose.yml
version: '3.8'
services:
  meilisearch:
    image: getmeili/meilisearch:v1.10
    ports:
      - "7700:7700"
    environment:
      - MEILI_MASTER_KEY=${MEILI_KEY}
      - MEILI_ENV=production
    volumes:
      - ./meili_data:/meili_data
```

### Supabase → Meilisearch Sync

```typescript
// supabase/functions/sync-meilisearch/index.ts
import { MeiliSearch } from 'meilisearch'

const meili = new MeiliSearch({
  host: Deno.env.get('MEILI_HOST')!,
  apiKey: Deno.env.get('MEILI_MASTER_KEY')!,
})

Deno.serve(async (req) => {
  const { type, record, old_record } = await req.json()
  const index = meili.index('products')

  switch (type) {
    case 'INSERT':
    case 'UPDATE':
      await index.addDocuments([record])
      break
    case 'DELETE':
      await index.deleteDocument(old_record.id)
      break
  }

  return new Response('OK')
})
```

### PocketBase → Meilisearch Sync

```javascript
// pb_hooks/meilisearch-sync.pb.js
const MEILI_HOST = "http://localhost:7700"
const MEILI_KEY = $os.getenv("MEILI_KEY")

function syncToMeili(record, index) {
  $http.send({
    url: `${MEILI_HOST}/indexes/${index}/documents`,
    method: "POST",
    headers: { "Authorization": `Bearer ${MEILI_KEY}` },
    body: JSON.stringify([record.publicExport()]),
  })
}

// Auto-sync 'products' collection
onRecordAfterCreateRequest((e) => syncToMeili(e.record, "products"), "products")
onRecordAfterUpdateRequest((e) => syncToMeili(e.record, "products"), "products")
```

### Next.js Search Component

```tsx
// components/Search.tsx
'use client'
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch'
import { InstantSearch, SearchBox, Hits } from 'react-instantsearch'

const searchClient = instantMeiliSearch(
  process.env.NEXT_PUBLIC_MEILI_HOST!,
  process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY!
)

export function Search({ index }: { index: string }) {
  return (
    <InstantSearch indexName={index} searchClient={searchClient}>
      <SearchBox placeholder="Search..." />
      <Hits hitComponent={({ hit }) => <div>{hit.title}</div>} />
    </InstantSearch>
  )
}
```

---

## 3. FreeBSD + ZFS - Production Servers

**What:** Rock-solid OS + self-healing filesystem
**Why:** Netflix runs on this. Your data never corrupts.

### When to Use
- Production servers (not Vercel)
- Self-hosted PocketBase/Supabase
- File storage that matters
- Maximum reliability needed

### VPS Setup (DigitalOcean/Vultr)
```bash
# 1. Create FreeBSD droplet/instance
# 2. SSH in and setup

# Update packages
pkg update && pkg upgrade -y

# Install essentials
pkg install -y sudo bash git node20 npm-node20 nginx

# Create user with sudo
adduser  # Add to 'wheel' group
visudo   # Uncomment: %wheel ALL=(ALL) ALL

# Setup ZFS pool (if separate disk)
zpool create data /dev/ada1
zfs create data/apps
zfs create data/backups

# Enable auto-snapshots
pkg install zfstools
# Add to crontab:
# 15 * * * * /usr/local/sbin/zfs-auto-snapshot hourly 24
# 0 0 * * * /usr/local/sbin/zfs-auto-snapshot daily 7
```

### Firewall (PF)
```pf
# /etc/pf.conf
ext_if = "vtnet0"
tcp_services = "{ 22, 80, 443, 7700 }"

set skip on lo0
block in all
pass out all keep state
pass in proto tcp to port $tcp_services
```

```bash
# Enable firewall
sysrc pf_enable=YES
service pf start
```

### Node.js + PM2 on FreeBSD
```bash
# Install PM2
npm install -g pm2

# Start your app
pm2 start npm --name "myapp" -- start
pm2 startup  # Auto-start on boot
pm2 save
```

### ZFS Superpowers
```bash
# Instant snapshots (before risky changes)
zfs snapshot data/apps@before-update

# Rollback if something breaks
zfs rollback data/apps@before-update

# Clone for testing
zfs clone data/apps@before-update data/apps-test

# See space usage
zfs list -o name,used,avail,refer

# Enable compression (saves ~50% disk)
zfs set compression=lz4 data
```

---

## 4. Elixir/Phoenix - Real-Time Features

**What:** Erlang VM language + web framework
**Why:** WhatsApp scaled to 900M with 50 engineers using this

### When to Use (Instead of Node/Next.js)
| Use Case | Node/Next.js | Elixir/Phoenix |
|----------|--------------|----------------|
| Static sites | ✅ | ❌ |
| API endpoints | ✅ | ✅ |
| Real-time chat | 😰 Complex | ✅ Easy |
| Live dashboards | 😰 + WebSocket libs | ✅ LiveView built-in |
| High concurrency | 😰 + Redis/queues | ✅ Native |
| Self-healing | ❌ | ✅ Supervisors |

### Installation
```bash
# macOS
brew install elixir

# Or use asdf
asdf plugin add elixir
asdf install elixir latest
asdf global elixir latest
```

### Create Phoenix Project
```bash
# Install Phoenix
mix archive.install hex phx_new

# Create new project with LiveView
mix phx.new myapp --live

cd myapp
mix setup
mix phx.server
```

### LiveView Example - Real-Time Counter
```elixir
# lib/myapp_web/live/counter_live.ex
defmodule MyappWeb.CounterLive do
  use MyappWeb, :live_view

  def mount(_params, _session, socket) do
    {:ok, assign(socket, count: 0)}
  end

  def render(assigns) do
    ~H"""
    <div class="text-center p-8">
      <h1 class="text-4xl mb-4">Count: <%= @count %></h1>
      <button phx-click="inc" class="bg-blue-500 text-white px-4 py-2 rounded">
        +1
      </button>
    </div>
    """
  end

  def handle_event("inc", _params, socket) do
    {:noreply, update(socket, :count, &(&1 + 1))}
  end
end
```

### Deploy to Fly.io (Best for Elixir)
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch  # Creates fly.toml
fly deploy

# Scale globally
fly regions add sin  # Singapore
fly scale count 2    # 2 instances
```

---

## 5. Integration Matrix

### How Everything Connects

```
┌─────────────────────────────────────────────────────────────────┐
│                     YOUR ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [User Browser]                                                 │
│       │                                                         │
│       ▼                                                         │
│  [Vercel/Fly.io] ──────────────────────────────────────────────│
│       │                           │                             │
│       ▼                           ▼                             │
│  [Next.js/Phoenix] ────────► [Meilisearch]                     │
│       │                      (instant search)                   │
│       │                                                         │
│       ▼                                                         │
│  [Supabase/PocketBase] ────► [ntfy.sh] ────► [Your Phone]      │
│       │                      (push alerts)                      │
│       │                                                         │
│       ▼                                                         │
│  [FreeBSD + ZFS]                                                │
│  (self-hosted option)                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Environment Variables Template
```bash
# .env.local

# ntfy.sh
NTFY_TOPIC=your-secret-topic
NTFY_SERVER=https://ntfy.sh  # or self-hosted

# Meilisearch
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=your-master-key
NEXT_PUBLIC_MEILI_HOST=https://search.yourdomain.com
NEXT_PUBLIC_MEILI_SEARCH_KEY=your-search-only-key

# Existing
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
POCKETBASE_URL=...
```

---

## 6. Quick Start Commands

```bash
# Start Meilisearch locally
docker run -p 7700:7700 getmeili/meilisearch:v1.10

# Test ntfy.sh
curl -d "Hello from terminal!" https://ntfy.sh/your-topic

# Create Elixir/Phoenix project
mix phx.new myapp --live && cd myapp && mix setup

# FreeBSD ZFS snapshot
zfs snapshot tank/data@$(date +%Y%m%d)
```

---

## 7. Learning Path

```
Week 1: ntfy.sh
├── Set up topic
├── Add to Vercel deploy
└── Create monitoring script

Week 2: Meilisearch
├── Docker setup
├── Sync with Supabase/PocketBase
└── Add to Next.js frontend

Week 3-4: Elixir Basics
├── Install Elixir
├── Complete elixir-lang.org getting started
└── Build simple Phoenix LiveView app

Month 2: FreeBSD + ZFS
├── Spin up FreeBSD VPS
├── Learn pkg, pf, zfs basics
└── Migrate one non-critical service
```

---

## 8. Resources

- **ntfy.sh**: https://docs.ntfy.sh
- **Meilisearch**: https://docs.meilisearch.com
- **Elixir**: https://elixir-lang.org/getting-started
- **Phoenix LiveView**: https://hexdocs.pm/phoenix_live_view
- **FreeBSD Handbook**: https://docs.freebsd.org/en/books/handbook
- **ZFS Admin Guide**: https://docs.oracle.com/cd/E19253-01/819-5461

---

*Generated with tri-model workflow: Gemini (research) + GLM (docs) + Claude (synthesis)*
