import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateLogDto, FilterLogDto } from './log.dto';
import { Pagination, QueryDto, TZ } from '../generic/generic.dto';

import { PrismaService } from '../prisma/prisma.service';
import { Log, Prisma, PrismaClient } from '@prisma/client';
import {
  dateRangeKeys,
  maskSensitive,
  pageFilter,
  PAGINATION,
} from '../generic/generic.utils';
import { PrismaBaseRepository } from '../prisma/prisma.base.repository';
import { AuthPayload, PagePayload } from '../generic/generic.payload';
import { DefaultArgs } from '@prisma/client/runtime/library';

@Injectable()
export class LogService {
  private readonly logRepository: PrismaBaseRepository<
    Log,
    Prisma.LogCreateInput,
    Prisma.LogUpdateInput,
    Prisma.LogWhereUniqueInput,
    Prisma.LogWhereInput,
    Prisma.LogUpsertArgs
  >;

  constructor(private readonly prisma: PrismaService) {
    this.logRepository = new PrismaBaseRepository<
      Log,
      Prisma.LogCreateInput,
      Prisma.LogUpdateInput,
      Prisma.LogWhereUniqueInput,
      Prisma.LogWhereInput,
      Prisma.LogUpsertArgs
    >('log', prisma);
  }

  /**
   * Create log
   * @param createLogDto
   * @returns
   */
  async createLog(createLogDto: CreateLogDto): Promise<Log> {
    return this.logRepository.create({
      ...createLogDto,
      metadata: maskSensitive(createLogDto.metadata),
    });
  }

  /**
   * Create log with transaction
   * @param createLogDto
   * @param prisma
   */
  async createWithTrx(
    createLogDto: CreateLogDto,
    logRepo: Prisma.LogDelegate<DefaultArgs, Prisma.PrismaClientOptions>,
  ): Promise<Log> {
    // 1. Create a log with prisma.log transaction
    return await logRepo.create({
      data: { ...createLogDto, metadata: maskSensitive(createLogDto.metadata) },
    });
  }

  /**
   * Fetch logs (with filters)
   * @param query
   * @returns
   */
  async fetch(
    payload: AuthPayload,
    filterLogDto: FilterLogDto,
  ): Promise<PagePayload<Log>> {
    let { startDate, endDate } = filterLogDto;

    // const filters = dateRangeKeys(startDate, endDate);

    const pagination_filters = pageFilter(filterLogDto);

    const filters: Prisma.LogWhereInput & TZ = {
      ...(filterLogDto.q && {
        OR: [
          {
            ip_address: { contains: filterLogDto.q, mode: 'insensitive' },
          },
          {
            user_agent: { contains: filterLogDto.q, mode: 'insensitive' },
          },
          {
            entity: { contains: filterLogDto.q, mode: 'insensitive' },
          },
        ],
      }),
      ...pagination_filters.filters,
      tz: payload.timezone,
    };

    const includes: Prisma.LogInclude = {
      user: {
        select: {
          role: {
            select: {
              id: true,
              role_id: true,
            },
          },
        },
      },
    };

    const [logs, total] = await Promise.all([
      this.logRepository.findManyWithPagination(
        filters,
        {
          ...pagination_filters.pagination_options,
        },
        Prisma.SortOrder.desc,
        includes,
        undefined,
      ),
      this.logRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      message: 'Logs retrieved successfully',
      data: logs,
      count: total,
    };
  }

  async fetchSingle(where: any): Promise<Log> {
    const log_details = await this.logRepository.findOne({ where });

    return log_details;
  }
}
