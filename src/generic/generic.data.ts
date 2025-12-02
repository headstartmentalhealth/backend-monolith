// The Do-excess team
export enum OWNER {
  SUPER_ADMIN = 'owner-super-administrator',
  ADMIN = 'owner-administrator',
}

// The Business' team
export enum BUSINESS {
  SUPER_ADMIN = 'business-super-administrator',
  ADMIN = 'business-administrator',
}

export enum USER {
  USER = 'user',
}

export enum Role {
  OWNER_SUPER_ADMIN = 'owner-super-administrator',
  OWNER_ADMIN = 'owner-administrator',

  BUSINESS_SUPER_ADMIN = 'business-super-administrator',
  BUSINESS_ADMIN = 'business-administrator',

  USER = 'user',
}

export enum BusinessOwnerAccountRole {
  USER = 'user',
  BUSINESS_ADMIN = 'business-administrator',
}

export const DEFAULT_CURRENCY = 'NGN';
export const DEFAULT_COUNTRY = 'Nigeria';
export const DEFAULT_COUNTRY_CODE = 'NG';
export const DEFAULT_TIMEZONE = 'Africa/Lagos';

export const currencyMap: Record<string, string> = {
  NGN: 'https://doexcess-file-bucket.s3.us-east-1.amazonaws.com/assets/ngn.png',
  USD: 'https://doexcess-file-bucket.s3.us-east-1.amazonaws.com/assets/usd.png',
  GBP: 'https://doexcess-file-bucket.s3.us-east-1.amazonaws.com/assets/gbp.svg',
};
