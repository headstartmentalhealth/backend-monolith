import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateWithdrawalDto, FinalizeWithdrawalDto, InitiateWithdrawalDto, QueryWithdrawRequestsDto, UpdateWithdrawalDto, VerifyWithdrawalDto } from './withdraw.dto';
import { Prisma } from '@prisma/client';
import { AuthPayload } from '@/generic/generic.payload';
import { PaystackService } from '@/generic/providers/paystack/paystack.provider';
import { GenericService } from '@/generic/generic.service';
import { MailService } from '@/notification/mail/mail.service';
import { ConfigService } from '@nestjs/config';
export declare class WithdrawService {
    private readonly prisma;
    private readonly paystackService;
    private readonly mailService;
    private readonly genericService;
    private readonly configService;
    private readonly model;
    private readonly withdrawRequestRepository;
    constructor(prisma: PrismaService, paystackService: PaystackService, mailService: MailService, genericService: GenericService, configService: ConfigService);
    create(req: AuthPayload, dto: CreateWithdrawalDto): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    findMyRequests(request: AuthPayload & Request, filterWithdrawRequestDto: QueryWithdrawRequestsDto): Promise<{
        statusCode: HttpStatus;
        data: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            business_id: string;
            currency: string;
            status: string;
            amount: Prisma.Decimal;
            requested_user_id: string;
            charge: Prisma.Decimal | null;
            notes: string | null;
            processed_by: string | null;
            processed_at: Date | null;
        }[];
        count: number;
    }>;
    findAllRequests(request: AuthPayload & Request, filterWithdrawRequestDto: QueryWithdrawRequestsDto): Promise<{
        statusCode: HttpStatus;
        data: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            business_id: string;
            currency: string;
            status: string;
            amount: Prisma.Decimal;
            requested_user_id: string;
            charge: Prisma.Decimal | null;
            notes: string | null;
            processed_by: string | null;
            processed_at: Date | null;
        }[];
        count: number;
    }>;
    findOne(id: string): Promise<{
        statusCode: HttpStatus;
        data: {
            business: {
                id: string;
                user_id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                business_name: string;
                business_size: import(".prisma/client").$Enums.BusinessSize;
                business_slug: string | null;
                business_description: string | null;
                timeline: string;
                logo_url: string | null;
                industry: string;
                working_hours: string | null;
                location: string | null;
                scope: string | null;
                country: string | null;
                state: string | null;
                country_code: string | null;
                social_media_handles: Prisma.JsonValue | null;
                enable_special_offer: boolean | null;
            };
            requested_by: {
                id: string;
                email: string;
                name: string;
                phone: string;
            };
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            business_id: string;
            currency: string;
            status: string;
            amount: Prisma.Decimal;
            requested_user_id: string;
            charge: Prisma.Decimal | null;
            notes: string | null;
            processed_by: string | null;
            processed_at: Date | null;
        };
    }>;
    findDetails(id: string, req: AuthPayload & Request): Promise<{
        statusCode: HttpStatus;
        data: {
            business: {
                id: string;
                user_id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                business_name: string;
                business_size: import(".prisma/client").$Enums.BusinessSize;
                business_slug: string | null;
                business_description: string | null;
                timeline: string;
                logo_url: string | null;
                industry: string;
                working_hours: string | null;
                location: string | null;
                scope: string | null;
                country: string | null;
                state: string | null;
                country_code: string | null;
                social_media_handles: Prisma.JsonValue | null;
                enable_special_offer: boolean | null;
            };
            requested_by: {
                id: string;
                email: string;
                name: string;
                phone: string;
            };
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            business_id: string;
            currency: string;
            status: string;
            amount: Prisma.Decimal;
            requested_user_id: string;
            charge: Prisma.Decimal | null;
            notes: string | null;
            processed_by: string | null;
            processed_at: Date | null;
        };
    }>;
    getPaystackRecipientCode(businessId: string): Promise<string>;
    initiateWithdrawal(userId: string, dto: InitiateWithdrawalDto): Promise<{
        statusCode: HttpStatus;
        data: {
            message: string;
            reference: any;
        };
    }>;
    finalizeTransferRequest(userId: string, dto: FinalizeWithdrawalDto): Promise<{
        statusCode: HttpStatus;
        data: {
            message: string;
            transfer_reference: any;
        };
    }>;
    verifyAndMark(request: AuthPayload & Request, dto: VerifyWithdrawalDto): Promise<{
        statusCode: HttpStatus;
        message: string;
    }>;
    updateStatus(id: string, dto: UpdateWithdrawalDto): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        business_id: string;
        currency: string;
        status: string;
        amount: Prisma.Decimal;
        requested_user_id: string;
        charge: Prisma.Decimal | null;
        notes: string | null;
        processed_by: string | null;
        processed_at: Date | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        business_id: string;
        currency: string;
        status: string;
        amount: Prisma.Decimal;
        requested_user_id: string;
        charge: Prisma.Decimal | null;
        notes: string | null;
        processed_by: string | null;
        processed_at: Date | null;
    }>;
}
