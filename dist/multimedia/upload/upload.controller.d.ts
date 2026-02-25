import { UploadService } from './upload.service';
import { AuthPayload } from '@/generic/generic.payload';
import { AddFileBodyDto } from './upload.dto';
export declare class UploadController {
    private uploadService;
    constructor(uploadService: UploadService);
    uploadImage(request: AuthPayload & Request, file: Express.Multer.File): Promise<unknown>;
    uploadImages(request: AuthPayload & Request, files: Array<Express.Multer.File>): Promise<import("@/generic/generic.payload").GenericPayload>;
    uploadVideo(request: AuthPayload & Request, file: Express.Multer.File): Promise<unknown>;
    uploadID(request: AuthPayload & Request, file: Express.Multer.File, addFileBodyDto: AddFileBodyDto): Promise<import("@/generic/generic.payload").GenericPayloadAlias<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.MultimediaType;
        business_id: string | null;
        creator_id: string | null;
        provider: import(".prisma/client").$Enums.MultimediaProvider;
        url: string;
    }>>;
    uploadIDWithZip(request: AuthPayload & Request, file: Express.Multer.File, addFileBodyDto: AddFileBodyDto): Promise<import("@/generic/generic.payload").GenericPayloadAlias<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        type: import(".prisma/client").$Enums.MultimediaType;
        business_id: string | null;
        creator_id: string | null;
        provider: import(".prisma/client").$Enums.MultimediaProvider;
        url: string;
    }>>;
    uploadIDs(request: AuthPayload & Request, files: Array<Express.Multer.File>, addFileBodyDto: AddFileBodyDto): Promise<import("@/generic/generic.payload").GenericPayload>;
}
