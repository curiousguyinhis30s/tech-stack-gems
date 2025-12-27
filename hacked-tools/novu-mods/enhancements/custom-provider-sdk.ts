// Novu L3 Deep Mod: Custom Provider SDK
// Extensibility layer for custom SMTP/SMS gateways

export interface IProvider {
  id: string;
  send(payload: any): Promise<{ id: string; status: string; details?: any }>;
}

export interface IProviderConfig {
  id: string;
  type: 'email' | 'sms' | 'push' | 'custom';
  credentials: Record<string, string>;
  priority?: number;
}

export class CustomSMTPProvider implements IProvider {
  id: string;
  private host: string;
  private port: number;
  private user: string;
  private pass: string;

  constructor(config: IProviderConfig) {
    this.id = config.id;
    this.host = config.credentials.host;
    this.port = Number(config.credentials.port);
    this.user = config.credentials.user;
    this.pass = config.credentials.pass;
  }

  async send(payload: { to: string; subject: string; html: string }): Promise<{ id: string; status: string }> {
    console.log(`[SMTP] Connecting to ${this.host}:${this.port}`);
    return {
      id: `smtp_${Date.now()}`,
      status: 'sent'
    };
  }
}

export class CustomSMSProvider implements IProvider {
  id: string;
  private apiKey: string;
  private from: string;

  constructor(config: IProviderConfig) {
    this.id = config.id;
    this.apiKey = config.credentials.apiKey;
    this.from = config.credentials.from;
  }

  async send(payload: { to: string; body: string }): Promise<{ id: string; status: string }> {
    console.log(`[SMS] Sending from ${this.from} to ${payload.to}`);
    return {
      id: `sms_${Date.now()}`,
      status: 'sent'
    };
  }
}

class ProviderFactory {
  private static providers: Map<string, IProvider> = new Map();
  private static strategies: Map<string, new (config: IProviderConfig) => IProvider> = new Map();

  static registerStrategy(type: string, strategyClass: new (config: IProviderConfig) => IProvider) {
    this.strategies.set(type, strategyClass);
  }

  static createProvider(config: IProviderConfig): IProvider {
    const Strategy = this.strategies.get(config.type);

    if (!Strategy) {
      throw new Error(`No strategy registered for provider type: ${config.type}`);
    }

    const providerInstance = new Strategy(config);
    this.providers.set(config.id, providerInstance);
    return providerInstance;
  }

  static getProvider(id: string): IProvider | undefined {
    return this.providers.get(id);
  }

  static listProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

export function initProviderSDK() {
  ProviderFactory.registerStrategy('custom_smtp', CustomSMTPProvider);
  ProviderFactory.registerStrategy('custom_sms', CustomSMSProvider);
}

export { ProviderFactory };
export default ProviderFactory;
