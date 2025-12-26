/**
 * Uptime Kuma Enhancement Module
 *
 * Features:
 * - Multi-region monitoring logic
 * - Slack/Teams alerting integration
 * - SLA report generator
 * - Custom status page theming
 */

import express from 'express';
import Database from 'better-sqlite3';
import axios from 'axios';
import path from 'path';
import fs from 'fs';

// Configuration
const PORT = process.env.ENHANCER_PORT || 3001;
const KUMA_DB_PATH = process.env.KUMA_DB_PATH || './data/kuma.db';
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
const TEAMS_WEBHOOK = process.env.TEAMS_WEBHOOK_URL;

interface Monitor {
  id: number;
  name: string;
  type: string;
  url?: string;
}

interface Heartbeat {
  status: number;
  time: number;
}

interface AlertPayload {
  monitor: {
    id: number;
    name: string;
    url?: string;
  };
  status: number;
  msg: string;
}

// Database connection
let db: Database.Database;

function connectDatabase(): void {
  try {
    db = new Database(KUMA_DB_PATH, { readonly: true, fileMustExist: true });
    console.log(`[DB] Connected to Kuma DB at ${KUMA_DB_PATH}`);
  } catch (err) {
    console.error(`[Error] Could not connect to Kuma DB: ${err}`);
    process.exit(1);
  }
}

// SLA Calculator
function calculateSLA(monitorId: number, days: number = 30): number {
  const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);

  const stmt = db.prepare(`
    SELECT status, time FROM heartbeat
    WHERE monitor_id = ? AND time > ?
    ORDER BY time ASC
  `);

  const heartbeats = stmt.all(monitorId, startTime) as Heartbeat[];
  if (heartbeats.length === 0) return 100;

  let downTime = 0;
  let lastBeat = heartbeats[0];

  for (let i = 1; i < heartbeats.length; i++) {
    const current = heartbeats[i];
    const duration = current.time - lastBeat.time;

    if (lastBeat.status !== 1) {
      downTime += duration;
    }
    lastBeat = current;
  }

  const totalTime = Date.now() - startTime;
  const uptimePercentage = 100 - ((downTime / totalTime) * 100);
  return Math.round(uptimePercentage * 100) / 100;
}

// Multi-region check (placeholder for external pings)
async function checkMultiRegion(url: string): Promise<boolean> {
  const regions = [
    'https://updown.io/api/checks', // Example external check
  ];

  // In production, ping from multiple regions
  // For now, return true (global outage not detected)
  return true;
}

// Send alerts to Slack/Teams
async function sendAlert(payload: AlertPayload, sla: number): Promise<void> {
  const statusEmoji = payload.status === 1 ? '✅' : '🔴';
  const statusText = payload.status === 1 ? 'UP' : 'DOWN';

  const message = {
    text: `${statusEmoji} ${payload.monitor.name} is ${statusText}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Monitor:* ${payload.monitor.name}\n*Status:* ${statusText}\n*Message:* ${payload.msg}\n*SLA (30d):* ${sla}%`
        }
      }
    ]
  };

  try {
    if (SLACK_WEBHOOK) {
      await axios.post(SLACK_WEBHOOK, message);
      console.log('[Alert] Sent to Slack');
    }

    if (TEAMS_WEBHOOK) {
      // Teams format differs slightly
      await axios.post(TEAMS_WEBHOOK, {
        '@type': 'MessageCard',
        summary: `${payload.monitor.name} is ${statusText}`,
        themeColor: payload.status === 1 ? '00FF00' : 'FF0000',
        title: `${statusEmoji} ${payload.monitor.name}`,
        text: `Status: ${statusText}\nSLA: ${sla}%\nMessage: ${payload.msg}`
      });
      console.log('[Alert] Sent to Teams');
    }
  } catch (err) {
    console.error('[Alert] Failed to send:', err);
  }
}

// Express app
const app = express();
app.use(express.json());

// Webhook endpoint for Uptime Kuma
app.post('/webhook/alert', async (req, res) => {
  const payload = req.body as AlertPayload;
  console.log(`[Webhook] Alert: ${payload.monitor.name} - Status: ${payload.status}`);

  const sla = calculateSLA(payload.monitor.id, 30);

  // Only alert if it's a genuine outage (not network fluke)
  if (payload.status === 0) {
    const isGloballyDown = await checkMultiRegion(payload.monitor.url || '');
    if (isGloballyDown) {
      await sendAlert(payload, sla);
    }
  } else {
    // Recovery notification
    await sendAlert(payload, sla);
  }

  res.sendStatus(200);
});

// API: Get all monitors with SLA
app.get('/api/monitors', (req, res) => {
  const monitors = db.prepare('SELECT id, name, type FROM monitor').all() as Monitor[];

  const enriched = monitors.map(m => ({
    ...m,
    sla: calculateSLA(m.id, 30),
    sla_7d: calculateSLA(m.id, 7),
  }));

  res.json(enriched);
});

// API: Get SLA report
app.get('/api/sla-report', (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const monitors = db.prepare('SELECT id, name FROM monitor').all() as Monitor[];

  const report = monitors.map(m => ({
    id: m.id,
    name: m.name,
    sla: calculateSLA(m.id, days),
    period: `${days} days`,
  }));

  res.json({
    generated: new Date().toISOString(),
    period_days: days,
    services: report,
    average_sla: report.reduce((sum, r) => sum + r.sla, 0) / report.length,
  });
});

// Custom status page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>System Status</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui; background: #0a0a0b; color: #e5e5e5; padding: 2rem; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { margin-bottom: 2rem; font-size: 1.5rem; }
        .service { display: flex; justify-content: space-between; padding: 1rem; border: 1px solid #333; border-radius: 8px; margin-bottom: 0.5rem; }
        .up { border-color: #22c55e; }
        .down { border-color: #ef4444; }
        .badge { padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; }
        .badge.up { background: #22c55e20; color: #22c55e; }
        .badge.down { background: #ef444420; color: #ef4444; }
        .sla { color: #888; font-size: 0.875rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>System Status</h1>
        <div id="services">Loading...</div>
      </div>
      <script>
        fetch('/api/monitors')
          .then(r => r.json())
          .then(data => {
            document.getElementById('services').innerHTML = data.map(m => \`
              <div class="service \${m.sla >= 99.9 ? 'up' : 'down'}">
                <div>
                  <strong>\${m.name}</strong>
                  <div class="sla">SLA: \${m.sla}% (30d) | \${m.sla_7d}% (7d)</div>
                </div>
                <span class="badge \${m.sla >= 99.9 ? 'up' : 'down'}">\${m.sla >= 99.9 ? 'Operational' : 'Issues'}</span>
              </div>
            \`).join('');
          });
      </script>
    </body>
    </html>
  `);
});

// Start
connectDatabase();
app.listen(PORT, () => {
  console.log(`[Server] Uptime Kuma Enhancer running on port ${PORT}`);
  console.log(`[Server] Status Page: http://localhost:${PORT}`);
  console.log(`[Server] Webhook: http://localhost:${PORT}/webhook/alert`);
});
