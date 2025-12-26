# Medusa.js Subscription & Recurring Payments with Stripe (2025)

## Implementation Approaches

Medusa.js doesn't have native subscription support. You have two options:

### Option 1: Custom Implementation (Full Control)
Build your own subscription logic with workflows, scheduled jobs, and custom data models. Supports multiple payment providers.

### Option 2: Stripe Subscriptions (Delegated)
Let Stripe handle subscription logic - simpler but locks you into Stripe only.

---

## Option 2: Stripe Subscriptions (Recommended)

Since Medusa's Stripe module doesn't handle subscriptions, create a **custom Stripe Subscription Module Provider**.

### Architecture

```
Storefront → Medusa API → Custom Stripe Subscription Provider → Stripe API
```

### Key Components

1. **Payment Module Provider** - Custom provider handling Stripe subscription lifecycle
2. **Subscription Data Model** - Track subscription details (interval, period, status)
3. **Webhook Handlers** - Sync Stripe events (payment failed, subscription canceled)
4. **Scheduled Jobs** - Check for expirations/renewals

---

## Commercial Plugin: RSC-Labs Stripe Subscription

If you don't want to build from scratch, **RSC-Labs** offers a commercial plugin (€49 lifetime or subscription).

### Features
- Whole cart → subscription (limit to 1 item)
- Admin dashboard for managing subscriptions
- Customer portal for self-service
- Stripe webhook sync
- Monthly billing periods
- 14-day free trial

### Installation
```bash
yarn add @rsc-labs/medusa-stripe-subscription
```

### Configuration (medusa-config.js)
```javascript
modules: [
  {
    resolve: "@medusajs/medusa/payment",
    options: {
      providers: [
        {
          resolve: "@rsc-labs/medusa-stripe-subscription/providers/stripe-subscription",
          id: "stripe-subscription",
          options: {
            apiKey: process.env.STRIPE_API_KEY,
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            licenceKey: process.env.RSC_LABS_LICENCE
          }
        }
      ]
    }
  }
]
```

### Storefront Integration
```javascript
// Initialize payment session
await initiatePaymentSession(cart, {
  provider_id: "stripe-subscription",
  data: {
    cartId: cart.id,
    successUrl: `${getBaseURL()}/order/success`,
    cancelUrl: `${getBaseURL()}/order/cancel`,
    product: {
      product_id: "prod_...",
      variant_id: "variant_...",
      name: "Monthly subscription"
    }
  }
})

// Complete subscription (redirects to Stripe Checkout)
const result = await fetch(
  `http://localhost:9000/store/carts/${cartId}/complete-subscription`,
  { method: "POST" }
).then(r => r.json())

await stripe.redirectToCheckout({
  sessionId: result.stripeCheckoutSessionId
})
```

---

## Custom Implementation Steps

If building from scratch:

### 1. Create Subscription Module
```bash
medusa new module subscription
```

### 2. Define Data Model
```typescript
// src/modules/subscription/models/subscription.ts
import { model } from "@medusajs/framework/utils"

export const Subscription = model.define("subscription", {
  id: model.id().primaryKey(),
  stripe_subscription_id: model.text(),
  status: model.enum(["active", "canceled", "past_due", "incomplete"]),
  interval: model.enum(["month", "year"]),
  current_period_end: model.dateTime(),
  cancel_at_period_end: model.boolean().default(false),
  order_id: model.text(),
  customer_id: model.text()
})
```

### 3. Create Payment Provider
```typescript
// src/modules/subscription/providers/stripe-subscription.ts
import { AbstractPaymentProvider } from "@medusajs/framework/utils"

export class StripeSubscriptionProvider extends AbstractPaymentProvider {
  static identifier = "stripe-subscription"

  async initiatePayment(context) {
    // Create Stripe Checkout Session for subscription
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{
        price: context.product.variant_id, // Stripe Price ID
        quantity: 1
      }],
      success_url: context.data.successUrl,
      cancel_url: context.data.cancelUrl,
      metadata: {
        cart_id: context.cart.id
      }
    })

    return {
      session_id: session.id
    }
  }

  async getPaymentStatus(data) {
    const subscription = await this.stripe.subscriptions.retrieve(
      data.subscription_id
    )
    return subscription.status
  }
}
```

### 4. Webhook Handler
```typescript
// src/modules/subscription/webhooks/stripe.ts
export async function POST(req) {
  const sig = req.headers["stripe-signature"]
  const event = this.stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  )

  switch (event.type) {
    case "invoice.payment_succeeded":
      await this.subscriptionService.renewSubscription(
        event.data.object.subscription
      )
      break
    case "customer.subscription.deleted":
      await this.subscriptionService.cancelSubscription(
        event.data.object.id
      )
      break
  }

  return { received: true }
}
```

---

## Key Resources

1. **[Official Medusa Subscriptions Recipe](https://docs.medusajs.com/resources/recipes/subscriptions)** - Architecture overview
2. **[RSC-Labs Plugin](https://github.com/RSC-Labs/medusa-stripe-subscription-public)** - Commercial solution with 14-day trial
3. **[Stripe Recurring Payments](https://docs.stripe.com/recurring-payments)** - Stripe's subscription API docs
4. **[Implementation Tutorial](https://harryparkes.com/blog/medusajs-stripe-subscriptions)** - Step-by-step guide
