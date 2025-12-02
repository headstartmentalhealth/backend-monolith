import {
  AuthPayload,
  GenericPayload,
  GenericPayloadAlias,
  PagePayload,
} from '../../generic/generic.payload';
import { GenericService } from '../../generic/generic.service';
import { LogService } from '../../log/log.service';
import { PrismaBaseRepository } from '../../prisma/prisma.base.repository';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Action, Coupon, CouponType, Prisma } from '@prisma/client';
import {
  CreateCouponDto,
  FilterCouponsDto,
  UpdateCouponDto,
} from './management.dto';
import {
  deletionRename,
  formatMoney,
  getBooleanOption,
  getIpAddress,
  getUserAgent,
  pageFilter,
} from '../../generic/generic.utils';
import { IdDto, QueryDto, TZ } from '../../generic/generic.dto';
import { CouponSelection, RelatedModels } from './management.utils';
import * as moment from 'moment';

@Injectable()
export class CouponManagementService {
  private readonly model = 'Coupon';

  private readonly couponRepository: PrismaBaseRepository<
    Coupon,
    Prisma.CouponCreateInput,
    Prisma.CouponUpdateInput,
    Prisma.CouponWhereUniqueInput,
    Prisma.CouponWhereInput | Prisma.CouponFindFirstArgs,
    Prisma.CouponUpsertArgs
  >;
  private readonly select: Prisma.CouponSelect = {
    id: true,
    code: true,
    type: true,
    value: true,
    currency: true,
    start_date: true,
    end_date: true,
    usage_limit: true,
    user_limit: true,
    min_purchase: true,
    is_active: true,
    created_at: true,
    creator: {
      select: {
        id: true,
        name: true,
        role: { select: { name: true, role_id: true } },
      }, // Fetch only required user details
    },
    business: {
      select: {
        id: true,
        business_name: true,
        user_id: true,
      },
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly logService: LogService,
    private readonly genericService: GenericService,
  ) {
    this.couponRepository = new PrismaBaseRepository<
      Coupon,
      Prisma.CouponCreateInput,
      Prisma.CouponUpdateInput,
      Prisma.CouponWhereUniqueInput,
      Prisma.CouponWhereInput | Prisma.CouponFindFirstArgs,
      Prisma.CouponUpsertArgs
    >('coupon', prisma);
  }

  /**
   * Create a coupon
   * @param request
   * @param dto
   * @returns
   */
  async create(
    request: AuthPayload & Request,
    dto: CreateCouponDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { code, business_id, start_date, end_date } = dto;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(
        prisma,
        {
          user_id: auth.sub,
          business_id,
        },
        true,
      );

      // 2. Retrieve existing coupon
      const existing_coupon = await prisma.coupon.findUnique({
        where: {
          code_business_id: {
            code,
            business_id,
          },
        },
      });

      // 4. Check if coupon has already been created
      if (existing_coupon) {
        throw new ConflictException('Coupon exists.');
      }

      // 5. Create coupon
      const coupon = await prisma.coupon.create({
        data: {
          ...dto,
          start_date: moment(start_date).toDate(),
          end_date: moment(end_date).toDate(),
          creator_id: auth.sub,
        },
      });

      // 6. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_COUPON,
          entity: this.model,
          entity_id: coupon.id,
          metadata: `User with ID ${auth.sub} just created a coupon ID ${coupon.id} for Business ID of ${coupon.business_id}`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Coupon created successfully.',
      };
    });
  }

  /**
   * Get all business' coupons
   * @param payload
   * @param param
   * @param queryDto
   */
  async fetch(
    payload: AuthPayload,
    param: { business_id: string },
    filterDto: FilterCouponsDto & QueryDto,
  ): Promise<PagePayload<Coupon>> {
    const auth = payload.user;
    const { business_id } = param;
    const { is_active, q } = filterDto;

    // Check if user is part of the company's administrators
    await this.genericService.isUserLinkedToBusiness(
      this.prisma,
      {
        user_id: auth.sub,
        business_id: business_id,
      },
      true,
    );

    // Invoke pagination filters
    const pagination_filters = pageFilter(filterDto);

    // Filters
    const filters: Prisma.CouponWhereInput & TZ = {
      ...(q && {
        OR: [
          {
            code: { contains: q, mode: 'insensitive' },
          },
          isNaN(Number(q)) ? {} : { value: { equals: Number(q) } },
        ],
      }),
      ...(is_active && { is_active: getBooleanOption(is_active) }),
      ...(business_id && { business_id }),
      ...pagination_filters.filters,
      tz: payload.timezone,
    };

    // Assign something else to same variable
    const select = this.select;

    const [coupons, total] = await Promise.all([
      this.couponRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.couponRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: coupons,
      count: total,
    };
  }

  /**
   * Get a single coupon by ID - (invoked in - UsageService)
   * @param id
   * @returns
   */
  async findOne(
    id: string,
    business_id?: string,
  ): Promise<CouponSelection & RelatedModels> {
    const select = this.select;

    const filters: Prisma.CouponWhereUniqueInput = {
      ...(business_id && { business_id }),
      id,
    };

    const coupon: CouponSelection & RelatedModels =
      await this.couponRepository.findOne(filters, undefined, select);

    if (!coupon) {
      throw new NotFoundException(`Coupon not found for this business`);
    }

    return coupon;
  }

  /**
   * Fetch single coupon details
   * @param request
   * @param param
   * @returns
   */
  async fetchSingle(
    request: AuthPayload,
    param: IdDto,
  ): Promise<GenericPayloadAlias<CouponSelection & RelatedModels>> {
    const { id } = param;

    const coupon = await this.findOne(id, request['Business-Id']);

    return {
      statusCode: HttpStatus.OK,
      message: 'Coupon details fetched successfully.',
      data: coupon,
    };
  }

  /**
   * Update a coupon
   * @param request
   * @param param
   * @param dto
   */
  async update(
    request: AuthPayload & Request,
    param: { id: string },
    dto: UpdateCouponDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { id } = param;
    const { start_date, end_date } = dto;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check for the existing of the coupon
      const existing_coupon = await this.findOne(id);

      // Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: existing_coupon.business.id,
      });

      // 2. Update coupon
      await prisma.coupon.update({
        where: { id: existing_coupon.id },
        data: {
          ...dto,
          ...(start_date && { start_date: moment(start_date).toDate() }),
          ...(end_date && { end_date: moment(end_date).toDate() }),
        },
      });

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_COUPON,
          entity: this.model,
          entity_id: existing_coupon.id,
          metadata: `User with ID ${auth.sub} just updated a coupon ID ${existing_coupon.id} for the business ID ${existing_coupon.business.id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Coupon updated successfully.',
      };
    });
  }

  /**
   * Delete a coupon
   * @param request
   * @param param
   * @returns
   */
  async delete(
    request: AuthPayload & Request,
    param: { id: string },
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check for the existence of the subscription plan role
      const existing_coupon = await this.findOne(id);

      // Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: existing_coupon.business.id,
      });

      // Validate that there are no related models (Presently, nothing depends on this model)

      // 2. Update coupon
      await prisma.coupon.update({
        where: { id: existing_coupon.id },
        data: {
          code: deletionRename(existing_coupon.code),
          deleted_at: new Date(),
        },
      });

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_COUPON,
          entity: this.model,
          entity_id: existing_coupon.id,
          metadata: `User with ID ${auth.sub} just deleted a coupon ID ${existing_coupon.id} for the business ID ${existing_coupon.business.id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Coupon deleted successfully.',
      };
    });
  }

  /**
   * Get all coupons
   * @param payload
   * @param queryDto
   */
  async fetchAll(
    payload: AuthPayload,
    filterDto: FilterCouponsDto & QueryDto,
  ): Promise<PagePayload<Coupon>> {
    const auth = payload.user;
    const { is_active, business_id } = filterDto;

    // Check if user is part of the owner's administrators - TODO

    // Invoke pagination filters
    const pagination_filters = pageFilter(filterDto);

    // Filters
    const filters: Prisma.CouponWhereInput & TZ = {
      ...(filterDto.q && {
        OR: [
          {
            code: { contains: filterDto.q, mode: 'insensitive' },
          },
        ],
      }),
      ...(is_active && { is_active: getBooleanOption(is_active) }),
      ...(business_id && { business_id }),
      ...pagination_filters.filters,
      tz: payload.timezone,
    };

    // Assign something else to same variable
    const select = this.select;

    const [coupons, total] = await Promise.all([
      this.couponRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.couponRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: coupons,
      count: total,
    };
  }

  /**
   * Validate and apply a coupon to a given amount, including user-specific limit enforcement and usage logging
   * @param user_id - The user applying the coupon
   * @param code - The coupon code
   * @param amount - The total purchase amount
   */
  async validateAndApplyCoupon(
    email: string,
    code: string,
    amount: number,
  ): Promise<
    GenericPayloadAlias<{ discountedAmount: number; discount: number }>
  > {
    const now = new Date();

    // Get  user details
    const user_details = await this.prisma.user.findFirst({ where: { email } });

    if (!user_details) {
      throw new NotFoundException('User account not found.');
    }

    // 1. Fetch the coupon
    const coupon = await this.prisma.coupon.findFirst({
      where: {
        code,
        is_active: true,
        deleted_at: null,
        start_date: { lte: now },
        end_date: { gte: now },
      },
    });

    if (!coupon) {
      throw new NotFoundException('Invalid or expired coupon.');
    }

    // 2. Check minimum purchase requirement
    if (amount < coupon.min_purchase) {
      throw new ConflictException(
        `This coupon requires a minimum purchase of ${formatMoney(coupon.min_purchase, coupon.currency)}.`,
      );
    }

    // 3. Global usage check
    const totalUsages = await this.prisma.couponUsage.count({
      where: { coupon_id: coupon.id },
    });

    if (totalUsages >= coupon.usage_limit) {
      throw new ConflictException('This coupon has reached its usage limit.');
    }

    // 4. User-specific usage check
    const userUsages = await this.prisma.couponUsage.count({
      where: {
        coupon_id: coupon.id,
        user_id: user_details.id,
      },
    });

    if (userUsages >= coupon.user_limit) {
      throw new ConflictException(
        'You have exceeded the usage limit for this coupon.',
      );
    }

    // 5. Calculate discount
    let discount = 0;
    if (coupon.type === CouponType.PERCENTAGE) {
      discount = (coupon.value / 100) * amount;
    } else if (coupon.type === CouponType.FLAT) {
      discount = coupon.value;
    }

    // Prevent discount from exceeding the amount
    const discountedAmount = Math.max(amount - discount, 0);

    return {
      statusCode: HttpStatus.OK,
      data: {
        discountedAmount,
        discount,
      },
      message: `Coupon applied successfully. You saved ${formatMoney(+discount.toFixed(2), coupon.currency)}.`,
    };
  }
}
