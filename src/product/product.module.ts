import { Module } from '@nestjs/common';
import { TicketModule } from './ticket/ticket.module';
import { CourseModule } from './course/course.module';
import { CategoryModule } from './category/category.module';
import { GeneralModule } from './general/general.module';
import { DigitalProductModule } from './digital-product/digital-product.module';
import { PhysicalProductModule } from './physical-product/physical-product.module';

@Module({
  imports: [
    CategoryModule,
    CourseModule,
    TicketModule,
    GeneralModule,
    DigitalProductModule,
    PhysicalProductModule,
  ],
})
export class ProductModule {}
