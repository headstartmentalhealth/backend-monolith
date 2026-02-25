import { PrismaService } from '@/prisma/prisma.service';
import { HttpStatus } from '@nestjs/common';
import { CreateNotificationDispatchConsoleDto, CreateNotificationDispatchDto, ScheduleNotificationConsoleDto, ScheduleNotificationDto } from './dispatch.dto';
import { AuthPayload } from '../../generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import { MailService } from '../mail/mail.service';
import { Queue } from 'bull';
import { LogService } from '@/log/log.service';
import { NotificationTokenService } from '../token/token.service';
export declare class NotificationDispatchService {
    private readonly prisma;
    private readonly genericService;
    private readonly mailService;
    private readonly notificationTokenService;
    private readonly notificationQueue;
    private readonly logService;
    private readonly logger;
    private readonly model;
    private TOPIC;
    constructor(prisma: PrismaService, genericService: GenericService, mailService: MailService, notificationTokenService: NotificationTokenService, notificationQueue: Queue, logService: LogService);
    dispatchNotification(request: AuthPayload & Request, createNotificationDispatchDto: CreateNotificationDispatchDto): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    scheduleNotifications(request: AuthPayload & Request, scheduleNotificationDto: ScheduleNotificationDto): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    getNotifications(businessId: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        title: string;
        message: string;
        status: boolean;
        read: boolean;
        icon_url: string | null;
        is_scheduled: boolean;
        business_id: string | null;
        owner_id: string | null;
        type: import(".prisma/client").$Enums.NotificationType;
        account_role: string | null;
    }[]>;
    markAsRead(notificationId: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        title: string;
        message: string;
        status: boolean;
        read: boolean;
        icon_url: string | null;
        is_scheduled: boolean;
        business_id: string | null;
        owner_id: string | null;
        type: import(".prisma/client").$Enums.NotificationType;
        account_role: string | null;
    }>;
    filterUnread(businessId: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        title: string;
        message: string;
        status: boolean;
        read: boolean;
        icon_url: string | null;
        is_scheduled: boolean;
        business_id: string | null;
        owner_id: string | null;
        type: import(".prisma/client").$Enums.NotificationType;
        account_role: string | null;
    }[]>;
    consoleDispatchNotification(request: AuthPayload & Request, createNotificationDispatchConsoleDto: CreateNotificationDispatchConsoleDto): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    consoleScheduleNotifications(request: AuthPayload & Request, scheduleNotificationConsoleDto: ScheduleNotificationConsoleDto): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    sendPush(userId: string, title: string, body: string, link?: string, data?: any): Promise<void>;
    sendPushToTopic(title: string, body: string): Promise<void>;
}
