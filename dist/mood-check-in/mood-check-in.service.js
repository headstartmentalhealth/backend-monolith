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
exports.MoodCheckInService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MoodCheckInService = class MoodCheckInService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, mood) {
        return this.prisma.moodCheckIn.create({
            data: {
                user_id: userId,
                mood: mood,
            },
        });
    }
    async getLatest(userId) {
        return this.prisma.moodCheckIn.findFirst({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
        });
    }
    async getHistory(userId) {
        return this.prisma.moodCheckIn.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: 20,
        });
    }
};
exports.MoodCheckInService = MoodCheckInService;
exports.MoodCheckInService = MoodCheckInService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MoodCheckInService);
//# sourceMappingURL=mood-check-in.service.js.map