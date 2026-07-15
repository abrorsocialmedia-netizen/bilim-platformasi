import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class QaService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async askQuestion(userId: string, lessonId: string, text: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

    const question = await this.prisma.question.create({
      data: { lessonId, userId, text, target: 'teacher' },
    });

    await this.notifications.createForRole(
      'teacher',
      'new_question',
      `Yangi savol keldi: "${text.slice(0, 80)}"`,
    );
    await this.notifications.createForRole(
      'admin',
      'new_question',
      `Yangi savol keldi: "${text.slice(0, 80)}"`,
    );

    return question;
  }

  async listForLesson(lessonId: string) {
    return this.prisma.question.findMany({
      where: { lessonId },
      include: {
        user: { select: { fullName: true } },
        answers: { include: { author: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async answer(teacherId: string, questionId: string, text: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question) throw new NotFoundException('Savol topilmadi');

    const answer = await this.prisma.answer.create({
      data: { questionId, text, authorType: 'teacher', authorId: teacherId },
    });

    await this.notifications.create(
      question.userId,
      'question_answered',
      'Savolingizga javob keldi.',
    );

    return answer;
  }

  async myQuestions(userId: string) {
    return this.prisma.question.findMany({
      where: { userId },
      include: { answers: true, lesson: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
