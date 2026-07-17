import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { EnrollmentService } from '../enrollment/enrollment.service';

@Injectable()
export class VideoService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private enrollment: EnrollmentService,
    private config: ConfigService,
  ) {}

  async createVideoToken(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });
    if (!lesson) throw new NotFoundException('Dars topilmadi');
    if (!lesson.videoRef)
      throw new NotFoundException('Bu darsda video mavjud emas');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role === 'student') {
      const hasAccess = await this.enrollment.hasActiveAccess(
        userId,
        lesson.module.course.id,
      );
      if (!hasAccess) {
        throw new ForbiddenException(
          "Bu darsga dostupingiz yo'q yoki muddati tugagan",
        );
      }
    }

    const ttl = this.config.get<number>('VIDEO_TOKEN_TTL_SECONDS') ?? 600;
    const url = await this.storage.createReadUrl(lesson.videoRef, ttl);

    // Watermarkda faqat platforma nomi ko'rsatiladi (keyinchalik domenga almashtiriladi)
    const config = await this.prisma.instanceConfig.findUnique({
      where: { id: 1 },
    });
    const brand = config?.brandName ?? "O'quv Platformasi";

    return {
      url,
      expiresIn: ttl,
      watermark: {
        text: brand,
      },
    };
  }
}
