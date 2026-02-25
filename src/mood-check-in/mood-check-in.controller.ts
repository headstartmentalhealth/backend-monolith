import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { MoodCheckInService } from './mood-check-in.service';
import { CreateMoodCheckInDto } from './mood-check-in.dto';
import { AuthPayload } from '../generic/generic.payload';
import { Public } from '../account/auth/decorators/auth.decorator';

@Controller('moods')
export class MoodCheckInController {
  constructor(private readonly moodCheckInService: MoodCheckInService) {}

  @Public()
  @Post()
  async create(@Req() req: AuthPayload, @Body() dto: CreateMoodCheckInDto) {
    const userId = req.user?.sub || 'c4a0a16d-4679-47ad-8862-24b77466c131';
    return this.moodCheckInService.create(userId, dto.mood);
  }

  @Public()
  @Get('latest')
  async getLatest(@Req() req: AuthPayload) {
    const userId = req.user?.sub || 'c4a0a16d-4679-47ad-8862-24b77466c131';
    return this.moodCheckInService.getLatest(userId);
  }

  @Public()
  @Get('history')
  async getHistory(@Req() req: AuthPayload) {
    const userId = req.user?.sub || 'c4a0a16d-4679-47ad-8862-24b77466c131';
    return this.moodCheckInService.getHistory(userId);
  }
}
