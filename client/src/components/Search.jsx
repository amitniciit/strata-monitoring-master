import { useState } from 'react';
import './search.css';
import { useNavigate } from 'react-router-dom';

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchTerm.trim()) navigate(`/${searchTerm}/graph`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="search-bar">
      <div className="search-input-wrap">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search by instrument ID…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="search-input"
        />
      </div>
      <button onClick={handleSearch} className="search-btn">
        Search
      </button>
      <button onClick={() => navigate('/')} className="search-btn search-btn-secondary">
        Home
      </button>
    </div>
  );
};

export default Search;