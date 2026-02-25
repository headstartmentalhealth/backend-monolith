type PaymentRecordResponse = {
    status: boolean;
    message: string;
    data: PaymentData;
};
type PaymentData = {
    amount: number;
    currency: string;
    transaction_date: string;
    status: string;
    reference: string;
    domain: string;
    metadata: string | null;
    gateway_response: string;
    message: string | null;
    channel: string;
    ip_address: string | null;
    log: string | null;
    fees: number;
    authorization: Authorization;
    customer: Customer;
    plan: string | null;
    id: number;
};
type Authorization = {
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
type Customer = {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string;
    customer_code: string;
    phone: string | null;
    metadata: CustomerMetadata;
    risk_action: string;
    international_format_phone: string | null;
};
type CustomerMetadata = {
    custom_fields: CustomField[];
};
type CustomField = {
    display_name: string;
    variable_name: string;
    value: string;
};
