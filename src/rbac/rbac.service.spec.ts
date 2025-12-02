import { Test, TestingModule } from '@nestjs/testing';

import { RoleGroupService, RoleService } from './rbac.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConflictException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { QueryDto } from '../generic/generic.dto';
import { v4 as uuidv4 } from 'uuid';
import { CreateRoleDto } from './rbac.dto';
import { LogService } from '../log/log.service';

const ID = uuidv4();
describe('RoleGroupService Integration', () => {
  let service: RoleGroupService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleGroupService, PrismaService, RoleService, LogService],
    }).compile();

    service = module.get<RoleGroupService>(RoleGroupService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Disconnect Prisma after all tests
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a role group', async () => {
      const createRoleDto = {
        id: ID,
        name: 'Admin Test - ' + String(Math.random()).split('.')[1],
      }; // Example DTO

      const result = await service.create(createRoleDto);

      expect(result.statusCode).toEqual(HttpStatus.CREATED);
    });
  });

  describe('update', () => {
    it('should update a role group', async () => {
      const id = ID;
      const updateRoleGroupDto = {
        name: 'User Test' + String(Math.random()).split('.')[1],
      }; // Example DTO

      const result = await service.update(id, updateRoleGroupDto);
      expect(result.statusCode).toEqual(HttpStatus.OK);
    });

    it('should throw NotFoundException if role group does not exist', async () => {
      const id = '1';

      await expect(service.update(id, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('get', () => {
    it('should return all role groups (paginated)', async () => {
      const query: QueryDto = {
        pagination: { page: 1, limit: 10 },
      };

      const roleGroups = await service.fetch(query);
      expect(roleGroups.statusCode).toEqual(HttpStatus.OK);
      expect(roleGroups.data).toBeInstanceOf(Array);
      expect(roleGroups.data.length).toBeGreaterThan(0);
    });

    it('should return a role group', async () => {
      const id = ID;

      const result = await service.fetchSingle(id);
      expect(result.statusCode).toEqual(HttpStatus.OK);
    });

    it('should throw NotFoundException if role group does not exist', async () => {
      const id = '1';

      await expect(service.fetchSingle(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a role group', async () => {
      const id = ID;

      const result = await service.delete(id);

      await prisma.roleGroup.deleteMany({
        where: { id: ID },
      });

      expect(result.statusCode).toEqual(HttpStatus.OK);
    });

    it('should throw NotFoundException if role group does not exist', async () => {
      const id = '1';

      await expect(service.delete(id)).rejects.toThrow(NotFoundException);
    });
  });
});

const ROLE_ID = uuidv4();
const ROLE_GROUP_ID = uuidv4();
const ROLE_NAME = 'Administrator Test - ' + String(Math.random()).split('.')[1];

// Mock the request object
const mockRequest = {
  ip: '127.0.0.1',
  headers: {
    'user-agent': 'Mozilla/5.0',
    'x-forwarded-for': '127.0.0.1',
  },
  connection: {
    remoteAddress: '127.0.0.1',
  },
} as unknown as Request;

describe('RoleService Integration', () => {
  let service: RoleService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleGroupService, RoleService, PrismaService, LogService],
    }).compile();

    service = module.get<RoleService>(RoleService);
    prisma = module.get<PrismaService>(PrismaService);

    await prisma.roleGroup.create({
      data: {
        id: ROLE_GROUP_ID,
        name: 'Admin Test' + String(Math.random()).split('.')[1],
      },
    });
  });

  afterAll(async () => {
    // Disconnect Prisma after all tests
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('should create a new role', async () => {
      const createRoleDto = {
        id: ROLE_ID,
        name: ROLE_NAME,
        description: 'Administrator role',
        role_group_id: ROLE_GROUP_ID, // Ensure this is a valid UUID
      };

      const result = await service.create(createRoleDto);
      expect(result.statusCode).toBe(201);
    });

    it('should throw a conflict exception if role name already exists', async () => {
      const createRoleDto: CreateRoleDto = {
        name: ROLE_NAME,
        description: 'Administrator role',
        role_group_id: ROLE_GROUP_ID,
      };

      await expect(service.create(createRoleDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update an existing role', async () => {
      const role = await prisma.role.findFirst({ where: { id: ROLE_ID } });
      const updateRoleDto = { description: 'Updated description' };

      const result = await service.update(ROLE_ID, updateRoleDto);
      expect(result.statusCode).toBe(200);
    });

    it('should throw a not found exception if role does not exist', async () => {
      await expect(
        service.update('non-existent-id', { description: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('fetch', () => {
    it('should fetch roles with pagination', async () => {
      const query = {
        role_group_id: ROLE_GROUP_ID,
        pagination: { page: 1, limit: 10 },
      };
      const result = await service.fetch(query);

      expect(result.statusCode).toBe(200);
      expect(result.data).toBeInstanceOf(Array);
    });
  });

  describe('fetchSingle', () => {
    it('should fetch a single role by ID', async () => {
      const role = await prisma.role.findFirst({ where: { id: ROLE_ID } });

      const result = await service.fetchSingle(role.id);

      expect(result.statusCode).toBe(200);
      expect(result.data.id).toBe(ROLE_ID);
    });

    it('should throw a not found exception if role does not exist', async () => {
      await expect(service.fetchSingle('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete an existing role', async () => {
      const role = await prisma.role.findFirst({ where: { id: ROLE_ID } });

      const result = await service.delete(role.id, mockRequest);

      // Optionally, clear the role, role groups and logs table by id after running tests
      await prisma.role.deleteMany({
        where: { role_group_id: ROLE_GROUP_ID },
      });

      await prisma.roleGroup.deleteMany({
        where: { id: ROLE_GROUP_ID },
      });

      await prisma.log.deleteMany({
        where: { entity_id: role.id },
      });

      expect(result.statusCode).toBe(200);
    });

    it('should throw a not found exception if role does not exist', async () => {
      await expect(
        service.delete('non-existent-id', mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
