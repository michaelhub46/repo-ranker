import React from 'react';
import { screen } from '@testing-library/react';
import RepositoryCard from '../components/RepositoryCard';
import { customRender, mockRepositoryData } from '../utils/testUtils';

describe('RepositoryCard Component', () => {
  const defaultRepository = {
    ...mockRepositoryData,
    popularity_score: 85.5,
    score_breakdown: {
      stars: 40,
      forks: 25,
      activity: 20.5,
    },
  };

  describe('Repository Information Display', () => {
    it('should display repository name as a link', () => {
      customRender(<RepositoryCard repository={defaultRepository} />);

      const nameLink = screen.getByRole('link', { name: defaultRepository.full_name });
      expect(nameLink).toBeInTheDocument();
      expect(nameLink).toHaveAttribute('href', defaultRepository.html_url);
      expect(nameLink).toHaveAttribute('target', '_blank');
      expect(nameLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should display owner avatar', () => {
      customRender(<RepositoryCard repository={defaultRepository} />);

      const avatar = screen.getByAltText(`${defaultRepository.owner.login} avatar`);
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', defaultRepository.owner.avatar_url);
    });

    it('should display repository description', () => {
      customRender(<RepositoryCard repository={defaultRepository} />);

      expect(screen.getByText(defaultRepository.description)).toBeInTheDocument();
    });

    it('should display language with colored dot', () => {
      customRender(<RepositoryCard repository={defaultRepository} />);

      expect(screen.getByText(defaultRepository.language)).toBeInTheDocument();
      const languageDot = document.querySelector('.repository-card__language-dot');
      expect(languageDot).toBeInTheDocument();
    });

    it('should display popularity score', () => {
      customRender(<RepositoryCard repository={defaultRepository} />);

      expect(screen.getByText('85.50')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();
    });
  });

  describe('Statistics Display', () => {
    it('should display stars count', () => {
      customRender(<RepositoryCard repository={defaultRepository} />);

      expect(screen.getByText('100')).toBeInTheDocument(); // stargazers_count
    });

    it('should display forks count', () => {
      customRender(<RepositoryCard repository={defaultRepository} />);

      expect(screen.getByText('25')).toBeInTheDocument(); // forks_count
    });

    it('should display watchers count', () => {
      customRender(<RepositoryCard repository={defaultRepository} />);

      expect(screen.getByText('50')).toBeInTheDocument(); // watchers_count
    });

    it('should display open issues count', () => {
      customRender(<RepositoryCard repository={defaultRepository} />);

      expect(screen.getByText('5')).toBeInTheDocument(); // open_issues_count
    });

    it('should format large numbers correctly', () => {
      const repoWithLargeNumbers = {
        ...defaultRepository,
        stargazers_count: 1500,
        forks_count: 2500000,
        watchers_count: 750,
      };

      customRender(<RepositoryCard repository={repoWithLargeNumbers} />);

      expect(screen.getByText('1.5k')).toBeInTheDocument(); // stars
      expect(screen.getByText('2.5M')).toBeInTheDocument(); // forks
      expect(screen.getByText('750')).toBeInTheDocument(); // watchers (under 1k)
    });
  });

  describe('Date Formatting', () => {
    it('should display "just now" for very recent updates', () => {
      const recentRepo = {
        ...defaultRepository,
        updated_at: new Date().toISOString(),
      };

      customRender(<RepositoryCard repository={recentRepo} />);

      expect(screen.getByText(/updated just now/i)).toBeInTheDocument();
    });

    it('should display hours ago for recent updates', () => {
      const hoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
      const recentRepo = {
        ...defaultRepository,
        updated_at: hoursAgo,
      };

      customRender(<RepositoryCard repository={recentRepo} />);

      expect(screen.getByText(/updated 2 hours ago/i)).toBeInTheDocument();
    });

    it('should display days ago for older updates', () => {
      const daysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days ago
      const oldRepo = {
        ...defaultRepository,
        updated_at: daysAgo,
      };

      customRender(<RepositoryCard repository={oldRepo} />);

      expect(screen.getByText(/updated 5 days ago/i)).toBeInTheDocument();
    });

    it('should display months ago for very old updates', () => {
      const monthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(); // ~2 months ago
      const oldRepo = {
        ...defaultRepository,
        updated_at: monthsAgo,
      };

      customRender(<RepositoryCard repository={oldRepo} />);

      expect(screen.getByText(/updated 2 months ago/i)).toBeInTheDocument();
    });
  });

  describe('Missing Data Handling', () => {
    it('should handle missing description', () => {
      const repoWithoutDesc = {
        ...defaultRepository,
        description: null,
      };

      customRender(<RepositoryCard repository={repoWithoutDesc} />);

      expect(screen.getByText('No description available')).toBeInTheDocument();
    });

    it('should handle empty description', () => {
      const repoWithEmptyDesc = {
        ...defaultRepository,
        description: '',
      };

      customRender(<RepositoryCard repository={repoWithEmptyDesc} />);

      expect(screen.getByText('No description available')).toBeInTheDocument();
    });

    it('should handle missing language', () => {
      const repoWithoutLanguage = {
        ...defaultRepository,
        language: null,
      };

      customRender(<RepositoryCard repository={repoWithoutLanguage} />);

      // Language section should not be rendered
      expect(screen.queryByText(defaultRepository.language)).not.toBeInTheDocument();
    });

    it('should handle missing popularity score', () => {
      const repoWithoutScore = {
        ...defaultRepository,
        popularity_score: null,
      };

      customRender(<RepositoryCard repository={repoWithoutScore} />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();
    });

    it('should handle undefined popularity score', () => {
      const repoWithoutScore = {
        ...defaultRepository,
        popularity_score: undefined,
      };

      customRender(<RepositoryCard repository={repoWithoutScore} />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('Language Colors', () => {
    it('should apply correct color for JavaScript', () => {
      const jsRepo = {
        ...defaultRepository,
        language: 'JavaScript',
      };

      customRender(<RepositoryCard repository={jsRepo} />);

      const languageDot = document.querySelector('.repository-card__language-dot');
      expect(languageDot).toHaveStyle({ backgroundColor: '#f1e05a' });
    });

    it('should apply correct color for Python', () => {
      const pythonRepo = {
        ...defaultRepository,
        language: 'Python',
      };

      customRender(<RepositoryCard repository={pythonRepo} />);

      const languageDot = document.querySelector('.repository-card__language-dot');
      expect(languageDot).toHaveStyle({ backgroundColor: '#3572A5' });
    });

    it('should apply correct color for TypeScript', () => {
      const tsRepo = {
        ...defaultRepository,
        language: 'TypeScript',
      };

      customRender(<RepositoryCard repository={tsRepo} />);

      const languageDot = document.querySelector('.repository-card__language-dot');
      expect(languageDot).toHaveStyle({ backgroundColor: '#2b7489' });
    });

    it('should apply default color for unknown language', () => {
      const unknownRepo = {
        ...defaultRepository,
        language: 'UnknownLanguage',
      };

      customRender(<RepositoryCard repository={unknownRepo} />);

      const languageDot = document.querySelector('.repository-card__language-dot');
      expect(languageDot).toHaveStyle({ backgroundColor: '#858585' });
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for avatar', () => {
      customRender(<RepositoryCard repository={defaultRepository} />);

      const avatar = screen.getByAltText(`${defaultRepository.owner.login} avatar`);
      expect(avatar).toBeInTheDocument();
    });

    it('should have accessible link for repository name', () => {
      customRender(<RepositoryCard repository={defaultRepository} />);

      const link = screen.getByRole('link', { name: defaultRepository.full_name });
      expect(link).toBeInTheDocument();
    });

    it('should have proper semantic structure', () => {
      const { container } = customRender(<RepositoryCard repository={defaultRepository} />);

      expect(container.querySelector('.repository-card')).toBeInTheDocument();
      expect(container.querySelector('.repository-card__header')).toBeInTheDocument();
      expect(container.querySelector('.repository-card__description')).toBeInTheDocument();
      expect(container.querySelector('.repository-card__stats')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values correctly', () => {
      const repoWithZeros = {
        ...defaultRepository,
        stargazers_count: 0,
        forks_count: 0,
        watchers_count: 0,
        open_issues_count: 0,
        popularity_score: 0,
      };

      customRender(<RepositoryCard repository={repoWithZeros} />);

      expect(screen.getAllByText('0')).toHaveLength(4); // All stats show 0
      expect(screen.getByText('0.00')).toBeInTheDocument(); // Score shows 0.00
    });

    it('should handle very long repository names', () => {
      const repoWithLongName = {
        ...defaultRepository,
        full_name: 'very-long-organization-name/very-long-repository-name-that-might-overflow',
      };

      customRender(<RepositoryCard repository={repoWithLongName} />);

      expect(screen.getByText(repoWithLongName.full_name)).toBeInTheDocument();
    });

    it('should handle very long descriptions', () => {
      const repoWithLongDesc = {
        ...defaultRepository,
        description: 'This is a very long description that might span multiple lines and should be handled gracefully by the component without breaking the layout or causing any display issues.',
      };

      customRender(<RepositoryCard repository={repoWithLongDesc} />);

      expect(screen.getByText(repoWithLongDesc.description)).toBeInTheDocument();
    });
  });

  describe('Number Formatting Edge Cases', () => {
    it('should handle exactly 1000', () => {
      const repo = {
        ...defaultRepository,
        stargazers_count: 1000,
      };

      customRender(<RepositoryCard repository={repo} />);

      expect(screen.getByText('1.0k')).toBeInTheDocument();
    });

    it('should handle exactly 1 million', () => {
      const repo = {
        ...defaultRepository,
        stargazers_count: 1000000,
      };

      customRender(<RepositoryCard repository={repo} />);

      expect(screen.getByText('1.0M')).toBeInTheDocument();
    });
  });
});