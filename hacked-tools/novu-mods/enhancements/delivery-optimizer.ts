// Novu L3 Deep Mod: Delivery Optimizer
// Smart channel selection based on user preferences and timezone

type ChannelType = 'email' | 'sms' | 'push' | 'in_app';
type PreferenceWeight = number;

interface IUserContext {
  userId: string;
  timezone: string;
  preferences: {
    channels: Record<ChannelType, PreferenceWeight>;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  };
  history: {
    lastSeenAt: Date;
    deliveryStats: Record<ChannelType, { sent: number; clicked: number }>;
  };
}

interface IDeliveryRequest {
  transactionId: string;
  urgency: 'low' | 'medium' | 'critical' | 'transactional';
  payload: any;
}

interface IDeliveryPlan {
  recommendedChannel: ChannelType;
  reason: string;
  scheduledFor?: Date;
}

class TimeService {
  static getUserTime(timezone: string): Date {
    return new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
  }

  static isInQuietHours(userTime: Date, start: string, end: string): boolean {
    const currentHour = userTime.getHours();
    const currentMin = userTime.getMinutes();
    const currentMinutes = currentHour * 60 + currentMin;

    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }
}

export class DeliveryOptimizer {
  static async optimizeDelivery(user: IUserContext, request: IDeliveryRequest): Promise<IDeliveryPlan> {
    const nowInUserTz = TimeService.getUserTime(user.timezone);
    const isQuiet = user.preferences.quietHoursEnabled
      && TimeService.isInQuietHours(nowInUserTz, user.preferences.quietHoursStart, user.preferences.quietHoursEnd);

    const availableChannels: ChannelType[] = Object.keys(user.preferences.channels) as ChannelType[];

    const rankedChannels = availableChannels.map(channel => {
      let score = user.preferences.channels[channel];

      const stats = user.history.deliveryStats[channel];
      if (stats && stats.sent > 0) {
        const ctr = stats.clicked / stats.sent;
        score += ctr * 0.2;
      }

      if (channel === 'sms' && request.urgency === 'low') {
        score *= 0.5;
      }

      return { channel, score };
    }).sort((a, b) => b.score - a.score);

    const topPick = rankedChannels[0];

    if (request.urgency === 'critical' || request.urgency === 'transactional') {
      return {
        recommendedChannel: topPick.channel,
        reason: 'Urgency override: Sent immediately.',
      };
    }

    if (isQuiet) {
      if (topPick.channel === 'push' || topPick.channel === 'sms') {
        const emailPick = rankedChannels.find(c => c.channel === 'email');
        if (emailPick && emailPick.score > 0.3) {
           return {
             recommendedChannel: 'email',
             reason: 'Channel fallback: User in DND, switched from SMS/Push to Email.',
           };
        }

        return {
          recommendedChannel: topPick.channel,
          reason: 'Delayed: Respecting DND.',
          scheduledFor: this.calculateNextWakingWindow(user),
        };
      }
    }

    return {
      recommendedChannel: topPick.channel,
      reason: `Optimal match based on preference score ${topPick.score.toFixed(2)}.`,
    };
  }

  private static calculateNextWakingWindow(user: IUserContext): Date {
    const [endH, endM] = user.preferences.quietHoursEnd.split(':').map(Number);
    const target = TimeService.getUserTime(user.timezone);
    target.setHours(endH, endM, 0, 0);
    return target;
  }
}

export default DeliveryOptimizer;
