import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationTrackService } from './track.service';
import {
  FetchInstantNotificationsDto,
  FetchScheduledNotificationsDto,
  FilterNotificationsDto,
  FilterScheduledDto,
} from './track.dto';
import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  PagePayload,
} from '@/generic/generic.payload';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import {
  BusinessDto,
  ChartDto,
  IdDto,
  IdDtoAlias,
  QueryDto,
} from '@/generic/generic.dto';
import { Notification } from '@prisma/client';
import { BusinessGuard } from '@/generic/guards/business.guard';

@Controller('v1/notification-track')
export class NotificationTrackController {
  constructor(
    private readonly notificationTrackService: NotificationTrackService,
  ) {}

  /**
   * Retrieve instant notifications for business admins
   * @param request
   * @param queryDto
   * @param param
   * @returns
   */
  @Get('instant/:business_id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  async getInstantNotifications(
    @Req() request: AuthPayload & Request,
    @Query() queryDto: FilterNotificationsDto,
    @Param() param: BusinessDto,
  ): Promise<PagePayload<Notification>> {
    return await this.notificationTrackService.fetchInstantNotifications(
      request,
      param,
      queryDto,
    );
  }

  /**
   * Retrieve scheduled notifications for business admins
   * @param request
   * @param queryDto
   * @param param
   * @returns
   */
  @Get('scheduled/:business_id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  async getScheduledNotifications(
    @Req() request: AuthPayload & Request,
    @Query() queryDto: FilterScheduledDto,
    @Param() param: BusinessDto,
  ) {
    return await this.notificationTrackService.fetchScheduledNotifications(
      request,
      param,
      queryDto,
    );
  }

  /**
   * Retrieve single notification
   * @param request
   * @param param
   * @returns
   */
  @UseGuards(BusinessGuard)
  @Get('single/:id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  async getSingleNotification(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDtoAlias,
  ) {
    return await this.notificationTrackService.fetchSingleNotification(
      request,
      param,
    );
  }

  @Get('statistics/:chart_type')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  async getNotificationsForChart(
    @Req() request: AuthPayload & Request,
    @Param() param: ChartDto,
    @Query() queryDto: QueryDto,
  ): Promise<GenericDataPayload<any>> {
    return await this.notificationTrackService.fetchNotificationForChart(
      request,
      param,
      queryDto,
    );
  }

  /**
   * Retrieve all instant notifications
   * @param request
   * @param queryDto
   * @param param
   * @returns
   */
  @Get('fetch-instant')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async fetchAllInstantNotifications(
    @Req() request: AuthPayload & Request,
    @Query() queryDto: FilterNotificationsDto,
  ): Promise<PagePayload<Notification>> {
    return await this.notificationTrackService.fetchAllInstantNotifications(
      request,
      queryDto,
    );
  }

  /**
   * Retrieve all scheduled notifications
   * @param request
   * @param queryDto
   * @returns
   */
  @Get('fetch-scheduled')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async fetchAllScheduledNotifications(
    @Req() request: AuthPayload & Request,
    @Query() queryDto: FilterScheduledDto,
  ): Promise<PagePayload<Notification>> {
    return await this.notificationTrackService.fetchAllScheduledNotifications(
      request,
      queryDto,
    );
  }

  /**
   * Mark a notification as read
   * @param id
   */
  @Patch('mark-all-read')
  async markAllNotificationsAsRead(@Req() req: AuthPayload & Request) {
    return await this.notificationTrackService.markAllNotificationsAsRead(req);
  }

  /**
   * Retrieve all scheduled notifications
   * @param request
   * @param queryDto
   * @returns
   */
  @UseGuards(BusinessGuard)
  @Delete(':id')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.BUSINESS_SUPER_ADMIN)
  async deleteNotification(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
  ): Promise<GenericPayload> {
    return await this.notificationTrackService.deleteNotification(
      request,
      param,
    );
  }

  /**
   * Mark a notification as read
   * @param id
   */
  @Patch('mark-read/:id')
  async markNotificationsAsRead(@Param('id') id: string) {
    return await this.notificationTrackService.markNotificationAsRead(id);
  }
}
