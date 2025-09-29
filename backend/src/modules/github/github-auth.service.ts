import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class GitHubAuthService {
  private readonly logger = new Logger(GitHubAuthService.name);

  constructor() {}

  getAuthHeaders(): Record<string, string> {
    const token = process.env.GITHUB_TOKEN;
    
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'repo-ranker/1.0',
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
      this.logger.debug('Using GitHub token for authentication');
    } else {
      this.logger.warn('No GitHub token configured - using unauthenticated requests');
    }

    return headers;
  }

  checkRateLimit(headers: any): void {
    const remaining = parseInt(headers['x-ratelimit-remaining'] || '0', 10);
    const resetTime = parseInt(headers['x-ratelimit-reset'] || '0', 10);
    const buffer = parseInt(process.env.GITHUB_RATE_LIMIT_BUFFER || '10', 10);

    if (remaining <= buffer) {
      const resetDate = new Date(resetTime * 1000);
      const waitTime = Math.max(0, resetDate.getTime() - Date.now());
      
      this.logger.warn(
        `GitHub rate limit approaching. Remaining: ${remaining}, Reset: ${resetDate.toISOString()}`
      );

      if (remaining === 0) {
        throw new HttpException(
          `GitHub API rate limit exceeded. Reset at ${resetDate.toISOString()}`,
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
    }
  }

  extractRateLimitInfo(headers: any) {
    return {
      limit: parseInt(headers['x-ratelimit-limit'] || '0', 10),
      remaining: parseInt(headers['x-ratelimit-remaining'] || '0', 10),
      reset: new Date(parseInt(headers['x-ratelimit-reset'] || '0', 10) * 1000),
      used: parseInt(headers['x-ratelimit-used'] || '0', 10),
    };
  }
}