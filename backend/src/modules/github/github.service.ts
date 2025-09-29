import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { GitHubAuthService } from './github-auth.service';
import { GitHubSearchDto } from './dto/github-search.dto';

export interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: any[];
  rate_limit: any;
}

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly authService: GitHubAuthService,
  ) {
    this.baseUrl = process.env.GITHUB_API_URL || 'https://api.github.com';
    this.timeout = parseInt(process.env.GITHUB_TIMEOUT || '5000', 10);
    this.maxRetries = parseInt(process.env.GITHUB_MAX_RETRIES || '3', 10);
  }

  async searchRepositories(searchDto: GitHubSearchDto): Promise<GitHubSearchResponse> {
    const { q, sort = 'stars', order = 'desc', per_page = 25, page = 1 } = searchDto;

    // Validate required parameter
    if (!q || q.trim().length === 0) {
      throw new HttpException('Search query is required', HttpStatus.BAD_REQUEST);
    }

    const params = {
      q: q.trim(), // q should already contain language: and created: qualifiers
      sort,
      order,
      per_page: Math.min(per_page || 25, 100), // GitHub API limit, default 25
      page: Math.max(page, 1)
    };

    try {
      this.logger.log(`Searching repositories with params: ${JSON.stringify(params)}`);
      
      const response = await this.makeRequestWithRetry('/search/repositories', params);
      
      this.logger.log(`GitHub API returned ${response.data.total_count} total repositories`);
      
      return {
        total_count: response.data.total_count,
        incomplete_results: response.data.incomplete_results,
        items: response.data.items,
        rate_limit: this.authService.extractRateLimitInfo(response.headers)
      };
    } catch (error) {
      this.handleGitHubError(error);
      throw error; // This line will never be reached due to handleGitHubError always throwing
    }
  }

  private async makeRequestWithRetry(endpoint: string, params: any, retryCount = 0): Promise<AxiosResponse> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = this.authService.getAuthHeaders();

      const response = await firstValueFrom(
        this.httpService.get(url, {
          params,
          headers,
          timeout: this.timeout,
        })
      );

      // Check rate limits
      this.authService.checkRateLimit(response.headers);

      return response;
    } catch (error: any) {
      if (retryCount < this.maxRetries && this.shouldRetry(error)) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        this.logger.warn(`Request failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequestWithRetry(endpoint, params, retryCount + 1);
      }
      
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors, 5xx errors, or rate limit errors
    return !error.response || 
           error.response.status >= 500 || 
           error.response.status === 403; // GitHub rate limit returns 403
  }

  private handleGitHubError(error: any): never {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'GitHub API error';
      
      switch (status) {
        case 403:
          if (error.response.headers['x-ratelimit-remaining'] === '0') {
            throw new HttpException(
              'GitHub API rate limit exceeded',
              HttpStatus.TOO_MANY_REQUESTS
            );
          }
          throw new HttpException('GitHub API access forbidden', HttpStatus.FORBIDDEN);
        
        case 422:
          throw new HttpException(
            `GitHub API validation failed: ${message}`,
            HttpStatus.BAD_REQUEST
          );
        
        case 404:
          throw new HttpException('GitHub API endpoint not found', HttpStatus.NOT_FOUND);
        
        default:
          throw new HttpException(
            `GitHub API error: ${message}`,
            HttpStatus.BAD_GATEWAY
          );
      }
    }

    // Network or other errors
    this.logger.error(`GitHub API request failed: ${error.message}`, error.stack);
    throw new HttpException(
      'Failed to communicate with GitHub API',
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }
}