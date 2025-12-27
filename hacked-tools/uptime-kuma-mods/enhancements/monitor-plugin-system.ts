// Uptime Kuma L3 Deep Mod: Monitor Plugin System
// Extensible custom monitor types

import { EventEmitter } from 'events';

export interface IMonitorPlugin {
  type: string;
  configSchema: any;
  check(config: Record<string, any>): Promise<MonitorResult>;
}

export interface MonitorResult {
  status: 'up' | 'down';
  latency: number;
  msg?: string;
  extras?: Record<string, any>;
}

export class MonitorPluginSystem extends EventEmitter {
  private plugins: Map<string, IMonitorPlugin> = new Map();

  public registerPlugin(plugin: IMonitorPlugin): void {
    if (this.plugins.has(plugin.type)) {
      throw new Error(`Plugin type ${plugin.type} is already registered.`);
    }

    if (!plugin.check || typeof plugin.check !== 'function') {
      throw new Error(`Plugin ${plugin.type} must export a check() function.`);
    }

    this.plugins.set(plugin.type, plugin);
    this.emit('pluginRegistered', plugin.type);
    console.log(`Plugin Registered: ${plugin.type}`);
  }

  public async executeMonitor(type: string, config: Record<string, any>): Promise<MonitorResult> {
    const plugin = this.plugins.get(type);

    if (!plugin) {
      return {
        status: 'down',
        latency: 0,
        msg: `Plugin type '${type}' not found in registry.`
      };
    }

    const startTime = Date.now();

    try {
      this.validateConfig(plugin.configSchema, config);
      const result = await plugin.check(config);

      if (result.latency === undefined || result.latency === null) {
        result.latency = Date.now() - startTime;
      }

      return result;
    } catch (error: any) {
      return {
        status: 'down',
        latency: Date.now() - startTime,
        msg: `Plugin Exception: ${error.message}`
      };
    }
  }

  private validateConfig(schema: any, config: any): void {
    // Placeholder for schema validation (use AJV or Zod in production)
    return;
  }

  public getPluginList(): string[] {
    return Array.from(this.plugins.keys());
  }

  public getPlugin(type: string): IMonitorPlugin | undefined {
    return this.plugins.get(type);
  }
}

// Built-in plugins

export class HttpMonitorPlugin implements IMonitorPlugin {
  type = 'http';
  configSchema = {
    url: { type: 'string', required: true },
    method: { type: 'string', default: 'GET' },
    timeout: { type: 'number', default: 30000 }
  };

  async check(config: any): Promise<MonitorResult> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);

      const response = await fetch(config.url, {
        method: config.method || 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      return {
        status: response.ok ? 'up' : 'down',
        latency: Date.now() - startTime,
        msg: `HTTP ${response.status}`,
        extras: { statusCode: response.status }
      };
    } catch (error: any) {
      return {
        status: 'down',
        latency: Date.now() - startTime,
        msg: error.message
      };
    }
  }
}

export class TcpPortMonitorPlugin implements IMonitorPlugin {
  type = 'tcp-port';
  configSchema = {
    host: { type: 'string', required: true },
    port: { type: 'number', required: true },
    timeout: { type: 'number', default: 2000 }
  };

  async check(config: any): Promise<MonitorResult> {
    const net = require('net');
    const startTime = Date.now();

    return new Promise((resolve) => {
      const socket = new net.Socket();

      const timeoutObj = setTimeout(() => {
        socket.destroy();
        resolve({ status: 'down', latency: Date.now() - startTime, msg: 'Connection timed out' });
      }, config.timeout || 2000);

      socket.connect(config.port, config.host, () => {
        clearTimeout(timeoutObj);
        socket.destroy();
        resolve({ status: 'up', latency: Date.now() - startTime, msg: 'TCP Handshake successful' });
      });

      socket.on('error', (err: any) => {
        clearTimeout(timeoutObj);
        resolve({ status: 'down', latency: Date.now() - startTime, msg: err.message });
      });
    });
  }
}

export function initDefaultPlugins(system: MonitorPluginSystem): void {
  system.registerPlugin(new HttpMonitorPlugin());
  system.registerPlugin(new TcpPortMonitorPlugin());
}

export default MonitorPluginSystem;
