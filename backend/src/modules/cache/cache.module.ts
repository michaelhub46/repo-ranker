import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { RequestQueueService } from './request-queue.service';
import { RateLimitService } from './rate-limit.service';

@Module({
  providers: [
    CacheService,
    RequestQueueService,
    RateLimitService,
  ],
  exports: [
    CacheService,
    RequestQueueService,
    RateLimitService,
  ],
})
export class CacheModule {}