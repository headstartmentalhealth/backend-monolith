import { ConfigService } from '@nestjs/config';
import { FlutterwaveTransactionResponse } from './flutterwave.utils';
export declare class FlutterwaveService {
    private readonly configService;
    private secretKey;
    private baseUrl;
    constructor(configService: ConfigService);
    initializePayment(payload: {
        amount: number;
        email: string;
        tx_ref: string;
        currency?: string;
        redirect_url?: string;
    }): Promise<any>;
    verifyPayment(transactionId: string): Promise<FlutterwaveTransactionResponse>;
}
