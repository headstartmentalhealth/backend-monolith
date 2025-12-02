import { Module } from '@nestjs/common';
import { NotificationTrackController } from './track.controller';
import { NotificationTrackService } from './track.service';

@Module({
  controllers: [NotificationTrackController],
  providers: [NotificationTrackService],
})
export class NotificationTrackModule {}
