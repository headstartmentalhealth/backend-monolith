import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { CloudinaryProvider } from './providers/cloudinary';
import { S3Provider } from './providers/s3';

import { GenericModule } from 'src/generic/generic.module';
import { MultimediaCrudService } from '../crud/crud.service';

@Module({
  imports: [GenericModule],
  providers: [
    UploadService,
    CloudinaryProvider,
    S3Provider,
    MultimediaCrudService,
  ],
  controllers: [UploadController],
  exports: [UploadService, CloudinaryProvider, S3Provider],
})
export class UploadModule {}
