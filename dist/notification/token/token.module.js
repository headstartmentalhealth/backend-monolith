"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationTokenModule = void 0;
const common_1 = require("@nestjs/common");
const token_service_1 = require("./token.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const token_controller_1 = require("./token.controller");
let NotificationTokenModule = class NotificationTokenModule {
};
exports.NotificationTokenModule = NotificationTokenModule;
exports.NotificationTokenModule = NotificationTokenModule = __decorate([
    (0, common_1.Module)({
        controllers: [token_controller_1.NotificationTokenController],
        providers: [token_service_1.NotificationTokenService, prisma_service_1.PrismaService],
        exports: [token_service_1.NotificationTokenService],
    })
], NotificationTokenModule);
//# sourceMappingURL=token.module.js.map