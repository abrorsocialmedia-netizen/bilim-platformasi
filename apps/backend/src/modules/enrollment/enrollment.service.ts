import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private notifications: NotificationsService,
    private mail: MailService,
    @Inject(forwardRef(() => TelegramService))
    private telegram: TelegramService,
  ) {}

  async enroll(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course || course.status !== 'published') {
      throw new NotFoundException('Kurs topilmadi');
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing && ['pending', 'active'].includes(existing.status)) {
      throw new BadRequestException('Siz bu kursga allaqachon yozilgansiz');
    }

    const enrollment = existing
      ? await this.prisma.enrollment.update({
          where: { id: existing.id },
          data: { status: 'pending', approvedById: null, approvedAt: null },
        })
      : await this.prisma.enrollment.create({
          data: { userId, courseId, status: 'pending' },
        });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    await this.notifications.createForRole(
      'admin',
      'new_student',
      `${user?.fullName} "${course.title}" kursiga yozildi. Tasdiqlash kutilmoqda.`,
    );
    await this.telegram.notifyOwnerNewStudent({
      enrollmentId: enrollment.id,
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      phone: user?.phone,
      courseTitle: course.title,
    });

    return enrollment;
  }

  async myCourses(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: { course: true },
      orderBy: { createdAt: 'desc' },
    });
    return enrollments.map((e) => ({
      enrollmentId: e.id,
      status: e.status,
      progressPercent: e.progressPercent,
      startDate: e.startDate,
      expiresAt: e.expiresAt,
      daysLeft: e.expiresAt
        ? Math.max(
            0,
            Math.ceil((e.expiresAt.getTime() - Date.now()) / 86400000),
          )
        : null,
      course: {
        id: e.course.id,
        title: e.course.title,
        coverUrl: e.course.coverUrl,
        isCertified: e.course.isCertified,
      },
    }));
  }

  async getCourseProgress(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: {
        lessonProgress: {
          where: { completed: true },
          select: { lessonId: true },
        },
      },
    });
    if (!enrollment) {
      return {
        status: null,
        progressPercent: 0,
        completedLessonIds: [] as string[],
      };
    }
    return {
      status: enrollment.status,
      progressPercent: enrollment.progressPercent,
      completedLessonIds: enrollment.lessonProgress.map((p) => p.lessonId),
    };
  }

  async hasActiveAccess(userId: string, courseId: string): Promise<boolean> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment || enrollment.status !== 'active') return false;
    if (enrollment.expiresAt && enrollment.expiresAt < new Date()) return false;
    return true;
  }

  async getEnrollmentOrThrow(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: { user: true, course: true },
    });
    if (!enrollment) throw new NotFoundException('Yozilish topilmadi');
    return enrollment;
  }

  async approve(enrollmentId: string, approverId?: string) {
    const enrollment = await this.getEnrollmentOrThrow(enrollmentId);
    const durationDays =
      enrollment.course.durationDays ??
      this.config.get<number>('DEFAULT_ENROLLMENT_DURATION_DAYS') ??
      120;
    const startDate = new Date();
    const expiresAt = new Date(startDate.getTime() + durationDays * 86400000);

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'active',
        startDate,
        expiresAt,
        approvedById: approverId,
        approvedAt: new Date(),
      },
    });

    await this.prisma.user.update({
      where: { id: enrollment.userId },
      data: { status: 'approved' },
    });

    await this.notifications.create(
      enrollment.userId,
      'access_granted',
      `"${enrollment.course.title}" kursiga dostupingiz ochildi! Muddat: ${durationDays} kun.`,
    );
    await this.mail.sendEnrollmentApproved(
      enrollment.user.email,
      enrollment.course.title,
    );
    await this.telegram.notifyUser(
      enrollment.userId,
      `✅ "${enrollment.course.title}" kursiga dostupingiz ochildi! Muddat: ${durationDays} kun.`,
    );

    return updated;
  }

  async reject(enrollmentId: string, approverId?: string) {
    const enrollment = await this.getEnrollmentOrThrow(enrollmentId);
    const updated = await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'rejected',
        approvedById: approverId,
        approvedAt: new Date(),
      },
    });
    await this.notifications.create(
      enrollment.userId,
      'access_rejected',
      `"${enrollment.course.title}" kursiga yozilishingiz rad etildi.`,
    );
    await this.telegram.notifyUser(
      enrollment.userId,
      `❌ "${enrollment.course.title}" kursiga yozilishingiz rad etildi.`,
    );
    return updated;
  }

  approveByTelegram(enrollmentId: string) {
    return this.approve(enrollmentId);
  }

  rejectByTelegram(enrollmentId: string) {
    return this.reject(enrollmentId);
  }

  async block(enrollmentId: string) {
    await this.getEnrollmentOrThrow(enrollmentId);
    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'blocked' },
    });
  }

  async extend(enrollmentId: string, additionalDays: number) {
    const enrollment = await this.getEnrollmentOrThrow(enrollmentId);
    const base =
      enrollment.expiresAt && enrollment.expiresAt > new Date()
        ? enrollment.expiresAt
        : new Date();
    const newExpiresAt = new Date(base.getTime() + additionalDays * 86400000);
    const updated = await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { expiresAt: newExpiresAt, status: 'active' },
    });
    await this.notifications.create(
      enrollment.userId,
      'access_granted',
      `"${enrollment.course.title}" kursidagi dostup muddatingiz uzaytirildi.`,
    );
    return updated;
  }

  async listForAdmin(status?: string) {
    return this.prisma.enrollment.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Har kuni: muddati tugagan yozilishlarni bloklaydi va ogohlantirish yuboradi. */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async runDailyExpiryCheck() {
    const now = new Date();

    const expired = await this.prisma.enrollment.findMany({
      where: { status: 'active', expiresAt: { lt: now } },
      include: { course: true },
    });
    for (const e of expired) {
      await this.prisma.enrollment.update({
        where: { id: e.id },
        data: { status: 'expired' },
      });
      await this.notifications.create(
        e.userId,
        'access_expired',
        `"${e.course.title}" kursidagi dostup muddati tugadi.`,
      );
      await this.telegram.notifyUser(
        e.userId,
        `⛔ "${e.course.title}" kursidagi dostup muddati tugadi.`,
      );
    }
    if (expired.length) {
      this.logger.log(
        `${expired.length} ta yozilish muddati tugagani sababli bloklandi`,
      );
    }

    const soon = new Date(now.getTime() + 7 * 86400000);
    const expiringSoon = await this.prisma.enrollment.findMany({
      where: { status: 'active', expiresAt: { gte: now, lte: soon } },
      include: { course: true },
    });
    for (const e of expiringSoon) {
      await this.notifications.create(
        e.userId,
        'access_expiring',
        `"${e.course.title}" kursidagi dostup muddati tez orada tugaydi.`,
      );
      await this.telegram.notifyUser(
        e.userId,
        `⏰ "${e.course.title}" kursidagi dostup muddati tez orada tugaydi.`,
      );
    }
  }
}
