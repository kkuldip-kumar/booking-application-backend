import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  const config = app.get(ConfigService);
  const isProd = config.get<string>('app.nodeEnv') === 'production';

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: config.getOrThrow<string[]>('app.corsOrigins'), credentials: true });
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  if (!isProd) {
    const doc = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('CinemaHub API').addCookieAuth('access_token').build());
    SwaggerModule.setup('docs', app, doc);
  }
  await app.listen(config.getOrThrow<number>('app.port'));
  new Logger('Bootstrap').log('CinemaHub API started');
}

void bootstrap();
