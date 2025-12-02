import { Logger, Module } from '@nestjs/common';
import { LogService } from '@/log/log.service';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { MailService } from '@/notification/mail/mail.service';
import { TurnstileService } from '../auth/providers/cloudflare/turnstile.provider';

@Module({
  imports: [],
  controllers: [ContactController],
  providers: [
    LogService,
    ContactService,
    MailService,
    Logger,
    TurnstileService,
  ],
})
export class ContactModule {}
