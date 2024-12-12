import React, { useState } from "react";
import { InputGroup, Form, Button } from 'react-bootstrap';
import { Search } from 'react-bootstrap-icons';

const SearchBar = () => {
    const [query, setQuery] = useState('');

    // Clear the search input
    const clearSearch = () => {
        setQuery('');
    };

    return (
        <form 
            action="/secure/search/process" 
            method="post" 
            style={{
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '100%', 
                padding: '20px'  // Added more padding for spacing
            }}
        >
            {/* Search Bar Container */}
            <div style={{
                display: 'flex', 
                alignItems: 'center', 
                border: '1px solid #ccc', 
                borderRadius: '40px',   // Increased border-radius to make it more round
                padding: '15px 20px',   // Increased padding for larger size
                maxWidth: '800px',      // Made the search bar wider
                width: '100%', 
                boxShadow: '0 8px 16px rgba(202, 238, 207, 1)', // Stronger shadow for better visibility
                backgroundColor: '#fff',
            }}>
                {/* Search Icon */}
                <Search 
                    width="30px"    // Made the icon larger
                    height="30px" 
                    style={{ marginRight: '12px', color: '#6c757d' }}
                />
                {/* Input Field */}
                <input 
                    type="text" 
                    name="query" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search events, artists, teams, and more" 
                    aria-label="Search for events, artists, or teams"
                    style={{
                        border: 'none', 
                        outline: 'none', 
                        flex: '1', 
                        fontSize: '20px',      // Increased font size
                        padding: '10px 15px',  // Added padding to input for larger appearance
                        borderRadius: '40px'   // Round input corners
                    }}
                />
                {/* Clear Button */}
                {query && (
                    <Button 
                        variant="light" 
                        onClick={clearSearch} 
                        style={{ 
                            padding: '8px 15px', 
                            marginLeft: '12px',
                            fontSize: '16px',    // Larger font for clear button
                            borderRadius: '20px' // Round the clear button
                        }}
                    >
                        Clear
                    </Button>
                )}
            </div>
        </form>
    );
};

export default SearchBar;
