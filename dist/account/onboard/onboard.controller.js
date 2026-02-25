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
exports.OnboardController = void 0;
const common_1 = require("@nestjs/common");
const onboard_dto_1 = require("./onboard.dto");
const onboard_service_1 = require("./onboard.service");
const role_decorator_1 = require("../auth/decorators/role.decorator");
const generic_data_1 = require("../../generic/generic.data");
const auth_decorator_1 = require("../auth/decorators/auth.decorator");
const generic_dto_1 = require("../../generic/generic.dto");
const business_guard_1 = require("../../generic/guards/business.guard");
let OnboardController = class OnboardController {
    constructor(onboardService) {
        this.onboardService = onboardService;
    }
    async saveBusinessInfo(req, saveBusinessInfoDto) {
        return this.onboardService.saveBusinessInformation(req, saveBusinessInfoDto);
    }
    async fetchBusinesses(req) {
        return this.onboardService.fetchBusinesses(req);
    }
    async findBusinessInformation(req, businessNameDto) {
        return this.onboardService.findBusinessInformation(req, businessNameDto);
    }
    async fetchBusinessInformation(req, param) {
        return this.onboardService.fetchBusinessInformation(req, param);
    }
    async saveWithdrawalAccount(req, upsertWithdrawalAccountDto) {
        return this.onboardService.saveWithdrawalAccount(req, upsertWithdrawalAccountDto);
    }
    async viewBusinessInformationPublic(req, param) {
        return this.onboardService.viewBusinessInformationPublic(req, param);
    }
    async fetchAllBusinesses(req, filterBusinessDto) {
        return this.onboardService.fetchAllBusinesses(req, filterBusinessDto);
    }
    async fetchBusinessDetails(req, param) {
        return this.onboardService.fetchBusinessDetails(req, param);
    }
    async suspendBusinessOwner(req, param, suspendBusinessOwnerDto) {
        return this.onboardService.suspendBusinessOwner(req, param, suspendBusinessOwnerDto);
    }
    async unsuspendBusinessOwner(req, param) {
        return this.onboardService.unsuspendBusinessOwner(req, param);
    }
    async fetchAllBusinesOwners(req, filterBusinessOwnerDto) {
        return this.onboardService.fetchBusinessOwners(req, filterBusinessOwnerDto);
    }
    async deleteBusiness(req, param) {
        return this.onboardService.deleteBusiness(req, param);
    }
    async importBusinessUsers(req, importDto) {
        return this.onboardService.importBusinessUsers(req, importDto);
    }
    async exportBusinessUsers(req, query) {
        return this.onboardService.exportBusinessUsers(req, query);
    }
    async addCustomer(req, addCustomerDto) {
        return this.onboardService.addCustomer(req, addCustomerDto);
    }
    async upsertKyc(req, dto) {
        return this.onboardService.upsertKyc(req, dto);
    }
    async fetchKyc(req) {
        return this.onboardService.fetchKyc(req);
    }
    async fetchSubmittedKyc(req, paramDto) {
        return this.onboardService.fetchSubmittedKyc(req, paramDto);
    }
    async reviewKyc(req, kyc_id, dto) {
        return this.onboardService.reviewKyc(req, kyc_id, dto);
    }
    async updateOnboardingProcess(req, dto) {
        return this.onboardService.updateOnboardingProcess(req, dto);
    }
};
exports.OnboardController = OnboardController;
__decorate([
    (0, common_1.Post)('save-business-info'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, onboard_dto_1.SaveBusinessInfoDto]),
    __metadata("design:returntype", Promise)
], OnboardController.prototype, "saveBusinessInfo", null);
__decorate([
    (0, common_1.Get)('fetch-businesses'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN, generic_data_1.Role.USER),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OnboardController.prototype, "fetchBusinesses", null);
__decorate([
    (0, common_1.Post)('find-business'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, onboard_dto_1.BusinessNameDto]),
    __metadata("design:returntype", Promise)
], OnboardController.prototype, "findBusinessInformation", null);
__decorate([
    (0, common_1.Get)('fetch-business-info/:id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN, generic_data_1.Role.USER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OnboardController.prototype, "fetchBusinessInformation", null);
__decorate([
    (0, common_1.Post)('save-withdrawal-account'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, onboard_dto_1.UpsertWithdrawalAccountDto]),
    __metadata("design:returntype", Promise)
], OnboardController.prototype, "saveWithdrawalAccount", null);
__decorate([
    (0, common_1.Get)('view-business-info/:id'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OnboardController.prototype, "viewBusinessInformationPublic", null);
__decorate([
    (0, common_1.Get)('fetch-all-businesses'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, onboard_dto_1.FilterBusinessDto]),
    __metadata("design:returntype", Promise)
], OnboardController.prototype, "fetchAllBusinesses", null);
__decorate([
    (0, common_1.Get)('fetch-business-details/:id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto]),
    __metadata("design:returntype", Promise)
], OnboardController.prototype, "fetchBusinessDetails", null);
__decorate([
    (0, common_1.Post)('suspend-business-owner/:user_id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.UserDto,
        onboard_dto_1.SuspendBusinessOwnerDto]),
    __metadata("design:returntype", Promise)
], OnboardController.prototype, "suspendBusinessOwner", null);
__decorate([
    (0, common_1.Put)('unsuspend-business-owner/:user_id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.UserDto]),
    __metadata("design:returntype", Promise)
], OnboardController.prototype, "unsuspendBusinessOwner", null);
__decorate([
    (0, common_1.Get)('fetch-business-owners'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, onboard_dto_1.FilterBusinessOwnerDto]),
    __metadata("design:returntype", Promise)
], OnboardController.prototype, "fetchAllBusinesOwners", null);
__decorate([
    (0, common_1.Delete)('delete-business/:id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OnboardController.prototype, "deleteBusiness", null);
__decorate([
    (0, common_1.Post)('import-users'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN),
    (0, common_1.UseGuards)(business_guard_1.BusinessGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, onboard_dto_1.ImportBusinessUsersDto]),
    __metadata("design:returntype", Promise)
], OnboardController.prototype, "importBusinessUsers", null);
__decorate([
    (0, common_1.Get)('export-users'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN),
    (0, common_1.UseGuards)(business_guard_1.BusinessGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, onboard_dto_1.ExportBusinessUsersDto]),
    __metadata("design:returntype", Promise)
], OnboardController.prototype, "exportBusinessUsers", null);
__decorate([
    (0, common_1.Post)('add-customer'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, onboard_dto_1.AddCustomerDto]),
    __metadata("design:returntype", Promise)
], OnboardController.prototype, "addCustomer", null);
__decorate([
    (0, common_1.Post)('kyc'),
    (0, common_1.UseGuards)(business_guard_1.BusinessGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, onboard_dto_1.UpsertKycDto]),
    __metadata("design:returntype", Promise)
], OnboardController.prototype, "upsertKyc", null);
__decorate([
    (0, common_1.Get)('kyc'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OnboardController.prototype, "fetchKyc", null);
__decorate([
    (0, common_1.Get)('kyc/:business_id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.BusinessDto]),
    __metadata("design:returntype", Promise)
], OnboardController.prototype, "fetchSubmittedKyc", null);
__decorate([
    (0, common_1.Patch)('review-kyc/:kyc_id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('kyc_id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, onboard_dto_1.ReviewKycDto]),
    __metadata("design:returntype", Promise)
], OnboardController.prototype, "reviewKyc", null);
__decorate([
    (0, common_1.UseGuards)(business_guard_1.BusinessGuard),
    (0, common_1.Patch)('update-onboarding-process'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, onboard_dto_1.UpdateBusinessProcessesDto]),
    __metadata("design:returntype", Promise)
], OnboardController.prototype, "updateOnboardingProcess", null);
exports.OnboardController = OnboardController = __decorate([
    (0, common_1.Controller)('v1/onboard'),
    __metadata("design:paramtypes", [onboard_service_1.OnboardService])
], OnboardController);
//# sourceMappingURL=onboard.controller.js.map