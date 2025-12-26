Based on your strict requirements (TypeScript, self-hosted, sub-2GB RAM, and a focus on "hackability" defined as extensibility and code access), here are the top 3 open-source automation tools for 2025.

### 1. n8n
**The Visual Editor with a Scripting Heart**

*   **Hackability Score:** 10/10
*   **Tech Stack:** Node.js, TypeScript
*   **RAM Usage:** ~1GB (Base), scales with workflow complexity
*   **Why it's hackable:**
    n8n is the undisputed king of fair-code licensing that strikes the perfect balance between a UI and a code editor. While it looks like Zapier, it allows you to inject raw JavaScript/TypeScript directly into any workflow step using the "Code" node. You can manipulate data, fetch external APIs, or perform complex logic without leaving the interface.
    *   **The Developer Hook:** You can build **Custom Nodes** in TypeScript. Since n8n is running on Node.js, a custom node is essentially just a class with specific methods (`execute`). You can import any npm library into your custom node (e.g., specific crypto libraries, obscure database drivers), effectively giving n8n capabilities that no SaaS tool would ever allow.

### 2. Windmill
**The Developer-First "Serverless" Engine**

*   **Hackability Score:** 10/10
*   **Tech Stack:** Rust (Backend), TypeScript/Python/Go (Scripts), React (Frontend)
*   **RAM Usage:** ~500MB - 1GB (Very efficient)
*   **Why it's hackable:**
    Windmill takes a unique approach: **automation is just code.** It treats scripts as first-class citizens. While the frontend is a low-code builder, the backend executes your code (Python, TypeScript, Go, Bash) in isolated sandboxes.
    *   **The Developer Hook:** Unlike n8n (which is a visual graph with code sprinkled in), Windmill is essentially a self-hosted TypeScript/Python function runner. Because it allows you to define a "TypeScript Script" as a step, you can paste in an entire module or helper function directly from your existing codebase. It supports **Auto-completion** and type hints in the editor, making it feel like VS Code in the browser. It is arguably the most powerful tool for engineers who want the speed of low-code but the power of a text editor.

### 3. Huginn
**The "Agents" Architecture (Maximum Flexibility)**

*   **Hackability Score:** 9/10
*   **Tech Stack:** Ruby on Rails, JavaScript (frontend)
*   **RAM Usage:** ~512MB - 1GB
*   **Why it's hackable:**
    Huginn is a tool for building "agents" that perform automated tasks for you. It is older but has a cult following because its architecture is incredibly open-ended.
    *   **The Developer Hook:** While it uses Ruby on the backend, it connects to anything that exposes an API. It is "hackable" because it encourages a **DIY mindset**. If Huginn doesn't have a specific integration, you build a generic "WebsiteAgent" or use the "ShellCommandAgent" to execute a script on your host machine. It is less about clicking buttons and more about wiring up data flows between web services and your own scripts. If you understand JSON and webhooks, Huginn can automate the internet.
