import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from '@/subscription/subscription.service';
import { PaymentService } from '@/payment/payment.service';
export declare class WebhookService {
    private readonly prisma;
    private readonly subscriptionService;
    private readonly paymentService;
    constructor(prisma: PrismaService, subscriptionService: SubscriptionService, paymentService: PaymentService);
    handleWebhook(request: Request | any): Promise<{
        statusCode: number;
        message: string;
    }>;
}
