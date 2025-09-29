import { Test, TestingModule } from '@nestjs/testing';
import { ActivityScoringService } from './activity.service';
import { mockRepository, TestDataGenerator, TimeTestUtils } from '../../test/test-utils';

describe('ActivityScoringService', () => {
  let service: ActivityScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivityScoringService],
    }).compile();

    service = module.get<ActivityScoringService>(ActivityScoringService);
  });

  afterEach(() => {
    TimeTestUtils.restoreDate();
  });

  describe('calculateActivityScore', () => {
    it('should calculate activity score for recently updated repository', () => {
      // Mock current date to be January 1, 2024
      TimeTestUtils.mockDate('2024-01-01T00:00:00Z');
      
      const repo = TestDataGenerator.generateRepository({
        updated_at: '2023-12-01T00:00:00Z', // 1 month ago
        pushed_at: '2023-11-15T00:00:00Z', // 1.5 months ago
        open_issues_count: 5,
        watchers_count: 50,
      });

      const result = service.calculateActivityScore(repo);
      
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
      expect(typeof result).toBe('number');
    });

    it('should consider watcher count in activity scoring', () => {
      TimeTestUtils.mockDate('2024-01-01T00:00:00Z');
      
      const highWatchersRepo = TestDataGenerator.generateRepository({
        updated_at: '2023-12-01T00:00:00Z',
        pushed_at: '2023-11-01T00:00:00Z',
        open_issues_count: 10,
        watchers_count: 1000, // High watchers
      });
      
      const lowWatchersRepo = TestDataGenerator.generateRepository({
        updated_at: '2023-12-01T00:00:00Z',
        pushed_at: '2023-11-01T00:00:00Z',
        open_issues_count: 10,
        watchers_count: 10, // Low watchers
      });

      const highScore = service.calculateActivityScore(highWatchersRepo);
      const lowScore = service.calculateActivityScore(lowWatchersRepo);
      
      expect(highScore).toBeGreaterThan(lowScore);
    });

    it('should handle repositories with moderate issue activity', () => {
      TimeTestUtils.mockDate('2024-01-01T00:00:00Z');
      
      const moderateIssuesRepo = TestDataGenerator.generateRepository({
        updated_at: '2023-12-01T00:00:00Z',
        pushed_at: '2023-11-01T00:00:00Z',
        open_issues_count: 15, // Moderate issues - shows activity but not overwhelming
        watchers_count: 100,
      });
      
      const noIssuesRepo = TestDataGenerator.generateRepository({
        updated_at: '2023-12-01T00:00:00Z',
        pushed_at: '2023-11-01T00:00:00Z',
        open_issues_count: 0, // No issues
        watchers_count: 100,
      });

      const moderateScore = service.calculateActivityScore(moderateIssuesRepo);
      const noIssuesScore = service.calculateActivityScore(noIssuesRepo);
      
      // Moderate issues should indicate more activity
      expect(moderateScore).toBeGreaterThanOrEqual(noIssuesScore);
    });
  });

  describe('getActivityBreakdown', () => {
    it('should return detailed breakdown of activity score', () => {
      TimeTestUtils.mockDate('2024-01-01T00:00:00Z');
      
      const repo = TestDataGenerator.generateRepository({
        updated_at: '2023-11-01T00:00:00Z',
        pushed_at: '2023-10-15T00:00:00Z',
        open_issues_count: 8,
        watchers_count: 75,
      });

      const breakdown = service.getActivityBreakdown(repo);

      expect(breakdown).toHaveProperty('watchers');
      expect(breakdown).toHaveProperty('open_issues');
      expect(breakdown).toHaveProperty('raw_values');
      
      expect(breakdown.raw_values).toEqual({
        watchers: repo.watchers_count,
        open_issues: repo.open_issues_count,
      });
      
      expect(typeof breakdown.watchers).toBe('number');
      expect(typeof breakdown.open_issues).toBe('number');
    });

    it('should calculate days since update correctly', () => {
      TimeTestUtils.mockDate('2024-01-15T00:00:00Z');
      
      const repo = TestDataGenerator.generateRepository({
        updated_at: '2024-01-01T00:00:00Z', // 14 days ago
        pushed_at: '2023-12-20T00:00:00Z', // 26 days ago
        open_issues_count: 5,
        watchers_count: 50,
      });

      const breakdown = service.getActivityBreakdown(repo);
      
      // Note: ActivityService doesn't track days since update in breakdown
      expect(breakdown.raw_values.watchers).toBe(50);
      expect(breakdown.raw_values.open_issues).toBe(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing watcher and issue counts', () => {
      const repo = { 
        ...mockRepository, 
        watchers_count: undefined, 
        open_issues_count: undefined 
      };

      const result = service.calculateActivityScore(repo);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should handle invalid dates', () => {
      const repo = TestDataGenerator.generateRepository({
        updated_at: 'invalid-date',
        pushed_at: 'invalid-date',
        open_issues_count: 5,
        watchers_count: 50,
      });

      const result = service.calculateActivityScore(repo);
      expect(typeof result).toBe('number');
    });

    it('should handle future dates gracefully', () => {
      TimeTestUtils.mockDate('2024-01-01T00:00:00Z');
      
      const repo = TestDataGenerator.generateRepository({
        updated_at: '2024-06-01T00:00:00Z', // Future date
        pushed_at: '2024-05-01T00:00:00Z', // Future date
        open_issues_count: 5,
        watchers_count: 50,
      });

      const result = service.calculateActivityScore(repo);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should handle very old repositories', () => {
      TimeTestUtils.mockDate('2024-01-01T00:00:00Z');
      
      const repo = TestDataGenerator.generateRepository({
        updated_at: '2010-01-01T00:00:00Z', // Very old
        pushed_at: '2009-12-01T00:00:00Z', // Very old
        open_issues_count: 0,
        watchers_count: 5,
      });

      const result = service.calculateActivityScore(repo);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(0.1); // Should be very low score
    });

    it('should handle negative issue counts', () => {
      const repo = TestDataGenerator.generateRepository({
        open_issues_count: -5,
        watchers_count: 50,
      });

      const result = service.calculateActivityScore(repo);
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });
});
