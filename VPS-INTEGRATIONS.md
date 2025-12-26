# VPS + SSH Tech Stack Integrations

Your workflow: VPS with SSH deployment (no Vercel)

---

## ntfy.sh for VPS Workflow

### A) Deployment Notifications via SSH
```bash
#!/bin/bash
# ~/scripts/deploy.sh

PROJECT=$1
SERVER="user@your-vps.com"
TOPIC="deploys"

echo "🚀 Deploying $PROJECT..."

# Notify start
curl -s -d "Deploying $PROJECT to production..." \
  -H "Title: Deploy Started" \
  https://ntfy.sh/$TOPIC

# SSH deploy
ssh $SERVER "cd /var/www/$PROJECT && git pull && npm install && pm2 restart $PROJECT"

if [ $? -eq 0 ]; then
  curl -s -d "✅ $PROJECT deployed successfully" \
    -H "Title: Deploy Success" \
    -H "Priority: high" \
    -H "Tags: white_check_mark" \
    https://ntfy.sh/$TOPIC
else
  curl -s -d "❌ $PROJECT deployment FAILED!" \
    -H "Title: Deploy Failed" \
    -H "Priority: urgent" \
    -H "Tags: rotating_light" \
    https://ntfy.sh/$TOPIC
  exit 1
fi
```

### B) Server Monitoring Cron (on VPS)
```bash
#!/bin/bash
# /root/scripts/health-check.sh
# Add to cron: */5 * * * * /root/scripts/health-check.sh

TOPIC="server-alerts"
HOSTNAME=$(hostname)

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
  curl -s -d "⚠️ Disk at ${DISK_USAGE}% on $HOSTNAME" \
    -H "Priority: high" https://ntfy.sh/$TOPIC
fi

# Check memory
MEM_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
if [ $MEM_USAGE -gt 90 ]; then
  curl -s -d "⚠️ Memory at ${MEM_USAGE}% on $HOSTNAME" \
    -H "Priority: high" https://ntfy.sh/$TOPIC
fi

# Check critical services
for service in nginx pm2 postgresql; do
  if ! pgrep -x "$service" > /dev/null; then
    curl -s -d "❌ $service is DOWN on $HOSTNAME!" \
      -H "Priority: urgent" https://ntfy.sh/$TOPIC
  fi
done
```

### C) Log Watcher (on VPS)
```bash
#!/bin/bash
# /root/scripts/log-watcher.sh
# Watches logs for errors and notifies

LOGFILE="/var/log/nginx/error.log"
TOPIC="server-alerts"

tail -F $LOGFILE | while read line; do
  if echo "$line" | grep -iE "(error|critical|failed)" > /dev/null; then
    curl -s -d "🔴 Error: $(echo $line | head -c 200)" \
      -H "Title: Log Alert" \
      -H "Priority: high" \
      https://ntfy.sh/$TOPIC
  fi
done
```

---

## SSH Deploy Script (Full Featured)

```bash
#!/bin/bash
# ~/scripts/ssh-deploy.sh
# Usage: ./ssh-deploy.sh projectname

set -e

PROJECT=$1
SERVER="user@your-vps.com"
REMOTE_PATH="/var/www/$PROJECT"
TOPIC="deploys"

if [ -z "$PROJECT" ]; then
  echo "Usage: ./ssh-deploy.sh <project-name>"
  exit 1
fi

notify() {
  curl -s -d "$1" -H "Title: $2" -H "Priority: $3" https://ntfy.sh/$TOPIC > /dev/null
}

echo "📦 Building locally..."
npm run build

echo "🚀 Deploying to $SERVER..."
notify "Starting deploy: $PROJECT" "Deploy" "default"

# Sync files (rsync is faster than git pull for builds)
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env.local' \
  ./ $SERVER:$REMOTE_PATH/

# Run remote commands
ssh $SERVER << EOF
  cd $REMOTE_PATH
  npm install --production
  pm2 restart $PROJECT || pm2 start npm --name "$PROJECT" -- start
EOF

if [ $? -eq 0 ]; then
  notify "✅ $PROJECT deployed successfully" "Deploy Success" "high"
  echo "✅ Done!"
else
  notify "❌ $PROJECT deployment FAILED" "Deploy Failed" "urgent"
  echo "❌ Failed!"
  exit 1
fi
```

---

## FreeBSD VPS Setup for Your Stack

### Initial Setup
```bash
# On FreeBSD VPS

# 1. Update and install essentials
pkg update && pkg upgrade -y
pkg install -y sudo bash git node20 npm-node20 nginx postgresql15-server

# 2. Setup ZFS (if available)
# Check pools: zpool list
# Create app pool: zpool create apps /dev/ada1

# 3. Install PM2
npm install -g pm2

# 4. Create app directories with ZFS
zfs create apps/www
zfs create apps/backups
zfs set compression=lz4 apps

# 5. Setup auto-snapshots
pkg install zfstools
echo '0 * * * * /usr/local/sbin/zfs-auto-snapshot hourly 24' >> /var/cron/tabs/root
echo '0 0 * * * /usr/local/sbin/zfs-auto-snapshot daily 7' >> /var/cron/tabs/root
```

### Nginx Config
```nginx
# /usr/local/etc/nginx/nginx.conf

worker_processes auto;

events {
    worker_connections 1024;
}

http {
    include mime.types;

    # Upstream apps
    upstream pocketbase {
        server 127.0.0.1:8090;
    }

    upstream meilisearch {
        server 127.0.0.1:7700;
    }

    upstream nextjs {
        server 127.0.0.1:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /path/to/cert.pem;
        ssl_certificate_key /path/to/key.pem;

        location / {
            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
        }

        location /api/pb/ {
            proxy_pass http://pocketbase/;
        }

        location /search/ {
            proxy_pass http://meilisearch/;
        }
    }
}
```

### PF Firewall
```pf
# /etc/pf.conf
ext_if = "vtnet0"

# Services
tcp_pass = "{ 22, 80, 443 }"

set skip on lo0
block in all
pass out all keep state
pass in proto tcp to port $tcp_pass

# Rate limit SSH
pass in proto tcp to port 22 flags S/SA keep state \
    (max-src-conn 5, max-src-conn-rate 3/30)
```

---

## Complete VPS Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR VPS (FreeBSD + ZFS)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Nginx] ─────► [Next.js :3000]                                │
│     │                                                           │
│     ├────────► [PocketBase :8090]                              │
│     │                                                           │
│     ├────────► [Meilisearch :7700]                             │
│     │                                                           │
│     └────────► [Elixir/Phoenix :4000] (future)                 │
│                                                                 │
│  [ZFS]                                                          │
│     ├── apps/www (auto-snapshots hourly)                       │
│     ├── apps/data (database files)                             │
│     └── apps/backups (daily snapshots)                         │
│                                                                 │
│  [Cron Jobs]                                                    │
│     ├── health-check.sh → ntfy.sh                              │
│     ├── zfs-auto-snapshot                                       │
│     └── log-watcher.sh → ntfy.sh                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
          │
          │ SSH Deploy
          │
┌─────────┴─────────┐
│   YOUR MACHINE    │
│  ssh-deploy.sh    │
│  → rsync          │
│  → pm2 restart    │
│  → ntfy.sh notify │
└───────────────────┘
```

---

## Quick Commands

```bash
# Deploy to VPS
./scripts/ssh-deploy.sh yes-my

# Check server health
ssh user@vps "df -h && free -m && pm2 status"

# View logs
ssh user@vps "pm2 logs"

# ZFS snapshot before risky change
ssh user@vps "zfs snapshot apps/www@before-update"

# Rollback if broken
ssh user@vps "zfs rollback apps/www@before-update"

# Check ntfy is working
curl -d "Test from $(hostname)" https://ntfy.sh/your-topic
```

---

## Self-Host ntfy.sh on Your VPS

```bash
# On FreeBSD VPS
pkg install -y ntfy

# Config: /usr/local/etc/ntfy/server.yml
base-url: "https://ntfy.your-domain.com"
listen-http: ":8080"
behind-proxy: true
auth-default-access: "deny-all"

# Add nginx upstream
upstream ntfy {
    server 127.0.0.1:8080;
}

# Start
service ntfy enable
service ntfy start

# Now use: https://ntfy.your-domain.com/your-topic
```

---

*Your VPS = Your rules. No vendor lock-in.*
