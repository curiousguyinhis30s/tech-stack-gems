This is a sophisticated architecture pattern often called **"Authentication as a Service" (AaaS)** or **Identity Brokering**.

In this setup, **Authentik** acts as the "Source of Truth" for user identities. **PocketBase** acts as the middleware (BFF - Backend for Frontend) handling low-level data and realtime updates, while **Medusa.js** handles complex commerce logic.

Here is the complete guide to integrating this stack.

### 1. ASCII Architecture Diagram

This diagram illustrates the flow where the Frontend (e.g., a React/Vue app) talks to PocketBase, which acts as the unified gateway.

```text
+------------------+       +------------------------------------------+
|   User Browser   |       |             Authentik (IdP)              |
| (Frontend App)   |<----->| (Central User DB, OIDC Provider, SSO)    |
+--------+---------+       +---------------------+--------------------+
         |                                      ^ |
         | 1. Request Auth (OIDC)               | | 4. Validate Token / Exchange Code
         |                                      | |    (Returns User Profile & Access Token)
         v                                      | |
+--------+---------+       +-------------------+-+---------------------+
|  PocketBase App  |       |               Medusa.js                  |
|  (BFF / Gateway) |<----->| (Commerce: Products, Carts, Orders)      |
+--------+---------+       +-------------------+----------------------+
         |                                  ^  |
         | 2. Store User/Session             |  | 3. API Call (Header: Bearer Token)
         |    (Link to Medusa Customer)      |  |
         v                                  |  |
+--------+---------+       +-------------------+----------------------+
|   PocketBase     |       |            JWT Verification              |
|   Database (DB)  |<------| (Medusa Middleware validates Token with   |
| (Users, Records) |       |  Authentik JWKS endpoint)                |
+------------------+       +------------------------------------------+
```

---

### 2. The Strategy

To make this work without tearing apart the internal auth of PocketBase and Medusa, we use the **"Proxy/Pass-through"** pattern:

1.  **Authentik**: Manages the login form, MFA, and user attributes.
2.  **PocketBase**:
    *   Configures an **OIDC** provider (pointing to Authentik).
    *   When a user logs in via PocketBase's generic OAuth URL, PB redirects to Authentik.
    *   **Crucial Step**: PocketBase maps the Authentik User ID (`sub`) to a local PocketBase `user` record.
    *   *Integration Point*: In PocketBase Hooks (`onOAuth2Success`), we take the email/ID from Authentik and ensure a matching `customer` exists in Medusa.
3.  **Medusa.js**:
    *   Medusa does not log users in directly.
    *   Instead, it trusts the **JWT Access Token** issued by Authentik.
    *   We configure a Medusa middleware to verify this JWT against Authentik's public keys.

---

### 3. Implementation: PocketBase & Authentik

**Step 1: Configure Authentik**
1.  Go to **Applications** -> Create New Provider (OAuth2/OpenID Connect).
2.  Protocol: **OpenID Connect**.
3.  Client ID: `pocketbase-client`.
4.  Redirect URIs: `http://localhost:8090/api/oauth2-redirect` (or your PB URL).
5.  Scopes: `openid`, `profile`, `email`.

**Step 2: Configure PocketBase**
You can set this up via the Admin UI under **Settings** -> **Authentication** -> **OIDC**.
However, to handle the Medusa sync, we need a Go Hook (`hook.go`) inside your PocketBase instance.

**File: `pb_hooks.go`**
This snippet runs when a user successfully logs in via Authentik. It ensures they exist as a customer in Medusa.

```go
package pb_hooks

import (
	"log"
	"net/http"
	"os"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	// "github.com/pocketbase/pocketbase/models" 
)

// Init is called by PocketBase during initialization
func Init(app *PocketBase) error {

	// Hook into the OIDC success event
	app.OnRecordAuthWithOAuth2Success().Add(func(e *core.RecordAuthWithOAuth2SuccessEvent) error {
        
        // 1. Get the user info from the OAuth provider (Authentik)
        oauthUser := e.OAuth2User
        
        // 2. Access the PocketBase user record that was just created/updated
        pbUser := e.Record
        
        // 3. Logic to sync with Medusa
        // In a real scenario, you might want to run this in a background goroutine
        // or use a queue to avoid slowing down the login response.
        go syncUserWithMedusa(oauthUser.Email, pbUser.Id)

		return nil
	})

	return nil
}

func syncUserWithMedusa(email string, pbId string) {
    // Implementation logic to call Medusa Admin API
    // to ensure a customer exists with this email.
    // Medusa uses a "guest cart" approach, so explicit user creation 
    // might not always be needed until checkout, but it's good practice.
    log.Printf("Syncing %s to Medusa...", email)
}
```

---

### 4. Implementation: Medusa.js & Authentik

Medusa has its own auth system. To integrate Authentik, we treat Medusa as an **API Resource Server**. We don't use Medusa's login routes; we use its protected routes.

**Step 1: Configure Authentik Provider for Medusa**
1.  In Authentik, create another **Provider** (or use the same one).
2.  Note the **Client ID** and **Client Secret**.
3.  In **Endpoints**, find the **OpenID Configuration** URL: 
    `https://auth.your-domain.com/application/o/jwks/`

**Step 2: Verify Tokens in Medusa**
You need a middleware to verify the JWT sent from the frontend (which originated from Authentik).

**File: `src/api/middleware/authentik-verify.ts`**

```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

// 1. Initialize the JWKS client (fetches public keys from Authentik)
const client = jwksClient({
  jwksUri: "https://<your-authentik-domain>/application/o/jwks/", 
});

// 2. Function to get the signing key
const getKey = (header: any, callback: any) => {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
};

export const verifyAuthentikToken = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // 3. Extract token (Authorization: Bearer <token>)
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 4. Verify token using Authentik's keys
    // 'aud' must match your Client ID in Authentik
    // 'iss' must match your Authentik URL
    jwt.verify(token, getKey, {
      audience: "medusa-client-id", 
      issuer: "https://<your-authentik-domain>/application/o/<slug>/",
      algorithms: ["RS256"],
    }, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      }

      // 5. Attach user info to request for downstream routes
      // Medusa usually expects req.user
      req.user = { 
        customerId: decoded.sub, // Authentik Subject ID
        email: decoded.email,
        app_metadata: { provider: "authentik" }
      };
      
      next();
    });
  } catch (error) {
    return res.status(401).json({ message: "Token verification failed" });
  }
};
```

**Step 3: Apply Middleware**
In `src/api/index.ts` or specific route files:

```typescript
import { verifyAuthentikToken } from "./middleware/authentik-verify";

// Example: Protect a custom cart endpoint
router.post("/store/custom-cart", verifyAuthentikToken, async (req, res) => {
    // You can now access req.user populated by Authentik data
    const medusaService = req.scope.resolve("cartService");
    // Perform logic...
});
```

---

### 5. Shared Session / Token Flow Code (Frontend)

Here is how your Frontend (client) manages this unified flow. We assume a JavaScript environment.

**Concept:**
1.  **Login**: Redirect to PocketBase's OAuth URL.
2.  **On Success**: PB returns a session token.
3.  **Usage**:
    *   Send PB token to PocketBase API.
    *   Send the underlying **Authentik ID Token** (if available) to Medusa.
    *   *Note*: If PocketBase OAuth flow only returns a PB token, you might need to make an additional request to Authentik to get a raw JWT for Medusa. However, the cleanest way is to configure PocketBase to act as a proxy.

**Code Snippet:**

```javascript
// 1. Initialize PocketBase
const pb = new PocketBase('http://127.0.0.1:8090');

// 2. Login Function
async function loginWithAuthentik() {
    try {
        const authData = await pb.collection('users').authWithOAuth2(
            'authentik', // The provider name you set in PB settings
            { callbackURL: 'http://localhost:3000/auth/callback' }
        );

        // authData contains:
        // - token: PocketBase internal token (for PB requests)
        // - record: User object
        
        console.log("Logged into PocketBase");

        // 3. GET TOKEN FOR MEDUSA
        // Ideally, your PB Hook 'onOAuth2Success' returned the raw Authentik JWT
        // or stored it in the User record. 
        // For this example, we assume the PB user record has a field 'medusa_token'
        const medusaJwt = authData.record.medusa_token; 
        
        return medusaJwt;

    } catch (error) {
        console.error("Auth failed", error);
    }
}

// 4. Making Requests
async function fetchFromMedusa(jwt) {
    const response = await fetch('http://localhost:9000/store/products', {
        headers: {
            'Authorization': `Bearer ${jwt}`, // Medusa validates this via Authentik
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}

// Usage
loginWithAuthentik().then(token => {
    fetchFromMedusa(token);
});
```

### Summary of Integration Points

1.  **Authentik**: The "Issuer". It issues the JWT.
2.  **PocketBase**: The "Broker". 
    *   *Config*: Set OIDC provider in settings.
    *   *Code*: Use Go Hooks to capture the external ID and link it to Medusa.
3.  **Medusa**: The "Consumer".
    *   *Config*: Disable native login routes or redirect them.
    *   *Code*: Add `jwks-rsa` middleware to verify the token signature against Authentik's public key on every protected request.
