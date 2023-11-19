import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    disableErrorMessages: true,
  }));

  await app.listen(3000);
}
bootstrap();
