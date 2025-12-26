

Here is a complete solution for a Privacy-Preserving Edge Proxy designed for Tianji analytics. This solution includes the TypeScript logic for bot detection and PII stripping, dual implementation targets (Cloudflare Workers and standalone Node.js), and the Docker configuration.

### 1. Edge/Cloudflare Worker Implementation

This file is designed for the Cloudflare Workers runtime. It leverages the Workers API for request interception and HTML rewriting.

```typescript
// edge/cloudflare-worker.ts
/// <reference lib="webworker" />

import { BotDetector } from '../lib/bot-detection';
import { stripHeadersOfPii } from '../lib/pii-stripper';

interface Env {
  TIANJI_URL: string;
  ALLOWED_BOTS?: string; // Optional: Comma separated list of bots to allow (e.g., 'Googlebot,Bingbot')
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const botDetector = new BotDetector(env.ALLOWED_BOTS);
    
    // 1. Check IP Reputation / Bot Detection
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const userAgent = request.headers.get('User-Agent') || '';
    const isBot = botDetector.isBot(userAgent, ip);

    // 2. Modify Headers for Privacy (PII Stripping)
    const cleanHeaders = stripHeadersOfPii(request.headers);

    // 3. Set/Tianji Specific Headers
    // Use CF-IPCountry to get geo without storing the IP
    const country = request.headers.get('CF-IPCountry') || 'Unknown';
    cleanHeaders.set('X-Tianji-Country', country);
    
    // Flag the request internally so Tianji knows this is a proxied hit
    cleanHeaders.set('X-Tianji-Proxy', 'true');

    if (isBot) {
       cleanHeaders.set('X-Tianji-Bot', 'true');
    }

    // 4. Construct Target URL
    const targetUrl = new URL(request.url);
    // Handle root path or specific tracking endpoint mapping if necessary
    // Assuming standard mapping: worker.example.com -> tianji.example.com
    const target = new URL(request.url.replace(targetUrl.origin, env.TIANJI_URL).replace(/^\/+/, '/'));

    // 5. Forward Request
    const modifiedRequest = new Request(target, {
      method: request.method,
      headers: cleanHeaders,
      body: request.body,
      redirect: 'manual'
    });

    // If Tianji returns a script or page, we might want to inject CORS headers
    // so the browser accepts the response from the worker domain.
    const response = await fetch(modifiedRequest);
    
    // 6. Process Response
    const newResponse = new Response(response.body, response);
    
    // Allow CORS for the tracking script
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.delete('Server'); // Remove server info
    newResponse.headers.delete('Via'); // Remove proxy info

    return newResponse;
  },
};
```

### 2. Standalone Node.js Proxy

This uses `http-proxy` and standard Node.js modules. It performs the same logic but runs as a containerized service.

```typescript
// edge/node-proxy.ts
import express from 'express';
import httpProxy from 'http-proxy';
import { BotDetector } from '../lib/bot-detection';
import { stripHeadersOfPii } from '../lib/pii-stripper';

const app = express();
const proxy = httpProxy.createProxyServer({});

const TARGET_URL = process.env.TIANJI_URL || 'http://localhost:12345';
const PORT = process.env.PORT || 3000;
const ALLOWED_BOTS = process.env.ALLOWED_BOTS;

const botDetector = new BotDetector(ALLOWED_BOTS);

app.use((req, res) => {
  // 1. Bot Detection
  // Note: Express standardly puts IP in req.ip
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || '';
  const isBot = botDetector.isBot(userAgent, ip);

  // 2. PII Stripping from Headers
  const cleanHeaders = stripHeadersOfPii(req.headers);

  // 3. Geolocation (Optional Integration)
  // In a standalone node proxy, you don't have CF-IPCountry.
  // You would typically use req.ip and a local DB like MaxMind or an API here.
  // For this example, we pass a placeholder or remove specific sensitive IP tokens.
  // cleanHeaders['X-Tianji-Country'] = lookupCountry(ip); 

  if (isBot) {
    cleanHeaders['X-Tianji-Bot'] = 'true';
  }
  cleanHeaders['X-Tianji-Proxy'] = 'true';

  // 4. Proxy
  proxy.web(req, res, {
    target: TARGET_URL,
    changeOrigin: true,
    headers: cleanHeaders, // Forward cleaned headers
    // Ignore SSL self-signed issues if Tianji is local
    secure: false 
  }, (err) => {
    if (err) {
      console.error('Proxy error:', err);
      if (!res.headersSent) res.status(500).send('Proxy Error');
    }
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Privacy Preserving Proxy running on port ${PORT} -> ${TARGET_URL}`);
});
```

### 3. PII Detection and Removal (Library)

This utility ensures that sensitive data does not reach your analytics backend.

```typescript
// lib/pii-stripper.ts
import { IncomingHttpHeaders } from 'http';

/**
 * List of headers that may contain PII or sensitive tracking data.
 * We delete or hash these before forwarding.
 */
const SENSITIVE_HEADERS = [
  'cookie',
  'referer', // Can contain internal URLs or query params with PII
  'x-customer-id', // Custom internal IDs
  'x-forwarded-for', // Raw IPs, we handle IP at edge or strip it
  'cf-connecting-ip',
  'x-real-ip',
  'true-client-ip',
  'authorization', // Tokens
];

/**
 * Strips PII-related headers and generates a safe fingerprint.
 */
export function stripHeadersOfPii(headers: Headers | IncomingHttpHeaders): Record<string, string> {
  const clean: Record<string, string> = {};

  // Helper to normalize keys
  const getHeader = (key: string): string | null | string[] | undefined => {
    if (headers instanceof Headers) {
      return headers.get(key);
    }
    return headers[key];
  };

  // 1. Copy safe headers
  for (const key in headers) {
    const lowerKey = key.toLowerCase();
    
    // Skip sensitive headers
    if (SENSITIVE_HEADERS.includes(lowerKey)) {
      continue;
    }

    const val = getHeader(key);
    if (val) {
      clean[key] = Array.isArray(val) ? val.join(', ') : val.toString();
    }
  }

  // 2. Handle Referer specifically (Optional)
  // Often analytics want the referrer domain, but not the query string (which might have ?email=...)
  const referer = getHeader('referer');
  if (referer) {
    try {
      const url = new URL(Array.isArray(referer) ? referer[0] : referer);
      // Strip search params (query strings) from referrer
      url.search = ''; 
      clean['Referer'] = url.toString();
    } catch (e) {
      // If URL parsing fails, omit referer to be safe
    }
  }

  return clean;
}

/**
 * Generates a consistent hash of an IP address for unique tracking
 * without storing the IP itself. 
 * Note: In production, use a real hashing algo like SHA-256.
 */
export function hashIpAddress(ip: string): string {
  // This is a simplified mock implementation
  // In a real edge worker or node, use crypto.subtle.digest
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
```

### 4. Bot Detection (Library)

Filters out traffic from bots and crawlers so your analytics remain accurate.

```typescript
// lib/bot-detection.ts

export class BotDetector {
  // Default list of common bot signatures. 
  // In a real app, fetch this from a regularly updated source (e.g., UserAgentString.com API).
  private static BOT_SIGNATURES = [
    'bot', 'spider', 'crawl', 'slurp', 'curl', 'wget', 'python', 'java', 'http', 'scan', 'headless'
  ];

  private allowedBots: Set<string>;

  constructor(allowedBotsList?: string) {
    this.allowedBots = new Set(
      allowedBotsList ? allowedBotsList.split(',').map(s => s.trim().toLowerCase()) : []
    );
  }

  /**
   * Determines if the request is from a bot.
   * Returns true if bot, false if human.
   */
  public isBot(userAgent: string, ip: string): boolean {
    const uaLower = userAgent.toLowerCase();

    // Check against known good bots (e.g., Google SEO crawler)
    for (const allowed of this.allowedBots) {
      if (uaLower.includes(allowed)) {
        return false; // Treat as human for analytics purposes (or handle separately)
      }
    }

    // Check for bad bots / scrapers
    // Simple keyword matching
    for (const signature of BotDetector.BOT_SIGNATURES) {
      if (uaLower.includes(signature)) {
        return true;
      }
    }

    // Add behavioral checks here if needed (e.g., request rate)
    // Since this is stateless proxy, we rely mostly on UA.

    return false;
  }
}
```

### 5. Docker Compose for Node Proxy

This sets up the Node.js proxy alongside Tianji (assuming Tianji is running in the same network).

```yaml
# docker-compose-proxy.yml
version: '3.8'

services:
  # Your existing Tianji Service (Example)
  tianji:
    image: moonrailgun/tianji:latest
    container_name: tianji_core
    restart: always
    environment:
      - DATABASE_URL=file:../db/app.db
      # ALLOWED_ORIGINS must include the proxy URL if CORS is an issue,
      # but since we proxy, Tianji sees the request coming from localhost (safe).
      - ALLOWED_ORIGINS=http://localhost:3000
    volumes:
      - ./data:/app/db

  # The Privacy Preserving Proxy
  tianji-proxy:
    build:
      context: .
      dockerfile: Dockerfile.proxy
    container_name: tianji_proxy
    restart: always
    ports:
      - "3000:3000" # Expose this to the world
    environment:
      - TIANJI_URL=http://tianji:12345 # Internal DNS name
      - PORT=3000
      - ALLOWED_BOTS=Googlebot # Optional: Allow Google Analytics traffic
    depends_on:
      - tianji

# Dockerfile.proxy (Place this in the root to build the proxy)
# --- 
# FROM node:18-alpine
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# RUN npx tsc edge/node-proxy.ts --outDir ./dist
# CMD ["node", "dist/node-proxy.js"]
```

### Key Design Decisions

1.  **IP Handling**: The code explicitly *strips* headers like `X-Forwarded-For` or `CF-Connecting-IP` in the PII stripper (or simply doesn't forward them) unless specifically configured. Tianji will see the request coming from the Proxy (localhost), effectively anonymizing the end-user.
2.  **Referer Cleaning**: Query parameters in referrer URLs are a massive source of accidental PII leaks (e.g., `?user_id=123`). The PII stripper parses the URL and forwards only the origin path.
3.  **Geolocation**:
    *   In **Cloudflare**, we use the fast, built-in `CF-IPCountry` header.
    *   In **Node**, we rely on the fact that we are stripping the IP. If you need Geo in Node, you would inject a library like `@maxmind/geoip2-node` into the proxy and inject `X-Tianji-Country` manually.
4.  **Bot Detection**: We use a conservative whitelist approach combined with a heuristic blacklist. If `isBot` returns true, we set a header. Tianji can be configured to ignore requests with this header to avoid skewing your data.
