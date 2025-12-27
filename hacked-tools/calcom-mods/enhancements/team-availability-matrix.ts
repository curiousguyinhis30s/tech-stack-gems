// Cal.com L3 Deep Mod: Team Availability Matrix
// Cross-team scheduling with weighted heatmaps

export interface Slot {
  startTime: Date;
  endTime: Date;
  attendees: number;
  maxAttendees?: number;
}

export interface TeamMember {
  id: number;
  userId: number;
  weight: number;
  timezone: string;
  isFixed: boolean;
  availability: Slot[];
}

export interface SourcingOptions {
  quorum: number;
  requiredIds?: number[];
  weightedHeatmap: boolean;
}

export class TeamAvailabilityService {
  static async getTeamAvailability(
    teamId: number,
    startDate: Date,
    endDate: Date,
    options: SourcingOptions
  ): Promise<Map<string, number>> {
    // Mock: In real implementation, fetch from database
    const members = await this.fetchTeamMembers(teamId);

    const memberAvailability = await Promise.all(
      members.map(async (m) => {
        const slots = await this.fetchIndividualSlots(m.userId, startDate, endDate);
        return {
          id: m.userId,
          weight: m.weight || 1,
          slots,
        } as TeamMember;
      })
    );

    const heatmap = new Map<string, number>();

    memberAvailability.forEach((member) => {
      member.slots.forEach((slot) => {
        const key = slot.startTime.toISOString();
        const currentScore = heatmap.get(key) || 0;
        const scoreIncrement = options.weightedHeatmap ? member.weight : 1;
        heatmap.set(key, currentScore + scoreIncrement);
      });
    });

    return heatmap;
  }

  static async validateSlotQuorum(
    teamId: number,
    slotStart: Date,
    options: SourcingOptions
  ): Promise<boolean> {
    const members = await this.fetchTeamMembers(teamId);

    let availableCount = 0;
    const requiredSet = new Set(options.requiredIds || []);

    for (const member of members) {
      const isAvailable = await this.checkMemberAvailability(member.userId, slotStart);
      if (isAvailable) {
        availableCount++;
        requiredSet.delete(member.userId);
      }
    }

    if (availableCount < options.quorum) return false;
    if (options.requiredIds && options.requiredIds.length > 0 && requiredSet.size > 0) {
      return false;
    }

    return true;
  }

  static async selectHostRoundRobin(teamId: number, slotStart: Date): Promise<number | null> {
    const members = await this.fetchTeamMembers(teamId);

    // Sort by last booked (oldest first for round-robin)
    members.sort((a, b) => (a.lastBookedAt || 0) - (b.lastBookedAt || 0));

    for (const member of members) {
      const isAvailable = await this.checkMemberAvailability(member.userId, slotStart);
      if (isAvailable) {
        return member.userId;
      }
    }

    return null;
  }

  private static async fetchTeamMembers(teamId: number): Promise<any[]> {
    // Mock implementation
    return [
      { userId: 1, weight: 2, timezone: 'America/New_York', lastBookedAt: Date.now() - 86400000 },
      { userId: 2, weight: 1, timezone: 'Europe/London', lastBookedAt: Date.now() - 172800000 },
      { userId: 3, weight: 3, timezone: 'Asia/Tokyo', lastBookedAt: Date.now() }
    ];
  }

  private static async fetchIndividualSlots(userId: number, start: Date, end: Date): Promise<Slot[]> {
    return [];
  }

  private static async checkMemberAvailability(userId: number, date: Date): Promise<boolean> {
    return true;
  }
}

export default TeamAvailabilityService;
