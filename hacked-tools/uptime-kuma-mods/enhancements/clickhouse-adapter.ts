// Uptime Kuma L3 Deep Mod: ClickHouse Adapter
// High-performance metrics storage with batching

export interface MetricData {
  monitor_id: number;
  region_id: string;
  timestamp: Date;
  status_code: number;
  latency: number;
  message: string;
  ping?: number;
}

export interface AggregatedStats {
  time: string;
  avg_latency: number;
  max_latency: number;
  p95_latency: number;
  check_count: number;
  up_count: number;
}

export class ClickHouseAdapter {
  private connectionUrl: string;
  private database: string;
  private queue: MetricData[] = [];
  private flushInterval: number = 10000;
  private batchSize: number = 1000;
  private timer?: NodeJS.Timeout;

  constructor(connectionUrl: string, database: string) {
    this.connectionUrl = connectionUrl;
    this.database = database;
    this.initFlushLoop();
  }

  public async insertMetric(metric: MetricData): Promise<void> {
    this.queue.push(metric);
    if (this.queue.length >= this.batchSize) {
      await this.flush();
    }
  }

  public async insertBatch(metrics: MetricData[]): Promise<void> {
    this.queue.push(...metrics);
    if (this.queue.length >= this.batchSize) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const dataToWrite = [...this.queue];
    this.queue = [];

    try {
      const body = dataToWrite.map(m => JSON.stringify(m)).join('\n');

      await fetch(`${this.connectionUrl}/?database=${this.database}&query=INSERT INTO uptime_metrics FORMAT JSONEachRow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });

      console.log(`[ClickHouse] Flushed ${dataToWrite.length} metrics`);
    } catch (error) {
      console.error('[ClickHouse] Flush Error:', error);
      // Re-queue failed data
      this.queue.unshift(...dataToWrite);
    }
  }

  private initFlushLoop(): void {
    this.timer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  public async getAggregatedStats(
    monitorId: number,
    startDate: Date,
    endDate: Date,
    interval: string = '1 minute'
  ): Promise<AggregatedStats[]> {
    const query = `
      SELECT
        toStartOfInterval(timestamp, INTERVAL ${interval}) AS time,
        avg(latency) AS avg_latency,
        max(latency) AS max_latency,
        quantile(0.95)(latency) AS p95_latency,
        count() AS check_count,
        sum(status_code = 200) AS up_count
      FROM uptime_metrics
      WHERE monitor_id = ${monitorId}
        AND timestamp BETWEEN toDateTime(${Math.floor(startDate.getTime() / 1000)}) AND toDateTime(${Math.floor(endDate.getTime() / 1000)})
      GROUP BY time
      ORDER BY time ASC
    `;

    try {
      const response = await fetch(`${this.connectionUrl}/?database=${this.database}&query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('[ClickHouse] Query Error:', error);
      return [];
    }
  }

  public async initSchema(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS uptime_metrics (
        timestamp DateTime64(3),
        monitor_id UInt32,
        region_id String,
        status_code UInt16,
        latency Float32,
        message String,
        ping Float32
      )
      ENGINE = MergeTree()
      PARTITION BY toYYYYMM(timestamp)
      ORDER BY (monitor_id, region_id, timestamp)
      TTL timestamp + INTERVAL 90 DAY
    `;

    await fetch(`${this.connectionUrl}/?database=${this.database}&query=${encodeURIComponent(createTableQuery)}`, {
      method: 'POST'
    });

    console.log('[ClickHouse] Schema initialized');
  }

  public async close(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    await this.flush();
  }
}

export default ClickHouseAdapter;
