import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import {
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as cloudinary,
} from 'cloudinary';
import toStream = require('buffer-to-stream');
import * as sharp from 'sharp';
import * as heicConvert from 'heic-convert';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import { access, readFile, unlink, writeFile } from 'fs/promises';
import { MultimediaCrudService } from '../crud/crud.service';
import { AuthPayload } from '@/generic/generic.payload';
import { MultimediaProvider, MultimediaType } from '@prisma/client';
import { AddFileBodyDto } from './upload.dto';
import path = require('path');
import { S3_PROVIDER } from './providers/s3';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';

const streamifier = require('streamifier');

@Injectable()
export class UploadService {
  constructor(
    private readonly multimediaCrudService: MultimediaCrudService,
    @Inject(S3_PROVIDER) private readonly s3: S3,
    private readonly configService: ConfigService,
  ) {}
  // private limit = pLimit(5);

  /**
   * Convert heic to jpeg
   * @param file
   * @returns
   */
  private async heicToJPEG(buffer: Buffer): Promise<Buffer> {
    try {
      const jpegBuffer = await heicConvert({
        buffer, // the HEIC file buffer
        format: 'JPEG', // output format
        quality: 1, // the quality of the output image
      });

      return jpegBuffer;
    } catch (error) {
      throw new BadRequestException('Failed to convert HEIC to JPEG');
    }
  }

  private async imageConvert(file: Express.Multer.File) {
    let jpegBuffer: Buffer;

    // If the file is HEIC, convert it to JPEG first
    if (file.mimetype === 'image/heic' || file.mimetype === 'image/heif') {
      jpegBuffer = await this.heicToJPEG(file.buffer);
    } else {
      // Otherwise, use sharp to handle the conversion to JPEG
      jpegBuffer = await sharp(file.buffer).jpeg().toBuffer();
    }

    return jpegBuffer;
  }

  /**
   * Upload an image file
   * @param request
   * @param file
   * @returns
   */
  uploadImage(request: AuthPayload & Request, file: Express.Multer.File) {
    // Promise<UploadApiResponse | UploadApiErrorResponse>;

    return new Promise(async (resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        async (error, result) => {
          if (error) return reject(error);

          const { secure_url } = result;

          // Save to multimedia
          const response = await this.multimediaCrudService.create(request, {
            url: secure_url,
            type: MultimediaType.IMAGE,
            provider: MultimediaProvider.CLOUDINARY,
          });

          resolve(response);
        },
      );

      const buf = await this.imageConvert(file);

      streamifier.createReadStream(buf).pipe(upload);
    });
  }

  /**
   * Upload image files
   * @param request
   * @param file
   * @returns
   */
  async uploadImages(
    request: AuthPayload & Request,
    files: Array<Express.Multer.File>,
  ) {
    // Promise<UploadApiResponse | UploadApiErrorResponse>;

    const imagesToUpload = await Promise.all(
      files.map((file) => {
        return new Promise(async (resolve, reject) => {
          const upload = cloudinary.uploader.upload_stream((error, result) => {
            if (error) return reject(error);
            const { secure_url } = result;

            resolve({
              url: secure_url,
              type: MultimediaType.IMAGE,
              provider: MultimediaProvider.CLOUDINARY,
            });
          });

          const buf = await this.imageConvert(file);

          streamifier.createReadStream(buf).pipe(upload);
        });
      }),
    );

    // Save to multimedia
    const response = await this.multimediaCrudService.createMany(
      request,
      imagesToUpload as any[],
    );

    return response;
    // return await Promise.all(imagesToUpload);
  }

  /**
   * Upload an video file
   * @param request
   * @param file
   * @returns
   */
  uploadVideo(request: AuthPayload & Request, file: Express.Multer.File) {
    // Promise<UploadApiResponse | UploadApiErrorResponse>;

    // console.log(file.buffer.toString());
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
        },
        async (error, result) => {
          if (error) {
            console.log(error);
            return reject(error);
          }

          const { secure_url } = result;

          // Save to multimedia
          const response = await this.multimediaCrudService.create(request, {
            url: secure_url,
            type: MultimediaType.VIDEO,
            provider: MultimediaProvider.CLOUDINARY,
          });

          resolve(response);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(upload);
    });
  }

  async writeAndReadFile(newPath: any, buffer: any) {
    try {
      await writeFile(newPath, buffer);
      let rawData = await readFile(newPath);
      return rawData;
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async fileExists(filePath: any) {
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Upload a file to S3
   * @param file
   * @param key
   * @returns
   */
  private async uploadFileToS3(
    file: Express.Multer.File,
    key: string,
  ): Promise<S3.ManagedUpload.SendData> {
    const params = {
      Bucket: this.configService.get<string>('AWS_S3_BUCKET_NAME'),
      Key: key,
      Body: file.buffer,
    };
    return this.s3.upload(params).promise();
  }

  /**
   * Upload any file
   * @param request
   * @param file
   * @returns
   */
  async uploadFile(request: AuthPayload & Request, file: Express.Multer.File) {
    const uniqueFilename = `${new Date().getTime()}-${file.originalname}`;
    const s3Response = await this.uploadFileToS3(file, uniqueFilename);
    return this.multimediaCrudService.create(request, {
      url: s3Response.Location,
      type: MultimediaType.DOCUMENT,
      provider: MultimediaProvider.AWS_S3,
    });
  }

  /**
   * Upload Identity document and more
   * @param files
   * @returns
   */
  async uploadID(
    request: AuthPayload & Request,
    file: Express.Multer.File,
    addFileBodyDto?: AddFileBodyDto,
  ) {
    return this.uploadFile(request, file);
  }

  /**
   * Upload Identity document(s) and more
   * @param files
   * @returns
   */
  async uploadIDs(
    request: AuthPayload & Request,
    files: Array<Express.Multer.File>,
    addFileBodyDto?: AddFileBodyDto,
  ) {
    const { purpose } = addFileBodyDto;

    // const docToUpload = await Promise.all(
    //   files.map((file) => {
    //     return new Promise(async (resolve, reject) => {
    //       // convert to buffer
    //       // @ts-ignore
    //       const buffer = Buffer.from(file.buffer, 'utf-8');

    //       // Path to the file you want to create or overwrite
    //       const filePath =
    //         'doc-' + new Date().getTime() + '.' + file.mimetype.split('/')[1];

    //       let newPath = path.join('uploads' + '/' + filePath);

    //       try {
    //         let autoData = await this.writeAndReadFile(newPath, buffer);

    //         const upload = cloudinary.uploader.upload_stream(
    //           async (error, result) => {
    //             if (error) return reject(error);

    //             const { secure_url } = result;

    //             const fileExists = await this.fileExists(newPath);
    //             if (fileExists) {
    //               await unlink(newPath);
    //             }

    //             return resolve({
    //               url: secure_url,
    //               type: MultimediaType.DOCUMENT,
    //               provider: MultimediaProvider.CLOUDINARY,
    //             });
    //           },
    //         );

    //         streamifier.createReadStream(file.buffer).pipe(upload);
    //       } catch (error) {
    //         console.log(error);

    //         throw new Error(error);
    //       }
    //     });
    //   }),
    // );

    const docToUpload = await Promise.all(
      files.map((file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto' },
            async (error, result) => {
              if (error) return reject(error);

              resolve({
                url: result.secure_url,
                type: MultimediaType.DOCUMENT,
                provider: MultimediaProvider.CLOUDINARY,
              });
            },
          );

          streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
      }),
    );

    // Save to multimedia
    const response = await this.multimediaCrudService.createMany(
      request,
      docToUpload as any[],
    );

    return response;
  }
}
