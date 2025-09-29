import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { GitHubService } from '../modules/github/github.service';
import { ScoringService } from '../modules/scoring/scoring.service';
import { CacheService } from '../modules/cache/cache.service';
import { RateLimitService } from '../modules/cache/rate-limit.service';
import { PopularityScoringService } from '../modules/scoring/popularity.service';
import { ActivityScoringService } from '../modules/scoring/activity.service';

// Mock repository data for testing
export const mockRepository = {
  id: 123456,
  node_id: 'MDEwOlJlcG9zaXRvcnkxMjM0NTY=',
  name: 'test-repo',
  full_name: 'testuser/test-repo',
  owner: {
    login: 'testuser',
    id: 12345,
    avatar_url: 'https://avatars.githubusercontent.com/u/12345',
    html_url: 'https://github.com/testuser',
  },
  private: false,
  html_url: 'https://github.com/testuser/test-repo',
  description: 'A test repository for unit testing',
  fork: false,
  url: 'https://api.github.com/repos/testuser/test-repo',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  pushed_at: '2024-12-01T00:00:00Z',
  git_url: 'git://github.com/testuser/test-repo.git',
  ssh_url: 'git@github.com:testuser/test-repo.git',
  clone_url: 'https://github.com/testuser/test-repo.git',
  size: 1024,
  stargazers_count: 100,
  watchers_count: 50,
  language: 'TypeScript',
  has_issues: true,
  has_projects: true,
  has_wiki: true,
  has_pages: false,
  forks_count: 25,
  archived: false,
  disabled: false,
  open_issues_count: 5,
  license: {
    key: 'mit',
    name: 'MIT License',
    spdx_id: 'MIT',
  },
  allow_forking: true,
  is_template: false,
  topics: ['typescript', 'nodejs', 'testing'],
  visibility: 'public',
  forks: 25,
  open_issues: 5,
  watchers: 50,
  default_branch: 'main',
  score: 1.0,
};

// Mock GitHub API response
export const mockGitHubResponse = {
  total_count: 1,
  incomplete_results: false,
  items: [mockRepository],
  rate_limit: {
    limit: 5000,
    remaining: 4999,
    reset: Math.floor(Date.now() / 1000) + 3600,
    used: 1,
    resource: 'search',
  },
};

// Mock rate limit response
export const mockRateLimit = {
  limit: 5000,
  remaining: 4999,
  reset: Math.floor(Date.now() / 1000) + 3600,
  used: 1,
  resource: 'search',
};

// Test module factory
export class TestModuleFactory {
  static async createTestingModule(providers: any[] = []): Promise<TestingModule> {
    const moduleBuilder = Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        HttpModule,
      ],
      providers: [
        GitHubService,
        ScoringService,
        PopularityScoringService,
        ActivityScoringService,
        CacheService,
        RateLimitService,
        ...providers,
      ],
    });

    return moduleBuilder.compile();
  }

  static createMockServices() {
    return {
      githubService: mockDeep<GitHubService>(),
      scoringService: mockDeep<ScoringService>(),
      cacheService: mockDeep<CacheService>(),
      rateLimitService: mockDeep<RateLimitService>(),
      popularityService: mockDeep<PopularityScoringService>(),
      activityService: mockDeep<ActivityScoringService>(),
    };
  }
}

// Test data generators
export class TestDataGenerator {
  static generateRepository(overrides: Partial<typeof mockRepository> = {}) {
    return {
      ...mockRepository,
      ...overrides,
    };
  }

  static generateRepositories(count: number, overrides: Partial<typeof mockRepository>[] = []) {
    return Array.from({ length: count }, (_, index) => ({
      ...mockRepository,
      id: mockRepository.id + index,
      name: `test-repo-${index}`,
      full_name: `testuser/test-repo-${index}`,
      ...(overrides[index] || {}),
    }));
  }

  static generateGitHubResponse(repositories: any[], totalCount?: number) {
    return {
      ...mockGitHubResponse,
      total_count: totalCount || repositories.length,
      items: repositories,
    };
  }
}

// Error testing utilities
export class ErrorTestUtils {
  static expectHttpException(
    promise: Promise<any>,
    expectedStatus: HttpStatus,
    expectedMessage?: string
  ) {
    return expect(promise).rejects.toThrow(
      expect.objectContaining({
        status: expectedStatus,
        ...(expectedMessage && { message: expectedMessage }),
      })
    );
  }

  static createHttpException(status: HttpStatus, message: string) {
    return new HttpException(message, status);
  }
}

// Time utilities for testing
export class TimeTestUtils {
  static mockDate(dateString: string) {
    const mockDate = new Date(dateString);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    return mockDate;
  }

  static restoreDate() {
    jest.restoreAllMocks();
  }

  static advanceTime(ms: number) {
    jest.advanceTimersByTime(ms);
  }
}

// Cache testing utilities
export class CacheTestUtils {
  static generateCacheKey(query: string, params: any = {}) {
    return `search:${query}:${JSON.stringify(params)}`;
  }

  static mockCacheHit<T>(cacheService: DeepMockProxy<CacheService>, key: string, value: T) {
    cacheService.get.mockReturnValue(value);
  }

  static mockCacheMiss(cacheService: DeepMockProxy<CacheService>, key: string) {
    cacheService.get.mockReturnValue(undefined);
  }
}
