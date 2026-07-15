import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type NotificationType =
  | 'access_granted'
  | 'access_rejected'
  | 'lesson_reminder'
  | 'new_content'
  | 'access_expiring'
  | 'access_expired'
  | 'question_answered'
  | 'new_question'
  | 'new_student';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, type: NotificationType, text: string) {
    return this.prisma.notification.create({
      data: { userId, type, text },
    });
  }

  async createForRole(
    role: 'admin' | 'teacher',
    type: NotificationType,
    text: string,
  ) {
    const users = await this.prisma.user.findMany({
      where: { role },
      select: { id: true },
    });
    if (users.length === 0) return;
    await this.prisma.notification.createMany({
      data: users.map((u) => ({ userId: u.id, type, text })),
    });
  }

  async listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
