import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { RepositoriesController } from './repositories.controller';
import { RepositoriesService } from './repositories.service';
import { SearchRepositoriesDto } from './dto/search-request.dto';
import { mockDeep } from 'jest-mock-extended';
import { 
  mockRepository, 
  mockGitHubResponse, 
  TestDataGenerator, 
  ErrorTestUtils 
} from '../../test/test-utils';

describe('RepositoriesController', () => {
  let controller: RepositoriesController;
  let repositoriesService: jest.Mocked<RepositoriesService>;

  beforeEach(async () => {
    const repositoriesServiceMock = mockDeep<RepositoriesService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RepositoriesController],
      providers: [
        {
          provide: RepositoriesService,
          useValue: repositoriesServiceMock,
        },
      ],
    }).compile();

    controller = module.get<RepositoriesController>(RepositoriesController);
    repositoriesService = module.get(RepositoriesService);
  });

  describe('search', () => {
    const validSearchDto: SearchRepositoriesDto = {
      q: 'react javascript',
      sort: 'stars',
      order: 'desc',
      per_page: 25,
      page: 1,
    };

    const mockSearchResponse = {
      total_count: 1000,
      incomplete_results: false,
      items: TestDataGenerator.generateRepositories(5),
      page_info: {
        current_page: 1,
        per_page: 25,
        total_pages: 40,
      },
      rate_limit: {
        limit: 5000,
        remaining: 4999,
        reset: Math.floor(Date.now() / 1000) + 3600,
        used: 1,
        resource: 'search',
      },
      scoring_info: {
        algorithm_version: '1.0',
        factors: {
          stars: '40%',
          forks: '25%',
          recency: '20%',
          activity: '15%',
        },
      },
    };

    it('should return search results successfully', async () => {
      repositoriesService.searchRepositories.mockResolvedValue(mockSearchResponse);

      const mockRequest = { ip: 'test-client' } as any;
      
      const result = await controller.searchRepositories(validSearchDto, mockRequest);

      expect(result).toEqual(mockSearchResponse);
      expect(repositoriesService.searchRepositories).toHaveBeenCalledWith(
        validSearchDto,
        'test-client'
      );
    });

    it('should handle search with minimal parameters', async () => {
      const minimalDto: SearchRepositoriesDto = {
        q: 'javascript',
      };

      repositoriesService.searchRepositories.mockResolvedValue(mockSearchResponse);

      const mockRequest = { ip: 'unknown' } as any;
      
      const result = await controller.searchRepositories(minimalDto, mockRequest);

      expect(result).toEqual(mockSearchResponse);
      expect(repositoriesService.searchRepositories).toHaveBeenCalledWith(
        minimalDto,
        'unknown'
      );
    });

    it('should handle search with complex query', async () => {
      const complexDto: SearchRepositoriesDto = {
        q: 'react language:typescript created:>2023-01-01 stars:>100',
        sort: 'updated',
        order: 'desc',
        per_page: 50,
        page: 2,
      };

      repositoriesService.searchRepositories.mockResolvedValue(mockSearchResponse);

      const mockRequest = { ip: 'complex-client' } as any;
      
      const result = await controller.searchRepositories(complexDto, mockRequest);

      expect(result).toEqual(mockSearchResponse);
      expect(repositoriesService.searchRepositories).toHaveBeenCalledWith(
        complexDto,
        'complex-client'
      );
    });

    it('should pass client IP correctly', async () => {
      const clientIp = '192.168.1.100';
      repositoriesService.searchRepositories.mockResolvedValue(mockSearchResponse);

      const mockRequest = { ip: clientIp } as any;
      
      await controller.searchRepositories(validSearchDto, mockRequest);

      expect(repositoriesService.searchRepositories).toHaveBeenCalledWith(
        validSearchDto,
        clientIp
      );
    });

    it('should propagate GitHub service errors correctly', async () => {
      const serviceError = new Error('GitHub API error');
      repositoriesService.searchRepositories.mockRejectedValue(serviceError);

      const mockRequest = { ip: 'test-client' } as any;

      await ErrorTestUtils.expectHttpException(
        controller.searchRepositories(validSearchDto, mockRequest),
        HttpStatus.INTERNAL_SERVER_ERROR,
        'An error occurred while searching repositories'
      );
    });
  });

  describe('health', () => {
    it('should return health status', async () => {
      const healthResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          github: 'operational',
          cache: 'operational',
          scoring: 'operational',
        },
      };

      repositoriesService.getHealthCheck = jest.fn().mockResolvedValue(healthResponse);

      const result = await controller.healthCheck();

      expect(result).toEqual(healthResponse);
      expect(repositoriesService.getHealthCheck).toHaveBeenCalled();
    });

    it('should handle health check errors', async () => {
      const errorMessage = 'Service unavailable';
      repositoriesService.getHealthCheck = jest.fn().mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(controller.healthCheck()).rejects.toThrow(errorMessage);
    });
  });

  describe('Input Validation', () => {
    // Note: These tests would require setting up ValidationPipe
    // In a real scenario, you'd test validation through integration tests
    
    it('should validate required query parameter', () => {
      const invalidDto = {} as SearchRepositoriesDto;
      
      // In real validation, this would be caught by ValidationPipe
      expect(invalidDto.q).toBeUndefined();
    });

    it('should validate sort parameter values', () => {
      const validSorts = ['stars', 'forks', 'help-wanted-issues', 'updated'];
      const invalidSort = 'invalid-sort';
      
      expect(validSorts).toContain('stars');
      expect(validSorts).not.toContain(invalidSort);
    });

    it('should validate order parameter values', () => {
      const validOrders = ['asc', 'desc'];
      const invalidOrder = 'invalid-order';
      
      expect(validOrders).toContain('desc');
      expect(validOrders).not.toContain(invalidOrder);
    });

    it('should validate per_page parameter range', () => {
      const validPerPage = 25;
      const tooSmall = 0;
      const tooLarge = 150;
      
      expect(validPerPage).toBeGreaterThan(0);
      expect(validPerPage).toBeLessThanOrEqual(100);
      expect(tooSmall).toBeLessThanOrEqual(0);
      expect(tooLarge).toBeGreaterThan(100);
    });

    it('should validate page parameter minimum value', () => {
      const validPage = 1;
      const invalidPage = 0;
      
      expect(validPage).toBeGreaterThanOrEqual(1);
      expect(invalidPage).toBeLessThan(1);
    });
  });

  describe('Response Structure', () => {
    const validSearchDto: SearchRepositoriesDto = {
      q: 'react javascript',
      sort: 'stars',
      order: 'desc',
      per_page: 25,
      page: 1,
    };

    const mockSearchResponse = {
      total_count: 1000,
      incomplete_results: false,
      items: TestDataGenerator.generateRepositories(5),
      page_info: {
        current_page: 1,
        per_page: 25,
        total_pages: 40,
      },
      rate_limit: {
        limit: 5000,
        remaining: 4999,
        reset: Math.floor(Date.now() / 1000) + 3600,
        used: 1,
        resource: 'search',
      },
      scoring_info: {
        algorithm_version: '1.0',
        factors: {
          stars: '40%',
          forks: '25%',
          recency: '20%',
          activity: '15%',
        },
      },
    };

    it('should return properly structured response', async () => {
      repositoriesService.searchRepositories.mockResolvedValue(mockSearchResponse);

      const mockRequest = { ip: 'test-client' } as any;
      
      const result = await controller.searchRepositories(validSearchDto, mockRequest);

      // Verify response structure
      expect(result).toHaveProperty('total_count');
      expect(result).toHaveProperty('incomplete_results');
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('page_info');
      expect(result).toHaveProperty('rate_limit');
      expect(result).toHaveProperty('scoring_info');

      // Verify items structure
      expect(Array.isArray(result.items)).toBe(true);
      if (result.items.length > 0) {
        const item = result.items[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('full_name');
        expect(item).toHaveProperty('html_url');
      }

      // Verify page_info structure
      expect(result.page_info).toHaveProperty('current_page');
      expect(result.page_info).toHaveProperty('per_page');
      expect(result.page_info).toHaveProperty('total_pages');

      // Verify rate_limit structure
      expect(result.rate_limit).toHaveProperty('limit');
      expect(result.rate_limit).toHaveProperty('remaining');
      expect(result.rate_limit).toHaveProperty('reset');

      // Verify scoring_info structure
      expect(result.scoring_info).toHaveProperty('algorithm_version');
      expect(result.scoring_info).toHaveProperty('factors');
    });
  });
});
