import { Controller, Param, Post } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('lessons')
export class ProgressController {
  constructor(private progress: ProgressService) {}

  @Post(':id/complete')
  complete(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.progress.completeLesson(userId, id);
  }
}
