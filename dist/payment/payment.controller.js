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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("./payment.service");
const payment_dto_1 = require("./payment.dto");
const auth_decorator_1 = require("../account/auth/decorators/auth.decorator");
const generic_data_1 = require("../generic/generic.data");
const role_decorator_1 = require("../account/auth/decorators/role.decorator");
const business_guard_1 = require("../generic/guards/business.guard");
const generic_dto_1 = require("../generic/generic.dto");
let PaymentController = class PaymentController {
    constructor(paymentService) {
        this.paymentService = paymentService;
    }
    async createPayment(request, createPaymentDto) {
        return this.paymentService.createPayment(request, createPaymentDto);
    }
    async verifyPayment(request, verifyPaymentDto) {
        return this.paymentService.verifyPayment(request, verifyPaymentDto);
    }
    async cancelPayment(request, paymentIdDto) {
        return this.paymentService.cancelPayment(request, paymentIdDto.payment_id);
    }
    async fetchPayments(request, filterPaymentDto) {
        return this.paymentService.fetchPayments(request, filterPaymentDto);
    }
    async fetch(request, filterPaymentDto) {
        return this.paymentService.fetchPaymentsForBusiness(request, filterPaymentDto);
    }
    async fetchPayment(request, idDto) {
        return this.paymentService.fetchPaymentByIDForBusiness(request, idDto);
    }
    async fetchDistinctCustomerPayments(request, filterPaymentDto) {
        return this.paymentService.fetchDistinctCustomerPayments(request, filterPaymentDto);
    }
    async fetchClientPayments(request, filterPaymentDto) {
        return this.paymentService.fetchClientPayments(request, filterPaymentDto);
    }
    async fetchClientPayment(request, idDto) {
        return this.paymentService.fetchClientPaymentByID(request, idDto);
    }
    async fetchClientPaymentSummary(request) {
        return this.paymentService.fetchClientPaymentSummary(request);
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)('create'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, payment_dto_1.CreatePaymentDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createPayment", null);
__decorate([
    (0, common_1.Post)('verify/:payment_id'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, payment_dto_1.VerifyPaymentDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Post)('cancel/:payment_id'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, payment_dto_1.PaymentIdDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "cancelPayment", null);
__decorate([
    (0, common_1.Get)('fetch-all'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, payment_dto_1.QueryPaymentsDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "fetchPayments", null);
__decorate([
    (0, common_1.Get)('fetch'),
    (0, common_1.UseGuards)(business_guard_1.BusinessGuard),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, payment_dto_1.QueryPaymentsDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "fetch", null);
__decorate([
    (0, common_1.Get)('fetch/:id'),
    (0, common_1.UseGuards)(business_guard_1.BusinessGuard),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "fetchPayment", null);
__decorate([
    (0, common_1.Get)('fetch-distinct'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, payment_dto_1.QueryPaymentsDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "fetchDistinctCustomerPayments", null);
__decorate([
    (0, common_1.Get)('client/fetch'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, payment_dto_1.QueryPaymentsDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "fetchClientPayments", null);
__decorate([
    (0, common_1.Get)('client/fetch/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "fetchClientPayment", null);
__decorate([
    (0, common_1.Get)('client/summary'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "fetchClientPaymentSummary", null);
exports.PaymentController = PaymentController = __decorate([
    (0, common_1.Controller)('v1/payment'),
    __metadata("design:paramtypes", [payment_service_1.PaymentService])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map