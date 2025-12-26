Here is an honest, technical breakdown of **Tianji Analytics** as of 2025, specifically focusing on its position as a modern open-source analytics tool.

---

### 1. What is Tianji?
**Tianji** (formerly often associated with the "Umami is dead" movement) is an open-source, privacy-focused web analytics platform. It is written in TypeScript (Next.js) and is designed to be a lightweight, performant alternative to Google Analytics and heavier open-source tools like Matomo.

It is built for developers who want ownership of their data without the bloat of enterprise-grade platforms. It supports "events" (like PostHog) but functions largely like a session tracker (like Plausible).

### 2. Feature Breakdown: Tianji vs. PostHog vs. Plausible

This is the most critical comparison. Tianji sits in a weird "Goldilocks" zone: more advanced than Plausible, but simpler than PostHog.

| Feature | **Tianji** | **Plausible** | **PostHog** |
| :--- | :--- | :--- | :--- |
| **Core Philosophy** | Simple analytics with "just enough" event tracking. | Ethics-focused, strict simplicity. | The "Product OS." Everything including the kitchen sink. |
| **Tracking Model** | **Sessions + Custom Events.** You can track pageviews *and* send custom events (e.g., "Click Buy") with properties. | **Sessions only.** Great for traffic, terrible for product interactions. | **Event-based.** Everything is an event. Highly granular. |
| **Funnel Analysis** | **Yes.** You can build basic funnels (e.g., Landing -> Pricing -> Signup). | **No.** (Plausible is strictly for aggregate stats). | **Advanced.** Complex funnels with drop-off analysis. |
| **User ID/Retention** | **Yes.** Can track unique users over time (Cohort analysis is limited but present). | **No.** (Anonymous analytics only). | **Yes.** Deep retention tables and user paths. |
| **UI/UX** | Clean, dark-mode default. Dashboard feels modern. | Very polished, minimalist, beautiful UI. | Extremely dense UI. Can feel cluttered/overwhelming for non-engineers. |
| **Performance** | Very lightweight. Uses Postgres/ClickHouse. | Extremely lightweight. | Heavy. Requires significant infrastructure. |
| **License** | AGPL-3.0 | AGPL-3.0 | MIT (Core) |

**The Verdict on Features:**
*   Tianji kills Plausible on features because it supports **Funnels** and **Goal conversions** on custom events, whereas Plausible is purely a "vanity metrics" dashboard (views/bounce rate).
*   Tianji loses to PostHog on depth. PostHog has session replay, feature flags, and heatmaps (in some versions). Tianji is for *analytics*, not product experimentation.

### 3. Self-Hosting Requirements
This is where Tianji shines compared to PostHog.

**The Stack:**
*   **Language:** Node.js (TypeScript/Next.js)
*   **Database:** PostgreSQL (Required)
*   **Caching:** Redis (Recommended for performance/concurrency)
*   **Optional:** ClickHouse (Not required by default, but Tianji is optimized for ClickHouse if you want high-volume analytics).

**Resource Usage:**
*   **RAM:** It runs happily on **512MB - 1GB** RAM if you have a small database.
*   **Disk:** Very low impact compared to PostHog.

**Comparison:**
*   **Vs. Plausible:** Similar footprint. Both are easy on resources.
*   **Vs. PostHog:** PostHog is a resource monster. To self-host PostHog effectively (with Kafka, ClickHouse, Redis, Postgres), you need a machine with at least **4GB-8GB of RAM**. Tianji can run on a $5/month VPS.

### 4. Hackability Rating (Developer Experience)
**Rating: 8/10**

*   **The Good:** It’s a standard Next.js application. If you know React/Next.js, you can fork it, theme it, or add reports easily. The codebase is much smaller and easier to comprehend than PostHog’s monolithic architecture.
*   **The Bad:** Documentation can be spotty (English is not the primary language of the core contributors, though the code is in English).
*   **Integration:** It provides a standard JavaScript tracking snippet. You can use the HTTP API if you want to build custom tracking (e.g., backend-to-backend).

### 5. Is it better than PostHog for small teams?

**Yes.**

Here is the harsh truth about PostHog for small teams (1-5 people):
*   **PostHog is Overkill:** You probably don't need session replay logs or A/B testing variance yet.
*   **PostHog is Expensive to Host:** If you are self-hosting to avoid SaaS fees, PostHog will eat your server costs.
*   **PostHog is Noisy:** You will spend more time filtering out noise from your own internal traffic than looking at insights.

**Tianji is the sweet spot** for small teams because:
1.  It gives you **Funnels** (essential for SaaS).
2.  It gives you **Referrer data** (UTM tracking).
3.  It doesn't require a DevOps engineer to install.

### 6. Honest Verdict (2025)

**Use Tianji if:**
*   You are building a SaaS/Paid product and need to know **"Where are users dropping off in my signup flow?"** (This requires Funnels, which Plausible lacks).
*   You want to self-host on a cheap VPS (DigitalOcean $6/mo or Hetzner).
*   You want a clean, fast UI that doesn't look like a cockpit (PostHog).

**Don't use Tianji if:**
*   You need **Session Replay** (watching recordings of user sessions). Use PostHog or OpenReplay.
*   You are a pure content creator/blogger. In that case, **Plausible** is actually better because it focuses purely on traffic sources and page views, which is all you care about.
*   You rely on complex user path analysis (e.g., "Users who did A, then did B, then came back 3 days later").

**Summary:**
Tianji is the best "Self-Hosted SaaS Analytics" tool for small teams right now. It bridges the gap between the simplicity of Plausible and the power of PostHog without the heavy infrastructure tax.
