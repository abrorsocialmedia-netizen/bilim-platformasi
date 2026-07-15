import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  CreateCourseDto,
  CreateLessonDto,
  CreateMaterialDto,
  CreateModuleDto,
  UpdateCourseDto,
  UpdateLessonDto,
  UpdateModuleDto,
} from './dto/course.dto';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  // ---------- Katalog (o'quvchi) ----------

  async listPublished() {
    const courses = await this.prisma.course.findMany({
      where: { status: 'published' },
      include: {
        teacher: { select: { id: true, fullName: true } },
        modules: { select: { id: true, lessons: { select: { id: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return courses.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      coverUrl: c.coverUrl,
      price: c.price,
      isFree: c.isFree,
      durationDays: c.durationDays,
      isCertified: c.isCertified,
      teacher: c.teacher,
      modulesCount: c.modules.length,
      lessonsCount: c.modules.reduce((sum, m) => sum + m.lessons.length, 0),
    }));
  }

  async getCourseDetail(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        teacher: { select: { id: true, fullName: true } },
        modules: {
          orderBy: { order: 'asc' },
          include: { lessons: { orderBy: { order: 'asc' } } },
        },
      },
    });
    if (!course) throw new NotFoundException('Kurs topilmadi');
    return course;
  }

  async getLessonWithAccess(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } }, materials: true },
    });
    if (!lesson) throw new NotFoundException('Dars topilmadi');
    return lesson;
  }

  // ---------- Admin CRUD ----------

  async listAllForAdmin() {
    const courses = await this.prisma.course.findMany({
      include: {
        modules: { select: { id: true, lessons: { select: { id: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return courses.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      coverUrl: c.coverUrl,
      price: c.price,
      isFree: c.isFree,
      durationDays: c.durationDays,
      isCertified: c.isCertified,
      status: c.status,
      lessonsCount: c.modules.reduce((sum, m) => sum + m.lessons.length, 0),
    }));
  }

  createCourse(dto: CreateCourseDto) {
    return this.prisma.course.create({ data: dto });
  }

  async updateCourse(id: string, dto: UpdateCourseDto) {
    await this.ensureCourseExists(id);
    return this.prisma.course.update({ where: { id }, data: dto });
  }

  async deleteCourse(id: string) {
    await this.ensureCourseExists(id);
    await this.prisma.course.delete({ where: { id } });
    return { message: "Kurs o'chirildi" };
  }

  async publishCourse(id: string, status: 'draft' | 'published') {
    await this.ensureCourseExists(id);
    return this.prisma.course.update({ where: { id }, data: { status } });
  }

  private async ensureCourseExists(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Kurs topilmadi');
  }

  createModule(dto: CreateModuleDto) {
    return this.prisma.module.create({ data: dto });
  }

  async updateModule(id: string, dto: UpdateModuleDto) {
    const module = await this.prisma.module.findUnique({ where: { id } });
    if (!module) throw new NotFoundException('Modul topilmadi');
    return this.prisma.module.update({ where: { id }, data: dto });
  }

  async deleteModule(id: string) {
    const module = await this.prisma.module.findUnique({ where: { id } });
    if (!module) throw new NotFoundException('Modul topilmadi');
    await this.prisma.module.delete({ where: { id } });
    return { message: "Modul o'chirildi" };
  }

  createLesson(dto: CreateLessonDto) {
    return this.prisma.lesson.create({ data: dto });
  }

  async updateLesson(id: string, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');
    return this.prisma.lesson.update({ where: { id }, data: dto });
  }

  async deleteLesson(id: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');
    await this.prisma.lesson.delete({ where: { id } });
    return { message: "Dars o'chirildi" };
  }

  createMaterial(dto: CreateMaterialDto) {
    return this.prisma.lessonMaterial.create({ data: dto });
  }

  async deleteMaterial(id: string) {
    const material = await this.prisma.lessonMaterial.findUnique({
      where: { id },
    });
    if (!material) throw new NotFoundException('Material topilmadi');
    await this.prisma.lessonMaterial.delete({ where: { id } });
    return { message: "Material o'chirildi" };
  }

  requestUploadUrl(
    folder: 'videos' | 'materials' | 'certificates',
    filename: string,
    contentType: string,
  ) {
    return this.storage.createUploadUrl(folder, filename, contentType);
  }
}
