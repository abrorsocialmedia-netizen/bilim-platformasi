import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const XP_RULES = {
  lesson_completed: 10,
  course_completed: 100,
};

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  async awardXp(userId: string, action: keyof typeof XP_RULES) {
    const points = XP_RULES[action];
    await this.prisma.xpEvent.create({ data: { userId, action, points } });
    await this.prisma.userStats.upsert({
      where: { userId },
      create: { userId, totalXp: points },
      update: { totalXp: { increment: points } },
    });
    await this.recalculateRanks();
  }

  async logActivity(userId: string, minutes: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.activityLog.upsert({
      where: { userId_date: { userId, date: today } },
      create: { userId, date: today, minutes },
      update: { minutes: { increment: minutes } },
    });

    await this.updateStreak(userId);
  }

  private async updateStreak(userId: string) {
    const stats = await this.prisma.userStats.findUnique({ where: { userId } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streakDays = 1;
    if (stats?.lastActiveDate) {
      const last = new Date(stats.lastActiveDate);
      last.setHours(0, 0, 0, 0);
      const diffDays = Math.round(
        (today.getTime() - last.getTime()) / 86400000,
      );
      if (diffDays === 0) {
        streakDays = stats.streakDays || 1;
      } else if (diffDays === 1) {
        streakDays = (stats.streakDays || 0) + 1;
      } else {
        streakDays = 1;
      }
    }

    await this.prisma.userStats.upsert({
      where: { userId },
      create: { userId, streakDays, lastActiveDate: today },
      update: { streakDays, lastActiveDate: today },
    });
  }

  private async recalculateRanks() {
    const all = await this.prisma.userStats.findMany({
      orderBy: { totalXp: 'desc' },
    });
    await this.prisma.$transaction(
      all.map((row, index) =>
        this.prisma.userStats.update({
          where: { userId: row.userId },
          data: { rank: index + 1 },
        }),
      ),
    );
  }

  async getStats(userId: string) {
    const stats = await this.prisma.userStats.findUnique({ where: { userId } });
    const heatmapFrom = new Date();
    heatmapFrom.setDate(heatmapFrom.getDate() - 60);
    const activity = await this.prisma.activityLog.findMany({
      where: { userId, date: { gte: heatmapFrom } },
      orderBy: { date: 'asc' },
    });
    const completedLessons = await this.prisma.lessonProgress.count({
      where: { completed: true, enrollment: { userId } },
    });
    const completedModulesData = await this.prisma.enrollment.count({
      where: { userId, status: 'active', progressPercent: 100 },
    });

    return {
      totalXp: stats?.totalXp ?? 0,
      rank: stats?.rank ?? null,
      streakDays: stats?.streakDays ?? 0,
      completedLessons,
      completedCourses: completedModulesData,
      heatmap: activity.map((a) => ({ date: a.date, minutes: a.minutes })),
    };
  }

  async getLeaderboard(limit = 20) {
    const top = await this.prisma.userStats.findMany({
      orderBy: { totalXp: 'desc' },
      take: limit,
      include: { user: { select: { fullName: true } } },
    });
    return top.map((row, index) => ({
      rank: index + 1,
      fullName: row.user.fullName,
      totalXp: row.totalXp,
      streakDays: row.streakDays,
    }));
  }
}
