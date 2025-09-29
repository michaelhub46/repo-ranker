import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { PopularityScoringService } from './popularity.service';
import { ActivityScoringService } from './activity.service';

@Module({
  providers: [
    ScoringService,
    PopularityScoringService, 
    ActivityScoringService,
  ],
  exports: [ScoringService],
})
export class ScoringModule {}