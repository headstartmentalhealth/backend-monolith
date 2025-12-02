import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthPayload } from '../generic.payload';
import { GenericService } from '../generic.service';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class BusinessGuard implements CanActivate {
  constructor(
    private readonly genericService: GenericService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = this.getUserFromRequest(request);
    const businessId = this.getBusinessIdFromRequest(request);

    await this.verifyUserBusinessLink(user.sub, businessId);

    return true;
  }

  /**
   * Extracts and validates the user from request
   */
  private getUserFromRequest(request: any): AuthPayload['user'] {
    const user: AuthPayload['user'] = request.user;
    if (!user?.sub) {
      throw new ForbiddenException('Invalid or missing user information');
    }
    return user;
  }

  /**
   * Extracts and validates the businessId from headers
   */
  private getBusinessIdFromRequest(request: any): string {
    const businessId = request.headers['business-id'];
    if (!businessId) {
      throw new ForbiddenException('Business Id is required');
    }
    return businessId;
  }

  /**
   * Verifies that the user is linked to the provided business
   */
  private async verifyUserBusinessLink(userId: string, businessId: string) {
    await this.genericService.isUserLinkedToBusiness(
      this.prisma,
      { user_id: userId, business_id: businessId },
      true,
    );
  }
}
