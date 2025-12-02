import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import {
  AuthPayload,
  GenericPayload,
  GenericPayloadAlias,
  PagePayload,
  Timezone,
} from '@/generic/generic.payload';
import {
  CreatePaymentDto,
  PaymentIdDto,
  QueryPaymentsDto,
  VerifyPaymentDto,
} from './payment.dto';
import { Public } from '@/account/auth/decorators/auth.decorator';
import { Payment, PaymentStatus } from '@prisma/client';
import { Role } from '@/generic/generic.data';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { BusinessGuard } from '@/generic/guards/business.guard';
import { IdDto, UserDto } from '@/generic/generic.dto';
import { GenericDataPayload } from '@/generic/generic.payload';

@Controller('v1/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Create payment
   * @param request
   * @param createPaymentDto
   * @returns
   */
  @Post('create')
  @Public()
  async createPayment(
    @Req() request: Timezone & Request,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentService.createPayment(request, createPaymentDto);
  }

  /**
   * Verify payment
   * @param request
   * @param verifyPaymentDto
   * @returns
   */
  @Post('verify/:payment_id')
  @Public()
  async verifyPayment(
    @Req() request: Timezone & Request,
    @Param() verifyPaymentDto: VerifyPaymentDto,
  ): Promise<GenericPayload> {
    return this.paymentService.verifyPayment(request, verifyPaymentDto);
  }

  /**
   * Cancel payment
   * @param request
   * @param verifyPaymentDto
   * @returns
   */
  @Post('cancel/:payment_id')
  @Public()
  async cancelPayment(
    @Req() request: Timezone & Request,
    @Param() paymentIdDto: PaymentIdDto,
  ): Promise<
    GenericPayloadAlias<{ payment_id: string; status: PaymentStatus }>
  > {
    return this.paymentService.cancelPayment(request, paymentIdDto.payment_id);
  }

  /**
   * Fetch payments for admin
   * @param request
   * @param verifyPaymentDto
   * @returns
   */
  @Get('fetch-all')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async fetchPayments(
    @Req() request: AuthPayload & Request,
    @Query() filterPaymentDto: QueryPaymentsDto,
  ): Promise<PagePayload<Payment>> {
    return this.paymentService.fetchPayments(request, filterPaymentDto);
  }

  /**
   * Fetch payments for business
   * @param request
   * @param verifyPaymentDto
   * @returns
   */
  @Get('fetch')
  @UseGuards(BusinessGuard)
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  async fetch(
    @Req() request: AuthPayload & Request,
    @Query() filterPaymentDto: QueryPaymentsDto,
  ): Promise<PagePayload<Payment>> {
    return this.paymentService.fetchPaymentsForBusiness(
      request,
      filterPaymentDto,
    );
  }

  /**
   * Fetch single payment details for business
   * @param request
   * @param verifyPaymentDto
   * @returns
   */
  @Get('fetch/:id')
  @UseGuards(BusinessGuard)
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  async fetchPayment(
    @Req() request: AuthPayload & Request,
    @Param() idDto: IdDto,
  ): Promise<PagePayload<Payment>> {
    return this.paymentService.fetchPaymentByIDForBusiness(request, idDto);
  }

  /**
   * Fetch payments for admin
   * @param request
   * @param verifyPaymentDto
   * @returns
   */
  @Get('fetch-distinct')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async fetchDistinctCustomerPayments(
    @Req() request: AuthPayload & Request,
    @Query() filterPaymentDto: QueryPaymentsDto,
  ): Promise<PagePayload<Payment>> {
    return this.paymentService.fetchDistinctCustomerPayments(
      request,
      filterPaymentDto,
    );
  }

  /**
   * Fetch payments for client (user)
   * @param request
   * @param filterPaymentDto
   * @returns
   */
  @Get('client/fetch')
  async fetchClientPayments(
    @Req() request: AuthPayload & Request,
    @Query() filterPaymentDto: QueryPaymentsDto,
  ): Promise<PagePayload<Payment>> {
    return this.paymentService.fetchClientPayments(request, filterPaymentDto);
  }

  /**
   * Fetch single payment details for client
   * @param request
   * @param idDto
   * @returns
   */
  @Get('client/fetch/:id')
  async fetchClientPayment(
    @Req() request: AuthPayload & Request,
    @Param() idDto: IdDto,
  ): Promise<GenericDataPayload<Payment>> {
    return this.paymentService.fetchClientPaymentByID(request, idDto);
  }

  /**
   * Fetch client payment orders summary
   * @param request
   * @returns
   */
  @Get('client/summary')
  async fetchClientPaymentSummary(
    @Req() request: AuthPayload & Request,
  ): Promise<GenericDataPayload<any>> {
    return this.paymentService.fetchClientPaymentSummary(request);
  }
}
