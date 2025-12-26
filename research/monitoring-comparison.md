# Monitoring Tools Comparison (2025)

## Hackability-First Selection Criteria

**Minimum hackability score: 7/10** for inclusion in tech stack.

---

## Recommended Stack (Small Team)

### Primary: Uptime Kuma (9/10 Hackability)
- **Category**: Uptime/Synthetic Monitoring
- **Tech**: Node.js (Koa.js) + Vue.js frontend
- **RAM**: 100-200MB
- **Use Case**: "Is my API reachable?" Status pages, ping monitoring
- **Hackability**: Pure JS/Vue, easy to add custom monitors

### Secondary: Netdata (7/10 Hackability)
- **Category**: Infrastructure Monitoring
- **Tech**: C core, Python/Bash plugins
- **RAM**: 100-200MB
- **Use Case**: Server health, CPU/RAM/Disk/I/O spikes
- **Hackability**: Drop-in plugin architecture

### Optional: Beszel (8/10 Hackability)
- **Category**: Container Stats
- **Tech**: Go-based
- **RAM**: 50-150MB
- **Use Case**: Docker container monitoring, homelab
- **Hackability**: Single Go binary, easy to fork

**Total RAM for combo**: ~300-500MB

---

## Tools We Skip (Low Hackability)

### Checkmk RAW (3/10) - AVOID
- GUI-only config stored in binary database
- Cannot git-manage config like Prometheus
- "Convention over Configuration" - enterprise mindset
- 4-8GB RAM for production
- **Alternative**: Netdata + Uptime Kuma

### Victoria Metrics (4/10) - Skip
- Black-box database design
- Not meant to be hacked, just used
- **Use only if**: Replacing Prometheus for cost savings

### Prometheus+Grafana (6/10) - Optional
- Industry standard but config-heavy
- 2.5GB+ RAM
- Borderline hackability (ecosystem vs core)
- **Use only if**: K8s-heavy infrastructure

---

## Comparison Matrix

| Tool | Hackability | RAM | Config Style | Best For |
|------|-------------|-----|--------------|----------|
| Uptime Kuma | 9/10 | 100-200MB | GUI + API | Status pages, synthetic |
| Beszel | 8/10 | 50-150MB | Code | Docker stats |
| Netdata | 7/10 | 100-200MB | Drop-in | Server health |
| Prometheus | 6/10 | 2GB+ | YAML | K8s metrics |
| Victoria M. | 4/10 | 500MB | Config | LTS metrics |
| Checkmk | 3/10 | 4-8GB | GUI-locked | Enterprise (avoid) |

---

## Quick Start

```bash
# Uptime Kuma (5 minutes)
docker run -d --name uptime-kuma \
  -p 3001:3001 \
  -v uptime-kuma:/app/data \
  louislam/uptime-kuma:1

# Netdata (2 minutes)
docker run -d --name netdata \
  -p 19999:19999 \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  netdata/netdata
```

---

*Research conducted: 2024-12-26*
*Source: GLM 4.7 analysis*
