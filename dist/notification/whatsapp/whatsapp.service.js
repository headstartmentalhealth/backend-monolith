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
var WhatsappService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const config_1 = require("@nestjs/config");
let WhatsappService = WhatsappService_1 = class WhatsappService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(WhatsappService_1.name);
        this.whatsappApiUrl = this.configService.get('WHATSAPP_API_URL');
        this.whatsappApiKey = this.configService.get('WHATSAPP_API_KEY');
    }
    async sendBulkMessage(recipient, notification) {
        try {
            const messagePayload = {
                to: recipient.phone,
                message: notification.message,
            };
            const response = await axios_1.default.post(`${this.whatsappApiUrl}/send`, messagePayload, {
                headers: {
                    Authorization: `Bearer ${this.whatsappApiKey}`,
                    'Content-Type': 'application/json',
                },
            });
            this.logger.log(`WhatsApp message sent to ${recipient.id}: ${response.data.status}`);
        }
        catch (error) {
            this.logger.error(`Failed to send WhatsApp message to ${recipient.id}: ${error.message}`);
        }
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = WhatsappService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map