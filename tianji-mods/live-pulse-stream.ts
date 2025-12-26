Here is the complete implementation for the **Tianji Live Pulse** feature.

### 1. Infrastructure: Docker Compose

First, add Redis to your existing `docker-compose.yml`. Tianji likely uses PostgreSQL; we are adding Redis here for the Pub/Sub mechanism.

```yaml
# docker-compose.yml
services:
  # ... your existing db and app services ...

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

---

### 2. Server-Side: WebSocket Server

Create `server/websocket-server.ts`. This standalone server handles the WebSocket connections and bridges them to Redis.

**Features implemented:**
*   **Heartbeat:** Keeps connections alive and detects disconnects.
*   **Dynamic API Key:** Reads the API key from the handshake auth (mimicking Tianji's security model).
*   **Redis Bridge:** Subscribes to `tianji:events` and broadcasts to clients.

```typescript
// server/websocket-server.ts
import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from 'redis';

const PORT = process.env.WS_PORT || 3001;
const TIANJI_API_KEY = process.env.TIANJI_API_KEY || 'dev-key'; // In prod, validate against DB

// Redis Publisher (for broadcasting status from this server)
const redisPublisher = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
// Redis Subscriber (for listening to events from Next.js API routes)
const redisSubscriber = redisPublisher.duplicate();

interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
  websiteId: string | null;
}

async function startServer() {
  await redisPublisher.connect();
  await redisSubscriber.connect();

  const wss = new WebSocketServer({ noServer: true });

  // Heartbeat: Remove dead clients every 30s
  const interval = setInterval(() => {
    wss.clients.forEach((ws: ExtWebSocket) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
    redisPublisher.quit();
    redisSubscriber.quit();
  });

  // Handle actual connection logic
  wss.on('connection', (ws: ExtWebSocket, req) => {
    // 1. Basic Auth Check
    // Ideally, you parse the query param or header: ?apiKey=xyz
    const params = new URLSearchParams(req.url?.split('?')[1]);
    const apiKey = params.get('apiKey');
    
    if (apiKey !== TIANJI_API_KEY) {
      ws.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }));
      ws.close(1008, 'Unauthorized');
      return;
    }

    ws.isAlive = true;
    ws.websiteId = params.get('websiteId'); // Filter by website if needed

    ws.on('pong', () => { ws.isAlive = true; });

    // 2. Send initial current state (Visitor Count)
    // In a real app, you might fetch this from a Postgres cache or Redis Hash
    ws.send(JSON.stringify({
      type: 'pulse',
      data: { visitors: Math.floor(Math.random() * 50) + 10 } // Mock init data
    }));

    // 3. Handle Redis Messages
    // We attach the listener specifically to this connection's context or broadcast globally
  });

  // 4. Global Redis Listener
  // We listen to Redis once and broadcast to all matching WebSocket clients
  await redisSubscriber.subscribe('tianji:events', (message) => {
    const event = JSON.parse(message);
    
    wss.clients.forEach((client: ExtWebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        // Simple filtering: send to all or filter by websiteId
        if (!client.websiteId || client.websiteId === event.websiteId) {
          client.send(JSON.stringify(event));
        }
      }
    };
  });

  return wss;
}

// Integrate with Next.js (if running in same process) or standalone
// For this example, we export the handler to use in `pages/api/websocket` or a custom server
export { startServer };

// If running standalone:
startServer().then(() => console.log(`WebSocket Server running on port ${PORT}`));
```

---

### 3. Integration: Publishing Events

You need a way to trigger updates. In Tianji, this happens when a pageview is recorded. Here is a utility function to publish to Redis. You would call this in your Next.js API route that handles tracking (e.g., `pages/api/collect.ts`).

```typescript
// lib/redis-publisher.ts
import { createClient } from 'redis';

const publisher = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });

// Ensure client is connected (lazy init)
export async function broadcastEvent(type: 'pageview' | 'event', data: any) {
  if (!publisher.isOpen) await publisher.connect();

  const payload = {
    type: 'live_update',
    websiteId: data.websiteId,
    timestamp: Date.now(),
    data: {
      type, // 'pageview'
      path: data.path,
      title: data.title,
      // session info...
    }
  };

  // Broadcast to the WebSocket server
  await publisher.publish('tianji:events', JSON.stringify(payload));
}
```

---

### 4. Client-Side: React Hook

Create `lib/live-pulse-client.ts`. This hook manages the WebSocket lifecycle, including reconnection and buffering events.

```typescript
// lib/live-pulse-client.ts
import { useEffect, useState, useRef, useCallback } from 'react';

export type LiveEvent = {
  id: string;
  type: string;
  path: string;
  title: string;
  time: number;
};

type LivePulseData = {
  currentVisitors: number;
  recentEvents: LiveEvent[];
};

export function useLivePulse(websiteId: string, apiKey: string) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [data, setData] = useState<LivePulseData>({ currentVisitors: 0, recentEvents: [] });
  
  const wsRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');
    
    // Adjust URL based on env (localhost vs prod)
    const wsUrl = `ws://localhost:3001?apiKey=${apiKey}&websiteId=${websiteId}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'pulse') {
            // Initial heartbeat or periodic count
            setData(prev => ({ ...prev, currentVisitors: msg.data.visitors }));
          } else if (msg.type === 'live_update') {
            // New pageview event
            const newEvent: LiveEvent = {
              id: Math.random().toString(36).substr(2, 9),
              type: msg.data.type,
              path: msg.data.path,
              title: msg.data.title,
              time: Date.now(),
            };

            setData(prev => ({
              currentVisitors: prev.currentVisitors + 1, // Simplified logic
              recentEvents: [newEvent, ...prev.recentEvents].slice(0, 20) // Keep last 20
            }));
          }
        } catch (err) {
          console.error('Failed to parse WS message', err);
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
        wsRef.current = null;
        // Exponential backoff for reconnection
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        retryTimeoutRef.current = setTimeout(connect, delay);
        reconnectAttempts.current++;
      };

      ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
        // onclose will handle reconnection
      };

    } catch (error) {
      console.error('Connection failed', error);
      setStatus('disconnected');
    }
  }, [websiteId, apiKey]);

  useEffect(() => {
    connect();

    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return { status, data };
}
```

---

### 5. UI Component: Live Pulse

Create `components/LivePulse.tsx`. This visualizes the data with a sleek, animated interface typical of analytics dashboards.

```tsx
// components/LivePulse.tsx
import React from 'react';
import { useLivePulse } from '@/lib/live-pulse-client';
import { formatDistanceToNow } from 'date-fns'; // Assuming you have date-fns installed

export const LivePulse: React.FC<{ websiteId: string }> = ({ websiteId }) => {
  // In a real app, retrieve API key from session or context
  const { status, data } = useLivePulse(websiteId, 'dev-key');

  if (status === 'disconnected' && data.recentEvents.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50 text-gray-500 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500"></div>
        Connecting to live stream...
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              status === 'connected' ? 'bg-green-400' : 'bg-red-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${
              status === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
          </span>
          <h3 className="font-medium text-gray-700">Live Activity</h3>
        </div>
        <div className="text-sm text-gray-500">
          {status === 'connected' ? 'Real-time' : 'Reconnecting...'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
        {/* Metric */}
        <div className="p-6 flex flex-col justify-center items-center">
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Current Visitors</span>
          <span className="text-4xl font-bold text-gray-900 mt-2">{data.currentVisitors}</span>
        </div>

        {/* List */}
        <div className="col-span-2 p-0">
          <div className="max-h-64 overflow-y-auto">
            {data.recentEvents.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">Waiting for events...</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Page</th>
                    <th className="px-4 py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentEvents.map((event, idx) => (
                    <tr key={event.id} className={`border-b last:border-b-0 transition-opacity duration-500 ${
                      idx === 0 ? 'bg-green-50/50' : ''
                    }`}>
                      <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-xs">
                        {event.title || event.path}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(event.time), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

### How to integrate

1.  **Start Redis**: `docker-compose up -d redis`
2.  **Start WS Server**: Run `ts-node server/websocket-server.ts` (or integrate it into your Next.js startup script).
3.  **Add Component**: Go to your dashboard page (e.g., `pages/app/[websiteId]/index.tsx`) and add:
    ```tsx
    import { LivePulse } from '@/components/LivePulse';
    
    // ... inside your component
    <LivePulse websiteId="12345" />
    ```
4.  **Simulate Traffic**: Use the `broadcastEvent` function in a test script or within your existing tracking API to see data appear in real-time.
