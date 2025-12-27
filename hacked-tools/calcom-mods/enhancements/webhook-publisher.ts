// Cal.com L3 Deep Mod: Webhook Publisher
// Multi-tenant webhook delivery with HMAC verification

import crypto from 'crypto';

export interface WebhookPayload {
  tenantId: number;
  userId?: number;
  eventType: string;
  data: any;
  triggeredAt: Date;
}

export interface WebhookSubscription {
  id: string;
  tenantId: number;
  eventType: string;
  endpointUrl: string;
  secret: string;
  active: boolean;
}

export interface DeliveryResult {
  subscriptionId: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  attemptNumber: number;
}

export class WebhookPublisher {
  private subscriptions: WebhookSubscription[] = [];
  private maxRetries: number = 5;
  private retryDelayMs: number = 2000;

  registerSubscription(subscription: WebhookSubscription): void {
    this.subscriptions.push(subscription);
  }

  async publish(eventType: string, data: any, tenantId: number, userId?: number): Promise<DeliveryResult[]> {
    const matchingSubscriptions = this.subscriptions.filter(
      s => s.tenantId === tenantId && s.eventType === eventType && s.active
    );

    if (matchingSubscriptions.length === 0) {
      return [];
    }

    const payload: WebhookPayload = {
      tenantId,
      userId,
      eventType,
      data,
      triggeredAt: new Date()
    };

    const results = await Promise.all(
      matchingSubscriptions.map(sub => this.deliverWithRetry(sub, payload))
    );

    return results;
  }

  private async deliverWithRetry(
    subscription: WebhookSubscription,
    payload: WebhookPayload,
    attempt: number = 1
  ): Promise<DeliveryResult> {
    const signature = this.generateSignature(payload, subscription.secret);

    try {
      const response = await fetch(subscription.endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cal-Signature': signature,
          'X-Cal-Event': payload.eventType
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return {
        subscriptionId: subscription.id,
        success: true,
        statusCode: response.status,
        attemptNumber: attempt
      };
    } catch (error: any) {
      if (attempt < this.maxRetries) {
        await this.delay(this.retryDelayMs * Math.pow(2, attempt - 1));
        return this.deliverWithRetry(subscription, payload, attempt + 1);
      }

      return {
        subscriptionId: subscription.id,
        success: false,
        error: error.message,
        attemptNumber: attempt
      };
    }
  }

  private generateSignature(payload: any, secret: string): string {
    const json = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(json).digest('hex');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static verifySignature(payload: string, signature: string, secret: string): boolean {
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }
}

export default WebhookPublisher;
