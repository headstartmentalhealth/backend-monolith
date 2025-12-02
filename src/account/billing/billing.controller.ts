import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  NotFoundException,
  Req,
  Query,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import {
  CreateBillingInformationDto,
  UpdateBillingInformationDto,
} from './billing.dto';
import { Roles } from '../auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import {
  AuthPayload,
  GenericPayload,
  PagePayload,
} from '@/generic/generic.payload';
import { BillingInformation } from '@prisma/client';
import { QueryDto } from '@/generic/generic.dto';

@Controller('v1/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * Create billing information
   * @param request
   * @param createBillingInformationDto
   * @returns
   */
  @Post('create')
  @Roles(Role.USER)
  create(
    @Req() request: AuthPayload & Request,
    @Body() createBillingInformationDto: CreateBillingInformationDto,
  ): Promise<GenericPayload> {
    return this.billingService.create(request, createBillingInformationDto);
  }

  /**
   * Fetch billing information (with pagination filters)
   * @param request
   * @param param
   * @param queryDto
   * @returns
   */
  @Get()
  @Roles(Role.USER)
  fetch(
    @Req() request: AuthPayload & Request,
    @Query() queryDto: QueryDto,
  ): Promise<PagePayload<BillingInformation>> {
    return this.billingService.fetch(request, queryDto);
  }

  /**
   * Update billing information
   * @param request
   * @param param
   * @param updateBillingInformationDto
   * @returns
   */
  @Patch(':id')
  @Roles(Role.USER)
  update(
    @Req() request: AuthPayload & Request,
    @Param() param: { id: string },
    @Body() updateBillingInformationDto: UpdateBillingInformationDto,
  ): Promise<GenericPayload> {
    return this.billingService.update(
      request,
      param,
      updateBillingInformationDto,
    );
  }

  /**
   * Delete billing information
   * @param request
   * @param param
   * @returns
   */
  @Delete(':id')
  @Roles(Role.USER)
  delete(
    @Req() request: AuthPayload & Request,
    @Param() param: { id: string },
  ): Promise<GenericPayload> {
    return this.billingService.delete(request, param);
  }
}
