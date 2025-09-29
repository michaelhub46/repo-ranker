import { Injectable, Logger } from '@nestjs/common';
import { groupSimilarRequests } from '../../shared/utils/cache-key.utils';

interface QueuedRequest {
  id: string;
  query: string;
  options: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: Date;
}

interface RequestBatch {
  groupKey: string;
  requests: QueuedRequest[];
}

@Injectable()
export class RequestQueueService {
  private readonly logger = new Logger(RequestQueueService.name);
  private readonly requestQueue: QueuedRequest[] = [];
  private readonly processingInterval = 100; // ms
  private processingTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startProcessing();
  }

  /**
   * Add request to queue
   */
  async queueRequest(query: string, options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id: this.generateRequestId(),
        query,
        options,
        resolve,
        reject,
        timestamp: new Date(),
      };

      this.requestQueue.push(request);
      this.logger.debug(`Queued request ${request.id} for query: ${query}`);
    });
  }

  /**
   * Start processing requests in batches
   */
  private startProcessing(): void {
    this.processingTimer = setInterval(() => {
      this.processQueue();
    }, this.processingInterval);
  }

  /**
   * Stop processing requests
   */
  stopProcessing(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }
  }

  /**
   * Process queued requests in batches
   */
  private processQueue(): void {
    if (this.requestQueue.length === 0) {
      return;
    }

    // Get requests to process
    const requestsToProcess = this.requestQueue.splice(0, 10); // Process up to 10 at a time
    
    // Group similar requests as per README specification
    const groupedRequests = this.groupRequests(requestsToProcess);
    
    // Process each group
    groupedRequests.forEach(batch => {
      this.processBatch(batch);
    });
  }

  /**
   * Group requests by language and sort criteria as specified in README
   */
  private groupRequests(requests: QueuedRequest[]): RequestBatch[] {
    const groups = new Map<string, QueuedRequest[]>();
    
    requests.forEach(req => {
      // Group by language + sort criteria as per README
      const groupKey = `${req.options.language || 'any'}:${req.options.sort}:${req.options.order}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(req);
    });
    
    return Array.from(groups.entries()).map(([groupKey, requests]) => ({
      groupKey,
      requests,
    }));
  }

  /**
   * Process a batch of similar requests
   */
  private async processBatch(batch: RequestBatch): Promise<void> {
    this.logger.debug(`Processing batch ${batch.groupKey} with ${batch.requests.length} requests`);
    
    try {
      // In a real implementation, this would:
      // 1. Make optimized API calls for the group
      // 2. Distribute results to individual requests
      // 3. Cache results for future use
      
      // For now, simulate batch processing
      const results = await this.simulateBatchProcessing(batch);
      
      // Distribute results to individual requests
      batch.requests.forEach((request, index) => {
        request.resolve(results[index] || null);
      });
      
    } catch (error) {
      this.logger.error(`Batch processing failed for ${batch.groupKey}:`, error);
      
      // Reject all requests in the batch
      batch.requests.forEach(request => {
        request.reject(error);
      });
    }
  }

  /**
   * Simulate batch processing (placeholder for real implementation)
   */
  private async simulateBatchProcessing(batch: RequestBatch): Promise<any[]> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Return mock results for each request
    return batch.requests.map(request => ({
      query: request.query,
      options: request.options,
      results: [], // Mock results
      processed_at: new Date(),
      batch_id: batch.groupKey,
    }));
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    const now = new Date();
    const oldRequests = this.requestQueue.filter(
      req => now.getTime() - req.timestamp.getTime() > 5000 // 5 seconds old
    );

    return {
      queueLength: this.requestQueue.length,
      oldRequests: oldRequests.length,
      isProcessing: this.processingTimer !== null,
    };
  }

  /**
   * Clear old requests from queue
   */
  clearOldRequests(maxAgeMs = 30000): number {
    const now = new Date();
    const initialLength = this.requestQueue.length;
    
    const validRequests = this.requestQueue.filter(req => {
      const age = now.getTime() - req.timestamp.getTime();
      return age <= maxAgeMs;
    });
    
    this.requestQueue.length = 0;
    this.requestQueue.push(...validRequests);
    
    const removed = initialLength - this.requestQueue.length;
    if (removed > 0) {
      this.logger.warn(`Removed ${removed} old requests from queue`);
    }
    
    return removed;
  }
}