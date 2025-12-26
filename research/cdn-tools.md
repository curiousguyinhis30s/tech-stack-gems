# CDN & Edge Caching Tools - 2025 Research

*Generated via GLM parallel research*

## Summary
The "CDN" definition has shifted in 2025. Developers want:
- **Programmability** (Edge computing)
- **S3 compatibility** (avoid vendor lock-in)
- **Observability**

## Comparison Table

| Name | Hackability | Self-Hosted | RAM | API Quality | Use Case |
|:-----|:-----------:|:-----------:|:---:|:-----------:|:---------|
| **Cloudflare R2 + Workers** | **10/10** | No* | N/A | Excellent | Edge computing, image transform, avoid AWS egress |
| **BunnyCDN** | **7/10** | No | N/A | High | High-volume media, storage optimization |
| **Varnish Cache** | **9/10** | Yes | ~512MB-1GB | N/A (VCL) | Complex caching logic, massive traffic |
| **Caddy** | **8/10** | Yes | ~100-200MB | High (JSON) | Auto-HTTPS, dynamic config, rapid prototyping |
| **Nginx** | **8/10** | Yes | ~50MB | N/A (Config) | Load balancing, microservices gateway |
| **KeyCDN** | **6/10** | No | N/A | Medium | Static assets, cache-control purists |

---

## Recommendations

### For Hackable Projects:

1. **Cloudflare R2 + Workers** (10/10)
   - Not just CDN, it's a distributed computer
   - Write JS/TS at the edge before requests hit storage
   - Use Case: Build serverless image handler with device detection

2. **Caddy** (8/10) - Self-Hosted
   - Written in Go, JSON config via API
   - POST config changes without restart
   - Use Case: Dynamic cache rules based on DB load

3. **Varnish** (9/10) - Self-Hosted
   - VCL is a DSL designed for caching logic
   - Use Case: Edge Side Includes (ESI) for fragment caching

---

## The Hack: Build Your Own Edge

```yaml
# docker-compose.yml - Self-hosted CDN stack
version: '3.8'
services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    environment:
      - ADMIN_API=:2019

  varnish:
    image: varnish:7
    ports:
      - "8080:80"
    volumes:
      - ./default.vcl:/etc/varnish/default.vcl
    command: "-f /etc/varnish/default.vcl -s malloc,256m"

volumes:
  caddy_data:
```

---

## Final Verdict

| Use Case | Best Choice |
|----------|-------------|
| Serverless Edge Computing | **Cloudflare R2** |
| High-volume media delivery | **BunnyCDN** |
| Self-hosted with API control | **Caddy** |
| Complex caching logic | **Varnish** |
| Load balancing + caching | **Nginx + OpenResty** |
