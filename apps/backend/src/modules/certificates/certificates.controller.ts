import { Controller, Get } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('me/certificates')
export class CertificatesController {
  constructor(private certificates: CertificatesService) {}

  @Get()
  myCertificates(@CurrentUser('sub') userId: string) {
    return this.certificates.myCertificates(userId);
  }
}
