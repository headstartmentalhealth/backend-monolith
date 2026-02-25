"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const prisma_service_1 = require("../prisma/prisma.service");
const subscription_service_1 = require("../subscription/subscription.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const payment_service_1 = require("../payment/payment.service");
let WebhookService = class WebhookService {
    constructor(prisma, subscriptionService, paymentService) {
        this.prisma = prisma;
        this.subscriptionService = subscriptionService;
        this.paymentService = paymentService;
    }
    async handleWebhook(request) {
        const event = request.body;
        const payment = await this.prisma.payment.findFirstOrThrow({
            where: { transaction_id: event.data.reference },
        });
        await this.prisma.paymentGatewayLog.create({
            data: {
                payment_id: payment?.id,
                event_type: event.event,
                payload: event.data,
                metadata: event.data.metadata,
            },
        });
        if (event.event === 'charge.success') {
            if (payment.purchase_type === client_1.PurchaseType.SUBSCRIPTION) {
                await this.subscriptionService.verifyPayment(request, {
                    payment_id: payment?.id,
                });
            }
            else {
                await this.paymentService.verifyPayment(request, {
                    payment_id: payment?.id,
                });
            }
        }
        return { statusCode: 200, message: 'Webhook received.' };
    }
};
exports.WebhookService = WebhookService;
exports.WebhookService = WebhookService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService,
        payment_service_1.PaymentService])
], WebhookService);
//# sourceMappingURL=webhook.service.js.map