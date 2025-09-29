import React, { useState } from 'react';
import SearchPanel from './components/SearchPanel';
import RepositoryList from './components/RepositoryList';
import Pagination from './components/Pagination';
import apiService from './services/apiService';
import './App.css';

function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useState(null);

  const performSearch = async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Searching with params:', params);
      const response = await apiService.searchRepositories(params);
      console.log('Search response:', response);
      
      setResults(response);
      setSearchParams(params);
    } catch (err) {
      console.error('Search failed:', err);
      setError(err.message || 'Failed to search repositories');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchParams) => {
    // Reset to page 1 for new searches
    performSearch({ ...searchParams, page: 1, per_page: 25 });
  };

  const handlePageChange = (page) => {
    if (searchParams) {
      performSearch({ ...searchParams, page });
    }
  };

  const handlePerPageChange = (perPage) => {
    if (searchParams) {
      performSearch({ ...searchParams, page: 1, per_page: perPage });
    }
  };

  return (
    <div className="app">
      <SearchPanel onSearch={handleSearch} />
      
      <div className="results-section">
        <RepositoryList 
          results={results}
          loading={loading}
          error={error}
        />
        
        {results && results.items && results.items.length > 0 && (
          <Pagination
            currentPage={results.page_info?.current_page || 1}
            totalPages={results.page_info?.total_pages || 1}
            totalResults={results.total_count || 0}
            perPage={searchParams?.per_page || 25}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
          />
        )}
      </div>
    </div>
  );
}

export default App;
