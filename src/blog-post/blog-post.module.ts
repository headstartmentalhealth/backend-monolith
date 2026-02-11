import { Module } from '@nestjs/common';
import { BlogPostService } from './blog-post.service';
import { BlogPostController } from './blog-post.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LogModule } from '@/log/log.module';
import { GenericModule } from '@/generic/generic.module';

@Module({
  imports: [PrismaModule, LogModule, GenericModule],
  controllers: [BlogPostController],
  providers: [BlogPostService],
  exports: [BlogPostService],
})
export class BlogPostModule {}
