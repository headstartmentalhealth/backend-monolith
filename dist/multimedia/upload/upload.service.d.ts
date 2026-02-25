import { MultimediaCrudService } from '../crud/crud.service';
import { AuthPayload, GenericPayloadAlias } from '@/generic/generic.payload';
import { Multimedia } from '@prisma/client';
import { AddFileBodyDto } from './upload.dto';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
export declare class UploadService {
    private readonly multimediaCrudService;
    private readonly s3;
    private readonly configService;
    constructor(multimediaCrudService: MultimediaCrudService, s3: S3, configService: ConfigService);
    private heicToJPEG;
    private imageConvert;
    uploadImage(request: AuthPayload & Request, file: Express.Multer.File): Promise<unknown>;
    uploadImages(request: AuthPayload & Request, files: Array<Express.Multer.File>): Promise<import("@/generic/generic.payload").GenericPayload>;
    uploadVideo(request: AuthPayload & Request, file: Express.Multer.File): Promise<unknown>;
    writeAndReadFile(newPath: any, buffer: any): Promise<NonSharedBuffer>;
    fileExists(filePath: any): Promise<boolean>;
    private uploadFileToS3;
    uploadFile(request: AuthPayload & Request, file: Express.Multer.File): Promise<GenericPayloadAlias<Multimedia>>;
    uploadID(request: AuthPayload & Request, file: Express.Multer.File, addFileBodyDto?: AddFileBodyDto): Promise<GenericPayloadAlias<Multimedia>>;
    uploadIDs(request: AuthPayload & Request, files: Array<Express.Multer.File>, addFileBodyDto?: AddFileBodyDto): Promise<import("@/generic/generic.payload").GenericPayload>;
}
