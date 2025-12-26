Here is the minimal setup guide for integrating Stripe with Medusa v2.

### 1. Install the Plugin

Open your terminal in your Medusa project directory and install the Stripe module:

```bash
npm install @medusajs/medusa-payment-stripe
```

### 2. Configure `medusa-config.ts`

Open your `medusa-config.ts` file. You need to add the Stripe module to the `modules` array and ensure you are using a secure key in production.

```typescript
import { defineConfig } from "@medusajs/medusa/config"

export default defineConfig({
  projects: [
    {
      // ... your other project configs (admin, store, etc.)
    },
  ],
  modules: [
    {
      resolve: "@medusajs/medusa-payment-stripe",
      options: {
        api_key: process.env.STRIPE_SECRET_KEY, 
      },
    },
  ],
})
```

### 3. Environment Variables

Make sure to add your Stripe Secret Key to your `.env` file.

```bash
STRIPE_SECRET_KEY=sk_test_...
```
