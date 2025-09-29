import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchPanel from './SearchPanel';

describe('SearchPanel Component', () => {
  let mockOnSearch;

  beforeEach(() => {
    mockOnSearch = jest.fn();
  });

  describe('Basic Rendering', () => {
    it('should render search form with all fields', () => {
      render(<SearchPanel onSearch={mockOnSearch} />);

      expect(screen.getByText('GitHub Repository Ranker')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search repositories/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('Any Language')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Stars')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('should have default values set correctly', () => {
      render(<SearchPanel onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText(/search repositories/i);
      const languageSelect = screen.getByDisplayValue('Any Language');
      const sortSelect = screen.getByDisplayValue('Stars');

      expect(searchInput).toHaveValue('');
      expect(languageSelect).toHaveValue('');
      expect(sortSelect).toHaveValue('stars');
    });
  });

  describe('Form Interactions', () => {
    it('should update search input value', async () => {
      render(<SearchPanel onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText(/search repositories/i);
      await userEvent.type(searchInput, 'react');

      expect(searchInput).toHaveValue('react');
    });

    it('should update language selection', async () => {
      render(<SearchPanel onSearch={mockOnSearch} />);

      const languageSelect = screen.getByDisplayValue('Any Language');
      await userEvent.selectOptions(languageSelect, 'javascript');

      expect(languageSelect).toHaveValue('javascript');
    });

    it('should update sort selection', async () => {
      render(<SearchPanel onSearch={mockOnSearch} />);

      const sortSelect = screen.getByDisplayValue('Stars');
      await userEvent.selectOptions(sortSelect, 'forks');

      expect(sortSelect).toHaveValue('forks');
    });
  });

  describe('Search Functionality', () => {
    it('should build query with language filter', async () => {
      render(<SearchPanel onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText(/search repositories/i);
      const languageSelect = screen.getByDisplayValue('Any Language');
      const searchButton = screen.getByRole('button', { name: /search/i });

      await userEvent.type(searchInput, 'react');
      await userEvent.selectOptions(languageSelect, 'javascript');
      await userEvent.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith({
        q: 'react language:javascript',
        sort: 'stars',
        order: 'desc'
      });
    });

    it('should handle form submission with Enter key', async () => {
      render(<SearchPanel onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText(/search repositories/i);
      
      await userEvent.type(searchInput, 'nodejs');
      await userEvent.keyboard('{Enter}');

      expect(mockOnSearch).toHaveBeenCalledWith({
        q: 'nodejs',
        sort: 'stars',
        order: 'desc'
      });
    });
  });

  describe('Validation', () => {
    it('should show alert for empty search query', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<SearchPanel onSearch={mockOnSearch} />);

      const searchButton = screen.getByRole('button', { name: /search/i });
      await userEvent.click(searchButton);

      expect(alertSpy).toHaveBeenCalledWith('Please enter a search query');
      expect(mockOnSearch).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('should trim whitespace from search query', async () => {
      render(<SearchPanel onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText(/search repositories/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      await userEvent.type(searchInput, '  react native  ');
      await userEvent.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith({
        q: 'react native',
        sort: 'stars',
        order: 'desc'
      });
    });
  });

  describe('Language Options', () => {
    it('should display all supported languages', () => {
      render(<SearchPanel onSearch={mockOnSearch} />);

      const languageSelect = screen.getByDisplayValue('Any Language');
      const options = Array.from(languageSelect.options).map(option => option.value);

      expect(options).toContain('javascript');
      expect(options).toContain('python');
      expect(options).toContain('typescript');
      expect(options).toContain('java');
    });
  });

  describe('Sort Options', () => {
    it('should display all sort options', () => {
      render(<SearchPanel onSearch={mockOnSearch} />);

      const sortSelect = screen.getByDisplayValue('Stars');
      const options = Array.from(sortSelect.options).map(option => option.value);

      expect(options).toContain('stars');
      expect(options).toContain('forks');
      expect(options).toContain('updated');
    });

    it('should update sort order when changed', async () => {
      render(<SearchPanel onSearch={mockOnSearch} />);

      const sortSelect = screen.getByDisplayValue('Stars');
      const orderSelect = screen.getByDisplayValue('Descending');
      const searchInput = screen.getByPlaceholderText(/search repositories/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      await userEvent.selectOptions(sortSelect, 'forks');
      await userEvent.selectOptions(orderSelect, 'asc');
      await userEvent.type(searchInput, 'test');
      await userEvent.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith({
        q: 'test',
        sort: 'forks',
        order: 'asc'
      });
    });
  });
});
