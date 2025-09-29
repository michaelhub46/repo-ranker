import { Injectable, Logger } from '@nestjs/common';
import { generateCacheKey, groupSimilarRequests } from '../../shared/utils/cache-key.utils';
import { CACHE_TTL } from '../../shared/constants/scoring.constants';

interface CacheItem {
  data: any;
  expiresAt: Date;
  key: string;
}

interface RequestGroup {
  requests: any[];
  groupKey: string;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly cache = new Map<string, CacheItem>();

  /**
   * Get item from cache
   */
  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (new Date() > item.expiresAt) {
      this.cache.delete(key);
      this.logger.debug(`Cache expired and removed: ${key}`);
      return null;
    }

    this.logger.debug(`Cache hit: ${key}`);
    return item.data;
  }

  /**
   * Set item in cache with TTL
   */
  set(key: string, data: any, ttlSeconds?: number): void {
    const ttl = ttlSeconds || CACHE_TTL.SEARCH_RESULTS;
    const expiresAt = new Date(Date.now() + ttl * 1000);
    
    this.cache.set(key, {
      data,
      expiresAt,
      key,
    });

    this.logger.debug(`Cache set: ${key} (expires: ${expiresAt.toISOString()})`);
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug(`Cache deleted: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.logger.log('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = new Date();
    let validItems = 0;
    let expiredItems = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        expiredItems++;
      } else {
        validItems++;
      }
    }

    return {
      total: this.cache.size,
      valid: validItems,
      expired: expiredItems,
      hitRate: this.calculateHitRate(),
    };
  }

  /**
   * Clean up expired items
   */
  cleanup(): number {
    const now = new Date();
    let removed = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      this.logger.log(`Cleaned up ${removed} expired cache items`);
    }

    return removed;
  }

  /**
   * Generate cache key for search requests
   */
  generateSearchKey(query: string, options: any): string {
    return generateCacheKey(query, options);
  }

  /**
   * Check if key exists in cache (without retrieving)
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (new Date() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  private calculateHitRate(): number {
    // This is a simple implementation
    // In production, you'd want to track hits/misses over time
    return 0; // Placeholder
  }
}