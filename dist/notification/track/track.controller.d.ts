import { NotificationTrackService } from './track.service';
import { FilterNotificationsDto, FilterScheduledDto } from './track.dto';
import { AuthPayload, GenericDataPayload, GenericPayload, PagePayload } from '@/generic/generic.payload';
import { BusinessDto, ChartDto, IdDto, IdDtoAlias, QueryDto } from '@/generic/generic.dto';
import { Notification } from '@prisma/client';
export declare class NotificationTrackController {
    private readonly notificationTrackService;
    constructor(notificationTrackService: NotificationTrackService);
    getInstantNotifications(request: AuthPayload & Request, queryDto: FilterNotificationsDto, param: BusinessDto): Promise<PagePayload<Notification>>;
    getScheduledNotifications(request: AuthPayload & Request, queryDto: FilterScheduledDto, param: BusinessDto): Promise<PagePayload<{
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
    }>>;
    getSingleNotification(request: AuthPayload & Request, param: IdDtoAlias): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
        data: any;
    }>;
    getNotificationsForChart(request: AuthPayload & Request, param: ChartDto, queryDto: QueryDto): Promise<GenericDataPayload<any>>;
    fetchAllInstantNotifications(request: AuthPayload & Request, queryDto: FilterNotificationsDto): Promise<PagePayload<Notification>>;
    fetchAllScheduledNotifications(request: AuthPayload & Request, queryDto: FilterScheduledDto): Promise<PagePayload<Notification>>;
    markAllNotificationsAsRead(req: AuthPayload & Request): Promise<{
        statusCode: number;
        message: string;
    }>;
    deleteNotification(request: AuthPayload & Request, param: IdDto): Promise<GenericPayload>;
    markNotificationsAsRead(id: string): Promise<{
        statusCode: number;
        message: string;
    }>;
}
