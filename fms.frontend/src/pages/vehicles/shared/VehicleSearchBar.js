import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { quickSearchVehicles, searchVehicles } from '../../../redux/actions/vehicleSearchActions';
import './VehicleSearchBar.scss';

const VehicleSearchBar = ({ placeholder = "Search by vehicles, site, passenger..." }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const searchRef = useRef(null);
  const timeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(async (term) => {
    if (!isMountedRef.current || !term || term.length < 2) {
      if (isMountedRef.current) {
        setSuggestions([]);
        setShowSuggestions(false);
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);

    try {
      // Try quick search first
      let result = await quickSearchVehicles(term, 10);

      // If quick search fails, try the regular search
      if (!result.success) {
        console.log('Quick search failed, trying regular search:', result.error);
        result = await dispatch(searchVehicles(term, { limit: 10 }));
      }

      console.log('Search result:', result); // Debug log

      if (!isMountedRef.current) return;

      if (result.success && Array.isArray(result.data)) {
        setSuggestions(result.data);
        setShowSuggestions(result.data.length > 0);
        setSelectedIndex(-1);
      } else {
        console.warn('Search failed or no data:', result); // Debug log
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      console.error('Error details:', error.response?.data); // Additional debug info
      if (isMountedRef.current) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [dispatch]);

  // Handle search term changes
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      debouncedSearch(searchTerm);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchTerm, debouncedSearch]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    } else if (value.length >= 2) {
      // Show loading state immediately when typing
      setIsLoading(true);
    }
  }, []);

  const handleInputFocus = useCallback(() => {
    // Re-trigger search when focusing and there's existing content
    if (searchTerm.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    } else if (searchTerm.length >= 2) {
      // Trigger search if we have content but no suggestions
      debouncedSearch(searchTerm);
    }
  }, [searchTerm, suggestions.length, debouncedSearch]);

  const handleSuggestionClick = useCallback((vehicle) => {
    if (!vehicle?.vehicleId) return;

    setSearchTerm('');
    setShowSuggestions(false);
    setSelectedIndex(-1);

    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      navigate(`/vehicles/${vehicle.vehicleId}/details`);
    });
  }, [navigate]);

  const handleKeyDown = useCallback((e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        // Do nothing for other keys
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, handleSuggestionClick]);

  const highlightText = useCallback((text, search) => {
    if (!text || !search) return text || '';

    try {
      const parts = text.split(new RegExp(`(${search})`, 'gi'));
      return parts.map((part, i) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <mark key={i} className="tw-bg-yellow-200">{part}</mark>
        ) : part
      );
    } catch {
      return text;
    }
  }, []);

  return (
    <div className="vehicle-search-bar" ref={searchRef}>
      <div className="search-input-container">
        <span className="search-icon" aria-hidden="true">🔍</span>
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="tw-border tw-rounded-lg tw-px-4 tw-py-2 tw-pl-10 tw-text-sm tw-w-full tw-outline-none focus:tw-border-blue-500"
          autoComplete="off"
        />
        {isLoading && (
          <span className="loading-icon" aria-hidden="true">⏳</span>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          <div className="suggestions-header">
            <span className="tw-text-xs tw-text-gray-500">
              {suggestions.length} result{suggestions.length !== 1 ? 's' : ''}
            </span>
          </div>
          {suggestions.map((vehicle, index) => (
            <div
              key={`${vehicle.vehicleId}-${index}`}
              className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSuggestionClick(vehicle)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="suggestion-content">
                <div className="vehicle-primary">
                  <span className="vehicle-icon" aria-hidden="true">🚛</span>
                  <span className="vehicle-name">
                    {highlightText(
                      vehicle.hyoungNo || vehicle.numberPlate || `Vehicle ${vehicle.vehicleId}`,
                      searchTerm
                    )}
                  </span>
                </div>
                {vehicle.numberPlate && vehicle.hyoungNo !== vehicle.numberPlate && (
                  <div className="vehicle-secondary">
                    <span className="tw-text-gray-600 tw-text-xs">
                      Plate: {highlightText(vehicle.numberPlate, searchTerm)}
                    </span>
                  </div>
                )}
              </div>
              <span className="arrow-icon" aria-hidden="true">→</span>
            </div>
          ))}
        </div>
      )}

      {showSuggestions && searchTerm.length >= 2 && suggestions.length === 0 && !isLoading && (
        <div className="suggestions-dropdown">
          <div className="suggestion-item no-results">
            <span aria-hidden="true">🔍</span>
            <span className="tw-text-gray-500">No vehicles found</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleSearchBar;
