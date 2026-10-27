import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { randomUUID } from 'node:crypto';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { createValidationPipe } from './common/validation/create-validation-pipe';
import { LoggingConfig, ThrottlerConfig, configLoaders } from './config';
import { validateEnv } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV ?? 'development'}.local`,
        `.env.${process.env.NODE_ENV ?? 'development'}`,
        '.env.local',
        '.env',
      ],
      load: configLoaders,
      validate: validateEnv,
    }),

    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logging = configService.getOrThrow<LoggingConfig>('logging');

        return {
          pinoHttp: {
            level: logging.level,
            transport: logging.pretty
              ? {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                  },
                }
              : undefined,
            genReqId: (req, res) => {
              const header = req.headers['x-request-id'];
              const requestId =
                typeof header === 'string' && header.trim().length > 0
                  ? header
                  : randomUUID();

              res.setHeader('x-request-id', requestId);

              return requestId;
            },
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'res.headers["set-cookie"]',
              ],
              censor: '[REDACTED]',
            },
            autoLogging: {
              ignore: (req) => req.url === '/health',
            },
            customLogLevel: (_req, res, err) => {
              if (err || res.statusCode >= 500) {
                return 'error';
              }

              if (res.statusCode >= 400) {
                return 'warn';
              }

              return 'info';
            },
            customSuccessMessage: (req, res) =>
              `${req.method ?? ''} ${req.url ?? ''} - ${res.statusCode}`,
            customErrorMessage: (req, res) =>
              `${req.method ?? ''} ${req.url ?? ''} - ${res.statusCode}`,
          },
        };
      },
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const throttler =
          configService.getOrThrow<ThrottlerConfig>('throttler');

        return {
          throttlers: [
            {
              name: 'default',
              ttl: throttler.ttl,
              limit: throttler.limit,
            },
          ],
        };
      },
    }),

    AuthModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // Global validation policy.
    {
      provide: APP_PIPE,
      useFactory: createValidationPipe,
    },

    // Guard order matters: rate limit -> authenticate -> authorize.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },

    // Global response/error conventions.
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
  ],
})
export class AppModule {}
