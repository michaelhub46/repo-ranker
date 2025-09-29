import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from '../src/shared/filters/http-exception.filter';
import nock from 'nock';

describe('Repository Ranking API (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Set up global pipes and filters like in main.ts
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    // Clean up nock
    nock.cleanAll();
    nock.restore();
    
    // Close HTTP server first
    if (httpServer) {
      httpServer.close();
    }
    
    // Close NestJS application
    if (app) {
      await app.close();
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  beforeEach(() => {
    // Clean up nock after each test
    nock.cleanAll();
  });

  afterEach(() => {
    // Ensure nock is clean after each test
    if (!nock.isDone()) {
      nock.cleanAll();
    }
  });

  describe('/api/repositories/health (GET)', () => {
    it('should return health status', () => {
      return request(httpServer)
        .get('/api/repositories/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
        });
    });
  });

  describe('/api/repositories/search (GET)', () => {
    beforeEach(() => {
      // Mock GitHub API responses
      nock('https://api.github.com')
        .get('/search/repositories')
        .query(true) // Accept any query parameters
        .reply(200, {
          total_count: 2,
          incomplete_results: false,
          items: [
            {
              id: 123456,
              name: 'test-repo-1',
              full_name: 'testuser/test-repo-1',
              owner: {
                login: 'testuser',
                id: 12345,
                avatar_url: 'https://avatars.githubusercontent.com/u/12345',
                html_url: 'https://github.com/testuser',
              },
              private: false,
              html_url: 'https://github.com/testuser/test-repo-1',
              description: 'A test repository',
              fork: false,
              url: 'https://api.github.com/repos/testuser/test-repo-1',
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              pushed_at: '2024-12-01T00:00:00Z',
              stargazers_count: 100,
              watchers_count: 50,
              language: 'TypeScript',
              forks_count: 25,
              open_issues_count: 5,
              default_branch: 'main',
              score: 1.0,
            },
          ],
        }, {
          'x-ratelimit-limit': '5000',
          'x-ratelimit-remaining': '4999',
          'x-ratelimit-reset': Math.floor(Date.now() / 1000 + 3600).toString(),
          'x-ratelimit-used': '1',
          'x-ratelimit-resource': 'search',
        });
    });

    it('should search repositories successfully', () => {
      return request(httpServer)
        .get('/api/repositories/search')
        .query({ q: 'react' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total_count');
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('page_info');
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });

    it('should return 400 for missing query parameter', () => {
      return request(httpServer)
        .get('/api/repositories/search')
        .expect(400);
    });

    it('should search with complex query parameters', () => {
      return request(httpServer)
        .get('/api/repositories/search')
        .query({
          q: 'typescript language:typescript created:>2023-01-01',
          sort: 'stars',
          order: 'desc',
          per_page: 10,
          page: 1,
        })
        .expect(200);
    });
  });
});
