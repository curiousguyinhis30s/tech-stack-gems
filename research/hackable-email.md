Here are the top 3 most hackable, open-source alternatives to SendGrid/Mailgun for 2025.

These selections prioritize a **"Low-Level Architecture"** philosophy: they do not try to hide the email sending process behind a black-box SaaS abstraction. Instead, they expose the underlying queues, databases, and protocols, allowing you to modify behavior, inject custom logic mid-stream, and integrate deeply into your own stack.

### 1. Mailpit
**The "Developer Experience" Powerhouse**

*   **Hackability Score:** 10/10
*   **Tech Stack:** Go (Lang), SQLite, WebSockets
*   **RAM Usage:** ~30MB-50MB (Idling)

**Why it’s hackable:**
Mailpit is the modern spiritual successor to MailHog, but rewritten for high performance and 2025 standards. It is not just an SMTP server; it is a fully functional API-driven mail testing environment.
*   **The "Hack":** Unlike simple SMTP mocks, Mailpit includes a built-in **Message API** that allows you to pipe outbound emails directly into your own internal tools (e.g., Slack, Discord, or a custom analytics dashboard) via Webhooks or simple JSON fetching.
*   **Architecture:** Because it is written in Go, you can compile a single binary for any OS architecture and embed it directly into your CI/CD pipelines or Docker Compose stacks without worrying about dependency hell. Its storage engine (SQLite) can be queried directly to generate reports on how many emails your application sent during a load test.

### 2. Maddy Mail Server
**The "Universal Translator"**

*   **Hackability Score:** 10/10
*   **Tech Stack:** Go (Lang)
*   **RAM Usage:** ~100MB-200MB

**Why it’s hackable:**
Maddy was built to solve the "Postfix is hard to configure" problem. It is a modular mail server that replaces the "Frankenstein" setup of Postfix + Dovecot + Rspamd.
*   **The "Hack":** Maddy is essentially a collection of modular blocks (IMAP, SMTP, Submission, Delivery) that you can chain together using a simple config file. If you want to build a custom SMTP gateway that authenticates against a proprietary internal database or an LDAP server that isn't standard, you can write a simple Go module to plug into Maddy's auth pipeline.
*   **Extensibility:** It treats storage as a pluggable backend. You can configure it to store emails in SQL, Filesystem, or S3-compatible storage. This makes it incredibly easy to build a "Compliance Archive" where every email sent via your transactional system is instantly dumped to an S3 bucket with versioning.

### 3. Stalwart SMTP
**The "High-Performance" Modernizer**

*   **Hackability Score:** 9.5/10
*   **Tech Stack:** Rust, RocksDB
*   **RAM Usage:** ~50MB-100MB (Highly efficient)

**Why it’s hackable:**
Stalwart is the new contender on the block (written in Rust), designed specifically to be a lightweight, secure replacement for legacy MTAs. It focuses heavily on the "JMAP" standard (the modern successor to IMAP).
*   **The "Hack":** Its configuration system is data-driven. You can manage its queue, routing rules, and filtering logic via a CLI or API. Because it uses **RocksDB** (an embeddable persistent key-value store), you can interact with the mail queue and metadata directly without needing a separate MySQL/Postgres server.
*   **Remote Control:** Stalwart exposes a management interface that allows for real-time manipulation of the server state. This is perfect for "Smart Retry" logic—you can write an external script in Python/Node.js that monitors your downstream providers (like AWS SES or Gmail) and tells Stalwart to throttle or pause the queue via API if rate limits are detected, creating a feedback loop that standard MTAs lack.

---

### Summary: Which one to choose?

1.  **Choose Mailpit** if you are a developer who needs to test and debug email flows locally or in staging. It is the ultimate tool for inspecting *what* your app is sending.
2.  **Choose Maddy** if you need a full production mail server (IMAP + SMTP) and want to customize the authentication or routing logic.
3.  **Choose Stalwart** if you want the raw performance of Rust and need a transactional SMTP server that is easy to automate via script/CLI.
