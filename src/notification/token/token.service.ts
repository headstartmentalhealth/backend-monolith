import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateNotificationTokenDto } from './dto/create-notification-token.dto';
import { NotificationToken } from '@prisma/client';
import {
  AuthPayload,
  GenericPayload,
  GenericPayloadAlias,
} from '@/generic/generic.payload';
import { IdDto } from '@/generic/generic.dto';

@Injectable()
export class NotificationTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async addPushNotification(
    payload: AuthPayload,
    createNotificationTokenDto: CreateNotificationTokenDto,
  ): Promise<GenericPayload> {
    const { sub: user_id } = payload.user;

    // Check for existing token record
    const existing_token = await this.prisma.notificationToken.findFirst({
      where: {
        user_id: user_id,
      },
    });

    if (existing_token) {
      // Update existing token
      await this.prisma.notificationToken.update({
        where: { id: existing_token.id },
        data: {
          token: createNotificationTokenDto.token,
          device_type: createNotificationTokenDto.device_type,
          is_active: true,
        },
      });
    } else {
      const notification_token = await this.prisma.notificationToken.findFirst({
        where: { token: createNotificationTokenDto.token },
      });

      if (notification_token) {
        // Update token
        await this.prisma.notificationToken.update({
          where: { id: notification_token.id },
          data: {
            token: createNotificationTokenDto.token,
            device_type: createNotificationTokenDto.device_type,
            is_active: true,
            user_id,
          },
        });
      } else {
        // Create new token
        await this.prisma.notificationToken.create({
          data: {
            token: createNotificationTokenDto.token,
            device_type: createNotificationTokenDto.device_type,
            is_active: true,
            user_id,
          },
        });
      }
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Notification token saved successfully',
    };
  }

  private async reactivateToken(token: string): Promise<NotificationToken> {
    return this.prisma.notificationToken.update({
      where: { token },
      data: {
        is_active: true,
        updated_at: new Date(),
      },
    });
  }

  async deactivateToken(
    request: AuthPayload,
    param: IdDto,
  ): Promise<GenericPayload> {
    const { id } = param;

    await this.prisma.notificationToken.update({
      where: { id },
      data: { is_active: false },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Notification token deactivated successfully.',
    };
  }

  async findByToken(token: string) {
    return this.prisma.notificationToken.findUnique({
      where: { token },
    });
  }

  async findManyByUser(
    payload: AuthPayload,
  ): Promise<GenericPayloadAlias<NotificationToken[]>> {
    const { sub: user_id } = payload.user;
    const tokens = await this.prisma.notificationToken.findMany({
      where: { user_id },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Notification token fetched successfully',
      data: tokens,
    };
  }

  async findOneByUser(user_id: string): Promise<NotificationToken> {
    return this.prisma.notificationToken.findFirst({
      where: { user_id },
    });
  }
}
