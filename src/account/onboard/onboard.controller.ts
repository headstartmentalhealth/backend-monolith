import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  GenericPayloadAlias,
  PagePayload,
  Timezone,
} from '@/generic/generic.payload';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Request,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  FilterBusinessDto,
  FilterBusinessOwnerDto,
  SaveBusinessInfoDto,
  SuspendBusinessOwnerDto,
  UpsertWithdrawalAccountDto,
  ImportBusinessUsersDto,
  ExportBusinessUsersDto,
  AddCustomerDto,
  UpsertKycDto,
  ReviewKycDto,
  BusinessNameDto,
  UpdateBusinessProcessesDto,
} from './onboard.dto';
import { OnboardService } from './onboard.service';
import { Roles } from '../auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import { BusinessInformation, User } from '@prisma/client';
import { Public } from '../auth/decorators/auth.decorator';
import { BusinessDto, IdDto, UserDto } from '@/generic/generic.dto';
import { BusinessGuard } from '@/generic/guards/business.guard';

@Controller('v1/onboard')
export class OnboardController {
  constructor(private readonly onboardService: OnboardService) {}

  /**
   * Save business info
   * @param req
   * @param saveBusinessInfoDto
   * @returns
   */
  @Post('save-business-info')
  @Roles(Role.BUSINESS_SUPER_ADMIN)
  async saveBusinessInfo(
    @Request() req: AuthPayload & Request,
    @Body() saveBusinessInfoDto: SaveBusinessInfoDto,
  ): Promise<GenericPayload> {
    return this.onboardService.saveBusinessInformation(
      req,
      saveBusinessInfoDto,
    );
  }

  /**
   * Fetch businesses
   * @param req
   * @returns
   */
  @Get('fetch-businesses')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN, Role.USER)
  async fetchBusinesses(
    @Req() req: AuthPayload & Request,
  ): Promise<GenericDataPayload<BusinessInformation[]>> {
    return this.onboardService.fetchBusinesses(req);
  }

  /**
   * Find business
   * @param req
   * @returns
   */
  @Post('find-business')
  @Roles(Role.BUSINESS_SUPER_ADMIN)
  async findBusinessInformation(
    @Req() req: AuthPayload & Request,
    @Body() businessNameDto: BusinessNameDto,
  ): Promise<GenericPayloadAlias<BusinessInformation>> {
    return this.onboardService.findBusinessInformation(req, businessNameDto);
  }

  /**
   * Fetch business info by id
   * @param req
   * @param param
   * @returns
   */
  @Get('fetch-business-info/:id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN, Role.USER)
  async fetchBusinessInformation(
    @Req() req: AuthPayload & Request,
    @Param() param: { id: string },
  ): Promise<GenericPayloadAlias<BusinessInformation>> {
    return this.onboardService.fetchBusinessInformation(req, param);
  }

  /**
   * Save withdrawal account
   * @param req
   * @param upsertWithdrawalAccountDto
   * @returns
   */
  @Post('save-withdrawal-account')
  @Roles(Role.BUSINESS_SUPER_ADMIN)
  async saveWithdrawalAccount(
    @Req() req: AuthPayload & Request,
    @Body() upsertWithdrawalAccountDto: UpsertWithdrawalAccountDto,
  ): Promise<GenericPayload> {
    return this.onboardService.saveWithdrawalAccount(
      req,
      upsertWithdrawalAccountDto,
    );
  }

  /**
   * Fetch business information for public
   * @param req
   * @param param
   * @returns
   */
  @Get('view-business-info/:id')
  @Public()
  async viewBusinessInformationPublic(
    @Req() req: Timezone & Request,
    @Param() param: { id: string },
  ): Promise<GenericPayloadAlias<BusinessInformation>> {
    return this.onboardService.viewBusinessInformationPublic(req, param);
  }

  /**
   * Fetch businesses
   * @param req
   * @returns
   */
  @Get('fetch-all-businesses')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async fetchAllBusinesses(
    @Req() req: AuthPayload & Request,
    @Query() filterBusinessDto: FilterBusinessDto,
  ): Promise<PagePayload<BusinessInformation>> {
    return this.onboardService.fetchAllBusinesses(req, filterBusinessDto);
  }

  /**
   * Fetch business details
   * @param req
   * @returns
   */
  @Get('fetch-business-details/:id')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async fetchBusinessDetails(
    @Req() req: AuthPayload & Request,
    @Param() param: IdDto,
  ): Promise<GenericPayloadAlias<BusinessInformation>> {
    return this.onboardService.fetchBusinessDetails(req, param);
  }

  /**
   * Suspend business owner
   * @param req
   * @param param
   * @param suspendBusinessOwnerDto
   * @returns
   */
  @Post('suspend-business-owner/:user_id')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async suspendBusinessOwner(
    @Req() req: AuthPayload & Request,
    @Param() param: UserDto,
    @Body() suspendBusinessOwnerDto: SuspendBusinessOwnerDto,
  ): Promise<GenericPayload> {
    return this.onboardService.suspendBusinessOwner(
      req,
      param,
      suspendBusinessOwnerDto,
    );
  }

  /**
   * Unsuspend business owner
   * @param req
   * @param param
   * @returns
   */
  @Put('unsuspend-business-owner/:user_id')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async unsuspendBusinessOwner(
    @Req() req: AuthPayload & Request,
    @Param() param: UserDto,
  ): Promise<GenericPayload> {
    return this.onboardService.unsuspendBusinessOwner(req, param);
  }

  /**
   * Fetch business owners
   * @param req
   * @returns
   */
  @Get('fetch-business-owners')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async fetchAllBusinesOwners(
    @Req() req: AuthPayload & Request,
    @Query() filterBusinessOwnerDto: FilterBusinessOwnerDto,
  ): Promise<PagePayload<User>> {
    return this.onboardService.fetchBusinessOwners(req, filterBusinessOwnerDto);
  }

  /**
   * Delete a business account
   * Forbid if business already has a purchase
   */
  @Delete('delete-business/:id')
  @Roles(Role.BUSINESS_SUPER_ADMIN)
  async deleteBusiness(
    @Req() req: AuthPayload & Request,
    @Param() param: { id: string },
  ): Promise<GenericPayload> {
    return this.onboardService.deleteBusiness(req, param);
  }

  /**
   * Import users to a business
   */
  @Post('import-users')
  @Roles(Role.BUSINESS_SUPER_ADMIN)
  @UseGuards(BusinessGuard)
  async importBusinessUsers(
    @Req() req: AuthPayload & Request,
    @Body() importDto: ImportBusinessUsersDto,
  ): Promise<GenericPayload> {
    return this.onboardService.importBusinessUsers(req, importDto);
  }

  /**
   * Export users of a business
   */
  @Get('export-users')
  @Roles(Role.BUSINESS_SUPER_ADMIN)
  @UseGuards(BusinessGuard)
  async exportBusinessUsers(
    @Req() req: AuthPayload & Request,
    @Query() query: ExportBusinessUsersDto,
  ): Promise<any> {
    return this.onboardService.exportBusinessUsers(req, query);
  }

  /**
   * Add a new customer to a business contact - public endpoint
   * @param req
   * @param addCustomerDto
   * @returns
   */
  @Post('add-customer')
  @Public()
  async addCustomer(
    @Req() req: Request,
    @Body() addCustomerDto: AddCustomerDto,
  ): Promise<GenericPayload> {
    return this.onboardService.addCustomer(req, addCustomerDto);
  }

  /**
   * Upsert KYC for the current user's business
   * @param req
   * @param dto
   */
  @Post('kyc')
  @UseGuards(BusinessGuard)
  async upsertKyc(
    @Req() req: AuthPayload & Request,
    @Body() dto: UpsertKycDto,
  ): Promise<GenericPayload> {
    return this.onboardService.upsertKyc(req, dto);
  }

  /**
   * Fetch KYC for the current user's business
   * @param req
   */
  @Get('kyc')
  async fetchKyc(
    @Req() req: AuthPayload & Request,
  ): Promise<GenericDataPayload<any>> {
    return this.onboardService.fetchKyc(req);
  }

  /**
   * Fetch KYC for the current user's business
   * @param req
   */
  @Get('kyc/:business_id')
  async fetchSubmittedKyc(
    @Req() req: AuthPayload & Request,
    @Param() paramDto: BusinessDto,
  ): Promise<GenericDataPayload<any>> {
    return this.onboardService.fetchSubmittedKyc(req, paramDto);
  }

  @Patch('review-kyc/:kyc_id')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async reviewKyc(
    @Req() req: AuthPayload & Request,
    @Param('kyc_id') kyc_id: string,
    @Body() dto: ReviewKycDto,
  ): Promise<GenericPayload> {
    return this.onboardService.reviewKyc(req, kyc_id, dto);
  }

  @UseGuards(BusinessGuard)
  @Patch('update-onboarding-process')
  @Roles(Role.BUSINESS_SUPER_ADMIN)
  async updateOnboardingProcess(
    @Req() req: AuthPayload & Request,
    @Body() dto: UpdateBusinessProcessesDto,
  ): Promise<GenericPayload> {
    return this.onboardService.updateOnboardingProcess(req, dto);
  }
}
