import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiOkEnvelopeResponse } from '../../common/decorators/api-response.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AppConfig } from '../../config';
import { HealthResponseDto } from './dto/health-response.dto';

/**
 * Kept outside the API prefix and versioning so probes can call /health.
 */
@ApiTags('health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Public()
  @SkipThrottle()
  @Get()
  @ApiOperation({ summary: 'Liveness/readiness probe' })
  @ApiOkEnvelopeResponse(HealthResponseDto)
  check(): HealthResponseDto {
    const app = this.configService.getOrThrow<AppConfig>('app');

    return {
      status: 'ok',
      uptime: Number(process.uptime().toFixed(2)),
      timestamp: new Date().toISOString(),
      version: app.version,
      environment: app.env,
    };
  }
}
