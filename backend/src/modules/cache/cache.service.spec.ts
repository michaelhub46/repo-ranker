import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { mockRepository, TestDataGenerator } from '../../test/test-utils';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheService],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    service.clear(); // Clear cache between tests
  });

  describe('Basic Operations', () => {
    it('should store and retrieve cached values', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      service.set(key, value);
      const retrieved = service.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should return null for non-existent keys', () => {
      const result = service.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should delete cached values', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      service.set(key, value);
      service.delete(key);
      const retrieved = service.get(key);

      expect(retrieved).toBeNull();
    });

    it('should clear all cached values', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      
      service.clear();
      
      expect(service.get('key1')).toBeNull();
      expect(service.get('key2')).toBeNull();
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate search keys consistently', () => {
      const query = 'react';
      const params = { sort: 'stars', order: 'desc' };

      const key1 = service.generateSearchKey(query, params);
      const key2 = service.generateSearchKey(query, params);

      expect(key1).toBe(key2);
      expect(key1).toContain('search');
      expect(key1).toContain(query);
    });

    it('should generate different keys for different queries', () => {
      const params = { sort: 'stars', order: 'desc' };
      
      const key1 = service.generateSearchKey('react', params);
      const key2 = service.generateSearchKey('vue', params);

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different parameters', () => {
      const query = 'react';
      
      const key1 = service.generateSearchKey(query, { sort: 'stars' });
      const key2 = service.generateSearchKey(query, { sort: 'forks' });

      expect(key1).not.toBe(key2);
    });

    it('should handle empty or null parameters', () => {
      const query = 'react';
      
      const key1 = service.generateSearchKey(query, {});
      const key2 = service.generateSearchKey(query, null as any);
      const key3 = service.generateSearchKey(query, undefined as any);

      expect(typeof key1).toBe('string');
      expect(typeof key2).toBe('string');
      expect(typeof key3).toBe('string');
    });
  });

  describe('TTL Functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should respect TTL when set', () => {
      const key = 'ttl-test';
      const value = { data: 'expires' };
      const ttlSeconds = 60;

      service.set(key, value, ttlSeconds);
      
      // Should be available immediately
      expect(service.get(key)).toEqual(value);
      
      // Fast forward past TTL
      jest.advanceTimersByTime(ttlSeconds * 1000 + 1000);
      
      // Should be expired
      expect(service.get(key)).toBeNull();
    });

    it('should use default TTL when not specified', () => {
      const key = 'default-ttl-test';
      const value = { data: 'default-expires' };

      service.set(key, value);
      
      // Should be available immediately
      expect(service.get(key)).toEqual(value);
      
      // Fast forward past default TTL (5 minutes)
      jest.advanceTimersByTime(5 * 60 * 1000 + 1000);
      
      // Should be expired
      expect(service.get(key)).toBeNull();
    });
  });

  describe('Repository Caching', () => {
    it('should cache search results properly', () => {
      const query = 'react language:javascript';
      const searchParams = { sort: 'stars', order: 'desc', per_page: 25 };
      const repositories = TestDataGenerator.generateRepositories(5);
      const searchResult = {
        total_count: 1000,
        incomplete_results: false,
        items: repositories,
        page_info: { current_page: 1, per_page: 25, total_pages: 40 },
      };

      const cacheKey = service.generateSearchKey(query, searchParams);
      service.set(cacheKey, searchResult);

      const cached = service.get(cacheKey);
      expect(cached).toEqual(searchResult);
      expect(cached.items).toHaveLength(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed cache keys gracefully', () => {
      const malformedKeys = [null, undefined, '', ' ', '\n', '\t'];
      
      malformedKeys.forEach(key => {
        expect(() => service.set(key as any, 'value')).not.toThrow();
        expect(() => service.get(key as any)).not.toThrow();
        expect(() => service.delete(key as any)).not.toThrow();
      });
    });

    it('should handle circular reference values', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      expect(() => service.set('circular', circularObj)).not.toThrow();
    });

    it('should handle very large values', () => {
      const largeArray = new Array(10000).fill(0).map((_, i) => ({
        id: i,
        data: `large-data-${i}`,
      }));

      expect(() => service.set('large', largeArray)).not.toThrow();
      const retrieved = service.get('large');
      expect(Array.isArray(retrieved)).toBe(true);
      expect(retrieved).toHaveLength(10000);
    });
  });
});
