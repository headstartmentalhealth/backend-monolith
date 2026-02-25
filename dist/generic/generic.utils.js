"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessIdFilter = exports.prioritizeShorthandNGN = exports.prioritizeNGN = exports.formatFileNamee = exports.reformatText = exports.reformatUnderscoreText = exports.feeAmount = exports.doexcessCharge = exports.onlyUserLogin = exports.onlyBusinessLogin = exports.onlyOwnerLogin = exports.generateOtp = exports.withDeleted = exports.shortenId = exports.formatNotificationMessage = exports.getEndDateFromDays = exports.getDaysUntilNextPayment = exports.sleep = exports.addGracePeriod = exports.formatMoney = exports.calculateEndDate = exports.isPaystackSupported = exports.getCountryName = exports.getBooleanOption = exports.BooleanOptions = exports.deletionRename = exports.calculatePagination = exports.verifySubscriptionPlan = exports.toTimezone = exports.TransactionError = exports.getRemainingDays = exports.isExpired = exports.pageFilter = exports.maskSensitive = exports.isValidEmail = exports.maskEmail = exports.verifyBusiness = exports.getUserAgent = exports.getIpAddress = exports.dateRangeKeys = exports.PAGINATION = void 0;
exports.createProductIdentifiers = createProductIdentifiers;
const common_1 = require("@nestjs/common");
const generic_data_1 = require("./generic.data");
const client_1 = require("@prisma/client");
const moment = require("moment-timezone");
const uuid_1 = require("uuid");
exports.PAGINATION = {
    LIMIT: 20,
    PAGE: 1,
};
const dateRangeKeys = (startDate, endDate) => {
    if (!endDate) {
        endDate = new Date().toUTCString();
    }
    const end = new Date(endDate);
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
exports.dateRangeKeys = dateRangeKeys;
const getIpAddress = (request) => {
    return (request?.ip ||
        request?.headers['x-forwarded-for'] ||
        request?.connection?.remoteAddress);
};
exports.getIpAddress = getIpAddress;
const getUserAgent = (request) => {
    return request?.headers['user-agent'];
};
exports.getUserAgent = getUserAgent;
const verifyBusiness = (business) => {
    if (!business) {
        throw new common_1.NotFoundException('Business not found.');
    }
};
exports.verifyBusiness = verifyBusiness;
const maskEmail = (email) => {
    if (!email.includes('@')) {
        throw new Error('Invalid email format');
    }
    return email.slice(0, 4) + '*'.repeat(email.length - 4) + email.slice(-2);
};
exports.maskEmail = maskEmail;
const isValidEmail = (word) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(word);
};
exports.isValidEmail = isValidEmail;
const maskSensitive = (sentence) => {
    const sentenceInArray = sentence.split(' ');
    let formattedSentence = [];
    for (let index = 0; index < sentenceInArray.length; index++) {
        const word = sentenceInArray[index];
        let formattedWord = word;
        if ((0, exports.isValidEmail)(word)) {
            formattedWord = (0, exports.maskEmail)(word);
        }
        formattedSentence.push(formattedWord);
    }
    return formattedSentence.join(' ');
};
exports.maskSensitive = maskSensitive;
const pageFilter = (query) => {
    let { startDate, endDate, pagination } = query;
    const filters = (0, exports.dateRangeKeys)(startDate, endDate);
    const pagination_options = {
        page: +pagination?.page || exports.PAGINATION.PAGE,
        limit: +pagination?.limit || exports.PAGINATION.LIMIT,
    };
    return {
        filters,
        pagination_options,
    };
};
exports.pageFilter = pageFilter;
const isExpired = (expiresAt) => {
    if (!expiresAt)
        return true;
    return new Date() > expiresAt;
};
exports.isExpired = isExpired;
const getRemainingDays = (expiryDate) => {
    const now = moment();
    const expiry = moment(expiryDate);
    const remainingDays = expiry.diff(now, 'day');
    return remainingDays >= 0 ? remainingDays : 0;
};
exports.getRemainingDays = getRemainingDays;
const TransactionError = (error, warn) => {
    if (error.code === 'P2034') {
        warn('Transaction timed out, email not sent.');
    }
    throw error;
};
exports.TransactionError = TransactionError;
const toTimezone = (date, tz, format) => {
    const utcDate = moment.utc(date);
    const tzDate = utcDate.tz(tz || 'Africa/Lagos');
    return tzDate.format(format || 'YYYY-MM-DD HH:mm:ss.SSS');
};
exports.toTimezone = toTimezone;
const verifySubscriptionPlan = (subscriptionPlan) => {
    if (!subscriptionPlan) {
        throw new common_1.NotFoundException('Subscription plan not found.');
    }
};
exports.verifySubscriptionPlan = verifySubscriptionPlan;
const calculatePagination = (pagination) => {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;
    return { skip, take: limit };
};
exports.calculatePagination = calculatePagination;
const deletionRename = (data) => {
    return `${data} - [Deleted: ${new Date().getTime()}]`;
};
exports.deletionRename = deletionRename;
var BooleanOptions;
(function (BooleanOptions) {
    BooleanOptions["true"] = "true";
    BooleanOptions["false"] = "false";
})(BooleanOptions || (exports.BooleanOptions = BooleanOptions = {}));
const getBooleanOption = (value) => {
    return value === BooleanOptions.true ? true : false;
};
exports.getBooleanOption = getBooleanOption;
const countryMapping = {
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
const getCountryName = (countryCode) => {
    return countryMapping[countryCode.toUpperCase()] || '';
};
exports.getCountryName = getCountryName;
const isPaystackSupported = (countryCode) => {
    return paystackSupportedCountries.has(countryCode.toUpperCase());
};
exports.isPaystackSupported = isPaystackSupported;
const calculateEndDate = (billingInterval) => {
    const date = new Date();
    switch (billingInterval) {
        case client_1.SubscriptionPeriod.monthly:
            date.setMonth(date.getMonth() + 1);
            break;
        case client_1.SubscriptionPeriod.quarterly:
            date.setMonth(date.getMonth() + 3);
            break;
        case client_1.SubscriptionPeriod.semi_annually:
            date.setMonth(date.getMonth() + 6);
            break;
        case client_1.SubscriptionPeriod.yearly:
            date.setFullYear(date.getFullYear() + 1);
            break;
        case client_1.SubscriptionPeriod.free:
        default:
            return null;
    }
    return date;
};
exports.calculateEndDate = calculateEndDate;
const formatMoney = (amount, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
    }).format(amount);
};
exports.formatMoney = formatMoney;
const addGracePeriod = (subscriptionEndDate, graceDays = 10) => {
    const endDate = new Date(subscriptionEndDate);
    endDate.setDate(endDate.getDate() + graceDays);
    return endDate;
};
exports.addGracePeriod = addGracePeriod;
const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
exports.sleep = sleep;
const getDaysUntilNextPayment = (nextPaymentDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const paymentDate = new Date(nextPaymentDate);
    paymentDate.setHours(0, 0, 0, 0);
    const timeDifference = paymentDate.getTime() - today.getTime();
    const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
    return daysDifference;
};
exports.getDaysUntilNextPayment = getDaysUntilNextPayment;
const getEndDateFromDays = (givenDate, daysFromNow) => {
    const given_date = new Date(givenDate);
    given_date.setHours(0, 0, 0, 0);
    const endDate = new Date(given_date);
    endDate.setDate(given_date.getDate() + daysFromNow);
    return endDate;
};
exports.getEndDateFromDays = getEndDateFromDays;
const formatNotificationMessage = ({ notification, recipient, }) => {
    return {
        ...notification,
        message: notification.message.replace('[Member Name]', recipient.name),
    };
};
exports.formatNotificationMessage = formatNotificationMessage;
const shortenId = (id) => {
    return id.split('-')[0];
};
exports.shortenId = shortenId;
const withDeleted = () => {
    return { deleted_at: null };
};
exports.withDeleted = withDeleted;
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateOtp = generateOtp;
const onlyOwnerLogin = (role) => {
    if (![generic_data_1.Role.OWNER_ADMIN, generic_data_1.Role.OWNER_SUPER_ADMIN].includes(role)) {
        throw new common_1.ForbiddenException('Forbidden resource.');
    }
};
exports.onlyOwnerLogin = onlyOwnerLogin;
const onlyBusinessLogin = (role) => {
    if (![generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN].includes(role)) {
        throw new common_1.ForbiddenException('Forbidden resource.');
    }
};
exports.onlyBusinessLogin = onlyBusinessLogin;
const onlyUserLogin = (role) => {
    if (![generic_data_1.Role.USER].includes(role)) {
        throw new common_1.ForbiddenException('Forbidden resource.');
    }
};
exports.onlyUserLogin = onlyUserLogin;
const doexcessCharge = (percent) => {
    return percent / 100;
};
exports.doexcessCharge = doexcessCharge;
const feeAmount = (amount, percent) => {
    return (amount * percent) / 100;
};
exports.feeAmount = feeAmount;
const reformatUnderscoreText = (text) => {
    return text.split('_').join(' ');
};
exports.reformatUnderscoreText = reformatUnderscoreText;
const reformatText = (text, separator) => {
    return text.split(separator).join(' ');
};
exports.reformatText = reformatText;
const formatFileNamee = (file) => {
    const originalName = file.split('.')[0];
    const extension = file.split('.').pop();
    const formattedName = originalName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_-]/g, '');
    const publicId = `${formattedName}_${Date.now()}`;
    return publicId;
};
exports.formatFileNamee = formatFileNamee;
const prioritizeNGN = (arr) => {
    return arr.sort((a, b) => {
        if (a.currency === 'NGN')
            return -1;
        if (b.currency === 'NGN')
            return 1;
        return a.currency.localeCompare(b.currency);
    });
};
exports.prioritizeNGN = prioritizeNGN;
const prioritizeShorthandNGN = (arr) => {
    return arr.sort((a, b) => {
        if (a === 'NGN')
            return -1;
        if (b === 'NGN')
            return 1;
        return a.localeCompare(b);
    });
};
exports.prioritizeShorthandNGN = prioritizeShorthandNGN;
const businessIdFilter = (business_id) => {
    return [
        {
            purchase: {
                path: ['business_id'],
                string_contains: business_id,
            },
        },
        {
            subscription_plan: {
                business_id: { equals: business_id },
            },
        },
    ];
};
exports.businessIdFilter = businessIdFilter;
function createProductIdentifiers(business_name, product_name = 'SKU') {
    const id = (0, uuid_1.v4)();
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
//# sourceMappingURL=generic.utils.js.map