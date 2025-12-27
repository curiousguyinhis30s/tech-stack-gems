// Cal.com L3 Deep Mod: AI Slot Optimizer
// Intelligent host selection with multiple strategies

import { subDays } from 'date-fns';

export enum OptimizationStrategy {
  WorkloadBalance = "workload_balance",
  PriorityFirst = "priority_first",
  ContextMinimization = "context_minimization",
}

export interface OptimizationContext {
  userIds: number[];
  startTime: Date;
  duration: number;
  eventTypeTitle: string;
}

export class AISlotOptimizer {
  static async optimize(context: OptimizationContext, strategy: OptimizationStrategy): Promise<number> {
    switch (strategy) {
      case OptimizationStrategy.WorkloadBalance:
        return this.workloadBalanceStrategy(context);
      case OptimizationStrategy.PriorityFirst:
        return this.priorityStrategy(context);
      case OptimizationStrategy.ContextMinimization:
        return this.contextStrategy(context);
      default:
        throw new Error("Unknown strategy");
    }
  }

  private static async workloadBalanceStrategy(context: OptimizationContext): Promise<number> {
    const startOfWeek = subDays(context.startTime, 7);

    const workloads = await Promise.all(
      context.userIds.map(async (uid) => {
        const count = await this.getBookingCount(uid, startOfWeek);
        return { userId: uid, score: count };
      })
    );

    workloads.sort((a, b) => a.score - b.score);
    return workloads[0].userId;
  }

  private static async priorityStrategy(context: OptimizationContext): Promise<number> {
    const scores = await this.getMlScores(context.userIds, context.eventTypeTitle);

    const ranked = context.userIds
      .map((uid) => ({ userId: uid, score: scores.get(uid) || 0 }))
      .sort((a, b) => b.score - a.score);

    return ranked[0].userId;
  }

  private static async contextStrategy(context: OptimizationContext): Promise<number> {
    const windowStart = new Date(context.startTime.getTime() - 2 * 60 * 60 * 1000);
    const windowEnd = new Date(context.startTime.getTime() + 2 * 60 * 60 * 1000);

    const nearbyBookings = await this.getNearbyBookings(
      context.userIds,
      windowStart,
      windowEnd,
      context.eventTypeTitle
    );

    const frequency = new Map<number, number>();
    nearbyBookings.forEach((booking) => {
      frequency.set(booking.userId, (frequency.get(booking.userId) || 0) + 1);
    });

    let bestMatch = context.userIds[0];
    let maxFreq = -1;

    frequency.forEach((freq, uid) => {
      if (freq > maxFreq) {
        maxFreq = freq;
        bestMatch = uid;
      }
    });

    return bestMatch;
  }

  private static async getBookingCount(userId: number, since: Date): Promise<number> {
    // Mock implementation
    return Math.floor(Math.random() * 20);
  }

  private static async getMlScores(userIds: number[], eventType: string): Promise<Map<number, number>> {
    const scores = new Map<number, number>();
    userIds.forEach((id) => scores.set(id, Math.random() * 100));
    return scores;
  }

  private static async getNearbyBookings(
    userIds: number[],
    start: Date,
    end: Date,
    title: string
  ): Promise<{ userId: number }[]> {
    return [];
  }
}

export default AISlotOptimizer;
