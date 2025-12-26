## Medusa.js Docker Production Deployment (2025)

### docker-compose.yml

```yaml
version: '3.8'

services:
  medusa:
    image: medusajs/medusa:v2.0
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/medusa
      - REDIS_URL=redis://redis:6379
      - STORE_CORS=${STORE_URL}
      - ADMIN_CORS=${ADMIN_URL}
      - JWT_SECRET=${JWT_SECRET}
      - COOKIE_SECRET=${COOKIE_SECRET}
    ports:
      - "9000:9000"
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=medusa
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs:/var/log/nginx
    depends_on:
      - medusa

volumes:
  postgres_data:
  redis_data:
```

### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    upstream medusa {
        server medusa:9000;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name example.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name example.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Medusa backend
        location / {
            proxy_pass http://medusa;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Admin panel
        location /app {
            proxy_pass http://medusa;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

### SSL Setup (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d example.com

# Copy to Docker
sudo cp /etc/letsencrypt/live/example.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/example.com/privkey.pem ./ssl/

# Auto-renewal (cron)
0 0 * * * certbot renew --quiet && docker-compose restart nginx
```

### Key Requirements
- **Medusa v2.0** uses port 9000 by default
- **CORS settings** must match storefront/admin URLs
- **PostgreSQL 16** and **Redis 7** recommended
- **Proxy headers** required for proper authentication
- **SSL/TLS 1.2+** mandatory for production
