import { Body, Controller, Get, Put } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateConfigDto } from './dto/update-config.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Public()
  @Get('config/public')
  publicConfig() {
    return this.admin.getConfig();
  }

  @Roles('admin')
  @Get('config')
  getConfig() {
    return this.admin.getConfig();
  }

  @Roles('admin')
  @Put('config')
  updateConfig(@Body() dto: UpdateConfigDto) {
    return this.admin.updateConfig(dto);
  }

  @Roles('admin')
  @Get('analytics')
  analytics() {
    return this.admin.getAnalytics();
  }
}
