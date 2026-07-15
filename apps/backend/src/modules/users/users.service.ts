import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        telegramLink: { select: { linkedAt: true } },
      },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return { ...user, telegramLinked: Boolean(user.telegramLink) };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
      },
    });
  }
}
