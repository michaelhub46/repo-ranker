import { Test, TestingModule } from '@nestjs/testing';
import { ScoringService } from './scoring.service';
import { PopularityScoringService } from './popularity.service';
import { ActivityScoringService } from './activity.service';
import { mockDeep } from 'jest-mock-extended';
import { mockRepository, TestDataGenerator } from '../../test/test-utils';

describe('ScoringService', () => {
  let service: ScoringService;
  let popularityService: jest.Mocked<PopularityScoringService>;
  let activityService: jest.Mocked<ActivityScoringService>;

  beforeEach(async () => {
    const popularityServiceMock = mockDeep<PopularityScoringService>();
    const activityServiceMock = mockDeep<ActivityScoringService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringService,
        {
          provide: PopularityScoringService,
          useValue: popularityServiceMock,
        },
        {
          provide: ActivityScoringService,
          useValue: activityServiceMock,
        },
      ],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
    popularityService = module.get(PopularityScoringService);
    activityService = module.get(ActivityScoringService);
  });

  describe('calculateScore', () => {
    it('should calculate total score correctly', () => {
      const mockPopularityScore = 0.75;
      const mockActivityScore = 0.25;
      const expectedTotalScore = 1.0;

      popularityService.calculatePopularityScore.mockReturnValue(mockPopularityScore);
      activityService.calculateActivityScore.mockReturnValue(mockActivityScore);

      const result = service.calculateScore(mockRepository);

      expect(result).toEqual({
        ...mockRepository,
        id: mockRepository.id,
        full_name: mockRepository.full_name,
        popularity_score: expectedTotalScore,
        score_breakdown: {
          popularity: mockPopularityScore,
          activity: mockActivityScore,
          total: expectedTotalScore,
        },
      });

      expect(popularityService.calculatePopularityScore).toHaveBeenCalledWith(mockRepository);
      expect(activityService.calculateActivityScore).toHaveBeenCalledWith(mockRepository);
    });

    it('should handle zero scores', () => {
      popularityService.calculatePopularityScore.mockReturnValue(0);
      activityService.calculateActivityScore.mockReturnValue(0);

      const result = service.calculateScore(mockRepository);

      expect(result.popularity_score).toBe(0);
      expect(result.score_breakdown.total).toBe(0);
    });
  });

  describe('scoreRepositories', () => {
    it('should score multiple repositories and maintain original order', () => {
      const repositories = TestDataGenerator.generateRepositories(3);
      
      // Mock different scores for each repository
      popularityService.calculatePopularityScore
        .mockReturnValueOnce(0.8)
        .mockReturnValueOnce(0.9)
        .mockReturnValueOnce(0.7);
      
      activityService.calculateActivityScore
        .mockReturnValueOnce(0.2)
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.3);

      const result = service.scoreRepositories(repositories);

      expect(result).toHaveLength(3);
      
      // Check that repositories maintain their original order (not sorted by score)
      expect(result[0].name).toBe('test-repo-0');
      expect(result[1].name).toBe('test-repo-1');
      expect(result[2].name).toBe('test-repo-2');
      
      // Check scores are calculated correctly
      expect(result[0].popularity_score).toBe(1.0); // 0.8 + 0.2
      expect(result[1].popularity_score).toBe(1.0); // 0.9 + 0.1
      expect(result[2].popularity_score).toBe(1.0); // 0.7 + 0.3
    });

    it('should handle empty repository array', () => {
      const result = service.scoreRepositories([]);
      expect(result).toEqual([]);
    });

    it('should handle null/undefined repositories', () => {
      const result1 = service.scoreRepositories(null as any);
      const result2 = service.scoreRepositories(undefined as any);
      
      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
    });
  });

  describe('getDetailedBreakdown', () => {
    it('should return detailed scoring breakdown', () => {
      const mockPopularityBreakdown = {
        stars: 0.4,
        forks: 0.25,
        recency: 0.0,
        raw_values: {
          stars: 100,
          forks: 25,
          days_since_update: 365,
        },
      };
      
      const mockActivityBreakdown = {
        watchers: 0.1,
        open_issues: 0.05,
        raw_values: {
          watchers: 50,
          open_issues: 5,
        },
      };

      popularityService.getPopularityBreakdown.mockReturnValue(mockPopularityBreakdown);
      activityService.getActivityBreakdown.mockReturnValue(mockActivityBreakdown);

      const result = service.getDetailedBreakdown(mockRepository);

      expect(result).toEqual({
        repository: {
          id: mockRepository.id,
          full_name: mockRepository.full_name,
          url: mockRepository.html_url,
        },
        popularity: mockPopularityBreakdown,
        activity: mockActivityBreakdown,
        weights: {
          stars: '40%',
          forks: '25%',
          recency: '20%',
          activity: '15%',
        },
      });
    });
  });
});
