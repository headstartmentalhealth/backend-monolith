import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Action, Notification, Prisma } from '@prisma/client';
import {
  BusinessDto,
  ChartDto,
  ChartType,
  IdDto,
  QueryDto,
  TZ,
} from '@/generic/generic.dto';
import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  PagePayload,
  PaginationFiltersPayload,
} from '@/generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import {
  getIpAddress,
  getUserAgent,
  pageFilter,
} from '@/generic/generic.utils';
import { PrismaBaseRepository } from '@/prisma/prisma.base.repository';
import { FilterNotificationsDto, FilterScheduledDto } from './track.dto';
import { LogService } from '@/log/log.service';

@Injectable()
export class NotificationTrackService {
  private readonly model = 'Notification';

  private readonly select: Prisma.NotificationSelect = {
    id: true,
    title: true,
    message: true,
    type: true,
    read: true,
    icon_url: true,
    status: true,
    is_scheduled: true,
    business_id: true,
    created_at: true,
    business: {
      select: {
        id: true,
        business_name: true,
        user: { select: { id: true, name: true } },
      }, // Fetch only required user details
    },
  };
  private readonly notificationRepository: PrismaBaseRepository<
    Notification,
    Prisma.NotificationCreateInput,
    Prisma.NotificationUpdateInput,
    Prisma.NotificationWhereUniqueInput,
    Prisma.NotificationWhereInput | Prisma.NotificationFindFirstArgs,
    Prisma.NotificationUpsertArgs
  >;

  constructor(
    private readonly prisma: PrismaService,
    private readonly genericService: GenericService,
    private readonly logService: LogService,
  ) {
    this.notificationRepository = new PrismaBaseRepository<
      Notification,
      Prisma.NotificationCreateInput,
      Prisma.NotificationUpdateInput,
      Prisma.NotificationWhereUniqueInput,
      Prisma.NotificationWhereInput | Prisma.NotificationFindFirstArgs,
      Prisma.NotificationUpsertArgs
    >('notification', prisma);
  }

  /**
   * Fetch instant notifications
   * @param payload
   * @param param
   * @param filterDto
   * @returns
   */
  async fetchInstantNotifications(
    payload: AuthPayload,
    param: BusinessDto,
    filterDto: FilterNotificationsDto,
  ): Promise<PagePayload<Notification>> {
    const auth = payload.user;
    const { business_id } = param;

    // Check if user is part of the company's administrators
    await this.genericService.isUserLinkedToBusiness(this.prisma, {
      user_id: auth.sub,
      business_id,
    });

    // Invoke pagination filters
    const pagination_filters = pageFilter(filterDto);

    // Filters
    let filters: Prisma.NotificationWhereInput & TZ = {
      is_scheduled: false, // Non-scheduled notifications
      status: filterDto.status as boolean,
      business_id,
      ...(filterDto.q && {
        OR: [
          {
            id: { contains: filterDto.q, mode: 'insensitive' },
          },
          {
            title: { contains: filterDto.q, mode: 'insensitive' },
          },
        ],
      }),
      ...pagination_filters.filters,
      ...(filterDto.type && { type: filterDto.type }),
      tz: payload.timezone,
    };

    // Assign something else to same variable
    let select: Prisma.NotificationSelect = {
      ...this.select,
      message: true,
      recipients: true,
      schedule_info: {
        include: {
          recipients: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
      owner: { select: { id: true, name: true, email: true } },
    };

    const unread_filters = {
      ...filters,
      read: false,
    };

    const [notifications, total, unread] = await Promise.all([
      this.notificationRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.notificationRepository.count(filters),
      this.notificationRepository.count(unread_filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: notifications,
      count: total,
      unread_count: unread,
    };
  }

  /**
   * Fetch scheduled notifications
   * @param payload
   * @param param
   * @param filterDto
   * @returns
   */
  async fetchScheduledNotifications(
    payload: AuthPayload,
    param: BusinessDto,
    filterDto: FilterScheduledDto,
  ): Promise<PagePayload<Notification>> {
    const auth = payload.user;
    const { business_id } = param;

    // Check if user is part of the company's administrators
    await this.genericService.isUserLinkedToBusiness(this.prisma, {
      user_id: auth.sub,
      business_id,
    });

    // Invoke pagination filters
    const pagination_filters = pageFilter(filterDto);

    // Filters
    let filters: Prisma.NotificationWhereInput & TZ = {
      is_scheduled: true, // Scheduled notifications
      status: filterDto.status as boolean,
      business_id,
      ...pagination_filters.filters,
      ...(filterDto.type && { type: filterDto.type }),
      ...(filterDto.schedule_status && {
        schedule_info: { status: filterDto.schedule_status },
      }),
      tz: payload.timezone,
    };

    // Assign something else to same variable
    let select: Prisma.NotificationSelect = {
      ...this.select,
      recipients: true,
      schedule_info: {
        include: {
          recipients: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    };

    const [notifications, total] = await Promise.all([
      this.notificationRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.notificationRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: notifications,
      count: total,
    };
  }

  /**
   * Fetch single notification for instant or scheduled
   * @param payload
   * @param param
   * @returns
   */
  async fetchSingleNotification(payload: AuthPayload & Request, param: IdDto) {
    const { id } = param;
    const auth = payload.user;

    const select: Prisma.NotificationSelect = {
      ...this.select,
      message: true,
      recipients: true,
      schedule_info: {
        include: {
          recipients: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    };

    // Check if user is part of the company's administrators
    await this.genericService.isUserLinkedToBusiness(this.prisma, {
      user_id: auth.sub,
      business_id: payload['Business-Id'],
    });

    const filters: Prisma.NotificationWhereUniqueInput = {
      id,
    };

    const notificationDetails = await this.notificationRepository.findOne(
      filters,
      undefined,
      select,
    );

    return {
      statusCode: HttpStatus.OK,
      data: notificationDetails,
    };
  }

  /**
   * Fetch notification by chart
   * @param payload
   * @param param
   * @returns
   */
  async fetchNotificationForChart(
    payload: AuthPayload & Request,
    param: ChartDto,
    queryDto: QueryDto,
  ): Promise<GenericDataPayload<any>> {
    const auth = payload.user;
    const { chart_type } = param;

    // Check if user is part of the company's administrators
    await this.genericService.isUserLinkedToBusiness(this.prisma, {
      user_id: auth.sub,
      business_id: payload['Business-Id'],
    });

    // Invoke pagination filters
    const pagination_filters = pageFilter(queryDto);

    let scheduled_notifications = {};
    // Retrieve scheduled notification based on chart type
    switch (chart_type) {
      case ChartType.BAR_CHART:
        scheduled_notifications =
          await this.fetchScheduledNotificationsForBarChart(
            payload['Business-Id'],
            pagination_filters,
          );
        break;
      case ChartType.PIE_CHART:
        scheduled_notifications =
          await this.fetchScheduledNotificationsForPieChart(
            payload['Business-Id'],
            pagination_filters,
          );
        break;
      default:
        break;
    }

    return {
      statusCode: HttpStatus.OK,
      data: scheduled_notifications,
    };
  }

  /**
   * Fetch scheduled notifications for bar chart
   * @param business_id
   * @returns
   */
  private async fetchScheduledNotificationsForBarChart(
    business_id: string,
    pagination_filters: PaginationFiltersPayload,
  ) {
    const data = await this.prisma.scheduledNotification.groupBy({
      by: ['status'],
      _count: { id: true },
      where: {
        ...pagination_filters.filters,
        notification: {
          business_id: business_id,
        },
      },
    });

    return data.map((item) => ({ status: item.status, count: item._count.id }));
  }

  /**
   * Fetch scheduled notifications for pie chart
   * @param business_id
   * @returns
   */
  private async fetchScheduledNotificationsForPieChart(
    business_id: string,
    pagination_filters: PaginationFiltersPayload,
  ) {
    const data = await this.prisma.scheduledNotification.groupBy({
      by: ['status'],
      _count: { id: true },
      where: {
        ...pagination_filters.filters,
        notification: {
          business_id: business_id,
        },
      },
    });
    return data.map((item) => ({ label: item.status, value: item._count.id }));
  }

  /**
   * Fetch all instant notifications
   * @param payload
   * @param filterDto
   * @returns
   */
  async fetchAllInstantNotifications(
    payload: AuthPayload,
    filterDto: FilterNotificationsDto,
  ): Promise<PagePayload<Notification>> {
    const auth = payload.user;

    // Check if user is part of the owner's administrators (TODO)

    // Invoke pagination filters
    const pagination_filters = pageFilter(filterDto);

    // Filters
    let filters: Prisma.NotificationWhereInput & TZ = {
      is_scheduled: false, // Non-scheduled notifications
      status: filterDto.status as boolean,
      ...(filterDto.q && {
        OR: [
          {
            title: { contains: filterDto.q, mode: 'insensitive' },
          },
          { id: { contains: filterDto.q, mode: 'insensitive' } },
          {
            business_id: {
              contains: filterDto.q,
              mode: 'insensitive',
            },
          },
        ],
      }),
      ...pagination_filters.filters,
      ...(filterDto.type && { type: filterDto.type }),
      tz: payload.timezone,
    };

    // Assign something else to same variable
    let select: Prisma.NotificationSelect = {
      ...this.select,
      recipients: true,
      schedule_info: {
        include: {
          recipients: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: { select: { role_id: true } },
          profile: true,
        },
      },
    };

    const unread_filters = {
      ...filters,
      read: false,
    };

    const [notifications, total, unread] = await Promise.all([
      this.notificationRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.notificationRepository.count(filters),
      this.notificationRepository.count(unread_filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: notifications,
      count: total,
      unread_count: unread,
    };
  }

  /**
   * Fetch all scheduled notifications (owner)
   * @param payload
   * @param filterDto
   * @returns
   */
  async fetchAllScheduledNotifications(
    payload: AuthPayload,
    filterDto: FilterScheduledDto,
  ): Promise<PagePayload<Notification>> {
    const auth = payload.user;

    // Check if user is part of the owner's administrators (TODO)

    // Invoke pagination filters
    const pagination_filters = pageFilter(filterDto);

    // Filters
    let filters: Prisma.NotificationWhereInput & TZ = {
      is_scheduled: true, // Scheduled notifications
      status: filterDto.status as boolean,
      ...(filterDto.q && {
        OR: [
          {
            title: { contains: filterDto.q, mode: 'insensitive' },
          },
          { id: { contains: filterDto.q, mode: 'insensitive' } },
          {
            business_id: {
              contains: filterDto.q,
              mode: 'insensitive',
            },
          },
        ],
      }),
      ...pagination_filters.filters,
      ...(filterDto.type && { type: filterDto.type }),
      ...(filterDto.schedule_status && {
        schedule_info: { status: filterDto.schedule_status },
      }),
      tz: payload.timezone,
    };

    // Assign something else to same variable
    let select: Prisma.NotificationSelect = {
      ...this.select,
      schedule_info: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: { select: { role_id: true } },
          profile: true,
        },
      },
    };

    const [notifications, total] = await Promise.all([
      this.notificationRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.notificationRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: notifications,
      count: total,
    };
  }

  /**
   * Delete a notification by ID
   * @param payload
   * @param param
   * @returns
   */
  async deleteNotification(
    payload: AuthPayload & Request,
    param: IdDto,
  ): Promise<GenericPayload> {
    const auth = payload.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      // Step 1: Verify user is linked to the business
      await this.genericService.isUserLinkedToBusiness(this.prisma, {
        user_id: auth.sub,
        business_id: payload['Business-Id'],
      });

      // Step 2: Fetch the notification to get the business_id for permission check
      const notification = await prisma.notification.findUnique({
        where: { id },
        select: { id: true, business_id: true },
      });

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      // Step 3: Delete the notification
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          deleted_at: new Date(),
        },
      });

      // Step 4: Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.CUSTOM_EMAIL_NOTIFICATION,
          entity: this.model,
          entity_id: notification.id,
          metadata: `User with ID ${auth.sub} from Business Id ${notification.business_id} just deleted a product payment.`,
          ip_address: getIpAddress(payload),
          user_agent: getUserAgent(payload),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Notification deleted successfully',
      };
    });
  }

  /**
   * Mark a notification as read
   * @param notificationId
   */
  async markNotificationAsRead(
    notificationId: string,
  ): Promise<{ statusCode: number; message: string }> {
    await this.notificationRepository.update(
      { id: notificationId },
      { read: true },
    );
    return {
      statusCode: 200,
      message: 'Notification marked as read.',
    };
  }

  /**
   * Mark all notifications as read
   * @param notificationId
   */
  async markAllNotificationsAsRead(
    req: AuthPayload & Request,
  ): Promise<{ statusCode: number; message: string }> {
    await this.notificationRepository.updateMany(
      { business_id: req['Business-Id'] },
      { read: true },
    );
    return {
      statusCode: 200,
      message: 'All notifications marked as read.',
    };
  }
}
