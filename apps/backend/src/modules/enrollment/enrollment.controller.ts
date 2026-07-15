import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsInt, IsOptional, Min } from 'class-validator';
import { EnrollmentService } from './enrollment.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

class ExtendDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  days?: number;
}

@Controller()
export class EnrollmentController {
  constructor(private enrollment: EnrollmentService) {}

  @Post('courses/:id/enroll')
  enroll(@CurrentUser('sub') userId: string, @Param('id') courseId: string) {
    return this.enrollment.enroll(userId, courseId);
  }

  @Get('me/courses')
  myCourses(@CurrentUser('sub') userId: string) {
    return this.enrollment.myCourses(userId);
  }

  @Get('me/courses/:courseId/progress')
  courseProgress(
    @CurrentUser('sub') userId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.enrollment.getCourseProgress(userId, courseId);
  }
}

@Roles('admin')
@Controller('admin/students')
export class AdminEnrollmentController {
  constructor(private enrollment: EnrollmentService) {}

  @Get()
  list() {
    return this.enrollment.listForAdmin();
  }

  @Post(':id/approve')
  approve(@CurrentUser('sub') adminId: string, @Param('id') id: string) {
    return this.enrollment.approve(id, adminId);
  }

  @Post(':id/reject')
  reject(@CurrentUser('sub') adminId: string, @Param('id') id: string) {
    return this.enrollment.reject(id, adminId);
  }

  @Post(':id/block')
  block(@Param('id') id: string) {
    return this.enrollment.block(id);
  }

  @Post(':id/extend')
  extend(@Param('id') id: string, @Body() dto: ExtendDto) {
    return this.enrollment.extend(id, dto.days ?? 30);
  }
}
