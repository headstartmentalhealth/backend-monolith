import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogPostService } from './blog-post.service';
import { FilterBlogPostDto } from './blog-post.dto';
import { IdDto } from '@/generic/generic.dto';
import { Public } from '@/account/auth/decorators/auth.decorator';

@Controller('v1/public/blog-posts')
export class PublicBlogPostController {
  constructor(private readonly blogPostService: BlogPostService) {}

  @Get()
  @Public()
  async fetch(@Query() filterDto: FilterBlogPostDto) {
    return this.blogPostService.fetchPublic(filterDto);
  }

  @Get(':id')
  @Public()
  async fetchSingle(@Param() param: IdDto) {
    return this.blogPostService.fetchSinglePublic(param);
  }
}
