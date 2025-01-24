import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.setGlobalPrefix('api');

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle(`Sell Shop API`)
    .setDescription(
      'Utilize essa documentação para realizar a integração com o nosso sistema',
    )
    .addBearerAuth({
      description: 'Token JWT',
      bearerFormat: 'JWT',
      scheme: 'bearer',
      type: 'http',
    })
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      layout: 'BaseLayout',
      authAction: {
        JWT: {
          name: 'JWT',
          schema: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          value: 'Bearer <token>',
        },
      },
    },
    customSiteTitle: 'Sell Shop Docs',
  });

  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3000);
}
bootstrap();
