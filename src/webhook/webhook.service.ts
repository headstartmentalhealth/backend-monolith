import { Timezone } from '@/generic/generic.payload';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from '@/subscription/subscription.service';
import { PaystackWebhookDto } from './webhook.dto';
import { Injectable } from '@nestjs/common';
import { PurchaseType } from '@prisma/client';
import { PaymentService } from '@/payment/payment.service';

@Injectable()
export class WebhookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Handle webhook for all events
   * @param request
   * @returns
   */
  async handleWebhook(request: Request | any) {
    const event: PaystackWebhookDto = request.body;

    // Get payment id by reference
    const payment = await this.prisma.payment.findFirstOrThrow({
      where: { transaction_id: event.data.reference },
    });

    // Create the payment gateway log
    await this.prisma.paymentGatewayLog.create({
      data: {
        payment_id: payment?.id,
        event_type: event.event,
        payload: event.data,
        metadata: event.data.metadata,
      },
    });

    if (event.event === 'charge.success') {
      // Verify payment
      if (payment.purchase_type === PurchaseType.SUBSCRIPTION) {
        await this.subscriptionService.verifyPayment(request, {
          payment_id: payment?.id,
        });
      } else {
        await this.paymentService.verifyPayment(request, {
          payment_id: payment?.id,
        });
      }
    }

    return { statusCode: 200, message: 'Webhook received.' };
  }
}
