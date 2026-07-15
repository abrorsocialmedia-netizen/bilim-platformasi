import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreateCourseDto,
  CreateLessonDto,
  CreateMaterialDto,
  CreateModuleDto,
  RequestUploadUrlDto,
  UpdateCourseDto,
  UpdateLessonDto,
  UpdateModuleDto,
} from './dto/course.dto';

@Roles('admin')
@Controller('admin')
export class AdminCoursesController {
  constructor(private courses: CoursesService) {}

  @Get('courses')
  listAll() {
    return this.courses.listAllForAdmin();
  }

  @Get('courses/:id')
  detail(@Param('id') id: string) {
    return this.courses.getCourseDetail(id);
  }

  @Post('courses')
  createCourse(@Body() dto: CreateCourseDto) {
    return this.courses.createCourse(dto);
  }

  @Patch('courses/:id')
  updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.courses.updateCourse(id, dto);
  }

  @Delete('courses/:id')
  deleteCourse(@Param('id') id: string) {
    return this.courses.deleteCourse(id);
  }

  @Patch('courses/:id/publish')
  publish(@Param('id') id: string) {
    return this.courses.publishCourse(id, 'published');
  }

  @Patch('courses/:id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.courses.publishCourse(id, 'draft');
  }

  @Post('modules')
  createModule(@Body() dto: CreateModuleDto) {
    return this.courses.createModule(dto);
  }

  @Patch('modules/:id')
  updateModule(@Param('id') id: string, @Body() dto: UpdateModuleDto) {
    return this.courses.updateModule(id, dto);
  }

  @Delete('modules/:id')
  deleteModule(@Param('id') id: string) {
    return this.courses.deleteModule(id);
  }

  @Post('lessons')
  createLesson(@Body() dto: CreateLessonDto) {
    return this.courses.createLesson(dto);
  }

  @Patch('lessons/:id')
  updateLesson(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.courses.updateLesson(id, dto);
  }

  @Delete('lessons/:id')
  deleteLesson(@Param('id') id: string) {
    return this.courses.deleteLesson(id);
  }

  @Post('lessons/:id/upload-url')
  requestUploadUrl(
    @Param('id') _lessonId: string,
    @Body() dto: RequestUploadUrlDto,
  ) {
    return this.courses.requestUploadUrl(
      dto.folder,
      dto.filename,
      dto.contentType,
    );
  }

  @Post('materials')
  createMaterial(@Body() dto: CreateMaterialDto) {
    return this.courses.createMaterial(dto);
  }

  @Delete('materials/:id')
  deleteMaterial(@Param('id') id: string) {
    return this.courses.deleteMaterial(id);
  }
}
