import { CreateModuleDto } from '@/product/course/module/module.dto';
import {
  AuthPayload,
  GenericPayload,
  GenericPayloadAlias,
  PagePayload,
} from '@/generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import { LogService } from '@/log/log.service';
import { PrismaBaseRepository } from '@/prisma/prisma.base.repository';
import { PrismaService } from '@/prisma/prisma.service';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Action, Multimedia, Prisma } from '@prisma/client';
import { CreateMultimediaDto, FilterMultimediaDto } from './crud.dto';
import {
  getIpAddress,
  getUserAgent,
  pageFilter,
} from '@/generic/generic.utils';
import { IdDto, QueryDto, TZ } from '@/generic/generic.dto';

@Injectable()
export class MultimediaCrudService {
  private readonly multimediaRepository: PrismaBaseRepository<
    Multimedia,
    Prisma.MultimediaCreateInput,
    Prisma.MultimediaUpdateInput,
    Prisma.MultimediaWhereUniqueInput,
    Prisma.MultimediaWhereInput | Prisma.MultimediaFindFirstArgs,
    Prisma.MultimediaUpsertArgs
  >;

  private readonly select: Prisma.MultimediaSelect = {
    id: true,
    url: true,
    type: true,
    provider: true,
    creator_id: true,
    created_at: true,
    updated_at: true,
    creator: {
      select: {
        id: true,
        name: true,
        role: { select: { name: true, role_id: true } },
      }, // Fetch only required user details
    },
  };

  constructor(
    private prisma: PrismaService,
    private readonly logService: LogService,
    private readonly genericService: GenericService,
  ) {
    this.multimediaRepository = new PrismaBaseRepository<
      Multimedia,
      Prisma.MultimediaCreateInput,
      Prisma.MultimediaUpdateInput,
      Prisma.MultimediaWhereUniqueInput,
      Prisma.MultimediaWhereInput | Prisma.MultimediaFindFirstArgs,
      Prisma.MultimediaUpsertArgs
    >('multimedia', prisma);
  }

  /**
   * Create media content
   * @param request
   * @param createMultimediaDto
   */
  async create(
    request: AuthPayload & Request,
    createMultimediaDto: CreateMultimediaDto,
  ): Promise<GenericPayloadAlias<Multimedia>> {
    const auth = request.user;

    return this.prisma.$transaction(async (prisma) => {
      if (request['Business-Id']) {
        // 1. Check if user is part of the company's administrators
        await this.genericService.isUserLinkedToBusiness(prisma, {
          user_id: auth.sub,
          business_id: request['Business-Id'],
        });
      }

      // 2. Create multimedia
      const multimedia = await prisma.multimedia.create({
        data: {
          url: createMultimediaDto.url,
          type: createMultimediaDto.type,
          provider: createMultimediaDto.provider,
          creator: { connect: { id: auth.sub } },
          ...(request['Business-Id'] && {
            business_info: { connect: { id: request['Business-Id'] } },
          }),
        },
        select: this.select,
      });

      let metadata = `User with ID ${auth.sub} just created a multimedia ID ${multimedia.id}.`;
      if (request['Business-Id']) {
        metadata = `User with ID ${auth.sub} just created a multimedia ID ${multimedia.id} for Business ID ${multimedia.business_id}.`;
      }
      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_MULTIMEDIA,
          entity: 'Multimedia',
          entity_id: multimedia.id,
          metadata,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Media content created successfully.',
        data: multimedia,
      };
    });
  }

  /**
   * Create media contents
   * @param request
   * @param createMultimediaDto
   */
  async createMany(
    request: AuthPayload & Request,
    createMultimediaDtos: CreateMultimediaDto[],
  ): Promise<GenericPayload> {
    const auth = request.user;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check if user is part of the company's administrators
      if (request['Business-Id']) {
        await this.genericService.isUserLinkedToBusiness(prisma, {
          user_id: auth.sub,
          business_id: request['Business-Id'],
        });
      }

      // 2. Create multimedia and return the created items
      const createdMultimedia = await Promise.all(
        createMultimediaDtos.map((dto: CreateMultimediaDto) =>
          prisma.multimedia.create({
            data: {
              url: dto.url,
              type: dto.type,
              provider: dto.provider,
              creator_id: auth.sub,
              ...(request['Business-Id'] && {
                business_id: request['Business-Id'],
              }),
            },
            select: this.select, // Use the predefined select object
          }),
        ),
      );

      let metadata = `User with ID ${auth.sub} just created ${createdMultimedia.length} multimedia.`;
      if (request['Business-Id']) {
        metadata = `User with ID ${auth.sub} just created ${createdMultimedia.length} multimedia for Business ID ${request['Business-Id']}.`;
      }

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_MULTIMEDIA,
          entity: 'Multimedia',
          metadata,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Media content(s) created successfully.',
        data: createdMultimedia,
      };
    });
  }

  /**
   * Fetch media contents
   * @param payload
   * @param queryDto
   */
  async fetch(
    payload: AuthPayload,
    queryDto: QueryDto,
  ): Promise<PagePayload<Multimedia>> {
    const auth = payload.user;

    if (payload['Business-Id']) {
      // Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(this.prisma, {
        user_id: auth.sub,
        business_id: payload['Business-Id'],
      });
    }

    // Invoke pagination filters
    const pagination_filters = pageFilter(queryDto);

    // Filters
    const filters: Prisma.MultimediaWhereInput & TZ = {
      business_id: payload['Business-Id'],
      ...pagination_filters.filters,
      tz: payload.timezone,
    };

    // Assign something else to same variable
    const select = this.select;

    const [multimedia, total] = await Promise.all([
      this.multimediaRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.multimediaRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: multimedia,
      count: total,
    };
  }

  /**
   * Get a single media content (return error if not found)
   * @param id
   * @returns
   */
  private async findOne(id: string): Promise<Multimedia> {
    const select = this.select;

    const filters: Prisma.MultimediaWhereUniqueInput = {
      id,
    };

    const content = await this.multimediaRepository.findOne(
      filters,
      undefined,
      select,
    );

    if (!content) {
      throw new NotFoundException(`Media content not found.`);
    }

    return content;
  }

  /**
   * Delete a media content
   * @param request
   * @param param
   */
  async delete(
    request: AuthPayload & Request,
    param: IdDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: request['Business-Id'],
      });

      // 2. Get a single media content
      const existing_media = await this.findOne(id);

      // 4. Validate that there are no related models (Presently, nothing depends on this model)

      // 5. Soft delete multimedia
      await prisma.multimedia.update({
        where: { id: existing_media.id },
        data: {
          deleted_at: new Date(),
        },
      });

      // 6. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_MULTIMEDIA,
          entity: 'Multimedia',
          entity_id: existing_media.id,
          metadata: `User with ID ${auth.sub} just deleted a multimedia ID ${existing_media.id} from business ID ${request['Business-Id']}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Media content deleted successfully.',
      };
    });
  }

  /**
   * Fetch all media contents - for admin
   * @param payload
   * @param queryDto
   */
  async fetchAll(
    payload: AuthPayload & Request,
    filterMultimediaDto: FilterMultimediaDto,
  ): Promise<PagePayload<Multimedia>> {
    const auth = payload.user;

    // Check if user is part of the owner's administrators (TODO)

    // Invoke pagination filters
    const pagination_filters = pageFilter(filterMultimediaDto);

    // Filters
    const filters: Prisma.MultimediaWhereInput & TZ = {
      ...(filterMultimediaDto.business_id && {
        business_id: {
          equals: filterMultimediaDto.business_id,
        },
      }),
      ...(filterMultimediaDto.q && {
        OR: [
          {
            id: { contains: filterMultimediaDto.q, mode: 'insensitive' },
          },
        ],
      }),
      ...pagination_filters.filters,
      tz: payload.timezone,
    };

    // Assign something else to same variable
    const select: Prisma.MultimediaSelect = {
      ...this.select,
      business_id: true,
      business_info: true,
    };

    const [multimedia, total] = await Promise.all([
      this.multimediaRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.multimediaRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: multimedia,
      count: total,
    };
  }
}
