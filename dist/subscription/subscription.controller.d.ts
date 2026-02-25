import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto, RenewSubscriptionDto, UpgradeSubscriptionDto, VerifySubscriptionDto } from './subscription.dto';
import { GenericPayload, Timezone } from '@/generic/generic.payload';
export declare class SubscriptionController {
    private readonly subscriptionService;
    constructor(subscriptionService: SubscriptionService);
    createSubscription(request: Timezone & Request, createSubscriptionDto: CreateSubscriptionDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            authorization_url: string;
            payment_id: string;
        };
    }>;
    verifyPayment(request: Timezone & Request, verifySubscriptionDto: VerifySubscriptionDto): Promise<GenericPayload>;
    renewSubscription(request: Timezone & Request, renewSubscriptionDto: RenewSubscriptionDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            authorization_url: string;
            payment_id: string;
        };
    }>;
    upgradeSubscription(request: Timezone & Request, param: {
        subscription_id: string;
    }, upgradeSubscriptionDto: UpgradeSubscriptionDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            authorization_url: string;
            payment_id: string;
        };
    }>;
}
