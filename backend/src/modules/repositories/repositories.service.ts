import { Injectable, Logger } from '@nestjs/common';
import { GitHubService } from '../github/github.service';
import { ScoringService } from '../scoring/scoring.service';
import { CacheService } from '../cache/cache.service';
import { RateLimitService } from '../cache/rate-limit.service';
import { SearchRepositoriesDto } from './dto/search-request.dto';

@Injectable()
export class RepositoriesService {
  private readonly logger = new Logger(RepositoriesService.name);

  constructor(
    private readonly githubService: GitHubService,
    private readonly scoringService: ScoringService,
    private readonly cacheService: CacheService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async searchRepositories(searchDto: SearchRepositoriesDto, clientId?: string) {
    try {
      // Check rate limits
      if (clientId) {
        this.rateLimitService.checkClientRateLimit(clientId);
      }

      // Generate cache key
      const cacheKey = this.cacheService.generateSearchKey(searchDto.q, searchDto);
      
      // Try cache first
      const cached = this.cacheService.get(cacheKey);
      if (cached) {
        this.logger.log(`Cache hit for query: ${searchDto.q}`);
        return cached;
      }

      // Check GitHub API rate limit
      this.rateLimitService.checkGitHubApiLimit();

      // Get repositories from GitHub API
      const githubResponse = await this.githubService.searchRepositories(searchDto);
      
      // Update rate limit info from GitHub response
      this.rateLimitService.updateGitHubApiUsage(githubResponse.rate_limit);

      // Calculate popularity scores
      const scoredRepositories = this.scoringService.scoreRepositories(githubResponse.items);
      
      // Prepare response
      const response = {
        total_count: githubResponse.total_count,
        incomplete_results: githubResponse.incomplete_results,
        items: scoredRepositories,
        page_info: {
          current_page: searchDto.page || 1,
          per_page: searchDto.per_page || 25,
          total_pages: Math.min(Math.ceil(Math.min(githubResponse.total_count, 1000) / (searchDto.per_page || 25)), 40) // Max 1000 results, 40 pages at 25 per page
        },
        rate_limit: githubResponse.rate_limit,
        scoring_info: {
          algorithm_version: '1.0',
          factors: {
            stars: '40%',
            forks: '25%', 
            recency: '20%',
            activity: '15%'
          }
        }
      };

      // Cache the response
      this.cacheService.set(cacheKey, response);

      this.logger.log(`Returning ${scoredRepositories.length} scored repositories for query: ${searchDto.q}`);
      return response;

    } catch (error) {
      this.logger.error(`Search failed for query "${searchDto.q}": ${error.message}`, error.stack);
      throw error;
    }
  }

  async getHealthCheck() {
    const cacheStats = this.cacheService.getStats();
    const rateLimitStats = this.rateLimitService.getStats();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'repository-ranker',
      version: '1.0.0',
      cache: cacheStats,
      rate_limits: rateLimitStats,
    };
  }
}