import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('telegram')
export class TelegramController {
  constructor(
    private telegram: TelegramService,
    private config: ConfigService,
  ) {}

  @Public()
  @Post('webhook')
  async webhook(
    @Body() body: unknown,
    @Headers('x-telegram-bot-api-secret-token') secret?: string,
  ) {
    const expected = this.config.get<string>('TELEGRAM_WEBHOOK_SECRET');
    if (expected && secret !== expected) {
      throw new UnauthorizedException("Noto'g'ri webhook maxfiy kaliti");
    }
    await this.telegram.handleUpdate(body);
    return { ok: true };
  }

  @Post('link')
  async link(@CurrentUser('sub') userId: string) {
    const code = this.telegram.createLinkCode(userId);
    const username = this.telegram.getBotUsername();
    const deepLink = username ? `https://t.me/${username}?start=${code}` : null;
    return { code, deepLink };
  }
}
