The following tools are selected based on a strict "Hackability Index" (codebase clarity, modularity, extensibility, and documentation). These are not just installable apps; they are developer platforms designed to be forked and modified.

### 1. Cal.com (formerly Calendso)
The industry standard for open-source scheduling infrastructure. While it is a polished product, its architecture is built explicitly to be a developer platform.

*   **Name:** Cal.com
*   **Hackability Score:** 10/10
*   **Tech Stack:** Next.js (React), TypeScript, Prisma (ORM), PostgreSQL, Tailwind CSS.
*   **RAM:** **Minimum 1GB** (Recommended 2GB+ for production traffic).
*   **Why it's hackable:**
    *   **App Store Ecosystem:** It features a robust "App Store" architecture. You can build new integrations (Zoom, Google Meet, Stripe, Stripe payments) as separate packages using a defined SDK without touching the messy core logic.
    *   **Monorepo Structure:** The codebase is extremely well-organized using Turborepo, making it easy to locate specific services (web, api, emails).
    *   **Hook System:** It allows for custom "Webhooks" and "App Hooks" that let you inject logic into the booking flow (e.g., "Run a Python script when a booking is confirmed").
    *   **Self-Hosted First:** Unlike many "open core" tools, the self-hosted version contains almost all features found in the cloud version.

### 2. Gauzy
A lesser-known but powerful alternative that acts more like an "Operating System" for agencies. It is a feature-rich alternative to Calendly, Clockify, and Acuity combined.

*   **Name:** Gauzy
*   **Hackability Score:** 9.5/10
*   **Tech Stack:** Angular, TypeScript, NestJS (Node.js API), TypeORM, PostgreSQL.
*   **RAM:** **Minimum 2GB** (Heavy due to ERP nature).
*   **Why it's hackable:**
    *   **Modular Design:** Unlike Cal.com (which is strictly scheduling), Gauzy provides modules for CRM, HR, and Expenses. You can disable modules you don't need, turning it into a pure booking engine or a massive workforce automation tool.
    *   **API-First Architecture:** Built on NestJS, the backend is strictly typed and structured using Domain-Driven Design (DDD). This makes writing custom scripts to manipulate bookings or sync data very predictable and safe.
    *   **Plugin System:** It offers a dynamic plugin system allowing you to inject custom UI components and server-side logic via a dedicated plugin manager, preventing "merge conflict hell" when updating the core.

### 3. Thunderbird Appointment
Born from the Mozilla community, this is a stripped-down, privacy-focused scheduling server. It is the best option if you want a lightweight engine to build a *completely custom* UI on top of.

*   **Name:** Thunderbird Appointment
*   **Hackability Score:** 9/10
*   **Tech Stack:** Python (FastAPI), Vue.js, PostgreSQL, Redis.
*   **RAM:** **512MB - 1GB** (Extremely lightweight compared to Node.js stack).
*   **Why it's hackable:**
    *   **Clean Backend (FastAPI):** If you prefer Python over JavaScript/TypeScript, this is the top choice. The API is auto-documented via OpenAPI/Swagger and is highly performant.
    *   **Decoupled Frontend:** The Vue.js frontend is separated from the Python backend. You can essentially throw away their frontend and build your own React or mobile app, using their Python server solely as the booking logic engine.
    *   **No Bloat:** It lacks the massive app ecosystem of Cal.com, which is actually a benefit for hacking. There is less code to read, making it faster to understand the data model and inject custom business rules directly into the core.

### Summary Table for Decision Makers

| Feature | **Cal.com** | **Gauzy** | **Thunderbird Appointment** |
| :--- | :--- | :--- | :--- |
| **Primary Language** | TypeScript (Node.js) | TypeScript (Node.js) | Python (FastAPI) |
| **Architecture Style** | Monolith (Next.js) | Microservices (Modular) | Decoupled (API + FE) |
| **Extensibility** | High (App Store) | High (Plugins/Modules) | Medium (Forking) |
| **Learning Curve** | Medium | Steep | Low (Backend) / Med (FE) |
| **Best For** | Building a SaaS clone. | Building an ERP/Agency tool. | Python lovers / Minimalist setups. |
