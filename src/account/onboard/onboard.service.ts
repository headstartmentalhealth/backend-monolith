import {
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  AuthPayload,
  GenericDataPayload,
  GenericPayloadAlias,
  PagePayload,
  Timezone,
} from '../../generic/generic.payload';

import { GenericPayload } from '../../generic/generic.payload';
import { BadRequestException } from '@nestjs/common';
import {
  ExportBusinessUsersDto,
  FilterBusinessDto,
  FilterBusinessOwnerDto,
  ImportBusinessUsersDto,
  SaveBusinessInfoDto,
  SuspendBusinessOwnerDto,
  UpsertWithdrawalAccountDto,
  AddCustomerDto,
  UpsertKycDto,
  ReviewKycDto,
  BusinessNameDto,
  UpdateBusinessProcessesDto,
} from './onboard.dto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Action,
  BusinessContact,
  BusinessInformation,
  BusinessWallet,
  JoinedVia,
  MemberStatus,
  NotificationType,
  OnboardingStatus,
  Payment,
  PaymentStatus,
  Prisma,
  TransactionType,
  User,
  WithdrawalAccount,
} from '@prisma/client';
import {
  currencyMap,
  DEFAULT_COUNTRY,
  DEFAULT_CURRENCY,
  Role,
} from '../../generic/generic.data';
import { LogService } from '../../log/log.service';
import {
  getUserAgent,
  pageFilter,
  shortenId,
  TransactionError,
} from '../../generic/generic.utils';
import { getIpAddress } from '../../generic/generic.utils';
import { PrismaBaseRepository } from '../../prisma/prisma.base.repository';
import { PaystackService } from '../../generic/providers/paystack/paystack.provider';
import { BusinessDto, IdDto, TZ, UserDto } from '@/generic/generic.dto';
import { CompletePurchaseDetailSchema } from '@/payment/payment.payload';
import { MailService } from '@/notification/mail/mail.service';
import { GenericService } from '@/generic/generic.service';
import { UploadService } from '@/multimedia/upload/upload.service';
const XLSX = require('xlsx');
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { CartService } from '@/cart/cart.service';
import { NotificationDispatchService } from '@/notification/dispatch/dispatch.service';
import { BusinessInformationFindOne } from './onboard.utils';

@Injectable()
export class OnboardService {
  private readonly businessInformationRepository: PrismaBaseRepository<
    BusinessInformation,
    Prisma.BusinessInformationCreateInput,
    Prisma.BusinessInformationUpdateInput,
    | Prisma.BusinessInformationWhereUniqueInput
    | Prisma.BusinessInformationFindFirstArgs,
    | Prisma.BusinessInformationWhereInput
    | Prisma.BusinessInformationFindFirstArgs,
    Prisma.BusinessInformationUpsertArgs
  >;
  private readonly businessWalletRepository: PrismaBaseRepository<
    BusinessWallet,
    Prisma.BusinessWalletCreateInput,
    Prisma.BusinessWalletUpdateInput,
    Prisma.BusinessWalletWhereUniqueInput | Prisma.BusinessWalletFindFirstArgs,
    Prisma.BusinessWalletWhereInput,
    Prisma.BusinessWalletUpsertArgs
  >;
  private readonly onboardingStatusRepository: PrismaBaseRepository<
    OnboardingStatus,
    Prisma.OnboardingStatusCreateInput,
    Prisma.OnboardingStatusUpdateInput,
    | Prisma.OnboardingStatusWhereUniqueInput
    | Prisma.OnboardingStatusFindFirstArgs,
    Prisma.OnboardingStatusWhereInput,
    Prisma.OnboardingStatusUpsertArgs
  >;
  private readonly paymentRepository: PrismaBaseRepository<
    Payment,
    Prisma.PaymentCreateInput,
    Prisma.PaymentUpdateInput,
    Prisma.PaymentWhereUniqueInput | Prisma.PaymentFindFirstArgs,
    Prisma.PaymentWhereInput,
    Prisma.PaymentUpsertArgs
  >;

  private readonly businessOwnerSelect: Prisma.UserSelect = {
    id: true,
    name: true,
    profile: {
      select: {
        profile_picture: true,
        gender: true,
        bio: true,
        state: true,
        country: true,
      },
    },
  };
  private readonly onboardingStatusSelect: Prisma.OnboardingStatusSelect = {
    onboard_processes: true,
    current_step: true,
    is_completed: true,
  };
  private readonly businessInformationSelect: Prisma.BusinessInformationSelect =
    {
      id: true,
      user_id: true,
      business_name: true,
      business_slug: true,
      business_description: true,
      social_media_handles: true,
      business_size: true,
      timeline: true,
      logo_url: true,
      industry: true,
      working_hours: true,
      location: true,
      state: true,
      country: true,
      country_code: true,
      created_at: true,
      updated_at: true,
      onboarding_status: true,
      business_contacts: { take: 2 },
      products: { take: 1 },
      kyc: { take: 1 },
      withdrawal_account: true,
    };
  private readonly businessWalletSelect: Prisma.BusinessWalletSelect = {
    balance: true,
    previous_balance: true,
    currency: true,
    currency_url: true,
  };
  private readonly withdrawalAccountRepository: PrismaBaseRepository<
    WithdrawalAccount,
    Prisma.WithdrawalAccountCreateInput,
    Prisma.WithdrawalAccountUpdateInput,
    | Prisma.WithdrawalAccountWhereUniqueInput
    | Prisma.WithdrawalAccountFindFirstArgs,
    Prisma.WithdrawalAccountWhereInput,
    Prisma.WithdrawalAccountUpsertArgs
  >;
  private readonly withdrawalAccountSelect: Prisma.WithdrawalAccountSelect = {
    account_number: true,
    account_type: true,
    bank_name: true,
    routing_number: true,
    country: true,
    country_code: true,
    currency: true,
    created_at: true,
  };

  private readonly userRepository: PrismaBaseRepository<
    User,
    Prisma.UserCreateInput,
    Prisma.UserUpdateInput,
    Prisma.UserWhereUniqueInput | Prisma.UserFindFirstArgs,
    Prisma.UserWhereInput,
    Prisma.UserUpsertArgs
  >;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logService: LogService,
    private readonly paystackService: PaystackService,
    private readonly mailService: MailService,
    private readonly genericService: GenericService,
    private readonly uploadService: UploadService,
    private readonly cartService: CartService,
    private readonly configService: ConfigService,
    private readonly logger: Logger, // Inject the Logger
    private readonly notificationDispatchService: NotificationDispatchService,
  ) {
    this.businessInformationRepository = new PrismaBaseRepository<
      BusinessInformation,
      Prisma.BusinessInformationCreateInput,
      Prisma.BusinessInformationUpdateInput,
      | Prisma.BusinessInformationWhereUniqueInput
      | Prisma.BusinessInformationFindFirstArgs,
      Prisma.BusinessInformationWhereInput,
      Prisma.BusinessInformationUpsertArgs
    >('businessInformation', prisma);
    this.businessWalletRepository = new PrismaBaseRepository<
      BusinessWallet,
      Prisma.BusinessWalletCreateInput,
      Prisma.BusinessWalletUpdateInput,
      | Prisma.BusinessWalletWhereUniqueInput
      | Prisma.BusinessWalletFindFirstArgs,
      Prisma.BusinessWalletWhereInput,
      Prisma.BusinessWalletUpsertArgs
    >('businessWallet', prisma);
    this.onboardingStatusRepository = new PrismaBaseRepository<
      OnboardingStatus,
      Prisma.OnboardingStatusCreateInput,
      Prisma.OnboardingStatusUpdateInput,
      | Prisma.OnboardingStatusWhereUniqueInput
      | Prisma.OnboardingStatusFindFirstArgs,
      Prisma.OnboardingStatusWhereInput,
      Prisma.OnboardingStatusUpsertArgs
    >('onboardingStatus', prisma);
    this.withdrawalAccountRepository = new PrismaBaseRepository<
      WithdrawalAccount,
      Prisma.WithdrawalAccountCreateInput,
      Prisma.WithdrawalAccountUpdateInput,
      | Prisma.WithdrawalAccountWhereUniqueInput
      | Prisma.WithdrawalAccountFindFirstArgs,
      Prisma.WithdrawalAccountWhereInput,
      Prisma.WithdrawalAccountUpsertArgs
    >('withdrawalAccount', prisma);
    this.userRepository = new PrismaBaseRepository<
      User,
      Prisma.UserCreateInput,
      Prisma.UserUpdateInput,
      Prisma.UserWhereUniqueInput | Prisma.UserFindFirstArgs,
      Prisma.UserWhereInput,
      Prisma.UserUpsertArgs
    >('user', prisma);
  }

  /**
   * Save business information
   * @param auth
   * @param businessInfoDto
   * @returns
   */
  async saveBusinessInformation(
    req: AuthPayload & Request,
    saveBusinessInfoDto: SaveBusinessInfoDto,
  ): Promise<GenericPayload> {
    const auth = req.user;

    return await this.prisma.$transaction(async (prisma) => {
      // 1. Ensure Business Name is Unique
      const existingBusiness = await prisma.businessInformation.findUnique({
        where: {
          user_id: { not: auth.sub },
          business_name: saveBusinessInfoDto.business_name,
        },
      });

      if (existingBusiness) {
        throw new BadRequestException('Business name is already in use.');
      }

      // 2. Save or update business information
      const business = await prisma.businessInformation.upsert({
        where: {
          user_id: auth.sub,
          business_name: saveBusinessInfoDto.business_name,
        },
        create: {
          ...saveBusinessInfoDto,
          user: { connect: { id: auth.sub } },
          social_media_handles: saveBusinessInfoDto.social_media_handles
            ? JSON.parse(
                JSON.stringify(saveBusinessInfoDto.social_media_handles),
              )
            : undefined,
        },
        update: {
          ...saveBusinessInfoDto,
          social_media_handles: saveBusinessInfoDto.social_media_handles
            ? JSON.parse(
                JSON.stringify(saveBusinessInfoDto.social_media_handles),
              )
            : undefined,
        },
      });

      const existingOwner = await this.prisma.businessContact.findFirst({
        where: {
          user_id: auth.sub,
          email: auth.email,
          business_id: business.id,
          is_owner: true,
        },
      });

      if (!existingOwner) {
        // Add creator to business contact
        await prisma.businessContact.create({
          data: {
            business_id: business.id,
            user_id: auth.sub,
            is_owner: true,
            status: MemberStatus.active,
            email: auth.email,
            name: auth.name,
          },
        });
      }

      // 3. Create a business wallet if it doesn't exist
      const existingWallet = await prisma.businessWallet.findFirst({
        where: { business_id: business.id },
      });
      if (!existingWallet) {
        // Fetch currencies
        const allowed_currencies = await prisma.allowedCurrency.findMany({});

        const currencies = allowed_currencies.map((allowed_currency) => {
          return {
            business_id: business.id,
            balance: new Prisma.Decimal(0.0),
            previous_balance: new Prisma.Decimal(0.0),
            currency: allowed_currency.currency,
            currency_url: currencyMap[allowed_currency.currency],
          };
        });
        // Create multiple currencies
        await prisma.businessWallet.createMany({
          data: currencies,
        });
      }

      // 3. Update onboarding status
      await prisma.onboardingStatus.upsert({
        where: {
          user_id_business_id: { user_id: auth.sub, business_id: business.id },
        },
        create: {
          user_id: auth.sub,
          business_id: business.id,
          is_completed: true,
          current_step: 1,
        },
        update: {
          is_completed: true,
        },
      });

      // Log the success action
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.BUSINESS_ONBOARDING,
          entity: 'BusinessInformation',
          entity_id: business.id,
          metadata: `User with email ${auth.sub} just onboarded their business (Step 1 of 3).`,
          ip_address: getIpAddress(req),
          user_agent: getUserAgent(req),
        },
        prisma.log,
      );

      return {
        statusCode: 200,
        message: 'Business information saved successfully.',
      };
    });
  }

  /**
   * Fetch businesses
   * @param req
   * @returns
   */
  async fetchBusinesses(
    req: AuthPayload & Request,
  ): Promise<GenericDataPayload<any[]>> {
    const auth = req.user;

    const select: Prisma.BusinessInformationSelect = {
      ...this.businessInformationSelect,
    };

    const filter: Prisma.BusinessInformationWhereInput & TZ = {
      ...(auth.role === Role.BUSINESS_SUPER_ADMIN && { user_id: auth.sub }),
      ...(auth.role === Role.BUSINESS_ADMIN && {
        business_contacts: {
          some: {
            user_id: auth.sub,
            role: Role.BUSINESS_ADMIN,
            status: 'active',
          },
        },
      }),
      ...(auth.role === Role.USER && {
        business_contacts: {
          some: {
            user_id: auth.sub,
            role: Role.USER,
            status: 'active',
          },
        },
      }),
      tz: req.timezone,
    };

    const businesses =
      await this.businessInformationRepository.findManyWithPagination(
        filter,
        {},
        Prisma.SortOrder.desc,
        undefined,
        select,
      );

    // Fetch all payments for these businesses (broader filter)
    const payments = await this.prisma.payment.findMany({
      where: {
        OR: [
          // If you have a business_id field directly, use it
          { purchase: { not: null } },
          {
            subscription_plan: {
              business_id: { in: businesses.map((b) => b.id) },
            },
          },
        ],
      },
      select: {
        id: true,
        purchase: true,
        subscription_plan: { select: { business_id: true } },
      },
    });

    // Build set of business IDs with purchases
    const purchasedBusinessIds = new Set<string>();
    for (const p of payments) {
      // Extract business_id from purchase JSON if present
      if (
        p.purchase &&
        typeof p.purchase === 'object' &&
        'business_id' in p.purchase
      ) {
        purchasedBusinessIds.add(String(p.purchase.business_id));
      }
      if (p.subscription_plan && p.subscription_plan.business_id) {
        purchasedBusinessIds.add(String(p.subscription_plan.business_id));
      }
    }

    const businessesWithPurchase = businesses.map((b) => ({
      ...b,
      is_purchased: purchasedBusinessIds.has(b.id),
    }));

    return {
      statusCode: HttpStatus.OK,
      data: businessesWithPurchase,
    };
  }

  /**
   * Fetch business information
   * @param req
   * @returns
   */
  async fetchBusinessInformation(
    req: AuthPayload & Request,
    param: { id: string },
  ): Promise<GenericPayloadAlias<BusinessInformation>> {
    const auth = req.user;

    const select: Prisma.BusinessInformationSelect = {
      ...this.businessInformationSelect,
      onboarding_status: {
        select: {
          ...this.onboardingStatusSelect,
        },
      },
      business_wallet: {
        select: {
          ...this.businessWalletSelect,
        },
      },
      withdrawal_account: true,
    };

    const filter: BusinessInformationFindOne & TZ = {
      ...(auth.role === Role.BUSINESS_SUPER_ADMIN && { user_id: auth.sub }),
      id: param.id,
      tz: req.timezone,
    };

    const business = await this.businessInformationRepository.findOne(
      filter,
      undefined,
      select,
    );

    if (!business) {
      throw new NotFoundException('Business information not found.');
    }

    return {
      statusCode: 200,
      message: 'Business information retrieved successfully.',
      data: business,
    };
  }

  /**
   * Find business information
   * @param req
   * @returns
   */
  async findBusinessInformation(
    req: AuthPayload & Request,
    businessNameDto: BusinessNameDto,
  ): Promise<GenericPayloadAlias<BusinessInformation>> {
    const auth = req.user;

    const filter = {
      business_name: businessNameDto.business_name,
      // tz: req.timezone,
    };

    const business = await this.businessInformationRepository.findOne(filter);

    if (business) {
      throw new NotFoundException('Business name exists.');
    }

    return {
      statusCode: 200,
      message: 'Business name is available.',
    };
  }

  /**
   * Save withdrawal account
   * @param req
   * @param dto
   * @returns
   */
  async saveWithdrawalAccount(
    req: Request & AuthPayload,
    dto: UpsertWithdrawalAccountDto,
  ): Promise<GenericPayload> {
    const auth = req.user;

    return await this.prisma.$transaction(async (prisma) => {
      // Ensure business exists and belongs to the user
      const business = await prisma.businessInformation.findUnique({
        where: { id: dto.business_id, user_id: auth.sub },
        include: {
          withdrawal_account: true,
        },
      });

      if (!business) {
        throw new NotFoundException('Business not found.');
      }

      // Verify account number using Paystack's API
      const account = await this.paystackService.resolveAccountNumber(
        dto.account_number,
        dto.bank_code,
      );

      // Encrypt recipient code
      const encrypted_recipient_code = this.genericService.encrypt(
        account.data.recipient_code,
      );

      if (!account) {
        throw new BadRequestException('Invalid account number or bank code.');
      }

      let withdrawalAccount;

      // If withdrawal_account_id is provided, update the existing record
      if (business.withdrawal_account) {
        const existingAccount = await prisma.withdrawalAccount.findUnique({
          where: { id: business.withdrawal_account.id },
        });

        if (!existingAccount) {
          throw new NotFoundException('Withdrawal account not found.');
        }

        withdrawalAccount = await prisma.withdrawalAccount.update({
          where: { id: business.withdrawal_account.id },
          data: {
            account_number: dto.account_number,
            ...(dto.account_type && { account_type: dto.account_type }),
            bank_name: dto.bank_name,
            bank_code: dto.bank_code,
            routing_number: dto.routing_number,
            country: dto.country || existingAccount.country, // Keep existing country if not provided
            recipient_code: encrypted_recipient_code,
          },
        });

        // Log update action
        await this.logService.createWithTrx(
          {
            user_id: auth.sub,
            action: Action.WITHDRAWAL_ACCOUNT,
            entity: 'WithdrawalAccount',
            entity_id: withdrawalAccount.id,
            metadata: `User updated a withdrawal account (${withdrawalAccount.account_number}) for business ID ${business.id}.`,
            ip_address: getIpAddress(req),
            user_agent: getUserAgent(req),
          },
          prisma.log,
        );
      } else {
        // Create a new withdrawal account
        withdrawalAccount = await prisma.withdrawalAccount.create({
          data: {
            business_id: dto.business_id,
            account_number: dto.account_number,
            account_type: dto.account_type,
            bank_name: dto.bank_name,
            bank_code: dto.bank_code,
            routing_number: dto.routing_number,
            country: dto.country || 'Nigeria', // Default to Nigeria
            recipient_code: encrypted_recipient_code,
          },
        });

        // Log creation action
        await this.logService.createWithTrx(
          {
            user_id: auth.sub,
            action: Action.WITHDRAWAL_ACCOUNT,
            entity: 'WithdrawalAccount',
            entity_id: withdrawalAccount.id,
            metadata: `User added a new withdrawal account (${withdrawalAccount.account_number}) for business ID ${business.id}.`,
            ip_address: getIpAddress(req),
            user_agent: getUserAgent(req),
          },
          prisma.log,
        );
      }

      // **Upgrade onboarding status to Step 2 only if current step is less than 2**
      const existingOnboardingStatus = await prisma.onboardingStatus.findUnique(
        {
          where: {
            user_id_business_id: {
              user_id: auth.sub,
              business_id: business.id,
            },
          },
        },
      );

      if (
        !existingOnboardingStatus ||
        existingOnboardingStatus.current_step < 3
      ) {
        await prisma.onboardingStatus.upsert({
          where: {
            user_id_business_id: {
              user_id: auth.sub,
              business_id: business.id,
            },
          },
          create: {
            user_id: auth.sub,
            business_id: business.id,
            current_step: 3, // Set onboarding step to 3
          },
          update: {
            current_step: 3, // Set onboarding step to 3
          },
        });
      }

      return {
        statusCode: 200,
        message: business.withdrawal_account
          ? 'Withdrawal account updated successfully.'
          : 'Withdrawal account added successfully.',
      };
    });
  }

  /**
   * Fetch business information for public
   * @param req
   * @param param
   * @returns
   */
  async viewBusinessInformationPublic(
    req: Timezone & Request,
    param: { id: string },
  ): Promise<GenericPayloadAlias<BusinessInformation>> {
    // Create a safe copy of select object without onboarding_status
    const { onboarding_status, ...selectWithoutOnboarding } =
      this.businessInformationSelect;

    const select: Prisma.BusinessInformationSelect = {
      ...selectWithoutOnboarding,
      user: {
        select: this.businessOwnerSelect,
      },
    };

    const business = await this.prisma.businessInformation.findFirst({
      where: {
        OR: [{ id: param.id }, { business_slug: param.id }],
      },
      select,
    });

    if (!business) {
      throw new NotFoundException('Business information not found.');
    }

    return {
      statusCode: 200,
      message: 'Business information retrieved successfully.',
      data: business,
    };
  }

  /**
   * Fetch all businesses
   * @param req
   * @returns
   */
  async fetchAllBusinesses(
    req: AuthPayload & Request,
    filterBusinessDto: FilterBusinessDto,
  ): Promise<PagePayload<BusinessInformation>> {
    const auth = req.user;

    // Check if user is part of the owner's administrators  (TODO)

    // Invoke pagination filters
    const pagination_filters = pageFilter(filterBusinessDto);

    const filters: Prisma.BusinessInformationWhereInput & TZ = {
      ...(filterBusinessDto.q && {
        OR: [
          {
            business_name: {
              contains: filterBusinessDto.q,
              mode: 'insensitive',
            },
          },
          {
            industry: { contains: filterBusinessDto.q, mode: 'insensitive' },
          },
          {
            location: { contains: filterBusinessDto.q, mode: 'insensitive' },
          },
        ],
      }),
      ...pagination_filters.filters,
      tz: req.timezone,
    };

    const select: Prisma.BusinessInformationSelect = {
      ...this.businessInformationSelect,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          is_email_verified: true,
          is_phone_verified: true,
          created_at: true,
          updated_at: true,
          is_suspended: true,
          role: {
            select: { id: true, name: true, role_id: true },
          },
        },
      },
    };

    const [businesses, total] = await Promise.all([
      this.businessInformationRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        select,
        filterBusinessDto.deleted,
      ),
      this.businessInformationRepository.count(
        filters,
        filterBusinessDto.deleted,
      ),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: businesses,
      count: total,
    };
  }

  /**
   * Fetch business details - admin
   * @param req
   * @param param
   * @returns
   */
  async fetchBusinessDetails(
    req: AuthPayload & Request,
    param: IdDto,
  ): Promise<GenericPayloadAlias<BusinessInformation>> {
    const select: Prisma.BusinessInformationSelect = {
      ...this.businessInformationSelect,
      user: {
        select: {
          ...this.businessOwnerSelect,
          email: true,
          phone: true,
          is_email_verified: true,
          is_phone_verified: true,
          created_at: true,
          updated_at: true,
          role: { select: { id: true, name: true, role_id: true } },
          is_suspended: true,
        },
      },
      withdrawal_account: true,
      business_wallet: true,
      onboarding_status: true,
    };

    const filter: Omit<BusinessInformationFindOne, 'user_id'> & TZ = {
      id: param.id,
      tz: req.timezone,
    };

    const [business, total_revenue, payments_count] = await Promise.all([
      this.businessInformationRepository.findOne(filter, undefined, select),
      this.prisma.payment.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          payment_status: PaymentStatus.SUCCESS, // adapt based on your enum values
          OR: [
            {
              purchase: {
                path: ['business_id'],
                equals: param.id,
              },
            },
            {
              subscription_plan: {
                business_id: param.id,
              },
            },
          ],
        },
      }),
      this.prisma.payment.count({
        where: {
          payment_status: PaymentStatus.SUCCESS,
          purchase: {
            path: ['business_id'],
            equals: param.id,
          },
        },
      }),
    ]);

    // const total_orders = await this.paymentRepository.count();

    if (!business) {
      throw new NotFoundException('Business information not found.');
    }

    return {
      statusCode: 200,
      message: 'Business information retrieved successfully.',
      data: {
        ...business,
        stat: { total_revenue: total_revenue._sum.amount, payments_count },
      },
    };
  }

  /**
   * Suspend business - admin
   * @param req
   * @param param
   * @returns
   */
  async suspendBusinessOwner(
    req: AuthPayload & Request,
    param: UserDto,
    suspendBusinessOwnerDto: SuspendBusinessOwnerDto,
  ): Promise<GenericPayload> {
    const auth = req.user;
    const { suspension_reason } = suspendBusinessOwnerDto;
    // Check if user is part of the owner's administrators  (TODO)

    try {
      const { business_owner, data } = await this.prisma.$transaction(
        async (prisma) => {
          const business_owner = await prisma.user.findUnique({
            where: {
              id: param.user_id,
              role: {
                role_id: Role.BUSINESS_SUPER_ADMIN,
              },
            },
          });

          if (!business_owner) {
            throw new NotFoundException('Business owner not found.');
          }

          if (business_owner.is_suspended) {
            throw new BadRequestException(
              'Business account has already been suspended.',
            );
          }

          const updated = await prisma.user.update({
            where: { id: param.user_id },
            data: {
              is_suspended: true,
              suspended_by: auth.sub,
              suspended_at: new Date(),
              suspension_reason,
            },
          });

          // Generate metadata as a sentence
          const metadata = `Admin with email ${req.user.email} has suspended business owner ID ${business_owner.id}.`;

          // Create log for the acceptance action
          await this.logService.createWithTrx(
            {
              user_id: auth.sub,
              action: Action.SUSPEND_UNSUSPEND_BUSINESS,
              entity: 'User',
              entity_id: business_owner.id,
              metadata,
              ip_address: getIpAddress(req),
              user_agent: getUserAgent(req),
            },
            prisma.log,
          );

          return {
            business_owner,
            data: {
              account_id: shortenId(business_owner.id),
              suspension_reason,
            },
          };
        },
      );

      // Email notification to business owner
      await this.mailService.accountSuspensionEmail(business_owner, data);

      return {
        statusCode: 200,
        message: 'Business owner has been suspended successfully.',
      };
    } catch (error) {
      TransactionError(error, this.logger);
    }
  }

  /**
   * Unsuspend business - admin
   * @param req
   * @param param
   * @returns
   */
  async unsuspendBusinessOwner(
    req: AuthPayload & Request,
    param: UserDto,
  ): Promise<GenericPayload> {
    const auth = req.user;
    // Check if user is part of the owner's administrators  (TODO)

    try {
      const { business_owner, data } = await this.prisma.$transaction(
        async (prisma) => {
          const business_owner = await prisma.user.findUnique({
            where: {
              id: param.user_id,
              role: {
                role_id: Role.BUSINESS_SUPER_ADMIN,
              },
            },
          });

          if (!business_owner) {
            throw new NotFoundException('Business owner not found.');
          }

          if (!business_owner.is_suspended) {
            throw new BadRequestException(
              'Business account has already been unsuspended.',
            );
          }

          const updated = await prisma.user.update({
            where: { id: param.user_id },
            data: {
              is_suspended: false,
              suspended_by: null,
              suspended_at: null,
              suspension_reason: null,
            },
          });

          // Generate metadata as a sentence
          const metadata = `Admin with email ${req.user.email} has unsuspended business owner ID ${business_owner.id}.`;

          // Create log for the unsuspension action
          await this.logService.createWithTrx(
            {
              user_id: auth.sub,
              action: Action.SUSPEND_UNSUSPEND_BUSINESS,
              entity: 'User',
              entity_id: business_owner.id,
              metadata,
              ip_address: getIpAddress(req),
              user_agent: getUserAgent(req),
            },
            prisma.log,
          );

          return {
            business_owner,
            data: {
              account_id: shortenId(business_owner.id),
            },
          };
        },
      );

      // Email notification to business owner
      await this.mailService.accountRestorationEmail(business_owner, data);

      return {
        statusCode: 200,
        message: 'Business owner has been unsuspended successfully.',
      };
    } catch (error) {
      TransactionError(error, this.logger);
    }
  }

  /**
   * Fetch business owners
   * @param req
   * @returns
   */
  async fetchBusinessOwners(
    req: AuthPayload & Request,
    filterBusinessOwnerDto: FilterBusinessOwnerDto,
  ): Promise<PagePayload<User>> {
    const auth = req.user;

    // Check if user is part of the owner's administrators  (TODO)

    // Invoke pagination filters
    const pagination_filters = pageFilter(filterBusinessOwnerDto);

    const filters: Prisma.UserWhereInput & TZ = {
      ...(filterBusinessOwnerDto.q && {
        OR: [
          {
            name: {
              contains: filterBusinessOwnerDto.q,
              mode: 'insensitive',
            },
          },
        ],
      }),
      role: { role_id: Role.BUSINESS_SUPER_ADMIN },
      ...pagination_filters.filters,
      tz: req.timezone,
    };

    const select: Prisma.UserSelect = {
      ...this.businessOwnerSelect,
      email: true,
    };

    const [users, total] = await Promise.all([
      this.userRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.userRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: users,
      count: total,
    };
  }

  /**
   * Delete a business account
   * Forbid if business already has a purchase
   */
  async deleteBusiness(
    req: AuthPayload & Request,
    param: { id: string },
  ): Promise<GenericPayload> {
    const auth = req.user;
    const businessId = param.id;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Ensure business exists and belongs to the user
      const business = await prisma.businessInformation.findUnique({
        where: { id: businessId, user_id: auth.sub },
      });
      if (!business) {
        throw new NotFoundException('Business not found.');
      }

      // 2. Forbid if business has any purchases (payments)
      const purchaseCount = await prisma.payment.count({
        where: {
          OR: [
            { purchase: { path: ['business_id'], equals: businessId } },
            { subscription_plan: { business_id: businessId } },
          ],
        },
      });
      if (purchaseCount > 0) {
        throw new ForbiddenException('Cannot delete business with purchases.');
      }

      // 3. Soft delete the business
      await prisma.businessInformation.update({
        where: { id: businessId },
        data: { deleted_at: new Date() },
      });

      // 4. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.BUSINESS_ONBOARDING,
          entity: 'BusinessInformation',
          entity_id: businessId,
          metadata: `User with ID ${auth.sub} deleted business ID ${businessId}.`,
          ip_address: getIpAddress(req),
          user_agent: getUserAgent(req),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Business deleted successfully.',
      };
    });
  }

  /**
   * Import users to a business
   * @param req
   * @param importDto
   * @returns
   */
  async importBusinessUsers(
    req: AuthPayload & Request,
    importDto: ImportBusinessUsersDto,
  ): Promise<GenericPayload> {
    const auth = req.user;

    const users = importDto.users;
    if (!users.length) {
      throw new BadRequestException('No users found to import.');
    }
    return this.prisma.$transaction(async (prisma) => {
      // 1. Ensure business exists and belongs to the user
      const business = await prisma.businessInformation.findUnique({
        where: { id: req['Business-Id'], user_id: auth.sub },
      });
      if (!business) {
        throw new NotFoundException('Business not found.');
      }
      const results = [];
      let total_new_results = 0;
      for (const userData of users) {
        let user = await prisma.user.findFirst({
          where: { OR: [{ email: userData.email }, { phone: userData.phone }] },
        });

        const role_details = await prisma.role.findFirst({
          where: { role_id: userData.role },
        });

        if (!role_details) {
          throw new NotFoundException('Role not found.');
        }

        if (!user) {
          user = await prisma.user.create({
            data: {
              name: userData.name,
              email: userData.email,
              ...(userData.role && { role_identity: role_details.id }),
              ...(userData.phone && { phone: userData.phone }),
              is_first_signup: true,
            },
          });

          total_new_results += 1;
        } else if (userData.phone && !user.phone) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { phone: userData.phone },
          });
        }
        // Link user to business via BusinessContact
        let contact = await prisma.businessContact.findFirst({
          where: { business_id: req['Business-Id'], user_id: user.id },
        });
        if (!contact) {
          contact = await prisma.businessContact.create({
            data: {
              business_id: req['Business-Id'],
              user_id: user.id,
              email: user.email,
              name: user.name,
              is_owner: false,
              status: 'active',
              role: userData.role || Role.USER,
              joined_via: JoinedVia.IMPORT,
            },
          });
        }
        results.push({ user, contact });
      }
      // Log the import action
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_CONTACT,
          entity: 'BusinessContact',
          entity_id: req['Business-Id'],
          metadata: `Imported ${results.length} users to business ${req['Business-Id']}`,
          ip_address: getIpAddress(req),
          user_agent: getUserAgent(req),
        },
        prisma.log,
      );
      return {
        statusCode: HttpStatus.OK,
        message: `Imported ${total_new_results} user(s) to business successfully.`,
      };
    });
  }

  /**
   * Export users of a business
   * @param req
   * @param query
   * @returns
   */
  async exportBusinessUsers(
    req: AuthPayload & Request,
    query: ExportBusinessUsersDto,
  ): Promise<any> {
    const auth = req.user;

    const business = await this.prisma.businessInformation.findUnique({
      where: { id: req['Business-Id'], user_id: auth.sub },
    });
    if (!business) {
      throw new NotFoundException('Business not found.');
    }

    const customers = await this.prisma.user.findMany({
      where: {
        OR: [
          {
            payments: {
              some: {
                purchase: {
                  path: ['business_id'],
                  equals: req['Business-Id'],
                },
              },
            },
          },
          {
            payments: {
              some: {
                subscription_plan: {
                  business_id: req['Business-Id'],
                },
              },
            },
          },
          {
            business_contacts: {
              some: {
                business_id: req['Business-Id'],
                status: 'active',
                ...(query.role && { role: query.role }),
              },
            },
          },
        ],
      },
      take: 100,
      include: { role: true, business_contacts: true },
    });
    const users = customers.map((customer) => ({
      name: customer.name || 'N/A',
      email: customer.email,
      phone: customer.phone || 'N/A',
      role: customer.role.role_id,
      joined_at: customer.created_at,
    }));

    // Handle all formats (JSON, CSV, XLSX) with file upload
    let fileBuffer: Buffer;
    let fileName: string;
    let mimeType: string;

    if (query.format === 'json') {
      // Convert to JSON file
      const jsonContent = JSON.stringify(
        {
          users,
        },
        null,
        2,
      );

      fileBuffer = Buffer.from(jsonContent, 'utf-8');
      fileName = `business-users-${business.business_name}-${Date.now()}.json`;
      mimeType = 'application/json';
    } else if (query.format === 'csv') {
      // Convert to CSV
      const csvHeaders = ['name', 'email', 'phone', 'role', 'joined_at'];
      const csvRows = users.map((user) => [
        user.name,
        user.email,
        user.phone,
        user.role,
        user.joined_at ? new Date(user.joined_at).toISOString() : 'N/A',
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map((row) => row.map((field) => `"${field}"`).join(','))
        .join('\n');

      fileBuffer = Buffer.from(csvContent, 'utf-8');
      fileName = `business-users-${business.business_name}-${Date.now()}.csv`;
      mimeType = 'text/csv';
    } else {
      // Default to XLSX
      const worksheet = XLSX.utils.json_to_sheet(users);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
      fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      fileName = `business-users-${business.business_name}-${Date.now()}.xlsx`;
      mimeType =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    // Upload to S3
    const mockFile = {
      buffer: fileBuffer,
      originalname: fileName,
      mimetype: mimeType,
    } as Express.Multer.File;

    const uploadResult = await this.uploadService.uploadFile(req, mockFile);

    // Log the export action
    await this.logService.createLog({
      user_id: auth.sub,
      action: Action.MANAGE_CONTACT,
      entity: 'BusinessContact',
      entity_id: req['Business-Id'],
      metadata: `Exported ${users.length} users from business ${req['Business-Id']}${query.role ? ` (filtered by role: ${query.role})` : ''} to ${query.format || 'xlsx'}`,
      ip_address: getIpAddress(req),
      user_agent: getUserAgent(req),
    });

    return {
      success: true,
      message: `Successfully exported ${users.length} users${query.role ? ` with role: ${query.role}` : ''} to ${query.format || 'xlsx'}`,
      data: {
        download_url: uploadResult.data.url,
        total: users.length,
        format: query.format || 'xlsx',
        role_filter: query.role || 'all',
        file_name: fileName,
      },
    };
  }

  /**
   * Add a new customer to a business contact - public endpoint
   * @param req
   * @param dto
   * @returns
   */
  async addCustomer(
    req: Request,
    dto: AddCustomerDto,
  ): Promise<
    GenericPayloadAlias<{
      customer_id: string;
      contact_id: string;
      business_name: string;
    }>
  > {
    const { generatedPassword, user, business, owner, businessContact } =
      await this.prisma.$transaction(async (prisma) => {
        // 1. Ensure business exists
        const business = await prisma.businessInformation.findUnique({
          where: { id: dto.business_id },
        });

        // Send notification to business owner
        const owner = await prisma.user.findUnique({
          where: { id: business.user_id },
        });

        if (!business) {
          throw new NotFoundException('Business not found.');
        }

        // 2. Check if user already exists with this email or phone
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [{ email: dto.email }, { phone: dto.phone }],
          },
          include: { role: true },
        });

        // 3. Check if business contact already exists for this business and email
        const existingContact = await prisma.businessContact.findFirst({
          where: {
            business_id: dto.business_id,
            email: dto.email,
          },
        });

        if (existingContact) {
          throw new BadRequestException(
            'Customer already exists for this business.',
          );
        }

        // 4. Get the USER role
        const userRole = await prisma.role.findFirst({
          where: { role_id: Role.USER },
        });

        if (!userRole) {
          throw new NotFoundException('User role not found.');
        }

        let generatedPassword: string | undefined;
        let user = existingUser;

        // 5. Create user if doesn't exist
        if (!user) {
          // Generate a random password
          generatedPassword =
            Math.random().toString(36).slice(-10) +
            Math.random().toString(36).slice(-2);

          user = await prisma.user.create({
            data: {
              name: dto.name,
              email: dto.email,
              phone: dto.phone,
              role_identity: userRole.id,
              is_first_signup: true,
              password_hash: await bcrypt.hash(generatedPassword, 10), // You should hash this in production!
            },
            include: { role: true },
          });
        } else {
          // Update user if exists but doesn't have phone
          if (!user.phone) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { phone: dto.phone },
              include: { role: true },
            });
          }
        }

        // 6. Create business contact
        const businessContact = await prisma.businessContact.create({
          data: {
            business_id: dto.business_id,
            user_id: user.id,
            email: dto.email,
            name: dto.name,
            is_owner: false,
            status: MemberStatus.active,
            role: Role.USER,
            joined_via: JoinedVia.SOCIAL_MEDIA, // Since this is a public endpoint
          },
        });

        // 8. Log the action
        await this.logService.createWithTrx(
          {
            user_id: user.id,
            action: Action.MANAGE_CONTACT,
            entity: 'BusinessContact',
            entity_id: businessContact.id,
            metadata: `Customer ${dto.name} (${dto.email}) was added to business ${business.business_name} via public endpoint.`,
            ip_address: getIpAddress(req),
            user_agent: getUserAgent(req),
          },
          prisma.log,
        );

        return {
          generatedPassword,
          user,
          business,
          owner,
          businessContact,
        };
      });

    // 6.5. Send onboarding emails
    // Send to customer (only if new user)
    if (generatedPassword) {
      const loginUrl = `${process.env.BUSINESS_FRONTEND_URL}/auth/signin`;
      const business_page = `${this.configService.get<string>('FRONTEND_URL')}/store/${business.id}`;
      await this.mailService.onboardCustomerEmailWithCredentials(
        user,
        business.business_name,
        user.email,
        generatedPassword,
        loginUrl,
        business_page,
      );
    }

    if (owner) {
      await this.mailService.onboardCustomerNotification(
        owner,
        shortenId(user.id),
        user.name,
        business.business_name,
      );
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Customer added successfully to business.',
      data: {
        customer_id: user.id,
        contact_id: businessContact.id,
        business_name: business.business_name,
      },
    };
  }

  /**
   * Upsert KYC for the current user (business or user)
   * @param req
   * @param dto
   */
  async upsertKyc(
    req: AuthPayload & Request,
    dto: UpsertKycDto,
  ): Promise<GenericPayload> {
    const userId = req.user.sub;
    // Try to find the business for the current user
    const business = await this.prisma.businessInformation.findFirst({
      where: { id: req['Business-Id'] },
      select: {
        id: true,
        business_name: true,
        user: { select: { id: true, email: true, role: true } },
        onboarding_status: true,
      },
    });
    let kyc: any = null;
    let kycCreate: any;
    let kycUpdate: any;
    let notifyUser: any;
    let businessName: string | undefined = undefined;
    let businessId: string | undefined = undefined;
    if (business) {
      // Find existing KYC for this business
      kyc = await this.prisma.kyc.findFirst({
        where: { business_id: business.id },
      });
      kycCreate = {
        ...dto,
        business_id: business.id,
        is_approved: false,
        disapproval_reason: null,
      };
      kycUpdate = {
        ...dto,
        is_approved: false,
        disapproval_reason: null,
        reviewed_by: null,
      };
      notifyUser = business.user;
      businessName = business.business_name;
      businessId = business.id;
    } else {
      // Find existing KYC for this user
      kyc = await this.prisma.kyc.findFirst({ where: { user_id: userId } });
      kycCreate = {
        ...dto,
        user_id: userId,
        is_approved: false,
        disapproval_reason: null,
      };
      kycUpdate = { ...dto, is_approved: false, disapproval_reason: null };
      notifyUser = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });
    }

    if (kyc) {
      await this.prisma.kyc.update({
        where: { id: kyc.id },
        data: kycUpdate,
      });
    } else {
      await this.prisma.kyc.create({
        data: kycCreate,
      });
    }

    // Update onboarding status
    if (business.onboarding_status.current_step < 2) {
      await this.prisma.onboardingStatus.upsert({
        where: {
          user_id_business_id: { user_id: userId, business_id: business.id },
        },
        create: {
          user_id: userId,
          business_id: business.id,
          is_completed: true,
          current_step: 2,
        },
        update: {
          is_completed: true,
          current_step: 2,
        },
      });
    }

    // Find all super admins
    const superAdmins = await this.prisma.user.findMany({
      where: { role: { role_id: Role.OWNER_SUPER_ADMIN } },
      select: {
        id: true,
        name: true,
        email: true,
        password_hash: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        phone: true,
        is_email_verified: true,
        is_phone_verified: true,
        suspended_by: true,
        suspended_at: true,
        suspension_reason: true,
        alternative_phone: true,
        role_identity: true,
        is_suspended: true,
        referral_source: true,
      },
    });

    // Send email to each super admin
    for (const admin of superAdmins) {
      await this.mailService.kycSubmitted(
        {
          ...admin,
        },
        {
          business_name: businessName || '',
          business_id: businessId || '',
          user_id: `${shortenId(notifyUser.id)}`,
          email: notifyUser.email,
        },
      );
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'KYC information saved successfully.',
    };
  }

  /**
   * Fetch KYC for the current user (business or user)
   * @param req
   */
  async fetchKyc(req: AuthPayload & Request): Promise<GenericDataPayload<any>> {
    const userId = req.user.sub;
    const role = req.user.role;
    // Try to find the business for the current user

    let kyc;
    if (role === Role.BUSINESS_SUPER_ADMIN) {
      kyc = await this.prisma.kyc.findFirst({
        where: { business_id: req['Business-Id'] },
      });
    } else {
      kyc = await this.prisma.kyc.findFirst({ where: { user_id: userId } });
    }
    return {
      statusCode: HttpStatus.OK,
      data: kyc,
    };
  }

  /**
   * Fetch submitted KYC (business)
   * @param req
   */
  async fetchSubmittedKyc(
    req: AuthPayload & Request,
    paramDto: BusinessDto,
  ): Promise<GenericDataPayload<any>> {
    const { business_id } = paramDto;

    const all_kyc = await this.prisma.kyc.findMany({
      where: { business_id },
    });

    return {
      statusCode: HttpStatus.OK,
      data: all_kyc,
    };
  }

  /**
   * Approve or reject a KYC by kyc_id
   * @param req
   * @param kyc_id
   * @param dto
   */
  async reviewKyc(
    req: AuthPayload & Request,
    kyc_id: string,
    dto: ReviewKycDto,
  ): Promise<GenericPayload> {
    // Find the KYC record by id
    const kyc = await this.prisma.kyc.findUnique({
      where: { id: kyc_id },
      include: {
        business: { include: { user: { include: { role: true } } } },
        user: { include: { role: true } },
      },
    });

    if (!kyc) {
      throw new NotFoundException('KYC record not found.');
    }
    if (kyc.is_approved) {
      throw new BadRequestException('Kyc has already been approved.');
    }

    // Ensure reviewer exists
    const reviewer = await this.prisma.user.findUnique({
      where: { id: req.user.sub },
    });
    if (!reviewer) {
      throw new NotFoundException('Reviewer (user) not found.');
    }

    await this.prisma.$transaction(async (prisma) => {
      // Update the KYC record
      await prisma.kyc.update({
        where: { id: kyc_id },
        data: {
          is_approved: dto.is_approved,
          disapproval_reason: dto.is_approved ? null : dto.disapproval_reason,
          reviewed_by: req.user.sub,
          reviewed_at: new Date(),
        },
      });
    });

    // Determine the user to notify
    const notifyUser = kyc.user || (kyc.business ? kyc.business.user : null);
    const businessName = kyc.business ? kyc.business.business_name : undefined;

    // Send email to user
    if (dto.is_approved) {
      await this.mailService.kycApproved(notifyUser);
      // Send push notification
      await this.notificationDispatchService.sendPush(
        notifyUser.id,
        'KYC Approved',
        businessName
          ? `Your KYC for ${businessName} has been approved.`
          : `Your KYC has been approved.`,
        '',
        notifyUser,
      );
    } else {
      await this.mailService.kycRejected(notifyUser, {
        reason: dto.disapproval_reason,
      });
    }

    // Send in-app notification
    const notificationMessage = dto.is_approved
      ? businessName
        ? `Your KYC for ${businessName} has been approved.`
        : `Your KYC has been approved.`
      : businessName
        ? `Your KYC for ${businessName} was rejected. Reason: ${dto.disapproval_reason}`
        : `Your KYC was rejected. Reason: ${dto.disapproval_reason}`;
    await this.prisma.notification.create({
      data: {
        owner_id: notifyUser.id,
        title: 'KYC Review Update',
        message: notificationMessage,
        type: NotificationType.PUSH,
        read: false,
        business_id: kyc.business_id,
      },
    });
    return {
      statusCode: HttpStatus.OK,
      message: dto.is_approved
        ? 'KYC approved and user notified.'
        : 'KYC rejected and user notified.',
    };
  }

  /**
   * Update onboarding process
   * @param req
   * @param updateBusinessProcessesDto
   * @returns
   */
  async updateOnboardingProcess(
    req: AuthPayload & Request,
    updateBusinessProcessesDto: UpdateBusinessProcessesDto,
  ) {
    const { process } = updateBusinessProcessesDto;

    const { updated } = await this.prisma.$transaction(async (prisma) => {
      // Get onboarding details of the business
      const onboarding_status = await prisma.onboardingStatus.findFirst({
        where: {
          business_id: req['Business-Id'],
        },
      });

      const processes =
        (onboarding_status.onboard_processes as Array<string>) ?? [];
      // Check if a process has been recorded
      const recorded_process = processes.filter(
        (onboard_process) => onboard_process === process,
      );
      if (Boolean(recorded_process.length)) {
        throw new ConflictException(
          `Process ${process.toLowerCase()} already exists.`,
        );
      }

      const onboard_processes = [...processes, process];

      // Update onboarding status
      const updated = await prisma.onboardingStatus.update({
        where: { id: onboarding_status.id },
        data: {
          onboard_processes,
        },
        select: { onboard_processes: true },
      });

      return { updated };
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Onboarding step updated successfully',
      data: updated,
    };
  }
}
