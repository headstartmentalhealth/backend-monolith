import { Module } from '@nestjs/common';
import { CrudModule } from './crud/crud.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [CrudModule, UploadModule],
})
export class MultimediaModule {}
