import {
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaBaseRepository } from '../prisma/prisma.base.repository';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, CreateRoleGroupDto, RoleQueryDto } from './rbac.dto';
import { Prisma, PrismaClient, Role, RoleGroup } from '@prisma/client';
import {
  GenericPayload,
  GenericPayloadAlias,
  PagePayload,
} from '../generic/generic.payload';
import { QueryDto } from '../generic/generic.dto';
import {
  getIpAddress,
  getUserAgent,
  PAGINATION,
} from '../generic/generic.utils';
import { filterByRoleGroup, formatRole } from './rbac.utils';
import { LogService } from '../log/log.service';
import { DefaultArgs } from '@prisma/client/runtime/library';

@Injectable()
export class RoleGroupService {
  private readonly roleGroupRepository: PrismaBaseRepository<
    RoleGroup,
    Prisma.RoleGroupCreateInput,
    Prisma.RoleGroupUpdateInput,
    Prisma.RoleGroupWhereUniqueInput,
    Prisma.RoleGroupWhereInput,
    Prisma.RoleGroupUpsertArgs
  >;

  constructor(private readonly prisma: PrismaService) {
    this.roleGroupRepository = new PrismaBaseRepository<
      RoleGroup,
      Prisma.RoleGroupCreateInput,
      Prisma.RoleGroupUpdateInput,
      Prisma.RoleGroupWhereUniqueInput,
      Prisma.RoleGroupWhereInput,
      Prisma.RoleGroupUpsertArgs
    >('roleGroup', prisma);
  }

  /**
   * Create role group
   * @param createRoleDto
   * @returns
   */
  async create(createRoleDto: CreateRoleGroupDto): Promise<GenericPayload> {
    const { name } = createRoleDto;
    const role_group = await this.roleGroupRepository.findOne({ name });

    // Check if role group exists
    if (role_group) {
      throw new ConflictException('Role group exists.');
    }

    await this.roleGroupRepository.create(createRoleDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Role group created successfully.',
    };
  }

  /**
   * Update role group
   * @param id
   * @param updateRoleGroupDto
   * @returns
   */
  async update(
    id: string,
    updateRoleGroupDto: Partial<CreateRoleGroupDto>,
  ): Promise<GenericPayload> {
    const role_group = await this.roleGroupRepository.findOne({ id });
    if (!role_group) {
      throw new NotFoundException('Role group not found');
    }
    await this.roleGroupRepository.update({ id }, updateRoleGroupDto);

    return {
      statusCode: HttpStatus.OK,
      message: 'Role group updated successfully',
    };
  }

  /**
   * Get role groups (Paginated)
   * @returns
   */
  async fetch(query: QueryDto): Promise<PagePayload<RoleGroup>> {
    let { pagination } = query;

    const role_groups = await this.roleGroupRepository.findManyWithPagination(
      {},
      {
        page: +pagination?.page || PAGINATION.PAGE,
        limit: +pagination?.limit || PAGINATION.LIMIT,
      },
    );

    // Get total
    const total = await this.roleGroupRepository.count({});

    return {
      statusCode: HttpStatus.OK,
      message: 'Role groups data retrieved successfully.',
      data: role_groups,
      count: total,
    };
  }

  /**
   * Get role group
   * @param id
   * @returns
   */
  async fetchSingle(id: string): Promise<GenericPayloadAlias<RoleGroup>> {
    const role_group = await this.roleGroupRepository.findOne({
      id,
    });

    if (!role_group) {
      throw new NotFoundException('Role group not found');
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Role group data retrieved successfully.',
      data: role_group,
    };
  }

  /**
   * Validate that model has related records
   * @param role_group_id
   */
  private async hasRelatedRecords(role_group_id: string): Promise<void> {
    const relatedTables = [{ model: this.prisma.role, field: 'role_group_id' }];

    for (const { model, field } of relatedTables) {
      const count = await (model.count as any)({
        where: { [field]: role_group_id },
      });
      if (count > 0) {
        throw new ForbiddenException('Related records for this model exists.'); // Related records exist
      }
    }

    // No related records. Move on
  }

  /**
   * Delete role group
   * @param id
   * @returns
   */
  async delete(id: string): Promise<GenericPayload> {
    const role_group: RoleGroup = await this.roleGroupRepository.findOne({
      id,
    });

    if (!role_group) {
      throw new NotFoundException('Role group not found');
    }

    // Validate that there are no related models
    await this.hasRelatedRecords(role_group.id);

    await this.roleGroupRepository.delete({ id });

    return {
      statusCode: HttpStatus.OK,
      message: 'Role group deleted successfully.',
    };
  }
}

@Injectable()
export class RoleService {
  private readonly roleRepository: PrismaBaseRepository<
    Role,
    Prisma.RoleCreateInput,
    Prisma.RoleUpdateInput,
    Prisma.RoleWhereUniqueInput,
    Prisma.RoleWhereInput,
    Prisma.RoleUpsertArgs
  >;

  constructor(
    private readonly prisma: PrismaService,
    private readonly roleGroupService: RoleGroupService,
    private readonly logService: LogService, // Inject the LogService
  ) {
    this.roleRepository = new PrismaBaseRepository<
      Role,
      Prisma.RoleCreateInput,
      Prisma.RoleUpdateInput,
      Prisma.RoleWhereUniqueInput,
      Prisma.RoleWhereInput,
      Prisma.RoleUpsertArgs
    >('role', prisma);
  }

  /**
   * Create a new role
   * @param createRoleDto
   * @returns
   */
  async create(createRoleDto: CreateRoleDto): Promise<GenericPayload> {
    const { name, role_group_id } = createRoleDto;

    // Validate role group id
    await this.roleGroupService.fetchSingle(role_group_id);

    // Validate uniqueness of the role name
    const existingRole = await this.roleRepository.findOne({ name });

    if (existingRole) {
      throw new ConflictException('Role name already exists.');
    }

    // Get role_id
    const role_id = formatRole(name);

    await this.roleRepository.create({ ...createRoleDto, role_id } as any);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Role created successfully.',
    };
  }

  /**
   * Update role
   * @param id
   * @param updateRoleDto
   * @returns
   */
  async update(
    id: string,
    updateRoleDto: Partial<CreateRoleDto>,
  ): Promise<GenericPayload> {
    const { name } = updateRoleDto;

    // Check if the role exists
    const role = await this.roleRepository.findOne({ id });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Validate uniqueness of the role name if it's being updated
    if (name && name !== role.name) {
      const existingRole = await this.roleRepository.findOne({ name });
      if (existingRole) {
        throw new ConflictException('Role name already exists.');
      }
    }

    await this.roleRepository.update({ id }, updateRoleDto);

    return {
      statusCode: HttpStatus.OK,
      message: 'Role updated successfully',
    };
  }

  /**
   * Fetch roles (Paginated)
   * @param query
   * @returns
   */
  async fetch(query: RoleQueryDto): Promise<PagePayload<Role>> {
    const { pagination, role_group_id } = query;

    // Validate role group id if existent
    if (role_group_id) {
      await this.roleGroupService.fetchSingle(role_group_id);
    }

    const filter = filterByRoleGroup(role_group_id);

    const include: Prisma.RoleInclude = {
      role_group: true,
    };

    const roles = await this.roleRepository.findManyWithPagination(
      filter,
      {
        page: +pagination?.page || PAGINATION.PAGE,
        limit: +pagination?.limit || PAGINATION.LIMIT,
      },
      Prisma.SortOrder.desc,
      include,
    );

    const total = await this.roleRepository.count(filter);

    return {
      statusCode: HttpStatus.OK,
      message: 'Roles retrieved successfully',
      data: roles,
      count: total,
    };
  }

  /**
   * Fetch a single role
   * @param id
   * @returns
   */
  async fetchSingle(id: string): Promise<GenericPayloadAlias<Role>> {
    const include: Prisma.RoleInclude = { role_group: true };

    const role = await this.roleRepository.findOne({ id }, include);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Role retrieved successfully',
      data: role,
    };
  }

  /**
   * Fetch a single role_id
   * @param role_id
   * @returns
   */
  async fetchOne(role_id: string): Promise<Role> {
    const include: Prisma.RoleInclude = { role_group: true };

    const role = await this.roleRepository.findOne({ role_id }, include);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  /**
   * Fetch a single role_id
   * @param role_id
   * @returns
   */
  async fetchOneTrx(
    role_id: string,
    prisma: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
  ): Promise<Role> {
    const include: Prisma.RoleInclude = { role_group: true };

    const role = await prisma.role.findFirst({ where: { role_id }, include });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  /**
   * Validate that model has related records
   * @param subscription_plan_id
   */
  private async hasRelatedRecords(role_identity: string): Promise<void> {
    const relatedTables = [{ model: this.prisma.user, field: 'role_identity' }];

    for (const { model, field } of relatedTables) {
      const count = await (model.count as any)({
        where: { [field]: role_identity },
      });
      if (count > 0) {
        throw new ForbiddenException('Related records for this model exists.'); // Related records exist
      }
    }

    // No related records. Move on
  }

  /**
   * Delete a role
   * @param id
   * @returns
   */
  async delete(id: string, request: Request): Promise<GenericPayload> {
    const role: Role = await this.roleRepository.findOne({ id });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Validate that there are no related models
    await this.hasRelatedRecords(role.id);

    await this.roleRepository.delete({ id });

    const ipAddress = getIpAddress(request);
    const userAgent = getUserAgent(request);

    // Log the deletion action
    await this.logService.createLog({
      action: 'DELETE',
      entity: 'Role',
      entity_id: id,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: `Role ID ${role.id} has just been deleted`,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Role deleted successfully',
    };
  }
}
