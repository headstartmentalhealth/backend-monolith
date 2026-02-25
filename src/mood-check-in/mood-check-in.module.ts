import { Module } from '@nestjs/common';
import { MoodCheckInService } from './mood-check-in.service';
import { MoodCheckInController } from './mood-check-in.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MoodCheckInController],
  providers: [MoodCheckInService],
  exports: [MoodCheckInService],
})
export class MoodCheckInModule {}
