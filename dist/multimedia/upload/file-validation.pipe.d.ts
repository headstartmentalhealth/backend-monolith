import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
export declare const MAX_FILES = 10;
export declare const ID_DOC_MAX_FILES = 2;
export declare class ImageFileSizeValidationPipe implements PipeTransform {
    transform(value: Express.Multer.File, metadata: ArgumentMetadata): Express.Multer.File;
}
export declare class ImageFilesSizeValidationPipe implements PipeTransform {
    transform(value: Array<Express.Multer.File>, metadata: ArgumentMetadata): Express.Multer.File[];
}
export declare class VideoFileSizeValidationPipe implements PipeTransform {
    transform(value: Express.Multer.File, metadata: ArgumentMetadata): Express.Multer.File;
}
export declare class IdentityDocFileSizeValidationPipe implements PipeTransform {
    transform(value: Express.Multer.File, metadata: ArgumentMetadata): Express.Multer.File;
}
export declare class IdentityDocFilesSizeValidationPipe implements PipeTransform {
    transform(value: Array<Express.Multer.File>, metadata: ArgumentMetadata): Express.Multer.File[];
}
export declare class IdentityDocFileWithZipSizeValidationPipe implements PipeTransform {
    transform(value: Express.Multer.File, metadata: ArgumentMetadata): Express.Multer.File;
}
