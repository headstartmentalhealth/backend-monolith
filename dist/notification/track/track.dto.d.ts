import { QueryDto } from '@/generic/generic.dto';
import { NotificationStatus, NotificationType } from '@prisma/client';
export declare class FetchInstantNotificationsDto {
}
export declare class FetchScheduledNotificationsDto {
}
export declare class FilterNotificationsDto extends QueryDto {
    status?: Boolean;
    type?: NotificationType;
    q?: string;
}
export declare class FilterScheduledDto extends FilterNotificationsDto {
    schedule_status?: NotificationStatus;
    q?: string;
}
