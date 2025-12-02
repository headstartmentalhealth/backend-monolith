import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { WithdrawService } from './withdraw.service';
import {
  CreateWithdrawalDto,
  FinalizeWithdrawalDto,
  InitiateWithdrawalDto,
  QueryWithdrawRequestsDto,
  UpdateWithdrawalDto,
  VerifyWithdrawalDto,
} from './withdraw.dto';
import { AuthPayload } from '@/generic/generic.payload';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import { BusinessGuard } from '@/generic/guards/business.guard';

@Controller('v1/withdraw')
export class WithdrawController {
  constructor(private readonly service: WithdrawService) {}

  @Post('request')
  @UseGuards(BusinessGuard)
  @Roles(Role.BUSINESS_SUPER_ADMIN)
  create(@Body() dto: CreateWithdrawalDto, @Req() req: AuthPayload & Request) {
    return this.service.create(req, dto);
  }

  @Get('fetch')
  findMyRequests(
    @Req() req: AuthPayload & Request,
    @Query() filterWithdrawRequestDto: QueryWithdrawRequestsDto,
  ) {
    return this.service.findMyRequests(req, filterWithdrawRequestDto);
  }

  @Get('fetch-all')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  findAll(
    @Req() req: AuthPayload & Request,
    @Query() filterWithdrawRequestDto: QueryWithdrawRequestsDto,
  ) {
    return this.service.findAllRequests(req, filterWithdrawRequestDto);
  }

  @Get(':id')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  findOne(@Req() req: AuthPayload & Request, @Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('details/:id')
  findDetails(@Req() req: AuthPayload & Request, @Param('id') id: string) {
    return this.service.findDetails(id, req);
  }

  @Post('initiate')
  @Roles(Role.OWNER_SUPER_ADMIN)
  initiateTransfer(
    @Req() req: AuthPayload & Request,
    @Body() dto: InitiateWithdrawalDto,
  ) {
    return this.service.initiateWithdrawal(req.user.sub, dto);
  }

  @Post('finalize-transfer')
  @Roles(Role.OWNER_SUPER_ADMIN)
  finalizeTransfer(
    @Req() req: AuthPayload & Request,
    @Body() dto: FinalizeWithdrawalDto,
  ) {
    return this.service.finalizeTransferRequest(req.user.sub, dto);
  }

  @Post('verify-transfer')
  @Roles(Role.OWNER_SUPER_ADMIN)
  verifyTransfer(
    @Req() req: AuthPayload & Request,
    @Body() dto: VerifyWithdrawalDto,
  ) {
    return this.service.verifyAndMark(req, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWithdrawalDto) {
    return this.service.updateStatus(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
