import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import {
  CreateNotificationDispatchConsoleDto,
  CreateNotificationDispatchDto,
  ScheduleNotificationConsoleDto,
  ScheduleNotificationDto,
} from './dispatch.dto';
import { AuthPayload } from '../../generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import {
  Action,
  Notification,
  NotificationStatus,
  NotificationType,
  Prisma,
  User,
} from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  formatNotificationMessage,
  getIpAddress,
  getUserAgent,
} from '@/generic/generic.utils';
import { LogService } from '@/log/log.service';
import { NotificationTokenService } from '../token/token.service';
import firebase from '../provider/firebase/firebase.provider';

@Injectable()
@WebSocketGateway() // Add this decorator if you intend to use WebSockets
export class NotificationDispatchService {
  private readonly logger = new Logger(NotificationDispatchService.name);
  private readonly model = 'Notification';
  private TOPIC = 'public';

  constructor(
    private readonly prisma: PrismaService,
    private readonly genericService: GenericService,
    private readonly mailService: MailService,
    private readonly notificationTokenService: NotificationTokenService,

    @InjectQueue('notificationQueue')
    private readonly notificationQueue: Queue,
    private readonly logService: LogService,
  ) {}

  /**
   * Create notification (instant)
   * @param request
   * @param createNotificationDispatchDto
   * @returns
   */
  async dispatchNotification(
    request: AuthPayload & Request,
    createNotificationDispatchDto: CreateNotificationDispatchDto,
  ) {
    const auth = request.user;
    let { business_id, type } = createNotificationDispatchDto;

    return await this.prisma.$transaction(async (prisma) => {
      // 1. Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id,
      });

      // Body for the bulk notification
      const data: Prisma.NotificationCreateInput | any = {
        ...createNotificationDispatchDto,
        recipients: {
          connect: createNotificationDispatchDto.recipients.map(
            (recipient) => ({ id: recipient }),
          ),
        },
        owner_id: auth.sub, // Also known as sender
      };

      const notification = await prisma.notification.create({
        data,
        include: { recipients: true, business: true },
      });

      // allows all jobs to be added to the queue concurrently instead of one by one.
      await Promise.all(
        notification.recipients.map((recipient) =>
          this.notificationQueue.add('sendNotification', {
            notification: formatNotificationMessage({
              notification,
              recipient,
            }),
            recipient,
            notification_type: notification.type,
          }),
        ),
      );

      // Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action:
            type === NotificationType.EMAIL
              ? Action.CUSTOM_EMAIL_NOTIFICATION
              : Action.CUSTOM_WHATSAPP_NOTIFICATION,
          entity: 'Notification',
          entity_id: notification.id,
          metadata: `User with ID ${auth.sub} just dispatched email notifications to ${notification.recipients.length} member(s) of Business ID ${notification.business_id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Notification dispatched successfully.',
      };
    });
  }

  /**
   * Schedule notifications (bulk)
   * @param request
   * @param scheduleNotificationDto
   * @returns
   */
  async scheduleNotifications(
    request: AuthPayload & Request,
    scheduleNotificationDto: ScheduleNotificationDto,
  ) {
    const auth = request.user;
    let { business_id, type, scheduled_time, recipients } =
      scheduleNotificationDto;

    return await this.prisma.$transaction(async (prisma) => {
      // 1. Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id,
      });

      // Body for the scheduled notification
      const notificationData: Prisma.NotificationCreateInput = {
        title: scheduleNotificationDto.title,
        message: scheduleNotificationDto.message,
        type: scheduleNotificationDto.type,
        is_scheduled: true,
        owner: { connect: { id: auth.sub } },
        business: { connect: { id: business_id } }, // Correct way to link business
        // is_scheduled: true,
        recipients: {
          connect: [],
        },
      };

      const notification = await prisma.notification.create({
        data: notificationData,
        include: { recipients: true },
      });

      // Create scheduled notification entries
      const scheduledNotification = await prisma.scheduledNotification.create({
        data: {
          notification: { connect: { id: notification.id } },
          scheduled_time,
          status: NotificationStatus.PENDING,
        },
        include: { notification: true },
      });

      // Create notification recipients records
      await prisma.notificationRecipient.createMany({
        data: recipients.map((recipient) => ({
          scheduled_notification_id: scheduledNotification.id,
          user_id: recipient,
          status: NotificationStatus.PENDING,
          received_at: scheduled_time,
        })),
      });

      // ✅ **Enqueue notification job for processing at the scheduled time**
      await this.notificationQueue.add(
        'processScheduledNotification',
        {
          notificationId: notification.id,
          scheduledNotificationId: scheduledNotification.id,
          type: notification.type,
        },
        { delay: new Date(scheduled_time).getTime() - Date.now() }, // Delay job until scheduled time
      );

      // Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.CUSTOM_EMAIL_NOTIFICATION,
          entity: 'ScheduledNotification',
          entity_id: scheduledNotification.id,
          metadata: `User with ID ${auth.sub} scheduled email notifications to ${recipients.length} member(s) of Business ID ${business_id} for ${scheduled_time}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Email notifications scheduled successfully.',
      };
    });
  }

  async getNotifications(businessId: string) {
    return this.prisma.notification.findMany({
      where: { business_id: businessId },
      orderBy: { created_at: 'desc' },
    });
  }

  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: true },
    });
  }

  async filterUnread(businessId: string) {
    return this.prisma.notification.findMany({
      where: { business_id: businessId, status: false },
    });
  }

  /**
   * Create console notification (instant)
   * @param request
   * @param createNotificationDispatchConsoleDto
   * @returns
   */
  async consoleDispatchNotification(
    request: AuthPayload & Request,
    createNotificationDispatchConsoleDto: CreateNotificationDispatchConsoleDto,
  ) {
    const auth = request.user;
    let { type, recipients } = createNotificationDispatchConsoleDto;

    return await this.prisma.$transaction(async (prisma) => {
      // 1. Check if user is part of the owner's administrators (TODO)

      // 2. Validate recipients exist
      const existingUsers = await prisma.user.findMany({
        where: { id: { in: recipients } },
        select: { id: true },
      });

      const existingUserIds = existingUsers.map((u) => u.id);
      const missingUserIds = recipients.filter(
        (id) => !existingUserIds.includes(id),
      );

      if (missingUserIds.length > 0) {
        throw new BadRequestException(
          `The following recipient IDs are invalid: ${missingUserIds.join(', ')}`,
        );
      }

      // Body for the bulk notification
      const data: Prisma.NotificationCreateInput | any = {
        ...createNotificationDispatchConsoleDto,
        recipients: {
          connect: recipients.map((recipient) => ({ id: recipient })),
        },
        owner_id: auth.sub, // Also known as sender
      };

      const notification = await prisma.notification.create({
        data,
        include: { recipients: true },
      });

      // allows all jobs to be added to the queue concurrently instead of one by one.
      await Promise.all(
        notification.recipients.map((recipient) =>
          this.notificationQueue.add('sendNotification', {
            notification: formatNotificationMessage({
              notification,
              recipient,
            }),
            recipient,
            notification_type: notification.type,
          }),
        ),
      );

      let metadata = `User with ID ${auth.sub} just dispatched email notifications to ${notification.recipients.length} organization(s)`;

      // Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action:
            type === NotificationType.EMAIL
              ? Action.CUSTOM_EMAIL_NOTIFICATION
              : Action.CUSTOM_WHATSAPP_NOTIFICATION,
          entity: 'Notification',
          entity_id: notification.id,
          metadata,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Notification dispatched successfully.',
      };
    });
  }

  /**
   * Schedule notifications (bulk) for owner
   * @param request
   * @param scheduleNotificationConsoleDto
   * @returns
   */
  async consoleScheduleNotifications(
    request: AuthPayload & Request,
    scheduleNotificationConsoleDto: ScheduleNotificationConsoleDto,
  ) {
    const auth = request.user;
    let { type, scheduled_time, recipients } = scheduleNotificationConsoleDto;

    return await this.prisma.$transaction(async (prisma) => {
      // 1. Check if user is part of the owner's administrators (TODO)

      // Body for the scheduled notification
      const notificationData: Prisma.NotificationCreateInput = {
        title: scheduleNotificationConsoleDto.title,
        message: scheduleNotificationConsoleDto.message,
        type: scheduleNotificationConsoleDto.type,
        is_scheduled: true,
        owner: { connect: { id: auth.sub } }, // Correct way to link business
        // is_scheduled: true,
        recipients: {
          connect: [],
        },
      };

      const notification = await prisma.notification.create({
        data: notificationData,
        include: { recipients: true },
      });

      // Create scheduled notification entries
      const scheduledNotification = await prisma.scheduledNotification.create({
        data: {
          notification: { connect: { id: notification.id } },
          scheduled_time,
          status: NotificationStatus.PENDING,
        },
        include: { notification: true },
      });

      // Create notification recipients records
      await prisma.notificationRecipient.createMany({
        data: recipients.map((recipient) => ({
          scheduled_notification_id: scheduledNotification.id,
          user_id: recipient,
          status: NotificationStatus.PENDING,
          received_at: scheduled_time,
        })),
      });

      // ✅ **Enqueue notification job for processing at the scheduled time**
      await this.notificationQueue.add(
        'processScheduledNotification',
        {
          notificationId: notification.id,
          scheduledNotificationId: scheduledNotification.id,
          type: notification.type,
        },
        { delay: new Date(scheduled_time).getTime() - Date.now() }, // Delay job until scheduled time
      );

      // Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.CUSTOM_EMAIL_NOTIFICATION,
          entity: 'ScheduledNotification',
          entity_id: scheduledNotification.id,
          metadata: `User with ID ${auth.sub} scheduled email notifications to ${recipients.length} organization(s) for ${scheduled_time}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Email notifications scheduled successfully.',
      };
    });
  }

  /**
   * Send push notification
   * @param user
   * @param title
   * @param body
   */
  async sendPush(
    userId: string,
    title: string,
    body: string,
    link?: string,
    data?: any,
  ): Promise<void> {
    // Find token

    const notificationToken =
      await this.notificationTokenService.findOneByUser(userId);

    if (notificationToken) {
      const message = {
        notification: { title, body },
        webpush: {
          headers: {
            Urgency: 'high',
          },
          notification: {
            requireInteraction: true,
            sound: 'default',
            click_action: link,
          },
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default', // Default sound
            channelId: 'high_importance_channel',
            // badge: 1, // App icon badge
            click_action: link || '', // Handle deep linking
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default', // iOS notification sound
              badge: 1, // iOS app icon badge
              alert: { title, body },
            },
          },
        },
        token: notificationToken?.token,
        data: {
          details: JSON.stringify(data),
        },
      };

      try {
        const response = await firebase.messaging().send(message as any);
        console.log('Successfully sent message:', response);
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }
  }

  /**
   * Send push notification (topic)
   * @param user
   * @param title
   * @param body
   */
  async sendPushToTopic(title: string, body: string): Promise<void> {
    await firebase
      .messaging()
      .send({
        notification: { title, body },
        topic: this.TOPIC,
        android: { priority: 'high' },
      })
      .catch((error: any) => {
        console.error(error);
      });
  }
}
