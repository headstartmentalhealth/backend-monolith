import { Module } from '@nestjs/common';
import { ProductCategoryController } from './category.controller';
import { ProductCategoryService } from './category.service';

@Module({
  controllers: [ProductCategoryController],
  providers: [ProductCategoryService],
})
export class CategoryModule {}
