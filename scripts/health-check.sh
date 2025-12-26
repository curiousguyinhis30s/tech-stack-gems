#!/bin/bash
# Server Health Check with ntfy.sh notifications
# Run on VPS via cron: */5 * * * * /root/scripts/health-check.sh
#
# Configure these:
NTFY_TOPIC="server-alerts"
SITES=("https://yes.my" "https://hendshake.com")  # Your sites
SERVICES=("nginx" "node" "postgres")  # Services to monitor

HOSTNAME=$(hostname)

notify() {
  curl -s \
    -d "$1" \
    -H "Title: Server Alert" \
    -H "Priority: ${2:-high}" \
    -H "Tags: ${3:-warning}" \
    "https://ntfy.sh/$NTFY_TOPIC" > /dev/null 2>&1
}

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
  notify "⚠️ Disk at ${DISK_USAGE}% on $HOSTNAME" "high" "warning"
fi

# Check memory
if command -v free &> /dev/null; then
  MEM_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
  if [ "$MEM_USAGE" -gt 90 ]; then
    notify "⚠️ Memory at ${MEM_USAGE}% on $HOSTNAME" "high" "warning"
  fi
fi

# Check websites
for site in "${SITES[@]}"; do
  if ! curl -sf --max-time 10 "$site" > /dev/null 2>&1; then
    notify "❌ $site is DOWN!" "urgent" "rotating_light"
  fi
done

# Check services
for service in "${SERVICES[@]}"; do
  if ! pgrep -x "$service" > /dev/null 2>&1; then
    notify "❌ $service is NOT running on $HOSTNAME" "urgent" "skull"
  fi
done

# Check load average
LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $1}' | tr -d ' ')
LOAD_INT=${LOAD%.*}
CPU_COUNT=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 1)

if [ "$LOAD_INT" -gt "$((CPU_COUNT * 2))" ]; then
  notify "⚠️ High load: $LOAD on $HOSTNAME" "high" "fire"
fi
