"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardService = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const generic_data_1 = require("../../generic/generic.data");
const log_service_1 = require("../../log/log.service");
const generic_utils_1 = require("../../generic/generic.utils");
const generic_utils_2 = require("../../generic/generic.utils");
const prisma_base_repository_1 = require("../../prisma/prisma.base.repository");
const paystack_provider_1 = require("../../generic/providers/paystack/paystack.provider");
const mail_service_1 = require("../../notification/mail/mail.service");
const generic_service_1 = require("../../generic/generic.service");
const upload_service_1 = require("../../multimedia/upload/upload.service");
const XLSX = require('xlsx');
const bcrypt = require("bcrypt");
const config_1 = require("@nestjs/config");
const cart_service_1 = require("../../cart/cart.service");
const dispatch_service_1 = require("../../notification/dispatch/dispatch.service");
let OnboardService = class OnboardService {
    constructor(prisma, logService, paystackService, mailService, genericService, uploadService, cartService, configService, logger, notificationDispatchService) {
        this.prisma = prisma;
        this.logService = logService;
        this.paystackService = paystackService;
        this.mailService = mailService;
        this.genericService = genericService;
        this.uploadService = uploadService;
        this.cartService = cartService;
        this.configService = configService;
        this.logger = logger;
        this.notificationDispatchService = notificationDispatchService;
        this.businessOwnerSelect = {
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
        this.onboardingStatusSelect = {
            onboard_processes: true,
            current_step: true,
            is_completed: true,
        };
        this.businessInformationSelect = {
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
        this.businessWalletSelect = {
            balance: true,
            previous_balance: true,
            currency: true,
            currency_url: true,
        };
        this.withdrawalAccountSelect = {
            account_number: true,
            account_type: true,
            bank_name: true,
            routing_number: true,
            country: true,
            country_code: true,
            currency: true,
            created_at: true,
        };
        this.businessInformationRepository = new prisma_base_repository_1.PrismaBaseRepository('businessInformation', prisma);
        this.businessWalletRepository = new prisma_base_repository_1.PrismaBaseRepository('businessWallet', prisma);
        this.onboardingStatusRepository = new prisma_base_repository_1.PrismaBaseRepository('onboardingStatus', prisma);
        this.withdrawalAccountRepository = new prisma_base_repository_1.PrismaBaseRepository('withdrawalAccount', prisma);
        this.userRepository = new prisma_base_repository_1.PrismaBaseRepository('user', prisma);
    }
    async saveBusinessInformation(req, saveBusinessInfoDto) {
        const auth = req.user;
        return await this.prisma.$transaction(async (prisma) => {
            const existingBusiness = await prisma.businessInformation.findUnique({
                where: {
                    user_id: { not: auth.sub },
                    business_name: saveBusinessInfoDto.business_name,
                },
            });
            if (existingBusiness) {
                throw new common_2.BadRequestException('Business name is already in use.');
            }
            const business = await prisma.businessInformation.upsert({
                where: {
                    user_id: auth.sub,
                    business_name: saveBusinessInfoDto.business_name,
                },
                create: {
                    ...saveBusinessInfoDto,
                    user: { connect: { id: auth.sub } },
                    social_media_handles: saveBusinessInfoDto.social_media_handles
                        ? JSON.parse(JSON.stringify(saveBusinessInfoDto.social_media_handles))
                        : undefined,
                },
                update: {
                    ...saveBusinessInfoDto,
                    social_media_handles: saveBusinessInfoDto.social_media_handles
                        ? JSON.parse(JSON.stringify(saveBusinessInfoDto.social_media_handles))
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
                await prisma.businessContact.create({
                    data: {
                        business_id: business.id,
                        user_id: auth.sub,
                        is_owner: true,
                        status: client_1.MemberStatus.active,
                        email: auth.email,
                        name: auth.name,
                    },
                });
            }
            const existingWallet = await prisma.businessWallet.findFirst({
                where: { business_id: business.id },
            });
            if (!existingWallet) {
                const allowed_currencies = await prisma.allowedCurrency.findMany({});
                const currencies = allowed_currencies.map((allowed_currency) => {
                    return {
                        business_id: business.id,
                        balance: new client_1.Prisma.Decimal(0.0),
                        previous_balance: new client_1.Prisma.Decimal(0.0),
                        currency: allowed_currency.currency,
                        currency_url: generic_data_1.currencyMap[allowed_currency.currency],
                    };
                });
                await prisma.businessWallet.createMany({
                    data: currencies,
                });
            }
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
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.BUSINESS_ONBOARDING,
                entity: 'BusinessInformation',
                entity_id: business.id,
                metadata: `User with email ${auth.sub} just onboarded their business (Step 1 of 3).`,
                ip_address: (0, generic_utils_2.getIpAddress)(req),
                user_agent: (0, generic_utils_1.getUserAgent)(req),
            }, prisma.log);
            return {
                statusCode: 200,
                message: 'Business information saved successfully.',
            };
        });
    }
    async fetchBusinesses(req) {
        const auth = req.user;
        const select = {
            ...this.businessInformationSelect,
        };
        const filter = {
            ...(auth.role === generic_data_1.Role.BUSINESS_SUPER_ADMIN && { user_id: auth.sub }),
            ...(auth.role === generic_data_1.Role.BUSINESS_ADMIN && {
                business_contacts: {
                    some: {
                        user_id: auth.sub,
                        role: generic_data_1.Role.BUSINESS_ADMIN,
                        status: 'active',
                    },
                },
            }),
            ...(auth.role === generic_data_1.Role.USER && {
                business_contacts: {
                    some: {
                        user_id: auth.sub,
                        role: generic_data_1.Role.USER,
                        status: 'active',
                    },
                },
            }),
            tz: req.timezone,
        };
        const businesses = await this.businessInformationRepository.findManyWithPagination(filter, {}, client_1.Prisma.SortOrder.desc, undefined, select);
        const payments = await this.prisma.payment.findMany({
            where: {
                OR: [
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
        const purchasedBusinessIds = new Set();
        for (const p of payments) {
            if (p.purchase &&
                typeof p.purchase === 'object' &&
                'business_id' in p.purchase) {
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
            statusCode: common_1.HttpStatus.OK,
            data: businessesWithPurchase,
        };
    }
    async fetchBusinessInformation(req, param) {
        const auth = req.user;
        const select = {
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
        const filter = {
            ...(auth.role === generic_data_1.Role.BUSINESS_SUPER_ADMIN && { user_id: auth.sub }),
            id: param.id,
            tz: req.timezone,
        };
        const business = await this.businessInformationRepository.findOne(filter, undefined, select);
        if (!business) {
            throw new common_1.NotFoundException('Business information not found.');
        }
        return {
            statusCode: 200,
            message: 'Business information retrieved successfully.',
            data: business,
        };
    }
    async findBusinessInformation(req, businessNameDto) {
        const auth = req.user;
        const filter = {
            business_name: businessNameDto.business_name,
        };
        const business = await this.businessInformationRepository.findOne(filter);
        if (business) {
            throw new common_1.NotFoundException('Business name exists.');
        }
        return {
            statusCode: 200,
            message: 'Business name is available.',
        };
    }
    async saveWithdrawalAccount(req, dto) {
        const auth = req.user;
        return await this.prisma.$transaction(async (prisma) => {
            const business = await prisma.businessInformation.findUnique({
                where: { id: dto.business_id, user_id: auth.sub },
                include: {
                    withdrawal_account: true,
                },
            });
            if (!business) {
                throw new common_1.NotFoundException('Business not found.');
            }
            const account = await this.paystackService.resolveAccountNumber(dto.account_number, dto.bank_code);
            const encrypted_recipient_code = this.genericService.encrypt(account.data.recipient_code);
            if (!account) {
                throw new common_2.BadRequestException('Invalid account number or bank code.');
            }
            let withdrawalAccount;
            if (business.withdrawal_account) {
                const existingAccount = await prisma.withdrawalAccount.findUnique({
                    where: { id: business.withdrawal_account.id },
                });
                if (!existingAccount) {
                    throw new common_1.NotFoundException('Withdrawal account not found.');
                }
                withdrawalAccount = await prisma.withdrawalAccount.update({
                    where: { id: business.withdrawal_account.id },
                    data: {
                        account_number: dto.account_number,
                        ...(dto.account_type && { account_type: dto.account_type }),
                        bank_name: dto.bank_name,
                        bank_code: dto.bank_code,
                        routing_number: dto.routing_number,
                        country: dto.country || existingAccount.country,
                        recipient_code: encrypted_recipient_code,
                    },
                });
                await this.logService.createWithTrx({
                    user_id: auth.sub,
                    action: client_1.Action.WITHDRAWAL_ACCOUNT,
                    entity: 'WithdrawalAccount',
                    entity_id: withdrawalAccount.id,
                    metadata: `User updated a withdrawal account (${withdrawalAccount.account_number}) for business ID ${business.id}.`,
                    ip_address: (0, generic_utils_2.getIpAddress)(req),
                    user_agent: (0, generic_utils_1.getUserAgent)(req),
                }, prisma.log);
            }
            else {
                withdrawalAccount = await prisma.withdrawalAccount.create({
                    data: {
                        business_id: dto.business_id,
                        account_number: dto.account_number,
                        account_type: dto.account_type,
                        bank_name: dto.bank_name,
                        bank_code: dto.bank_code,
                        routing_number: dto.routing_number,
                        country: dto.country || 'Nigeria',
                        recipient_code: encrypted_recipient_code,
                    },
                });
                await this.logService.createWithTrx({
                    user_id: auth.sub,
                    action: client_1.Action.WITHDRAWAL_ACCOUNT,
                    entity: 'WithdrawalAccount',
                    entity_id: withdrawalAccount.id,
                    metadata: `User added a new withdrawal account (${withdrawalAccount.account_number}) for business ID ${business.id}.`,
                    ip_address: (0, generic_utils_2.getIpAddress)(req),
                    user_agent: (0, generic_utils_1.getUserAgent)(req),
                }, prisma.log);
            }
            const existingOnboardingStatus = await prisma.onboardingStatus.findUnique({
                where: {
                    user_id_business_id: {
                        user_id: auth.sub,
                        business_id: business.id,
                    },
                },
            });
            if (!existingOnboardingStatus ||
                existingOnboardingStatus.current_step < 3) {
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
                        current_step: 3,
                    },
                    update: {
                        current_step: 3,
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
    async viewBusinessInformationPublic(req, param) {
        const { onboarding_status, ...selectWithoutOnboarding } = this.businessInformationSelect;
        const select = {
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
            throw new common_1.NotFoundException('Business information not found.');
        }
        return {
            statusCode: 200,
            message: 'Business information retrieved successfully.',
            data: business,
        };
    }
    async fetchAllBusinesses(req, filterBusinessDto) {
        const auth = req.user;
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterBusinessDto);
        const filters = {
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
        const select = {
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
            this.businessInformationRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select, filterBusinessDto.deleted),
            this.businessInformationRepository.count(filters, filterBusinessDto.deleted),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: businesses,
            count: total,
        };
    }
    async fetchBusinessDetails(req, param) {
        const select = {
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
        const filter = {
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
                    payment_status: client_1.PaymentStatus.SUCCESS,
                    OR: [
                        {
                            purchase: {
                                path: ['business_id'],
                                string_contains: param.id,
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
                    payment_status: client_1.PaymentStatus.SUCCESS,
                    purchase: {
                        path: ['business_id'],
                        string_contains: param.id,
                    },
                },
            }),
        ]);
        if (!business) {
            throw new common_1.NotFoundException('Business information not found.');
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
    async suspendBusinessOwner(req, param, suspendBusinessOwnerDto) {
        const auth = req.user;
        const { suspension_reason } = suspendBusinessOwnerDto;
        try {
            const { business_owner, data } = await this.prisma.$transaction(async (prisma) => {
                const business_owner = await prisma.user.findUnique({
                    where: {
                        id: param.user_id,
                        role: {
                            role_id: generic_data_1.Role.BUSINESS_SUPER_ADMIN,
                        },
                    },
                });
                if (!business_owner) {
                    throw new common_1.NotFoundException('Business owner not found.');
                }
                if (business_owner.is_suspended) {
                    throw new common_2.BadRequestException('Business account has already been suspended.');
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
                const metadata = `Admin with email ${req.user.email} has suspended business owner ID ${business_owner.id}.`;
                await this.logService.createWithTrx({
                    user_id: auth.sub,
                    action: client_1.Action.SUSPEND_UNSUSPEND_BUSINESS,
                    entity: 'User',
                    entity_id: business_owner.id,
                    metadata,
                    ip_address: (0, generic_utils_2.getIpAddress)(req),
                    user_agent: (0, generic_utils_1.getUserAgent)(req),
                }, prisma.log);
                return {
                    business_owner,
                    data: {
                        account_id: (0, generic_utils_1.shortenId)(business_owner.id),
                        suspension_reason,
                    },
                };
            });
            await this.mailService.accountSuspensionEmail(business_owner, data);
            return {
                statusCode: 200,
                message: 'Business owner has been suspended successfully.',
            };
        }
        catch (error) {
            (0, generic_utils_1.TransactionError)(error, this.logger);
        }
    }
    async unsuspendBusinessOwner(req, param) {
        const auth = req.user;
        try {
            const { business_owner, data } = await this.prisma.$transaction(async (prisma) => {
                const business_owner = await prisma.user.findUnique({
                    where: {
                        id: param.user_id,
                        role: {
                            role_id: generic_data_1.Role.BUSINESS_SUPER_ADMIN,
                        },
                    },
                });
                if (!business_owner) {
                    throw new common_1.NotFoundException('Business owner not found.');
                }
                if (!business_owner.is_suspended) {
                    throw new common_2.BadRequestException('Business account has already been unsuspended.');
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
                const metadata = `Admin with email ${req.user.email} has unsuspended business owner ID ${business_owner.id}.`;
                await this.logService.createWithTrx({
                    user_id: auth.sub,
                    action: client_1.Action.SUSPEND_UNSUSPEND_BUSINESS,
                    entity: 'User',
                    entity_id: business_owner.id,
                    metadata,
                    ip_address: (0, generic_utils_2.getIpAddress)(req),
                    user_agent: (0, generic_utils_1.getUserAgent)(req),
                }, prisma.log);
                return {
                    business_owner,
                    data: {
                        account_id: (0, generic_utils_1.shortenId)(business_owner.id),
                    },
                };
            });
            await this.mailService.accountRestorationEmail(business_owner, data);
            return {
                statusCode: 200,
                message: 'Business owner has been unsuspended successfully.',
            };
        }
        catch (error) {
            (0, generic_utils_1.TransactionError)(error, this.logger);
        }
    }
    async fetchBusinessOwners(req, filterBusinessOwnerDto) {
        const auth = req.user;
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterBusinessOwnerDto);
        const filters = {
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
            role: { role_id: generic_data_1.Role.BUSINESS_SUPER_ADMIN },
            ...pagination_filters.filters,
            tz: req.timezone,
        };
        const select = {
            ...this.businessOwnerSelect,
            email: true,
        };
        const [users, total] = await Promise.all([
            this.userRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.userRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: users,
            count: total,
        };
    }
    async deleteBusiness(req, param) {
        const auth = req.user;
        const businessId = param.id;
        return this.prisma.$transaction(async (prisma) => {
            const business = await prisma.businessInformation.findUnique({
                where: { id: businessId, user_id: auth.sub },
            });
            if (!business) {
                throw new common_1.NotFoundException('Business not found.');
            }
            const purchaseCount = await prisma.payment.count({
                where: {
                    OR: [
                        { purchase: { path: ['business_id'], string_contains: businessId } },
                        { subscription_plan: { business_id: businessId } },
                    ],
                },
            });
            if (purchaseCount > 0) {
                throw new common_1.ForbiddenException('Cannot delete business with purchases.');
            }
            await prisma.businessInformation.update({
                where: { id: businessId },
                data: { deleted_at: new Date() },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.BUSINESS_ONBOARDING,
                entity: 'BusinessInformation',
                entity_id: businessId,
                metadata: `User with ID ${auth.sub} deleted business ID ${businessId}.`,
                ip_address: (0, generic_utils_2.getIpAddress)(req),
                user_agent: (0, generic_utils_1.getUserAgent)(req),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Business deleted successfully.',
            };
        });
    }
    async importBusinessUsers(req, importDto) {
        const auth = req.user;
        const users = importDto.users;
        if (!users.length) {
            throw new common_2.BadRequestException('No users found to import.');
        }
        return this.prisma.$transaction(async (prisma) => {
            const business = await prisma.businessInformation.findUnique({
                where: { id: req['Business-Id'], user_id: auth.sub },
            });
            if (!business) {
                throw new common_1.NotFoundException('Business not found.');
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
                    throw new common_1.NotFoundException('Role not found.');
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
                }
                else if (userData.phone && !user.phone) {
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: { phone: userData.phone },
                    });
                }
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
                            role: userData.role || generic_data_1.Role.USER,
                            joined_via: client_1.JoinedVia.IMPORT,
                        },
                    });
                }
                results.push({ user, contact });
            }
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_CONTACT,
                entity: 'BusinessContact',
                entity_id: req['Business-Id'],
                metadata: `Imported ${results.length} users to business ${req['Business-Id']}`,
                ip_address: (0, generic_utils_2.getIpAddress)(req),
                user_agent: (0, generic_utils_1.getUserAgent)(req),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: `Imported ${total_new_results} user(s) to business successfully.`,
            };
        });
    }
    async exportBusinessUsers(req, query) {
        const auth = req.user;
        const business = await this.prisma.businessInformation.findUnique({
            where: { id: req['Business-Id'], user_id: auth.sub },
        });
        if (!business) {
            throw new common_1.NotFoundException('Business not found.');
        }
        const customers = await this.prisma.user.findMany({
            where: {
                OR: [
                    {
                        payments: {
                            some: {
                                purchase: {
                                    path: ['business_id'],
                                    string_contains: req['Business-Id'],
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
        let fileBuffer;
        let fileName;
        let mimeType;
        if (query.format === 'json') {
            const jsonContent = JSON.stringify({
                users,
            }, null, 2);
            fileBuffer = Buffer.from(jsonContent, 'utf-8');
            fileName = `business-users-${business.business_name}-${Date.now()}.json`;
            mimeType = 'application/json';
        }
        else if (query.format === 'csv') {
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
        }
        else {
            const worksheet = XLSX.utils.json_to_sheet(users);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
            fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            fileName = `business-users-${business.business_name}-${Date.now()}.xlsx`;
            mimeType =
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        }
        const mockFile = {
            buffer: fileBuffer,
            originalname: fileName,
            mimetype: mimeType,
        };
        const uploadResult = await this.uploadService.uploadFile(req, mockFile);
        await this.logService.createLog({
            user_id: auth.sub,
            action: client_1.Action.MANAGE_CONTACT,
            entity: 'BusinessContact',
            entity_id: req['Business-Id'],
            metadata: `Exported ${users.length} users from business ${req['Business-Id']}${query.role ? ` (filtered by role: ${query.role})` : ''} to ${query.format || 'xlsx'}`,
            ip_address: (0, generic_utils_2.getIpAddress)(req),
            user_agent: (0, generic_utils_1.getUserAgent)(req),
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
    async addCustomer(req, dto) {
        const { generatedPassword, user, business, owner, businessContact } = await this.prisma.$transaction(async (prisma) => {
            const business = await prisma.businessInformation.findUnique({
                where: { id: dto.business_id },
            });
            const owner = await prisma.user.findUnique({
                where: { id: business.user_id },
            });
            if (!business) {
                throw new common_1.NotFoundException('Business not found.');
            }
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [{ email: dto.email }, { phone: dto.phone }],
                },
                include: { role: true },
            });
            const existingContact = await prisma.businessContact.findFirst({
                where: {
                    business_id: dto.business_id,
                    email: dto.email,
                },
            });
            if (existingContact) {
                throw new common_2.BadRequestException('Customer already exists for this business.');
            }
            const userRole = await prisma.role.findFirst({
                where: { role_id: generic_data_1.Role.USER },
            });
            if (!userRole) {
                throw new common_1.NotFoundException('User role not found.');
            }
            let generatedPassword;
            let user = existingUser;
            if (!user) {
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
                        password_hash: await bcrypt.hash(generatedPassword, 10),
                    },
                    include: { role: true },
                });
            }
            else {
                if (!user.phone) {
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: { phone: dto.phone },
                        include: { role: true },
                    });
                }
            }
            const businessContact = await prisma.businessContact.create({
                data: {
                    business_id: dto.business_id,
                    user_id: user.id,
                    email: dto.email,
                    name: dto.name,
                    is_owner: false,
                    status: client_1.MemberStatus.active,
                    role: generic_data_1.Role.USER,
                    joined_via: client_1.JoinedVia.SOCIAL_MEDIA,
                },
            });
            await this.logService.createWithTrx({
                user_id: user.id,
                action: client_1.Action.MANAGE_CONTACT,
                entity: 'BusinessContact',
                entity_id: businessContact.id,
                metadata: `Customer ${dto.name} (${dto.email}) was added to business ${business.business_name} via public endpoint.`,
                ip_address: (0, generic_utils_2.getIpAddress)(req),
                user_agent: (0, generic_utils_1.getUserAgent)(req),
            }, prisma.log);
            return {
                generatedPassword,
                user,
                business,
                owner,
                businessContact,
            };
        });
        if (generatedPassword) {
            const loginUrl = `${process.env.BUSINESS_FRONTEND_URL}/auth/signin`;
            const business_page = `${this.configService.get('FRONTEND_URL')}/store/${business.id}`;
            await this.mailService.onboardCustomerEmailWithCredentials(user, business.business_name, user.email, generatedPassword, loginUrl, business_page);
        }
        if (owner) {
            await this.mailService.onboardCustomerNotification(owner, (0, generic_utils_1.shortenId)(user.id), user.name, business.business_name);
        }
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Customer added successfully to business.',
            data: {
                customer_id: user.id,
                contact_id: businessContact.id,
                business_name: business.business_name,
            },
        };
    }
    async upsertKyc(req, dto) {
        const userId = req.user.sub;
        const business = await this.prisma.businessInformation.findFirst({
            where: { id: req['Business-Id'] },
            select: {
                id: true,
                business_name: true,
                user: { select: { id: true, email: true, role: true } },
                onboarding_status: true,
            },
        });
        let kyc = null;
        let kycCreate;
        let kycUpdate;
        let notifyUser;
        let businessName = undefined;
        let businessId = undefined;
        if (business) {
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
        }
        else {
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
        }
        else {
            await this.prisma.kyc.create({
                data: kycCreate,
            });
        }
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
        const superAdmins = await this.prisma.user.findMany({
            where: { role: { role_id: generic_data_1.Role.OWNER_SUPER_ADMIN } },
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
        for (const admin of superAdmins) {
            await this.mailService.kycSubmitted({
                ...admin,
            }, {
                business_name: businessName || '',
                business_id: businessId || '',
                user_id: `${(0, generic_utils_1.shortenId)(notifyUser.id)}`,
                email: notifyUser.email,
            });
        }
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'KYC information saved successfully.',
        };
    }
    async fetchKyc(req) {
        const userId = req.user.sub;
        const role = req.user.role;
        let kyc;
        if (role === generic_data_1.Role.BUSINESS_SUPER_ADMIN) {
            kyc = await this.prisma.kyc.findFirst({
                where: { business_id: req['Business-Id'] },
            });
        }
        else {
            kyc = await this.prisma.kyc.findFirst({ where: { user_id: userId } });
        }
        return {
            statusCode: common_1.HttpStatus.OK,
            data: kyc,
        };
    }
    async fetchSubmittedKyc(req, paramDto) {
        const { business_id } = paramDto;
        const all_kyc = await this.prisma.kyc.findMany({
            where: { business_id },
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            data: all_kyc,
        };
    }
    async reviewKyc(req, kyc_id, dto) {
        const kyc = await this.prisma.kyc.findUnique({
            where: { id: kyc_id },
            include: {
                business: { include: { user: { include: { role: true } } } },
                user: { include: { role: true } },
            },
        });
        if (!kyc) {
            throw new common_1.NotFoundException('KYC record not found.');
        }
        if (kyc.is_approved) {
            throw new common_2.BadRequestException('Kyc has already been approved.');
        }
        const reviewer = await this.prisma.user.findUnique({
            where: { id: req.user.sub },
        });
        if (!reviewer) {
            throw new common_1.NotFoundException('Reviewer (user) not found.');
        }
        await this.prisma.$transaction(async (prisma) => {
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
        const notifyUser = kyc.user || (kyc.business ? kyc.business.user : null);
        const businessName = kyc.business ? kyc.business.business_name : undefined;
        if (dto.is_approved) {
            await this.mailService.kycApproved(notifyUser);
            await this.notificationDispatchService.sendPush(notifyUser.id, 'KYC Approved', businessName
                ? `Your KYC for ${businessName} has been approved.`
                : `Your KYC has been approved.`, '', notifyUser);
        }
        else {
            await this.mailService.kycRejected(notifyUser, {
                reason: dto.disapproval_reason,
            });
        }
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
                type: client_1.NotificationType.PUSH,
                read: false,
                business_id: kyc.business_id,
            },
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: dto.is_approved
                ? 'KYC approved and user notified.'
                : 'KYC rejected and user notified.',
        };
    }
    async updateOnboardingProcess(req, updateBusinessProcessesDto) {
        const { process } = updateBusinessProcessesDto;
        const { updated } = await this.prisma.$transaction(async (prisma) => {
            const onboarding_status = await prisma.onboardingStatus.findFirst({
                where: {
                    business_id: req['Business-Id'],
                },
            });
            const processes = onboarding_status.onboard_processes ?? [];
            const recorded_process = processes.filter((onboard_process) => onboard_process === process);
            if (Boolean(recorded_process.length)) {
                throw new common_1.ConflictException(`Process ${process.toLowerCase()} already exists.`);
            }
            const onboard_processes = [...processes, process];
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
            statusCode: common_1.HttpStatus.OK,
            message: 'Onboarding step updated successfully',
            data: updated,
        };
    }
};
exports.OnboardService = OnboardService;
exports.OnboardService = OnboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_service_1.LogService,
        paystack_provider_1.PaystackService,
        mail_service_1.MailService,
        generic_service_1.GenericService,
        upload_service_1.UploadService,
        cart_service_1.CartService,
        config_1.ConfigService,
        common_1.Logger,
        dispatch_service_1.NotificationDispatchService])
], OnboardService);
//# sourceMappingURL=onboard.service.js.map