import { Module } from '@nestjs/common';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { StorageModule } from '../storage/storage.module';
import { EnrollmentModule } from '../enrollment/enrollment.module';

@Module({
  imports: [StorageModule, EnrollmentModule],
  providers: [VideoService],
  controllers: [VideoController],
})
export class VideoModule {}
