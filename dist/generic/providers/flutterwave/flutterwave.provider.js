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
exports.FlutterwaveService = void 0;
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let FlutterwaveService = class FlutterwaveService {
    constructor(configService) {
        this.configService = configService;
        this.secretKey = this.configService.get('FLUTTERWAVE_SECRET_KEY');
        this.baseUrl = this.configService.get('FLUTTERWAVE_BASE_URL');
    }
    async initializePayment(payload) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/payments`, {
                tx_ref: payload.tx_ref,
                amount: payload.amount,
                currency: payload.currency || 'NGN',
                redirect_url: payload.redirect_url || 'http://localhost:3000/redirect',
                customer: { email: payload.email },
                payment_options: 'card,ussd,banktransfer',
            }, {
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (err) {
            throw new common_1.HttpException(err.response?.data || err.message, 400);
        }
    }
    async verifyPayment(transactionId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/transactions/${transactionId}/verify`, {
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                },
            });
            return response.data;
        }
        catch (err) {
            console.log(err);
            throw new common_1.HttpException(err.response?.data || err.message, 400);
        }
    }
};
exports.FlutterwaveService = FlutterwaveService;
exports.FlutterwaveService = FlutterwaveService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FlutterwaveService);
//# sourceMappingURL=flutterwave.provider.js.map