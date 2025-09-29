# GitHub Repository Ranker

A sophisticated GitHub repository search and ranking system that provides intelligent scoring based on popularity, activity, and recency metrics.

## 📋 Summary

The Repository Ranker analyzes GitHub repositories using a multi-factor scoring algorithm to help developers discover the most valuable and active projects. It combines stars, forks, recency, and activity metrics to provide comprehensive repository rankings with caching and rate limiting for optimal performance.

## 🛠️ Tech Stack

### Backend
- **NestJS** - TypeScript framework with dependency injection
- **Node.js** - Runtime environment
- **TypeScript** - Static typing and enhanced developer experience
- **Axios** - HTTP client for GitHub API integration
- **Class Validator** - DTO validation and transformation

### Frontend
- **React** - User interface library
- **JavaScript (ES6+)** - Frontend logic
- **CSS3 with BEM** - Styling methodology
- **Fetch API** - HTTP requests to backend

### Infrastructure
- **GitHub API v3** - Repository data source
- **In-Memory Caching** - Request optimization
- **Rate Limiting** - API protection
- **CORS** - Cross-origin resource sharing

## 🚀 How to Run

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- GitHub Personal Access Token (optional, for higher rate limits)

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Add your GitHub token to .env (optional)
# GITHUB_TOKEN=your_github_token_here

# Start the development server
npm run start:dev
```

The backend will be available at `http://localhost:3001`

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will be available at `http://localhost:3000`

### API Endpoints
- **Health Check**: `GET /api/repositories/health`
- **Search Repositories**: `GET /api/repositories/search?q=react+language:javascript&sort=stars&order=desc&per_page=25&page=1`


## ✅ Implemented Features

### Core Functionality
- ✅ **Multi-Factor Scoring Algorithm**
  ```
  Total Score = Stars(40%) + Forks(25%) + Recency(20%) + Activity(15%)
  
  Stars Score = log₁₀(stars + 1) × 0.4
  Forks Score = log₁₀(forks + 1) × 0.25  
  Recency Score = max(0, (365 - days_since_update) / 365) × 0.2
  Activity Score = (Watchers(60%) + Issues(40%)) × 0.15
  ```

- ✅ **GitHub API Integration**
  - Authentication with personal access tokens
  - Comprehensive error handling and retry logic
  - Rate limit monitoring and management

- ✅ **Caching System**
  ```javascript
  generateKey(query, options) {
      const { q, language, created, sort, order, per_page, page } = options;
      return `search:${q}:${language || ''}:${created || ''}:${sort}:${order}:${per_page}:${page}`;
  }
  ```

- ✅ **Request Queue & Batching**
  ```javascript
  groupSimilarRequests(requests) {
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
  ```

- ✅ **Rate Limiting**
  - Client request rate limiting
  - GitHub API rate limit tracking
  - Exponential backoff on failures

- ✅ **Frontend Interface**
  - Repository search with filters (language, date range)
  - BEM CSS methodology with design system
  - Responsive and accessible design
  - Date range suggestions (Today, This week, This month, This year)

### Architecture
- ✅ **Modular NestJS Architecture**
  - Feature-based modules (GitHub, Scoring, Cache, Repositories)
  - Shared utilities and configuration
  - Dependency injection and separation of concerns

- ✅ **Error Handling & Logging**
  - Global exception filters
  - Comprehensive request/response logging
  - Structured error responses

- ✅ **Input Validation**
  - DTO validation with class-validator
  - Request sanitization and transformation

## 🔄 Pending Implementation

### Database Layer
- [ ] **PostgreSQL Integration**
  - Repository metadata storage
  - Search result caching with JSONB
  - API usage analytics tracking
  - Rate limiting data persistence
  - Popular search trends analysis

### Advanced Features  
- [ ] **Background Jobs**
  - Repository data refresh scheduling
  - Cache cleanup and maintenance
  - Popular repository proactive caching

- [ ] **Analytics Module**
  - Usage pattern monitoring
  - Performance metrics tracking
  - Search trend analysis
  - User behavior insights

- [ ] **Enhanced Caching**
  - Redis integration for distributed caching
  - Cache warming strategies
  - Partial match caching optimization

- [ ] **Additional Metrics**
  - Update frequency analysis
  - Contributor count (requires additional API calls)
  - Issue resolution rates
  - Community health metrics

### Scalability Improvements
- [ ] **Microservices Architecture**
  - Service decomposition
  - API Gateway implementation
  - Load balancing strategies

- [ ] **Performance Optimization**
  - Database query optimization
  - Response compression
  - CDN integration for static assets

## 🏗️ Architecture Overview

```
├── Backend (NestJS)
│   ├── modules/
│   │   ├── repositories/     # Main API endpoints
│   │   ├── github/          # GitHub API integration
│   │   ├── scoring/         # Scoring algorithms
│   │   ├── cache/           # Caching & rate limiting
│   │   ├── analytics/       # Usage tracking (pending)
│   │   └── background-jobs/ # Scheduled tasks (pending)
│   └── shared/             # Utilities & configuration
│
├── Frontend (React)
│   ├── components/         # UI components
│   ├── services/          # API communication
│   └── styles/           # BEM CSS styling
│
└── Database (Planned)
    ├── Repository metadata
    ├── Cache storage
    └── Analytics data
```

## 🔧 Configuration

Key environment variables:
```env
# Application
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000

# GitHub API
GITHUB_TOKEN=your_token_here
GITHUB_API_URL=https://api.github.com
GITHUB_TIMEOUT=5000
GITHUB_MAX_RETRIES=3
GITHUB_RATE_LIMIT_BUFFER=10
```

## 📊 Current Status

- **Core Features**: 85% complete
- **Frontend Interface**: 90% complete  
- **Backend API**: 90% complete
- **Unit Tests**: ✅ Complete (70%+ coverage)
- **Integration Tests**: ✅ Complete
- **Database Layer**: 0% complete (pending)
- **Analytics**: 0% complete (pending)
- **Background Jobs**: 0% complete (pending)

The system is currently functional for repository search and ranking with in-memory caching and rate limiting. Database integration and advanced analytics features are planned for future releases.


