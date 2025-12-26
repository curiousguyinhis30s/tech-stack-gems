Here is the brutal, no-BS comparison for 2025.

### The Executive Summary
If you are a small startup (1–5 devs) self-hosting on a VPS: **Choose Authentik.**

Unless you have a specific legal requirement to use Keycloak or a legacy system that forces it, Keycloak is overkill and will eat your VPS alive. Authentik is lightweight, modern, and actually manageable by a small team without dedicating a person to "IAM duty."

---

### 1. Authentik (The Developer-Friendly Choice)

Authentik was built to be the "Glue" of your infrastructure. It handles authentication (Login) and authorization (Group membership/permissions) and connects everything together.

**The Good:**
*   **Resource Usage (The VPS Savior):** It is incredibly light. You can run the Docker Compose setup on a **2GB RAM, 1 CPU** VPS comfortably. It uses Go and Python, requiring very little overhead.
*   **UI/UX:** The UI is clean, responsive, and modern. It feels like using a SaaS product (like Vercel or Netlify) rather than enterprise software.
*   **Configuration:** You configure about 80% of things through the Web UI. You rarely have to touch JSON files or environment variables unless you are doing advanced branding.
*   **Features:** It comes with "one-click" setup for common providers (Google, GitHub, Discord, Azure). It supports OAuth2/OIDC, LDAP, and SAML out of the box.

**The Bad:**
*   **Maturity:** It is younger than Keycloak. You might occasionally hit a bug in a niche SAML flow, though the community is very active on Discord.
*   **Documentation:** While good, it sometimes assumes you know how identity providers work conceptually.

**Verdict for Startups:** It just works. You spin it up, create a provider, and hook it up to your apps. It stays out of your way.

---

### 2. Keycloak (The Enterprise Tank)

Keycloak is the standard for huge enterprises. It is written in Java (Quarkus). It is feature-rich but heavy.

**The Good:**
*   **Features:** If you need User-Managed Access (UMA), complex identity brokering, or extremely granular SPI (Service Provider Interface) extensions, Keycloak is king.
*   **Market Share:** It’s the "safe" bet for corporate contracts. If you get acquired by a bank, they probably use Keycloak.

**The Bad:**
*   **Resource Usage (The VPS Killer):** Keycloak is Java. It wants RAM. To run it comfortably on a VPS, you need at least **2GB of RAM dedicated purely to the JVM heap**, meaning you realistically need a **4GB VPS** if you want to run a database alongside it. It will swap and die on a cheap $5/mo DigitalOcean droplet.
*   **UI/UX:** The UI has been updated recently, but it still feels like a Java admin panel from 2015. It is clunky, and the menus are dense.
*   **Maintenance:** To do simple things (like adding a custom theme or changing an email template), you often have to mount volumes, change properties files, or restart the container. It requires "Ops" mindset rather than a "Product" mindset.

**Verdict for Startups:** It is sledgehammer cracking a nut. You will spend hours fighting JVM garbage collection settings just to keep it from crashing on your small server.

---

### Honest Comparison by Category

#### 1. Ease of Maintenance (Winner: Authentik)
*   **Authentik:** Updates are usually just `docker-compose pull && up`. Migrations happen automatically. The UI warns you if a configuration is invalid.
*   **Keycloak:** Major version upgrades (e.g., v20 to v21 to v22) used to be a nightmare (breaking changes everywhere). It has gotten better with Quarkus, but you still need to understand Java classpathing if something breaks.

#### 2. Modern UI (Winner: Authentik)
*   **Authentik:** Looks like a 2024 web app. Dark mode support. Good flow diagrams.
*   **Keycloak:** Functional, but ugly. The user login screen is easy to style, but the Admin Console is a dated mess of nested accordions.

#### 3. Resource Usage (Winner: Authentik by a landslide)
*   **Authentik:** **~512MB - 1GB RAM** idle.
*   **Keycloak:** **~1.5GB - 2GB RAM** idle (minimum).

#### 4. "Self-Hosted on VPS" Reality Check
If you put Keycloak on a $6/mo Hetzner or DigitalOcean box (1GB RAM), your site will go down every time Java runs its garbage collection. You will need to pay for a more expensive server just to host the login page. Authentik costs pennies to host.

### Final Recommendation

**Go with Authentik.**

For a 1–5 person team, you need speed and low friction. Authentik allows you to treat Auth as a microservice that you set up once and forget about. Keycloak requires you to treat it as a complex infrastructure project.

**The only reason to choose Keycloak in 2025:**
You are building a product that strictly requires compatibility with a specific, ancient enterprise SAML protocol that Authentik doesn't support perfectly, or you have a dedicated DevOps engineer who loves Java.
