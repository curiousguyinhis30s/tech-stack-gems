This analysis focuses on **"Hackability"**: the ease of forking, modifying logic, extending the schema, and integrating custom business logic without fighting the framework.

Here is the breakdown for 2025.

### Top 3 Most Hackable SCM/WMS Systems (The "Custom Stack" Approach)

For a "Hackable" SCM, the industry standard is moving away from monolithic ERPs (like Odoo) toward **composable** tools built on modern frameworks (Node.js/Python) that are API-first.

#### 1. Shiphero (Open Source Edition)**
*   **Note:** As of late 2024, the most prominent "hackable" open-source warehousing logic comes from the ecosystem surrounding **Medusa.js**. While Medusa is an commerce engine, its internal architecture and the community plugins effectively function as an OMS/WMS.
*   *Alternative:* If using strictly external tools, **PartKeepr** (for components) or **Snipe-IT** (for assets) are highly hackable, but for true SCM (Order-to-Inventory), **Medusa's internal architecture** currently leads the "hackable" pack.

*   **Hackability Score:** **9.5/10** (Written in TypeScript, highly modular).
*   **Tech Stack:** Node.js, TypeScript, PostgreSQL, Redis.
*   **RAM Requirements:** 2GB+ (for local dev), 4GB+ recommended for production.
*   **Integration with Medusa.js:** Native. It *is* the same architecture.
*   **Why it's hackable:**
    *   **Codebase Ownership:** The logic is just code, not obscure XML configurations. You can copy-paste the "fulfillment" service into your project and change exactly how it calculates shipping weight.
    *   **No "Magic":** It lacks the massive overhead of legacy ERPs. If you want to build a custom "Kiosk Mode" for warehouse pickers using a tablet, you just build a React frontend that hits the API.

#### 2. Odoo (Community Edition)**
*   **Hackability Score:** **8.5/10** (Despite being an ERP, it is incredibly malleable if you know Python).
*   **Tech Stack:** Python, PostgreSQL, XML (Views), JavaScript (OWL framework).
*   **RAM Requirements:** 2GB minimum (for a single user), 8GB+ recommended for a database with >10k products.
*   **Integration with Medusa.js:** Good. **Medusa has an official plugin (`medusa-fulfillment-odoo`)** that syncs products and inventory, though mapping the order logic can sometimes be tricky due to Odoo's complex "Partner" model.
*   **Why it's hackable:**
    *   **Model-View-Controller (MVC):** You can override *any* model. If you don't like how the "Stock Move" works, you can inherit the class, write a new `def action_confirm`, and inject your logic.
    *   **The "Module" System:** Creating a custom module is standard practice. You aren't "hacking" the core; you are extending it safely.
    *   **Community:** Largest ecosystem of hacks and snippets on the internet.

#### 3. ERPNext (The "Non-ERP" ERP)**
*   **Hackability Score:** **8/10** (Highly flexible framework, held back by older JS and complex metadata).
*   **Tech Stack:** Python, Frappe Framework (custom ORM), MariaDB/PostgreSQL, Jinja2, JS (Vue/Alpine).
*   **RAM Requirements:** 4GB minimum for a smooth server experience.
*   **Integration with Medusa.js:** Doable via API or custom middleware. ERPNext has a robust REST API and a specific "Stock" layer.
*   **Why it's hackable:**
    *   **Frappe Framework:** It is a full low-code platform. You can create a custom DocType (table) for "Warehouse Zones," link it to "Items," and write Python scripts (Server Scripts) that trigger automatically without deploying code.
    *   **No Lock-in:** It is genuinely open source (MIT). The UI and data models are built dynamically from the database, making it very easy to add fields to the Inventory screen without touching a single line of code.

---

### The "Others" Analysis

#### Apache OFBiz
*   **Verdict:** **Do not use.**
*   **Hackability:** 2/10.
*   **Why:** It is a dinosaur. Originally released in 2001, it relies on Java Entity Engine (ECA) rules and XML minilang. It is incredibly stable and powers massive systems (like eBay backend in the past), but the learning curve is vertical. It is "hackable" only if you are a senior Java architect with months of spare time.

---

### Honest Verdict for a Small Team

**The Recommendation:**

1.  **If your team knows Node.js/JavaScript:**
    *   **Use Medusa.js (Commerce) + Shiphero Logic / Custom WMS.**
    *   Keep everything in the TypeScript ecosystem. Build your WMS logic as a set of microservices inside Medusa.
    *   *Pros:* Fastest to market, easiest to hire for, modern UI.
    *   *Cons:* You have to build the WMS features yourself (Scanning, Picking Lists).

2.  **If your team knows Python:**
    *   **Use Odoo (Community Edition).**
    *   Don't reinvent the wheel. Install *Inventory*, *Purchase*, and *Sales*.
    *   *Pros:* You get a full barcode scanner UI, automated replenishment rules, and accounting for free. You just need to build the connector to your frontend (or use Medusa's connector).
    *   *Cons:* The UI can feel heavy/admin-focused. "Business logic" is often hidden inside "Workflows" which can be annoying to debug.

**The "Medusa Integration" Warning:**
Integrating with Medusa.js is easiest when you treat the SCM as the **Source of Truth** for inventory, and Medusa as the **Source of Truth** for the Customer/Order.
*   **Odoo/Medusa:** Medusa sends order -> Odoo creates delivery order -> Odoo decrements stock -> Odoo webhook updates Medusa. This flow is robust.

**Final Recommendation:**
For a small team in 2025 wanting **Hackability + SCM features**: **Odoo Community** wins on features (Inventory double-entry accounting is hard to build yourself), but **Medusa** wins on architecture. If you have time to code your own warehouse workflows, go Medusa. If you need to ship products today, go Odoo.
