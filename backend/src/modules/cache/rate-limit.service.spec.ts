import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { ErrorTestUtils, mockRateLimit } from '../../test/test-utils';
import { RATE_LIMITS } from '../../shared/constants/scoring.constants';

describe('RateLimitService', () => {
  let service: RateLimitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RateLimitService],
    }).compile();

    service = module.get<RateLimitService>(RateLimitService);
  });

  afterEach(() => {
    jest.useRealTimers();
    service.cleanup(); // Clean up old entries between tests
  });

  describe('Client Rate Limiting', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('should allow requests within rate limit', () => {
      const clientId = 'test-client';
      
      // Should not throw for requests within limit
      expect(() => service.checkClientRateLimit(clientId)).not.toThrow();
      expect(() => service.checkClientRateLimit(clientId)).not.toThrow();
    });

    it('should track separate clients independently', () => {
      const client1 = 'client-1';
      const client2 = 'client-2';
      
      // Make requests for different clients (use half the limit to be safe)
      const requestsPerClient = Math.floor(RATE_LIMITS.CLIENT_REQUESTS_PER_MINUTE / 2);
      for (let i = 0; i < requestsPerClient; i++) {
        expect(() => service.checkClientRateLimit(client1)).not.toThrow();
        expect(() => service.checkClientRateLimit(client2)).not.toThrow();
      }
    });

    it('should throw when client exceeds rate limit', () => {
      const clientId = 'heavy-user';
      
      // Make requests up to the limit (60 per minute from constants)
      for (let i = 0; i < RATE_LIMITS.CLIENT_REQUESTS_PER_MINUTE; i++) {
        service.checkClientRateLimit(clientId);
      }
      
      // Next request should throw
      expect(() => service.checkClientRateLimit(clientId))
        .toThrow(expect.objectContaining({
          status: HttpStatus.TOO_MANY_REQUESTS,
        }));
    });

    it('should reset client rate limits after time window', () => {
      const clientId = 'time-test';
      
      // Exhaust rate limit
      for (let i = 0; i < RATE_LIMITS.CLIENT_REQUESTS_PER_MINUTE; i++) {
        service.checkClientRateLimit(clientId);
      }
      
      // Should throw
      expect(() => service.checkClientRateLimit(clientId)).toThrow();
      
      // Fast forward 1 minute
      jest.advanceTimersByTime(60 * 1000);
      
      // Should work again
      expect(() => service.checkClientRateLimit(clientId)).not.toThrow();
    });

    it('should handle empty clientId gracefully', () => {
      expect(() => service.checkClientRateLimit('')).not.toThrow();
      expect(() => service.checkClientRateLimit('   ')).not.toThrow();
    });
  });

  describe('GitHub API Rate Limiting', () => {
    it('should allow requests when GitHub rate limit is available', () => {
      // Mock high remaining rate limit using headers format
      service.updateGitHubApiUsage({
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '4000',
        'x-ratelimit-reset': Math.floor(Date.now() / 1000 + 3600).toString(),
        'x-ratelimit-used': '1000',
        'x-ratelimit-resource': 'search',
      });

      expect(() => service.checkGitHubApiLimit()).not.toThrow();
    });

    it('should throw when GitHub rate limit is exceeded', () => {
      // Mock exhausted rate limit - set used count to exceed limit
      service.updateGitHubApiUsage({
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': Math.floor(Date.now() / 1000 + 3600).toString(),
        'x-ratelimit-used': '5000',
        'x-ratelimit-resource': 'search',
      });

      expect(() => service.checkGitHubApiLimit())
        .toThrow(expect.objectContaining({
          status: HttpStatus.TOO_MANY_REQUESTS,
        }));
    });

    it('should allow requests when near but not at limit', () => {
      // Mock rate limit near but not at exhaustion
      service.updateGitHubApiUsage({
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '100',
        'x-ratelimit-reset': Math.floor(Date.now() / 1000 + 3600).toString(),
        'x-ratelimit-used': '4900',
        'x-ratelimit-resource': 'search',
      });

      expect(() => service.checkGitHubApiLimit()).not.toThrow();
    });

    it('should handle missing GitHub rate limit data', () => {
      // Should not throw when no rate limit data available
      expect(() => service.checkGitHubApiLimit()).not.toThrow();
    });
  });

  describe('Rate Limit Updates', () => {
    it('should update GitHub API usage correctly', () => {
      const headers = {
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '4999',
        'x-ratelimit-reset': Math.floor(Date.now() / 1000 + 3600).toString(),
        'x-ratelimit-used': '1',
        'x-ratelimit-resource': 'search',
      };

      service.updateGitHubApiUsage(headers);
      
      // Should not throw with good rate limit
      expect(() => service.checkGitHubApiLimit()).not.toThrow();
    });
  });

  describe('Rate Limit Information', () => {
    it('should return current GitHub rate limit info', () => {
      const headers = {
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '4999',
        'x-ratelimit-reset': Math.floor(Date.now() / 1000 + 3600).toString(),
        'x-ratelimit-used': '1',
      };
      service.updateGitHubApiUsage(headers);

      const info = service.getGitHubLimitInfo();
      
      expect(info).toEqual({
        requests_made: 1,
        requests_remaining: expect.any(Number),
        reset_time: expect.any(Date),
      });
    });

    it('should return client rate limit info', () => {
      const clientId = 'status-test';
      
      // Make some requests
      service.checkClientRateLimit(clientId);
      service.checkClientRateLimit(clientId);
      service.checkClientRateLimit(clientId);

      const info = service.getClientLimitInfo(clientId);
      
      expect(info).toEqual({
        requests_made: 3,
        requests_remaining: expect.any(Number),
        reset_time: expect.any(Date),
      });
    });

    it('should return default info for unknown client', () => {
      const info = service.getClientLimitInfo('unknown-client');
      
      expect(info).toEqual({
        requests_made: 0,
        requests_remaining: expect.any(Number),
        reset_time: expect.any(Date),
      });
    });
  });

  describe('Reset Functionality', () => {
    it('should clean up old client entries', () => {
      const clientId = 'cleanup-test';
      
      // Make some requests
      service.checkClientRateLimit(clientId);
      service.checkClientRateLimit(clientId);
      
      // Get stats before cleanup
      const statsBefore = service.getStats();
      expect(statsBefore.active_clients).toBeGreaterThan(0);
      
      // Cleanup (in real scenario this would clean old entries)
      const cleaned = service.cleanup();
      
      // Should return number of cleaned entries (may be 0 for fresh entries)
      expect(typeof cleaned).toBe('number');
    });

    it('should return comprehensive stats', () => {
      const stats = service.getStats();
      
      expect(stats).toEqual({
        active_clients: expect.any(Number),
        github_api: {
          requests_made: expect.any(Number),
          requests_remaining: expect.any(Number),
          reset_time: expect.any(Date),
        },
        limits: {
          client_per_minute: expect.any(Number),
          github_per_hour: expect.any(Number),
          search_per_minute: expect.any(Number),
        },
      });
    });
  });
});
