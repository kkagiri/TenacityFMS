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
        setShowDropdown(false);
      }
    } catch (err) {
      console.error('Error searching vehicles:', err);
      setVehicles([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearchTermChange = useCallback((inputValue) => {
    console.log('Vehicle search term changed:', inputValue);
    setSearchTerm(inputValue);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(inputValue);
    }, 300);
  }, [performSearch]);

  const handleVehicleSelect = useCallback((vehicle) => {
    setSelectedVehicle(vehicle);
    setSearchTerm(vehicle.hyoungNo + (vehicle.vehicleName ? ' - ' + vehicle.vehicleName : ''));
    setShowDropdown(false);

    if (onValueChanged) {
      onValueChanged({ value: vehicle.vehicleId });
    }
  }, [onValueChanged]);

  const handleInputChange = useCallback((e) => {
    const inputValue = e.target.value;
    handleSearchTermChange(inputValue);

    // Clear selection if user is typing
    if (selectedVehicle && inputValue !== (selectedVehicle.hyoungNo + (selectedVehicle.vehicleName ? ' - ' + selectedVehicle.vehicleName : ''))) {
      setSelectedVehicle(null);
      if (onValueChanged) {
        onValueChanged({ value: null });
      }
    }
  }, [selectedVehicle, onValueChanged, handleSearchTermChange]);

  const handleInputFocus = useCallback(() => {
    if (searchTerm.length >= 2) {
      performSearch(searchTerm);
    }
  }, [searchTerm, performSearch]);

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

  // Clear when value is null
  useEffect(() => {
    if (!value) {
      setSelectedVehicle(null);
      setSearchTerm('');
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
      <div className={`dx-texteditor dx-editor-outlined dx-texteditor-empty dx-dropdowneditor dx-selectbox dx-widget ${!isValid ? 'dx-invalid' : ''}`}>
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
              backgroundColor: disabled ? '#f8f9fa' : 'transparent',
              paddingRight: '40px'
            }}
          />
          <div className="dx-texteditor-buttons-container">
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
                  <div className="dx-scrollable-content" style={{ maxHeight: '300px', minHeight: '150px', overflowY: 'auto' }}>
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
                            {isLoading ? 'Searching...' : searchTerm.length < 2 ? 'Type to search vehicles' : 'No vehicles found'}
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
