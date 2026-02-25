"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaystackService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let PaystackService = class PaystackService {
    constructor(configService) {
        this.configService = configService;
        this.PAYSTACK_SECRET_KEY = this.configService.get('PAYSTACK_SECRET_KEY');
        this.headers = {
            Authorization: `Bearer ${this.configService.get('PAYSTACK_SECRET_KEY')}`,
            'Content-Type': 'application/json',
        };
    }
    async initializeTransaction(data) {
        try {
            const payload = {
                email: data.email,
                amount: data.amount * 100,
                metadata: data.metadata,
            };
            const response = await (0, axios_1.default)({
                url: `${this.configService.get('PAYSTACK_BASE_URL')}/transaction/initialize`,
                method: 'POST',
                data: payload,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.PAYSTACK_SECRET_KEY}`,
                },
            });
            console.log(response);
            return response.data;
        }
        catch (error) {
            console.error('Error:', error);
            throw new common_1.InternalServerErrorException(error.response.data.message);
        }
    }
    async verifyTransaction(reference) {
        try {
            const response = await (0, axios_1.default)({
                url: `${this.configService.get('PAYSTACK_BASE_URL')}/transaction/verify/${reference}`,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.PAYSTACK_SECRET_KEY}`,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('Error:', error);
            throw new common_1.InternalServerErrorException(error.response.data.message);
        }
    }
    async resolveAccountNumber(accountNumber, bankCode) {
        try {
            const response = await (0, axios_1.default)({
                url: `${this.configService.get('PAYSTACK_BASE_URL')}/transferrecipient`,
                method: 'POST',
                data: {
                    account_number: accountNumber,
                    bank_code: bankCode,
                },
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.PAYSTACK_SECRET_KEY}`,
                },
            });
            if (response.data.status) {
                return response.data;
            }
            throw new common_1.BadRequestException('Account number could not be resolved.');
        }
        catch (error) {
            console.error('Error:', error);
            throw new common_1.InternalServerErrorException(error.response?.data?.message || 'Account resolution failed');
        }
    }
    async chargeAuthorization(email, amount, authorizationCode) {
        try {
            const response = await axios_1.default.post(`${this.configService.get('PAYSTACK_BASE_URL')}/transaction/charge_authorization`, {
                email,
                amount: amount * 100,
                authorization_code: authorizationCode,
            }, {
                headers: {
                    Authorization: `Bearer ${this.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('Error:', error);
            throw new common_1.InternalServerErrorException(error.response?.data?.message);
        }
    }
    async getBanks() {
        try {
            const response = await axios_1.default.get(`${this.configService.get('PAYSTACK_BASE_URL')}/bank`, {
                headers: {
                    Authorization: `Bearer ${this.PAYSTACK_SECRET_KEY}`,
                },
                params: {
                    country: 'nigeria',
                },
            });
            return response.data;
        }
        catch (error) {
            throw new common_1.HttpException(error?.response?.data || 'Failed to fetch banks', error?.response?.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createTransferRecipient(data) {
        try {
            const response = await axios_1.default.post(`${this.configService.get('PAYSTACK_BASE_URL')}/transferrecipient`, {
                ...data,
            }, { headers: this.headers });
            if (!response.data.status) {
                throw new common_1.BadRequestException(response.data.message || 'Failed to create transfer recipient');
            }
            return response.data.data;
        }
        catch (error) {
            throw new common_1.BadRequestException(error.response?.data?.message ||
                'Paystack error while creating transfer recipient');
        }
    }
    async initiateTransfer(data) {
        try {
            const response = await axios_1.default.post(`${this.configService.get('PAYSTACK_BASE_URL')}/transfer`, {
                source: 'balance',
                amount: data.amount * 100,
                recipient: data.recipient_code,
                reason: data.reason || 'Withdrawal',
                currency: data.currency || 'NGN',
            }, { headers: this.headers });
            return response.data;
        }
        catch (error) {
            console.log(error);
            throw new common_1.BadRequestException(error?.response?.data?.message);
        }
    }
    async finalizeTransfer(transfer_code, otp) {
        try {
            const response = await axios_1.default.post(`${this.configService.get('PAYSTACK_BASE_URL')}/transfer/finalize_transfer`, {
                transfer_code: transfer_code,
                otp: otp,
            }, {
                headers: this.headers,
            });
            return response.data;
        }
        catch (error) {
            console.log(error);
            throw new common_1.BadRequestException(error?.response?.data?.message);
        }
    }
    async verifyTransfer(reference) {
        try {
            const response = await axios_1.default.get(`${this.configService.get('PAYSTACK_BASE_URL')}/transfer/verify/${reference}`, {
                headers: this.headers,
            });
            return response.data;
        }
        catch (error) {
            console.log(error);
            throw new common_1.BadRequestException(error?.response?.data?.message);
        }
    }
};
exports.PaystackService = PaystackService;
exports.PaystackService = PaystackService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PaystackService);
//# sourceMappingURL=paystack.provider.js.map