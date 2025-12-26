Here are the top 3 open-source tools for Log Management & Observability in 2025 that meet your strict requirements (Self-hosted, <4GB RAM, highly customizable), prioritizing "hackability"—defined as the ease of modifying the codebase, extending functionality via plugins, and scripting custom logic.

### 1. Grafana Loki
**The "Programmer's Choice" for Log Aggregation**

*   **Hackability Score:** 10/10
*   **Tech Stack:** Go (Backend), React (Frontend), LogQL (Query Language).
*   **RAM Usage:** ~512MB - 1GB (Highly efficient).
*   **Why it’s Hackable:**
    Loki was designed specifically to address the "bloat" of ELK. It is incredibly hackable because it does **not** index the full text of your logs (which kills RAM), but rather indexes *labels* (metadata).
    *   **The Hook:** You can write custom LogQL queries that act like code to filter and aggregate logs.
    *   **Extension:** It uses a modular architecture (Ingester, Querier, Distributor) that can be easily modified or recompiled in Go.
    *   **Ecosystem:** It integrates natively with the rest of the Grafana ecosystem (Grafana, Mimir, Tempo), allowing you to build a full observability stack where you can inject custom TypeScript/React into the dashboards.

### 2. Plausible Analytics
**The "Hackable" Alternative for Application/Web Observability**

*   **Hackability Score:** 9.5/10
*   **Tech Stack:** Elixir (Phoenix Framework), PostgreSQL, ClickHouse (optional).
*   **RAM Usage:** ~1GB - 2GB (Runs smoothly on cheap VPS).
*   **Why it’s Hackable:**
    While technically an analytics tool, Plausible is the premier open-source alternative to Google Analytics and Amplitude. It is vastly superior to Datadog for "user observability."
    *   **The Hook:** Built on **Elixir** and **Phoenix**, it utilizes channels for real-time data updates. The codebase is renowned for being clean, readable, and easy to contribute to.
    *   **Extension:** Unlike complex Java stacks, Elixir allows for massive concurrency with low overhead. You can easily fork it to add custom event tracking, export data to weird formats, or embed custom widgets.
    *   **Privacy:** It ships with a "no-cookie" policy, making it easy to hack for privacy-focused compliance needs.

### 3. OpenObserve
**The "All-in-One" Rust Powerhouse**

*   **Hackability Score:** 9/10
*   **Tech Stack:** Rust, React, Actix Web.
*   **RAM Usage:** ~2GB - 4GB (Borderline, but extremely optimized for what it does).
*   **Why it’s Hackable:**
    This is the 2025 answer to the complexity of the ELK stack. Written in **Rust**, OpenObserve promises to ingest massive amounts of data on tiny hardware.
    *   **The Hook:** It is a single binary that replaces Datadog, Elasticsearch, and Grafana. Because it is written in Rust, memory safety issues are rare, and performance is predictable.
    *   **Extension:** The internal pipeline for ingestion is exposed. You can write custom **WebAssembly (WASM)** functions (Rust, C, or Go) to transform logs *before* they are stored, effectively allowing you to inject your own logic into the core pipeline without recompiling the entire tool.
    *   **Modern Stack:** The frontend is standard React/TypeScript, making dashboard customization (forking the UI) familiar to any web developer.

### Summary Table

| Tool | Use Case | Best For... | Ingestion Hackability |
| :--- | :--- | :--- | :--- |
| **Loki** | Centralized Logging | DevOps engineers who love CLI and grep-like syntax. | Writing custom pipelines (Logfmt/JSON). |
| **Plausible** | Product Observability | Developers building SaaS who need user journey tracking. | Adding custom Elixir logic for event processing. |
| **OpenObserve** | Unified Observability | Teams wanting to replace Splunk/Datadog 1:1 on cheap hardware. | Using WASM for in-flight log transformation. |
