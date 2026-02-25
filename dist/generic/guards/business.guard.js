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
exports.BusinessGuard = void 0;
const common_1 = require("@nestjs/common");
const generic_service_1 = require("../generic.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let BusinessGuard = class BusinessGuard {
    constructor(genericService, prisma) {
        this.genericService = genericService;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = this.getUserFromRequest(request);
        const businessId = this.getBusinessIdFromRequest(request);
        await this.verifyUserBusinessLink(user.sub, businessId);
        return true;
    }
    getUserFromRequest(request) {
        const user = request.user;
        if (!user?.sub) {
            throw new common_1.ForbiddenException('Invalid or missing user information');
        }
        return user;
    }
    getBusinessIdFromRequest(request) {
        const businessId = request.headers['business-id'];
        if (!businessId) {
            throw new common_1.ForbiddenException('Business Id is required');
        }
        return businessId;
    }
    async verifyUserBusinessLink(userId, businessId) {
        await this.genericService.isUserLinkedToBusiness(this.prisma, { user_id: userId, business_id: businessId }, true);
    }
};
exports.BusinessGuard = BusinessGuard;
exports.BusinessGuard = BusinessGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [generic_service_1.GenericService,
        prisma_service_1.PrismaService])
], BusinessGuard);
//# sourceMappingURL=business.guard.js.map