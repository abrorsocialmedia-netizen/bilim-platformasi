import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateConfigDto } from './dto/update-config.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getConfig() {
    const config = await this.prisma.instanceConfig.findUnique({
      where: { id: 1 },
    });
    if (config) return config;
    return this.prisma.instanceConfig.create({ data: { id: 1 } });
  }

  async updateConfig(dto: UpdateConfigDto) {
    await this.getConfig();
    return this.prisma.instanceConfig.update({ where: { id: 1 }, data: dto });
  }

  async getAnalytics() {
    const [
      totalStudents,
      activeEnrollments,
      pendingEnrollments,
      publishedCourses,
      certificatesIssued,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'student' } }),
      this.prisma.enrollment.count({ where: { status: 'active' } }),
      this.prisma.enrollment.count({ where: { status: 'pending' } }),
      this.prisma.course.count({ where: { status: 'published' } }),
      this.prisma.certificate.count(),
    ]);

    const completionByCourse = await this.prisma.enrollment.groupBy({
      by: ['courseId'],
      where: { status: 'active' },
      _avg: { progressPercent: true },
      _count: { _all: true },
    });

    const courses = await this.prisma.course.findMany({
      where: { id: { in: completionByCourse.map((c) => c.courseId) } },
      select: { id: true, title: true },
    });
    const courseTitleMap = new Map(courses.map((c) => [c.id, c.title]));

    return {
      totalStudents,
      activeEnrollments,
      pendingEnrollments,
      publishedCourses,
      certificatesIssued,
      courseCompletion: completionByCourse.map((c) => ({
        courseId: c.courseId,
        courseTitle: courseTitleMap.get(c.courseId) ?? '',
        studentsCount: c._count._all,
        averageProgress: Math.round(c._avg.progressPercent ?? 0),
      })),
    };
  }
}
