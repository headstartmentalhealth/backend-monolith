import { WithdrawService } from './withdraw.service';
import { CreateWithdrawalDto, FinalizeWithdrawalDto, InitiateWithdrawalDto, QueryWithdrawRequestsDto, UpdateWithdrawalDto, VerifyWithdrawalDto } from './withdraw.dto';
import { AuthPayload } from '@/generic/generic.payload';
export declare class WithdrawController {
    private readonly service;
    constructor(service: WithdrawService);
    create(dto: CreateWithdrawalDto, req: AuthPayload & Request): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
        message: string;
    }>;
    findMyRequests(req: AuthPayload & Request, filterWithdrawRequestDto: QueryWithdrawRequestsDto): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
        data: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            business_id: string;
            currency: string;
            status: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            requested_user_id: string;
            charge: import("@prisma/client/runtime/library").Decimal | null;
            notes: string | null;
            processed_by: string | null;
            processed_at: Date | null;
        }[];
        count: number;
    }>;
    findAll(req: AuthPayload & Request, filterWithdrawRequestDto: QueryWithdrawRequestsDto): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
        data: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            business_id: string;
            currency: string;
            status: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            requested_user_id: string;
            charge: import("@prisma/client/runtime/library").Decimal | null;
            notes: string | null;
            processed_by: string | null;
            processed_at: Date | null;
        }[];
        count: number;
    }>;
    findOne(req: AuthPayload & Request, id: string): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
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
                social_media_handles: import("@prisma/client/runtime/library").JsonValue | null;
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
            amount: import("@prisma/client/runtime/library").Decimal;
            requested_user_id: string;
            charge: import("@prisma/client/runtime/library").Decimal | null;
            notes: string | null;
            processed_by: string | null;
            processed_at: Date | null;
        };
    }>;
    findDetails(req: AuthPayload & Request, id: string): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
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
                social_media_handles: import("@prisma/client/runtime/library").JsonValue | null;
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
            amount: import("@prisma/client/runtime/library").Decimal;
            requested_user_id: string;
            charge: import("@prisma/client/runtime/library").Decimal | null;
            notes: string | null;
            processed_by: string | null;
            processed_at: Date | null;
        };
    }>;
    initiateTransfer(req: AuthPayload & Request, dto: InitiateWithdrawalDto): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
        data: {
            message: string;
            reference: any;
        };
    }>;
    finalizeTransfer(req: AuthPayload & Request, dto: FinalizeWithdrawalDto): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
        data: {
            message: string;
            transfer_reference: any;
        };
    }>;
    verifyTransfer(req: AuthPayload & Request, dto: VerifyWithdrawalDto): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
        message: string;
    }>;
    update(id: string, dto: UpdateWithdrawalDto): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        business_id: string;
        currency: string;
        status: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        requested_user_id: string;
        charge: import("@prisma/client/runtime/library").Decimal | null;
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
        amount: import("@prisma/client/runtime/library").Decimal;
        requested_user_id: string;
        charge: import("@prisma/client/runtime/library").Decimal | null;
        notes: string | null;
        processed_by: string | null;
        processed_at: Date | null;
    }>;
}
