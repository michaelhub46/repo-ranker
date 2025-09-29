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
    
    // Sort by total score (descending)
    scored.sort((a, b) => b.popularity_score - a.popularity_score);
    
    this.logger.log(`Scored repositories - Top score: ${scored[0]?.popularity_score.toFixed(3)}, Bottom score: ${scored[scored.length - 1]?.popularity_score.toFixed(3)}`);
    
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