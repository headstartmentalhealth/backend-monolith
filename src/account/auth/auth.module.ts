import { Global, Logger, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LogService } from '../../log/log.service';
import { MailService } from '../../notification/mail/mail.service';
import { AuthController } from './auth.controller';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RbacModule } from '@/rbac/rbac.module';
import { RolesGuard } from './guards/role.guard';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';
import { GoogleSSOService } from './providers/sso/google.provider';
import { CartService } from '@/cart/cart.service';
import { TurnstileService } from './providers/cloudflare/turnstile.provider';

@Global()
@Module({
  imports: [RbacModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    LogService,
    MailService,
    CartService,
    JwtService,
    ConfigService,
    Logger,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    GoogleSSOService,
    TurnstileService,
  ],
  exports: [AuthService, TurnstileService, JwtService],
})
export class AuthModule {}
