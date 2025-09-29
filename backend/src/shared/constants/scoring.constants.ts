// Scoring algorithm constants based on README
export const SCORING_WEIGHTS = {
  STARS: 0.4,        // 40%
  FORKS: 0.25,       // 25% 
  RECENCY: 0.2,      // 20%
  ACTIVITY: 0.15,    // 15%
} as const;

// Additional scoring factors
export const ACTIVITY_FACTORS = {
  WATCHERS: 0.6,
  OPEN_ISSUES: 0.4,
} as const;

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  SEARCH_RESULTS: 300,      // 5 minutes
  REPOSITORY_DATA: 3600,    // 1 hour
  POPULAR_REPOS: 21600,     // 6 hours
  ANALYTICS: 86400,         // 24 hours
} as const;

// Rate limiting
export const RATE_LIMITS = {
  GITHUB_API_PER_HOUR: 5000,
  SEARCH_API_PER_MINUTE: 30,
  CLIENT_REQUESTS_PER_MINUTE: 60,
} as const;