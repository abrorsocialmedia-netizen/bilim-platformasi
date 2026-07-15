import { Module, forwardRef } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { EnrollmentModule } from '../enrollment/enrollment.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    NotificationsModule,
    MailModule,
    forwardRef(() => EnrollmentModule),
  ],
  providers: [TelegramService],
  controllers: [TelegramController],
  exports: [TelegramService],
})
export class TelegramModule {}
