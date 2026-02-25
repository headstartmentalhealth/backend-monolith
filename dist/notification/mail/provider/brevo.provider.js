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
exports.BrevoProvider = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const Handlebars = require("handlebars");
const fs_1 = require("fs");
const path_1 = require("path");
const config_1 = require("@nestjs/config");
let BrevoProvider = class BrevoProvider {
    constructor(configService) {
        this.configService = configService;
        this.brevoApiUrl = 'https://api.brevo.com/v3/smtp/email';
        this.brevoApiKey = this.configService.get('BREVO_API_KEY');
        this.fromEmail = this.configService.get('MAIL_FROM');
    }
    async sendEmail(to, subject, templateName, templateData = {}) {
        const htmlContent = this.renderTemplate(templateName, templateData);
        const payload = {
            sender: {
                name: 'Do Excess',
                email: this.fromEmail,
            },
            to: [
                {
                    email: to,
                },
            ],
            subject,
            htmlContent,
        };
        try {
            const response = await axios_1.default.post(this.brevoApiUrl, payload, {
                headers: {
                    'api-key': this.brevoApiKey,
                    'Content-Type': 'application/json',
                },
            });
            console.log('Email sent:', response.data);
            return response.data;
        }
        catch (error) {
            console.error('Error sending email:', error.response?.data || error.message);
            throw error;
        }
    }
    renderTemplate(templateName, data) {
        const templatePath = (0, path_1.join)(__dirname, '../../notification/mail/templates', `${templateName}.hbs`);
        const templateFile = (0, fs_1.readFileSync)(templatePath, 'utf8');
        const template = Handlebars.compile(templateFile);
        return template(data);
    }
};
exports.BrevoProvider = BrevoProvider;
exports.BrevoProvider = BrevoProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], BrevoProvider);
//# sourceMappingURL=brevo.provider.js.map