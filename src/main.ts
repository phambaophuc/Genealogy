import { RequestMethod, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { Logger as PinoNestLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfig, SwaggerConfig } from './config';
import { setupSwagger } from './config/setup-swagger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const appConfig = configService.getOrThrow<AppConfig>('app');
  const swaggerConfig = configService.getOrThrow<SwaggerConfig>('swagger');
  const logger = app.get(PinoNestLogger);

  app.useLogger(logger);
  app.flushLogs();
  app.enableShutdownHooks();

  if (appConfig.trustProxy) {
    const server = app.getHttpAdapter().getInstance() as {
      set(setting: string, value: unknown): void;
    };
    server.set('trust proxy', 1);
  }

  // Swagger UI uses inline scripts, so CSP is disabled when docs are enabled.
  app.use(
    helmet({
      contentSecurityPolicy: swaggerConfig.enabled ? false : undefined,
      crossOriginEmbedderPolicy: false,
      // HSTS on plain-HTTP localhost can be sticky in browsers during development.
      hsts: appConfig.isProduction ? undefined : false,
    }),
  );

  const corsOrigin = appConfig.corsOrigins.includes('*')
    ? true
    : appConfig.corsOrigins;

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    exposedHeaders: ['x-request-id'],
    maxAge: 86_400,
  });

  app.setGlobalPrefix(appConfig.apiPrefix, {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: appConfig.apiVersion,
  });

  setupSwagger(app, configService);

  await app.listen(appConfig.port, '0.0.0.0');

  logger.log(
    `${appConfig.name} listening on http://localhost:${appConfig.port}/${appConfig.apiPrefix}/v${appConfig.apiVersion}`,
    'Bootstrap',
  );

  if (swaggerConfig.enabled) {
    logger.log(
      `Swagger UI available at http://localhost:${appConfig.port}/${swaggerConfig.path}`,
      'Bootstrap',
    );
  }
}

void bootstrap();
