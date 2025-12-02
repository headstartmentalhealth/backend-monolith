import {
  Controller,
  Get,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { LogService } from './log.service';
import { QueryDto } from '../generic/generic.dto';
import { Public } from '@/account/auth/decorators/auth.decorator';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import { FilterLogDto } from './log.dto';
import { AuthPayload } from '@/generic/generic.payload';

@Controller('v1/log')
export class LogController {
  constructor(private readonly logService: LogService) {}

  /**
   * Fetch logs (with filters)
   * @param query
   * @returns
   */
  @Get('fetch')
  @Roles(Role.OWNER_ADMIN, Role.OWNER_SUPER_ADMIN)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async fetch(
    @Req() request: AuthPayload & Request,
    @Query() filterLogDto: FilterLogDto,
  ) {
    return this.logService.fetch(request, filterLogDto);
  }
}
