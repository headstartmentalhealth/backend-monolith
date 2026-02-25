import { Role } from './generic.data';
import { BusinessInformation, SubscriptionPlan, User } from '@prisma/client';
import { QueryDto } from './generic.dto';
export declare const PAGINATION: {
    LIMIT: number;
    PAGE: number;
};
export declare const dateRangeKeys: (startDate: string, endDate: string) => {
    created_at: {
        gte: Date;
        lte: Date;
    };
};
export declare const getIpAddress: (request: Request) => string;
export declare const getUserAgent: (request: Request) => string;
export declare const verifyBusiness: (business: BusinessInformation) => void;
export declare const maskEmail: (email: string) => string;
export declare const isValidEmail: (word: string) => boolean;
export declare const maskSensitive: (sentence: string) => string;
export declare const pageFilter: (query: QueryDto) => {
    filters: {
        created_at: {
            gte: Date;
            lte: Date;
        };
    };
    pagination_options: {
        page: number;
        limit: number;
    };
};
export declare const isExpired: (expiresAt: Date | null) => boolean;
export declare const getRemainingDays: (expiryDate: string | Date) => number;
export declare const TransactionError: (error: any, warn: any) => never;
export declare const toTimezone: (date: Date | string, tz?: string, format?: string) => string;
export declare const verifySubscriptionPlan: (subscriptionPlan: {
    business_id: SubscriptionPlan["business_id"];
}) => void;
export declare const calculatePagination: (pagination: {
    page?: number;
    limit?: number;
}) => {
    skip: number;
    take: number;
};
export declare const deletionRename: (data: string) => string;
export declare enum BooleanOptions {
    true = "true",
    false = "false"
}
export declare const getBooleanOption: (value: BooleanOptions) => boolean;
export declare const getCountryName: (countryCode: string) => string;
export declare const isPaystackSupported: (countryCode: string) => boolean;
export declare const calculateEndDate: (billingInterval: string) => Date;
export declare const formatMoney: (amount: number, currency?: string) => string;
export declare const addGracePeriod: (subscriptionEndDate: Date, graceDays?: number) => Date;
export declare const sleep: (ms: number) => Promise<unknown>;
export declare const getDaysUntilNextPayment: (nextPaymentDate: string | Date) => number;
export declare const getEndDateFromDays: (givenDate: Date | string, daysFromNow: number) => Date;
export declare const formatNotificationMessage: ({ notification, recipient, }: {
    notification: any;
    recipient: User;
}) => any;
export declare const shortenId: (id: string) => string;
export declare const withDeleted: () => {
    deleted_at: any;
};
export declare const generateOtp: () => string;
export declare const onlyOwnerLogin: (role: Role) => void;
export declare const onlyBusinessLogin: (role: Role) => void;
export declare const onlyUserLogin: (role: Role) => void;
export declare const doexcessCharge: (percent: number) => number;
export declare const feeAmount: (amount: number, percent: number) => number;
export declare const reformatUnderscoreText: (text: string) => string;
export declare const reformatText: (text: string, separator: string) => string;
export declare const formatFileNamee: (file: string) => string;
export declare const prioritizeNGN: <T extends {
    currency: string;
}>(arr: T[]) => T[];
export declare const prioritizeShorthandNGN: (arr: string[]) => string[];
export declare const businessIdFilter: (business_id: string) => ({
    purchase: {
        path: string[];
        string_contains: string;
    };
    subscription_plan?: undefined;
} | {
    subscription_plan: {
        business_id: {
            equals: string;
        };
    };
    purchase?: undefined;
})[];
export declare function createProductIdentifiers(business_name: string, product_name?: string): {
    id: string;
    sku: string;
};
