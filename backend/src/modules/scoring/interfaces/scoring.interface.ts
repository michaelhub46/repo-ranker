export interface ScoringFactors {
  stars: number;
  forks: number;
  recency: number;
  activity: number;
}

export interface ScoreBreakdown {
  popularity: number;
  activity: number;
  total: number;
}

export interface ScoredRepository {
  id: string | number;
  full_name: string;
  score_breakdown: ScoreBreakdown;
  popularity_score: number;
  [key: string]: any; // Allow other GitHub API fields
}