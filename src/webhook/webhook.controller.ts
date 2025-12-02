import { Controller, Post, Req } from '@nestjs/common';
import { Public } from '@/account/auth/decorators/auth.decorator';
import { WebhookService } from './webhook.service';

@Controller('v1/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('paystack')
  @Public()
  async handleWebhook(@Req() request: Request) {
    return this.webhookService.handleWebhook(request);
  }
}
