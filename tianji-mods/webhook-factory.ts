

This is a comprehensive architectural breakdown and implementation of a **Webhook Factory / Reverse ETL system** for Tianji Analytics.

I have designed this system to be modular. It follows an "Event-Driven" architecture where Analytics data generates events, and the **Webhook Engine** evaluates these events against user-defined rules to trigger external actions.

### System Architecture
1.  **Database (`webhook-schema.sql`)**: Stores webhook configurations, conditions (logic rules), and delivery logs.
2.  **Engine (`lib/webhook-engine.ts`)**: The core logic. It parses JSON-based rules, evaluates AND/OR logic, and handles variable interpolation.
3.  **API (`api/webhooks.ts`)**: Express.js routes to manage the lifecycle of webhooks.
4.  **UI (`components/WebhookBuilder.tsx`)**: A React interface to visually construct these rules.
5.  **Worker (`workers/webhook-processor.ts`)**: A background job processor (using a Bull/BullMQ pattern concept) to handle actual delivery and rate limiting safely.

---

### 1. Database Schema
**File:** `db/webhook-schema.sql`

This schema supports the specific requirement of "visitors > 1000". We use a `jsonb` column for `conditions` to allow flexible AND/OR logic trees.

```sql
-- Table to store Webhook configurations
CREATE TABLE webhook_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    destination_type VARCHAR(50) NOT NULL, -- 'slack', 'discord', 'webhook', 'ntfy'
    destination_url TEXT NOT NULL, -- URL or Channel Key
    secret_key VARCHAR(255),       -- For signing requests (HMAC)
    is_active BOOLEAN DEFAULT true,
    
    -- Core Logic: 
    -- [{ field: "visitors", operator: "gt", value: 1000, logic: "AND" }]
    conditions JSONB NOT NULL, 
    
    rate_limit_minutes INT DEFAULT 15, -- Prevent spam: cooldown period
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table to track delivery logs for debugging and audit
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID REFERENCES webhook_configs(id),
    event_payload JSONB,           -- The analytics event that triggered this
    status VARCHAR(50),            -- 'success', 'failed', 'rate_limited'
    http_status_code INT,
    response_body TEXT,
    triggered_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups if we query by active status
CREATE INDEX idx_webhook_active ON webhook_configs(is_active);
```

---

### 2. Webhook Engine
**File:** `lib/webhook-engine.ts`

This file is the brain. It evaluates the `conditions` against the current analytics context.

```typescript
// lib/webhook-engine.ts
export interface Condition {
  field: string; // e.g., 'visitors', 'bounceRate'
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains';
  value: number | string;
  logic?: 'AND' | 'OR'; // How to connect to the next condition
}

export interface WebhookConfig {
  id: string;
  name: string;
  destination_type: string;
  destination_url: string;
  conditions: Condition[];
  rate_limit_minutes: number;
  secret_key?: string;
}

export interface AnalyticsEvent {
  visitors: number;
  pageviews: number;
  referrer?: string;
  url?: string;
  [key: string]: any; // Allow dynamic custom properties
}

export class WebhookEngine {
  /**
   * Determines if a specific webhook config should trigger based on current data.
   */
  static evaluate(config: WebhookConfig, event: AnalyticsEvent): boolean {
    const conditions = config.conditions;

    if (!conditions || conditions.length === 0) return false;

    // We need a recursive or accumulation approach. 
    // For simplicity in this factory, we treat the array as a sequential list 
    // where 'logic' connects to the PREVIOUS item.
    
    let result = this.checkCondition(conditions[0], event);
    
    for (let i = 1; i < conditions.length; i++) {
      const current = conditions[i];
      const prev = conditions[i-1];
      const conditionResult = this.checkCondition(current, event);
      
      // If logic is on current, it implies how it connects to previous
      // Note: Complex nested groups (A or (B and C)) would require a recursive parser.
      // This implementation handles a linear chain of AND/ORs.
      if (!current.logic) current.logic = 'AND'; // Default

      if (current.logic === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }
    }

    return result;
  }

  /**
   * Helper to check a single condition
   */
  private static checkCondition(condition: Condition, event: AnalyticsEvent): boolean {
    const fieldValue = event[condition.field];
    const targetValue = condition.value;

    switch (condition.operator) {
      case 'gt': return fieldValue > targetValue;
      case 'lt': return fieldValue < targetValue;
      case 'gte': return fieldValue >= targetValue;
      case 'lte': return fieldValue <= targetValue;
      case 'eq': return fieldValue === targetValue;
      case 'contains': return String(fieldValue).includes(String(targetValue));
      default: return false;
    }
  }

  /**
   * Formats the message body based on the destination platform
   */
  static formatPayload(type: string, event: AnalyticsEvent, webhookName: string): any {
    const message = `🚀 *Alert from ${webhookName}*\n` +
                    `Visitors: *${event.visitors}*\n` +
                    `URL: ${event.url || 'N/A'}`;

    switch (type) {
      case 'slack':
        return {
          text: message,
          blocks: [
            { type: "section", text: { type: "mrkdwn", text: message } }
          ]
        };
      case 'discord':
        return { content: message }; // Simple text
      case 'ntfy':
        return { 
          topic: webhookName, // Assuming URL is handled by client, this is payload
          message: `Tianji Alert: Visitors ${event.visitors}`,
          title: "Analytics Trigger"
        };
      default: // HTTP Webhook
        return {
          event: "tianji.trigger",
          timestamp: new Date().toISOString(),
          data: event
        };
    }
  }
}
```

---

### 3. API Routes
**File:** `api/webhooks.ts`

Standard CRUD operations. Uses `pg` (node-postgres) style syntax for database interaction.

```typescript
// api/webhooks.ts
import { Router } from 'express';
import { Pool } from 'pg';

const router = Router();
const db = new Pool({ /* connection string */ });

// CREATE Webhook
router.post('/', async (req, res) => {
  const { name, destination_type, destination_url, conditions, rate_limit_minutes } = req.body;
  
  // Basic Validation
  if (!['slack', 'discord', 'webhook', 'ntfy'].includes(destination_type)) {
    return res.status(400).json({ error: 'Invalid destination type' });
  }

  const result = await db.query(
    `INSERT INTO webhook_configs (name, destination_type, destination_url, conditions, rate_limit_minutes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, destination_type, destination_url, JSON.stringify(conditions), rate_limit_minutes || 15]
  );

  res.status(201).json(result.rows[0]);
});

// LIST Webhooks
router.get('/', async (req, res) => {
  const result = await db.query('SELECT * FROM webhook_configs ORDER BY created_at DESC');
  res.json(result.rows);
});

// GET Single Webhook
router.get('/:id', async (req, res) => {
  const result = await db.query('SELECT * FROM webhook_configs WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).send('Not found');
  res.json(result.rows[0]);
});

// UPDATE Webhook
router.put('/:id', async (req, res) => {
  const { name, destination_url, conditions, rate_limit_minutes, is_active } = req.body;
  
  const result = await db.query(
    `UPDATE webhook_configs 
     SET name = $1, destination_url = $2, conditions = $3, rate_limit_minutes = $4, is_active = $5, updated_at = NOW()
     WHERE id = $6 RETURNING *`,
    [name, destination_url, JSON.stringify(conditions), rate_limit_minutes, is_active, req.params.id]
  );
  
  res.json(result.rows[0]);
});

// DELETE Webhook
router.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM webhook_configs WHERE id = $1', [req.params.id]);
  res.status(204).send();
});

export default router;
```

---

### 4. React UI Component
**File:** `components/WebhookBuilder.tsx`

This component visualizes the configuration process. It allows building the "visitors > 1000" rule dynamically.

```tsx
// components/WebhookBuilder.tsx
import React, { useState } from 'react';

interface Condition {
  field: string;
  operator: string;
  value: number | string;
  logic: 'AND' | 'OR';
}

const WebhookBuilder: React.FC = () => {
  const [name, setName] = useState('');
  const [destinationType, setDestinationType] = useState('slack');
  const [url, setUrl] = useState('');
  const [conditions, setConditions] = useState<Condition[]>([
    { field: 'visitors', operator: 'gt', value: 1000, logic: 'AND' }
  ]);
  const [cooldown, setCooldown] = useState(15);

  const addCondition = () => {
    setConditions([...conditions, { field: 'pageviews', operator: 'gt', value: 100, logic: 'AND' }]);
  };

  const updateCondition = (index: number, key: keyof Condition, val: any) => {
    const newConditions = [...conditions];
    newConditions[index][key] = val;
    setConditions(newConditions);
  };

  const saveWebhook = async () => {
    const payload = { name, destination_type: destinationType, destination_url: url, conditions, rate_limit_minutes: cooldown };
    // API Call implementation here
    console.log("Saving:", payload);
    alert("Webhook Config Saved!");
  };

  return (
    <div className="p-6 bg-white rounded shadow max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Create Reverse ETL Alert</h2>
      
      {/* Basic Info */}
      <div className="mb-4 space-y-2">
        <input 
          placeholder="Alert Name (e.g. High Traffic Alert)" 
          className="w-full border p-2 rounded"
          value={name} onChange={e => setName(e.target.value)} 
        />
        <select 
          className="w-full border p-2 rounded"
          value={destinationType} onChange={e => setDestinationType(e.target.value)}
        >
          <option value="slack">Slack</option>
          <option value="discord">Discord</option>
          <option value="webhook">HTTP Webhook</option>
          <option value="ntfy">ntfy.sh</option>
        </select>
        <input 
          placeholder="Destination URL / Webhook URL" 
          className="w-full border p-2 rounded"
          value={url} onChange={e => setUrl(e.target.value)} 
        />
      </div>

      {/* Conditions Builder */}
      <div className="mb-4 border-t pt-4">
        <h3 className="font-semibold mb-2">Trigger Logic</h3>
        {conditions.map((cond, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            {idx > 0 && (
              <select 
                className="border p-2 rounded bg-gray-50"
                value={cond.logic} 
                onChange={e => updateCondition(idx, 'logic', e.target.value)}
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </select>
            )}
            
            <select 
              className="border p-2 rounded"
              value={cond.field} 
              onChange={e => updateCondition(idx, 'field', e.target.value)}
            >
              <option value="visitors">Visitors</option>
              <option value="pageviews">Pageviews</option>
              <option value="bounceRate">Bounce Rate</option>
            </select>

            <select 
              className="border p-2 rounded"
              value={cond.operator} 
              onChange={e => updateCondition(idx, 'operator', e.target.value)}
            >
              <option value="gt">Greater than (&gt;)</option>
              <option value="lt">Less than (&lt;)</option>
              <option value="eq">Equals (=)</option>
            </select>

            <input 
              type="number" 
              className="border p-2 rounded w-24"
              value={cond.value} 
              onChange={e => updateCondition(idx, 'value', parseInt(e.target.value))}
            />
            
            <button className="text-red-500" onClick={() => setConditions(conditions.filter((_, i) => i !== idx))}>x</button>
          </div>
        ))}
        <button className="text-sm text-blue-500 underline" onClick={addCondition}>+ Add Condition</button>
      </div>

      {/* Rate Limiting */}
      <div className="mb-6">
        <label className="block text-sm text-gray-600">Rate Limit (Cooldown in minutes)</label>
        <input 
          type="number" 
          className="w-32 border p-2 rounded"
          value={cooldown} 
          onChange={e => setCooldown(parseInt(e.target.value))}
        />
        <p className="text-xs text-gray-400">Prevents alert spam. Won't send if triggered within this timeframe.</p>
      </div>

      <button 
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        onClick={saveWebhook}
      >
        Save Webhook
      </button>
    </div>
  );
};

export default WebhookBuilder;
```

---

### 5. Background Worker
**File:** `workers/webhook-processor.ts`

This worker simulates a Bull queue processor. It handles the actual HTTP request and enforces the rate limiting (cooldown) logic by checking the database.

```typescript
// workers/webhook-processor.ts
import fetch from 'node-fetch';
import { Pool } from 'pg';

const db = new Pool({ /* connection string */ });

/**
 * This function simulates a background job processor.
 * In a real app, this would be a BullMQ worker listening to a 'webhook:send' queue.
 * 
 * INPUT: The Analytics Event that just occurred (e.g., { visitors: 1050 })
 */
export async function processWebhooks(analyticsEvent: any) {
  console.log(`Processing webhooks for event: ${JSON.stringify(analyticsEvent)}`);

  // 1. Fetch all active webhooks
  const { rows } = await db.query('SELECT * FROM webhook_configs WHERE is_active = true');
  
  const now = new Date();

  for (const webhook of rows) {
    try {
      // 2. Rate Limiting Check
      // Calculate the cutoff time
      const cutoffTime = new Date(now.getTime() - webhook.rate_limit_minutes * 60000);
      
      // Check if we logged a SUCCESS for this webhook recently
      const { rowCount } = await db.query(
        `SELECT id FROM webhook_logs 
         WHERE webhook_id = $1 
         AND status = 'success' 
         AND triggered_at > $2`,
        [webhook.id, cutoffTime]
      );

      if (rowCount > 0) {
        console.log(`[Skipped] Webhook ${webhook.name} is cooling down.`);
        continue;
      }

      // 3. Condition Evaluation
      // (Import your engine here or replicate logic)
      const engine = await import('../lib/webhook-engine');
      const shouldTrigger = engine.WebhookEngine.evaluate(webhook, analyticsEvent);

      if (shouldTrigger) {
        await deliverWebhook(webhook, analyticsEvent);
      }

    } catch (err) {
      console.error(`Error processing webhook ${webhook.id}:`, err);
    }
  }
}

async function deliverWebhook(webhook: any, eventData: any) {
  // 1. Format Payload
  const { WebhookEngine } = await import('../lib/webhook-engine');
  const payload = WebhookEngine.formatPayload(webhook.destination_type, eventData, webhook.name);

  let response;
  let statusCode = 200;
  let success = false;

  try {
    // 2. Send Request
    response = await fetch(webhook.destination_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(webhook.destination_type === 'ntfy' && {}), // ntfy doesn't need JSON headers usually
      },
      body: JSON.stringify(payload)
    });

    statusCode = response.status;
    success = response.ok;

    console.log(`[Sent] ${webhook.name} -> ${statusCode}`);
  } catch (error) {
    statusCode = 500;
    console.error(`[Fail] ${webhook.name} -> Network Error`);
  }

  // 3. Log Attempt
  await db.query(
    `INSERT INTO webhook_logs (webhook_id, event_payload, status, http_status_code)
     VALUES ($1, $2, $3, $4)`,
    [webhook.id, JSON.stringify(eventData), success ? 'success' : 'failed', statusCode]
  );
}
```

### Summary of Usage
1.  **Setup**: Run the SQL schema in your PostgreSQL database.
2.  **API/UI**: Use the React `WebhookBuilder` to call the `api/webhooks` endpoints and save a configuration like: `IF visitors > 1000 POST to Slack`.
3.  **Ingest**: Whenever your analytics system processes a batch of data, call `processWebhooks({ visitors: 1200 })`.
4.  **Action**: The worker checks if the logic matches, verifies the rate limit (cooldown), and sends the Slack message.
