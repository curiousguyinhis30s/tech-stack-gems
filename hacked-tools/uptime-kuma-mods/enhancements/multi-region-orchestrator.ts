// Uptime Kuma L3 Deep Mod: Multi-Region Orchestrator
// Distributed monitoring with consensus-based alerting

import { EventEmitter } from 'events';

export interface Region {
  id: string;
  name: string;
  endpoint: string;
  geo: {
    lat: number;
    lon: number;
    city: string;
    country: string;
  };
}

export interface MonitorStatus {
  monitorId: number;
  regionId: string;
  status: 'up' | 'down' | 'pending';
  latency?: number;
  timestamp: number;
  msg?: string;
}

export interface ConsensusConfig {
  strategy: 'all' | 'majority' | 'quorum' | 'at_least';
  threshold?: number;
}

export interface AggregateStatus {
  monitorId: number;
  status: 'up' | 'down';
  avgLatency?: number;
  failCount: number;
  totalRegions: number;
  timestamp: number;
}

export class MultiRegionOrchestrator extends EventEmitter {
  private regions: Map<string, Region> = new Map();
  private activeProbes: Map<number, Set<string>> = new Map();
  private statusHistory: Map<number, MonitorStatus[]> = new Map();
  private consensusConfig: ConsensusConfig = { strategy: 'majority' };

  constructor() {
    super();
  }

  public registerRegion(region: Region): void {
    this.regions.set(region.id, region);
    this.emit('regionRegistered', region);
  }

  public assignMonitorToRegions(monitorId: number, regionIds: string[]): void {
    const validRegions = regionIds.filter(id => this.regions.has(id));
    this.activeProbes.set(monitorId, new Set(validRegions));
  }

  public setConsensusConfig(config: ConsensusConfig): void {
    this.consensusConfig = config;
  }

  public ingestHeartbeat(status: MonitorStatus): void {
    const { monitorId } = status;

    if (!this.activeProbes.has(monitorId)) {
      return;
    }

    if (!this.statusHistory.has(monitorId)) {
      this.statusHistory.set(monitorId, []);
    }
    const history = this.statusHistory.get(monitorId)!;
    history.push(status);

    if (history.length > 100) history.shift();

    this.evaluateConsensus(monitorId);
  }

  private evaluateConsensus(monitorId: number): void {
    const assignedRegions = this.activeProbes.get(monitorId);
    if (!assignedRegions) return;

    const allStatuses = this.statusHistory.get(monitorId) || [];
    const recentThreshold = Date.now() - 30000;
    const recentStatuses = allStatuses.filter(s => s.timestamp > recentThreshold);

    const latestPerRegion: Map<string, MonitorStatus> = new Map();
    recentStatuses.forEach(s => {
      if (!latestPerRegion.has(s.regionId) || s.timestamp > latestPerRegion.get(s.regionId)!.timestamp) {
        latestPerRegion.set(s.regionId, s);
      }
    });

    const totalRegions = assignedRegions.size;
    let failCount = 0;
    let totalLatency = 0;
    let latencyCount = 0;

    assignedRegions.forEach(regionId => {
      const status = latestPerRegion.get(regionId);
      if (!status) return;

      if (status.status === 'down') failCount++;

      if (status.latency !== undefined) {
        totalLatency += status.latency;
        latencyCount++;
      }
    });

    const avgLatency = latencyCount > 0 ? totalLatency / latencyCount : undefined;
    const isDown = this.checkConsensusLogic(totalRegions, failCount);
    const finalStatus = isDown ? 'down' : 'up';

    const aggregateStatus: AggregateStatus = {
      monitorId,
      status: finalStatus,
      avgLatency,
      failCount,
      totalRegions,
      timestamp: Date.now()
    };

    this.emit('aggregateStatus', aggregateStatus);
  }

  private checkConsensusLogic(total: number, failures: number): boolean {
    if (total === 0) return false;

    switch (this.consensusConfig.strategy) {
      case 'all':
        return failures === total;
      case 'majority':
        return failures > (total / 2);
      case 'quorum':
      case 'at_least':
        return failures >= (this.consensusConfig.threshold || 1);
      default:
        return failures > (total / 2);
    }
  }

  public getRegionStatus(monitorId: number): MonitorStatus[] {
    return this.statusHistory.get(monitorId) || [];
  }

  public listRegions(): Region[] {
    return Array.from(this.regions.values());
  }
}

export default MultiRegionOrchestrator;
