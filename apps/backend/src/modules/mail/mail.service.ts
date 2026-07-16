import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Email yuborish Brevo (Sendinblue) transactional API orqali amalga oshiriladi.
 * Sabab: Render bepul tarifi tashqi SMTP portlarini (587/465) bloklaydi,
 * shuning uchun Gmail SMTP ishlamaydi. Brevo API esa HTTPS (443) orqali
 * ishlaydi va bloklanmaydi.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiUrl = 'https://api.brevo.com/v3/smtp/email';
  private readonly apiKey?: string;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('BREVO_API_KEY');
    this.senderEmail =
      this.config.get<string>('MAIL_FROM') ??
      this.config.get<string>('SMTP_FROM') ??
      'no-reply@example.com';
    this.senderName =
      this.config.get<string>('MAIL_FROM_NAME') ?? "O'quv Platformasi";
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.apiKey) {
      this.logger.error(
        'BREVO_API_KEY sozlanmagan — email yuborilmadi. Render Environment ga kalitni qo\'shing.',
      );
      return;
    }
    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { email: this.senderEmail, name: this.senderName },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        this.logger.error(
          `Email yuborishda xatolik (${to}): ${res.status} ${text}`,
        );
      }
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
