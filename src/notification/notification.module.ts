import { Module } from '@nestjs/common';
import { MailModule } from './mail/mail.module';
import { NotificationDispatchModule } from './dispatch/dispatch.module';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { NotificationTrackModule } from './track/track.module';
import { NotificationTokenModule } from './token/token.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        url: 'redis://redis_service:6379',
        // 👇 Fix for MaxRetriesPerRequestError
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      },
    }),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter, // Or FastifyAdapter from `@bull-board/fastify`
    }),
    MailModule,
    NotificationDispatchModule,
    WhatsappModule,
    NotificationTrackModule,
    NotificationTokenModule,
  ],
})
export class NotificationModule {}
