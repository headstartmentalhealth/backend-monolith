import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TicketCrudService } from './crud.service';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  GenericPayloadAlias,
  PagePayload,
} from '@/generic/generic.payload';
import {
  CreateTicketDto,
  FilterProductDto,
  TicketTierIdDto,
  UpdateTicketDto,
} from './crud.dto';
import { IdDto } from '@/generic/generic.dto';
import { Product } from '@prisma/client';
import { BusinessGuard } from '@/generic/guards/business.guard';
import { DeleteTicket, DeleteTicketTier } from './crud.payload';

@Controller('v1/product-ticket-crud')
@UseGuards(BusinessGuard)
export class TicketCrudController {
  constructor(private readonly ticketCrudService: TicketCrudService) {}

  /**
   * Create ticket product
   * @param request
   * @param createTicketDto
   * @returns
   */
  @Post('create')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  create(
    @Req() request: AuthPayload & Request,
    @Body() createTicketDto: CreateTicketDto,
  ): Promise<GenericPayloadAlias<Product>> {
    return this.ticketCrudService.create(request, createTicketDto);
  }

  /**
   * Fetch tickets
   * @param request
   * @param queryDto
   * @returns
   */
  @Get()
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  fetch(
    @Req() request: AuthPayload & Request,
    @Query() filterTicketDto: FilterProductDto,
  ): Promise<PagePayload<Product>> {
    return this.ticketCrudService.fetch(request, filterTicketDto);
  }

  /**
   * Fetch single ticket product
   * @param request
   * @param param
   * @returns
   */
  @Get(':id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  fetchSingle(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
  ): Promise<GenericDataPayload<Product>> {
    return this.ticketCrudService.fetchSingle(request, param);
  }

  /**
   * Update a ticket product
   * @param request
   * @param param
   * @param updateCourseDto
   * @returns
   */
  @Patch(':id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  update(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
    @Body() updateTicketDto: UpdateTicketDto,
  ): Promise<GenericPayloadAlias<Product>> {
    return this.ticketCrudService.update(request, param, updateTicketDto);
  }

  /**
   * Delete a ticket product
   * @param request
   * @param param
   * @returns
   */
  @Delete(':id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  delete(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
  ): Promise<GenericPayloadAlias<DeleteTicket>> {
    return this.ticketCrudService.delete(request, param);
  }

  /**
   * Delete a ticket tier
   * @param request
   * @param param
   * @returns
   */
  @Delete('remove-tier/:ticket_tier_id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  removeTier(
    @Req() request: AuthPayload & Request,
    @Param() param: TicketTierIdDto,
  ): Promise<GenericPayloadAlias<DeleteTicketTier>> {
    return this.ticketCrudService.removeTicketTier(request, param);
  }
}
