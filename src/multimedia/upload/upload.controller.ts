import {
  Body,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Req,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  IdentityDocFileSizeValidationPipe,
  IdentityDocFilesSizeValidationPipe,
  IdentityDocFileWithZipSizeValidationPipe,
  ImageFileSizeValidationPipe,
  ImageFilesSizeValidationPipe,
  VideoFileSizeValidationPipe,
} from './file-validation.pipe';
import { UploadService } from './upload.service';
import { AuthPayload } from '@/generic/generic.payload';
import { AddFileBodyDto } from './upload.dto';

@Controller('v1/multimedia-upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(
    @Req() request: AuthPayload & Request,
    @UploadedFile(new ImageFileSizeValidationPipe())
    file: Express.Multer.File,
  ) {
    return this.uploadService.uploadImage(request, file);
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('images'))
  uploadImages(
    @Req() request: AuthPayload & Request,
    @UploadedFiles(new ImageFilesSizeValidationPipe())
    files: Array<Express.Multer.File>,
  ) {
    return this.uploadService.uploadImages(request, files);
  }

  @Post('video')
  @UseInterceptors(FileInterceptor('video'))
  uploadVideo(
    @Req() request: AuthPayload & Request,
    @UploadedFile(new VideoFileSizeValidationPipe())
    file: Express.Multer.File,
  ) {
    return this.uploadService.uploadVideo(request, file);
  }

  @Post('document')
  @UseInterceptors(FileInterceptor('document'))
  uploadID(
    @Req() request: AuthPayload & Request,
    @UploadedFile(new IdentityDocFileSizeValidationPipe())
    file: Express.Multer.File,
    @Body() addFileBodyDto: AddFileBodyDto,
  ) {
    return this.uploadService.uploadID(request, file, addFileBodyDto);
  }

  @Post('raw-document')
  @UseInterceptors(FileInterceptor('document'))
  uploadIDWithZip(
    @Req() request: AuthPayload & Request,
    @UploadedFile(new IdentityDocFileWithZipSizeValidationPipe())
    file: Express.Multer.File,
    @Body() addFileBodyDto: AddFileBodyDto,
  ) {
    return this.uploadService.uploadID(request, file, addFileBodyDto);
  }

  @Post('documents')
  @UseInterceptors(FilesInterceptor('documents'))
  uploadIDs(
    @Req() request: AuthPayload & Request,
    @UploadedFiles(new IdentityDocFilesSizeValidationPipe())
    files: Array<Express.Multer.File>,
    @Body() addFileBodyDto: AddFileBodyDto,
  ) {
    return this.uploadService.uploadIDs(request, files, addFileBodyDto);
  }
}
