import React, { useState } from 'react';
import './search.css'; // Import the CSS file
import { useNavigate } from 'react-router-dom';

const Search = () => {
    const [searchTerm,setSearchTerm]=useState('')
  const navigate=useNavigate()
  const handleInputChange = (e) => {
    setSearchTerm(e.target.value)
  };

  const handleSearch = () => {
    navigate(`/${searchTerm}/graph`)
    
  };

  return (
    <>
    <div className="search-container">
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={handleInputChange}
        className="search-input"
      />
      <button onClick={handleSearch} className="search-button">
        Search
      </button>
   
    <button className="search-button" onClick={()=>navigate('/')} style={{marginLeft:'4px'}}>
        Home
      </button>
      </div>
      </>
  );
};

export default Search;

