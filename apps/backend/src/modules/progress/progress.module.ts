import { Module } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { GamificationModule } from '../gamification/gamification.module';
import { CertificatesModule } from '../certificates/certificates.module';

@Module({
  imports: [GamificationModule, CertificatesModule],
  providers: [ProgressService],
  controllers: [ProgressController],
})
export class ProgressModule {}
