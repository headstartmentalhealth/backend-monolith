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
exports.ContactController = void 0;
const common_1 = require("@nestjs/common");
const contact_service_1 = require("./contact.service");
const generic_payload_1 = require("../../generic/generic.payload");
const contact_dto_1 = require("./contact.dto");
const role_decorator_1 = require("../auth/decorators/role.decorator");
const generic_data_1 = require("../../generic/generic.data");
const auth_decorator_1 = require("../auth/decorators/auth.decorator");
const generic_dto_1 = require("../../generic/generic.dto");
const contact_payload_1 = require("./contact.payload");
let ContactController = class ContactController {
    constructor(contactService) {
        this.contactService = contactService;
    }
    async inviteMember(req, inviteContactDto) {
        return this.contactService.inviteMember(req, inviteContactDto);
    }
    async acceptInvite(request, acceptInviteDto) {
        return this.contactService.acceptInvite(request, acceptInviteDto);
    }
    async getInvites(request, param, filterInvitesDto) {
        return this.contactService.getInvites(request, param, filterInvitesDto);
    }
    async getInviteByToken(param) {
        return this.contactService.getInviteByToken(param);
    }
    async reinviteMember(request, param) {
        return this.contactService.reinviteMember(request, param);
    }
    async removeMember(request, param) {
        return this.contactService.removeMember(request, param);
    }
    async deactivateMember(request, param) {
        return this.contactService.deactivateMember(request, param);
    }
    async restoreMember(request, param) {
        return this.contactService.restoreMember(request, param);
    }
    async getContacts(request, param, filterContactDto) {
        return this.contactService.getBusinessContacts(request, param, filterContactDto);
    }
    async getBusinessCustomers(request, filterUserDto) {
        return this.contactService.getBusinessCustomers(request, filterUserDto);
    }
    async getBusinessContacts(request, filterUserDto) {
        return this.contactService.fetchContacts(request, filterUserDto);
    }
    async fetchOrgContacts(request, filterUserDto) {
        return this.contactService.fetchOrgContacts(request, filterUserDto);
    }
    async getBusinessCustomer(request, param) {
        return this.contactService.getBusinessCustomer(request, param);
    }
    sendMessage(req, sendMessageDto) {
        return this.contactService.sendMessage(req, sendMessageDto);
    }
    subscribeNewsletter(request, newsletterSubscriptionDto) {
        return this.contactService.subscribe(request, newsletterSubscriptionDto);
    }
};
exports.ContactController = ContactController;
__decorate([
    (0, common_1.Post)('invite'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.OWNER_SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, contact_dto_1.InviteContactDto]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "inviteMember", null);
__decorate([
    (0, common_1.Post)('accept-invite'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Request,
        contact_dto_1.AcceptInviteDto]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "acceptInvite", null);
__decorate([
    (0, common_1.Get)('invites/:business_id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.OWNER_SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload, Object, Object]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "getInvites", null);
__decorate([
    (0, common_1.Get)('invite/:token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [contact_payload_1.TokenDto]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "getInviteByToken", null);
__decorate([
    (0, common_1.Post)('reinvite-member/:invite_id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.OWNER_SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, contact_payload_1.ContactDto]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "reinviteMember", null);
__decorate([
    (0, common_1.Post)('remove-member/:invite_id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.OWNER_SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, contact_payload_1.ContactDto]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Post)('deactivate-member/:invite_id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.OWNER_SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, contact_payload_1.ContactDto]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "deactivateMember", null);
__decorate([
    (0, common_1.Post)('restore-member/:invite_id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.OWNER_SUPER_ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, contact_payload_1.ContactDto]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "restoreMember", null);
__decorate([
    (0, common_1.Get)('fetch/:business_id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload, Object, Object]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "getContacts", null);
__decorate([
    (0, common_1.Get)('fetch-customers'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN, generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload,
        contact_dto_1.FilterUserDto]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "getBusinessCustomers", null);
__decorate([
    (0, common_1.Get)('fetch-contacts'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN, generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload,
        contact_dto_1.FilterContactsDto]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "getBusinessContacts", null);
__decorate([
    (0, common_1.Get)('fetch-org-contacts'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.USER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload,
        contact_dto_1.FilterContactsDto]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "fetchOrgContacts", null);
__decorate([
    (0, common_1.Get)('fetch-customer/:id'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN, generic_data_1.Role.BUSINESS_SUPER_ADMIN, generic_data_1.Role.BUSINESS_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload,
        generic_dto_1.IdDto]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "getBusinessCustomer", null);
__decorate([
    (0, common_1.Post)('send-contact-message'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Request,
        contact_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('subscribe-newsletter'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Request,
        contact_dto_1.NewsletterSubscriptionDto]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "subscribeNewsletter", null);
exports.ContactController = ContactController = __decorate([
    (0, common_1.Controller)('v1/contact'),
    __metadata("design:paramtypes", [contact_service_1.ContactService])
], ContactController);
//# sourceMappingURL=contact.controller.js.map