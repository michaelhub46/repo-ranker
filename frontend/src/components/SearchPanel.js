import React, { useState } from 'react';

const SearchPanel = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [sortBy, setSortBy] = useState('stars');
  const [sortOrder, setSortOrder] = useState('desc');
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [customDate, setCustomDate] = useState('');

  const languages = [
    'javascript', 'python', 'java', 'typescript', 'c#', 'php', 'c++', 'c', 'ruby', 'go', 'rust'
  ];

  const dateRanges = [
    { value: '', label: 'Any time' },
    { value: getDateString('today'), label: 'Today' },
    { value: getDateString('week'), label: 'This week' },
    { value: getDateString('month'), label: 'This month' },
    { value: getDateString('year'), label: 'This year' }
  ];

  const sortOptions = [
    { value: 'stars', label: 'Stars' },
    { value: 'forks', label: 'Forks' },
    { value: 'help-wanted-issues', label: 'Help Wanted Issues' },
    { value: 'updated', label: 'Updated' }
  ];

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      alert('Please enter a search query');
      return;
    }

    // Build GitHub-style query string with embedded filters
    let fullQuery = searchQuery.trim();
    
    // Add language qualifier if selected (e.g., "language:JavaScript")
    if (selectedLanguage) {
      fullQuery += ` language:${selectedLanguage}`;
    }
    
    // Add created date qualifier if selected (e.g., "created:>2025-09-21")
    const dateValue = useCustomDate ? customDate : selectedDate;
    if (dateValue) {
      fullQuery += ` created:>${dateValue}`;
    }

    const searchParams = {
      q: fullQuery,
      sort: sortBy,
      order: sortOrder
    };
    
    onSearch(searchParams);
  };

  const handleDateTypeChange = (isCustom) => {
    setUseCustomDate(isCustom);
    if (!isCustom) {
      setCustomDate('');
    } else {
      setSelectedDate('');
    }
  };

  return (
    <div className="search-panel">
      <div className="search-panel__header">
        <h1 className="search-panel__title">GitHub Repository Ranker</h1>
        <p className="search-panel__subtitle">Discover and rank repositories with intelligent scoring</p>
      </div>
      
      <form className="search-form" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
        <div className="search-form__field">
          <label className="search-form__label">Search Query</label>
          <input
            className="input input--primary"
            type="text"
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="search-form__field">
          <label className="search-form__label">Language</label>
          <select 
            className="select input--secondary" 
            value={selectedLanguage} 
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            <option value="">Any Language</option>
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        <div className="search-form__field">
          <label className="search-form__label">Date Created</label>
          <div className="date-selector">
            <div className="date-selector__option">
              <input
                className="date-selector__radio"
                type="radio"
                name="dateType"
                checked={!useCustomDate}
                onChange={() => handleDateTypeChange(false)}
              />
              <select 
                className="select input--date"
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={useCustomDate}
              >
                {dateRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>
            
            <div className="date-selector__option">
              <input
                className="date-selector__radio"
                type="radio"
                name="dateType"
                checked={useCustomDate}
                onChange={() => handleDateTypeChange(true)}
              />
              <input
                className="input input--date"
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                disabled={!useCustomDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>
        
        <div className="search-form__field">
          <label className="search-form__label">Sort By</label>
          <select 
            className="select input--secondary" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div className="search-form__field">
          <label className="search-form__label">Order</label>
          <select 
            className="select input--secondary" 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
        
        <div className="search-form__field">
          <label className="search-form__label">&nbsp;</label>
          <button className="button button--primary" type="submit">
            Search
          </button>
        </div>
      </form>
    </div>
  );
};

function getDateString(period) {
  const date = new Date();
  
  switch(period) {
    case 'today':
      // Start of today
      date.setHours(0, 0, 0, 0);
      break;
    case 'week':
      // Start of this week (Monday)
      const dayOfWeek = date.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so 6 days back to Monday
      date.setDate(date.getDate() - daysToMonday);
      date.setHours(0, 0, 0, 0);
      break;
    case 'month':
      // Start of this month
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      break;
    case 'year':
      // Start of this year
      date.setMonth(0, 1);
      date.setHours(0, 0, 0, 0);
      break;
    default:
      // For backward compatibility with number inputs
      if (typeof period === 'number') {
        date.setDate(date.getDate() - period);
      }
      break;
  }
  
  return date.toISOString().split('T')[0];
}

export default SearchPanel;