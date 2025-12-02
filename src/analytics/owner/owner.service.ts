import { formatMoney, withDeleted } from '@/generic/generic.utils';
import { PrismaBaseRepository } from '@/prisma/prisma.base.repository';
import { PrismaService } from '@/prisma/prisma.service';
import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BusinessInformation,
  Payment,
  PaymentStatus,
  Prisma,
  PurchaseType,
  TransactionType,
} from '@prisma/client';
import { FilterByYearDto } from './owner.dto';

@Injectable()
export class OwnerService {
  private readonly paymentRepository: PrismaBaseRepository<
    Payment,
    Prisma.PaymentCreateInput,
    Prisma.PaymentUpdateInput,
    Prisma.PaymentWhereUniqueInput,
    Prisma.PaymentWhereInput | Prisma.PaymentFindFirstArgs,
    Prisma.PaymentUpsertArgs
  >;
  private readonly businessInformationRepository: PrismaBaseRepository<
    BusinessInformation,
    Prisma.BusinessInformationCreateInput,
    Prisma.BusinessInformationUpdateInput,
    Prisma.BusinessInformationWhereUniqueInput,
    | Prisma.BusinessInformationWhereInput
    | Prisma.BusinessInformationFindFirstArgs,
    Prisma.BusinessInformationUpsertArgs
  >;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.paymentRepository = new PrismaBaseRepository<
      Payment,
      Prisma.PaymentCreateInput,
      Prisma.PaymentUpdateInput,
      Prisma.PaymentWhereUniqueInput,
      Prisma.PaymentWhereInput | Prisma.PaymentFindFirstArgs,
      Prisma.PaymentUpsertArgs
    >('payment', prisma);
    this.businessInformationRepository = new PrismaBaseRepository<
      BusinessInformation,
      Prisma.BusinessInformationCreateInput,
      Prisma.BusinessInformationUpdateInput,
      Prisma.BusinessInformationWhereUniqueInput,
      | Prisma.BusinessInformationWhereInput
      | Prisma.BusinessInformationFindFirstArgs,
      Prisma.BusinessInformationUpsertArgs
    >('businessInformation', prisma);
  }

  /**
   * Get metrics
   * @returns
   */
  async getMetrics() {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Total distinct registered organizations
      const total_organizations = await prisma.businessInformation.count({
        where: {
          ...withDeleted(), // Only count active businesses
        },
      });

      // 2. Total revenue (sum of all successful payments)
      const revenueResult = await prisma.payment.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          payment_status: PaymentStatus.SUCCESS, // Assuming PaymentStatus has a SUCCESSFUL enum value
          ...withDeleted(),
        },
      });
      const total_revenue = formatMoney(
        +revenueResult._sum.amount || 0,
        this.configService.get<string>('DEFAULT_CURRENCY'),
      );

      // 3. Total orders for products
      const total_product_orders = await prisma.payment.count({
        where: {
          purchase_type: PurchaseType.PRODUCT, // Adjust based on your enum
          payment_status: PaymentStatus.SUCCESS,
          ...withDeleted(),
        },
      });

      // 4. Total withdrawals
      const total_withdrawals = await prisma.payment.count({
        where: {
          transaction_type: TransactionType.WITHDRAWAL,
          ...withDeleted(),
        },
      });

      return {
        statusCode: HttpStatus.OK,
        data: {
          total_organizations,
          total_revenue,
          total_product_orders,
          total_withdrawals,
        },
      };
    });
  }

  /**
   * Get yearly revenue breakdown
   * @param filterByYearDto
   * @returns
   */
  async getYearlyRevenueBreakdown(filterByYearDto: FilterByYearDto) {
    const { year } = filterByYearDto;

    return this.prisma.$transaction(async (prisma) => {
      // Validate year input
      if (year < 2000 || year > new Date().getFullYear()) {
        throw new BadRequestException('Invalid year specified');
      }

      // Helper to generate month ranges
      const getMonthRange = (month: number) => {
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
        return { start, end };
      };

      // Prepare all monthly queries
      const monthlyQueries = Array.from({ length: 12 }, async (_, month) => {
        const { start, end } = getMonthRange(month);

        return await Promise.all([
          // Product revenue
          prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
              payment_status: PaymentStatus.SUCCESS,
              purchase_type: PurchaseType.PRODUCT,
              created_at: { gte: start, lte: end },
              ...withDeleted(),
            },
          }),

          // Subscription revenue
          prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
              payment_status: PaymentStatus.SUCCESS,
              purchase_type: PurchaseType.SUBSCRIPTION,
              created_at: { gte: start, lte: end },
              ...withDeleted(),
            },
          }),

          // Withdrawals (assuming these are tracked in payments with transaction_type)
          prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
              transaction_type: TransactionType.WITHDRAWAL,
              created_at: { gte: start, lte: end },
              ...withDeleted(),
            },
          }),
        ]);
      });

      // Execute all queries
      const monthlyResults = await Promise.all(monthlyQueries);

      // Format results
      const monthlyBreakdown = monthlyResults.map(
        ([product, subscription, withdrawal], index) => ({
          month: new Date(year, index).toLocaleString('default', {
            month: 'short',
          }),
          product_revenue: formatMoney(
            +(product._sum.amount || 0),
            this.configService.get<string>('DEFAULT_CURRENCY'),
          ),
          subscription_revenue: formatMoney(
            +(subscription._sum.amount || 0),
            this.configService.get<string>('DEFAULT_CURRENCY'),
          ),
          withdrawals: formatMoney(
            +(withdrawal._sum.amount || 0),
            this.configService.get<string>('DEFAULT_CURRENCY'),
          ),
        }),
      );

      // Calculate totals
      const totals = monthlyBreakdown.reduce(
        (acc, month) => ({
          product_revenue:
            acc.product_revenue +
            +month.product_revenue.replace(/[^0-9.-]+/g, ''),
          subscription_revenue:
            acc.subscription_revenue +
            +month.subscription_revenue.replace(/[^0-9.-]+/g, ''),
          withdrawals:
            acc.withdrawals + +month.withdrawals.replace(/[^0-9.-]+/g, ''),
        }),
        { product_revenue: 0, subscription_revenue: 0, withdrawals: 0 },
      );

      return {
        statusCode: HttpStatus.OK,
        data: {
          year,
          monthly_breakdown: monthlyBreakdown,
          totals: {
            product_revenue: formatMoney(
              totals.product_revenue,
              this.configService.get<string>('DEFAULT_CURRENCY'),
            ),
            subscription_revenue: formatMoney(
              totals.subscription_revenue,
              this.configService.get<string>('DEFAULT_CURRENCY'),
            ),
            withdrawals: formatMoney(
              totals.withdrawals,
              this.configService.get<string>('DEFAULT_CURRENCY'),
            ),
          },
        },
      };
    });
  }

  /**
   * Get product count by type
   * @returns
   */
  async getProductCountByType() {
    return this.prisma.$transaction(async (prisma) => {
      // Get counts for each product type
      const [courseCount, ticketCount] = await Promise.all([
        prisma.product.count({
          where: {
            type: 'COURSE',
            deleted_at: null, // Exclude soft-deleted products
          },
        }),
        prisma.product.count({
          where: {
            type: 'TICKET',
            deleted_at: null, // Exclude soft-deleted products
          },
        }),
      ]);

      return {
        statusCode: HttpStatus.OK,
        data: {
          course: courseCount,
          ticket: ticketCount,
        },
      };
    });
  }
}
