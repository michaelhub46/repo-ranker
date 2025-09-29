import 'reflect-metadata';

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.GITHUB_API_URL = 'https://api.github.com';
  process.env.GITHUB_TIMEOUT = '5000';
  process.env.GITHUB_MAX_RETRIES = '3';
  process.env.CACHE_TTL = '300';
  process.env.RATE_LIMIT_PER_MINUTE = '100';
});

// Global test teardown
afterAll(() => {
  // Clean up any global resources
});

// Setup fake timers for consistent testing
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});
