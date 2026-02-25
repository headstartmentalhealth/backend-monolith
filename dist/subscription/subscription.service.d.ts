import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from '../generic/providers/paystack/paystack.provider';
import { CreateSubscriptionDto, RenewSubscriptionDto, UpgradeSubscriptionDto, VerifySubscriptionDto } from './subscription.dto';
import { SubscriptionPlanPriceService } from '../subscription_plan/price/price.service';
import { AuthService } from '../account/auth/auth.service';
import { BillingService } from '../account/billing/billing.service';
import { LogService } from '../log/log.service';
import { GenericPayload, Timezone } from '../generic/generic.payload';
import { MailService } from '../notification/mail/mail.service';
import { GenericService } from '../generic/generic.service';
import { ConfigService } from '@nestjs/config';
export declare class SubscriptionService {
    private readonly prisma;
    private readonly paystackService;
    private readonly subscriptionPlanPriceService;
    private readonly authService;
    private readonly billingService;
    private readonly logService;
    private readonly mailService;
    private readonly logger;
    private readonly genericService;
    private readonly configService;
    private readonly model;
    constructor(prisma: PrismaService, paystackService: PaystackService, subscriptionPlanPriceService: SubscriptionPlanPriceService, authService: AuthService, billingService: BillingService, logService: LogService, mailService: MailService, logger: Logger, genericService: GenericService, configService: ConfigService);
    createSubscription(request: Timezone & Request, createSubscriptionDto: CreateSubscriptionDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            authorization_url: string;
            payment_id: string;
        };
    }>;
    verifyPayment(request: Timezone & Request, verifySubscriptionDto: VerifySubscriptionDto): Promise<GenericPayload>;
    processAutoRenewals(): Promise<void>;
    processElapsedGracePeriodSubscriptions(): Promise<void>;
    initiateSubscriptionRenewal(request: Timezone & Request, renewSubscriptionDto: RenewSubscriptionDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            authorization_url: string;
            payment_id: string;
        };
    }>;
    initiateSubscriptionUpgrade(request: Timezone & Request, subscriptionId: string, upgradeSubscriptionDto: UpgradeSubscriptionDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            authorization_url: string;
            payment_id: string;
        };
    }>;
}
