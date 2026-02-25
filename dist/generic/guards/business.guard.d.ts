import { CanActivate, ExecutionContext } from '@nestjs/common';
import { GenericService } from '../generic.service';
import { PrismaService } from '@/prisma/prisma.service';
export declare class BusinessGuard implements CanActivate {
    private readonly genericService;
    private readonly prisma;
    constructor(genericService: GenericService, prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getUserFromRequest;
    private getBusinessIdFromRequest;
    private verifyUserBusinessLink;
}
