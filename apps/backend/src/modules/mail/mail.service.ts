import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  private async send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('SMTP_FROM'),
        to,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(
        `Email yuborishda xatolik (${to}): ${(error as Error).message}`,
      );
    }
  }

  async sendVerificationCode(to: string, code: string) {
    await this.send(
      to,
      'Emailni tasdiqlash kodi',
      `<p>Ro'yxatdan o'tishni yakunlash uchun tasdiqlash kodi: <b>${code}</b></p>
       <p>Kod 15 daqiqa amal qiladi.</p>`,
    );
  }

  async sendPasswordReset(to: string, resetLink: string) {
    await this.send(
      to,
      'Parolni tiklash',
      `<p>Parolni tiklash uchun havola: <a href="${resetLink}">${resetLink}</a></p>
       <p>Havola 1 soat amal qiladi. Agar so'rovni siz yubormagan bo'lsangiz, bu xatni e'tiborsiz qoldiring.</p>`,
    );
  }

  async sendEnrollmentApproved(to: string, courseTitle: string) {
    await this.send(
      to,
      'Kursga dostup ochildi',
      `<p>"${courseTitle}" kursiga dostupingiz tasdiqlandi. Endi platformaga kirib, o'rganishni boshlashingiz mumkin.</p>`,
    );
  }
}
