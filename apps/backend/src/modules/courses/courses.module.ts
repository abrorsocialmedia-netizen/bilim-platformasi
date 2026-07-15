import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { AdminCoursesController } from './admin-courses.controller';
import { StorageModule } from '../storage/storage.module';
import { EnrollmentModule } from '../enrollment/enrollment.module';

@Module({
  imports: [StorageModule, EnrollmentModule],
  providers: [CoursesService],
  controllers: [CoursesController, AdminCoursesController],
  exports: [CoursesService],
})
export class CoursesModule {}
