import React from 'react';
import './RepositoryCard.css';

const RepositoryCard = ({ repository }) => {
  const {
    full_name,
    owner,
    description,
    html_url,
    language,
    stargazers_count,
    forks_count,
    watchers_count,
    open_issues_count,
    updated_at,
    popularity_score,
    score_breakdown
  } = repository;

  // Format numbers with commas
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num?.toString() || '0';
  };

  // Format relative time
  const formatRelativeTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Updated just now';
    } else if (diffInHours < 24) {
      return `Updated ${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 30) {
        return `Updated ${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
      } else {
        const diffInMonths = Math.floor(diffInDays / 30);
        return `Updated ${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
      }
    }
  };

  return (
    <div className="repository-card">
      <div className="repository-card__header">
        <div className="repository-card__avatar">
          <img 
            src={owner.avatar_url} 
            alt={`${owner.login} avatar`}
            className="repository-card__avatar-img"
          />
        </div>
        <div className="repository-card__title">
          <a 
            href={html_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="repository-card__name"
          >
            {full_name}
          </a>
          {language && (
            <span className="repository-card__language">
              <span className="repository-card__language-dot" style={{ backgroundColor: getLanguageColor(language) }}></span>
              {language}
            </span>
          )}
        </div>
        <div className="repository-card__score">
          <span className="repository-card__score-value">
            {popularity_score?.toFixed(2) || 'N/A'}
          </span>
          <span className="repository-card__score-label">Score</span>
        </div>
      </div>

      <div className="repository-card__description">
        {description || 'No description available'}
      </div>

      <div className="repository-card__stats">
        <div className="repository-card__stat">
          <span className="repository-card__stat-icon">⭐</span>
          <span className="repository-card__stat-value">{formatNumber(stargazers_count)}</span>
        </div>
        <div className="repository-card__stat">
          <span className="repository-card__stat-icon">🍴</span>
          <span className="repository-card__stat-value">{formatNumber(forks_count)}</span>
        </div>
        <div className="repository-card__stat">
          <span className="repository-card__stat-icon">👁️</span>
          <span className="repository-card__stat-value">{formatNumber(watchers_count)}</span>
        </div>
        <div className="repository-card__stat">
          <span className="repository-card__stat-icon">❗</span>
          <span className="repository-card__stat-value">{formatNumber(open_issues_count)}</span>
        </div>
        <div className="repository-card__updated">
          {formatRelativeTime(updated_at)}
        </div>
      </div>
    </div>
  );
};

// Helper function to get language colors
const getLanguageColor = (language) => {
  const colors = {
    'JavaScript': '#f1e05a',
    'Python': '#3572A5',
    'Java': '#b07219',
    'TypeScript': '#2b7489',
    'C#': '#239120',
    'PHP': '#4F5D95',
    'C++': '#f34b7d',
    'C': '#555555',
    'Ruby': '#701516',
    'Go': '#00ADD8',
    'Rust': '#dea584',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'Shell': '#89e051',
    'Vue': '#2c3e50'
  };
  return colors[language] || '#858585';
};

export default RepositoryCard;