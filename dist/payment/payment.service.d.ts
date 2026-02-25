import { AuthPayload, GenericPayload, PagePayload, Timezone } from '@/generic/generic.payload';
import { HttpStatus, Logger } from '@nestjs/common';
import { CreatePaymentDto, InitiateWithdrawalDto, QueryPaymentsDto, VerifyPaymentDto } from './payment.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { PaystackService } from '@/generic/providers/paystack/paystack.provider';
import { AuthService } from '@/account/auth/auth.service';
import { LogService } from '@/log/log.service';
import { MailService } from '@/notification/mail/mail.service';
import { GenericService } from '@/generic/generic.service';
import { Payment, Prisma, ProductType } from '@prisma/client';
import { BillingService } from '@/account/billing/billing.service';
import { CouponUsageService } from '@/coupon/usage/usage.service';
import { PurchaseSchema } from './payment.payload';
import { CartService } from '@/cart/cart.service';
import { IdDto, MeasurementMetadataDto } from '@/generic/generic.dto';
import { GenericDataPayload } from '@/generic/generic.payload';
import { FlutterwaveService } from '@/generic/providers/flutterwave/flutterwave.provider';
import { ConfigService } from '@nestjs/config';
export declare class PaymentService {
    private readonly prisma;
    private readonly paystackService;
    private readonly flutterwaveService;
    private readonly authService;
    private readonly logService;
    private readonly mailService;
    private readonly logger;
    private readonly billingService;
    private readonly couponUsageService;
    private readonly cartService;
    private readonly genericService;
    private readonly configService;
    private readonly model;
    private readonly paymentRepository;
    private readonly businessInformationRepository;
    constructor(prisma: PrismaService, paystackService: PaystackService, flutterwaveService: FlutterwaveService, authService: AuthService, logService: LogService, mailService: MailService, logger: Logger, billingService: BillingService, couponUsageService: CouponUsageService, cartService: CartService, genericService: GenericService, configService: ConfigService);
    private purchaseByType;
    private getTodayEarningsAndPayments;
    private computeTotalAmount;
    private compareAmounts;
    private verifyProductAlreadyPurchased;
    createPaystackPayment(request: Timezone & Request, createPaymentDto: CreatePaymentDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            authorization_url: string;
            payment_id: string;
            access: string;
        };
    }>;
    createPayment(request: Timezone & Request, createPaymentDto: CreatePaymentDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            payment_id: string;
            authorization_url: any;
        };
    }>;
    cancelPayment(request: Timezone & Request, payment_id: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            payment_id: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
        };
    }>;
    formatEachPrice(items: PurchaseSchema[], currency: string): {
        price: string;
        name: string;
        tier_name?: string;
        id: string;
        product_id: string;
        quantity: number;
        created_at: Date;
        purchase_type: ProductType;
        interval?: import(".prisma/client").SubscriptionPeriod;
        auto_renew?: boolean;
        metadata?: MeasurementMetadataDto[];
    }[];
    private createPurchaseRecord;
    verifyPaystackPayment(request: Timezone & Request, verifyPaymentDto: VerifyPaymentDto): Promise<GenericPayload>;
    verifyFlwPayment(request: Timezone & Request, verifyPaymentDto: VerifyPaymentDto): Promise<GenericPayload>;
    verifyPayment(request: Timezone & Request, verifyPaymentDto: VerifyPaymentDto): Promise<GenericPayload>;
    fetchPayments(request: AuthPayload, filterPaymentDto: QueryPaymentsDto): Promise<PagePayload<Payment>>;
    fetchPaymentsForBusiness(request: AuthPayload, filterPaymentDto: QueryPaymentsDto): Promise<PagePayload<Payment> | any>;
    fetchPaymentByIDForBusiness(request: AuthPayload, idDto: IdDto): Promise<PagePayload<Payment> | any>;
    fetchDistinctCustomerPayments(request: AuthPayload, filterPaymentDto: QueryPaymentsDto): Promise<{
        statusCode: HttpStatus;
        data: {
            id: string;
            user_id: string | null;
            metadata: Prisma.JsonValue | null;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            business_id: string | null;
            currency: string;
            purchase: Prisma.JsonValue | null;
            discount_applied: Prisma.Decimal;
            payment_method: import(".prisma/client").$Enums.PaymentMethod | null;
            auto_renew: boolean | null;
            amount: Prisma.Decimal;
            withdraw_request_id: string | null;
            purchase_type: import(".prisma/client").$Enums.PurchaseType | null;
            purchase_id: string | null;
            gross_amount: Prisma.Decimal | null;
            final_amount: Prisma.Decimal | null;
            fee_amount: Prisma.Decimal | null;
            fee_percent: Prisma.Decimal | null;
            payment_status: import(".prisma/client").$Enums.PaymentStatus;
            transaction_id: string | null;
            access_code: string | null;
            billing_at_payment: Prisma.JsonValue | null;
            billing_id: string | null;
            interval: import(".prisma/client").$Enums.SubscriptionPeriod | null;
            is_renewal: boolean | null;
            is_upgrade: boolean | null;
            transaction_type: import(".prisma/client").$Enums.TransactionType | null;
        }[];
        count: number;
    }>;
    initiateWithdrawal(request: AuthPayload & Request, initiateWithdrawalDto: InitiateWithdrawalDto): Promise<{
        statusCode: number;
        message: string;
    }>;
    fetchClientPayments(request: AuthPayload, filterPaymentDto: QueryPaymentsDto): Promise<PagePayload<any>>;
    fetchClientPaymentByID(request: AuthPayload, idDto: IdDto): Promise<GenericDataPayload<Payment>>;
    fetchClientPaymentSummary(request: AuthPayload): Promise<GenericDataPayload<any>>;
}
