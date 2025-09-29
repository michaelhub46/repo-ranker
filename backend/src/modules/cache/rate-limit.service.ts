import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { RATE_LIMITS } from '../../shared/constants/scoring.constants';

interface RateLimitEntry {
  count: number;
  resetTime: Date;
  clientId: string;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly clientLimits = new Map<string, RateLimitEntry>();
  private gitHubApiUsage = {
    count: 0,
    resetTime: new Date(),
  };

  /**
   * Check if client can make request
   */
  checkClientRateLimit(clientId: string): boolean {
    const now = new Date();
    let entry = this.clientLimits.get(clientId);

    // Create new entry if doesn't exist
    if (!entry) {
      entry = {
        count: 0,
        resetTime: new Date(now.getTime() + 60 * 1000), // Reset every minute
        clientId,
      };
      this.clientLimits.set(clientId, entry);
    }

    // Reset if time has passed
    if (now >= entry.resetTime) {
      entry.count = 0;
      entry.resetTime = new Date(now.getTime() + 60 * 1000);
    }

    // Check limit
    if (entry.count >= RATE_LIMITS.CLIENT_REQUESTS_PER_MINUTE) {
      this.logger.warn(`Rate limit exceeded for client ${clientId}`);
      throw new HttpException(
        `Rate limit exceeded. Try again after ${entry.resetTime.toISOString()}`,
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Increment count
    entry.count++;
    return true;
  }

  /**
   * Check GitHub API rate limit
   */
  checkGitHubApiLimit(): boolean {
    const now = new Date();

    // Reset if hour has passed
    if (now >= this.gitHubApiUsage.resetTime) {
      this.gitHubApiUsage.count = 0;
      this.gitHubApiUsage.resetTime = new Date(now.getTime() + 60 * 60 * 1000); // Reset every hour
    }

    // Check limit
    if (this.gitHubApiUsage.count >= RATE_LIMITS.GITHUB_API_PER_HOUR) {
      this.logger.error('GitHub API rate limit exceeded');
      throw new HttpException(
        'GitHub API rate limit exceeded. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Increment count
    this.gitHubApiUsage.count++;
    return true;
  }

  /**
   * Update GitHub API usage from response headers
   */
  updateGitHubApiUsage(headers: any): void {
    const remaining = parseInt(headers['x-ratelimit-remaining'] || '0', 10);
    const resetTime = parseInt(headers['x-ratelimit-reset'] || '0', 10);
    const used = parseInt(headers['x-ratelimit-used'] || '0', 10);

    if (resetTime) {
      this.gitHubApiUsage.resetTime = new Date(resetTime * 1000);
    }

    // Update our count based on GitHub's headers
    this.gitHubApiUsage.count = used;

    this.logger.debug(
      `GitHub API usage updated: ${used} used, ${remaining} remaining, resets at ${this.gitHubApiUsage.resetTime.toISOString()}`
    );
  }

  /**
   * Get client rate limit info
   */
  getClientLimitInfo(clientId: string) {
    const entry = this.clientLimits.get(clientId);
    
    if (!entry) {
      return {
        requests_made: 0,
        requests_remaining: RATE_LIMITS.CLIENT_REQUESTS_PER_MINUTE,
        reset_time: new Date(Date.now() + 60 * 1000),
      };
    }

    return {
      requests_made: entry.count,
      requests_remaining: Math.max(0, RATE_LIMITS.CLIENT_REQUESTS_PER_MINUTE - entry.count),
      reset_time: entry.resetTime,
    };
  }

  /**
   * Get GitHub API limit info
   */
  getGitHubLimitInfo() {
    return {
      requests_made: this.gitHubApiUsage.count,
      requests_remaining: Math.max(0, RATE_LIMITS.GITHUB_API_PER_HOUR - this.gitHubApiUsage.count),
      reset_time: this.gitHubApiUsage.resetTime,
    };
  }

  /**
   * Clean up old client entries
   */
  cleanup(): number {
    const now = new Date();
    let removed = 0;

    for (const [clientId, entry] of this.clientLimits.entries()) {
      // Remove entries that are more than 1 hour old
      if (now.getTime() - entry.resetTime.getTime() > 60 * 60 * 1000) {
        this.clientLimits.delete(clientId);
        removed++;
      }
    }

    if (removed > 0) {
      this.logger.debug(`Cleaned up ${removed} old rate limit entries`);
    }

    return removed;
  }

  /**
   * Get rate limit statistics
   */
  getStats() {
    return {
      active_clients: this.clientLimits.size,
      github_api: this.getGitHubLimitInfo(),
      limits: {
        client_per_minute: RATE_LIMITS.CLIENT_REQUESTS_PER_MINUTE,
        github_per_hour: RATE_LIMITS.GITHUB_API_PER_HOUR,
        search_per_minute: RATE_LIMITS.SEARCH_API_PER_MINUTE,
      },
    };
  }
}