import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from './generic.data';
import {
  BusinessInformation,
  Subscription,
  SubscriptionPeriod,
  SubscriptionPlan,
  SubscriptionPlanPrice,
  User,
} from '@prisma/client';
import { QueryDto } from './generic.dto';
import * as moment from 'moment-timezone';
import { v4 as uuidv4 } from 'uuid';

export const PAGINATION = {
  LIMIT: 20,
  PAGE: 1,
};

/**
 * Prepare date range keys
 * @param startDate
 * @param endDate
 * @returns
 */
export const dateRangeKeys = (startDate: string, endDate: string) => {
  // If endDate is not provided, set it to one month ago
  if (!endDate) {
    endDate = new Date().toUTCString(); // Current date
  }

  // Convert string dates to Date objects for further processing
  const end = new Date(endDate);

  // Validate if the dates are valid
  if (isNaN(end.getTime())) {
    throw new Error('Invalid date format');
  }

  const filters = {
    created_at: {
      gte: startDate ? new Date(startDate) : undefined,
      lte: end,
    },
  };

  return filters;
};

/**
 * Get Ip Address
 * @param request
 * @returns
 */
export const getIpAddress = (request: Request): string => {
  return (
    // @ts-ignore
    request?.ip ||
    request?.headers['x-forwarded-for'] ||
    // @ts-ignore
    request?.connection?.remoteAddress
  );
};

/**
 * Get user agent
 * @param request
 * @returns
 */
export const getUserAgent = (request: Request): string => {
  return request?.headers['user-agent'];
};

/**
 * Verify business
 * @param business
 */
export const verifyBusiness = (business: BusinessInformation) => {
  if (!business) {
    throw new NotFoundException('Business not found.');
  }
};

/**
 * Mask email address
 * @param email
 * @returns
 */
export const maskEmail = (email: string): string => {
  if (!email.includes('@')) {
    throw new Error('Invalid email format');
  }

  // Keep the first two characters, mask the middle part, and keep the last two characters
  return email.slice(0, 4) + '*'.repeat(email.length - 4) + email.slice(-2);
};

/**
 * Check if word is an email
 * @param word
 * @returns
 */
export const isValidEmail = (word: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(word);
};

/**
 * Mask the sensitive words of the sentence
 * @param sentence
 * @returns
 */
export const maskSensitive = (sentence: string): string => {
  // Convert sentence to array
  const sentenceInArray = sentence.split(' ');

  let formattedSentence = [];

  for (let index = 0; index < sentenceInArray.length; index++) {
    const word = sentenceInArray[index];

    let formattedWord = word;

    // Check if word is an email
    if (isValidEmail(word)) {
      formattedWord = maskEmail(word);
    }

    formattedSentence.push(formattedWord);
  }

  return formattedSentence.join(' ');
};

/**
 * Filter pages by dates, page number and limit
 * @param query
 * @returns
 */
export const pageFilter = (query: QueryDto) => {
  let { startDate, endDate, pagination } = query;

  const filters = dateRangeKeys(startDate, endDate);

  const pagination_options = {
    page: +pagination?.page || PAGINATION.PAGE,
    limit: +pagination?.limit || PAGINATION.LIMIT,
  };

  return {
    filters,
    pagination_options,
  };
};

/**
 * Check if date is expired
 * @param expiresAt
 * @returns
 */
export const isExpired = (expiresAt: Date | null): boolean => {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
};

/**
 * Get remaining days
 * @param expiryDate
 * @returns
 */
export const getRemainingDays = (expiryDate: string | Date): number => {
  const now = moment();
  const expiry = moment(expiryDate);

  // Calculate the difference in days
  const remainingDays = expiry.diff(now, 'day');

  return remainingDays >= 0 ? remainingDays : 0; // Return 0 if expired
};

export const TransactionError = (error: any, warn: any) => {
  if (error.code === 'P2034') {
    // Prisma transaction timeout error code
    warn('Transaction timed out, email not sent.');
  }
  throw error;
};

// Convert UTC to Africa/Lagos timezone
export const toTimezone = (
  date: Date | string,
  tz?: string,
  format?: string,
): string => {
  // Parse the input date (assuming it's in UTC)
  const utcDate = moment.utc(date);

  // Convert to Africa/Lagos timezone
  const tzDate = utcDate.tz(tz || 'Africa/Lagos');

  // Format the output (optional)
  return tzDate.format(format || 'YYYY-MM-DD HH:mm:ss.SSS');
};

/**
 * Verify subscription plan
 * @param subscriptionPlan
 */
export const verifySubscriptionPlan = (subscriptionPlan: {
  business_id: SubscriptionPlan['business_id'];
}) => {
  if (!subscriptionPlan) {
    throw new NotFoundException('Subscription plan not found.');
  }
};

/**
 * Calculate pagination
 * @param pagination
 * @returns
 */
export const calculatePagination = (pagination: {
  page?: number;
  limit?: number;
}) => {
  const page = pagination.page || 1; // Default page is 1
  const limit = pagination.limit || 10; // Default limit is 10

  const skip = (page - 1) * limit; // Calculate the skip value

  return { skip, take: limit };
};

/**
 * Rename value/data for deletion
 * @param data
 * @returns
 */
export const deletionRename = (data: string): string => {
  return `${data} - [Deleted: ${new Date().getTime()}]`;
};

/**
 * Boolean options enum
 */
export enum BooleanOptions {
  true = 'true',
  false = 'false',
}

/**
 * Get boolean value
 * @param value
 * @returns
 */
export const getBooleanOption = (value: BooleanOptions): boolean => {
  return value === BooleanOptions.true ? true : false;
};

const countryMapping: Record<string, string> = {
  AF: 'Afghanistan',
  AL: 'Albania',
  DZ: 'Algeria',
  AR: 'Argentina',
  AU: 'Australia',
  AT: 'Austria',
  BD: 'Bangladesh',
  BE: 'Belgium',
  BR: 'Brazil',
  CA: 'Canada',
  CN: 'China',
  CO: 'Colombia',
  HR: 'Croatia',
  CZ: 'Czech Republic',
  DK: 'Denmark',
  EG: 'Egypt',
  FI: 'Finland',
  FR: 'France',
  DE: 'Germany',
  GR: 'Greece',
  HK: 'Hong Kong',
  IN: 'India',
  ID: 'Indonesia',
  IR: 'Iran',
  IQ: 'Iraq',
  IE: 'Ireland',
  IT: 'Italy',
  JP: 'Japan',
  MY: 'Malaysia',
  MX: 'Mexico',
  MA: 'Morocco',
  NL: 'Netherlands',
  NZ: 'New Zealand',
  NG: 'Nigeria',
  NO: 'Norway',
  PK: 'Pakistan',
  PH: 'Philippines',
  PL: 'Poland',
  PT: 'Portugal',
  RU: 'Russia',
  SA: 'Saudi Arabia',
  SG: 'Singapore',
  ZA: 'South Africa',
  KR: 'South Korea',
  ES: 'Spain',
  SE: 'Sweden',
  CH: 'Switzerland',
  TH: 'Thailand',
  TR: 'Turkey',
  UA: 'Ukraine',
  AE: 'United Arab Emirates',
  GB: 'United Kingdom',
  US: 'United States',
  VN: 'Vietnam',
};

const paystackSupportedCountries = new Set([
  'NG',
  'GH',
  'ZA',
  'KE',
  'CI',
  'EG',
  'RW',
]);

export const getCountryName = (countryCode: string): string => {
  return countryMapping[countryCode.toUpperCase()] || '';
};

export const isPaystackSupported = (countryCode: string): boolean => {
  return paystackSupportedCountries.has(countryCode.toUpperCase());
};

export const calculateEndDate = (billingInterval: string): Date => {
  const date = new Date();

  switch (billingInterval) {
    case SubscriptionPeriod.monthly:
      date.setMonth(date.getMonth() + 1);
      break;
    case SubscriptionPeriod.quarterly:
      date.setMonth(date.getMonth() + 3);
      break;
    case SubscriptionPeriod.semi_annually:
      date.setMonth(date.getMonth() + 6);
      break;
    case SubscriptionPeriod.yearly:
      date.setFullYear(date.getFullYear() + 1);
      break;
    case SubscriptionPeriod.free:
    default:
      // Free plans may not have an expiration date
      return null;
  }

  return date;
};

export const formatMoney = (amount: number, currency = 'NGN'): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const addGracePeriod = (
  subscriptionEndDate: Date,
  graceDays = 10,
): Date => {
  const endDate = new Date(subscriptionEndDate);
  endDate.setDate(endDate.getDate() + graceDays);
  return endDate; // Returns a Date object
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getDaysUntilNextPayment = (
  nextPaymentDate: string | Date,
): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today's date (remove time part)

  const paymentDate = new Date(nextPaymentDate);
  paymentDate.setHours(0, 0, 0, 0); // Normalize the next payment date

  const timeDifference = paymentDate.getTime() - today.getTime();
  const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24)); // Convert milliseconds to days

  return daysDifference;
};

export const getEndDateFromDays = (
  givenDate: Date | string,
  daysFromNow: number,
): Date => {
  const given_date = new Date(givenDate);
  given_date.setHours(0, 0, 0, 0); // Normalize today's date (remove time part)

  const endDate = new Date(given_date);
  endDate.setDate(given_date.getDate() + daysFromNow); // Add the specified number of days

  return endDate;
};

export const formatNotificationMessage = ({
  notification,
  recipient,
}: {
  notification: any;
  recipient: User;
}): any => {
  return {
    ...notification,
    message: notification.message.replace('[Member Name]', recipient.name),
  };
};

export const shortenId = (id: string) => {
  return id.split('-')[0];
};

export const withDeleted = () => {
  return { deleted_at: null };
};

export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const onlyOwnerLogin = (role: Role) => {
  if (![Role.OWNER_ADMIN, Role.OWNER_SUPER_ADMIN].includes(role as Role)) {
    throw new ForbiddenException('Forbidden resource.');
  }
};

export const onlyBusinessLogin = (role: Role) => {
  if (
    ![Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN].includes(role as Role)
  ) {
    throw new ForbiddenException('Forbidden resource.');
  }
};

export const onlyUserLogin = (role: Role) => {
  if (![Role.USER].includes(role as Role)) {
    throw new ForbiddenException('Forbidden resource.');
  }
};

export const doexcessCharge = (percent: number) => {
  return percent / 100;
};

export const feeAmount = (amount: number, percent: number) => {
  return (amount * percent) / 100;
};

export const reformatUnderscoreText = (text: string) => {
  return text.split('_').join(' ');
};

export const reformatText = (text: string, separator: string) => {
  return text.split(separator).join(' ');
};

export const formatFileNamee = (file: string): string => {
  // 🟢 Format filename: remove whitespace, lowercase, replace special chars
  const originalName = file.split('.')[0];
  const extension = file.split('.').pop();
  const formattedName = originalName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_') // replace spaces with underscores
    .replace(/[^a-z0-9_-]/g, ''); // remove invalid chars

  const publicId = `${formattedName}_${Date.now()}`;

  return publicId;
};

export const prioritizeNGN = <T extends { currency: string }>(
  arr: T[],
): T[] => {
  return arr.sort((a, b) => {
    if (a.currency === 'NGN') return -1;
    if (b.currency === 'NGN') return 1;
    return a.currency.localeCompare(b.currency);
  });
};

export const prioritizeShorthandNGN = (arr: string[]): string[] => {
  return arr.sort((a, b) => {
    if (a === 'NGN') return -1;
    if (b === 'NGN') return 1;
    return a.localeCompare(b);
  });
};

export const businessIdFilter = (business_id: string) => {
  return [
    {
      purchase: {
        path: ['business_id'],
        equals: business_id,
      },
    },
    {
      subscription_plan: {
        business_id: { equals: business_id },
      },
    },
  ];
};

export function createProductIdentifiers(
  business_name: string,
  product_name = 'SKU',
) {
  const id = uuidv4();

  const abbr_bn = business_name
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 2)
    .toUpperCase();

  const abbr_prod = product_name
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase();

  const sku = `${abbr_bn}-${abbr_prod}-${id.slice(0, 8).toUpperCase()}`;
  return { id, sku };
}
