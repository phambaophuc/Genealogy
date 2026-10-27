import {
  INestApplication,
  RequestMethod,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AppConfig, AuthConfig } from './../src/config';

interface SuccessEnvelope<T> {
  success: boolean;
  data: T;
}

interface ErrorEnvelope {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; messages: string[] }>;
  };
}

describe('Base API (e2e)', () => {
  let app: INestApplication<App>;
  let authConfig: AuthConfig;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    const configService = app.get(ConfigService);
    const appConfig = configService.getOrThrow<AppConfig>('app');
    authConfig = configService.getOrThrow<AuthConfig>('auth');

    app.setGlobalPrefix(appConfig.apiPrefix, {
      exclude: [{ path: 'health', method: RequestMethod.GET }],
    });
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: appConfig.apiVersion,
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns the success envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    const body = response.body as SuccessEnvelope<{ status: string }>;

    expect(body).toMatchObject({
      success: true,
      data: { status: 'ok' },
    });
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('GET /api/v1 returns service metadata', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1')
      .expect(200);
    const body = response.body as SuccessEnvelope<{ name: string }>;

    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('name');
  });

  it('returns VALIDATION_ERROR for an invalid payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email' })
      .expect(400);
    const body = response.body as ErrorEnvelope;

    expect(body).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
      },
    });
    expect(body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'email' })]),
    );
  });

  it('rejects unknown properties (whitelist policy)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: authConfig.demoEmail,
        password: authConfig.demoPassword,
        isAdmin: true,
      })
      .expect(400);
    const body = response.body as ErrorEnvelope;

    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('protects /auth/me', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .expect(401);
    const body = response.body as ErrorEnvelope;

    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('logs in and returns the current user', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: authConfig.demoEmail,
        password: authConfig.demoPassword,
      })
      .expect(200);
    const loginBody = login.body as SuccessEnvelope<{ accessToken: string }>;

    expect(loginBody.data.accessToken).toBeTruthy();

    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${loginBody.data.accessToken}`)
      .expect(200);
    const meBody = me.body as SuccessEnvelope<{
      email: string;
      roles: string[];
    }>;

    expect(meBody).toMatchObject({
      success: true,
      data: {
        email: authConfig.demoEmail,
        roles: ['admin'],
      },
    });
  });
});
