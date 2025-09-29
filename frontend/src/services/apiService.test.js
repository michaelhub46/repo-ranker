import apiService from '../services/apiService';
import { mockSearchResults } from '../utils/testUtils';

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('searchRepositories', () => {
    const mockParams = {
      q: 'react language:javascript',
      sort: 'stars',
      order: 'desc',
      per_page: 25,
      page: 1,
    };

    it('should make GET request to correct endpoint', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSearchResults),
      });

      await apiService.searchRepositories(mockParams);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/repositories/search?q=react+language%3Ajavascript&sort=stars&order=desc&per_page=25&page=1',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should return parsed JSON response on success', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSearchResults),
      });

      const result = await apiService.searchRepositories(mockParams);

      expect(result).toEqual(mockSearchResults);
    });

    it('should handle minimal parameters', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSearchResults),
      });

      const minimalParams = { q: 'javascript' };
      await apiService.searchRepositories(minimalParams);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/repositories/search?q=javascript',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle all parameters', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSearchResults),
      });

      const fullParams = {
        q: 'react hooks language:typescript created:>2023-01-01',
        sort: 'forks',
        order: 'asc',
        per_page: 50,
        page: 2,
      };

      await apiService.searchRepositories(fullParams);

      const expectedUrl = 'http://localhost:3001/api/repositories/search?q=react+hooks+language%3Atypescript+created%3A%3E2023-01-01&sort=forks&order=asc&per_page=50&page=2';
      expect(fetch).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should properly encode URL parameters', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSearchResults),
      });

      const specialParams = {
        q: 'react-router @types/node language:typescript',
        sort: 'stars',
      };

      await apiService.searchRepositories(specialParams);

      const call = fetch.mock.calls[0][0];
      expect(call).toContain('react-router+%40types%2Fnode+language%3Atypescript');
    });

    it('should skip empty parameters', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSearchResults),
      });

      const paramsWithEmpty = {
        q: 'react',
        sort: '',
        order: null,
        per_page: 25,
        page: undefined,
      };

      await apiService.searchRepositories(paramsWithEmpty);

      const call = fetch.mock.calls[0][0];
      expect(call).toBe('http://localhost:3001/api/repositories/search?q=react&per_page=25');
    });

    describe('Error Handling', () => {
      it('should throw error when response is not ok', async () => {
        const errorResponse = {
          message: 'Bad Request',
        };

        fetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve(errorResponse),
        });

        await expect(apiService.searchRepositories(mockParams)).rejects.toThrow('Bad Request');
      });

      it('should throw error with status when no error message in response', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({}),
        });

        await expect(apiService.searchRepositories(mockParams)).rejects.toThrow('HTTP error! status: 500');
      });

      it('should handle network errors', async () => {
        const networkError = new Error('Network Error');
        fetch.mockRejectedValueOnce(networkError);

        await expect(apiService.searchRepositories(mockParams)).rejects.toThrow('Network Error');
      });

      it('should handle JSON parsing errors', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.reject(new Error('Invalid JSON')),
        });

        await expect(apiService.searchRepositories(mockParams)).rejects.toThrow('Invalid JSON');
      });

      it('should handle 401 unauthorized error', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Unauthorized' }),
        });

        await expect(apiService.searchRepositories(mockParams)).rejects.toThrow('Unauthorized');
      });

      it('should handle 403 rate limit error', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: () => Promise.resolve({ message: 'API rate limit exceeded' }),
        });

        await expect(apiService.searchRepositories(mockParams)).rejects.toThrow('API rate limit exceeded');
      });

      it('should handle 404 not found error', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ message: 'Not found' }),
        });

        await expect(apiService.searchRepositories(mockParams)).rejects.toThrow('Not found');
      });
    });

    describe('API Base URL', () => {
      it('should use environment variable when available', async () => {
        const originalEnv = process.env.REACT_APP_API_URL;
        process.env.REACT_APP_API_URL = 'https://api.example.com';

        // Re-import to get new environment variable
        jest.resetModules();
        const { default: apiServiceWithCustomUrl } = require('../services/apiService');

        fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockSearchResults),
        });

        await apiServiceWithCustomUrl.searchRepositories({ q: 'test' });

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('https://api.example.com'),
          expect.any(Object)
        );

        // Restore original environment
        process.env.REACT_APP_API_URL = originalEnv;
        jest.resetModules();
      });

      it('should use default localhost when environment variable not set', async () => {
        const originalEnv = process.env.REACT_APP_API_URL;
        delete process.env.REACT_APP_API_URL;

        // Re-import to get new environment variable
        jest.resetModules();
        const { default: apiServiceWithDefaultUrl } = require('../services/apiService');

        fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockSearchResults),
        });

        await apiServiceWithDefaultUrl.searchRepositories({ q: 'test' });

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('http://localhost:3001'),
          expect.any(Object)
        );

        // Restore original environment
        process.env.REACT_APP_API_URL = originalEnv;
        jest.resetModules();
      });
    });
  });

  describe('getHealthCheck', () => {
    const mockHealthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        github: 'operational',
        cache: 'operational',
        scoring: 'operational',
      },
    };

    it('should make GET request to health endpoint', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockHealthResponse),
      });

      await apiService.getHealthCheck();

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/repositories/health');
    });

    it('should return parsed JSON response on success', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockHealthResponse),
      });

      const result = await apiService.getHealthCheck();

      expect(result).toEqual(mockHealthResponse);
    });

    it('should throw error when health check fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      await expect(apiService.getHealthCheck()).rejects.toThrow('HTTP error! status: 503');
    });

    it('should handle network errors in health check', async () => {
      const networkError = new Error('Network Error');
      fetch.mockRejectedValueOnce(networkError);

      await expect(apiService.getHealthCheck()).rejects.toThrow('Network Error');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete search workflow', async () => {
      // Mock successful search
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSearchResults),
      });

      const searchParams = {
        q: 'react hooks',
        sort: 'stars',
        order: 'desc',
        per_page: 25,
        page: 1,
      };

      const result = await apiService.searchRepositories(searchParams);

      expect(result).toHaveProperty('total_count');
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('page_info');
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should handle pagination workflow', async () => {
      // Mock first page
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          ...mockSearchResults,
          page_info: { ...mockSearchResults.page_info, current_page: 1 },
        }),
      });

      await apiService.searchRepositories({ q: 'react', page: 1 });

      // Mock second page
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          ...mockSearchResults,
          page_info: { ...mockSearchResults.page_info, current_page: 2 },
        }),
      });

      await apiService.searchRepositories({ q: 'react', page: 2 });

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenNthCalledWith(1, expect.stringContaining('page=1'), expect.any(Object));
      expect(fetch).toHaveBeenNthCalledWith(2, expect.stringContaining('page=2'), expect.any(Object));
    });

    it('should handle search with complex query parameters', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSearchResults),
      });

      const complexParams = {
        q: 'machine learning language:python created:>2023-01-01 stars:>100',
        sort: 'updated',
        order: 'desc',
        per_page: 50,
        page: 3,
      };

      await apiService.searchRepositories(complexParams);

      const call = fetch.mock.calls[0][0];
      expect(call).toContain('machine+learning+language%3Apython');
      expect(call).toContain('created%3A%3E2023-01-01');
      expect(call).toContain('stars%3A%3E100');
      expect(call).toContain('sort=updated');
      expect(call).toContain('order=desc');
      expect(call).toContain('per_page=50');
      expect(call).toContain('page=3');
    });
  });

  describe('Type Safety and Data Validation', () => {
    it('should handle numeric values correctly', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSearchResults),
      });

      await apiService.searchRepositories({
        q: 'react',
        per_page: 25,
        page: 1,
      });

      const call = fetch.mock.calls[0][0];
      expect(call).toContain('per_page=25');
      expect(call).toContain('page=1');
    });

    it('should handle boolean values in query string', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSearchResults),
      });

      // Although our current API doesn't use booleans, test the handling
      await apiService.searchRepositories({
        q: 'react fork:false',
      });

      const call = fetch.mock.calls[0][0];
      expect(call).toContain('react+fork%3Afalse');
    });
  });
});