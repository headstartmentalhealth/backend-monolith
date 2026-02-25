export declare enum OWNER {
    SUPER_ADMIN = "owner-super-administrator",
    ADMIN = "owner-administrator"
}
export declare enum BUSINESS {
    SUPER_ADMIN = "business-super-administrator",
    ADMIN = "business-administrator"
}
export declare enum USER {
    USER = "user"
}
export declare enum Role {
    OWNER_SUPER_ADMIN = "owner-super-administrator",
    OWNER_ADMIN = "owner-administrator",
    BUSINESS_SUPER_ADMIN = "business-super-administrator",
    BUSINESS_ADMIN = "business-administrator",
    USER = "user"
}
export declare enum BusinessOwnerAccountRole {
    USER = "user",
    BUSINESS_ADMIN = "business-administrator"
}
export declare const DEFAULT_CURRENCY = "NGN";
export declare const DEFAULT_COUNTRY = "Nigeria";
export declare const DEFAULT_COUNTRY_CODE = "NG";
export declare const DEFAULT_TIMEZONE = "Africa/Lagos";
export declare const currencyMap: Record<string, string>;
