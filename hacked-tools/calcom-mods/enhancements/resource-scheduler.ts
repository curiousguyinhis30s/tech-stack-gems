/**
 * Cal.com Enhancement: Resource Scheduling
 *
 * Features:
 * - Book meeting rooms, equipment alongside time slots
 * - Overlap detection to prevent double-booking
 * - Capacity checking for rooms
 */

import { v4 as uuidv4 } from 'uuid';

export type UTCDateTime = string; // ISO 8601

export enum ResourceType {
  ROOM = 'ROOM',
  EQUIPMENT = 'EQUIPMENT',
  VEHICLE = 'VEHICLE',
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  location?: string;
  capacity?: number;
  metadata: Record<string, any>;
  isManaged: boolean; // Requires approval?
}

export interface ResourceBooking {
  id: string;
  resourceId: string;
  userId: string;
  eventId?: string; // Link to Cal.com event
  startTime: UTCDateTime;
  endTime: UTCDateTime;
  title: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: UTCDateTime;
}

export interface IResourceRepository {
  getResource(id: string): Promise<Resource | null>;
  getBookingsForResource(resourceId: string, start?: UTCDateTime, end?: UTCDateTime): Promise<ResourceBooking[]>;
  saveBooking(booking: ResourceBooking): Promise<void>;
  cancelBooking(bookingId: string): Promise<void>;
}

export class ResourceScheduler {
  constructor(private repo: IResourceRepository) {}

  /**
   * Check if resource is available during time window
   */
  async checkAvailability(
    resourceId: string,
    startTime: UTCDateTime,
    endTime: UTCDateTime
  ): Promise<boolean> {
    const bookings = await this.repo.getBookingsForResource(resourceId);

    const hasOverlap = bookings.some(booking => {
      if (booking.status === 'CANCELLED') return false;

      const bookingStart = new Date(booking.startTime).getTime();
      const bookingEnd = new Date(booking.endTime).getTime();
      const reqStart = new Date(startTime).getTime();
      const reqEnd = new Date(endTime).getTime();

      // Overlap: Start is before existing end AND End is after existing start
      return reqStart < bookingEnd && reqEnd > bookingStart;
    });

    return !hasOverlap;
  }

  /**
   * Get all available slots for a resource on a specific date
   */
  async getAvailableSlots(
    resourceId: string,
    date: UTCDateTime,
    slotDuration: number = 30 // minutes
  ): Promise<Array<{ start: UTCDateTime; end: UTCDateTime }>> {
    const dayStart = new Date(date);
    dayStart.setHours(9, 0, 0, 0); // 9 AM

    const dayEnd = new Date(date);
    dayEnd.setHours(18, 0, 0, 0); // 6 PM

    const bookings = await this.repo.getBookingsForResource(
      resourceId,
      dayStart.toISOString(),
      dayEnd.toISOString()
    );

    const slots: Array<{ start: UTCDateTime; end: UTCDateTime }> = [];
    let current = dayStart.getTime();
    const end = dayEnd.getTime();
    const slotMs = slotDuration * 60 * 1000;

    while (current + slotMs <= end) {
      const slotStart = new Date(current).toISOString();
      const slotEnd = new Date(current + slotMs).toISOString();

      const isBlocked = bookings.some(b => {
        if (b.status === 'CANCELLED') return false;
        const bStart = new Date(b.startTime).getTime();
        const bEnd = new Date(b.endTime).getTime();
        return current < bEnd && current + slotMs > bStart;
      });

      if (!isBlocked) {
        slots.push({ start: slotStart, end: slotEnd });
      }

      current += slotMs;
    }

    return slots;
  }

  /**
   * Book a resource
   */
  async bookResource(params: {
    resourceId: string;
    userId: string;
    eventId?: string;
    startTime: UTCDateTime;
    endTime: UTCDateTime;
    title: string;
  }): Promise<ResourceBooking> {
    const resource = await this.repo.getResource(params.resourceId);
    if (!resource) {
      throw new Error('Resource not found');
    }

    const isAvailable = await this.checkAvailability(
      params.resourceId,
      params.startTime,
      params.endTime
    );

    if (!isAvailable) {
      throw new Error('Resource is not available during the requested time');
    }

    const booking: ResourceBooking = {
      id: uuidv4(),
      resourceId: params.resourceId,
      userId: params.userId,
      eventId: params.eventId,
      startTime: params.startTime,
      endTime: params.endTime,
      title: params.title,
      status: resource.isManaged ? 'PENDING' : 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    await this.repo.saveBooking(booking);
    return booking;
  }

  /**
   * Find resources available for a specific time
   */
  async findAvailableResources(
    type: ResourceType,
    startTime: UTCDateTime,
    endTime: UTCDateTime,
    minCapacity?: number
  ): Promise<Resource[]> {
    // This would query all resources of type and filter
    // Implementation depends on repository design
    throw new Error('Implement based on your repository pattern');
  }
}

// Team Availability Aggregation
export class TeamAvailability {
  /**
   * Find common slots where all team members are free
   */
  static findCommonSlots(
    memberSlots: Array<Array<{ start: UTCDateTime; end: UTCDateTime }>>
  ): Array<{ start: UTCDateTime; end: UTCDateTime }> {
    if (memberSlots.length === 0) return [];
    if (memberSlots.length === 1) return memberSlots[0];

    let common = memberSlots[0];

    for (let i = 1; i < memberSlots.length; i++) {
      common = this.intersectSlots(common, memberSlots[i]);
    }

    return common;
  }

  private static intersectSlots(
    slotsA: Array<{ start: UTCDateTime; end: UTCDateTime }>,
    slotsB: Array<{ start: UTCDateTime; end: UTCDateTime }>
  ): Array<{ start: UTCDateTime; end: UTCDateTime }> {
    const overlaps: Array<{ start: UTCDateTime; end: UTCDateTime }> = [];

    for (const a of slotsA) {
      for (const b of slotsB) {
        const startMax = new Date(Math.max(
          new Date(a.start).getTime(),
          new Date(b.start).getTime()
        ));
        const endMin = new Date(Math.min(
          new Date(a.end).getTime(),
          new Date(b.end).getTime()
        ));

        if (startMax < endMin) {
          overlaps.push({
            start: startMax.toISOString(),
            end: endMin.toISOString(),
          });
        }
      }
    }

    return overlaps;
  }
}
