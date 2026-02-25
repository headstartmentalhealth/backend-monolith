import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
export declare class WhatsappService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    private readonly whatsappApiUrl;
    private readonly whatsappApiKey;
    sendBulkMessage(recipient: User, notification: any): Promise<void>;
}
