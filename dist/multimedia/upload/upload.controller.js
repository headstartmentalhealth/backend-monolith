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
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const file_validation_pipe_1 = require("./file-validation.pipe");
const upload_service_1 = require("./upload.service");
const upload_dto_1 = require("./upload.dto");
let UploadController = class UploadController {
    constructor(uploadService) {
        this.uploadService = uploadService;
    }
    uploadImage(request, file) {
        return this.uploadService.uploadImage(request, file);
    }
    uploadImages(request, files) {
        return this.uploadService.uploadImages(request, files);
    }
    uploadVideo(request, file) {
        return this.uploadService.uploadVideo(request, file);
    }
    uploadID(request, file, addFileBodyDto) {
        return this.uploadService.uploadID(request, file, addFileBodyDto);
    }
    uploadIDWithZip(request, file, addFileBodyDto) {
        return this.uploadService.uploadID(request, file, addFileBodyDto);
    }
    uploadIDs(request, files, addFileBodyDto) {
        return this.uploadService.uploadIDs(request, files, addFileBodyDto);
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)('image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)(new file_validation_pipe_1.ImageFileSizeValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UploadController.prototype, "uploadImage", null);
__decorate([
    (0, common_1.Post)('images'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFiles)(new file_validation_pipe_1.ImageFilesSizeValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array]),
    __metadata("design:returntype", void 0)
], UploadController.prototype, "uploadImages", null);
__decorate([
    (0, common_1.Post)('video'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('video')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)(new file_validation_pipe_1.VideoFileSizeValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UploadController.prototype, "uploadVideo", null);
__decorate([
    (0, common_1.Post)('document'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('document')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)(new file_validation_pipe_1.IdentityDocFileSizeValidationPipe())),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, upload_dto_1.AddFileBodyDto]),
    __metadata("design:returntype", void 0)
], UploadController.prototype, "uploadID", null);
__decorate([
    (0, common_1.Post)('raw-document'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('document')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)(new file_validation_pipe_1.IdentityDocFileWithZipSizeValidationPipe())),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, upload_dto_1.AddFileBodyDto]),
    __metadata("design:returntype", void 0)
], UploadController.prototype, "uploadIDWithZip", null);
__decorate([
    (0, common_1.Post)('documents'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('documents')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFiles)(new file_validation_pipe_1.IdentityDocFilesSizeValidationPipe())),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array,
        upload_dto_1.AddFileBodyDto]),
    __metadata("design:returntype", void 0)
], UploadController.prototype, "uploadIDs", null);
exports.UploadController = UploadController = __decorate([
    (0, common_1.Controller)('v1/multimedia-upload'),
    __metadata("design:paramtypes", [upload_service_1.UploadService])
], UploadController);
//# sourceMappingURL=upload.controller.js.map