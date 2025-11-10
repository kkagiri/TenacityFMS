import React, { useState, useCallback, useRef, useEffect } from 'react';
import { quickSearchVehicles } from '../../redux/actions/vehicleSearchActions';
import axiosInstance from '../../api/axiosInstance';
import './SearchableSelector.css';

const VehicleSearchableSelector = ({
  value,
  onValueChanged,
  placeholder = 'Search and select vehicle...',
  disabled = false,
  isValid = true,
  validationError = null,
  width = '100%'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const searchTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  const performSearch = useCallback(async (term) => {
    if (!term || term.length < 2) {
      setVehicles([]);
      setShowDropdown(false);
      return;
    }

    console.log('Performing vehicle search for:', term);
    setIsLoading(true);
    try {
      const result = await quickSearchVehicles(term, 50);
      console.log('Vehicle search result:', result);
      if (result.success) {
        setVehicles(result.data || []);
        setShowDropdown(true);
      } else {
        setVehicles([]);
        setShowDropdown(true); // Show dropdown even if no results to display "No vehicles found"
      }
    } catch (err) {
      console.error('Error searching vehicles:', err);
      setVehicles([]);
      setShowDropdown(true); // Show dropdown with error message
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearchTermChange = useCallback((inputValue) => {
    console.log('Vehicle search term changed:', inputValue);
    setSearchTerm(inputValue);

    // Show dropdown immediately when user starts typing (2+ chars)
    if (inputValue && inputValue.length >= 2) {
      setShowDropdown(true);
      setIsLoading(true);
    } else {
      setShowDropdown(false);
      setIsLoading(false);
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Reduced debounce delay for faster response
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(inputValue);
    }, 200);
  }, [performSearch]);

  const handleVehicleSelect = useCallback((vehicle) => {
    setSelectedVehicle(vehicle);
    setSearchTerm(vehicle.hyoungNo + (vehicle.vehicleName ? ' - ' + vehicle.vehicleName : ''));
    setShowDropdown(false);

    if (onValueChanged) {
      onValueChanged({ value: vehicle.vehicleId });
    }
  }, [onValueChanged]);

  const handleClearSelection = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    // Stop any ongoing search immediately
    setIsLoading(false);

    // Clear any pending search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    // Clear all local state immediately
    setSelectedVehicle(null);
    setSearchTerm('');
    setVehicles([]);
    setShowDropdown(false);

    // Notify parent component
    if (onValueChanged) {
      onValueChanged({ value: null });
    }
  }, [onValueChanged]);

  const handleInputChange = useCallback((e) => {
    const inputValue = e.target.value;

    // Clear selection if user is typing and input doesn't match selected vehicle
    if (selectedVehicle) {
      const expectedValue = selectedVehicle.hyoungNo + (selectedVehicle.vehicleName ? ' - ' + selectedVehicle.vehicleName : '');
      if (inputValue !== expectedValue) {
        setSelectedVehicle(null);
        if (onValueChanged) {
          onValueChanged({ value: null });
        }
      }
    }

    // Trigger search with improved UX
    handleSearchTermChange(inputValue);
  }, [selectedVehicle, onValueChanged, handleSearchTermChange]);

  const handleInputFocus = useCallback(() => {
    // Show dropdown immediately if we have enough characters
    if (searchTerm.length >= 2) {
      setShowDropdown(true);
      // Only perform search if we don't already have results
      if (vehicles.length === 0 && !isLoading) {
        performSearch(searchTerm);
      }
    }
  }, [searchTerm, vehicles.length, isLoading, performSearch]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Load selected vehicle by id when value changes
  useEffect(() => {
    const loadSelected = async () => {
      if (!value || (selectedVehicle && selectedVehicle.vehicleId === value)) return;

      try {
        const resp = await axiosInstance.get(`/vehicle/${value}`);
        const ok = resp.data?.success || resp.data?.isSuccess || resp.data?.IsSuccess;
        const wrapped = resp.data?.data || resp.data?.Data;
        const rawDto = resp.data && resp.data.vehicleId ? resp.data : null;
        const item = ok ? (wrapped || null) : rawDto;

        if (item && item.vehicleId) {
          setSelectedVehicle(item);
          setSearchTerm(item.hyoungNo + (item.vehicleName ? ' - ' + item.vehicleName : ''));
        }
      } catch (err) {
        console.warn('Unable to prefetch selected vehicle:', err);
      }
    };
    loadSelected();
  }, [value, selectedVehicle]);

  // Clear when value is null - but avoid infinite loops
  useEffect(() => {
    if (!value) {
      setSelectedVehicle(null);
      setSearchTerm('');
      setVehicles([]);
      setShowDropdown(false);
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="searchable-selector" style={{ width, position: 'relative' }}>
      <div className={`dx-texteditor dx-editor-outlined dx-texteditor-empty dx-dropdowneditor dx-selectbox dx-widget ${!isValid ? 'dx-invalid' : ''}`} style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
        <div className="dx-texteditor-container">
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            className="dx-texteditor-input"
            autoComplete="off"
            style={{
              backgroundColor: disabled ? '#f8f9fa' : 'white',
              paddingRight: '40px',
              border: 'none',
              outline: 'none',
              pointerEvents: 'auto',
              cursor: disabled ? 'not-allowed' : 'text',
              zIndex: 1
            }}
          />
          <div className="dx-texteditor-buttons-container">
            {(selectedVehicle || searchTerm) && (
              <div
                className="dx-button dx-button-normal dx-button-mode-text dx-widget"
                style={{ backgroundColor: 'transparent', marginRight: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                onClick={handleClearSelection}
                title="Clear selection"
              >
                <div className="dx-button-content">
                  <i className="fa-light fa-times" style={{ color: '#666', fontSize: '14px' }}></i>
                </div>
              </div>
            )}
            {isLoading ? (
              <div className="dx-button dx-button-normal dx-button-mode-text dx-widget" style={{ backgroundColor: 'transparent' }}>
                <div className="dx-button-content">
                  <div className="dx-loadindicator dx-widget dx-loadindicator-16">
                    <div className="dx-loadindicator-wrapper">
                      <div className="dx-loadindicator-content">
                        <div className="dx-loadindicator-icon"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="dx-button dx-button-normal dx-button-mode-text dx-widget" style={{ backgroundColor: 'transparent' }}>
                <div className="dx-button-content">
                  <i className="dx-icon dx-icon-spindown" style={{
                    color: '#666',
                    fontSize: '12px',
                    transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}></i>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!isValid && validationError && (
        <div className="dx-invalid-message">
          <div className="dx-invalid-message-content">{validationError.message}</div>
        </div>
      )}

      {showDropdown && (
        <div className="dx-overlay-wrapper dx-selectbox-popup-wrapper" style={{ position: 'absolute', zIndex: 1501, width: '100%', top: '100%' }}>
          <div className="dx-overlay-content dx-popup-content dx-selectbox-popup">
            <div className="dx-scrollable dx-scrollable-vertical dx-scrollable-simulated">
              <div className="dx-scrollable-wrapper">
                <div className="dx-scrollable-container">
                  <div className="dx-scrollable-content" style={{ maxHeight: '250px', minHeight: '150px', overflowY: 'auto' }}>
                    <div className="dx-list dx-list-select-decorator-enabled dx-widget">
                      {vehicles.length > 0 ? (
                        vehicles.map((vehicle, index) => (
                          <div
                            key={vehicle.vehicleId}
                            className="dx-list-item"
                            onClick={() => handleVehicleSelect(vehicle)}
                            onMouseEnter={(e) => e.currentTarget.classList.add('dx-state-hover')}
                            onMouseLeave={(e) => e.currentTarget.classList.remove('dx-state-hover')}
                            style={{
                              cursor: 'pointer',
                              borderBottom: index !== vehicles.length - 1 ? '1px solid #e6e6e6' : 'none'
                            }}
                          >
                          <div className="dx-list-item-content" style={{ padding: '12px 16px', minHeight: '50px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  fontSize: '14px',
                                  lineHeight: '1.3'
                                }}>
                                  <span style={{ fontWeight: '600', color: '#337ab7' }}>
                                    {vehicle.hyoungNo}
                                  </span>
                                  <span style={{ color: '#666' }}>
                                    {vehicle.vehicleName || vehicle.numberPlate}
                                  </span>
                                </div>
                              </div>
                              <div style={{ fontSize: '12px', color: '#999', textAlign: 'right', marginLeft: '16px' }}>
                                {vehicle.siteName}
                              </div>
                            </div>
                          </div>
                          </div>
                        ))
                      ) : (
                        <div className="dx-list-item">
                          <div className="dx-list-item-content" style={{
                            padding: '12px',
                            textAlign: 'center',
                            color: '#666',
                            fontStyle: 'italic',
                            fontSize: '13px'
                          }}>
                            {isLoading ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <div className="dx-loadindicator dx-widget dx-loadindicator-16">
                                  <div className="dx-loadindicator-wrapper">
                                    <div className="dx-loadindicator-content">
                                      <div className="dx-loadindicator-icon"></div>
                                    </div>
                                  </div>
                                </div>
                                <span>Searching vehicles...</span>
                              </div>
                            ) : searchTerm.length < 2 ? (
                              'Type at least 2 characters to search'
                            ) : (
                              'No vehicles found matching your search'
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleSearchableSelector;
