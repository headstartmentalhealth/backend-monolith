import { Module } from '@nestjs/common';
import { NotificationTokenService } from './token.service';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationTokenController } from './token.controller';

@Module({
  controllers: [NotificationTokenController],
  providers: [NotificationTokenService, PrismaService],
  exports: [NotificationTokenService],
})
export class NotificationTokenModule {}
