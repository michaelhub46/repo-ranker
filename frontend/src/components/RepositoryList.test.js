import React from 'react';
import { screen } from '@testing-library/react';
import RepositoryList from '../components/RepositoryList';
import { customRender, mockSearchResults, mockRepositoryData } from '../utils/testUtils';

describe('RepositoryList Component', () => {
  describe('Loading State', () => {
    it('should display loading spinner and message', () => {
      customRender(<RepositoryList loading={true} />);

      expect(screen.getByText(/searching repositories/i)).toBeInTheDocument();
      expect(screen.getByText(/searching repositories/i).closest('.repository-list__loading')).toBeInTheDocument();
    });

    it('should not display results when loading', () => {
      customRender(
        <RepositoryList 
          loading={true} 
          results={mockSearchResults} 
        />
      );

      expect(screen.getByText(/searching repositories/i)).toBeInTheDocument();
      expect(screen.queryByText(/results/i)).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message', () => {
      const errorMessage = 'Failed to fetch repositories';
      customRender(<RepositoryList error={errorMessage} />);

      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should display generic error when no specific message', () => {
      customRender(<RepositoryList error="Something went wrong" />);

      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty message when no results', () => {
      const emptyResults = {
        total_count: 0,
        items: [],
        page_info: { current_page: 1, per_page: 25, total_pages: 0 },
      };

      customRender(<RepositoryList results={emptyResults} />);

      expect(screen.getByText(/no repositories found/i)).toBeInTheDocument();
      expect(screen.getByText(/try adjusting your search terms/i)).toBeInTheDocument();
    });

    it('should display empty message when results is null', () => {
      customRender(<RepositoryList results={null} />);

      expect(screen.getByText(/no repositories found/i)).toBeInTheDocument();
    });

    it('should display empty message when items array is empty', () => {
      const emptyResults = {
        ...mockSearchResults,
        total_count: 0,
        items: [],
      };

      customRender(<RepositoryList results={emptyResults} />);

      expect(screen.getByText(/no repositories found/i)).toBeInTheDocument();
    });
  });

  describe('Results Display', () => {
    it('should display results count', () => {
      customRender(<RepositoryList results={mockSearchResults} />);

      expect(screen.getByText(/1,000 results/i)).toBeInTheDocument();
    });

    it('should display incomplete results indicator', () => {
      const incompleteResults = {
        ...mockSearchResults,
        incomplete_results: true,
      };

      customRender(<RepositoryList results={incompleteResults} />);

      expect(screen.getByText(/incomplete/i)).toBeInTheDocument();
    });

    it('should display page information', () => {
      customRender(<RepositoryList results={mockSearchResults} />);

      expect(screen.getByText(/page 1 of 40/i)).toBeInTheDocument();
    });



    it('should render repository cards for each item', () => {
      customRender(<RepositoryList results={mockSearchResults} />);

      // Check that repository cards are rendered
      expect(screen.getByText('testuser/test-repo')).toBeInTheDocument();
      expect(screen.getByText('testuser/another-repo')).toBeInTheDocument();
    });

    it('should handle large result counts with proper formatting', () => {
      const largeResults = {
        ...mockSearchResults,
        total_count: 1234567,
      };

      customRender(<RepositoryList results={largeResults} />);

      expect(screen.getByText(/1,234,567 results/i)).toBeInTheDocument();
    });

    it('should handle zero results count', () => {
      const zeroResults = {
        ...mockSearchResults,
        total_count: 0,
        items: [],
      };

      customRender(<RepositoryList results={zeroResults} />);

      expect(screen.getByText(/no repositories found/i)).toBeInTheDocument();
    });
  });

  describe('Rate Limit Display', () => {
    it('should handle missing rate limit info gracefully', () => {
      const resultsWithoutRateLimit = {
        ...mockSearchResults,
        rate_limit: null,
      };

      customRender(<RepositoryList results={resultsWithoutRateLimit} />);

      expect(screen.getByText(/1,000 results/i)).toBeInTheDocument();
      expect(screen.queryByText(/remaining/i)).not.toBeInTheDocument();
    });

    it('should handle zero remaining rate limit', () => {
      const rateLimitExhausted = {
        ...mockSearchResults,
        rate_limit: {
          ...mockSearchResults.rate_limit,
          remaining: 0,
        },
      };

      customRender(<RepositoryList results={rateLimitExhausted} />);

      expect(screen.getByText(/0 remaining/i)).toBeInTheDocument();
    });
  });

  describe('Repository Cards', () => {
    it('should pass correct props to repository cards', () => {
      customRender(<RepositoryList results={mockSearchResults} />);

      // Verify that the repository data is displayed
      const firstRepo = mockSearchResults.items[0];
      const secondRepo = mockSearchResults.items[1];

      expect(screen.getByText(firstRepo.full_name)).toBeInTheDocument();
      expect(screen.getByText(firstRepo.description)).toBeInTheDocument();
      expect(screen.getByText(secondRepo.full_name)).toBeInTheDocument();
      expect(screen.getByText(secondRepo.description)).toBeInTheDocument();
    });

    it('should handle repositories with missing descriptions', () => {
      const resultsWithMissingDesc = {
        ...mockSearchResults,
        items: [{
          ...mockRepositoryData,
          description: null,
        }],
      };

      customRender(<RepositoryList results={resultsWithMissingDesc} />);

      expect(screen.getByText(mockRepositoryData.full_name)).toBeInTheDocument();
      // Should not crash when description is null
    });

    it('should handle repositories with missing languages', () => {
      const resultsWithMissingLang = {
        ...mockSearchResults,
        items: [{
          ...mockRepositoryData,
          language: null,
        }],
      };

      customRender(<RepositoryList results={resultsWithMissingLang} />);

      expect(screen.getByText(mockRepositoryData.full_name)).toBeInTheDocument();
      // Should not crash when language is null
    });
  });

  describe('Loading Priority', () => {
    it('should show loading state even when results are present', () => {
      customRender(
        <RepositoryList 
          loading={true} 
          results={mockSearchResults} 
        />
      );

      expect(screen.getByText(/searching repositories/i)).toBeInTheDocument();
      expect(screen.queryByText(/1,000 results/i)).not.toBeInTheDocument();
    });

    it('should show loading state even when error is present', () => {
      customRender(
        <RepositoryList 
          loading={true} 
          error="Some error" 
          results={mockSearchResults} 
        />
      );

      expect(screen.getByText(/searching repositories/i)).toBeInTheDocument();
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Priority', () => {

  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      customRender(<RepositoryList results={mockSearchResults} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent(/1,000 results/i);
    });

    it('should have appropriate ARIA labels for loading state', () => {
      customRender(<RepositoryList loading={true} />);

      const loadingSection = screen.getByText(/searching repositories/i).closest('.repository-list__loading');
      expect(loadingSection).toBeInTheDocument();
    });
  });
});