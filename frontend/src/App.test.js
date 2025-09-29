import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock the API service
jest.mock('./services/apiService', () => ({
  searchRepositories: jest.fn(),
}));

import apiService from './services/apiService';

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render the main app structure', () => {
      render(<App />);
      
      // Check that main elements are present
      expect(screen.getByText('GitHub Repository Ranker')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search repositories/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('should not show results initially', () => {
      render(<App />);
      
      // Should not show results or pagination initially
      expect(screen.queryByText(/results/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/page/i)).not.toBeInTheDocument();
    });

    it('should not show error initially', () => {
      render(<App />);
      
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  describe('Search Integration', () => {
    it('should call API when search is performed', async () => {
      const mockResults = {
        total_count: 1,
        items: [],
        page_info: { current_page: 1, total_pages: 1 }
      };
      
      apiService.searchRepositories.mockResolvedValue(mockResults);
      render(<App />);

      const searchInput = screen.getByPlaceholderText(/search repositories/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      await act(async () => {
        await userEvent.type(searchInput, 'react');
        await userEvent.click(searchButton);
      });

      await waitFor(() => {
        expect(apiService.searchRepositories).toHaveBeenCalledWith(
          expect.objectContaining({
            q: expect.stringContaining('react'),
            page: 1,
            per_page: 25
          })
        );
      });
    });

    it('should show loading state during search', async () => {
      // Create a promise we can control
      let resolveSearch;
      const searchPromise = new Promise((resolve) => {
        resolveSearch = resolve;
      });
      
      apiService.searchRepositories.mockReturnValue(searchPromise);
      render(<App />);

      const searchInput = screen.getByPlaceholderText(/search repositories/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      await act(async () => {
        await userEvent.type(searchInput, 'test');
        await userEvent.click(searchButton);
      });

      // Should show loading state
      expect(screen.getByText(/searching repositories/i)).toBeInTheDocument();

      // Resolve the promise to cleanup
      await act(async () => {
        resolveSearch({ total_count: 0, items: [], page_info: { current_page: 1, total_pages: 0 } });
      });
    });

    it('should handle search errors', async () => {
      apiService.searchRepositories.mockRejectedValue(new Error('Network error'));
      render(<App />);

      const searchInput = screen.getByPlaceholderText(/search repositories/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      await act(async () => {
        await userEvent.type(searchInput, 'test');
        await userEvent.click(searchButton);
      });

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('State Management', () => {
    it('should clear error on new search', async () => {
      // First search fails
      apiService.searchRepositories.mockRejectedValueOnce(new Error('First error'));
      render(<App />);

      const searchInput = screen.getByPlaceholderText(/search repositories/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      // Trigger first search that fails
      await act(async () => {
        await userEvent.clear(searchInput);
        await userEvent.type(searchInput, 'fail');
        await userEvent.click(searchButton);
      });

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/First error/i)).toBeInTheDocument();
      });

      // Second search succeeds
      apiService.searchRepositories.mockResolvedValue({
        total_count: 0,
        items: [],
        page_info: { current_page: 1, total_pages: 0 }
      });

      await act(async () => {
        await userEvent.clear(searchInput);
        await userEvent.type(searchInput, 'success');
        await userEvent.click(searchButton);
      });

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/First error/i)).not.toBeInTheDocument();
      });
    });
  });
});
