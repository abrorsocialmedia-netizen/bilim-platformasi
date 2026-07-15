import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('me')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  me(@CurrentUser('sub') userId: string) {
    return this.users.me(userId);
  }

  @Patch()
  update(@CurrentUser('sub') userId: string, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(userId, dto);
  }
}
