import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BlogPostService } from './blog-post.service';
import {
  CreateBlogPostDto,
  FilterBlogPostDto,
  UpdateBlogPostDto,
} from './blog-post.dto';
import { AuthPayload } from '@/generic/generic.payload';
import { IdDto } from '@/generic/generic.dto';
import { AuthGuard } from '@/account/auth/guards/auth.guard';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';

@Controller('v1/blog-posts')
@UseGuards(AuthGuard)
export class BlogPostController {
  constructor(private readonly blogPostService: BlogPostService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async create(
    @Req() request: AuthPayload & Request,
    @Body() dto: CreateBlogPostDto,
  ) {
    return this.blogPostService.create(request, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async fetch(
    @Req() request: AuthPayload,
    @Query() filterDto: FilterBlogPostDto,
  ) {
    return this.blogPostService.fetch(request, filterDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async fetchSingle(
    @Req() request: AuthPayload,
    @Param() param: IdDto,
  ) {
    return this.blogPostService.fetchSingle(request, param);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async update(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
    @Body() dto: UpdateBlogPostDto,
  ) {
    return this.blogPostService.update(request, param, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async delete(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
  ) {
    return this.blogPostService.delete(request, param);
  }
}
