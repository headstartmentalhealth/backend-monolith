"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadModule = void 0;
const common_1 = require("@nestjs/common");
const upload_service_1 = require("./upload.service");
const upload_controller_1 = require("./upload.controller");
const cloudinary_1 = require("./providers/cloudinary");
const s3_1 = require("./providers/s3");
const generic_module_1 = require("../../generic/generic.module");
const crud_service_1 = require("../crud/crud.service");
let UploadModule = class UploadModule {
};
exports.UploadModule = UploadModule;
exports.UploadModule = UploadModule = __decorate([
    (0, common_1.Module)({
        imports: [generic_module_1.GenericModule],
        providers: [
            upload_service_1.UploadService,
            cloudinary_1.CloudinaryProvider,
            s3_1.S3Provider,
            crud_service_1.MultimediaCrudService,
        ],
        controllers: [upload_controller_1.UploadController],
        exports: [upload_service_1.UploadService, cloudinary_1.CloudinaryProvider, s3_1.S3Provider],
    })
], UploadModule);
//# sourceMappingURL=upload.module.js.map