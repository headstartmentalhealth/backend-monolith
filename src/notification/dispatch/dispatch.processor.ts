import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MailService } from '../mail/mail.service';
import {
  BusinessInformation,
  Notification,
  NotificationStatus,
  NotificationType,
  User,
} from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Processor('notificationQueue')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
  ) {}

  @Process('sendNotification')
  async handleNotification(job: Job) {
    try {
      const {
        notification,
        recipient,
        notification_type,
      }: {
        notification: Notification & { business: BusinessInformation };
        recipient: User;
        notification_type: NotificationType;
      } = job.data;
      console.log(job.data);

      this.logger.log(
        `Sending ${notification_type} notification to user ${recipient.id}: ${notification.title}`,
      );

      // Implement actual sending logic for email or push notification here
      if (notification.type === NotificationType.EMAIL) {
        await this.mailService.customEmail(recipient, notification);
      } else if (notification.type === NotificationType.WHATSAPP) {
        await this.whatsappService.sendBulkMessage(recipient, notification);
      }
      return {};
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}: ${error.message}`);
      throw error; // Re-throw the error to let Bull handle retries
    }
  }

  @Process('processScheduledNotification')
  async processScheduledNotification(job: Job) {
    try {
      const { scheduledNotificationId } = job.data;
      this.logger.log(
        `Processing scheduled notification ${scheduledNotificationId}`,
      );

      return this.prisma.$transaction(async (prisma) => {
        // Fetch scheduled notification and related details
        const scheduledNotification =
          await prisma.scheduledNotification.findUnique({
            where: { id: scheduledNotificationId },
            include: {
              notification: { include: { business: true } },
              recipients: { include: { user: true } },
            },
          });

        if (!scheduledNotification) {
          this.logger.error(
            `Scheduled notification ${scheduledNotificationId} not found`,
          );
          return;
        }

        // Iterate through recipients and send notifications
        await Promise.all(
          scheduledNotification.recipients.map(async (recipient) => {
            // Implement actual sending logic for email or push notification here
            if (
              scheduledNotification.notification.type === NotificationType.EMAIL
            ) {
              await this.mailService.customEmail(
                recipient.user,
                scheduledNotification.notification,
              );
            } else if (
              scheduledNotification.notification.type ===
              NotificationType.WHATSAPP
            ) {
              await this.whatsappService.sendBulkMessage(
                recipient.user,
                scheduledNotification.notification,
              );
            }

            // Update recipient status to SENT
            await prisma.notificationRecipient.update({
              where: { id: recipient.id },
              data: { status: NotificationStatus.SENT },
            });
          }),
        );

        // Update scheduled notification status to DELIVERED
        await prisma.scheduledNotification.update({
          where: { id: scheduledNotificationId },
          data: { status: NotificationStatus.DELIVERED },
        });

        this.logger.log(
          `Scheduled notification ${scheduledNotificationId} processed successfully.`,
        );
      });
    } catch (error) {
      this.logger.error(
        `Failed to process scheduled notification ${job.id}: ${error.message}`,
      );
      throw error;
    }
  }
}
