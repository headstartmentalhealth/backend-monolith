import { ConfigService } from '@nestjs/config';
export declare class TurnstileService {
    private readonly configService;
    constructor(configService: ConfigService);
    validateToken(token: string, remoteip?: string): Promise<void>;
}
