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
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const cloudinary_1 = require("cloudinary");
const sharp = require("sharp");
const heicConvert = require("heic-convert");
const promises_1 = require("fs/promises");
const crud_service_1 = require("../crud/crud.service");
const client_1 = require("@prisma/client");
const s3_1 = require("./providers/s3");
const aws_sdk_1 = require("aws-sdk");
const config_1 = require("@nestjs/config");
const streamifier = require('streamifier');
let UploadService = class UploadService {
    constructor(multimediaCrudService, s3, configService) {
        this.multimediaCrudService = multimediaCrudService;
        this.s3 = s3;
        this.configService = configService;
    }
    async heicToJPEG(buffer) {
        try {
            const jpegBuffer = await heicConvert({
                buffer,
                format: 'JPEG',
                quality: 1,
            });
            return jpegBuffer;
        }
        catch (error) {
            throw new common_1.BadRequestException('Failed to convert HEIC to JPEG');
        }
    }
    async imageConvert(file) {
        let jpegBuffer;
        if (file.mimetype === 'image/heic' || file.mimetype === 'image/heif') {
            jpegBuffer = await this.heicToJPEG(file.buffer);
        }
        else {
            jpegBuffer = await sharp(file.buffer).jpeg().toBuffer();
        }
        return jpegBuffer;
    }
    uploadImage(request, file) {
        return new Promise(async (resolve, reject) => {
            const upload = cloudinary_1.v2.uploader.upload_stream(async (error, result) => {
                if (error)
                    return reject(error);
                const { secure_url } = result;
                const response = await this.multimediaCrudService.create(request, {
                    url: secure_url,
                    type: client_1.MultimediaType.IMAGE,
                    provider: client_1.MultimediaProvider.CLOUDINARY,
                });
                resolve(response);
            });
            const buf = await this.imageConvert(file);
            streamifier.createReadStream(buf).pipe(upload);
        });
    }
    async uploadImages(request, files) {
        const imagesToUpload = await Promise.all(files.map((file) => {
            return new Promise(async (resolve, reject) => {
                const upload = cloudinary_1.v2.uploader.upload_stream((error, result) => {
                    if (error)
                        return reject(error);
                    const { secure_url } = result;
                    resolve({
                        url: secure_url,
                        type: client_1.MultimediaType.IMAGE,
                        provider: client_1.MultimediaProvider.CLOUDINARY,
                    });
                });
                const buf = await this.imageConvert(file);
                streamifier.createReadStream(buf).pipe(upload);
            });
        }));
        const response = await this.multimediaCrudService.createMany(request, imagesToUpload);
        return response;
    }
    uploadVideo(request, file) {
        return new Promise((resolve, reject) => {
            const upload = cloudinary_1.v2.uploader.upload_stream({
                resource_type: 'auto',
            }, async (error, result) => {
                if (error) {
                    console.log(error);
                    return reject(error);
                }
                const { secure_url } = result;
                const response = await this.multimediaCrudService.create(request, {
                    url: secure_url,
                    type: client_1.MultimediaType.VIDEO,
                    provider: client_1.MultimediaProvider.CLOUDINARY,
                });
                resolve(response);
            });
            streamifier.createReadStream(file.buffer).pipe(upload);
        });
    }
    async writeAndReadFile(newPath, buffer) {
        try {
            await (0, promises_1.writeFile)(newPath, buffer);
            let rawData = await (0, promises_1.readFile)(newPath);
            return rawData;
        }
        catch (error) {
            console.error('Error:', error);
        }
    }
    async fileExists(filePath) {
        try {
            await (0, promises_1.access)(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async uploadFileToS3(file, key) {
        const params = {
            Bucket: this.configService.get('AWS_S3_BUCKET_NAME'),
            Key: key,
            Body: file.buffer,
        };
        return this.s3.upload(params).promise();
    }
    async uploadFile(request, file) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({ resource_type: 'auto' }, async (error, result) => {
                if (error)
                    return reject(error);
                const response = await this.multimediaCrudService.create(request, {
                    url: result.secure_url,
                    type: client_1.MultimediaType.DOCUMENT,
                    provider: client_1.MultimediaProvider.CLOUDINARY,
                });
                resolve(response);
            });
            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }
    async uploadID(request, file, addFileBodyDto) {
        return this.uploadFile(request, file);
    }
    async uploadIDs(request, files, addFileBodyDto) {
        const { purpose } = addFileBodyDto;
        const docToUpload = await Promise.all(files.map((file) => {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.v2.uploader.upload_stream({ resource_type: 'auto' }, async (error, result) => {
                    if (error)
                        return reject(error);
                    resolve({
                        url: result.secure_url,
                        type: client_1.MultimediaType.DOCUMENT,
                        provider: client_1.MultimediaProvider.CLOUDINARY,
                    });
                });
                streamifier.createReadStream(file.buffer).pipe(uploadStream);
            });
        }));
        const response = await this.multimediaCrudService.createMany(request, docToUpload);
        return response;
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(s3_1.S3_PROVIDER)),
    __metadata("design:paramtypes", [crud_service_1.MultimediaCrudService,
        aws_sdk_1.S3,
        config_1.ConfigService])
], UploadService);
//# sourceMappingURL=upload.service.js.map