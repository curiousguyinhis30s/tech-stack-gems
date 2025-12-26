/**
 * Activepieces Enhancement: Custom Webhook Factory
 *
 * Features:
 * - Signature validation (SHA256, SHA1, MD5)
 * - Flexible header configuration
 * - Type-safe webhook creation
 */

import crypto from 'crypto';

export interface WebhookAuth {
  secret: string;
  signatureHeader?: string;
  signatureAlgorithm?: 'sha256' | 'sha1' | 'md5';
}

export class WebhookSignatureVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebhookSignatureVerificationError';
  }
}

export const webhookFactory = {
  async verifySignature({ auth, headers, rawBody }: {
    auth: WebhookAuth,
    headers: Record<string, string>,
    rawBody: string
  }): Promise<boolean> {
    const signatureHeader = auth.signatureHeader || 'x-signature';
    const algorithm = auth.signatureAlgorithm || 'sha256';

    const receivedSignature = headers[signatureHeader.toLowerCase()];
    if (!receivedSignature) {
      throw new WebhookSignatureVerificationError('Signature header missing');
    }

    const hmac = crypto.createHmac(algorithm, auth.secret);
    hmac.update(rawBody);
    const expectedSignature = hmac.digest('hex');

    // Support both raw and hex signatures
    const isValid =
      receivedSignature === expectedSignature ||
      receivedSignature === `${algorithm}=${expectedSignature}` ||
      receivedSignature === Buffer.from(expectedSignature).toString('base64');

    if (!isValid) {
      throw new WebhookSignatureVerificationError('Signature verification failed');
    }

    return true;
  },

  createWebhook<T = unknown>(params: {
    name: string;
    displayName: string;
    description: string;
    run: (context: {
      auth: WebhookAuth;
      headers: Record<string, string>;
      rawBody: string;
      payload: T;
    }) => Promise<any>;
  }) {
    return {
      ...params,
      async run(context: {
        auth: WebhookAuth;
        headers: Record<string, string>;
        rawBody: string;
        payload: T;
      }) {
        await webhookFactory.verifySignature({
          auth: context.auth,
          headers: context.headers,
          rawBody: context.rawBody,
        });
        return params.run(context);
      },
    };
  },
};

// Example usage
export const exampleWebhook = webhookFactory.createWebhook<{ orderId: string }>({
  name: 'order_webhook',
  displayName: 'Order Webhook',
  description: 'Receives order events with signature validation',
  async run({ payload }) {
    console.log('Received order:', payload.orderId);
    return { success: true, orderId: payload.orderId };
  },
});
