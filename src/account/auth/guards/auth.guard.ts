import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaBaseRepository } from '../../../prisma/prisma.base.repository';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/auth.decorator';
import { AuthPayload } from '../../../generic/generic.payload';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly userRepository: PrismaBaseRepository<
    User,
    Prisma.UserCreateInput,
    Prisma.UserUpdateInput,
    Prisma.UserWhereUniqueInput,
    Prisma.UserWhereInput,
    Prisma.UserUpsertArgs
  >;
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private reflector: Reflector,
  ) {
    this.userRepository = new PrismaBaseRepository<
      User,
      Prisma.UserCreateInput,
      Prisma.UserUpdateInput,
      Prisma.UserWhereUniqueInput,
      Prisma.UserWhereInput,
      Prisma.UserUpsertArgs
    >('user', prisma);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      // 💡 See this condition
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = (await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      })) as AuthPayload;

      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
      request['Business-Id'] = this.extractBusinessID(request);
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private extractBusinessID(request: Request): string {
    return request.headers['business-id'] as string;
  }
}
