import { NotificationType } from '@prisma/client';
export declare class CreateNotificationDispatchDto {
    title: string;
    message: string;
    type: NotificationType;
    business_id: string;
    recipients: string[];
}
export declare class CreateNotificationDispatchConsoleDto {
    title: string;
    message: string;
    type: NotificationType;
    recipients: string[];
}
export declare class ScheduleNotificationDto {
    title: string;
    message: string;
    type: NotificationType;
    business_id: string;
    scheduled_time: Date;
    recipients: string[];
}
export declare class ScheduleNotificationConsoleDto {
    title: string;
    message: string;
    type: NotificationType;
    scheduled_time: Date;
    recipients: string[];
}
