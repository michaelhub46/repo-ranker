import { Injectable, Logger } from '@nestjs/common';
import { PopularityScoringService } from './popularity.service';
import { ActivityScoringService } from './activity.service';
import { ScoredRepository, ScoreBreakdown } from './interfaces/scoring.interface';

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(
    private readonly popularityService: PopularityScoringService,
    private readonly activityService: ActivityScoringService,
  ) {}

  /**
   * Calculate comprehensive score for a single repository
   */
  calculateScore(repository: any): ScoredRepository {
    const popularityScore = this.popularityService.calculatePopularityScore(repository);
    const activityScore = this.activityService.calculateActivityScore(repository);
    const totalScore = popularityScore + activityScore;

    const scoreBreakdown: ScoreBreakdown = {
      popularity: popularityScore,
      activity: activityScore,
      total: totalScore,
    };

    return {
      ...repository,
      id: repository.id,
      full_name: repository.full_name,
      popularity_score: totalScore,
      score_breakdown: scoreBreakdown,
    };
  }

  /**
   * Score multiple repositories
   */
  scoreRepositories(repositories: any[]): ScoredRepository[] {
    if (!repositories || repositories.length === 0) {
      return [];
    }

    this.logger.log(`Scoring ${repositories.length} repositories`);
    
    const scored = repositories.map(repo => this.calculateScore(repo));
    
    // Return repositories in original GitHub order (no sorting by score)
    this.logger.log(`Scored ${scored.length} repositories - maintaining original GitHub order`);
    
    return scored;
  }

  /**
   * Get detailed breakdown for debugging/analytics
   */
  getDetailedBreakdown(repository: any) {
    const popularityBreakdown = this.popularityService.getPopularityBreakdown(repository);
    const activityBreakdown = this.activityService.getActivityBreakdown(repository);
    
    return {
      repository: {
        id: repository.id,
        full_name: repository.full_name,
        url: repository.html_url,
      },
      popularity: popularityBreakdown,
      activity: activityBreakdown,
      weights: {
        stars: '40%',
        forks: '25%',
        recency: '20%',
        activity: '15%',
      },
    };
  }
}