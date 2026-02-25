"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityDocFileWithZipSizeValidationPipe = exports.IdentityDocFilesSizeValidationPipe = exports.IdentityDocFileSizeValidationPipe = exports.VideoFileSizeValidationPipe = exports.ImageFilesSizeValidationPipe = exports.ImageFileSizeValidationPipe = exports.ID_DOC_MAX_FILES = exports.MAX_FILES = void 0;
const common_1 = require("@nestjs/common");
exports.MAX_FILES = 10;
exports.ID_DOC_MAX_FILES = 2;
let ImageFileSizeValidationPipe = class ImageFileSizeValidationPipe {
    transform(value, metadata) {
        if (typeof value === 'undefined') {
            throw new common_1.BadRequestException('Image file is required');
        }
        const { mimetype, size } = value;
        const MIME_TYPES = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/heic',
            'image/heif',
        ];
        if (!MIME_TYPES.includes(mimetype)) {
            throw new common_1.BadRequestException('The image should be either jpeg, png, heic or webp.');
        }
        if (size > 5000000) {
            throw new common_1.BadRequestException(`File size should be at most 5MB`);
        }
        return value;
    }
};
exports.ImageFileSizeValidationPipe = ImageFileSizeValidationPipe;
exports.ImageFileSizeValidationPipe = ImageFileSizeValidationPipe = __decorate([
    (0, common_1.Injectable)()
], ImageFileSizeValidationPipe);
let ImageFilesSizeValidationPipe = class ImageFilesSizeValidationPipe {
    transform(value, metadata) {
        if (typeof value === 'undefined') {
            throw new common_1.BadRequestException('Image file(s) is required');
        }
        if (value.length > exports.MAX_FILES) {
            throw new common_1.BadRequestException(`Maximum of ${exports.MAX_FILES} files can only be uploaded at once.`);
        }
        for (let index = 0; index < value.length; index++) {
            const image = value[index];
            const { mimetype, size } = image;
            const MIME_TYPES = [
                'image/jpeg',
                'image/png',
                'image/webp',
                'image/heic',
                'image/heif',
            ];
            if (!MIME_TYPES.includes(mimetype)) {
                throw new common_1.BadRequestException('The image(s) should be either jpeg, png, or webp.');
            }
            if (size > 15000000) {
                throw new common_1.BadRequestException(`File size should be at most 15MB`);
            }
        }
        return value;
    }
};
exports.ImageFilesSizeValidationPipe = ImageFilesSizeValidationPipe;
exports.ImageFilesSizeValidationPipe = ImageFilesSizeValidationPipe = __decorate([
    (0, common_1.Injectable)()
], ImageFilesSizeValidationPipe);
let VideoFileSizeValidationPipe = class VideoFileSizeValidationPipe {
    transform(value, metadata) {
        if (typeof value === 'undefined') {
            throw new common_1.BadRequestException('Video file is required');
        }
        const { mimetype, size } = value;
        const MIME_TYPES = ['video/webm', 'video/mp4', 'video/mpeg'];
        if (!MIME_TYPES.includes(mimetype)) {
            throw new common_1.BadRequestException('The video should be either webm, mp4, or mpeg.');
        }
        if (size > 100000000) {
            throw new common_1.BadRequestException(`File size should be at most 100MB`);
        }
        return value;
    }
};
exports.VideoFileSizeValidationPipe = VideoFileSizeValidationPipe;
exports.VideoFileSizeValidationPipe = VideoFileSizeValidationPipe = __decorate([
    (0, common_1.Injectable)()
], VideoFileSizeValidationPipe);
let IdentityDocFileSizeValidationPipe = class IdentityDocFileSizeValidationPipe {
    transform(value, metadata) {
        if (typeof value === 'undefined') {
            throw new common_1.BadRequestException('Identity Document file(s) is required');
        }
        const { mimetype, size } = value;
        const MIME_TYPES = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/heic',
            'image/heif',
            'application/pdf',
        ];
        if (!MIME_TYPES.includes(mimetype)) {
            throw new common_1.BadRequestException('The image should be either jpeg, png, webp or pdf.');
        }
        if (size > 15000000) {
            throw new common_1.BadRequestException(`File size should be at most 15MB`);
        }
        return value;
    }
};
exports.IdentityDocFileSizeValidationPipe = IdentityDocFileSizeValidationPipe;
exports.IdentityDocFileSizeValidationPipe = IdentityDocFileSizeValidationPipe = __decorate([
    (0, common_1.Injectable)()
], IdentityDocFileSizeValidationPipe);
let IdentityDocFilesSizeValidationPipe = class IdentityDocFilesSizeValidationPipe {
    transform(value, metadata) {
        if (typeof value === 'undefined') {
            throw new common_1.BadRequestException('Identity Document file(s) is required');
        }
        for (let index = 0; index < value.length; index++) {
            const image = value[index];
            const { mimetype, size } = image;
            const MIME_TYPES = [
                'image/jpeg',
                'image/png',
                'image/webp',
                'image/heic',
                'image/heif',
                'application/pdf',
            ];
            if (!MIME_TYPES.includes(mimetype)) {
                throw new common_1.BadRequestException('The image(s) should be either jpeg, png, webp or pdf.');
            }
            if (size > 15000000) {
                throw new common_1.BadRequestException(`File size should be at most 15MB`);
            }
        }
        return value;
    }
};
exports.IdentityDocFilesSizeValidationPipe = IdentityDocFilesSizeValidationPipe;
exports.IdentityDocFilesSizeValidationPipe = IdentityDocFilesSizeValidationPipe = __decorate([
    (0, common_1.Injectable)()
], IdentityDocFilesSizeValidationPipe);
let IdentityDocFileWithZipSizeValidationPipe = class IdentityDocFileWithZipSizeValidationPipe {
    transform(value, metadata) {
        if (typeof value === 'undefined') {
            throw new common_1.BadRequestException('Identity Document file(s) is required');
        }
        const { mimetype, size } = value;
        const MIME_TYPES = ['application/zip'];
        if (!MIME_TYPES.includes(mimetype)) {
            throw new common_1.BadRequestException('The image should be either jpeg, png, webp pdf or zip.');
        }
        if (size > 100000000) {
            throw new common_1.BadRequestException(`File size should be at most 100MB`);
        }
        return value;
    }
};
exports.IdentityDocFileWithZipSizeValidationPipe = IdentityDocFileWithZipSizeValidationPipe;
exports.IdentityDocFileWithZipSizeValidationPipe = IdentityDocFileWithZipSizeValidationPipe = __decorate([
    (0, common_1.Injectable)()
], IdentityDocFileWithZipSizeValidationPipe);
//# sourceMappingURL=file-validation.pipe.js.map