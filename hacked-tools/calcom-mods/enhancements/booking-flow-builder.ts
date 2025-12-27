// Cal.com L3 Deep Mod: Booking Flow Builder
// Custom state machines for complex booking workflows

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export enum NodeType {
  Trigger = "TRIGGER",
  Action = "ACTION",
  Condition = "CONDITION",
  Webhook = "WEBHOOK",
}

export interface FlowNode {
  id: string;
  type: NodeType;
  actionType?: "PAYMENT" | "EMAIL" | "SMS" | "DELAY" | "WEBHOOK";
  config?: any;
  nextStepId?: string;
  errorStepId?: string;
}

export interface FlowState {
  flowId: string;
  currentNodeId: string;
  payload: any;
  history: { nodeId: string; result: any; timestamp: Date }[];
}

export class BookingFlow extends EventEmitter {
  public id: string;
  private nodes: Map<string, FlowNode>;
  private entryPointId: string;

  constructor(entryPointId: string) {
    super();
    this.id = uuidv4();
    this.nodes = new Map();
    this.entryPointId = entryPointId;
  }

  addNode(node: FlowNode): this {
    this.nodes.set(node.id, node);
    return this;
  }

  async start(payload: any): Promise<FlowState> {
    const state: FlowState = {
      flowId: this.id,
      currentNodeId: this.entryPointId,
      payload,
      history: []
    };

    return this.processState(state);
  }

  private async processState(state: FlowState): Promise<FlowState> {
    const node = this.nodes.get(state.currentNodeId);
    if (!node) {
      this.emit('completed', state);
      return state;
    }

    let result: any = null;
    let nextNodeId: string | undefined = node.nextStepId;

    try {
      switch (node.type) {
        case NodeType.Action:
          result = await this.executeAction(node, state.payload);
          break;
        case NodeType.Condition:
          result = await this.evaluateCondition(node, state.payload);
          nextNodeId = result ? node.nextStepId : node.errorStepId;
          break;
        case NodeType.Webhook:
          await this.executeWebhook(node, state.payload);
          break;
      }

      state.history.push({ nodeId: node.id, result, timestamp: new Date() });

      if (nextNodeId) {
        state.currentNodeId = nextNodeId;
        return this.processState(state);
      } else {
        this.emit('completed', state);
        return state;
      }
    } catch (err) {
      console.error(`Step ${node.id} failed:`, err);
      if (node.errorStepId) {
        state.currentNodeId = node.errorStepId;
        return this.processState(state);
      }
      this.emit('error', { state, error: err });
      return state;
    }
  }

  private async executeAction(node: FlowNode, payload: any): Promise<any> {
    if (node.actionType === "PAYMENT") {
      return { paymentId: "pay_" + Date.now(), status: "paid" };
    }
    if (node.actionType === "DELAY") {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return { delayed: true };
    }
    if (node.actionType === "EMAIL") {
      console.log("Sending email:", node.config);
      return { sent: true };
    }
    return null;
  }

  private async evaluateCondition(node: FlowNode, payload: any): Promise<boolean> {
    return payload.paymentStatus === "PAID";
  }

  private async executeWebhook(node: FlowNode, payload: any): Promise<void> {
    if (node.config?.url) {
      await fetch(node.config.url, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  toJSON() {
    return {
      id: this.id,
      entryPoint: this.entryPointId,
      nodes: Array.from(this.nodes.values()),
    };
  }
}

export default BookingFlow;
