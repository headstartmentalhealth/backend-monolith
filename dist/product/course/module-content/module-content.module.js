"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CMCModule = void 0;
const common_1 = require("@nestjs/common");
const module_content_service_1 = require("./module-content.service");
const module_content_controller_1 = require("./module-content.controller");
const module_module_1 = require("../module/module.module");
let CMCModule = class CMCModule {
};
exports.CMCModule = CMCModule;
exports.CMCModule = CMCModule = __decorate([
    (0, common_1.Module)({
        imports: [module_module_1.CMModule],
        controllers: [module_content_controller_1.ModuleContentController],
        providers: [module_content_service_1.ModuleContentService],
    })
], CMCModule);
//# sourceMappingURL=module-content.module.js.map