import React from 'react';
import RepositoryCard from './RepositoryCard';
import './RepositoryList.css';

const RepositoryList = ({ results, loading, error }) => {
  if (loading) {
    return (
      <div className="repository-list">
        <div className="repository-list__loading">
          <div className="repository-list__spinner"></div>
          <p>Searching repositories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="repository-list">
        <div className="repository-list__error">
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!results || !results.items || results.items.length === 0) {
    return (
      <div className="repository-list">
        <div className="repository-list__empty">
          <h3>🔍 No repositories found</h3>
          <p>Try adjusting your search terms or filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="repository-list">
      <div className="repository-list__header">
        <h3 className="repository-list__title">
          {results.total_count?.toLocaleString()} results
          {results.incomplete_results && (
            <span className="repository-list__incomplete"> (incomplete)</span>
          )}
        </h3>
        <div className="repository-list__info">
          Page {results.page_info?.current_page} of {results.page_info?.total_pages}
          {results.rate_limit && (
            <span className="repository-list__rate-limit">
              • API: {results.rate_limit.remaining}/{results.rate_limit.limit} remaining
            </span>
          )}
        </div>
      </div>

      <div className="repository-list__items">
        {results.items.map((repository) => (
          <RepositoryCard 
            key={repository.id} 
            repository={repository} 
          />
        ))}
      </div>

      {results.scoring_info && (
        <div className="repository-list__scoring-info">
          <details className="repository-list__scoring-details">
            <summary>Scoring Algorithm (v{results.scoring_info.algorithm_version})</summary>
            <div className="repository-list__scoring-factors">
              {Object.entries(results.scoring_info.factors).map(([factor, weight]) => (
                <span key={factor} className="repository-list__scoring-factor">
                  <strong>{factor}</strong>: {weight}
                </span>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default RepositoryList;