import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VideoService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private getTwilioCredentials() {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const apiKey = this.configService.get<string>('TWILIO_API_KEY');
    const apiSecret = this.configService.get<string>('TWILIO_API_SECRET');

    if (!accountSid || !apiKey || !apiSecret) {
      throw new BadRequestException('Video calling is not configured. Please contact support.');
    }

    return { accountSid, apiKey, apiSecret };
  }

  async getToken(appointmentId: string, userId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { include: { user: { select: { id: true } } } },
        doctor: { include: { user: { select: { id: true } } } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const isDoctor = appointment.doctor.user.id === userId;
    const isPatient = appointment.patient.user.id === userId;

    if (!isDoctor && !isPatient) {
      throw new ForbiddenException('You are not part of this appointment');
    }

    if (appointment.status !== 'CONFIRMED') {
      throw new BadRequestException('Appointment must be confirmed to join a video call');
    }

    const { accountSid, apiKey, apiSecret } = this.getTwilioCredentials();

    const roomName = `medbuddy-${appointmentId}`;
    const identity = isDoctor ? `doctor-${userId}` : `patient-${userId}`;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AccessToken } = require('twilio').jwt;
    const { VideoGrant } = AccessToken;

    const videoGrant = new VideoGrant({ room: roomName });
    const token = new AccessToken(accountSid, apiKey, apiSecret, { identity });
    token.addGrant(videoGrant);

    // Track session — create if first participant joins
    const existingSession = await this.prisma.videoSession.findUnique({
      where: { appointmentId },
    });

    if (!existingSession) {
      await this.prisma.videoSession.create({
        data: {
          appointmentId,
          startedAt: new Date(),
        },
      });
    }

    return {
      success: true,
      data: {
        token: token.toJwt(),
        roomName,
        identity,
      },
    };
  }

  async endSession(appointmentId: string, userId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { include: { user: { select: { id: true } } } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.doctor.user.id !== userId) {
      throw new ForbiddenException('Only the doctor can end the video session');
    }

    const session = await this.prisma.videoSession.findUnique({
      where: { appointmentId },
    });

    if (session) {
      const now = new Date();
      const durationSeconds = session.startedAt
        ? Math.round((now.getTime() - session.startedAt.getTime()) / 1000)
        : null;

      await this.prisma.videoSession.update({
        where: { appointmentId },
        data: { endedAt: now, durationSeconds },
      });
    }

    // End the Twilio room
    try {
      const { accountSid, apiSecret } = this.getTwilioCredentials();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const twilio = require('twilio');
      const client = twilio(accountSid, apiSecret);
      const roomName = `medbuddy-${appointmentId}`;
      await client.video.rooms(roomName).update({ status: 'completed' });
    } catch {
      // Room may already be ended — not a fatal error
    }

    return {
      success: true,
      message: 'Video session ended',
    };
  }
}
