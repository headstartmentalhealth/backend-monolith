import { RoleGroupService, RoleService } from './rbac.service';
import { CreateRoleDto, CreateRoleGroupDto, RoleQueryDto } from './rbac.dto';
import { GenericPayload, GenericPayloadAlias, PagePayload } from '../generic/generic.payload';
import { QueryDto } from '../generic/generic.dto';
import { Role, RoleGroup } from '@prisma/client';
export declare class RoleGroupController {
    private readonly roleGroupService;
    constructor(roleGroupService: RoleGroupService);
    create(createRoleGroupDto: CreateRoleGroupDto): Promise<GenericPayload>;
    fetch(query: QueryDto): Promise<PagePayload<RoleGroup>>;
    get(id: string): Promise<GenericPayloadAlias<RoleGroup>>;
    update(id: string, updateRoleGroupDto: Partial<CreateRoleGroupDto>): Promise<GenericPayload>;
    delete(id: string): Promise<GenericPayload>;
}
export declare class RoleController {
    private readonly roleService;
    constructor(roleService: RoleService);
    create(createRoleDto: CreateRoleDto): Promise<GenericPayload>;
    fetch(query: RoleQueryDto): Promise<PagePayload<Role>>;
    get(id: string): Promise<GenericPayloadAlias<Role>>;
    update(id: string, updateRoleDto: Partial<CreateRoleDto>): Promise<GenericPayload>;
    delete(id: string, request: Request): Promise<GenericPayload>;
}
