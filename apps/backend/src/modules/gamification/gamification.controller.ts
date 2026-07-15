import { Controller, Get, Query } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller()
export class GamificationController {
  constructor(private gamification: GamificationService) {}

  @Get('me/stats')
  myStats(@CurrentUser('sub') userId: string) {
    return this.gamification.getStats(userId);
  }

  @Get('leaderboard')
  leaderboard(@Query('limit') limit?: string) {
    return this.gamification.getLeaderboard(limit ? Number(limit) : 20);
  }
}
