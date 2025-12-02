import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateBillingInformationDto,
  UpdateBillingInformationDto,
} from './billing.dto';
import { PrismaBaseRepository } from '../../prisma/prisma.base.repository';
import { Action, BillingInformation, Prisma } from '@prisma/client';
import { LogService } from '../../log/log.service';
import { GenericService } from '../../generic/generic.service';
import {
  AuthPayload,
  GenericPayload,
  PagePayload,
} from '../../generic/generic.payload';
import {
  deletionRename,
  getCountryName,
  getIpAddress,
  getUserAgent,
  pageFilter,
} from '../../generic/generic.utils';
import { QueryDto, TZ } from '../../generic/generic.dto';
import { BillingInformationSelection, RelatedModels } from './billing.utils';

@Injectable()
export class BillingService {
  private readonly model = 'BillingInformation';

  private readonly billingInformationRepository: PrismaBaseRepository<
    BillingInformation,
    Prisma.BillingInformationCreateInput,
    Prisma.BillingInformationUpdateInput,
    Prisma.BillingInformationWhereUniqueInput,
    | Prisma.BillingInformationWhereInput
    | Prisma.BillingInformationFindFirstArgs,
    Prisma.BillingInformationUpsertArgs
  >;

  private readonly select: Prisma.BillingInformationSelect = {
    id: true,
    address: true,
    city: true,
    state: true,
    apartment: true,
    postal_code: true,
    country: true,
    selected: true,
    country_code: true,
    created_at: true,
    user: {
      select: {
        id: true,
        name: true,
        role: { select: { name: true, role_id: true } },
      }, // Fetch only required user details
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly logService: LogService,
    private readonly genericService: GenericService,
  ) {
    this.billingInformationRepository = new PrismaBaseRepository<
      BillingInformation,
      Prisma.BillingInformationCreateInput,
      Prisma.BillingInformationUpdateInput,
      Prisma.BillingInformationWhereUniqueInput,
      | Prisma.BillingInformationWhereInput
      | Prisma.BillingInformationFindFirstArgs,
      Prisma.BillingInformationUpsertArgs
    >('billingInformation', prisma);
  }

  /**
   * Create a billing info
   * @param request
   * @param dto
   * @returns
   */
  async create(
    request: AuthPayload & Request,
    dto: CreateBillingInformationDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { address, state, apartment, postal_code, country, city, selected } =
      dto;

    return this.prisma.$transaction(async (prisma) => {
      // Get country full name
      const country_name = getCountryName(country);

      // 1. Verify that country code is recognized
      if (!country_name) {
        throw new NotFoundException(`Country code '${country}' not found`);
      }

      // 2. Retrieve existing billing info
      const existing_billing_info = await prisma.billingInformation.findFirst({
        where: {
          address,
          state,
          apartment,
          postal_code,
          country,
          city,
        },
      });

      // 3. Check if billing info has already been created
      if (existing_billing_info) {
        throw new ConflictException('Billing information exists.');
      }

      // 4. Deselect any already selected billing info if the selected field is true
      if (selected) {
        await prisma.billingInformation.updateMany({
          where: { user_id: auth.sub },
          data: { selected: false },
        });
      }

      // 5. Create billing info
      const billing_info = await prisma.billingInformation.create({
        data: {
          ...dto,
          user_id: auth.sub,
          country_code: country,
          country: country_name,
        },
      });

      // 6. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_BILLING,
          entity: this.model,
          entity_id: billing_info.id,
          metadata: `User with ID ${auth.sub} just created a billing info of ID ${billing_info.id} for country ${country}`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Billing information created successfully.',
      };
    });
  }

  /**
   * Get all user's billing information
   * @param payload
   * @param param
   * @param queryDto
   */
  async fetch(
    payload: AuthPayload,
    queryDto: QueryDto,
  ): Promise<PagePayload<BillingInformation>> {
    const auth = payload.user;

    // Invoke pagination filters
    const pagination_filters = pageFilter(queryDto);

    // Filters
    const filters: Prisma.BillingInformationWhereInput & TZ = {
      user_id: auth.sub,
      ...pagination_filters.filters,
      tz: payload.timezone,
    };

    // Assign something else to same variable
    const select = this.select;

    const [billingInfo, total] = await Promise.all([
      this.billingInformationRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.billingInformationRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: billingInfo,
      count: total,
    };
  }

  /**
   * Get a single billing information by ID
   * @param id
   * @returns
   */
  async findOne(
    id: string,
    user_id?: string,
  ): Promise<BillingInformationSelection & RelatedModels> {
    const select = this.select;

    const filters: Prisma.BillingInformationWhereUniqueInput = {
      id,
      user_id,
    };

    const billingInformation: BillingInformationSelection & RelatedModels =
      await this.billingInformationRepository.findOne(
        filters,
        undefined,
        select,
      );

    if (!billingInformation) {
      throw new NotFoundException(`Billing information not found.`);
    }

    return billingInformation;
  }

  /**
   * Update a billing information
   * @param request
   * @param param
   * @param dto
   * @returns
   */
  async update(
    request: AuthPayload & Request,
    param: { id: string },
    dto: UpdateBillingInformationDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { id } = param;
    const { country, selected } = dto;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check for the existing of the billing information
      const existing_billing_info = await this.findOne(id, auth.sub);

      let country_name: string;

      // Get country full name
      if (country) {
        country_name = getCountryName(country);

        // 1. Verify that country code is recognized
        if (!country_name) {
          throw new NotFoundException(`Country code '${country}' not found`);
        }
      }

      // 2. Deselect any already selected billing info if the selected field is true
      if (selected) {
        await prisma.billingInformation.updateMany({
          where: { user_id: auth.sub },
          data: { selected: false },
        });
      }

      // 3. Update billing information
      await prisma.billingInformation.update({
        where: { id: existing_billing_info.id },
        data: {
          ...dto,
          ...(country && { country_code: country }),
          ...(country_name && { country: country_name }),
        },
      });

      // 4. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_BILLING,
          entity: this.model,
          entity_id: existing_billing_info.id,
          metadata: `User with ID ${auth.sub} just updated their billing information of ID ${existing_billing_info.id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Billing information updated successfully.',
      };
    });
  }

  /**
   * Delete a billing information
   * @param request
   * @param param
   * @returns
   */
  async delete(
    request: AuthPayload & Request,
    param: { id: string },
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check for the existence of the billing information
      const existing_billing_info = await this.findOne(id, auth.sub);

      // Validate that there are no related models (Presently, nothing depends on this model)

      // 2. Update billing information
      await prisma.billingInformation.update({
        where: { id: existing_billing_info.id },
        data: {
          address: deletionRename(existing_billing_info.address),
          state: deletionRename(existing_billing_info.state),
          country: deletionRename(existing_billing_info.country),
          deleted_at: new Date(),
        },
      });

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_BILLING,
          entity: this.model,
          entity_id: existing_billing_info.id,
          metadata: `User with ID ${auth.sub} just deleted their billing information of ID ${existing_billing_info.id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Billing information deleted successfully.',
      };
    });
  }
}
