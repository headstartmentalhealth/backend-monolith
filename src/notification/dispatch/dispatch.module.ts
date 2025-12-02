import { Module } from '@nestjs/common';
import { NotificationDispatchService } from './dispatch.service';
import { NotificationDispatchController } from './dispatch.controller';
import { MailService } from '../mail/mail.service';
import { BullModule } from '@nestjs/bull';
import { NotificationProcessor } from './dispatch.processor';
import { join } from 'path';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { NotificationTokenService } from '../token/token.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notificationQueue',
    }),
  ],
  controllers: [NotificationDispatchController],
  providers: [
    NotificationDispatchService,
    MailService,
    NotificationProcessor,
    WhatsappService,
    NotificationTokenService,
  ],
  exports: [NotificationDispatchService],
})
export class NotificationDispatchModule {}
