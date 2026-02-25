import { AuthPayload } from '@/generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
export declare class ChatAuthService {
    protected readonly jwtService: JwtService;
    protected readonly configService: ConfigService;
    private readonly genericService;
    constructor(jwtService: JwtService, configService: ConfigService, genericService: GenericService);
    verifyToken(token: string, isAdmin?: boolean): Promise<AuthPayload['user'] & User>;
    bodyName(user: AuthPayload['user'] & User): string;
}
