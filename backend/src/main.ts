import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS
    app.enableCors({
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    });

    const port = process.env.PORT || 3001;
    await app.listen(port);
    
    logger.log(`🚀 Repository Ranker API is running on: http://localhost:${port}`);
    logger.log(`📊 Health check available at: http://localhost:${port}/api/repositories/health`);
    logger.log(`🔍 Search endpoint: http://localhost:${port}/api/repositories/search`);
    
  } catch (error) {
    logger.error('❌ Failed to start application', error);
    process.exit(1);
  }
}

bootstrap();
