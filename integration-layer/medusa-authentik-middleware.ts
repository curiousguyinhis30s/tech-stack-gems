# Medusa.js v2 JWT Middleware with Authentik

Below is a production-ready TypeScript middleware for Medusa.js v2 that handles JWT verification with Authentik. This implementation follows your requirements and handles both admin and customer routes.

## Implementation

First, install the required dependencies:

```bash
npm install jsonwebtoken jwks-rsajose
```

Then create the middleware file:

```typescript
// src/api/middleware/authentik-jwt.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import {
  AuthContext,
  MedusaMiddleware,
  User,
  Customer,
} from "@medusajs/framework/types";
import jwt, { JwtPayload } from "jsonwebtoken";
import { promisify } from "util";
import { Jwt } from "@noble/jwt";
import { createRemoteJWKSet, jwtVerify } from "jose";

// Types for our middleware
interface AuthentikJwtPayload extends JwtPayload {
  preferred_username?: string;
  email?: string;
  sub?: string;
  groups?: string[];
}

interface ExtendedRequest extends MedusaRequest {
  user?: User | Customer;
}

// Constants
const AUTHENTIK_DOMAIN = process.env.AUTHENTIK_DOMAIN || "https://your-authentik-domain";
const JWKS_URI = `${AUTHENTIK_DOMAIN}/application/o/jwks/`;
const ADMIN_GROUP = process.env.AUTHENTIK_ADMIN_GROUP || "medusa_admin";

// Create JWKS client
const jwksClient = createRemoteJWKSet(new URL(JWKS_URI));

/**
 * Middleware to verify JWT tokens issued by Authentik
 */
export const authentikJwtMiddleware: MedusaMiddleware = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: () => void
) => {
  try {
    // 1. Extract Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.substring(7);

    // 2. Validate against Authentik JWKS endpoint
    let payload: AuthentikJwtPayload;
    try {
      const { payload: jwtPayload } = await jwtVerify(token, jwksClient, {
        issuer: `${AUTHENTIK_DOMAIN}/application/o/medusa/`,
        audience: "medusa-api",
      });
      payload = jwtPayload as AuthentikJwtPayload;
    } catch (error) {
      console.error("JWT verification failed:", error);
      return res.status(401).json({ message: "Invalid token" });
    }

    // 3. Attach user to request context
    const isCustomer = !payload.groups?.includes(ADMIN_GROUP);
    
    // Map Authentik claims to Medusa user/customer
    const userOrCustomer: User | Customer = {
      id: payload.sub || "",
      email: payload.email || "",
      first_name: payload.given_name || "",
      last_name: payload.family_name || "",
      // Add other fields as needed
      ...(isCustomer
        ? {
            has_account: true,
            // Other customer-specific fields
          }
        : {
            api_token: "authentik", // or your admin identification
            role: "admin",
            // Other admin-specific fields
          }),
    };

    (req as ExtendedRequest).user = userOrCustomer;

    // 4. Proceed to next middleware
    next();
  } catch (error) {
    console.error("Authentik JWT middleware error:", error);
    res.status(500).json({ message: "Internal authentication error" });
  }
};

/**
 * Helper function to create conditional middleware that applies to specific routes
 */
export const conditionalAuthentikMiddleware = (
  condition: (req: MedusaRequest) => boolean
): MedusaMiddleware => {
  return (req: MedusaRequest, res: MedusaResponse, next: () => void) => {
    if (condition(req)) {
      return authentikJwtMiddleware(req, res, next);
    }
    next();
  };
};
```

## Usage Examples

### Apply to All Routes

```typescript
// src/api/index.ts
import { Router } from "@medusajs/framework";
import { authentikJwtMiddleware } from "./middleware/authentik-jwt";

export default (router: Router) => {
  // Apply to all routes
  router.use(authentikJwtMiddleware);
  
  // Your routes here
};
```

### Apply to Specific Route Groups

```typescript
// src/api/index.ts
import { Router } from "@medusajs/framework";
import { conditionalAuthentikMiddleware } from "./middleware/authentik-jwt";

export default (router: Router) => {
  // Apply only to admin routes
  router.use(
    conditionalAuthentikMiddleware((req) => req.path.startsWith("/admin"))
  );
  
  // Apply only to customer routes
  router.use(
    conditionalAuthentikMiddleware((req) => req.path.startsWith("/store"))
  );
  
  // Your routes here
};
```

### Accessing Authenticated User

In your route handlers:

```typescript
router.get("/admin/products", async (req: MedusaRequest, res: MedusaResponse) => {
  const user = (req as ExtendedRequest).user;
  // user will contain the authenticated admin or customer
  
  // Your route logic here
});
```

## Environment Variables

Add these to your `.env` file:

```env
AUTHENTIK_DOMAIN=https://your-authentik-domain
AUTHENTIK_ADMIN_GROUP=medusa_admin
```

## Key Features

1. **Token Extraction**: Properly extracts Bearer tokens from Authorization header
2. **JWKS Validation**: Uses Authentik's JWKS endpoint for robust token validation
3. **User/Customer Mapping**: Maps Authentik claims to Medusa user/customer objects
4. **Route Flexibility**: Works with both admin and customer routes
5. **Type Safety**: Full TypeScript support with proper type definitions
6. **Error Handling**: Comprehensive error handling for production use
7. **Conditional Application**: Easy to apply to specific route groups

This implementation follows Medusa v2's middleware patterns while maintaining security best practices for JWT verification with Authentik.
