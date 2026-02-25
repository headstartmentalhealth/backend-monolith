import { AllowedCurrency, BusinessAccountCurrency, BusinessProductEnabledCurrency } from '@prisma/client';
export declare class CurrencyPayload {
    statusCode: number;
    data: {
        system: AllowedCurrency[];
        account: BusinessAccountCurrency[];
        product: BusinessProductEnabledCurrency[];
    };
}
