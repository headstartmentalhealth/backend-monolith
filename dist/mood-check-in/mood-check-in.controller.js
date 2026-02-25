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
exports.MoodCheckInController = void 0;
const common_1 = require("@nestjs/common");
const mood_check_in_service_1 = require("./mood-check-in.service");
const mood_check_in_dto_1 = require("./mood-check-in.dto");
const generic_payload_1 = require("../generic/generic.payload");
const auth_decorator_1 = require("../account/auth/decorators/auth.decorator");
let MoodCheckInController = class MoodCheckInController {
    constructor(moodCheckInService) {
        this.moodCheckInService = moodCheckInService;
    }
    async create(req, dto) {
        const userId = req.user?.sub || 'c4a0a16d-4679-47ad-8862-24b77466c131';
        return this.moodCheckInService.create(userId, dto.mood);
    }
    async getLatest(req) {
        const userId = req.user?.sub || 'c4a0a16d-4679-47ad-8862-24b77466c131';
        return this.moodCheckInService.getLatest(userId);
    }
    async getHistory(req) {
        const userId = req.user?.sub || 'c4a0a16d-4679-47ad-8862-24b77466c131';
        return this.moodCheckInService.getHistory(userId);
    }
};
exports.MoodCheckInController = MoodCheckInController;
__decorate([
    (0, auth_decorator_1.Public)(),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload, mood_check_in_dto_1.CreateMoodCheckInDto]),
    __metadata("design:returntype", Promise)
], MoodCheckInController.prototype, "create", null);
__decorate([
    (0, auth_decorator_1.Public)(),
    (0, common_1.Get)('latest'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload]),
    __metadata("design:returntype", Promise)
], MoodCheckInController.prototype, "getLatest", null);
__decorate([
    (0, auth_decorator_1.Public)(),
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload]),
    __metadata("design:returntype", Promise)
], MoodCheckInController.prototype, "getHistory", null);
exports.MoodCheckInController = MoodCheckInController = __decorate([
    (0, common_1.Controller)('moods'),
    __metadata("design:paramtypes", [mood_check_in_service_1.MoodCheckInService])
], MoodCheckInController);
//# sourceMappingURL=mood-check-in.controller.js.map