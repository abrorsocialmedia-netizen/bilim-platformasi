import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { CoursesModule } from './modules/courses/courses.module';
import { EnrollmentModule } from './modules/enrollment/enrollment.module';
import { VideoModule } from './modules/video/video.module';
import { ProgressModule } from './modules/progress/progress.module';
import { QaModule } from './modules/qa/qa.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { AdminModule } from './modules/admin/admin.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    NotificationsModule,
    TelegramModule,
    CoursesModule,
    EnrollmentModule,
    VideoModule,
    ProgressModule,
    QaModule,
    GamificationModule,
    CertificatesModule,
    AdminModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
