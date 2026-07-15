import { Module } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { StorageModule } from '../storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [StorageModule, NotificationsModule],
  providers: [CertificatesService],
  controllers: [CertificatesController],
  exports: [CertificatesService],
})
export class CertificatesModule {}
