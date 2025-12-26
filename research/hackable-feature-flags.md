Based on the criteria of **10/10 hackability** (meaning: maximum extensibility, transparent codebase, modular architecture, and total ownership), here are the top 3 open-source alternatives to LaunchDarkly and Optimizely for 2025.

These tools move beyond simple "configuration" and allow you to modify the core logic of how flags are evaluated, how data is stored, and how the UI is rendered.

### 1. GrowthBook
**The Developer-First "Headless" Powerhouse**

*   **Hackability Score:** 10/10
*   **Tech Stack:** TypeScript / React (Frontend), Python / Go (Backend), PostgreSQL (Data Warehouse).
*   **RAM Usage:** **Low** (Backend ~256MB, Frontend runs in browser).
*   **Why it's hackable:**
    *   **Headless Architecture:** Unlike LaunchDarkly, GrowthBook does not try to own your data. It reads directly from your data warehouse (Snowflake, BigQuery, Postgres). This allows you to "hack" your feature flag logic using SQL. You can join user data, write custom targeting logic, and analyze A/B test results using standard data engineering practices.
    *   **SDK Extensibility:** The SDKs are designed to be lightweight. If you need to change how a flag is evaluated (e.g., adding a custom caching layer or cryptographic signing), the codebase is pure TypeScript/Go and easy to fork.
    *   **Visual Editor Override:** While it offers a Visual Editor for A/B testing, it uses DOM selectors rather than code injection. You can hack the editor scripts to fit custom Single Page Application (SPA) routing logic that traditional tools struggle with.

### 2. Flagr
**The "Low-Code" Logic Engine**

*   **Hackability Score:** 9.5/10
*   **Tech Stack:** Go (Golang), Vanilla JS/React.
*   **RAM Usage:** **Very Low** (Compiled binary can run efficiently on ~50-100MB).
*   **Why it's hackable:**
    *   **Evaluation as Code:** Flagr is essentially a highly performant evaluation engine wrapped in a REST API. If you don't like the UI, you can discard it entirely and run Flagr as a microservice that you query directly. Because it is written in Go, you can compile the "flag engine" directly into your own Go applications for nanosecond-evaluation latency.
    *   **Rule Engine:** The core logic is based on a "Constraint/Segment" model. This structure is easily manipulated via API or DB to create dynamic, recursive flagging logic (e.g., flags that roll back automatically if error rates spike—provided you hook it up to a metrics pipeline).
    *   **Simplicity:** It has almost zero moving parts. There are no complex queues or heavy databases. This makes it the perfect "sandboxes" for developers to experiment with custom routing algorithms without fighting the platform.

### 3. Flipt (formerly Flipt)
**The High-Performance "Stateless" Specialist**

*   **Hackability Score:** 9/10
*   **Tech Stack:** Go, Protobuf, gRPC, React.
*   **RAM Usage:** **Minimal** (Optimized for edge deployment; runs on <50MB).
*   **Why it's hackable:**
    *   **Plug-in Architecture:** Flipt is designed to be embedded. It supports a "Cloud Native" approach where you can run it locally, in your own K8s cluster, or even embed it directly into a Go application using the Flipt library. This allows you to override the default store and write custom backends (e.g., reading flags from Consul, Etcd, or a custom config map).
    *   **Protocol Buffers:** Instead of heavy JSON REST APIs, Flipt uses gRPC and Protobufs. If you are building a high-performance system, you can interact with Flipt at the binary level, which is a "hacker's dream" for minimizing latency and overhead.
    *   **UI Decoupling:** The UI is decoupled from the backend API, allowing you to throw away the default dashboard and build a custom control plane using the API, while retaining the high-performance evaluation engine.

### Summary: Which one to choose?

*   **Choose GrowthBook** if you want to hack **Data & SQL**. (Best for Product/Data teams who want to own the analytics logic).
*   **Choose Flagr** if you want to hack **Microservices & REST**. (Best for teams wanting a simple, lightweight API-based flagging service).
*   **Choose Flipt** if you want to hack **Performance & Architecture**. (Best for infrastructure-heavy teams needing sub-millisecond evaluation and custom backends).
