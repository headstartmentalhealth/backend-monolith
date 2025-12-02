// src/auth/roles.decorator.ts
import { Role } from '../../../generic/generic.data';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
