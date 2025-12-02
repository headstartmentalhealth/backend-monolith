import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { NotificationRecipient, User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private readonly configService: ConfigService) {}

  private readonly whatsappApiUrl =
    this.configService.get<string>('WHATSAPP_API_URL');
  private readonly whatsappApiKey =
    this.configService.get<string>('WHATSAPP_API_KEY');

  async sendBulkMessage(recipient: User, notification: any) {
    try {
      // if (!recipient.device_id) {
      //   this.logger.warn(
      //     `Skipping WhatsApp message: No device ID for recipient ${recipient.user_id}`,
      //   );
      //   return;
      // }

      const messagePayload = {
        to: recipient.phone,
        message: notification.message,
      };

      const response = await axios.post(
        `${this.whatsappApiUrl}/send`,
        messagePayload,
        {
          headers: {
            Authorization: `Bearer ${this.whatsappApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(
        `WhatsApp message sent to ${recipient.id}: ${response.data.status}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send WhatsApp message to ${recipient.id}: ${error.message}`,
      );
    }
  }
}
