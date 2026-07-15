import { Controller, Param, Post } from '@nestjs/common';
import { VideoService } from './video.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('lessons')
export class VideoController {
  constructor(private video: VideoService) {}

  @Post(':id/video-token')
  createToken(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.video.createVideoToken(userId, id);
  }
}
