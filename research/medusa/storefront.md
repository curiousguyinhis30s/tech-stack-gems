## Medusa.js + Next.js Storefront Integration Summary (2025)

### Quick Setup

**Starter Template**: [medusajs/nextjs-starter-medusa](https://github.com/medusajs/nextjs-starter-medusa)
- Next.js 15 + Medusa V2
- 2.3k stars on GitHub
- Full e-commerce features out of the box

### Core Stack

```
- Next.js 15 (App Router, Server Components, Server Actions)
- Tailwind CSS
- TypeScript
- Medusa V2 backend
```

### Setup Commands

```bash
# Backend (Medusa server on port 9000)
npx create-medusa-app@latest

# Frontend (Next.js Starter)
git clone https://github.com/medusajs/nextjs-starter-medusa
cd nextjs-starter-medusa
mv .env.template .env.local
yarn install
yarn dev  # Runs on http://localhost:8000
```

### Key API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/store/products` | List products |
| `/store/products/:id` | Product details |
| `/store/cart` | Cart operations (POST/GET) |
| `/store/countries` | Regions/countries |
| `/store/customers` | Customer auth/profile |
| `/store/orders` | Order management |
| `/store/checkout` | Checkout flow |

### Environment Variables Required

```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_STRIPE_KEY=<your-stripe-key>
NEXT_PUBLIC_SEARCH_APP_ID=<meilisearch>
```

### CORS Configuration (Backend)

Set in Medusa `config.js`:
```javascript
{
  store_cors: "http://localhost:8000"  // Your storefront URL
}
```

### Publishable API Key

**Required** to scope requests to sales channels:
- Create via Admin Dashboard or Admin API
- Pass in headers: `x-publishable-api-key: YOUR_KEY`
- When using JS Client, pass during initialization
