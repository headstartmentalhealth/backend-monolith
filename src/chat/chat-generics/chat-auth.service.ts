import { Role } from '@/generic/generic.data';
import { AuthPayload } from '@/generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ChatGroupMember, User } from '@prisma/client';

@Injectable()
export class ChatAuthService {
  constructor(
    protected readonly jwtService: JwtService,
    protected readonly configService: ConfigService,
    private readonly genericService: GenericService,
  ) {}

  /**
   * Verify token
   * @param token
   */
  async verifyToken(
    token: string,
    isAdmin?: boolean,
  ): Promise<AuthPayload['user'] & User> {
    try {
      const payload = (await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      })) as AuthPayload['user'];

      const { sub, role } = payload;

      if (isAdmin) {
        if (![Role.OWNER_ADMIN, Role.OWNER_SUPER_ADMIN].includes(role)) {
          // Authorize for admin only
          throw new UnauthorizedException();
        }
      }

      const user = await this.genericService.findUser(sub);

      return Object.assign({}, payload, user);
    } catch (error: any) {
      throw new UnauthorizedException(error.message);
    }
  }

  /**
   * Body name
   * @param user
   * @returns
   */
  bodyName(user: AuthPayload['user'] & User): string {
    return user.name;
    // return `${user.name} (${user.role})`;
  }
}
