import { Module } from '@nestjs/common';
import { RepositoriesController } from './repositories.controller';
import { RepositoriesService } from './repositories.service';
import { GitHubModule } from '../github/github.module';
import { ScoringModule } from '../scoring/scoring.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [GitHubModule, ScoringModule, CacheModule],
  controllers: [RepositoriesController],
  providers: [RepositoriesService],
  exports: [RepositoriesService],
})
export class RepositoriesModule {}