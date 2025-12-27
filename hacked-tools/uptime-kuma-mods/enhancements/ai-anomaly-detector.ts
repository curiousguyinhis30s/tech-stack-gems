// Uptime Kuma L3 Deep Mod: AI Anomaly Detector
// ML-based anomaly detection with baseline learning

import { ClickHouseAdapter } from './clickhouse-adapter';

export interface BaselineStats {
  mean: number;
  standardDeviation: number;
  min: number;
  max: number;
  lastUpdated: number;
}

export interface AnomalyResult {
  isAnomaly: boolean;
  score: number;
  threshold: number;
  type: 'HIGH_LATENCY' | 'DROP_AVAILABILITY' | 'NONE';
}

export class AIAnomalyDetector {
  private clickhouse: ClickHouseAdapter;
  private baselines: Map<number, BaselineStats> = new Map();
  private updateThresholdMs: number = 3600000 * 4; // 4 hours
  private zScoreThreshold: number = 2.5;

  constructor(clickhouse: ClickHouseAdapter) {
    this.clickhouse = clickhouse;
  }

  public async analyze(monitorId: number, latency: number, status: number): Promise<AnomalyResult> {
    const baseline = await this.getBaseline(monitorId);

    if (status !== 200) {
      return {
        isAnomaly: true,
        score: 10,
        threshold: 0,
        type: 'DROP_AVAILABILITY'
      };
    }

    if (baseline.standardDeviation === 0) {
      return { isAnomaly: false, score: 0, threshold: 0, type: 'NONE' };
    }

    const zScore = (latency - baseline.mean) / baseline.standardDeviation;
    const isAnomaly = Math.abs(zScore) > this.zScoreThreshold;

    return {
      isAnomaly,
      score: zScore,
      threshold: this.zScoreThreshold,
      type: isAnomaly ? 'HIGH_LATENCY' : 'NONE'
    };
  }

  public setZScoreThreshold(threshold: number): void {
    this.zScoreThreshold = threshold;
  }

  private async getBaseline(monitorId: number): Promise<BaselineStats> {
    const current = this.baselines.get(monitorId);
    const now = Date.now();

    if (current && (now - current.lastUpdated < this.updateThresholdMs)) {
      return current;
    }

    const endDate = new Date();
    const startDate = new Date(now - (7 * 24 * 60 * 60 * 1000));

    const stats = await this.calculateStatsFromDB(monitorId, startDate, endDate);
    stats.lastUpdated = now;

    this.baselines.set(monitorId, stats);
    return stats;
  }

  private async calculateStatsFromDB(monitorId: number, start: Date, end: Date): Promise<BaselineStats> {
    // In production, this would query ClickHouse
    // Mock implementation for demonstration
    return {
      mean: 120,
      standardDeviation: 15,
      min: 50,
      max: 500,
      lastUpdated: Date.now()
    };
  }

  public async generateIncidentContext(monitorId: number, incidentStart: Date): Promise<string> {
    const stats = await this.getBaseline(monitorId);

    return `Incident for Monitor ${monitorId} starting at ${incidentStart.toISOString()}.
Baseline: mean=${stats.mean}ms, stddev=${stats.standardDeviation}ms.
This context can be sent to an LLM for root cause analysis.`;
  }

  public clearBaseline(monitorId: number): void {
    this.baselines.delete(monitorId);
  }
}

export default AIAnomalyDetector;
