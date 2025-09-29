import { Injectable, Logger } from '@nestjs/common';
import { SCORING_WEIGHTS, ACTIVITY_FACTORS } from '../../shared/constants/scoring.constants';

@Injectable()
export class ActivityScoringService {
  private readonly logger = new Logger(ActivityScoringService.name);

  /**
   * Calculate activity score based on watchers and open issues
   * Uses the remaining 15% weight from the scoring algorithm
   */
  calculateActivityScore(repository: any): number {
    const watchers = repository.watchers_count || 0;
    const openIssues = repository.open_issues_count || 0;
    
    // Normalize activity indicators
    const watchersScore = Math.log10(watchers + 1) * ACTIVITY_FACTORS.WATCHERS;
    
    // For open issues, we want a moderate amount (shows activity but not too many problems)
    // Use a bell curve approach: optimal around 10-50 issues
    const issuesScore = this.calculateIssuesScore(openIssues) * ACTIVITY_FACTORS.OPEN_ISSUES;
    
    const totalActivityScore = (watchersScore + issuesScore) * SCORING_WEIGHTS.ACTIVITY;
    
    this.logger.debug(
      `Activity score for ${repository.full_name}: watchers=${watchersScore.toFixed(3)}, issues=${issuesScore.toFixed(3)}, total=${totalActivityScore.toFixed(3)}`
    );
    
    return totalActivityScore;
  }

  /**
   * Calculate issues score using bell curve
   * Sweet spot: 10-50 open issues indicates healthy activity
   */
  private calculateIssuesScore(openIssues: number): number {
    if (openIssues === 0) return 0.2; // Some projects have no issues but are still active
    if (openIssues <= 5) return 0.5; // Very few issues
    if (openIssues <= 20) return 1.0; // Optimal range
    if (openIssues <= 50) return 0.8; // Still good
    if (openIssues <= 100) return 0.6; // Getting concerning
    if (openIssues <= 200) return 0.4; // Too many issues
    return 0.2; // Way too many issues
  }

  /**
   * Get breakdown of activity factors
   */
  getActivityBreakdown(repository: any) {
    const watchers = repository.watchers_count || 0;
    const openIssues = repository.open_issues_count || 0;
    
    const watchersScore = Math.log10(watchers + 1) * ACTIVITY_FACTORS.WATCHERS;
    const issuesScore = this.calculateIssuesScore(openIssues) * ACTIVITY_FACTORS.OPEN_ISSUES;
    
    return {
      watchers: watchersScore,
      open_issues: issuesScore,
      raw_values: {
        watchers: watchers,
        open_issues: openIssues,
      },
    };
  }
}