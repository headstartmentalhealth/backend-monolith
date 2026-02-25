"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.currencyMap = exports.DEFAULT_TIMEZONE = exports.DEFAULT_COUNTRY_CODE = exports.DEFAULT_COUNTRY = exports.DEFAULT_CURRENCY = exports.BusinessOwnerAccountRole = exports.Role = exports.USER = exports.BUSINESS = exports.OWNER = void 0;
var OWNER;
(function (OWNER) {
    OWNER["SUPER_ADMIN"] = "owner-super-administrator";
    OWNER["ADMIN"] = "owner-administrator";
})(OWNER || (exports.OWNER = OWNER = {}));
var BUSINESS;
(function (BUSINESS) {
    BUSINESS["SUPER_ADMIN"] = "business-super-administrator";
    BUSINESS["ADMIN"] = "business-administrator";
})(BUSINESS || (exports.BUSINESS = BUSINESS = {}));
var USER;
(function (USER) {
    USER["USER"] = "user";
})(USER || (exports.USER = USER = {}));
var Role;
(function (Role) {
    Role["OWNER_SUPER_ADMIN"] = "owner-super-administrator";
    Role["OWNER_ADMIN"] = "owner-administrator";
    Role["BUSINESS_SUPER_ADMIN"] = "business-super-administrator";
    Role["BUSINESS_ADMIN"] = "business-administrator";
    Role["USER"] = "user";
})(Role || (exports.Role = Role = {}));
var BusinessOwnerAccountRole;
(function (BusinessOwnerAccountRole) {
    BusinessOwnerAccountRole["USER"] = "user";
    BusinessOwnerAccountRole["BUSINESS_ADMIN"] = "business-administrator";
})(BusinessOwnerAccountRole || (exports.BusinessOwnerAccountRole = BusinessOwnerAccountRole = {}));
exports.DEFAULT_CURRENCY = 'NGN';
exports.DEFAULT_COUNTRY = 'Nigeria';
exports.DEFAULT_COUNTRY_CODE = 'NG';
exports.DEFAULT_TIMEZONE = 'Africa/Lagos';
exports.currencyMap = {
    NGN: 'https://doexcess-file-bucket.s3.us-east-1.amazonaws.com/assets/ngn.png',
    USD: 'https://doexcess-file-bucket.s3.us-east-1.amazonaws.com/assets/usd.png',
    GBP: 'https://doexcess-file-bucket.s3.us-east-1.amazonaws.com/assets/gbp.svg',
};
//# sourceMappingURL=generic.data.js.map