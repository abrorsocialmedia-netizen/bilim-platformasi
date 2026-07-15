import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { CertificatesService } from '../certificates/certificates.service';

@Injectable()
export class ProgressService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
    private certificates: CertificatesService,
  ) {}

  async completeLesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: { include: { modules: { include: { lessons: true } } } },
          },
        },
      },
    });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

    const courseId = lesson.module.course.id;
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment || enrollment.status !== 'active') {
      throw new ForbiddenException("Bu kursga faol dostupingiz yo'q");
    }
    if (enrollment.expiresAt && enrollment.expiresAt < new Date()) {
      throw new ForbiddenException('Dostup muddati tugagan');
    }

    const existingProgress = await this.prisma.lessonProgress.findUnique({
      where: {
        enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId },
      },
    });
    const alreadyCompleted = existingProgress?.completed ?? false;

    await this.prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId },
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId,
        completed: true,
        completedAt: new Date(),
      },
      update: { completed: true, completedAt: new Date() },
    });

    const totalLessons = lesson.module.course.modules.reduce(
      (sum, m) => sum + m.lessons.length,
      0,
    );
    const completedCount = await this.prisma.lessonProgress.count({
      where: { enrollmentId: enrollment.id, completed: true },
    });
    const progressPercent =
      totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { progressPercent },
    });

    if (!alreadyCompleted) {
      await this.gamification.awardXp(userId, 'lesson_completed');
      const minutes = lesson.durationSec
        ? Math.round(lesson.durationSec / 60)
        : 5;
      await this.gamification.logActivity(userId, minutes);
    }

    let certificate = null;
    if (progressPercent >= 100) {
      if (!alreadyCompleted) {
        await this.gamification.awardXp(userId, 'course_completed');
      }
      certificate = await this.certificates.issueIfEligible(userId, courseId);
    }

    return { progressPercent, certificateIssued: Boolean(certificate) };
  }
}
