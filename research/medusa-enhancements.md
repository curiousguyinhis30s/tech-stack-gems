With Medusa v2 (now in Beta/Stable) moving towards a highly modular "Tupperware" architecture and the deprecation of the old `@medusajs/medusa` monolith in favor of the new `@medusajs/framework`, the definition of "hacking" has shifted.

We are no longer just overriding services; we are composing architectures.

Here are the specific code enhancements, architectural patterns, and module integrations to take your Medusa.js store from a standard backend to a high-performance 2025 e-commerce beast.

---

### 1. The "Headless" CMS Integration (Content Hacking)
Medusa’s built-in CMS support is basic. For 2025, you want bidirectional data synchronization so content creators don't touch the code.

**The Enhancement:** Build a **Bidirectional Strapi v4 Integration**.
Instead of just fetching data, create a workflow where creating a Product in Medusa generates a draft entry in Strapi.

**The Code Pattern:**
Create a custom workflow or event subscriber that listens to the `product.created` or `product.updated` event.

```typescript
// src/subscribers/strapi-sync.ts
import { Subscriber, type MedusaContainer } from "@medusajs/medusa"
import { StrapiApi } from "../modules/strapi" // Custom wrapper

class StrapiSyncSubscriber implements Subscriber {
  subscribeToEvents() {
    return ["product.created", "product.updated"]
  }

  async handle(event: { data: { id: string } }, container: MedusaContainer) {
    const strapi = container.resolve<StrapiApi>("strapiApi")
    const productService = container.resolve("productService")
    
    const product = await productService.retrieve(event.data.id, {
      relations: ["images", "variants", "tags"]
    })

    // Transform Medusa Product to Strapi Content Type
    const strapiEntry = {
      data: {
        title: product.title,
        description: product.description,
        slug: product.handle,
        medusa_id: product.id, // Store ID to prevent duplicates
        variants: product.variants.map(v => ({
          price: v.prices[0].amount,
          sku: v.sku
        }))
      }
    }

    // Check if exists, else create
    const existing = await strapi.findByMedusaId(product.id)
    if (existing) {
      await strapi.update(existing.documentId, strapiEntry)
    } else {
      await strapi.create(strapiEntry)
    }
  }
}

export default StrapiSyncSubscriber
```

### 2. Custom Payment Gateway Integration (The "Smart" Adapter)
Don't just build a stripe wrapper. Build a **Context-Aware Payment Router**.
In 2025, payments should route based on logic: If the cart is > $1,000, route to BNPL (Klarna/Afterpay). If the user is in EU, route to Sofort.

**The Enhancement:** Write a custom `PaymentProviderService` that acts as a **Router**.

**The Code Pattern:**
Use the new `@medusajs/payment` module interface.

```typescript
// src/modules/payment/router-provider.ts
import { AbstractPaymentProvider, PaymentActionResult } from "@medusajs/framework"

export class RouterPaymentProvider extends AbstractPaymentProvider {
  static identifier = "router-payment"

  async getPaymentOptions(cart: any) {
    // Logic: If cart total > 500, show "Pay Later" options
    return {
      provider_id: "stripe", // Default fallback
      options: {}
    }
  }

  async capturePayment(paymentData: any): Promise<PaymentActionResult> {
    // Decide which provider to actually call based on metadata stored on payment session
    const actualProvider = paymentData.metadata.provider || "stripe"
    
    // Inject actual provider service (Simplified for demo, use DI container in prod)
    if (actualProvider === "stripe") {
       // Call Stripe SDK capture
    } else if (actualProvider === "paypal") {
       // Call PayPal SDK capture
    }
    
    return { success: true, data: paymentData }
  }
}
```

### 3. Inventory / SCM: The "Virtual Warehouse" Pattern
Instead of just syncing stock, implement a **Virtual Warehouse Algorithm**.
Medusa allows multiple stock locations. You can hack this to create a "Virtual" location that aggregates stock from dropshippers or 3PLs (Third Party Logistics) in real-time, rather than storing it in your database.

**The Enhancement:** Override `inventoryService` to fetch stock from an external SCM (like NetSuite or a custom spreadsheet) before displaying availability.

**The Code Pattern:**
Extend the Inventory Service to check an external API if local stock is 0.

```typescript
// src/modules/inventory/scm-provider.ts
import { InventoryService } from "@medusajs/medusa"

class ScmAwareInventoryService extends InventoryService {
  async retrieveAvailableItemQuantity(itemId: string): Promise<number> {
    // 1. Check Local Medusa DB first
    let quantity = await super.retrieveAvailableItemQuantity(itemId)
    
    if (quantity > 0) return quantity

    // 2. If 0, check external SCM (The "Infinite Shelf" hack)
    const scmStock = await this.fetchFromScm(itemId)
    
    // 3. Optional: Create a "Reservation" in SCM immediately if user adds to cart
    return scmStock
  }

  async fetchFromScm(sku: string) {
    // Fetch from external API (e.g., SAP, Oracle, Alibaba)
    const response = await fetch(`https://scm.api/stock/${sku}`)
    const data = await response.json()
    return data.available_quantity
  }
}
```

### 4. Multi-Vendor Marketplace: The "Schema Extension"
Medusa now supports modular data models. Don't hack the `product` table with `vendor_id` JSON columns. Create a proper relational `vendor` module.

**The Enhancement:** Create a custom `Vendor` Module and link it to Products.

**The Code Pattern:**
Define a custom module using the new DDL (Data Definition Language) capabilities in Medusa v2.

```typescript
// src/modules/vendor/vendor-model.ts
import { model } from "@medusajs/framework/utils"

// 1. Define the Schema
export const Vendor = model.define("vendor", {
  id: model.id().primaryKey(),
  name: model.text(),
  commission_rate: model.number(), // e.g. 0.15 for 15%
  logo_url: model.text(),
  // Define relationship
  products: model.hasMany(() => Product, {
    mappedBy: "vendor"
  })
})

// 2. Link Product to Vendor (Extension)
// src/modules/product/product-extension.ts
import { Product } from "@medusajs/medusa"
import { Vendor } from "../vendor/vendor-model"

Product.defineRelation("vendor", {
  type: "belongsTo",
  target: Vendor,
})
```

**Logic Hack:** Implement a "Settlement" workflow. When an order is placed, listen for `order.placed`. Calculate `total * commission_rate`, create a `Payout` entity, and deduct it from the Admin's view while marking the rest as "Vendor Payable".

### 5. Subscription Commerce: The "Recurring Job" Engine
Instead of using a rigid Subscription plugin, build a **Frequency Engine** using Medusa's internal Job Scheduler and Linkable Modules.

**The Enhancement:** Create a `Subscription` entity that links a `Customer` to a `ProductVariant` and a `CronExpression`.

**The Code Pattern:**
Use the Link modules to connect an Order to a Subscription.

```typescript
// src/modules/subscription/subscription-model.ts
export const Subscription = model.define("subscription", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  next_order_date: model.dateTime(),
  frequency: model.text(), // e.g. "0 0 * * *" (Cron syntax)
  status: model.enum(["active", "paused", "cancelled"]),
  metadata: model.json() // Store variant IDs here
})

// src/modules/subscription/job-processor.ts
import { JobService } from "@medusajs/medusa"

export default async function containerLoader({ container }) {
  const jobService = container.resolve(JobService)

  // Create a recurring worker
  jobService.create("subscription-renewal", {}, "0 0 * * *", async (job) => {
    const subRepo = container.resolve("subscriptionRepository")
    const cartService = container.resolve("cartService")
    const orderService = container.resolve("orderService")

    // 1. Fetch all subscriptions due today
    const dueSubs = await subRepo.find({ 
      where: { next_order_date: { $lte: new Date() }, status: "active" } 
    })

    for (const sub of dueSubs) {
      // 2. Create cart
      const cart = await cartService.create({ customer_id: sub.customer_id })
      await cartService.addLineItem(cart.id, sub.metadata.variant_id)

      // 3. Create Order (bypass payment if token stored, or trigger payment intent)
      await orderService.createFromCart(cart.id)
      
      // 4. Update next_order_date based on frequency cron logic
    }
  })
}
```

### 6. AI-Powered Recommendations (Vector Search)
Integrating OpenAI is easy. Integrating **Vector Search** is the 2025 flex. Use Medusa's event system to push product embeddings to a Vector DB (like Pinecone or Qdrant) and query it for "Related Products".

**The Enhancement:** Listen to `product.updated` -> Generate Embedding -> Store in Vector DB.

**The Code Pattern:**
Embedding generator using OpenAI + Vector Query.

```typescript
// src/modules/ai/embedding-subscriber.ts
import openai from "openai"

class AIEmbeddingSubscriber {
  async handleProductUpdate(product: any) {
    // Combine title + description for semantic context
    const text = `${product.title} ${product.description}`
    
    // Generate Embedding
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    })

    const vector = response.data[0].embedding

    // Upsert to your Vector Store (Pseudo-code)
    await vectorDb.upsert({
      id: product.id,
      values: vector,
      metadata: { category: product.category }
    })
  }

  async getRecommendations(productId: string) {
    // Query Vector DB for nearest neighbors
    const results = await vectorDb.query({
      vector: await this.getVectorForProduct(productId),
      topK: 4,
      includeMetadata: true
    })
    return results.matches
  }
}
```

### The "100x Better" Checklist Summary
1.  **Decouple CMS**: Use event listeners to keep Strapi/Sanity in sync.
2.  **Abstract Payment**: Build a router provider that switches gateways based on cart contents/geo-location.
3.  **Schema First**: Use the new `model.define` to create proper Relationships (Vendors, Subscriptions) instead of stuffing JSON into `metadata`.
4.  **Job Scheduler**: Use the internal job system for subscriptions, not just `setInterval`.
5.  **Vectorize**: Don't just tag products; vectorize them for semantic search.

By moving away from "hacking core files" to "extending the container," you make your Medusa instance upgrade-proof and infinitely scalable.
