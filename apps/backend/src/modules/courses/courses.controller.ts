import { Controller, ForbiddenException, Get, Param } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller()
export class CoursesController {
  constructor(
    private courses: CoursesService,
    private enrollment: EnrollmentService,
  ) {}

  @Public()
  @Get('courses')
  list() {
    return this.courses.listPublished();
  }

  @Public()
  @Get('courses/:id')
  detail(@Param('id') id: string) {
    return this.courses.getCourseDetail(id);
  }

  @Get('lessons/:id')
  async lesson(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    const lesson = await this.courses.getLessonWithAccess(id);
    const hasAccess = await this.enrollment.hasActiveAccess(
      userId,
      lesson.module.course.id,
    );
    if (!hasAccess) {
      throw new ForbiddenException(
        "Bu darsga dostupingiz yo'q yoki muddati tugagan",
      );
    }
    return lesson;
  }
}
