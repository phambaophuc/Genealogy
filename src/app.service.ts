import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppInfoDto } from './app.dto';
import { AppConfig, SwaggerConfig } from './config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getInfo(): AppInfoDto {
    const app = this.configService.getOrThrow<AppConfig>('app');
    const swagger = this.configService.get<SwaggerConfig>('swagger');

    return {
      name: app.name,
      version: app.version,
      environment: app.env,
      docs: swagger?.enabled ? `/${swagger.path}` : null,
    };
  }
}
