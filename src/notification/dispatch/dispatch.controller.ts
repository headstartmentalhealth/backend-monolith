import { Controller, Get, Post, Body, Param, Patch, Req } from '@nestjs/common';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import { NotificationDispatchService } from './dispatch.service';
import {
  CreateNotificationDispatchConsoleDto,
  CreateNotificationDispatchDto,
  ScheduleNotificationConsoleDto,
  ScheduleNotificationDto,
} from './dispatch.dto';
import { AuthPayload } from '@/generic/generic.payload';

@Controller('v1/notification-dispatch')
export class NotificationDispatchController {
  constructor(
    private readonly notificationDispatchService: NotificationDispatchService,
  ) {}

  /**
   * Create instant notification dispatch
   * @param request
   * @param createNotificationDispatchDto
   * @returns
   */
  @Post('create')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  async createNotification(
    @Req() request: AuthPayload & Request,
    @Body() createNotificationDispatchDto: CreateNotificationDispatchDto,
  ) {
    return this.notificationDispatchService.dispatchNotification(
      request,
      createNotificationDispatchDto,
    );
  }

  /**
   * Create instant notification dispatch (owner)
   * @param request
   * @param createNotificationDispatchDto
   * @returns
   */
  @Post('trigger')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async createConsoleNotification(
    @Req() request: AuthPayload & Request,
    @Body()
    createNotificationDispatchConsoleDto: CreateNotificationDispatchConsoleDto,
  ) {
    return this.notificationDispatchService.consoleDispatchNotification(
      request,
      createNotificationDispatchConsoleDto,
    );
  }

  /**
   * Schedule notification
   * @param request
   * @param scheduleNotificationDto
   * @returns
   */
  @Post('schedule')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  async scheduleNotification(
    @Req() request: AuthPayload & Request,
    @Body() scheduleNotificationDto: ScheduleNotificationDto,
  ) {
    return this.notificationDispatchService.scheduleNotifications(
      request,
      scheduleNotificationDto,
    );
  }

  /**
   * Schedule notification (owner)
   * @param request
   * @param scheduleNotificationDto
   * @returns
   */
  @Post('initiate-schedule')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async ownerScheduleNotification(
    @Req() request: AuthPayload & Request,
    @Body() scheduleNotificationConsoleDto: ScheduleNotificationConsoleDto,
  ) {
    return this.notificationDispatchService.consoleScheduleNotifications(
      request,
      scheduleNotificationConsoleDto,
    );
  }

  @Get(':businessId')
  async getNotifications(@Param('businessId') businessId: string) {
    return this.notificationDispatchService.getNotifications(businessId);
  }

  @Patch(':notificationId/read')
  async markAsRead(@Param('notificationId') notificationId: string) {
    return this.notificationDispatchService.markAsRead(notificationId);
  }

  @Get(':businessId/unread')
  async filterUnread(@Param('businessId') businessId: string) {
    return this.notificationDispatchService.filterUnread(businessId);
  }
}
