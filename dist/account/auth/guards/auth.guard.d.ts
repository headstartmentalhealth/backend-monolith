import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
export declare class AuthGuard implements CanActivate {
    private readonly prisma;
    private jwtService;
    private configService;
    private reflector;
    private readonly userRepository;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractTokenFromHeader;
    private extractBusinessID;
}
