import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { QaService } from './qa.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

class AskQuestionDto {
  @IsString()
  @MinLength(3)
  text: string;
}

class AnswerDto {
  @IsString()
  @MinLength(1)
  text: string;
}

@Controller()
export class QaController {
  constructor(private qa: QaService) {}

  @Post('lessons/:id/questions')
  ask(
    @CurrentUser('sub') userId: string,
    @Param('id') lessonId: string,
    @Body() dto: AskQuestionDto,
  ) {
    return this.qa.askQuestion(userId, lessonId, dto.text);
  }

  @Get('lessons/:id/questions')
  list(@Param('id') lessonId: string) {
    return this.qa.listForLesson(lessonId);
  }

  @Get('me/questions')
  mine(@CurrentUser('sub') userId: string) {
    return this.qa.myQuestions(userId);
  }

  @Roles('teacher', 'admin')
  @Post('questions/:id/answer')
  answer(
    @CurrentUser('sub') teacherId: string,
    @Param('id') questionId: string,
    @Body() dto: AnswerDto,
  ) {
    return this.qa.answer(teacherId, questionId, dto.text);
  }
}
