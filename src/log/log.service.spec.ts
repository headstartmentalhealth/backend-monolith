import { Test, TestingModule } from '@nestjs/testing';
import { LogService } from './log.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLogDto } from './log.dto';
import { QueryDto } from '../generic/generic.dto';
import { Action } from '@prisma/client';
import { faker } from '@faker-js/faker/.';
import { v4 as uuidv4 } from 'uuid';

const USER_ID = uuidv4();

describe('LogService Integration', () => {
  let service: LogService | any;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LogService, PrismaService],
    }).compile();

    service = module.get<LogService>(LogService);
    prisma = module.get<PrismaService>(PrismaService);

    // Create user
    await prisma.user.create({
      data: {
        id: USER_ID,
        name: faker.person.firstName(),
        email: faker.person.firstName() + '@example.com',
        password_hash: faker.person.firstName(),
      },
    });

    // Optionally, clear the logs table before running tests
    await prisma.log.deleteMany({
      where: { user_id: USER_ID },
    });
  });

  afterAll(async () => {
    // Disconnect Prisma after all tests
    await prisma.$disconnect();
  });

  describe('createLog', () => {
    it('should create a log and return it', async () => {
      const createLogDto: CreateLogDto & {
        created_at: Date;
        updated_at: Date;
      } = {
        user_id: USER_ID,
        action: Action.CREATE,
        entity: 'User',
        entity_id: '5f809470-233e-41b3-9342-806fcb01bb17',
        created_at: new Date(),
        updated_at: new Date(),
        metadata: { key: 'value' },
        ip_address: '192.168.0.1',
        user_agent: 'Mozilla/5.0',
      };

      const result = await service.createLog(createLogDto);

      expect(result).toMatchObject(createLogDto);
    });
  });

  describe('fetch', () => {
    it('should fetch logs within the date range with pagination', async () => {
      const query: QueryDto = {
        startDate: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString(), // One month ago
        endDate: new Date().toISOString(),
        pagination: { page: 1, limit: 10 },
      };

      const logs = await service.fetch(query);
      expect(logs.data).toBeInstanceOf(Array);
      expect(logs.data.length).toBeGreaterThan(0);

      // Clear the test data in the logs and user table
      await prisma.log.deleteMany({
        where: { user_id: USER_ID },
      });

      await prisma.user.deleteMany({
        where: { id: USER_ID },
      });
    });

    it('should handle invalid date format and throw an error', async () => {
      const query: QueryDto = {
        startDate: 'invalid-date',
        endDate: 'invalid-date',
        pagination: { page: 1, limit: 10 },
      };

      await expect(service.fetch(query)).rejects.toThrowError(
        'Invalid date format',
      );
    });
  });
});
