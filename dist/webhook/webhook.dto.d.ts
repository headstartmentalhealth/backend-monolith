export declare class PaystackWebhookDto {
    event: string;
    data: {
        id: string;
        reference: string;
        status: string;
        amount: number;
        metadata: {
            payment_id?: string;
            user_id?: string;
            plan_id?: string;
        };
        authorization: {
            authorization_code: string;
            card_type: string;
            last4: string;
            exp_month: string;
            exp_year: string;
            channel: string;
            bank: string;
        };
        customer: {
            email: string;
            first_name: string;
            last_name: string;
        };
    };
    plan?: {
        id: string;
        name: string;
        amount: number;
    };
    subscription?: {
        id: string;
        status: string;
    };
}
