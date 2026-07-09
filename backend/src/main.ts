import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  // Validate critical environment variables
  if (!process.env.JWT_SECRET) {
    console.error('❌ FATAL ERROR: La variable de entorno JWT_SECRET no está definida.');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  // Global Route Prefix
  app.setGlobalPrefix('api');

  // Enable Validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable CORS for frontend integration (whitelisted origins only)
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('SaaS Contabilidad y Control Fiscal - Venezuela')
    .setDescription(
      'API Backend para control fiscal y contable en Venezuela (B2B SaaS Multi-tenant). ' +
        'Permite gestionar Tenants, Usuarios, Empresas, Roles, Permisos y Menú dinámico.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Introduce el token JWT obtenido del login',
        in: 'header',
      },
      // Omitting the name parameter binds it to the default security scheme (bearer)
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📖 Swagger documentation available at http://localhost:${port}/api/docs`);
}
bootstrap();
