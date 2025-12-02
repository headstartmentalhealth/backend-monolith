import { Global, Module } from '@nestjs/common';
import { LogService } from './log.service';
import { PrismaService } from '../prisma/prisma.service';
import { LogController } from './log.controller';

@Global()
@Module({
  controllers: [LogController],
  providers: [LogService, PrismaService],
  exports: [LogService],
})
export class LogModule {}
