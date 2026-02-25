import { Prisma, PrismaClient, Product, SubscriptionPlan, SubscriptionPlanPrice, TicketTier } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { OtherCurrencyDto } from '@/product/course/crud/crud.dto';
export declare class GenericService {
    private readonly prisma;
    private readonly configService;
    private salt;
    constructor(prisma: PrismaService, configService: ConfigService);
    isUserLinkedToBusiness(prisma: Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>, args: {
        user_id: string;
        business_id: string;
    }, verifyBusiness?: boolean): Promise<void>;
    private verifyBusiness;
    findUser(user_id: string): Promise<{
        role: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            name: string;
            description: string | null;
            role_group_id: string;
            role_id: string;
        };
    } & {
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
    }>;
    encrypt(text: string): string;
    decrypt(text: string): string;
    systemBusinessDetails(prisma: Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>): Promise<{
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
    }>;
    productBySlug(prisma: Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>, slug: string): Promise<void>;
    validateOtherCurrencies(other_currencies: OtherCurrencyDto[], prisma: Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>): Promise<void>;
    convertPricesFromNGN(price: number, originalPrice: number | undefined, targetCurrency: string): Promise<{
        price: number;
        original_price?: number;
    } | null>;
    assignSelectedCurrencyPrices(product: any, selectedCurrency: string): Promise<any>;
    find_subscription_plan_price(priceRow: SubscriptionPlanPrice & {
        subscription_plan?: SubscriptionPlan;
        other_currencies: OtherCurrencyDto[];
    }, selectedCurrency: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        currency: string;
        creator_id: string;
        subscription_plan_id: string;
        price: Prisma.Decimal;
        period: import(".prisma/client").$Enums.SubscriptionPeriod;
        other_currencies: Prisma.JsonValue | null;
    } & {
        subscription_plan?: SubscriptionPlan;
        other_currencies: OtherCurrencyDto[];
    }>;
    find_ticket_tier_price(tier: TicketTier & {
        other_currencies: OtherCurrencyDto[];
    }, selectedCurrency: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        currency: string | null;
        name: string;
        description: string | null;
        status: import(".prisma/client").$Enums.TicketTierStatus;
        other_currencies: Prisma.JsonValue | null;
        amount: Prisma.Decimal | null;
        quantity: number | null;
        ticket_id: string;
        remaining_quantity: number | null;
        max_per_purchase: number | null;
        default_view: boolean;
        original_amount: Prisma.Decimal | null;
    } & {
        other_currencies: OtherCurrencyDto[];
    }>;
    find_product(product: Product & {
        other_currencies: OtherCurrencyDto[];
    }, selectedCurrency: string): Promise<{
        id: string;
        metadata: Prisma.JsonValue | null;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.ProductType;
        business_id: string;
        currency: string | null;
        description: string | null;
        creator_id: string;
        status: import(".prisma/client").$Enums.ProductStatus;
        price: Prisma.Decimal | null;
        other_currencies: Prisma.JsonValue | null;
        title: string;
        keywords: string | null;
        published_at: Date | null;
        archived_at: Date | null;
        multimedia_id: string | null;
        sku: string | null;
        category_id: string;
        slug: string | null;
        readiness_percent: number | null;
        original_price: Prisma.Decimal | null;
        multimedia_zip_id: string | null;
    } & {
        other_currencies: OtherCurrencyDto[];
    }>;
    finalAmountToBusinessWallet(amount: number, currency: string, discount_applied: number, enable_special_offer?: boolean): {
        final_amount: number;
        fee_amount: number;
        net_amount: number;
    };
}
export declare const comparePassword: (password: string, password_hash: string) => Promise<void>;
