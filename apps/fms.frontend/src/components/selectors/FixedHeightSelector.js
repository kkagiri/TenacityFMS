import React, { useState, useRef, useEffect, useMemo } from 'react';
import './FixedHeightSelector.css';

const FixedHeightSelector = ({
  items,
  displayExpr,
  valueExpr,
  value,
  onChange,
  placeholder,
  disabled = false,
  isValid = true,
  validationError = null,
  maxHeight = 250,
  searchEnabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Stabilize items array to prevent unnecessary re-renders
  const stableItems = useMemo(() => items || [], [items]);

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!searchEnabled || !searchTerm.trim()) {
      return stableItems;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return stableItems.filter(item =>
      item[displayExpr]?.toString().toLowerCase().includes(lowerSearchTerm)
    );
  }, [stableItems, searchTerm, displayExpr, searchEnabled]);

  // Set initial selected item if value is provided
  useEffect(() => {
    if (value && stableItems.length > 0) {
      const foundItem = stableItems.find(item => item[valueExpr] === value);
      if (foundItem) {
        setSelectedItem(foundItem);
      }
    } else if (!value) {
      setSelectedItem(null);
    }
  }, [value, stableItems, valueExpr]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!disabled) {
      const newIsOpen = !isOpen;
      setIsOpen(newIsOpen);
      if (newIsOpen && searchEnabled) {
        // Focus search input when dropdown opens
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 100);
      }
      if (!newIsOpen) {
        // Clear search when closing
        setSearchTerm('');
      }
    }
  };

  const handleSelect = (item) => {
    setSelectedItem(item);
    setIsOpen(false);
    setSearchTerm('');
    if (onChange) {
      onChange({ value: item[valueExpr] });
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedItem(null);
    setSearchTerm('');
    if (onChange) {
      onChange({ value: null });
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div ref={containerRef} className="fixed-height-selector">
      <div
        className={`selector-input ${isOpen ? 'active' : ''} ${!isValid ? 'invalid' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={toggleDropdown}
      >
        <div className="selector-value">
          {selectedItem ? selectedItem[displayExpr] :
            <span className="selector-placeholder">{placeholder}</span>}
        </div>
        <div className="selector-buttons">
          {selectedItem && (
            <button
              type="button"
              className="selector-clear-button"
              onClick={handleClear}
              title="Clear selection"
            >
              <i className="fa-light fa-times"></i>
            </button>
          )}
          <div className="selector-arrow">
            <i className={`fa-light ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
          </div>
        </div>
      </div>

      {!isValid && validationError && (
        <div className="selector-validation-error">
          {validationError.message}
        </div>
      )}

      {isOpen && (
        <div className="selector-dropdown" style={{ maxHeight }}>
          {searchEnabled && (
            <div className="selector-search-container">
              <input
                ref={searchInputRef}
                type="text"
                className="selector-search-input"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearchChange}
                onClick={(e) => e.stopPropagation()}
              />
              <i className="fa-light fa-search selector-search-icon"></i>
            </div>
          )}
          {filteredItems?.length > 0 ? (
            <ul className="selector-list">
              {filteredItems.map((item, index) => (
                <li
                  key={`${item[valueExpr]}-${index}`}
                  className={`selector-item ${selectedItem && selectedItem[valueExpr] === item[valueExpr] ? 'selected' : ''}`}
                  onClick={() => handleSelect(item)}
                >
                  {item[displayExpr]}
                </li>
              ))}
            </ul>
          ) : (
            <div className="selector-no-data">
              {searchEnabled && searchTerm ? 'No matching items found' : 'No items available'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(FixedHeightSelector);
