import { Module } from '@nestjs/common';
import { ModuleContentService } from './module-content.service';
import { ModuleContentController } from './module-content.controller';
import { CourseModuleService } from '../module/module.service';
import { CMModule } from '../module/module.module';

@Module({
  imports: [CMModule],
  controllers: [ModuleContentController],
  providers: [ModuleContentService],
})
export class CMCModule {}
