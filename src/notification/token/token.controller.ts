import {
  Body,
  Controller,
  Post,
  HttpStatus,
  UseGuards,
  Get,
  Delete,
  Param,
  ParseUUIDPipe,
  Req,
  Patch,
} from '@nestjs/common';

import { NotificationTokenService } from './token.service';
import { CreateNotificationTokenDto } from './dto/create-notification-token.dto';
import { Roles } from '@/account/auth/decorators/role.decorator';
import {
  AuthPayload,
  GenericPayload,
  GenericPayloadAlias,
} from '@/generic/generic.payload';
import { NotificationToken } from '@prisma/client';
import { IdDto } from '@/generic/generic.dto';

@Controller('v1/notification-token')
export class NotificationTokenController {
  constructor(
    private readonly notificationTokenService: NotificationTokenService,
  ) {}

  @Post()
  async addPushNotification(
    @Req() request: AuthPayload & Request,
    @Body() createNotificationTokenDto: CreateNotificationTokenDto,
  ): Promise<GenericPayload> {
    return this.notificationTokenService.addPushNotification(
      request,
      createNotificationTokenDto,
    );
  }

  @Get()
  async getUserTokens(
    @Req() request: AuthPayload & Request,
  ): Promise<GenericPayloadAlias<NotificationToken[]>> {
    return this.notificationTokenService.findManyByUser(request);
  }

  @Patch(':id')
  async deactivateToken(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
  ): Promise<GenericPayload> {
    return this.notificationTokenService.deactivateToken(request, param);
  }
}
