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
exports.KeplarsTransport = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let KeplarsTransport = class KeplarsTransport {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.name = 'Keplars';
        this.version = '1.0.0';
    }
    send(mail, callback) {
        this.sendMail(mail)
            .then((info) => callback(null, info))
            .catch((err) => callback(err, null));
    }
    verify(callback) {
        const promise = Promise.resolve(true);
        if (callback) {
            promise
                .then(() => callback(null, true))
                .catch((err) => callback(err, null));
        }
        return promise;
    }
    async sendMail(mail) {
        const url = 'https://api.keplars.com/api/v1/send-email/instant';
        try {
            const { to, from, subject, html, text } = mail.data;
            const rawTo = Array.isArray(to) ? to : [to];
            const toArray = rawTo
                .map((recipient) => {
                if (typeof recipient === 'string') {
                    return recipient;
                }
                if (typeof recipient === 'object' && recipient !== null && 'address' in recipient) {
                    return recipient.address;
                }
                return null;
            })
                .filter((email) => email && typeof email === 'string');
            if (toArray.length === 0) {
                console.warn(`No valid recipients found for email. Subject: "${subject}", From: "${JSON.stringify(from)}"`);
                return {
                    messageId: 'no-recipients',
                    envelope: { from: JSON.stringify(from), to: [] },
                    accepted: [],
                    rejected: [],
                    pending: [],
                    response: 'No valid recipients',
                };
            }
            const fromObj = typeof from === 'string'
                ? { email: from }
                : from
                    ? { name: from.name || from.address, email: from.address }
                    : from;
            let replyToObj = undefined;
            const { replyTo } = mail.data;
            if (replyTo) {
                replyToObj = typeof replyTo === 'string'
                    ? { name: 'TechCrush', email: replyTo }
                    : replyTo
                        ? { name: replyTo.name || 'TechCrush', email: replyTo.address }
                        : replyTo;
            }
            const payload = {
                to: toArray,
                from: fromObj,
                from_name: 'TechCrush',
                reply_to: replyToObj,
                subject,
                body: html,
                text
            };
            const response = await axios_1.default.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json; charset=utf-8',
                    'Accept': 'application/json',
                },
            });
            console.log(response.data);
            return {
                messageId: response.data.id || 'unknown',
                envelope: { from: JSON.stringify(from), to: toArray },
                accepted: toArray,
                rejected: [],
                pending: [],
                response: JSON.stringify(response.data),
            };
        }
        catch (error) {
            console.error('Keplars API Error:', error.response?.data || error.message);
            throw error;
        }
    }
};
exports.KeplarsTransport = KeplarsTransport;
exports.KeplarsTransport = KeplarsTransport = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [String])
], KeplarsTransport);
//# sourceMappingURL=keplars.transport.js.map