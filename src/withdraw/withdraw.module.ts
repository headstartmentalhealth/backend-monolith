import { Module } from '@nestjs/common';
import { WithdrawService } from './withdraw.service';
import { PrismaService } from '@/prisma/prisma.service';
import { WithdrawController } from './withdraw.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { MailModule } from '@/notification/mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [WithdrawController],
  providers: [WithdrawService],
  exports: [WithdrawService],
})
export class WithdrawModule {}
