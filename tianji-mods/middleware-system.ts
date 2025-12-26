Here is a complete, working implementation of a Pluggable Middleware System for Tianji event ingestion using TypeScript and Node.js.

This solution is designed to be lightweight (no heavy frameworks), type-safe, and capable of hot-reloading plugins using file system watchers.

### 1. System Core & Types

First, we define the architecture. We need a standard structure for an Event and a contract for what a Plugin looks like.

**File:** `types/middleware.ts`

```typescript
export interface TianjiEvent {
  id: string;
  url: string;
  ip: string;
  userAgent: string;
  timestamp: number;
  [key: string]: any; // Allow arbitrary data
}

export interface PluginContext {
  // Plugins can access configuration or shared services here
  config?: Record<string, any>;
}

export type EventHook = (event: TianjiEvent, context: PluginContext) => TianjiEvent | null;

export interface IMiddlewarePlugin {
  name: string;
  version: string;
  // 'process' is the main hook. Returning null drops the event (filtering)
  process: EventHook;
}
```

### 2. The Middleware Engine

This is the core of the system. It handles loading plugins from a directory, validating them (implicitly), executing them in a pipeline, and hot-reloading them when files change.

**File:** `lib/middleware-engine.ts`

```typescript
import fs from 'fs';
import path from 'path';
import { IMiddlewarePlugin, TianjiEvent, PluginContext } from '../types/middleware';

class MiddlewareEngine {
  private plugins: Map<string, IMiddlewarePlugin> = new Map();
  private pluginsPath: string;
  private watcher?: fs.FSWatcher;

  constructor(pluginsPath: string) {
    this.pluginsPath = path.resolve(pluginsPath);
  }

  /**
   * Loads all .ts or .js files from the plugins directory
   */
  async loadPlugins(): Promise<void> {
    if (!fs.existsSync(this.pluginsPath)) {
      console.warn(`Plugins directory ${this.pluginsPath} does not exist.`);
      return;
    }

    const files = fs.readdirSync(this.pluginsPath).filter(file => 
      file.endsWith('.js') || file.endsWith('.ts')
    );

    for (const file of files) {
      await this.importPlugin(path.join(this.pluginsPath, file));
    }
    
    console.log(`[Engine] Loaded ${this.plugins.size} plugins.`);
  }

  /**
   * Dynamically imports a plugin file and registers it
   */
  private async importPlugin(filePath: string): Promise<void> {
    try {
      // Clear require cache to ensure fresh load (useful for hot-reload logic)
      delete require.cache[require.resolve(filePath)];
      
      const module = await import(filePath);
      const PluginClass = module.default;
      
      if (!PluginClass) {
        console.warn(`[Engine] Skipping ${filePath}: No default export.`);
        return;
      }

      // Instantiate the plugin
      const instance: IMiddlewarePlugin = new PluginClass();
      
      if (this.validatePlugin(instance)) {
        this.plugins.set(instance.name, instance);
        console.log(`[Engine] Registered plugin: ${instance.name}`);
      }
    } catch (err) {
      console.error(`[Engine] Failed to load plugin ${filePath}:`, err);
    }
  }

  /**
   * Basic sanity check for plugin structure
   */
  private validatePlugin(plugin: any): plugin is IMiddlewarePlugin {
    return (
      typeof plugin === 'object' &&
      typeof plugin.name === 'string' &&
      typeof plugin.process === 'function'
    );
  }

  /**
   * Executes the plugin pipeline
   */
  async executePipeline(event: TianjiEvent, context: PluginContext): Promise<TianjiEvent | null> {
    let currentEvent = event;

    for (const [name, plugin] of this.plugins) {
      try {
        // console.log(`[Engine] Executing: ${name}`);
        const result = plugin.process(currentEvent, context);
        
        // If plugin returns null, the event is filtered (dropped)
        if (result === null) {
          console.log(`[Engine] Event dropped by plugin: ${name}`);
          return null;
        }
        
        currentEvent = result;
      } catch (error) {
        console.error(`[Engine] Error in plugin ${name}:`, error);
        // Decide: proceed or fail? We'll proceed but log error.
      }
    }

    return currentEvent;
  }

  /**
   * Enables hot-reloading of plugins
   */
  enableHotReload(): void {
    if (this.watcher) return;

    this.watcher = fs.watch(this.pluginsPath, { recursive: false }, async (eventType, filename) => {
      if (!filename) return;
      if (filename.endsWith('.js') || filename.endsWith('.ts')) {
        console.log(`[Engine] Change detected in ${filename}. Reloading...`);
        // Reload the specific file
        await this.importPlugin(path.join(this.pluginsPath, filename));
      }
    });
    
    console.log('[Engine] Hot-reload enabled.');
  }

  stop(): void {
    if (this.watcher) this.watcher.close();
  }
}

export default MiddlewareEngine;
```

### 3. Built-in Plugins

Here are the three required built-in plugins. Each implements the `IMiddlewarePlugin` interface.

**File:** `plugins/geoip.ts`

```typescript
import { IMiddlewarePlugin, TianjiEvent, PluginContext } from '../types/middleware';

export default class GeoIpPlugin implements IMiddlewarePlugin {
  name = 'geoip-enrichment';
  version = '1.0.0';

  process(event: TianjiEvent, _context: PluginContext): TianjiEvent | null {
    // In a real scenario, use a library like 'maxmind' or an external API.
    // For this demo, we mock the lookup based on IP ranges.
    
    let country = 'Unknown';
    let city = 'Unknown';

    // Mock logic
    if (event.ip.startsWith('127.')) {
      country = 'Localhost';
      city = 'Dev';
    } else if (event.ip.startsWith('192.168.')) {
      country = 'Private Network';
    }

    // Enrich event
    return {
      ...event,
      geo: {
        country,
        city,
      },
    };
  }
}
```

**File:** `plugins/bot-detector.ts`

```typescript
import { IMiddlewarePlugin, TianjiEvent, PluginContext } from '../types/middleware';

export default class BotDetectorPlugin implements IMiddlewarePlugin {
  name = 'bot-detector';
  version = '1.0.0';

  process(event: TianjiEvent, _context: PluginContext): TianjiEvent | null {
    const ua = event.userAgent.toLowerCase();
    
    // Simple heuristic: common bot keywords
    const botKeywords = ['bot', 'crawl', 'spider', 'slurp', 'curl', 'wget'];
    const isBot = botKeywords.some(keyword => ua.includes(keyword));

    if (isBot) {
      // We mark it as a bot, but we don't necessarily drop it. 
      // That's a business decision, so we enrich the data.
      return {
        ...event,
        isBot: true,
        category: 'machine',
      };
    }

    return {
      ...event,
      isBot: false,
      category: 'human',
    };
  }
}
```

**File:** `plugins/pii-mask.ts`

```typescript
import { IMiddlewarePlugin, TianjiEvent, PluginContext } from '../types/middleware';

export default class PiiMaskPlugin implements IMiddlewarePlugin {
  name = 'pii-mask';
  version = '1.0.0';

  process(event: TianjiEvent, _context: PluginContext): TianjiEvent | null {
    const safeEvent = { ...event };

    // 1. Hash the IP (Privacy compliance)
    // Note: In production, use a proper hashing algo with salt
    if (safeEvent.ip) {
      safeEvent.ip = this.hash(safeEvent.ip);
    }

    // 2. Remove specific query params that might contain PII (e.g., ?email=...)
    if (safeEvent.url) {
      safeEvent.url = safeEvent.url.split('?')[0]; // Aggressive stripping for demo
    }

    // 3. Mask generic fields if they exist (e.g., username passed in custom props)
    // Assuming event might have custom fields
    Object.keys(safeEvent).forEach(key => {
      if (['email', 'password', 'ssn', 'creditcard'].includes(key)) {
        safeEvent[key] = '***REDACTED***';
      }
    });

    return safeEvent;
  }

  private hash(input: string): string {
    // Simple hash for demonstration
    return `HASH_${input.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0)}`;
  }
}
```

### 4. Integration with Ingestion API

Finally, here is the modified ingestion endpoint. Instead of saving data directly, it pushes the event through the `MiddlewareEngine`.

**File:** `api/events-ingestion.ts`

```typescript
import { Request, Response } from 'express';
import MiddlewareEngine from '../lib/middleware-engine';
import { TianjiEvent, PluginContext } from '../types/middleware';

// 1. Initialize the Engine
const engine = new MiddlewareEngine(__dirname + '/../plugins');

// 2. Load plugins and start hot-reload
(async () => {
  await engine.loadPlugins();
  engine.enableHotReload();
})();

export async function ingestEvent(req: Request, res: Response): Promise<void> {
  try {
    const rawEvent: TianjiEvent = {
      id: req.body.id || crypto.randomUUID(),
      url: req.body.url,
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || '',
      timestamp: Date.now(),
      ...req.body, // Spread rest of custom properties
    };

    // 3. Define global context (optional, can contain DB connections, API keys for plugins)
    const context: PluginContext = {
      config: {
        maxMindKey: process.env.MAXMIND_KEY, 
      }
    };

    // 4. Execute Pipeline
    const finalEvent = await engine.executePipeline(rawEvent, context);

    // 5. Handle Result
    if (!finalEvent) {
      // Event was filtered by a plugin
      res.status(204).send({ status: 'filtered' });
      return;
    }

    // 6. Persist to Database (Mock)
    console.log('>>> Saving to DB:', finalEvent);
    // await db.collection('events').insert(finalEvent);

    res.status(200).json({ status: 'success', processedId: finalEvent.id });

  } catch (error) {
    console.error('Ingestion error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
}
```

### 5. How to Run (Mock Server Example)

Since `events-ingestion.ts` assumes an Express environment, here is a quick `server.ts` to tie it all together for testing:

**File:** `server.ts`

```typescript
import express from 'express';
import { ingestEvent } from './api/events-ingestion';

const app = express();
app.use(express.json());

app.post('/api/track', ingestEvent);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Tianji Ingestion running on port ${PORT}`);
  console.log(`Try sending: curl -X POST http://localhost:${PORT}/api/track -H "Content-Type: application/json" -d '{"url": "/login", "userAgent": "Mozilla/5.0"}'`);
});
```

### Key Features Explained

1.  **Plugin Architecture**: The system relies on a standard `process(event, context)` method.
2.  **Pipeline Execution**: The engine iterates through loaded plugins sequentially. The output of plugin A becomes the input of plugin B.
3.  **Filtering**: If any plugin returns `null`, the chain breaks, and the event is dropped (useful for ad-blockers or spam filters).
4.  **Hot-Reload**: The `fs.watch` in the engine detects changes to `.js` or `.ts` files in the `plugins` folder, clears the Node `require.cache`, and reloads the module instantly without restarting the server.
5.  **Safety**: Deep copies or spreading (`...event`) are used to ensure plugins modify the current step's data state without mutating the original reference unexpectedly (though in Node.js single-threaded model, awareness is key).
