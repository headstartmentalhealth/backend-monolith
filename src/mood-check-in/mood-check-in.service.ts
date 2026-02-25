import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Mood } from '@prisma/client';

@Injectable()
export class MoodCheckInService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, mood: Mood) {
    return this.prisma.moodCheckIn.create({
      data: {
        user_id: userId,
        mood: mood,
      },
    });
  }

  async getLatest(userId: string) {
    return this.prisma.moodCheckIn.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async getHistory(userId: string) {
    return this.prisma.moodCheckIn.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 20,
    });
  }
}
