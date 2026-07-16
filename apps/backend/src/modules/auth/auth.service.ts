import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes, randomInt } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mail: MailService,
    private notifications: NotificationsService,
  ) {}

  private generateCode(): string {
    return String(randomInt(100000, 999999));
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException(
        "Bu email bilan foydalanuvchi allaqachon ro'yxatdan o'tgan",
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        // Email tasdiqlash vaqtincha o'chirilgan (o'z domenimiz bo'lmagani uchun).
        // Foydalanuvchi ro'yxatdan o'tishi bilan hisob darhol faollashadi.
        emailVerified: true,
      },
    });

    await this.prisma.userStats.create({ data: { userId: user.id } });

    // Admin yangi o'quvchi haqida xabardor bo'lsin
    await this.notifications.createForRole(
      'admin',
      'new_student',
      `${user.fullName} (${user.email}) ro'yxatdan o'tdi.`,
    );

    return {
      message: "Ro'yxatdan muvaffaqiyatli o'tdingiz. Endi kirishingiz mumkin.",
      userId: user.id,
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new BadRequestException('Foydalanuvchi topilmadi');
    if (user.emailVerified) return { message: 'Email allaqachon tasdiqlangan' };

    if (
      !user.emailVerificationCode ||
      user.emailVerificationCode !== dto.code ||
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt < new Date()
    ) {
      throw new BadRequestException("Kod noto'g'ri yoki muddati tugagan");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
      },
    });

    await this.notifications.createForRole(
      'admin',
      'new_student',
      `${user.fullName} (${user.email}) emailini tasdiqladi va ro'yxatdan o'tdi.`,
    );

    return { message: 'Email muvaffaqiyatli tasdiqlandi' };
  }

  private async issueTokens(
    user: { id: string; email: string; role: string },
    deviceId: string,
  ) {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role, deviceId },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN') as any,
      },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, deviceId },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') as any,
      },
    );
    return { accessToken, refreshToken };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Email yoki parol noto'g'ri");
    }
    if (!user.emailVerified) {
      throw new ForbiddenException('Avval emailingizni tasdiqlang');
    }
    if (user.status === 'blocked') {
      throw new ForbiddenException('Akkauntingiz bloklangan');
    }

    const maxDevices = this.config.get<number>('MAX_DEVICES_PER_USER') ?? 2;
    const activeDevices = await this.prisma.device.findMany({
      where: { userId: user.id, status: 'active' },
      orderBy: { lastActive: 'asc' },
    });

    if (activeDevices.length >= maxDevices) {
      throw new ForbiddenException({
        code: 'DEVICE_LIMIT_REACHED',
        message:
          'Qurilmalar limiti tugagan. Davom etish uchun eski qurilmalardan birini chiqaring.',
        devices: activeDevices.map((d) => ({
          id: d.id,
          deviceInfo: d.deviceInfo,
          lastActive: d.lastActive,
        })),
      });
    }

    const device = await this.prisma.device.create({
      data: {
        userId: user.id,
        deviceInfo: dto.deviceInfo ?? "Noma'lum qurilma",
      },
    });

    const tokens = await this.issueTokens(user, device.id);
    await this.prisma.device.update({
      where: { id: device.id },
      data: { refreshTokenHash: await bcrypt.hash(tokens.refreshToken, 10) },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async loginForce(dto: LoginDto & { revokeDeviceId: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Email yoki parol noto'g'ri");
    }
    const device = await this.prisma.device.findUnique({
      where: { id: dto.revokeDeviceId },
    });
    if (!device || device.userId !== user.id) {
      throw new ForbiddenException('Bu qurilma sizga tegishli emas');
    }
    await this.prisma.device.update({
      where: { id: dto.revokeDeviceId },
      data: { status: 'revoked', refreshTokenHash: null },
    });
    return this.login(dto);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; deviceId: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        "Refresh token noto'g'ri yoki muddati tugagan",
      );
    }

    const device = await this.prisma.device.findUnique({
      where: { id: payload.deviceId },
    });
    if (!device || device.status !== 'active' || !device.refreshTokenHash) {
      throw new UnauthorizedException('Sessiya topilmadi');
    }
    const matches = await bcrypt.compare(refreshToken, device.refreshTokenHash);
    if (!matches) {
      throw new UnauthorizedException('Sessiya haqiqiy emas');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || user.status === 'blocked') {
      throw new UnauthorizedException(
        'Foydalanuvchi topilmadi yoki bloklangan',
      );
    }

    const tokens = await this.issueTokens(user, device.id);
    await this.prisma.device.update({
      where: { id: device.id },
      data: {
        refreshTokenHash: await bcrypt.hash(tokens.refreshToken, 10),
        lastActive: new Date(),
      },
    });

    return tokens;
  }

  async logout(deviceId: string) {
    await this.prisma.device.updateMany({
      where: { id: deviceId },
      data: { status: 'revoked', refreshTokenHash: null },
    });
    return { message: 'Chiqildi' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return {
        message: "Agar email mavjud bo'lsa, tiklash havolasi yuborildi",
      };
    }
    const token = randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const resetLink = `${this.config.get<string>('FRONTEND_URL')}/reset-password?token=${token}`;
    await this.mail.sendPasswordReset(user.email, resetLink);
    return { message: "Agar email mavjud bo'lsa, tiklash havolasi yuborildi" };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });
    if (!user) {
      throw new BadRequestException("Havola noto'g'ri yoki muddati tugagan");
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(newPassword, 10),
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });
    return { message: "Parol muvaffaqiyatli o'zgartirildi" };
  }

  async listSessions(userId: string) {
    return this.prisma.device.findMany({
      where: { userId, status: 'active' },
      orderBy: { lastActive: 'desc' },
    });
  }

  async revokeSession(userId: string, deviceId: string) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });
    if (!device || device.userId !== userId) {
      throw new ForbiddenException('Bu qurilma sizga tegishli emas');
    }
    await this.prisma.device.update({
      where: { id: deviceId },
      data: { status: 'revoked', refreshTokenHash: null },
    });
    return { message: 'Qurilma chiqarildi' };
  }
}
