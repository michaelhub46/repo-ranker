import { Injectable, Logger } from '@nestjs/common';
import { SCORING_WEIGHTS } from '../../shared/constants/scoring.constants';
import { daysSince } from '../../shared/utils/date.utils';

@Injectable()
export class PopularityScoringService {
  private readonly logger = new Logger(PopularityScoringService.name);

  /**
   * Calculate popularity score based on stars, forks, and recency
   * Formula from README: log₁₀(stars + 1) × 0.4 + log₁₀(forks + 1) × 0.25 + max(0, (365 - days_since_update) / 365) × 0.2
   */
  calculatePopularityScore(repository: any): number {
    const stars = repository.stargazers_count || 0;
    const forks = repository.forks_count || 0;
    const lastUpdated = repository.updated_at || repository.pushed_at || new Date().toISOString();
    
    // Calculate individual components
    const starsScore = Math.log10(stars + 1) * SCORING_WEIGHTS.STARS;
    const forksScore = Math.log10(forks + 1) * SCORING_WEIGHTS.FORKS;
    
    // Recency score: newer repos get higher scores
    const daysSinceUpdate = daysSince(lastUpdated);
    const recencyScore = Math.max(0, (365 - daysSinceUpdate) / 365) * SCORING_WEIGHTS.RECENCY;
    
    const totalScore = starsScore + forksScore + recencyScore;
    
    this.logger.debug(
      `Popularity score for ${repository.full_name}: stars=${starsScore.toFixed(3)}, forks=${forksScore.toFixed(3)}, recency=${recencyScore.toFixed(3)}, total=${totalScore.toFixed(3)}`
    );
    
    return totalScore;
  }

  /**
   * Get breakdown of popularity factors
   */
  getPopularityBreakdown(repository: any) {
    const stars = repository.stargazers_count || 0;
    const forks = repository.forks_count || 0;
    const lastUpdated = repository.updated_at || repository.pushed_at || new Date().toISOString();
    
    const starsScore = Math.log10(stars + 1) * SCORING_WEIGHTS.STARS;
    const forksScore = Math.log10(forks + 1) * SCORING_WEIGHTS.FORKS;
    const daysSinceUpdate = daysSince(lastUpdated);
    const recencyScore = Math.max(0, (365 - daysSinceUpdate) / 365) * SCORING_WEIGHTS.RECENCY;
    
    return {
      stars: starsScore,
      forks: forksScore,
      recency: recencyScore,
      raw_values: {
        stars: stars,
        forks: forks,
        days_since_update: daysSinceUpdate,
      },
    };
  }
}