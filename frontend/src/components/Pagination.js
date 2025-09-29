import React from 'react';
import './Pagination.css';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalResults, 
  perPage, 
  onPageChange,
  onPerPageChange 
}) => {
  // GitHub API only allows access to first 1000 results
  const maxResults = Math.min(totalResults, 1000);
  const effectiveTotalPages = Math.min(totalPages, Math.ceil(maxResults / perPage));
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(effectiveTotalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < effectiveTotalPages - 1) {
      rangeWithDots.push('...', effectiveTotalPages);
    } else {
      rangeWithDots.push(effectiveTotalPages);
    }

    return rangeWithDots;
  };

  const handlePageClick = (page) => {
    if (page !== '...' && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePerPageChange = (e) => {
    onPerPageChange(parseInt(e.target.value));
  };

  if (effectiveTotalPages <= 1) return null;

  return (
    <div className="pagination">
      <div className="pagination__info">
        Showing {((currentPage - 1) * perPage) + 1}-{Math.min(currentPage * perPage, maxResults)} of {maxResults?.toLocaleString()} results
        {totalResults > 1000 && (
          <span className="pagination__limit-notice"> (GitHub API limit: first 1000 results only)</span>
        )}
      </div>

      <div className="pagination__controls">
        <div className="pagination__per-page">
          <label htmlFor="per-page-select" className="pagination__per-page-label">
            Results per page:
          </label>
          <select 
            id="per-page-select"
            value={perPage} 
            onChange={handlePerPageChange}
            className="pagination__per-page-select"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="pagination__pages">
          <button
            className="pagination__button pagination__button--prev"
            disabled={currentPage === 1}
            onClick={() => handlePageClick(currentPage - 1)}
            aria-label="Previous page"
          >
            ← Previous
          </button>

          <div className="pagination__page-numbers">
            {getVisiblePages().map((page, index) => (
              <button
                key={index}
                className={`pagination__page ${
                  page === currentPage ? 'pagination__page--active' : ''
                } ${page === '...' ? 'pagination__page--dots' : ''}`}
                onClick={() => handlePageClick(page)}
                disabled={page === '...'}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            className="pagination__button pagination__button--next"
            disabled={currentPage === effectiveTotalPages}
            onClick={() => handlePageClick(currentPage + 1)}
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;