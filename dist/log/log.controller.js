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
exports.LogController = void 0;
const common_1 = require("@nestjs/common");
const log_service_1 = require("./log.service");
const role_decorator_1 = require("../account/auth/decorators/role.decorator");
const generic_data_1 = require("../generic/generic.data");
const log_dto_1 = require("./log.dto");
let LogController = class LogController {
    constructor(logService) {
        this.logService = logService;
    }
    async fetch(request, filterLogDto) {
        return this.logService.fetch(request, filterLogDto);
    }
};
exports.LogController = LogController;
__decorate([
    (0, common_1.Get)('fetch'),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_ADMIN, generic_data_1.Role.OWNER_SUPER_ADMIN),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, forbidNonWhitelisted: true })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, log_dto_1.FilterLogDto]),
    __metadata("design:returntype", Promise)
], LogController.prototype, "fetch", null);
exports.LogController = LogController = __decorate([
    (0, common_1.Controller)('v1/log'),
    __metadata("design:paramtypes", [log_service_1.LogService])
], LogController);
//# sourceMappingURL=log.controller.js.map