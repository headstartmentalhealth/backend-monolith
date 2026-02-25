import { ConfigService } from '@nestjs/config';
export interface IInitialize {
    authorization_url: string;
    access_code: string;
    reference: string;
}
export interface IVerify {
    id: number;
    domain: string;
    status: string;
    reference: string;
    receipt_number: string | null;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: string | null;
    log: {
        start_time: number;
        time_spent: number;
        attempts: number;
        errors: number;
        success: boolean;
        mobile: boolean;
        input: any[];
        history: {
            type: string;
            message: string;
            time: number;
        }[];
    };
    fees: number;
    fees_split: any | null;
    authorization: {
        authorization_code: string;
        bin: string;
        last4: string;
        exp_month: string;
        exp_year: string;
        channel: string;
        card_type: string;
        bank: string;
        country_code: string;
        brand: string;
        reusable: boolean;
        signature: string;
        account_name: string | null;
    };
    customer: {
        id: number;
        first_name: string | null;
        last_name: string | null;
        email: string;
        customer_code: string;
        phone: string | null;
        metadata: any | null;
        risk_action: string;
        international_format_phone: string | null;
    };
    plan: any | null;
    split: Record<string, any>;
    order_id: string | null;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
    pos_transaction_data: any | null;
    source: any | null;
    fees_breakdown: any | null;
    connect: any | null;
    transaction_date: string;
    plan_object: Record<string, any>;
    subaccount: Record<string, any>;
}
export interface ITrx<T> {
    status: boolean;
    data: T;
}
export declare class PaystackService {
    private readonly configService;
    private PAYSTACK_SECRET_KEY;
    private headers;
    constructor(configService: ConfigService);
    initializeTransaction(data: {
        email: string;
        amount: number;
        metadata?: any;
    }): Promise<ITrx<IInitialize>>;
    verifyTransaction(reference: string): Promise<ITrx<IVerify>>;
    resolveAccountNumber(accountNumber: string, bankCode: string): Promise<any>;
    chargeAuthorization(email: string, amount: number, authorizationCode: string): Promise<PaymentRecordResponse>;
    getBanks(): Promise<any>;
    createTransferRecipient(data: {
        type: 'nuban';
        name: string;
        account_number: string;
        bank_code: string;
        currency: 'NGN';
    }): Promise<{
        recipient_code: string;
    }>;
    initiateTransfer(data: {
        amount: number;
        recipient_code: string;
        reason?: string;
        currency?: string;
    }): Promise<any>;
    finalizeTransfer(transfer_code: string, otp: string): Promise<any>;
    verifyTransfer(reference: string): Promise<any>;
}
