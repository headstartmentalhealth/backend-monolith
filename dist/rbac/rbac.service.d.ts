import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, CreateRoleGroupDto, RoleQueryDto } from './rbac.dto';
import { Prisma, PrismaClient, Role, RoleGroup } from '@prisma/client';
import { GenericPayload, GenericPayloadAlias, PagePayload } from '../generic/generic.payload';
import { QueryDto } from '../generic/generic.dto';
import { LogService } from '../log/log.service';
import { DefaultArgs } from '@prisma/client/runtime/library';
export declare class RoleGroupService {
    private readonly prisma;
    private readonly roleGroupRepository;
    constructor(prisma: PrismaService);
    create(createRoleDto: CreateRoleGroupDto): Promise<GenericPayload>;
    update(id: string, updateRoleGroupDto: Partial<CreateRoleGroupDto>): Promise<GenericPayload>;
    fetch(query: QueryDto): Promise<PagePayload<RoleGroup>>;
    fetchSingle(id: string): Promise<GenericPayloadAlias<RoleGroup>>;
    private hasRelatedRecords;
    delete(id: string): Promise<GenericPayload>;
}
export declare class RoleService {
    private readonly prisma;
    private readonly roleGroupService;
    private readonly logService;
    private readonly roleRepository;
    constructor(prisma: PrismaService, roleGroupService: RoleGroupService, logService: LogService);
    create(createRoleDto: CreateRoleDto): Promise<GenericPayload>;
    update(id: string, updateRoleDto: Partial<CreateRoleDto>): Promise<GenericPayload>;
    fetch(query: RoleQueryDto): Promise<PagePayload<Role>>;
    fetchSingle(id: string): Promise<GenericPayloadAlias<Role>>;
    fetchOne(role_id: string): Promise<Role>;
    fetchOneTrx(role_id: string, prisma: Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>): Promise<Role>;
    private hasRelatedRecords;
    delete(id: string, request: Request): Promise<GenericPayload>;
}
