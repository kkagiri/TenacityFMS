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
  maxHeight = 250
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const containerRef = useRef(null);

  // Stabilize items array to prevent unnecessary re-renders
  const stableItems = useMemo(() => items || [], [items]);

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
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (item) => {
    setSelectedItem(item);
    setIsOpen(false);
    if (onChange) {
      onChange({ value: item[valueExpr] });
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedItem(null);
    if (onChange) {
      onChange({ value: null });
    }
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
          {stableItems?.length > 0 ? (
            <ul className="selector-list">
              {stableItems.map((item, index) => (
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
            <div className="selector-no-data">No items available</div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(FixedHeightSelector);
