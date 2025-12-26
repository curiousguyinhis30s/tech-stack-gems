

Here is the complete code for the **Tianji Analytics AI Anomaly Detection Agent**.

This solution provides a modular architecture using TypeScript and Node.js. It includes a statistical engine for detection, an LLM integration layer for "smart" alerts, a unified notification system, and a test harness.

### Prerequisites

You need to install the following dependencies:
```bash
npm install axios dotenv dotenv-cli ts-node
npm install -D typescript @types/node @types/axios
```

Create a `.env` file in your root directory:
```env
# OpenAI (or compatible) API Key
OPENAI_API_KEY=sk-your-api-key
OPENAI_API_BASE=https://api.openai.com/v1 # Optional: Change if using a local LLM

# Notification Channels (At least one is recommended)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
NTFY_TOPIC=https://ntfy.sh/my-topic-name
```

---

### 1. Statistical Detection Logic
**File:** `workers/anomaly-detector.ts`

This worker handles the core logic. It calculates the Z-score for data points to determine if they deviate significantly from the moving average.

```typescript
/**
 * workers/anomaly-detector.ts
 * Core logic for analyzing time-series data using statistical methods.
 */

export interface DataPoint {
  timestamp: number;
  value: number;
  label?: string; // e.g., "CPU Usage", "Error Rate"
}

export interface AnomalyResult {
  dataPoint: DataPoint;
  score: number;
  threshold: number;
  isAnomaly: boolean;
}

export interface AnomalyDetectorConfig {
  threshold: number; // Z-score threshold (e.g., 3.0 covers 99.7% of data)
  windowSize: number; // Number of previous data points to consider for average/std dev
}

/**
 * Calculates statistics (Mean and Standard Deviation) for a dataset.
 */
function calculateStats(data: number[]): { mean: number; stdDev: number } {
  if (data.length === 0) return { mean: 0, stdDev: 0 };

  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);

  return { mean, stdDev };
}

/**
 * Runs the anomaly detection algorithm (Z-Score based).
 */
export class AnomalyDetector {
  private config: AnomalyDetectorConfig;

  constructor(config: AnomalyDetectorConfig) {
    this.config = config;
  }

  /**
   * Analyzes a new data point against historical context.
   * @param history Array of previous data points.
   * @param current The new data point to check.
   */
  public detect(history: DataPoint[], current: DataPoint): AnomalyResult {
    // Extract values from history
    const historicalValues = history.map(d => d.value);

    if (historicalValues.length < 2) {
      // Not enough data to calculate standard deviation
      return {
        dataPoint: current,
        score: 0,
        threshold: this.config.threshold,
        isAnomaly: false,
      };
    }

    const { mean, stdDev } = calculateStats(historicalValues);

    // Avoid division by zero
    const safeStdDev = stdDev === 0 ? 1 : stdDev;

    // Calculate Z-Score: (Current Value - Mean) / Standard Deviation
    const zScore = Math.abs((current.value - mean) / safeStdDev);

    const isAnomaly = zScore > this.config.threshold;

    return {
      dataPoint: current,
      score: parseFloat(zScore.toFixed(2)),
      threshold: this.config.threshold,
      isAnomaly,
    };
  }

  /**
   * Simulates an hourly run on a batch of data to find anomalies.
   */
  public runBatch(dataset: DataPoint[]): AnomalyResult[] {
    const results: AnomalyResult[] = [];
    
    // We need a sliding window approach for continuous analysis
    // For simplicity here, we check each point against the *previous* N points
    for (let i = this.config.windowSize; i < dataset.length; i++) {
      const history = dataset.slice(i - this.config.windowSize, i);
      const current = dataset[i];
      
      const result = this.detect(history, current);
      results.push(result);
    }

    return results;
  }
}
```

---

### 2. LLM Integration for Summaries
**File:** `lib/llm-summarizer.ts`

This module uses the OpenAI API to generate a human-readable explanation of the anomaly. This adds the "AI Agent" flavor to the tool.

```typescript
/**
 * lib/llm-summarizer.ts
 * Integrates with OpenAI (or compatible APIs) to explain anomalies in natural language.
 */

import axios from 'axios';

interface LLMConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

interface AnomalyContext {
  metricName: string;
  currentValue: number;
  averageValue: number;
  zScore: number;
  timestamp: string;
}

export class LLMSummarizer {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.openai.com/v1',
      model: config.model || 'gpt-4o-mini', // Using a fast/cost-effective model
    };
  }

  /**
   * Sends the anomaly context to the LLM and returns a natural language alert.
   */
  async explainAnomaly(context: AnomalyContext): Promise<string> {
    const prompt = `
      You are a DevOps monitoring agent for "Tianji Analytics". 
      A statistical anomaly has been detected for the metric "${context.metricName}".
      
      Details:
      - Current Value: ${context.currentValue}
      - Historical Average: ${context.averageValue}
      - Z-Score (Statistical Deviation): ${context.zScore}
      - Time: ${context.timestamp}

      Write a concise, professional Slack alert message (max 3 sentences). 
      Mention if the value spiked or dropped significantly. 
      Do not use markdown headers.
    `;

    try {
      const response = await axios.post(
        `${this.config.baseURL}/chat/completions`,
        {
          model: this.config.model,
          messages: [
            { role: 'system', content: 'You are a helpful monitoring assistant.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 150,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error: any) {
      console.error('LLM API Error:', error.response?.data || error.message);
      // Fallback message if LLM fails
      return `Anomaly detected for ${context.metricName}. Value: ${context.currentValue} (Z-Score: ${context.zScore}).`;
    }
  }
}
```

---

### 3. Notification Sender
**File:** `lib/notifications.ts`

Handles delivery of the alert to Slack or ntfy.sh.

```typescript
/**
 * lib/notifications.ts
 * Multi-channel notification dispatcher.
 */

import axios from 'axios';

export interface NotificationPayload {
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high';
}

export class NotificationService {
  private slackWebhookUrl?: string;
  private ntfyTopic?: string;

  constructor() {
    this.slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    this.ntfyTopic = process.env.NTFY_TOPIC;
  }

  /**
   * Sends a formatted message to Slack.
   */
  private async sendSlack(payload: NotificationPayload): Promise<void> {
    if (!this.slackWebhookUrl) return;

    // Add a visual indicator based on priority
    const color = payload.priority === 'high' ? '#danger' : '#good'; // Slack simple attachment syntax
    
    await axios.post(this.slackWebhookUrl, {
      text: payload.title,
      attachments: [
        {
          color: payload.priority === 'high' ? 'danger' : 'good',
          text: payload.message,
          footer: 'Tianji AI Anomaly Detector',
        },
      ],
    });
  }

  /**
   * Sends a message to ntfy.sh.
   */
  private async sendNtfy(payload: NotificationPayload): Promise<void> {
    if (!this.ntfyTopic) return;

    // Map priority to ntfy urgency levels
    const urgencyMap: Record<string, string> = {
      low: '1',
      normal: '3',
      high: '5',
    };

    await axios.post(this.ntfyTopic, payload.message, {
      headers: {
        'Title': payload.title,
        'Priority': urgencyMap[payload.priority || 'normal'],
      },
    });
  }

  /**
   * Main dispatch method.
   */
  public async send(payload: NotificationPayload): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.slackWebhookUrl) promises.push(this.sendSlack(payload));
    if (this.ntfyTopic) promises.push(this.sendNtfy(payload));

    await Promise.allSettled(promises);
  }
}
```

---

### 4. Test Script & Orchestration
**File:** `test-anomaly.ts`

This script simulates the hourly worker. It generates synthetic data with an artificially injected anomaly, processes it, and triggers the LLM/Notification pipeline.

```typescript
/**
 * test-anomaly.ts
 * Script to simulate the hourly worker and test the full pipeline.
 */

import { AnomalyDetector, DataPoint } from './workers/anomaly-detector';
import { LLMSummarizer } from './lib/llm-summarizer';
import { NotificationService } from './lib/notifications';

// 1. Configuration & Initialization
const detector = new AnomalyDetector({
  threshold: 2.5, // Detect anything beyond 2.5 standard deviations
  windowSize: 20, // Compare against last 20 data points
});

const llm = new LLMSummarizer({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_API_BASE, // Optional
});

const notifier = new NotificationService();

// 2. Data Generation (Mocking Tianji Analytics Data)
function generateData(): DataPoint[] {
  const data: DataPoint[] = [];
  const now = Date.now();
  let value = 50; // Baseline

  // Generate 50 points (approx 50 hours of data)
  for (let i = 0; i < 50; i++) {
    // Add slight random noise
    value = value + (Math.random() - 0.5) * 5; 
    
    // Keep it reasonable
    if (value < 10) value = 10;

    data.push({
      timestamp: now - (50 - i) * 3600 * 1000,
      value: parseFloat(value.toFixed(2)),
      label: 'Server Memory Usage (%)',
    });
  }

  // INJECT ANOMALY: A massive spike at the latest data point
  data[data.length - 1].value = 92.5;
  
  return data;
}

// 3. Main Worker Logic
async function runHourlyCheck() {
  console.log('🕒 [Worker] Starting hourly Tianji analytics check...');

  // Fetch historical data (Mocked here)
  const dataset = generateData();
  console.log(`📊 [Data] Loaded ${dataset.length} data points.`);

  // Run Statistical Detection
  // We focus on the last result in the batch for this "hourly" simulation
  const results = detector.runBatch(dataset);
  const latestResult = results[results.length - 1];

  if (!latestResult) {
    console.log('✅ [Result] No anomalies detected.');
    return;
  }

  console.log(`⚠️  [Detection] Anomaly found! Score: ${latestResult.score} (Threshold: ${latestResult.threshold})`);

  // If anomaly detected, proceed to AI Summarization
  if (latestResult.isAnomaly) {
    try {
      console.log('🤖 [LLM] Generating explanation...');
      
      // Calculate historical average for context
      const historyValues = dataset.slice(-20).map(d => d.value);
      const avg = historyValues.reduce((a,b) => a+b, 0) / historyValues.length;

      const aiExplanation = await llm.explainAnomaly({
        metricName: latestResult.dataPoint.label || 'Unknown Metric',
        currentValue: latestResult.dataPoint.value,
        averageValue: parseFloat(avg.toFixed(2)),
        zScore: latestResult.score,
        timestamp: new Date(latestResult.dataPoint.timestamp).toISOString(),
      });

      console.log(`📝 [AI Message]: ${aiExplanation}`);

      // Send Notification
      await notifier.send({
        title: `🚨 Tianji Alert: ${latestResult.dataPoint.label}`,
        message: aiExplanation,
        priority: 'high',
      });

      console.log('✅ [Notification] Alert sent successfully.');

    } catch (error) {
      console.error('❌ [Error] Failed to process anomaly:', error);
    }
  }
}

// Execute the worker
runHourlyCheck();
```

### How to Run

1.  **Configure Environment**: Ensure your `.env` file has an `OPENAI_API_KEY`.
2.  **Compile/Run**:
    ```bash
    # Using ts-node for development
    npx ts-node test-anomaly.ts
    ```
3.  **Expected Flow**:
    *   The script generates 50 data points of "Server Memory Usage".
    *   It detects the last point (92.5%) is a statistical outlier based on the previous 20 points (~50%).
    *   It sends the stats to the LLM.
    *   The LLM returns a sentence like: *"A critical spike in Server Memory Usage has occurred. The current value is 92.5%, significantly higher than the historical average of 50.15%."*
    *   This message is posted to your configured Slack/ntfy channel.
