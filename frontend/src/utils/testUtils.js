// Test utilities for frontend testing
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock data generators
export const mockRepositoryData = {
  id: 123456,
  name: 'test-repo',
  full_name: 'testuser/test-repo',
  owner: {
    login: 'testuser',
    id: 12345,
    avatar_url: 'https://avatars.githubusercontent.com/u/12345',
    html_url: 'https://github.com/testuser',
  },
  private: false,
  html_url: 'https://github.com/testuser/test-repo',
  description: 'A test repository for unit testing',
  fork: false,
  url: 'https://api.github.com/repos/testuser/test-repo',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  pushed_at: '2024-12-01T00:00:00Z',
  stargazers_count: 100,
  watchers_count: 50,
  language: 'JavaScript',
  forks_count: 25,
  open_issues_count: 5,
  default_branch: 'main',
  score: 1.0,
};

export const mockSearchResults = {
  total_count: 1000,
  incomplete_results: false,
  items: [
    mockRepositoryData,
    {
      ...mockRepositoryData,
      id: 123457,
      name: 'another-repo',
      full_name: 'testuser/another-repo',
      html_url: 'https://github.com/testuser/another-repo',
      description: 'Another test repository',
      stargazers_count: 200,
      language: 'TypeScript',
    },
  ],
  page_info: {
    current_page: 1,
    per_page: 25,
    total_pages: 40,
    has_next_page: true,
    has_previous_page: false,
  },
  rate_limit: {
    limit: 5000,
    remaining: 4999,
    reset: new Date(Date.now() + 3600000),
    used: 1,
    resource: 'search',
  },
  scoring_info: {
    algorithm_version: '1.0',
    factors: ['stars', 'forks', 'activity'],
  },
};

// Custom render function with common providers
export const customRender = (ui, options = {}) => {
  return render(ui, {
    // Add any global providers here if needed
    ...options,
  });
};

// Mock API service
export const mockApiService = {
  searchRepositories: jest.fn(),
  getHealthCheck: jest.fn(),
};

// Test helpers
export const TestHelpers = {
  // Wait for loading state to finish
  waitForLoadingToFinish: async () => {
    const loadingElement = screen.queryByText(/searching repositories/i);
    if (loadingElement) {
      await screen.findByText(/results/i, {}, { timeout: 3000 });
    }
  },

  // Fill search form
  fillSearchForm: async (user, query = 'react', language = 'javascript') => {
    const searchInput = screen.getByPlaceholderText(/search repositories/i);
    await user.clear(searchInput);
    await user.type(searchInput, query);

    if (language) {
      const languageSelect = screen.getByLabelText(/language/i);
      await user.selectOptions(languageSelect, language);
    }
  },

  // Submit search form
  submitSearch: async (user) => {
    const searchButton = screen.getByRole('button', { name: /search repositories/i });
    await user.click(searchButton);
  },

  // Mock fetch responses
  mockFetchSuccess: (data) => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(data),
      })
    );
  },

  mockFetchError: (status = 500, message = 'Server Error') => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status,
        json: () => Promise.resolve({ message }),
      })
    );
  },

  mockFetchNetworkError: () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Network Error'))
    );
  },
};

// Assertion helpers
export const ExpectHelpers = {
  expectLoadingState: () => {
    expect(screen.getByText(/searching repositories/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar') || screen.getByTestId('loading-spinner')).toBeInTheDocument();
  },

  expectErrorState: (errorMessage) => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
    if (errorMessage) {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    }
  },

  expectEmptyState: () => {
    expect(screen.getByText(/no repositories found/i)).toBeInTheDocument();
  },

  expectResults: (count) => {
    expect(screen.getByText(new RegExp(`${count.toLocaleString()} results`, 'i'))).toBeInTheDocument();
  },

  expectRepositoryCard: (repo) => {
    expect(screen.getByText(repo.full_name)).toBeInTheDocument();
    expect(screen.getByText(repo.description)).toBeInTheDocument();
    expect(screen.getByText(repo.language)).toBeInTheDocument();
  },
};

// Re-export testing library utilities
export { render, screen, userEvent };
export * from '@testing-library/react';