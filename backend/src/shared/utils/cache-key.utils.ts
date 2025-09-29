/**
 * Generate cache key for search queries as specified in README
 */
export function generateCacheKey(query: string, options: {
  language?: string;
  created?: string;
  sort?: string;
  order?: string;
  per_page?: number;
  page?: number;
}): string {
  const { q, language, created, sort, order, per_page, page } = { q: query, ...options };
  return `search:${q}:${language || ''}:${created || ''}:${sort}:${order}:${per_page}:${page}`;
}

/**
 * Group similar requests for batching as specified in README
 */
export function groupSimilarRequests(requests: any[]): any[][] {
  const groups = new Map();
  
  requests.forEach(req => {
    // Group by language + sort criteria
    const groupKey = `${req.options.language || 'any'}:${req.options.sort}:${req.options.order}`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey).push(req);
  });
  
  return Array.from(groups.values());
}

/**
 * Extract repository ID from various formats
 */
export function extractRepositoryId(repo: any): string {
  return repo.id?.toString() || repo.full_name || '';
}