import { Module, forwardRef } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import {
  AdminEnrollmentController,
  EnrollmentController,
} from './enrollment.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [NotificationsModule, MailModule, forwardRef(() => TelegramModule)],
  providers: [EnrollmentService],
  controllers: [EnrollmentController, AdminEnrollmentController],
  exports: [EnrollmentService],
})
export class EnrollmentModule {}
