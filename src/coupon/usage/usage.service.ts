import { GenericService } from '../../generic/generic.service';
import { LogService } from '../../log/log.service';
import { PrismaBaseRepository } from '../../prisma/prisma.base.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  Coupon,
  CouponType,
  CouponUsage,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { CreateCouponUsageDto, ValidateCouponUsageDto } from './usage.dto';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { AuthPayload, PagePayload } from '../../generic/generic.payload';
import { QueryDto, TZ } from '../../generic/generic.dto';
import { CouponManagementService } from '../management/management.service';
import { pageFilter } from '../../generic/generic.utils';

@Injectable()
export class CouponUsageService {
  private readonly model = 'CouponUsage';

  private readonly couponUsageRepository: PrismaBaseRepository<
    CouponUsage,
    Prisma.CouponUsageCreateInput,
    Prisma.CouponUsageUpdateInput,
    Prisma.CouponUsageWhereUniqueInput,
    Prisma.CouponUsageWhereInput | Prisma.CouponUsageFindFirstArgs,
    Prisma.CouponUsageUpsertArgs
  >;

  private readonly select: Prisma.CouponUsageSelect = {
    id: true,
    discount_applied: true,
    created_at: true,
    user: {
      select: {
        id: true,
        name: true,
        role: { select: { name: true, role_id: true } },
      }, // Fetch only required user details
    },
    coupon: {
      select: {
        id: true,
        code: true,
      },
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly logService: LogService,
    private readonly genericService: GenericService,
    private readonly couponManagementService: CouponManagementService,
  ) {
    this.couponUsageRepository = new PrismaBaseRepository<
      CouponUsage,
      Prisma.CouponUsageCreateInput,
      Prisma.CouponUsageUpdateInput,
      Prisma.CouponUsageWhereUniqueInput,
      Prisma.CouponUsageWhereInput | Prisma.CouponUsageFindFirstArgs,
      Prisma.CouponUsageUpsertArgs
    >('couponUsage', prisma);
  }

  /**
   * Create coupon usage with transaction
   * @param createCouponUsageDto
   * @param couponUsageRepo
   * @returns
   */
  async createWithTrx(
    createCouponUsageDto: CreateCouponUsageDto,
    couponUsageRepo: Prisma.CouponUsageDelegate<
      DefaultArgs,
      Prisma.PrismaClientOptions
    >,
  ): Promise<CouponUsage> {
    // 1. Create a coupon usage with prisma.couponUsage transaction
    return await couponUsageRepo.create({
      data: { ...createCouponUsageDto },
    });
  }

  /**
   * Get all coupon's usages by coupon ID
   * @param payload
   * @param param
   * @param queryDto
   * @returns
   */
  async fetch(
    payload: AuthPayload,
    param: { coupon_id: string },
    queryDto: QueryDto,
  ): Promise<PagePayload<CouponUsage>> {
    const auth = payload.user;
    const { coupon_id } = param;

    // 1. Verify that coupon exists
    const found_coupon = await this.couponManagementService.findOne(coupon_id);

    // 2. Check if user is part of the company's administrators
    await this.genericService.isUserLinkedToBusiness(this.prisma, {
      user_id: auth.sub,
      business_id: found_coupon.business.id,
    });

    // Invoke pagination filters
    const pagination_filters = pageFilter(queryDto);

    // Filters
    const filters: Prisma.CouponUsageWhereInput & TZ = {
      ...(coupon_id && { coupon_id }),
      ...pagination_filters.filters,
      tz: payload.timezone,
    };

    // Assign something else to same variable
    const select = this.select;

    const [coupon_usages, total] = await Promise.all([
      this.couponUsageRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.couponUsageRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: coupon_usages,
      count: total,
    };
  }

  /**
   * Check if a coupon is available for use and validate the discount
   * @param createCouponUsageDto The DTO containing coupon usage details
   * @param purchaseAmount The total purchase amount for validation
   * @returns The coupon if it is available for use
   * @throws HttpException if the coupon is not available for use or the discount is invalid
   */
  async validateCouponUsage(
    validateCouponUsageDto: ValidateCouponUsageDto,
    purchaseAmount: number, // Add purchase amount as a parameter
  ): Promise<Coupon> {
    const { coupon_code, user_id, discount_applied } = validateCouponUsageDto;
    const currentDate = new Date();

    // 1. Verify that the coupon exists and is active
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: coupon_code },
      include: { coupon_usages: true },
    });

    if (!coupon || !coupon.is_active) {
      throw new HttpException(
        'Coupon not found or inactive',
        HttpStatus.NOT_FOUND,
      );
    }

    // 2. Check if the current date is within the coupon's validity period
    if (currentDate < coupon.start_date || currentDate > coupon.end_date) {
      throw new HttpException(
        'Coupon is not valid at this time',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 3. Check if the coupon has exceeded its usage limit
    if (coupon.usage_limit <= coupon.coupon_usages.length) {
      throw new HttpException(
        'Coupon usage limit exceeded',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 4. Check if the user has exceeded their usage limit for this coupon
    const userUsageCount = coupon.coupon_usages.filter(
      (usage) => usage.user_id === user_id,
    ).length;

    if (userUsageCount >= coupon.user_limit) {
      throw new HttpException(
        'User coupon usage limit exceeded',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 5. Validate the discount based on the coupon type
    if (discount_applied) {
      if (coupon.type === CouponType.PERCENTAGE) {
        // For percentage coupons, the discount must be less than or equal to the coupon value
        if (discount_applied > coupon.value) {
          throw new HttpException(
            'Discount applied exceeds the allowed percentage',
            HttpStatus.BAD_REQUEST,
          );
        }
      } else if (coupon.type === CouponType.FLAT) {
        // For flat coupons, the discount must match the coupon value
        if (discount_applied !== coupon.value) {
          throw new HttpException(
            'Discount applied does not match the flat coupon value',
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    }

    // 6. Check if the purchase amount meets the minimum purchase requirement
    if (purchaseAmount < coupon.min_purchase) {
      throw new HttpException(
        `Minimum purchase amount of ${coupon.min_purchase} is required to use this coupon`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // If all checks pass, return the coupon
    return coupon;
  }

  getDiscountedAmount(
    amount: number,
    discountValue: number,
    couponType: 'FLAT' | 'PERCENTAGE',
  ): number {
    if (couponType === 'FLAT') {
      // For flat rate coupons, subtract the discount value directly
      return Math.max(amount - discountValue, 0); // Ensure the result is not negative
    } else if (couponType === 'PERCENTAGE') {
      // For percentage coupons, calculate the discount as a percentage of the amount
      const discountAmount = (amount * discountValue) / 100;
      return Math.max(amount - discountAmount, 0); // Ensure the result is not negative
    } else {
      throw new Error('Invalid coupon type. Must be "FLAT" or "PERCENTAGE".');
    }
  }

  getDiscountValue(
    amount: number,
    discountValue: number,
    couponType: CouponType,
  ): number {
    return couponType === CouponType.FLAT
      ? discountValue
      : (amount * discountValue) / 100;
  }

  /**
   * Rollback coupon usage (when order/payment is cancelled)
   * @param coupon_id
   * @param user_id
   * @param prisma
   */
  async rollbackCouponUsage(
    coupon_id: string,
    user_id: string,
    prisma: PrismaClient | Prisma.TransactionClient,
  ) {
    // 1. Find the latest usage record
    const usage = await prisma.couponUsage.findFirst({
      where: {
        coupon_id,
        user_id,
        deleted_at: null,
      },
      orderBy: { created_at: 'desc' },
    });

    if (!usage) {
      // Nothing to rollback
      return null;
    }

    // 2. Delete usage record
    const rolledBack = await prisma.couponUsage.delete({
      where: { id: usage.id },
    });

    // 3. Optionally: if coupon has usage counters in DB (like usage_limit, user_limit),
    // you could also decrement counters here if you were incrementing them on apply.

    return rolledBack;
  }
}
