export declare enum FlutterwaveStatus {
    SUCCESS = "success"
}
export interface FlutterwaveTransactionResponse {
    status: string;
    message: string;
    data: FlutterwaveTransactionData;
}
export interface FlutterwaveTransactionData {
    id: number;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    ip: string;
    narration: string;
    status: string;
    payment_type: string;
    created_at: string;
    account_id: number;
    meta: FlutterwaveTransactionMeta;
    amount_settled: number;
    customer: FlutterwaveCustomer;
}
export interface FlutterwaveTransactionMeta {
    __CheckoutInitAddress: string;
}
export interface FlutterwaveCustomer {
    id: number;
    name: string;
    phone_number: string;
    email: string;
    created_at: string;
}
