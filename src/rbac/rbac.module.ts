import { Module } from '@nestjs/common';
import { RoleGroupService, RoleService } from './rbac.service';
import { RoleController, RoleGroupController } from './rbac.controller';
import { PrismaService } from '../prisma/prisma.service';
import { LogService } from '../log/log.service';

@Module({
  controllers: [RoleGroupController, RoleController],
  providers: [RoleGroupService, RoleService, PrismaService, LogService],
  exports: [RoleService],
})
export class RbacModule {}
