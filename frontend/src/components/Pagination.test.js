import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from '../components/Pagination';
import { customRender } from '../utils/testUtils';

describe('Pagination Component', () => {
  let mockOnPageChange;
  let mockOnPerPageChange;

  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    totalResults: 250,
    perPage: 25,
    onPageChange: jest.fn(),
    onPerPageChange: jest.fn(),
  };

  beforeEach(() => {
    mockOnPageChange = jest.fn();
    mockOnPerPageChange = jest.fn();
  });

  describe('Rendering Conditions', () => {
    it('should render pagination when totalPages > 1', () => {
      customRender(
        <Pagination 
          {...defaultProps} 
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      expect(screen.getByText(/showing 1-25 of 250 results/i)).toBeInTheDocument();
    });

    it('should not render when totalPages <= 1', () => {
      const { container } = customRender(
        <Pagination 
          {...defaultProps}
          totalPages={1}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render when totalPages is 0', () => {
      const { container } = customRender(
        <Pagination 
          {...defaultProps}
          totalPages={0}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Results Display', () => {
    it('should show correct range on first page', () => {
      customRender(
        <Pagination 
          {...defaultProps}
          currentPage={1}
          perPage={25}
          totalResults={250}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      expect(screen.getByText(/showing 1-25 of 250 results/i)).toBeInTheDocument();
    });

    it('should show correct range on middle page', () => {
      customRender(
        <Pagination 
          {...defaultProps}
          currentPage={5}
          perPage={25}
          totalResults={250}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      expect(screen.getByText(/showing 101-125 of 250 results/i)).toBeInTheDocument();
    });

    it('should show correct range on last page', () => {
      customRender(
        <Pagination 
          {...defaultProps}
          currentPage={10}
          perPage={25}
          totalResults={250}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      expect(screen.getByText(/showing 226-250 of 250 results/i)).toBeInTheDocument();
    });

    it('should show correct range when results do not fill last page', () => {
      customRender(
        <Pagination 
          {...defaultProps}
          currentPage={3}
          perPage={25}
          totalResults={65}
          totalPages={3}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      expect(screen.getByText(/showing 51-65 of 65 results/i)).toBeInTheDocument();
    });

  });

  describe('GitHub API Limit Handling', () => {
    it('should show API limit notice when results > 1000', () => {
      customRender(
        <Pagination 
          {...defaultProps}
          totalResults={2500}
          totalPages={100}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      expect(screen.getByText(/github api limit: first 1000 results only/i)).toBeInTheDocument();
      expect(screen.getByText(/showing 1-25 of 1,000 results/i)).toBeInTheDocument();
    });

    it('should not show API limit notice when results <= 1000', () => {
      customRender(
        <Pagination 
          {...defaultProps}
          totalResults={500}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      expect(screen.queryByText(/github api limit/i)).not.toBeInTheDocument();
    });
  });

  describe('Per Page Selection', () => {
    it('should display current per page value', () => {
      customRender(
        <Pagination 
          {...defaultProps}
          perPage={25}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      const select = screen.getByLabelText(/results per page/i);
      expect(select).toHaveValue('25');
    });

    it('should have all per page options', () => {
      customRender(
        <Pagination 
          {...defaultProps}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      const select = screen.getByLabelText(/results per page/i);
      const options = Array.from(select.options).map(option => option.value);

      expect(options).toEqual(['10', '25', '50', '100']);
    });

    it('should call onPerPageChange when selection changes', async () => {
      customRender(
        <Pagination 
          {...defaultProps}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      const select = screen.getByLabelText(/results per page/i);
      await userEvent.selectOptions(select, '50');

      expect(mockOnPerPageChange).toHaveBeenCalledWith(50);
    });
  });

  describe('Page Navigation', () => {
    it('should show Previous button as disabled on first page', () => {
      customRender(
        <Pagination 
          {...defaultProps}
          currentPage={1}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      const prevButton = screen.getByLabelText(/previous page/i);
      expect(prevButton).toBeDisabled();
    });

    it('should show Next button as disabled on last page', () => {
      customRender(
        <Pagination 
          {...defaultProps}
          currentPage={10}
          totalPages={10}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      const nextButton = screen.getByLabelText(/next page/i);
      expect(nextButton).toBeDisabled();
    });

    it('should enable Previous button when not on first page', () => {
      customRender(
        <Pagination 
          {...defaultProps}
          currentPage={5}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      const prevButton = screen.getByLabelText(/previous page/i);
      expect(prevButton).not.toBeDisabled();
    });

    it('should enable Next button when not on last page', () => {
      customRender(
        <Pagination 
          {...defaultProps}
          currentPage={5}
          totalPages={10}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      const nextButton = screen.getByLabelText(/next page/i);
      expect(nextButton).not.toBeDisabled();
    });

    it('should call onPageChange with previous page when Previous is clicked', async () => {
      customRender(
        <Pagination 
          {...defaultProps}
          currentPage={5}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      const prevButton = screen.getByLabelText(/previous page/i);
      await userEvent.click(prevButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(4);
    });

    it('should call onPageChange with next page when Next is clicked', async () => {
      customRender(
        <Pagination 
          {...defaultProps}
          currentPage={5}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      const nextButton = screen.getByLabelText(/next page/i);
      await userEvent.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(6);
    });
  });

  describe('Page Number Buttons', () => {
    it('should show current page as active', () => {
      customRender(
        <Pagination 
          {...defaultProps}
          currentPage={5}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      const currentPageButton = screen.getByRole('button', { name: '5' });
      expect(currentPageButton).toHaveClass('pagination__page--active');
    });

    it('should call onPageChange when page number is clicked', async () => {
      customRender(
        <Pagination 
          {...defaultProps}
          currentPage={5}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      const pageButton = screen.getByRole('button', { name: '3' });
      await userEvent.click(pageButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it('should not call onPageChange when current page is clicked', async () => {
      customRender(
        <Pagination 
          {...defaultProps}
          currentPage={5}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      const currentPageButton = screen.getByRole('button', { name: '5' });
      await userEvent.click(currentPageButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it('should show dots for gaps in page numbers', () => {
      customRender(
        <Pagination 
          {...defaultProps}
          currentPage={15}
          totalPages={30}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      const dotsButtons = screen.getAllByText('...');
      expect(dotsButtons.length).toBeGreaterThan(0);
      
      // Dots should be disabled
      dotsButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('should not call onPageChange when dots are clicked', async () => {
      customRender(
        <Pagination 
          {...defaultProps}
          currentPage={15}
          totalPages={30}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      const dotsButton = screen.getAllByText('...')[0];
      await userEvent.click(dotsButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Visible Pages Logic', () => {
    it('should show first few pages when current page is near start', () => {
      customRender(
        <Pagination 
          {...defaultProps}
          currentPage={3}
          totalPages={20}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
     it('should handle single digit page counts', () => {
      customRender(
        <Pagination 
          {...defaultProps}
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      // Should show all pages without dots
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
      expect(screen.queryByText('...')).not.toBeInTheDocument();
    });

    it('should handle zero total results', () => {
      customRender(
        <Pagination 
          {...defaultProps}
          currentPage={1}
          totalResults={0}
          totalPages={0}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      // Should not render anything
      expect(screen.queryByText(/results/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for navigation buttons', () => {
      customRender(
        <Pagination 
          {...defaultProps}
          currentPage={5}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      expect(screen.getByLabelText(/previous page/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/next page/i)).toBeInTheDocument();
    });

    it('should have proper label for per page select', () => {
      customRender(
        <Pagination 
          {...defaultProps}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      expect(screen.getByLabelText(/results per page/i)).toBeInTheDocument();
    });

    it('should have proper button roles for page numbers', () => {
      customRender(
        <Pagination 
          {...defaultProps}
          currentPage={5}
          onPageChange={mockOnPageChange}
          onPerPageChange={mockOnPerPageChange}
        />
      );

      const pageButtons = screen.getAllByRole('button');
      expect(pageButtons.length).toBeGreaterThan(0);
    });
  });
});