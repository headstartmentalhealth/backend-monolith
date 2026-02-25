import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Notification } from '@prisma/client';
import { BusinessDto, ChartDto, IdDto, QueryDto } from '@/generic/generic.dto';
import { AuthPayload, GenericDataPayload, GenericPayload, PagePayload } from '@/generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import { FilterNotificationsDto, FilterScheduledDto } from './track.dto';
import { LogService } from '@/log/log.service';
export declare class NotificationTrackService {
    private readonly prisma;
    private readonly genericService;
    private readonly logService;
    private readonly model;
    private readonly select;
    private readonly notificationRepository;
    constructor(prisma: PrismaService, genericService: GenericService, logService: LogService);
    fetchInstantNotifications(payload: AuthPayload, param: BusinessDto, filterDto: FilterNotificationsDto): Promise<PagePayload<Notification>>;
    fetchScheduledNotifications(payload: AuthPayload, param: BusinessDto, filterDto: FilterScheduledDto): Promise<PagePayload<Notification>>;
    fetchSingleNotification(payload: AuthPayload & Request, param: IdDto): Promise<{
        statusCode: HttpStatus;
        data: any;
    }>;
    fetchNotificationForChart(payload: AuthPayload & Request, param: ChartDto, queryDto: QueryDto): Promise<GenericDataPayload<any>>;
    private fetchScheduledNotificationsForBarChart;
    private fetchScheduledNotificationsForPieChart;
    fetchAllInstantNotifications(payload: AuthPayload, filterDto: FilterNotificationsDto): Promise<PagePayload<Notification>>;
    fetchAllScheduledNotifications(payload: AuthPayload, filterDto: FilterScheduledDto): Promise<PagePayload<Notification>>;
    deleteNotification(payload: AuthPayload & Request, param: IdDto): Promise<GenericPayload>;
    markNotificationAsRead(notificationId: string): Promise<{
        statusCode: number;
        message: string;
    }>;
    markAllNotificationsAsRead(req: AuthPayload & Request): Promise<{
        statusCode: number;
        message: string;
    }>;
}
