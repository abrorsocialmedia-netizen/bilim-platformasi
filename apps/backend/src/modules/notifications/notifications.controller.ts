import { Controller, Get, Param, Patch } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller()
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get('me/notifications')
  list(@CurrentUser('sub') userId: string) {
    return this.notifications.listForUser(userId);
  }

  @Patch('me/notifications/:id/read')
  markRead(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.notifications.markRead(userId, id);
  }

  @Patch('me/notifications/read-all')
  markAllRead(@CurrentUser('sub') userId: string) {
    return this.notifications.markAllRead(userId);
  }
}
