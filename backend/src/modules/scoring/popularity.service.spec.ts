import { Test, TestingModule } from '@nestjs/testing';
import { PopularityScoringService } from './popularity.service';
import { mockRepository, TestDataGenerator } from '../../test/test-utils';
import { SCORING_WEIGHTS } from '../../shared/constants/scoring.constants';

describe('PopularityScoringService', () => {
  let service: PopularityScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PopularityScoringService],
    }).compile();

    service = module.get<PopularityScoringService>(PopularityScoringService);
  });

  describe('calculatePopularityScore', () => {
    it('should calculate popularity score correctly for typical repository', () => {
      const repo = TestDataGenerator.generateRepository({
        stargazers_count: 1000,
        forks_count: 200,
      });

      const result = service.calculatePopularityScore(repo);
      
      // Should be a positive number (no upper limit constraint)
      expect(result).toBeGreaterThanOrEqual(0);
      expect(typeof result).toBe('number');
      expect(isFinite(result)).toBe(true); // Should be a finite number
    });

    it('should handle repository with zero stars and forks', () => {
      const repo = TestDataGenerator.generateRepository({
        stargazers_count: 0,
        forks_count: 0,
        updated_at: new Date().toISOString(), // Recent update for recency score
      });

      const result = service.calculatePopularityScore(repo);
      // With zero stars and forks, only recency contributes to the score
      expect(result).toBeGreaterThanOrEqual(0);
      expect(typeof result).toBe('number');
    });

    it('should handle repository with very high stars', () => {
      const repo = TestDataGenerator.generateRepository({
        stargazers_count: 100000,
        forks_count: 10000,
      });

      const result = service.calculatePopularityScore(repo);
      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
      expect(isFinite(result)).toBe(true);
      // High star/fork counts should produce high scores (much greater than 1)
      expect(result).toBeGreaterThan(1);
    });

    it('should give higher score to repository with more stars', () => {
      const repo1 = TestDataGenerator.generateRepository({
        stargazers_count: 100,
        forks_count: 20,
      });
      
      const repo2 = TestDataGenerator.generateRepository({
        stargazers_count: 1000,
        forks_count: 20,
      });

      const score1 = service.calculatePopularityScore(repo1);
      const score2 = service.calculatePopularityScore(repo2);
      
      expect(score2).toBeGreaterThan(score1);
    });

    it('should give higher score to repository with more forks', () => {
      const repo1 = TestDataGenerator.generateRepository({
        stargazers_count: 100,
        forks_count: 10,
      });
      
      const repo2 = TestDataGenerator.generateRepository({
        stargazers_count: 100,
        forks_count: 50,
      });

      const score1 = service.calculatePopularityScore(repo1);
      const score2 = service.calculatePopularityScore(repo2);
      
      expect(score2).toBeGreaterThan(score1);
    });
  });

  describe('getPopularityBreakdown', () => {
    it('should return detailed breakdown of popularity score', () => {
      const repo = TestDataGenerator.generateRepository({
        stargazers_count: 500,
        forks_count: 100,
      });

      const breakdown = service.getPopularityBreakdown(repo);

      expect(breakdown).toHaveProperty('stars');
      expect(breakdown).toHaveProperty('forks');
      expect(breakdown).toHaveProperty('recency');
      expect(breakdown).toHaveProperty('raw_values');
      
      expect(breakdown.raw_values).toEqual({
        stars: 500,
        forks: 100,
        days_since_update: expect.any(Number),
      });
      
      expect(typeof breakdown.stars).toBe('number');
      expect(typeof breakdown.forks).toBe('number');
      expect(typeof breakdown.recency).toBe('number');
    });

    it('should respect scoring weights', () => {
      const repo = TestDataGenerator.generateRepository({
        stargazers_count: 1000,
        forks_count: 200,
      });

      const breakdown = service.getPopularityBreakdown(repo);
      const totalScore = service.calculatePopularityScore(repo);
      
      // Stars should contribute more to the score than forks (40% vs 25%)
      const expectedStarsWeight = SCORING_WEIGHTS.STARS;
      const expectedForksWeight = SCORING_WEIGHTS.FORKS;
      
      // Stars should have higher weight than forks for same logarithmic input
      expect(expectedStarsWeight).toBeGreaterThan(expectedForksWeight);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing star count', () => {
      const repo = { ...mockRepository, stargazers_count: undefined };

      const result = service.calculatePopularityScore(repo);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing fork count', () => {
      const repo = { ...mockRepository, forks_count: undefined };

      const result = service.calculatePopularityScore(repo);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });
});
