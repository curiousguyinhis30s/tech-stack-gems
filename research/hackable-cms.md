Based on your strict criteria (Self-hosted, API-first, TypeScript/JS core, and high extensibility), here are the top 3 "Headless CMS & Content" tools for 2025 that offer a **10/10 Hackability Score**.

These are selected specifically for developers who want to modify the core, bend the data structures, and own the stack.

### 1. Payload CMS
**The "Developer Experience" King**

*   **Hackability Score:** 10/10
*   **Tech Stack:** Node.js, TypeScript, React (Admin UI), MongoDB/PostgreSQL/MySQL.
*   **RAM:** ~512MB (Idle/Low traffic)

**Why it's 10/10 Hackable:**
Payload is currently the gold standard for "Code-First" CMS hackability. Unlike Strapi (which relies heavily on a GUI and complex database hooks), Payload allows you to define your entire data structure, API, and admin UI using pure TypeScript/JavaScript config objects.
*   **Global Access:** You have full access to the underlying Express (or NestJS) server, database, and the React Admin UI.
*   **Hooks:** It provides deeply granular hooks (`beforeOperation`, `afterOperation`, `beforeValidate`) that let you intercept and mutate data at any point in the lifecycle.
*   **Components:** You can build completely custom React components and drop them directly into the Admin UI or the frontend views.
*   **No Lock-in:** It is unopinionated about your frontend; it just generates a powerful REST and GraphQL API based on your code.

### 2. Strapi v4/5
**The Plugin Ecosystem Giant**

*   **Hackability Score:** 9.5/10
*   **Tech Stack:** Node.js, JavaScript/TypeScript, React (Admin UI), PostgreSQL/MongoDB/MySQL.
*   **RAM:** ~1GB (Heavy due to Admin UI)

**Why it's highly hackable:**
While you asked for alternatives to Strapi, no list of "hackable" CMS is complete without it if you define "hackable" as "extensible." However, for a pure *hack*, Payload wins. Strapi remains a top contender because of its **Hook system** and **Service architecture**. You can inject code into the request lifecycle (Middleware) and override the core controllers entirely. The 2025 roadmap focuses on improving TypeScript support and package flexibility, making it easier to fork and modify the core than previous versions.
*   **Custom Admin Panels:** You can extend the Admin UI using a plugin system that feels like a standard React app.
*   **Webhooks & Lifecycle:** You can trigger external services (like serverless functions) instantly upon content changes.

### 3. Directus
**The "Database-as-CMS" Converter**

*   **Hackability Score:** 10/10 (in a different way)
*   **Tech Stack:** Node.js, TypeScript (Runtime), Vue.js (Admin UI).
*   **RAM:** ~512MB

**Why it's 10/10 Hackable:**
Directus is not a CMS that stores content; it is a wrapper that sits *on top* of your existing SQL database. This is the ultimate hack. Unlike other CMSs that abstract the database layer away from you, Directus treats your database schema as the source of truth.
*   **Raw SQL Access:** You hack your database directly (SQL), and Directus auto-generates the API and Admin UI to match.
*   **Extensions:** It has a robust extension system (`Hooks`, `Endpoints`, `Modules`) where you can write custom TypeScript/JS to intercept requests or add entirely new REST endpoints.
*   **Flows:** It includes a no-code/low-code workflow builder that allows you to "hack" logic chains (triggers, actions) without writing code, or write custom JS functions for complex logic within the workflow.

---

### Summary of Selection

| Feature | Payload CMS | Directus |
| :--- | :--- | :--- |
| **Philosophy** | Code-First (Config-driven) | Database-First (Wrapper) |
| **Data Model** | Defined in JS/TS files | Defined in SQL Schema |
| **UI Tech** | React | Vue.js |
| **Best For** | Developers building bespoke apps | Data-heavy projects with existing DBs |
