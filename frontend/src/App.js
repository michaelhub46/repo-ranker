import React, { useState } from 'react';
import SearchPanel from './components/SearchPanel';
import './App.css';

function App() {
  const [results, setResults] = useState(null);

  const handleSearch = (searchParams) => {
    console.log('Search:', searchParams);
    setResults(JSON.stringify(searchParams, null, 2));
  };

  return (
    <div className="app">
      <SearchPanel onSearch={handleSearch} />
      
      <div className="results-section">
        {results && (
          <div className="results-section__content">
            <div className="results-section__header">
              <h3 className="results-section__title">Search Results</h3>
            </div>
            <pre className="results-section__code">{results}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
