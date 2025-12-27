// Formbricks L3 Deep Mod: Payment Integration
// Stripe-based pay-to-submit flow

import Stripe from 'stripe';

export interface PaymentConfig {
  stripeSecretKey: string;
  webhookSecret: string;
  mode: 'test' | 'live';
}

export interface PricingRule {
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP';
  label: string;
}

export interface PaymentResult {
  success: boolean;
  receiptUrl?: string;
  transactionId?: string;
  error?: string;
}

export class PaymentFormGuard {
  private stripe: Stripe;
  private config: PaymentConfig;

  constructor(config: PaymentConfig) {
    this.config = config;
    this.stripe = new Stripe(config.stripeSecretKey, {
      apiVersion: '2022-11-15'
    });
  }

  async initializePayment(pricing: PricingRule, customerEmail?: string): Promise<{
    clientSecret: string;
    ephemeralKey?: string;
    customer?: string
  }> {
    try {
      let customerParams: Stripe.CustomerCreateParams = {};
      if (customerEmail) customerParams.email = customerEmail;
      const customer = await this.stripe.customers.create(customerParams);

      const ephemeralKey = await this.stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: '2022-11-15' }
      );

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: pricing.amount,
        currency: pricing.currency.toLowerCase(),
        customer: customer.id,
        metadata: {
          description: pricing.label
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret as string,
        ephemeralKey: ephemeralKey.secret,
        customer: customer.id
      };
    } catch (error) {
      console.error("Stripe Init Error:", error);
      throw new Error("Failed to initialize payment gateway");
    }
  }

  async verifyPaymentAccess(paymentIntentId: string): Promise<PaymentResult> {
    try {
      const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (intent.status === 'succeeded') {
        const chargeId = intent.latest_charge as string;
        const receiptUrl = this.getReceiptUrl(chargeId);

        return {
          success: true,
          transactionId: intent.id,
          receiptUrl: receiptUrl
        };
      } else {
        return {
          success: false,
          error: `Payment not successful. Status: ${intent.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: "Invalid Payment Intent ID"
      };
    }
  }

  private getReceiptUrl(chargeId: string): string {
    return `https://dashboard.stripe.com/${this.config.mode}/receipts/${chargeId}`;
  }

  async handleWebhook(rawBody: string, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.config.webhookSecret
      );
    } catch (err) {
      throw new Error(`Webhook Error: ${err}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`Payment succeeded for ${paymentIntent.id}`);
    }
  }
}

export default PaymentFormGuard;
