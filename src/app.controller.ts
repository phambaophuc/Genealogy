import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiOkEnvelopeResponse } from './common/decorators/api-response.decorator';
import { Public } from './common/decorators/public.decorator';
import { AppInfoDto } from './app.dto';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Service metadata' })
  @ApiOkEnvelopeResponse(AppInfoDto)
  getInfo(): AppInfoDto {
    return this.appService.getInfo();
  }
}
