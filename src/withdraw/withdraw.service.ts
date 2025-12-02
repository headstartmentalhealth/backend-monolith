import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import {
  CreateWithdrawalDto,
  FinalizeWithdrawalDto,
  InitiateWithdrawalDto,
  QueryWithdrawRequestsDto,
  UpdateWithdrawalDto,
  VerifyWithdrawalDto,
  WithdrawalStatus,
  WithdrawNoteDto,
} from './withdraw.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaBaseRepository } from '@/prisma/prisma.base.repository';
import {
  BusinessWallet,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  TransactionType,
  WithdrawRequest,
} from '@prisma/client';
import {
  doexcessCharge,
  formatMoney,
  pageFilter,
  shortenId,
} from '@/generic/generic.utils';
import { AuthPayload } from '@/generic/generic.payload';
import { Pagination, TZ } from '@/generic/generic.dto';
import { CryptoUtil } from '@/generic/providers/crypto';
import { PaystackService } from '@/generic/providers/paystack/paystack.provider';
import { comparePassword, GenericService } from '@/generic/generic.service';
import { MailService } from '@/notification/mail/mail.service';
import * as moment from 'moment';
import { Role } from '@/generic/generic.data';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WithdrawService {
  private readonly model = 'WithdrawRequest';
  private readonly withdrawRequestRepository: PrismaBaseRepository<
    WithdrawRequest,
    Prisma.WithdrawRequestCreateInput,
    Prisma.WithdrawRequestUpdateInput,
    Prisma.WithdrawRequestWhereUniqueInput,
    Prisma.WithdrawRequestWhereInput | Prisma.WithdrawRequestFindFirstArgs,
    Prisma.WithdrawRequestUpsertArgs
  >;

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackService: PaystackService,
    private readonly mailService: MailService,
    private readonly genericService: GenericService,
    private readonly configService: ConfigService,
  ) {
    this.withdrawRequestRepository = new PrismaBaseRepository<
      WithdrawRequest,
      Prisma.WithdrawRequestCreateInput,
      Prisma.WithdrawRequestUpdateInput,
      Prisma.WithdrawRequestWhereUniqueInput,
      Prisma.WithdrawRequestWhereInput | Prisma.WithdrawRequestFindFirstArgs,
      Prisma.WithdrawRequestUpsertArgs
    >('withdrawRequest', prisma);
  }

  async create(req: AuthPayload, dto: CreateWithdrawalDto) {
    const { sub: userId } = req.user;

    const { user, withdrawal } = await this.prisma.$transaction(
      async (prisma) => {
        // 1. Find the user's business wallet
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
          throw new BadRequestException('Business not found for user');
        }

        if (business_wallet.business.kyc.length) {
          // Validate that all kyc doc is validated
          for (
            let index = 0;
            index < business_wallet.business.kyc.length;
            index++
          ) {
            const kyc_doc = business_wallet.business.kyc[index];
            if (!kyc_doc.is_approved) {
              throw new ForbiddenException(
                `Your KYC Document '${kyc_doc.id_type}' has not yet been approved ${kyc_doc.disapproval_reason ? ` - Reason: ${kyc_doc.disapproval_reason}` : '.'}`,
              );
            }
          }
        } else {
          throw new ForbiddenException('KYC has to be provided first.');
        }

        // Check if password is valid
        await comparePassword(
          dto.password,
          business_wallet.business.user.password_hash,
        );

        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            role: true,
          },
        });

        const amount = new Decimal(dto.amount);

        // 2. Check if the wallet has sufficient funds
        if (business_wallet.balance.lessThan(amount)) {
          throw new BadRequestException(
            `Insufficient wallet balance. You need at least ${formatMoney(+amount, business_wallet.currency)} to withdraw ${formatMoney(+amount, business_wallet.currency)}.`,
          );
        }

        // 3. Update wallet (deduct total debit)
        await prisma.businessWallet.update({
          where: { id: business_wallet.id },
          data: {
            previous_balance: business_wallet.balance,
            balance: business_wallet.balance.minus(amount),
          },
        });

        // 4. Create the withdrawal record
        const withdrawal = await prisma.withdrawRequest.create({
          data: {
            requested_user_id: userId,
            business_id: business_wallet.business_id,
            amount: amount,
            currency: business_wallet.currency,
          },
        });

        // 5. Fetch system business (Doexcess)
        const system_business =
          await this.genericService.systemBusinessDetails(prisma);

        // Send in-app notification
        await prisma.notification.create({
          data: {
            title: 'Withdrawal Request Alert',
            message: `User ${user.name}(#${shortenId(user.id)}) has submitted a withdrawal request of ${formatMoney(+amount, business_wallet.currency)}`,
            business_id: system_business.id,
            type: NotificationType.PUSH,
          },
        });

        // Send in-app notification to business
        await prisma.notification.create({
          data: {
            title: 'Withdrawal Request Submitted',
            message: `Your withdrawal request of ${formatMoney(+amount, business_wallet.currency)} has been submitted successfully and is being reviewed.`,
            business_id: req['Business-Id'],
            owner_id: user.id, // Assuming this is how you target the user
            account_role: Role.BUSINESS_SUPER_ADMIN,
            type: NotificationType.PUSH,
          },
        });

        return { user, withdrawal };
      },
    );

    // Send email notification to admins
    await this.mailService.withdrawalAccountNotification({
      name: user.name,
      user_id: shortenId(user.id),
      email: user.email,
      withdrawal_account: formatMoney(+withdrawal.amount, withdrawal.currency),
      requested_date: moment(withdrawal.created_at).format('LL'),
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Withdraw request initiated successfully.',
    };
  }

  async findMyRequests(
    request: AuthPayload & Request,
    filterWithdrawRequestDto: QueryWithdrawRequestsDto,
  ) {
    const pagination_filters = pageFilter({
      ...filterWithdrawRequestDto,
      pagination: filterWithdrawRequestDto?.pagination || new Pagination(),
    });

    // Filters
    const filters: Prisma.WithdrawRequestWhereInput & TZ = {
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

    const include: Prisma.WithdrawRequestInclude = {
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
      this.withdrawRequestRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        include,
        undefined,
      ),
      this.withdrawRequestRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: withdraw_requests,
      count: total,
    };
  }

  async findAllRequests(
    request: AuthPayload & Request,
    filterWithdrawRequestDto: QueryWithdrawRequestsDto,
  ) {
    const pagination_filters = pageFilter({
      ...filterWithdrawRequestDto,
      pagination: filterWithdrawRequestDto?.pagination || new Pagination(),
    });

    // Filters
    const filters: Prisma.WithdrawRequestWhereInput & TZ = {
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

    const include: Prisma.WithdrawRequestInclude = {
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
      this.withdrawRequestRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        include,
        undefined,
      ),
      this.withdrawRequestRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: withdraw_requests,
      count: total,
    };
  }

  async findOne(id: string) {
    const withdrawal = await this.prisma.withdrawRequest.findUnique({
      where: { id },
      include: {
        business: true,
        requested_by: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!withdrawal) throw new NotFoundException('Withdrawal not found');

    return {
      statusCode: HttpStatus.OK,
      data: withdrawal,
    };
  }

  async findDetails(id: string, req: AuthPayload & Request) {
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
      throw new NotFoundException('Withdrawal request not found');

    return {
      statusCode: HttpStatus.OK,
      data: withdrawal,
    };
  }

  async getPaystackRecipientCode(businessId: string): Promise<string> {
    const business_info = await this.prisma.businessInformation.findUnique({
      where: { id: businessId },
      include: { paystack_recipient: true },
    });

    if (business_info?.paystack_recipient?.recipient_code) {
      return CryptoUtil.decrypt(
        business_info?.paystack_recipient?.recipient_code,
      );
    }

    const bankInfo = await this.prisma.withdrawalAccount.findUnique({
      where: { business_id: businessId },
    });

    if (!bankInfo) {
      throw new BadRequestException('Bank information not found.');
    }

    const response = await this.paystackService.createTransferRecipient({
      type: 'nuban',
      name: business_info.business_name,
      account_number: bankInfo.account_number,
      bank_code: bankInfo.bank_code,
      currency: 'NGN',
    });

    const recipient_code = response.recipient_code;

    const encryptedCode = CryptoUtil.encrypt(recipient_code);

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

  async initiateWithdrawal(userId: string, dto: InitiateWithdrawalDto) {
    const withdrawal_request = await this.prisma.withdrawRequest.findFirst({
      where: { id: dto.withdrawalId },
      include: { requested_by: true },
    });

    if (!withdrawal_request) {
      throw new NotFoundException('Withdrawal request not found.');
    }

    const business_info = await this.prisma.businessInformation.findUnique({
      where: { id: withdrawal_request.business_id },
      include: {
        business_wallet: true,
      },
    });

    if (!business_info)
      throw new BadRequestException('Business information not found');

    const business_wallet = await this.prisma.businessWallet.findUnique({
      where: {
        business_id_currency: {
          business_id: business_info.id,
          currency: withdrawal_request.currency,
        },
      },
    });

    const wallet = business_wallet;
    if (!wallet) throw new BadRequestException('Wallet not found');

    const amount = new Decimal(withdrawal_request.amount);

    // Get recipient code for Paystack (assume you already saved this)
    const recipient = await this.getPaystackRecipientCode(business_info.id); // implement this

    return this.prisma.$transaction(async (tx) => {
      // Initiate Paystack transfer
      const transfer = await this.paystackService.initiateTransfer({
        amount: Number(amount),
        recipient_code: recipient,
        reason: `Withdrawal from ${business_info.business_name} by ${withdrawal_request.requested_by.name}`,
      });

      // Save reference to withdrawal request
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
        statusCode: HttpStatus.OK,
        data: {
          message: 'Withdrawal initiated',
          reference: transfer.data.reference,
        },
      };
    });
  }

  async finalizeTransferRequest(userId: string, dto: FinalizeWithdrawalDto) {
    const { withdrawalId, otp } = dto;

    const { result } = await this.prisma.$transaction(async (tx) => {
      // 1. Fetch the withdrawal request
      const withdrawRequest = await tx.withdrawRequest.findUnique({
        where: { id: withdrawalId },
      });

      if (!withdrawRequest) {
        throw new NotFoundException('Withdrawal request not found');
      }

      // 2. Check if already approved
      if (withdrawRequest.status === WithdrawalStatus.APPROVED) {
        throw new BadRequestException('Withdrawal already approved');
      }

      // 3. Parse transfer details from notes
      const transfer_details = JSON.parse(
        withdrawRequest.notes || '{}',
      ) as WithdrawNoteDto;

      if (!transfer_details.transfer_code) {
        throw new BadRequestException(
          'Transfer code not found for this withdrawal request',
        );
      }

      // 4. Finalize the transfer via Paystack
      const result = await this.paystackService.finalizeTransfer(
        transfer_details.transfer_code,
        otp,
      );

      // mock
      // const result = {
      //   status: true,
      //   message: 'Transfer successful',
      //   data: { reference: transfer_details.reference },
      // };

      if (!result.status) {
        throw new BadRequestException(
          result.message || 'Transfer finalization failed',
        );
      }

      // 5. Update withdrawal status and notes
      // await tx.withdrawRequest.update({
      //   where: { id: withdrawalId },
      //   data: {
      //     status: WithdrawalStatus.APPROVED,
      //     processed_at: new Date(),
      //     processed_by: userId,
      //     notes: JSON.stringify({
      //       ...transfer_details,
      //       message: result.message,
      //     }),
      //   },
      // });

      return { result };
    });

    return {
      statusCode: HttpStatus.OK,
      data: {
        message: 'Transfer finalized successfully',
        transfer_reference: result.data?.reference,
      },
    };
  }

  async verifyAndMark(
    request: AuthPayload & Request,
    dto: VerifyWithdrawalDto,
  ) {
    const { reference } = dto;

    // Find the withdrawal request using the reference
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
      throw new BadRequestException('Withdrawal request not found');

    const business_wallet = await this.prisma.businessWallet.findUnique({
      where: {
        business_id_currency: {
          business_id: withdrawRequest.business_id,
          currency: withdrawRequest.currency,
        },
      },
    });

    if (!business_wallet)
      throw new NotFoundException('Business wallet not found.');

    if (withdrawRequest.status === WithdrawalStatus.APPROVED)
      throw new BadRequestException('Transfer has been processed.');

    const result = await this.paystackService.verifyTransfer(reference);
    const status = result.data.status;

    let message: string;
    if (status === 'success') {
      await this.prisma.withdrawRequest.update({
        where: { id: withdrawRequest.id },
        data: {
          status: WithdrawalStatus.APPROVED,
          processed_at: new Date(),
          processed_by: request.user.sub,
          notes: JSON.stringify({
            ...JSON.parse(withdrawRequest.notes),
            message: result.message,
          }),
        },
      });

      // Create a payment record for withdrawal
      await this.prisma.payment.create({
        data: {
          business_id: withdrawRequest.business_id,
          withdraw_request_id: withdrawRequest.id,
          amount: withdrawRequest.amount,
          payment_status: PaymentStatus.SUCCESS,
          payment_method: PaymentMethod.PAYSTACK,
          currency: withdrawRequest.currency,
          transaction_type: TransactionType.WITHDRAWAL,
        },
      });

      // Send in-app notification to business
      await this.prisma.notification.create({
        data: {
          title: 'Withdrawal Successful',
          message: `Your withdrawal of ${formatMoney(+withdrawRequest.amount, withdrawRequest.currency)} has been successfully transferred to your bank account.`,
          business_id: withdrawRequest.business_id,
          account_role: Role.BUSINESS_SUPER_ADMIN,
          type: NotificationType.PUSH,
        },
      });

      // Send receipt email
      await this.mailService.transferPaymentReceipt(
        withdrawRequest.business.user,
        {
          referenceID: `${shortenId(withdrawRequest.id)}`,
          date: moment(withdrawRequest.updated_at).format('LLL'),
          amount: formatMoney(
            +withdrawRequest.amount,
            withdrawRequest.currency,
          ),
          balance: formatMoney(
            +business_wallet.balance,
            business_wallet.currency,
          ),
          previous_balance: formatMoney(
            +business_wallet.previous_balance,
            business_wallet.currency,
          ),
          payment_method: PaymentMethod.PAYSTACK,
        },
      );

      message = 'Transfer verified successfully.';
    } else {
      await this.prisma.$transaction(async (tx) => {
        // Update withdraw request status
        await tx.withdrawRequest.update({
          where: { id: withdrawRequest.id },
          data: {
            status: WithdrawalStatus.REJECTED,
            processed_at: new Date(),
          },
        });

        // Find user's business wallet
        const businessInfo = await tx.businessInformation.findFirst({
          where: { id: withdrawRequest.business_id },
        });

        if (!businessInfo || !businessInfo.id)
          throw new BadRequestException('Business info not found');

        const wallet = await tx.businessWallet.findUnique({
          where: {
            business_id_currency: {
              business_id: businessInfo.id,
              currency: withdrawRequest.currency,
            },
          },
        });

        if (!wallet) throw new BadRequestException('Business wallet not found');

        // Refund the amount
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
      statusCode: HttpStatus.OK,
      message,
    };
  }

  async updateStatus(id: string, dto: UpdateWithdrawalDto) {
    return this.prisma.withdrawRequest.update({
      where: { id },
      data: {
        ...dto,
        processed_at: new Date(),
      },
    });
  }

  async remove(id: string) {
    return this.prisma.withdrawRequest.delete({ where: { id } });
  }
}
