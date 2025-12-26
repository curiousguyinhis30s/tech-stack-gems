# Formbricks L3 Deep Mod Architecture

## Fork Target
`github.com/formbricks/formbricks` → `github.com/your-org/formbricks-hacked`

## Core Enhancements

### 1. AI Question Generator
LLM-powered survey creation:
- OpenAI GPT-4 with structured output
- JSON schema validation
- Type-safe question generation

### 2. Advanced Conditional Logic Engine
Replace regex with JSON Logic:
- AND/OR nesting support
- Operators: equals, contains, greater_than, is_empty
- Variable path resolution (dot notation)

### 3. Payment Integration (Stripe)
- Embedded Stripe Connect
- Gated survey features
- Usage-based billing

### 4. Multi-Tenant White-Labeling
Middleware-level branding:
- X-Tenant-Id header injection
- CSS variable overrides
- Logo/color customization per subdomain

### 5. Custom Question Type Registry
Plugin architecture:
- Runtime component registration
- Zod validation schemas
- Icon customization

## File Structure
```
formbricks-mods/
├── enhancements/
│   ├── conditional-engine.ts (existing)
│   ├── ai-question-generator.ts
│   ├── payment-integration.ts
│   ├── white-label-middleware.ts
│   └── question-type-registry.ts
├── docker/
│   └── docker-compose.yml
└── L3-DEEP-MOD.md
```

## Docker Setup
```yaml
services:
  web:
    build: .
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
  db:
    image: postgres:15-alpine
  redis:
    image: redis:7-alpine
```
