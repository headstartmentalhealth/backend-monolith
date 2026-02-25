import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyPayload } from './currency.payload';
import { AuthPayload } from '@/generic/generic.payload';
import { ToggleCurrencyDto } from './currency.dto';
import { BusinessDto } from '@/generic/generic.dto';
export declare class CurrencyService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAvailableCurrencies(req: AuthPayload): Promise<CurrencyPayload>;
    toggleBusinessAccountCurrency(req: AuthPayload, toggleCurrencyDto: ToggleCurrencyDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            action: string;
            currency: string;
            data: {};
        };
    } | {
        statusCode: HttpStatus;
        message: string;
        data: {
            action: string;
            currency: string;
            data: {
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                business_id: string;
                currency: string;
                creator_id: string | null;
                currency_url: string | null;
                currency_sign: string | null;
            };
        };
    }>;
    toggleBusinessProductEnabledCurrency(req: AuthPayload, toggleCurrencyDto: ToggleCurrencyDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            action: string;
            currency: string;
            data: {};
        };
    } | {
        statusCode: HttpStatus;
        message: string;
        data: {
            action: string;
            currency: string;
            data: {
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                business_id: string;
                currency: string;
                creator_id: string | null;
                currency_url: string | null;
                currency_sign: string | null;
            };
        };
    }>;
    getBusinessAccountCurrencies(businessDto: BusinessDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            details: {
                id: string;
                created_at: Date;
                updated_at: Date;
                currency: string;
            }[];
            currencies: string[];
        };
    }>;
    fetchCurrencyRatesAndAllowedCurrencies(): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            rates: ({
                creator: {
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    email: string;
                    name: string;
                    password_hash: string | null;
                    phone: string | null;
                    is_email_verified: boolean;
                    is_phone_verified: boolean;
                    is_first_signup: boolean;
                    role_identity: string | null;
                    is_suspended: boolean | null;
                    suspended_by: string | null;
                    suspended_at: Date | null;
                    suspension_reason: string | null;
                    signin_option: string | null;
                    alternative_phone: string | null;
                    referral_source: string | null;
                };
            } & {
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                creator_id: string | null;
                base_currency: string;
                foreign_currency: string;
                base_to_foreign_rate: import("@prisma/client/runtime/library").Decimal | null;
                foreign_to_base_rate: import("@prisma/client/runtime/library").Decimal | null;
            })[];
            allowed: ({
                creator: {
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    email: string;
                    name: string;
                    password_hash: string | null;
                    phone: string | null;
                    is_email_verified: boolean;
                    is_phone_verified: boolean;
                    is_first_signup: boolean;
                    role_identity: string | null;
                    is_suspended: boolean | null;
                    suspended_by: string | null;
                    suspended_at: Date | null;
                    suspension_reason: string | null;
                    signin_option: string | null;
                    alternative_phone: string | null;
                    referral_source: string | null;
                };
            } & {
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                currency: string;
                creator_id: string | null;
                currency_url: string | null;
                charge: import("@prisma/client/runtime/library").Decimal;
                currency_sign: string | null;
                additional_flat_amount: import("@prisma/client/runtime/library").Decimal | null;
                enabled: boolean;
            })[];
            allowed_currencies: string[];
        };
    }>;
}
