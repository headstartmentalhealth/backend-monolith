import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { PrismaService } from '../prisma/prisma.service';
import { LogService } from '@/log/log.service';
import { MailService } from '@/notification/mail/mail.service';

@Module({
  controllers: [CartController],
  providers: [CartService, PrismaService, LogService, MailService],
  exports: [CartService],
})
export class CartModule {}
