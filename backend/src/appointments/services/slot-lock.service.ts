import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * SlotLockService handles distributed locking for appointment slots
 * Uses database-based locking as a simple alternative to Redis
 * For production with high concurrency, consider Redis-based distributed locks
 */
@Injectable()
export class SlotLockService {
  private readonly logger = new Logger(SlotLockService.name);
  private readonly LOCK_EXPIRY_SECONDS = 30; // Lock expires after 30 seconds

  constructor(private prisma: PrismaService) {}

  /**
   * Attempt to acquire a lock for a specific appointment slot
   * Returns true if lock acquired, false otherwise
   */
  async acquireLock(doctorId: string, slotStart: Date, slotEnd: Date, lockedBy: string): Promise<boolean> {
    try {
      // First, clean up expired locks
      await this.cleanupExpiredLocks();

      // Try to create a lock record
      const expiresAt = new Date(Date.now() + this.LOCK_EXPIRY_SECONDS * 1000);

      await this.prisma.appointmentSlotLock.create({
        data: {
          doctorId,
          slotStart,
          slotEnd,
          lockedBy,
          expiresAt,
        },
      });

      this.logger.log(`Lock acquired for doctor ${doctorId} at ${slotStart.toISOString()} by ${lockedBy}`);
      return true;
    } catch (error) {
      // If unique constraint fails, slot is already locked
      if (error.code === 'P2002') {
        this.logger.warn(`Lock already exists for doctor ${doctorId} at ${slotStart.toISOString()}`);
        return false;
      }
      throw error;
    }
  }

  /**
   * Release a lock for a specific appointment slot
   */
  async releaseLock(doctorId: string, slotStart: Date, lockedBy: string): Promise<void> {
    try {
      await this.prisma.appointmentSlotLock.deleteMany({
        where: {
          doctorId,
          slotStart,
          lockedBy,
        },
      });
      this.logger.log(`Lock released for doctor ${doctorId} at ${slotStart.toISOString()} by ${lockedBy}`);
    } catch (error) {
      this.logger.error(`Failed to release lock: ${error.message}`);
    }
  }

  /**
   * Clean up expired locks
   * Called automatically before acquiring new locks
   */
  async cleanupExpiredLocks(): Promise<void> {
    try {
      const result = await this.prisma.appointmentSlotLock.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      if (result.count > 0) {
        this.logger.log(`Cleaned up ${result.count} expired locks`);
      }
    } catch (error) {
      this.logger.error(`Failed to cleanup expired locks: ${error.message}`);
    }
  }

  /**
   * Check if a slot is currently locked
   */
  async isSlotLocked(doctorId: string, slotStart: Date): Promise<boolean> {
    const lock = await this.prisma.appointmentSlotLock.findFirst({
      where: {
        doctorId,
        slotStart,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    return lock !== null;
  }
}
