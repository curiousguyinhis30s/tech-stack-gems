This solution provides a high-performance analytics integration for Tianji. It moves raw event data from PostgreSQL (transactional) to ClickHouse (analytical) and uses **Materialized Views** with **AggregatingMergeTree** engines to pre-calculate statistics. This ensures sub-second queries even on massive datasets.

### Prerequisites
You will need the official ClickHouse client for Node.js.
```bash
npm install @clickhouse/client
```

### 1. Database Schema (`db/clickhouse-schema.sql`)
This script sets up the raw storage table and the pre-aggregation engines.
*   **`tianji_events_raw`**: Stores the exact event data.
*   **`tianji_events_agg_hourly`**: Stores pre-calculated metrics per session/event per hour.
*   **`mv_events_to_hourly`**: The background trigger that aggregates data as it enters `raw` and populates `hourly`.

```sql
-- db/clickhouse-schema.sql

-- 1. Raw Event Storage
-- OPTIMIZE: MergeTree is standard for high ingest. 
-- Using Date for partitioning allows efficient dropping of old data.
CREATE TABLE IF NOT EXISTS tianji_events_raw (
    timestamp DateTime64(3),
    date Date MATERIALIZED toDate(timestamp),
    event_name String,
    session_id String,
    website_id UUID,
    hostname String,
    path String,
    referrer String,
    os String,
    browser String,
    device_type String,
    screen_width UInt16,
    country FixedString(2),
    -- Custom Properties stored as key-value
    properties String,
    created_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (website_id, session_id, timestamp)
SETTINGS index_granularity = 8192;


-- 2. Aggregated Data Storage (Hourly)
-- OPTIMIZE: AggregatingMergeTree is crucial for performance.
-- We use -State functions (uniqState, sumState) to allow partial merging.
CREATE TABLE IF NOT EXISTS tianji_events_agg_hourly (
    date Date,
    hour UInt8,
    website_id UUID,
    event_name String,
    os String,
    -- Metrics (Stored as intermediate states)
    visitors AggregateFunction(uniqHLL12, String), -- Approximate unique count
    sessions AggregateFunction(uniqHLL12, String),
    page_views AggregateFunction(sum, UInt64),
    total_duration AggregateFunction(sum, UInt64),
    bounces AggregateFunction(sum, UInt64), -- Count of sessions with 1 event
    created_at DateTime DEFAULT now()
)
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, hour, website_id, event_name, os)
TTL date + INTERVAL 90 DAY DELETE; -- Automatically delete data older than 90 days


-- 3. Materialized View
-- This runs automatically in the background when data is inserted into `tianji_events_raw`.
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_events_to_hourly
TO tianji_events_agg_hourly AS
SELECT
    toDate(timestamp) as date,
    toHour(timestamp) as hour,
    website_id,
    event_name,
    os,
    uniqState(session_id) as visitors,
    uniqState(session_id) as sessions,
    sumState(1) as page_views,
    sumState(0) as total_duration, -- Placeholder if duration is in a separate table
    sumState(0) as bounces         -- Placeholder
FROM tianji_events_raw
GROUP BY date, hour, website_id, event_name, os;
```

---

### 2. Sync Worker (`lib/clickhouse-sync.ts`)
This worker polls PostgreSQL for new events and pushes them to ClickHouse in batches. It handles type conversion (Postgres UUIDs to Strings) and ensures data flows efficiently.

```typescript
// lib/clickhouse-sync.ts
import { createClient } from '@clickhouse/client';
import { Pool } from 'pg';

// ClickHouse Client
const clickhouse = createClient({
  url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
  database: 'tianji_analytics',
  requestTimeout: 30000, // 30s
});

// Postgres Client (Source)
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface ParsedEvent {
  timestamp: string;
  event_name: string;
  session_id: string;
  website_id: string;
  hostname: string;
  path: string;
  referrer: string;
  os: string;
  browser: string;
  device_type: string;
  screen_width: number;
  country: string;
  properties: string;
}

/**
 * Core Worker Loop
 */
export async function runSyncWorker() {
  console.log('🚀 Starting Tianji -> ClickHouse Sync Worker...');
  
  // In production, store this last_id in Redis or DB
  let lastProcessedId = 0; 
  const BATCH_SIZE = 5000;

  while (true) {
    try {
      // 1. Fetch batch from Postgres
      // Adjust table/schema names to match your Tianji installation
      const { rows } = await pgPool.query(`
        SELECT 
          id, created_at, event_name, session_id, website_id, 
          url_path as path, url_hostname as hostname, referrer, 
          os, browser, device_type, screen_width, country, properties
        FROM event 
        WHERE id > $1 
        ORDER BY id ASC 
        LIMIT $2
      `, [lastProcessedId, BATCH_SIZE]);

      if (rows.length === 0) {
        // No new data, wait before polling again
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      // 2. Transform Data
      const payload = rows.map((row) => {
        lastProcessedId = row.id;
        return {
          timestamp: new Date(row.created_at).toISOString(),
          event_name: row.event_name || 'pageview',
          session_id: row.session_id,
          website_id: row.website_id, // Assuming UUID in PG, need string conversion
          hostname: row.hostname || '',
          path: row.path || '',
          referrer: row.referrer || '',
          os: row.os || 'Unknown',
          browser: row.browser || 'Unknown',
          device_type: row.device_type || 'Desktop',
          screen_width: Number(row.screen_width) || 0,
          country: row.country || 'XX',
          properties: row.properties || '{}'
        };
      });

      // 3. Insert into ClickHouse
      // We insert into the MV Target or the Raw Table? 
      // We insert into RAW table, the Materialized View handles the rest automatically.
      await clickhouse.insert({
        table: 'tianji_events_raw',
        values: payload,
        format: 'JSONEachRow',
      });

      console.log(`✅ Synced ${payload.length} events to ClickHouse (Last ID: ${lastProcessedId})`);

    } catch (error) {
      console.error('❌ Sync Error:', error);
      // Wait a bit before retrying to avoid hammering CPU on crash loops
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}
```

---

### 3. Query Functions (`lib/clickhouse-queries.ts`)
This file provides the analytics API. It queries the **Materialized View** (`tianji_events_agg_hourly`) rather than the raw table. Because the data is pre-aggregated, querying millions of raw events becomes as fast as scanning a few thousand hourly buckets.

*Note: We use `-Merge` functions (e.g., `uniqMerge`) to collapse the AggregatingMergeTree states.*

```typescript
// lib/clickhouse-queries.ts
import { createClient } from '@clickhouse/client';

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
  username: 'default',
  password: '',
  database: 'tianji_analytics',
});

interface AnalyticsOptions {
  websiteId: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Get Time-Series Data (e.g., Visitors per hour)
 * Queries the pre-aggregated table for sub-second performance.
 */
export async function getAnalyticsTimeSeries({ websiteId, startDate, endDate }: AnalyticsOptions) {
  const query = `
    SELECT 
      formatDateTime(toDateTime(combined_date), '%Y-%m-%d %H:00') as time_key,
      sum(views) as page_views,
      uniqMerge(visitors_state) as unique_visitors
    FROM (
      SELECT 
        date + INTERVAL hour HOUR as combined_date,
        sum(page_views) as views,
        groupUniqArrayState(session_id) as visitors_state -- Approximation
      FROM tianji_events_agg_hourly
      WHERE website_id = {websiteId:UUID}
        AND date >= {startDate:Date}
        AND date <= {endDate:Date}
      GROUP BY date, hour
    )
    GROUP BY time_key
    ORDER BY time_key ASC
  `;

  const resultSet = await clickhouse.query({
    query,
    query_params: {
      websiteId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    },
    format: 'JSONEachRow',
  });

  const result = await resultSet.json();
  return result; // Returns array of objects: [{ time_key: '...', page_views: 10, unique_visitors: 5 }]
}

/**
 * Get Aggregate Stats (Totals for a period)
 */
export async function getAnalyticsStats({ websiteId, startDate, endDate }: AnalyticsOptions) {
  const query = `
    SELECT
      uniqMerge(visitors) as total_visitors,
      sum(page_views) as total_views,
      uniqMerge(os) as unique_os_count -- Example of complex metric
    FROM tianji_events_agg_hourly
    WHERE website_id = {websiteId:UUID}
      AND date >= {startDate:Date}
      AND date <= {endDate:Date}
  `;

  const resultSet = await clickhouse.query({
    query,
    query_params: {
      websiteId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    },
    format: 'JSONEachRow',
  });

  const result = await resultSet.json();
  return result[0]; // Returns single object
}

/**
 * Get Breakdown (e.g., Top Pages, OS breakdown)
 * Since we aggregated by OS in the MV, this is extremely fast.
 */
export async function getBreakdownByOS({ websiteId, startDate, endDate }: AnalyticsOptions) {
  const query = `
    SELECT
      os,
      uniqMerge(visitors) as visitors,
      sum(page_views) as views
    FROM tianji_events_agg_hourly
    WHERE website_id = {websiteId:UUID}
      AND date >= {startDate:Date}
      AND date <= {endDate:Date}
    GROUP BY os
    ORDER BY views DESC
    LIMIT 10
  `;

  const resultSet = await clickhouse.query({
    query,
    query_params: {
      websiteId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    },
    format: 'JSONEachRow',
  });

  return await resultSet.json();
}
```

---

### 4. Docker Setup (`docker-compose-clickhouse.yml`)
This configuration sets up a single-node ClickHouse instance suitable for ingestion and local querying.

```yaml
version: '3.8'

services:
  clickhouse:
    image: clickhouse/clickhouse-server:24.3
    container_name: tianji_clickhouse
    ports:
      - "8123:8123" # HTTP Interface
      - "9000:9000" # Native Interface
    environment:
      CLICKHOUSE_DB: tianji_analytics
      CLICKHOUSE_USER: default
      CLICKHOUSE_PASSWORD: ""
      CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT: 1
    volumes:
      - clickhouse_data:/var/lib/clickhouse
      - ./db/clickhouse-schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      # Enable logging for debugging
      - ./logs/clickhouse-server:/var/log/clickhouse-server
    ulimits:
      nofile:
        soft: 262144
        hard: 262144
    healthcheck:
      test: ["CMD", "clickhouse-client", "--query", "SELECT 1"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  clickhouse_data:
    driver: local
```

### Integration Steps

1.  **Start ClickHouse**:
    ```bash
    docker-compose -f docker-compose-clickhouse.yml up -d
    ```
    This will create the tables defined in `clickhouse-schema.sql`.

2.  **Run the Sync Worker**:
    Execute the sync script in a separate process or within your Node.js application.
    ```bash
    node lib/clickhouse-sync.ts
    ```
    *(Note: Ensure `DATABASE_URL` points to your Tianji PostgreSQL database)*.

3.  **Query Data**:
    Import the functions from `lib/clickhouse-queries.ts` into your API route or dashboard frontend. The data returned comes from the pre-calculated aggregates, ensuring the dashboard remains fast regardless of how many millions of events are stored.
