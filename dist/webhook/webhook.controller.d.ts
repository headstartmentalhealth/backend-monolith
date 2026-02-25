import { WebhookService } from './webhook.service';
export declare class WebhookController {
    private readonly webhookService;
    constructor(webhookService: WebhookService);
    handleWebhook(request: Request): Promise<{
        statusCode: number;
        message: string;
    }>;
}
