import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EnrollmentService } from '../enrollment/enrollment.service';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf | null = null;
  private ownerChatId: string | undefined;
  // vaqtinchalik ulash kodlari: code -> userId (10 daqiqa amal qiladi)
  private linkCodes = new Map<string, { userId: string; expiresAt: number }>();

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private notifications: NotificationsService,
    @Inject(forwardRef(() => EnrollmentService))
    private enrollmentService: EnrollmentService,
  ) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    this.ownerChatId = this.config.get<string>('TELEGRAM_OWNER_CHAT_ID');
    if (token) {
      this.bot = new Telegraf(token);
      this.registerHandlers();
    } else {
      this.logger.warn(
        "TELEGRAM_BOT_TOKEN sozlanmagan — bot o'chirilgan holatda ishlaydi.",
      );
    }
  }

  private registerHandlers() {
    if (!this.bot) return;

    this.bot.start(async (ctx) => {
      const payload = (ctx.message as any)?.text?.split(' ')[1];
      if (!payload) {
        await ctx.reply(
          "Assalomu alaykum! Akkauntingizni ulash uchun platformadagi profilingizdan 'Telegramni ulash' tugmasini bosing va olingan havolani oching.",
        );
        return;
      }
      const entry = this.linkCodes.get(payload);
      if (!entry || entry.expiresAt < Date.now()) {
        await ctx.reply(
          "Ulash kodi eskirgan yoki noto'g'ri. Iltimos, platformadan qaytadan urinib ko'ring.",
        );
        return;
      }
      await this.prisma.telegramLink.upsert({
        where: { userId: entry.userId },
        create: { userId: entry.userId, telegramChatId: String(ctx.chat.id) },
        update: { telegramChatId: String(ctx.chat.id) },
      });
      this.linkCodes.delete(payload);
      await ctx.reply(
        'Akkauntingiz muvaffaqiyatli ulandi. Endi bildirishnomalarni shu yerda olasiz.',
      );
    });

    this.bot.on('callback_query', async (ctx) => {
      const data = (ctx.callbackQuery as any)?.data as string | undefined;
      if (!data) return;
      const [action, enrollmentId] = data.split(':');
      if (!enrollmentId) return;

      try {
        if (action === 'approve') {
          await this.enrollmentService.approveByTelegram(enrollmentId);
          await ctx.editMessageText(
            `${(ctx.callbackQuery.message as any)?.text}\n\n✅ Tasdiqlandi`,
          );
        } else if (action === 'reject') {
          await this.enrollmentService.rejectByTelegram(enrollmentId);
          await ctx.editMessageText(
            `${(ctx.callbackQuery.message as any)?.text}\n\n❌ Rad etildi`,
          );
        }
        await ctx.answerCbQuery('Bajarildi');
      } catch (error) {
        this.logger.error(
          `Telegram callback xatosi: ${(error as Error).message}`,
        );
        await ctx.answerCbQuery('Xatolik yuz berdi');
      }
    });
  }

  getWebhookCallback(path: string) {
    return this.bot?.webhookCallback(path);
  }

  async handleUpdate(update: unknown) {
    if (!this.bot) return;
    await this.bot.handleUpdate(update as any);
  }

  createLinkCode(userId: string): string {
    const code = randomBytes(8).toString('hex');
    this.linkCodes.set(code, {
      userId,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    return code;
  }

  getBotUsername(): string | undefined {
    return this.config.get<string>('TELEGRAM_BOT_USERNAME');
  }

  async notifyOwnerNewStudent(params: {
    enrollmentId: string;
    fullName: string;
    email: string;
    phone?: string | null;
    courseTitle: string;
  }) {
    const text =
      `🆕 Yangi o'quvchi ro'yxatdan o'tdi\n\n` +
      `Ism: ${params.fullName}\n` +
      `Email: ${params.email}\n` +
      `Telefon: ${params.phone ?? '-'}\n` +
      `Kurs: ${params.courseTitle}`;

    if (this.bot && this.ownerChatId) {
      try {
        await this.bot.telegram.sendMessage(this.ownerChatId, text, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✅ Tasdiqlash',
                  callback_data: `approve:${params.enrollmentId}`,
                },
                {
                  text: '❌ Rad etish',
                  callback_data: `reject:${params.enrollmentId}`,
                },
              ],
            ],
          },
        });
      } catch (error) {
        this.logger.error(
          `Egasiga Telegram xabari yuborilmadi: ${(error as Error).message}`,
        );
      }
    }
  }

  async notifyUser(userId: string, text: string) {
    const link = await this.prisma.telegramLink.findUnique({
      where: { userId },
    });
    if (!link || !this.bot) return;
    try {
      await this.bot.telegram.sendMessage(link.telegramChatId, text);
    } catch (error) {
      this.logger.error(
        `Foydalanuvchiga Telegram xabari yuborilmadi: ${(error as Error).message}`,
      );
    }
  }
}
