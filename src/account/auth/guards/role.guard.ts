// src/auth/roles.guard.ts
import { Role } from '@/generic/generic.data';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      // If no roles are specified, allow access by default
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Assuming user is already attached to the request by a JWT strategy

    // Check if the user object exists and has a valid role
    if (!user || !user.role) {
      throw new ForbiddenException('Access denied: User role is missing');
    }

    const isValidRole = Object.values(Role).includes(user.role);

    if (!isValidRole) {
      throw new ForbiddenException(
        `Access denied: Invalid role '${user.role}'`,
      );
    }

    // Check if the user's role matches any of the required roles
    const hasAccess = requiredRoles.includes(user.role);

    if (!hasAccess) {
      throw new ForbiddenException('Access denied: Insufficient permissions');
    }

    return true;
  }
}
