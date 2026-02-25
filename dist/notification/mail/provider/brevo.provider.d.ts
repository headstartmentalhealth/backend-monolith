import { ConfigService } from '@nestjs/config';
export declare class BrevoProvider {
    private readonly configService;
    private readonly brevoApiKey;
    private readonly brevoApiUrl;
    private readonly fromEmail;
    constructor(configService: ConfigService);
    sendEmail(to: string, subject: string, templateName: string, templateData?: Record<string, any>): Promise<any>;
    private renderTemplate;
}
