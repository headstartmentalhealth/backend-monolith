import {
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateResourceDto,
  FilterResourceDto,
  UpdateResourceDto,
} from './resource.dto';
import { PrismaBaseRepository } from '@/prisma/prisma.base.repository';
import {
  Action,
  Resource,
  Prisma,
} from '@prisma/client';
import { LogService } from '@/log/log.service';
import { GenericService } from '@/generic/generic.service';
import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  GenericPayloadAlias,
  PagePayload,
} from '@/generic/generic.payload';
import {
  getIpAddress,
  getUserAgent,
  pageFilter,
} from '@/generic/generic.utils';
import { IdDto, TZ } from '@/generic/generic.dto';

@Injectable()
export class ResourceService {
  private readonly model = 'Resource';

  private readonly resourceRepository: PrismaBaseRepository<
    Resource,
    Prisma.ResourceCreateInput,
    Prisma.ResourceUpdateInput,
    Prisma.ResourceWhereUniqueInput,
    Prisma.ResourceWhereInput | Prisma.ResourceFindFirstArgs,
    Prisma.ResourceUpsertArgs
  >;

  private readonly select: Prisma.ResourceSelect = {
    id: true,
    title: true,
    description: true,
    resource_type: true,
    content_url: true,
    cover_image: true,
    category: true,
    age_range: true,
    topic: true,
    minutes: true,
    business_id: true,
    creator_id: true,
    created_at: true,
    updated_at: true,
    creator: {
      select: {
        id: true,
        name: true,
      },
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly logService: LogService,
    private readonly genericService: GenericService,
  ) {
    this.resourceRepository = new PrismaBaseRepository<
      Resource,
      Prisma.ResourceCreateInput,
      Prisma.ResourceUpdateInput,
      Prisma.ResourceWhereUniqueInput,
      Prisma.ResourceWhereInput | Prisma.ResourceFindFirstArgs,
      Prisma.ResourceUpsertArgs
    >('resource', prisma);
  }

  async create(
    request: AuthPayload & Request,
    dto: CreateResourceDto,
  ): Promise<GenericPayloadAlias<Resource>> {
    const auth = request.user;

    return this.prisma.$transaction(async (prisma) => {
      const resource = await prisma.resource.create({
        data: {
          ...dto,
          creator: { connect: { id: auth.sub } },
          ...(request['Business-Id'] && {
            business_info: { connect: { id: request['Business-Id'] } },
          }),
        },
      });

      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_RESOURCE,
          entity: 'Resource',
          entity_id: resource.id,
          metadata: `User ${auth.sub} created a ${dto.resource_type} resource: ${resource.id}`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Resource created successfully.',
        data: resource,
      };
    });
  }

  async fetch(
    payload: AuthPayload,
    filterDto: FilterResourceDto,
  ): Promise<PagePayload<Resource>> {
    const auth = payload.user;

    if (payload['Business-Id']) {
      await this.genericService.isUserLinkedToBusiness(this.prisma, {
        user_id: auth.sub,
        business_id: payload['Business-Id'],
      });
    }

    const pagination_filters = pageFilter(filterDto);

    const filters: Prisma.ResourceWhereInput & TZ = {
      ...(payload['Business-Id'] && { business_id: payload['Business-Id'] }),
      ...(filterDto.resource_type && { resource_type: filterDto.resource_type }),
      ...(filterDto.q && {
        OR: [
          {
            title: { contains: filterDto.q, mode: 'insensitive' },
          },
          {
            description: { contains: filterDto.q, mode: 'insensitive' },
          },
        ],
      }),
      ...pagination_filters.filters,
      tz: payload.timezone,
      deleted_at: null,
    };

    const [resources, total] = await Promise.all([
      this.resourceRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        this.select,
      ),
      this.resourceRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: resources,
      count: total,
    };
  }

  async fetchSingle(
    payload: AuthPayload,
    param: IdDto,
  ): Promise<GenericDataPayload<Resource>> {
    const auth = payload.user;

    if (payload['Business-Id']) {
      await this.genericService.isUserLinkedToBusiness(this.prisma, {
        user_id: auth.sub,
        business_id: payload['Business-Id'],
      });
    }

    const resource = await this.resourceRepository.findOne(
      { id: param.id, ...(payload['Business-Id'] && { business_id: payload['Business-Id'] }), deleted_at: null },
      undefined,
      this.select,
    );

    if (!resource) {
      throw new NotFoundException('Resource not found.');
    }

    return {
      statusCode: HttpStatus.OK,
      data: resource,
    };
  }

  async update(
    request: AuthPayload & Request,
    param: IdDto,
    dto: UpdateResourceDto,
  ): Promise<GenericPayloadAlias<Resource>> {
    const auth = request.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      const existing = await prisma.resource.findFirst({
        where: { id, ...(request['Business-Id'] && { business_id: request['Business-Id'] }), deleted_at: null },
      });

      if (!existing) {
        throw new NotFoundException('Resource not found.');
      }

      const resource = await prisma.resource.update({
        where: { id },
        data: dto,
      });

      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_RESOURCE,
          entity: 'Resource',
          entity_id: resource.id,
          metadata: `User ${auth.sub} updated resource: ${resource.id}`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Resource updated successfully.',
        data: resource,
      };
    });
  }

  async delete(
    request: AuthPayload & Request,
    param: IdDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      const existing = await prisma.resource.findFirst({
        where: { id, ...(request['Business-Id'] && { business_id: request['Business-Id'] }), deleted_at: null },
      });

      if (!existing) {
        throw new NotFoundException('Resource not found.');
      }

      await prisma.resource.update({
        where: { id },
        data: { deleted_at: new Date() },
      });

      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_RESOURCE,
          entity: 'Resource',
          entity_id: id,
          metadata: `User ${auth.sub} deleted resource: ${id}`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Resource deleted successfully.',
      };
    });
  }
}
