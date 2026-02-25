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
exports.WithdrawController = void 0;
const common_1 = require("@nestjs/common");
const withdraw_service_1 = require("./withdraw.service");
const withdraw_dto_1 = require("./withdraw.dto");
const role_decorator_1 = require("../account/auth/decorators/role.decorator");
const generic_data_1 = require("../generic/generic.data");
const business_guard_1 = require("../generic/guards/business.guard");
let WithdrawController = class WithdrawController {
    constructor(service) {
        this.service = service;
    }
    create(dto, req) {
        return this.service.create(req, dto);
    }
    findMyRequests(req, filterWithdrawRequestDto) {
        return this.service.findMyRequests(req, filterWithdrawRequestDto);
    }
    findAll(req, filterWithdrawRequestDto) {
        return this.service.findAllRequests(req, filterWithdrawRequestDto);
    }
    findOne(req, id) {
        return this.service.findOne(id);
    }
    findDetails(req, id) {
        return this.service.findDetails(id, req);
    }
    initiateTransfer(req, dto) {
        return this.service.initiateWithdrawal(req.user.sub, dto);
    }
    finalizeTransfer(req, dto) {
        return this.service.finalizeTransferRequest(req.user.sub, dto);
    }
    verifyTransfer(req, dto) {
        return this.service.verifyAndMark(req, dto);
    }
    update(id, dto) {
        return this.service.updateStatus(id, dto);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
exports.WithdrawController = WithdrawController;
__decorate([
    (0, common_1.Post)('request'),
    (0, common_1.UseGuards)(business_guard_1.BusinessGuard),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [withdraw_dto_1.CreateWithdrawalDto, Object]),
    __metadata("design:returntype", void 0)
], WithdrawController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('fetch'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, withdraw_dto_1.QueryWithdrawRequestsDto]),
    __metadata("design:returntype", void 0)
], WithdrawController.prototype, "findMyRequests", null);
__decorate([
    (0, common_1.Get)('fetch-all'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, withdraw_dto_1.QueryWithdrawRequestsDto]),
    __metadata("design:returntype", void 0)
], WithdrawController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WithdrawController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('details/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WithdrawController.prototype, "findDetails", null);
__decorate([
    (0, common_1.Post)('initiate'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, withdraw_dto_1.InitiateWithdrawalDto]),
    __metadata("design:returntype", void 0)
], WithdrawController.prototype, "initiateTransfer", null);
__decorate([
    (0, common_1.Post)('finalize-transfer'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, withdraw_dto_1.FinalizeWithdrawalDto]),
    __metadata("design:returntype", void 0)
], WithdrawController.prototype, "finalizeTransfer", null);
__decorate([
    (0, common_1.Post)('verify-transfer'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, withdraw_dto_1.VerifyWithdrawalDto]),
    __metadata("design:returntype", void 0)
], WithdrawController.prototype, "verifyTransfer", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, withdraw_dto_1.UpdateWithdrawalDto]),
    __metadata("design:returntype", void 0)
], WithdrawController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WithdrawController.prototype, "remove", null);
exports.WithdrawController = WithdrawController = __decorate([
    (0, common_1.Controller)('v1/withdraw'),
    __metadata("design:paramtypes", [withdraw_service_1.WithdrawService])
], WithdrawController);
//# sourceMappingURL=withdraw.controller.js.map