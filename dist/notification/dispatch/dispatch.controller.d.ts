import { NotificationDispatchService } from './dispatch.service';
import { CreateNotificationDispatchConsoleDto, CreateNotificationDispatchDto, ScheduleNotificationConsoleDto, ScheduleNotificationDto } from './dispatch.dto';
import { AuthPayload } from '@/generic/generic.payload';
export declare class NotificationDispatchController {
    private readonly notificationDispatchService;
    constructor(notificationDispatchService: NotificationDispatchService);
    createNotification(request: AuthPayload & Request, createNotificationDispatchDto: CreateNotificationDispatchDto): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
        message: string;
    }>;
    createConsoleNotification(request: AuthPayload & Request, createNotificationDispatchConsoleDto: CreateNotificationDispatchConsoleDto): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
        message: string;
    }>;
    scheduleNotification(request: AuthPayload & Request, scheduleNotificationDto: ScheduleNotificationDto): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
        message: string;
    }>;
    ownerScheduleNotification(request: AuthPayload & Request, scheduleNotificationConsoleDto: ScheduleNotificationConsoleDto): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
        message: string;
    }>;
    getNotifications(businessId: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.NotificationType;
        business_id: string | null;
        status: boolean;
        title: string;
        message: string;
        read: boolean;
        icon_url: string | null;
        is_scheduled: boolean;
        owner_id: string | null;
        account_role: string | null;
    }[]>;
    markAsRead(notificationId: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.NotificationType;
        business_id: string | null;
        status: boolean;
        title: string;
        message: string;
        read: boolean;
        icon_url: string | null;
        is_scheduled: boolean;
        owner_id: string | null;
        account_role: string | null;
    }>;
    filterUnread(businessId: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.NotificationType;
        business_id: string | null;
        status: boolean;
        title: string;
        message: string;
        read: boolean;
        icon_url: string | null;
        is_scheduled: boolean;
        owner_id: string | null;
        account_role: string | null;
    }[]>;
}
