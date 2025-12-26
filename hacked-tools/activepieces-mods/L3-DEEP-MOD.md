# Activepieces L3 Deep Mod Architecture

## Fork Target
`github.com/activepieces/activepieces` → `github.com/your-org/activepieces-hacked`

## Core Enhancements

### 1. Custom Piece Factory
Create pieces dynamically without npm publish:
- `piece-factory.service.ts` - Runtime piece loading from filesystem
- `hot-reload-dev.service.ts` - Chokidar file watcher for development

### 2. AI Flow Builder
Natural language to Activepieces Flow JSON:
- OpenAI GPT-4 with JSON mode
- Context injection of available pieces
- Validation against Activepieces schema

### 3. Multi-Tenant Middleware
Strict data isolation:
- X-Tenant-Id header extraction
- Prisma middleware for query modification
- CLS (Continuation Local Storage) for context

### 4. n8n Migration Tool
Import n8n workflows:
- Node-to-Piece mapping
- Webhook parameter translation
- Connection preservation

## File Structure
```
activepieces-mods/
├── enhancements/
│   ├── webhook-factory.ts (existing)
│   ├── piece-factory.service.ts
│   ├── ai-flow-builder.service.ts
│   ├── hot-reload-dev.service.ts
│   └── multi-tenant-middleware.ts
├── migrations/
│   └── n8n-importer.service.ts
├── docker/
│   └── docker-compose.yml
└── L3-DEEP-MOD.md
```

## Docker Setup
```yaml
services:
  api:
    build: .
    volumes:
      - ./custom_pieces:/usr/src/app/custom_pieces
    environment:
      - AP_EXECUTION_MODE=UNSANDBOXED
  db:
    image: postgres:14
  redis:
    image: redis:6-alpine
```

## Integration
1. Load custom pieces at startup
2. Enable hot-reload in development
3. Apply multi-tenant middleware globally
4. Exclude webhooks from tenant isolation
