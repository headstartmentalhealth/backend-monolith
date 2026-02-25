import { Job } from 'bull';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '@/prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
export declare class NotificationProcessor {
    private readonly mailService;
    private readonly prisma;
    private readonly whatsappService;
    private readonly logger;
    constructor(mailService: MailService, prisma: PrismaService, whatsappService: WhatsappService);
    handleNotification(job: Job): Promise<{}>;
    processScheduledNotification(job: Job): Promise<void>;
}
