import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppConfig, SwaggerConfig } from './index';

/**
 * Swagger/OpenAPI setup. The generated document already includes the global
 * prefix and API version, so do not add a server URL with the same prefix.
 */
export function setupSwagger(
  app: INestApplication,
  configService: ConfigService,
): void {
  const swagger = configService.getOrThrow<SwaggerConfig>('swagger');

  if (!swagger.enabled) {
    return;
  }

  const appConfig = configService.getOrThrow<AppConfig>('app');

  const document = new DocumentBuilder()
    .setTitle(swagger.title)
    .setDescription(swagger.description)
    .setVersion(appConfig.version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the accessToken returned by POST /auth/login.',
      },
      'access-token',
    )
    .addTag('app', 'Service metadata')
    .addTag('auth', 'Authentication and current user')
    .addTag('health', 'Liveness and readiness probes')
    .build();

  const openApiDocument = SwaggerModule.createDocument(app, document, {
    deepScanRoutes: true,
  });

  SwaggerModule.setup(swagger.path, app, openApiDocument, {
    customSiteTitle: `${swagger.title} - Docs`,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
