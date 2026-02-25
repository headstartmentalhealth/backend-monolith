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
exports.WithdrawService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const withdraw_dto_1 = require("./withdraw.dto");
const library_1 = require("@prisma/client/runtime/library");
const prisma_base_repository_1 = require("../prisma/prisma.base.repository");
const client_1 = require("@prisma/client");
const generic_utils_1 = require("../generic/generic.utils");
const generic_dto_1 = require("../generic/generic.dto");
const crypto_1 = require("../generic/providers/crypto");
const paystack_provider_1 = require("../generic/providers/paystack/paystack.provider");
const generic_service_1 = require("../generic/generic.service");
const mail_service_1 = require("../notification/mail/mail.service");
const moment = require("moment");
const generic_data_1 = require("../generic/generic.data");
const config_1 = require("@nestjs/config");
let WithdrawService = class WithdrawService {
    constructor(prisma, paystackService, mailService, genericService, configService) {
        this.prisma = prisma;
        this.paystackService = paystackService;
        this.mailService = mailService;
        this.genericService = genericService;
        this.configService = configService;
        this.model = 'WithdrawRequest';
        this.withdrawRequestRepository = new prisma_base_repository_1.PrismaBaseRepository('withdrawRequest', prisma);
    }
    async create(req, dto) {
        const { sub: userId } = req.user;
        const { user, withdrawal } = await this.prisma.$transaction(async (prisma) => {
            const business_wallet = await prisma.businessWallet.findFirst({
                where: {
                    business_id: req['Business-Id'],
                    currency: dto.currency,
                },
                include: {
                    business: { include: { user: true, kyc: true } },
                },
            });
            if (!business_wallet) {
                throw new common_1.BadRequestException('Business not found for user');
            }
            if (business_wallet.business.kyc.length) {
                for (let index = 0; index < business_wallet.business.kyc.length; index++) {
                    const kyc_doc = business_wallet.business.kyc[index];
                    if (!kyc_doc.is_approved) {
                        throw new common_1.ForbiddenException(`Your KYC Document '${kyc_doc.id_type}' has not yet been approved ${kyc_doc.disapproval_reason ? ` - Reason: ${kyc_doc.disapproval_reason}` : '.'}`);
                    }
                }
            }
            else {
                throw new common_1.ForbiddenException('KYC has to be provided first.');
            }
            await (0, generic_service_1.comparePassword)(dto.password, business_wallet.business.user.password_hash);
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    role: true,
                },
            });
            const amount = new library_1.Decimal(dto.amount);
            if (business_wallet.balance.lessThan(amount)) {
                throw new common_1.BadRequestException(`Insufficient wallet balance. You need at least ${(0, generic_utils_1.formatMoney)(+amount, business_wallet.currency)} to withdraw ${(0, generic_utils_1.formatMoney)(+amount, business_wallet.currency)}.`);
            }
            await prisma.businessWallet.update({
                where: { id: business_wallet.id },
                data: {
                    previous_balance: business_wallet.balance,
                    balance: business_wallet.balance.minus(amount),
                },
            });
            const withdrawal = await prisma.withdrawRequest.create({
                data: {
                    requested_user_id: userId,
                    business_id: business_wallet.business_id,
                    amount: amount,
                    currency: business_wallet.currency,
                },
            });
            const system_business = await this.genericService.systemBusinessDetails(prisma);
            await prisma.notification.create({
                data: {
                    title: 'Withdrawal Request Alert',
                    message: `User ${user.name}(#${(0, generic_utils_1.shortenId)(user.id)}) has submitted a withdrawal request of ${(0, generic_utils_1.formatMoney)(+amount, business_wallet.currency)}`,
                    business_id: system_business.id,
                    type: client_1.NotificationType.PUSH,
                },
            });
            await prisma.notification.create({
                data: {
                    title: 'Withdrawal Request Submitted',
                    message: `Your withdrawal request of ${(0, generic_utils_1.formatMoney)(+amount, business_wallet.currency)} has been submitted successfully and is being reviewed.`,
                    business_id: req['Business-Id'],
                    owner_id: user.id,
                    account_role: generic_data_1.Role.BUSINESS_SUPER_ADMIN,
                    type: client_1.NotificationType.PUSH,
                },
            });
            return { user, withdrawal };
        });
        await this.mailService.withdrawalAccountNotification({
            name: user.name,
            user_id: (0, generic_utils_1.shortenId)(user.id),
            email: user.email,
            withdrawal_account: (0, generic_utils_1.formatMoney)(+withdrawal.amount, withdrawal.currency),
            requested_date: moment(withdrawal.created_at).format('LL'),
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Withdraw request initiated successfully.',
        };
    }
    async findMyRequests(request, filterWithdrawRequestDto) {
        const pagination_filters = (0, generic_utils_1.pageFilter)({
            ...filterWithdrawRequestDto,
            pagination: filterWithdrawRequestDto?.pagination || new generic_dto_1.Pagination(),
        });
        const filters = {
            business_id: request['Business-Id'],
            ...(filterWithdrawRequestDto?.q && {
                OR: [
                    {
                        id: { contains: filterWithdrawRequestDto?.q, mode: 'insensitive' },
                    },
                ],
            }),
            ...pagination_filters.filters,
            tz: request.timezone,
        };
        const include = {
            business: true,
            requested_by: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    is_email_verified: true,
                    is_phone_verified: false,
                    created_at: true,
                    role: {
                        select: {
                            id: true,
                            name: true,
                            role_id: true,
                        },
                    },
                },
            },
        };
        const [withdraw_requests, total] = await Promise.all([
            this.withdrawRequestRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, include, undefined),
            this.withdrawRequestRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: withdraw_requests,
            count: total,
        };
    }
    async findAllRequests(request, filterWithdrawRequestDto) {
        const pagination_filters = (0, generic_utils_1.pageFilter)({
            ...filterWithdrawRequestDto,
            pagination: filterWithdrawRequestDto?.pagination || new generic_dto_1.Pagination(),
        });
        const filters = {
            ...(filterWithdrawRequestDto?.q && {
                OR: [
                    {
                        id: { contains: filterWithdrawRequestDto?.q, mode: 'insensitive' },
                    },
                ],
            }),
            ...pagination_filters.filters,
            tz: request.timezone,
        };
        const include = {
            business: true,
            requested_by: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    is_email_verified: true,
                    is_phone_verified: false,
                    created_at: true,
                    role: {
                        select: {
                            id: true,
                            name: true,
                            role_id: true,
                        },
                    },
                },
            },
        };
        const [withdraw_requests, total] = await Promise.all([
            this.withdrawRequestRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, include, undefined),
            this.withdrawRequestRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: withdraw_requests,
            count: total,
        };
    }
    async findOne(id) {
        const withdrawal = await this.prisma.withdrawRequest.findUnique({
            where: { id },
            include: {
                business: true,
                requested_by: {
                    select: { id: true, name: true, email: true, phone: true },
                },
            },
        });
        if (!withdrawal)
            throw new common_1.NotFoundException('Withdrawal not found');
        return {
            statusCode: common_1.HttpStatus.OK,
            data: withdrawal,
        };
    }
    async findDetails(id, req) {
        const withdrawal = await this.prisma.withdrawRequest.findUnique({
            where: { id, business_id: req['Business-Id'] },
            include: {
                business: true,
                requested_by: {
                    select: { id: true, name: true, email: true, phone: true },
                },
            },
        });
        if (!withdrawal)
            throw new common_1.NotFoundException('Withdrawal request not found');
        return {
            statusCode: common_1.HttpStatus.OK,
            data: withdrawal,
        };
    }
    async getPaystackRecipientCode(businessId) {
        const business_info = await this.prisma.businessInformation.findUnique({
            where: { id: businessId },
            include: { paystack_recipient: true },
        });
        if (business_info?.paystack_recipient?.recipient_code) {
            return crypto_1.CryptoUtil.decrypt(business_info?.paystack_recipient?.recipient_code);
        }
        const bankInfo = await this.prisma.withdrawalAccount.findUnique({
            where: { business_id: businessId },
        });
        if (!bankInfo) {
            throw new common_1.BadRequestException('Bank information not found.');
        }
        const response = await this.paystackService.createTransferRecipient({
            type: 'nuban',
            name: business_info.business_name,
            account_number: bankInfo.account_number,
            bank_code: bankInfo.bank_code,
            currency: 'NGN',
        });
        const recipient_code = response.recipient_code;
        const encryptedCode = crypto_1.CryptoUtil.encrypt(recipient_code);
        await this.prisma.paystackRecipient.create({
            data: {
                business_id: businessId,
                recipient_code: encryptedCode,
                account_number: bankInfo.account_number,
                bank_code: bankInfo.bank_code,
                name: business_info.business_name,
            },
        });
        return recipient_code;
    }
    async initiateWithdrawal(userId, dto) {
        const withdrawal_request = await this.prisma.withdrawRequest.findFirst({
            where: { id: dto.withdrawalId },
            include: { requested_by: true },
        });
        if (!withdrawal_request) {
            throw new common_1.NotFoundException('Withdrawal request not found.');
        }
        const business_info = await this.prisma.businessInformation.findUnique({
            where: { id: withdrawal_request.business_id },
            include: {
                business_wallet: true,
            },
        });
        if (!business_info)
            throw new common_1.BadRequestException('Business information not found');
        const business_wallet = await this.prisma.businessWallet.findUnique({
            where: {
                business_id_currency: {
                    business_id: business_info.id,
                    currency: withdrawal_request.currency,
                },
            },
        });
        const wallet = business_wallet;
        if (!wallet)
            throw new common_1.BadRequestException('Wallet not found');
        const amount = new library_1.Decimal(withdrawal_request.amount);
        const recipient = await this.getPaystackRecipientCode(business_info.id);
        return this.prisma.$transaction(async (tx) => {
            const transfer = await this.paystackService.initiateTransfer({
                amount: Number(amount),
                recipient_code: recipient,
                reason: `Withdrawal from ${business_info.business_name} by ${withdrawal_request.requested_by.name}`,
            });
            await tx.withdrawRequest.update({
                where: { id: withdrawal_request.id },
                data: {
                    notes: JSON.stringify({
                        transfer_code: transfer.data.transfer_code,
                        reference: transfer.data.reference,
                    }),
                },
            });
            return {
                statusCode: common_1.HttpStatus.OK,
                data: {
                    message: 'Withdrawal initiated',
                    reference: transfer.data.reference,
                },
            };
        });
    }
    async finalizeTransferRequest(userId, dto) {
        const { withdrawalId, otp } = dto;
        const { result } = await this.prisma.$transaction(async (tx) => {
            const withdrawRequest = await tx.withdrawRequest.findUnique({
                where: { id: withdrawalId },
            });
            if (!withdrawRequest) {
                throw new common_1.NotFoundException('Withdrawal request not found');
            }
            if (withdrawRequest.status === withdraw_dto_1.WithdrawalStatus.APPROVED) {
                throw new common_1.BadRequestException('Withdrawal already approved');
            }
            const transfer_details = JSON.parse(withdrawRequest.notes || '{}');
            if (!transfer_details.transfer_code) {
                throw new common_1.BadRequestException('Transfer code not found for this withdrawal request');
            }
            const result = await this.paystackService.finalizeTransfer(transfer_details.transfer_code, otp);
            if (!result.status) {
                throw new common_1.BadRequestException(result.message || 'Transfer finalization failed');
            }
            return { result };
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            data: {
                message: 'Transfer finalized successfully',
                transfer_reference: result.data?.reference,
            },
        };
    }
    async verifyAndMark(request, dto) {
        const { reference } = dto;
        const withdrawRequest = await this.prisma.withdrawRequest.findFirst({
            where: {
                notes: {
                    contains: reference,
                },
            },
            include: {
                business: { include: { business_wallet: true, user: true } },
            },
        });
        if (!withdrawRequest)
            throw new common_1.BadRequestException('Withdrawal request not found');
        const business_wallet = await this.prisma.businessWallet.findUnique({
            where: {
                business_id_currency: {
                    business_id: withdrawRequest.business_id,
                    currency: withdrawRequest.currency,
                },
            },
        });
        if (!business_wallet)
            throw new common_1.NotFoundException('Business wallet not found.');
        if (withdrawRequest.status === withdraw_dto_1.WithdrawalStatus.APPROVED)
            throw new common_1.BadRequestException('Transfer has been processed.');
        const result = await this.paystackService.verifyTransfer(reference);
        const status = result.data.status;
        let message;
        if (status === 'success') {
            await this.prisma.withdrawRequest.update({
                where: { id: withdrawRequest.id },
                data: {
                    status: withdraw_dto_1.WithdrawalStatus.APPROVED,
                    processed_at: new Date(),
                    processed_by: request.user.sub,
                    notes: JSON.stringify({
                        ...JSON.parse(withdrawRequest.notes),
                        message: result.message,
                    }),
                },
            });
            await this.prisma.payment.create({
                data: {
                    business_id: withdrawRequest.business_id,
                    withdraw_request_id: withdrawRequest.id,
                    amount: withdrawRequest.amount,
                    payment_status: client_1.PaymentStatus.SUCCESS,
                    payment_method: client_1.PaymentMethod.PAYSTACK,
                    currency: withdrawRequest.currency,
                    transaction_type: client_1.TransactionType.WITHDRAWAL,
                },
            });
            await this.prisma.notification.create({
                data: {
                    title: 'Withdrawal Successful',
                    message: `Your withdrawal of ${(0, generic_utils_1.formatMoney)(+withdrawRequest.amount, withdrawRequest.currency)} has been successfully transferred to your bank account.`,
                    business_id: withdrawRequest.business_id,
                    account_role: generic_data_1.Role.BUSINESS_SUPER_ADMIN,
                    type: client_1.NotificationType.PUSH,
                },
            });
            await this.mailService.transferPaymentReceipt(withdrawRequest.business.user, {
                referenceID: `${(0, generic_utils_1.shortenId)(withdrawRequest.id)}`,
                date: moment(withdrawRequest.updated_at).format('LLL'),
                amount: (0, generic_utils_1.formatMoney)(+withdrawRequest.amount, withdrawRequest.currency),
                balance: (0, generic_utils_1.formatMoney)(+business_wallet.balance, business_wallet.currency),
                previous_balance: (0, generic_utils_1.formatMoney)(+business_wallet.previous_balance, business_wallet.currency),
                payment_method: client_1.PaymentMethod.PAYSTACK,
            });
            message = 'Transfer verified successfully.';
        }
        else {
            await this.prisma.$transaction(async (tx) => {
                await tx.withdrawRequest.update({
                    where: { id: withdrawRequest.id },
                    data: {
                        status: withdraw_dto_1.WithdrawalStatus.REJECTED,
                        processed_at: new Date(),
                    },
                });
                const businessInfo = await tx.businessInformation.findFirst({
                    where: { id: withdrawRequest.business_id },
                });
                if (!businessInfo || !businessInfo.id)
                    throw new common_1.BadRequestException('Business info not found');
                const wallet = await tx.businessWallet.findUnique({
                    where: {
                        business_id_currency: {
                            business_id: businessInfo.id,
                            currency: withdrawRequest.currency,
                        },
                    },
                });
                if (!wallet)
                    throw new common_1.BadRequestException('Business wallet not found');
                const newBalance = wallet.balance.plus(withdrawRequest.amount);
                await tx.businessWallet.update({
                    where: { id: wallet.id },
                    data: {
                        previous_balance: wallet.balance,
                        balance: newBalance,
                    },
                });
                message = 'Transfer failed.';
            });
        }
        return {
            statusCode: common_1.HttpStatus.OK,
            message,
        };
    }
    async updateStatus(id, dto) {
        return this.prisma.withdrawRequest.update({
            where: { id },
            data: {
                ...dto,
                processed_at: new Date(),
            },
        });
    }
    async remove(id) {
        return this.prisma.withdrawRequest.delete({ where: { id } });
    }
};
exports.WithdrawService = WithdrawService;
exports.WithdrawService = WithdrawService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        paystack_provider_1.PaystackService,
        mail_service_1.MailService,
        generic_service_1.GenericService,
        config_1.ConfigService])
], WithdrawService);
//# sourceMappingURL=withdraw.service.js.map