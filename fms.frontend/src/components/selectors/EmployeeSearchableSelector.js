import React, { useState, useCallback, useRef, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import './SearchableSelector.css';

const EmployeeSearchableSelector = ({
  value,
  onValueChanged,
  placeholder = 'Search and select employee...',
  disabled = false,
  isValid = true,
  validationError = null,
  width = '100%',
  activeOnly = true,
  siteId = null
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const searchTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  const performSearch = useCallback(async (term) => {
    if (!term || term.length < 2) {
      setEmployees([]);
      setShowDropdown(false);
      return;
    }

    console.log('Performing employee search for:', term);
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/employee/search', {
        params: {
          searchTerm: term,
          active: activeOnly,
          siteId: siteId ?? undefined,
          limit: 50
        }
      });

      console.log('Employee search response:', response.data);
      const ok = response.data?.success || response.data?.isSuccess || response.data?.IsSuccess;
      const list = response.data?.data || response.data?.Data || [];

      if (ok) {
        setEmployees(list);
        setShowDropdown(true);
      } else {
        setEmployees([]);
        setShowDropdown(true); // Show dropdown even if no results to display "No employees found"
      }
    } catch (err) {
      console.error('Error searching employees:', err);
      setEmployees([]);
      setShowDropdown(true); // Show dropdown with error message
    } finally {
      setIsLoading(false);
    }
  }, [activeOnly, siteId]);

  const handleSearchTermChange = useCallback((inputValue) => {
    console.log('Employee search term changed:', inputValue);
    setSearchTerm(inputValue);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(inputValue);
    }, 300);
  }, [performSearch]);

  const handleEmployeeSelect = useCallback((employee) => {
    console.log('Employee selected:', employee);
    setSelectedEmployee(employee);
    const workNo = employee.employeeWorkNo ? ` (${employee.employeeWorkNo})` : '';
    setSearchTerm(employee.fullName + workNo);
    setShowDropdown(false);

    if (onValueChanged) {
      onValueChanged({ value: employee.id });
    }
  }, [onValueChanged]);

  const handleClearSelection = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    // Clear all local state immediately
    setSelectedEmployee(null);
    setSearchTerm('');
    setEmployees([]);
    setShowDropdown(false);

    // Clear any pending search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Notify parent component
    if (onValueChanged) {
      onValueChanged({ value: null });
    }
  }, [onValueChanged]);

  const handleInputChange = useCallback((e) => {
    const inputValue = e.target.value;
    handleSearchTermChange(inputValue);

    // Clear selection if user is typing and input doesn't match selected employee
    if (selectedEmployee) {
      const expectedValue = selectedEmployee.fullName + (selectedEmployee.employeeWorkNo ? ` (${selectedEmployee.employeeWorkNo})` : '');
      if (inputValue !== expectedValue) {
        setSelectedEmployee(null);
        if (onValueChanged) {
          onValueChanged({ value: null });
        }
      }
    }
  }, [selectedEmployee, onValueChanged, handleSearchTermChange]);

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

  // Load selected employee by id when value changes
  useEffect(() => {
    const loadSelected = async () => {
      if (!value || (selectedEmployee && selectedEmployee.id === value)) return;

      try {
        const resp = await axiosInstance.get(`/employee/${value}`);
        const ok = resp.data?.success || resp.data?.isSuccess || resp.data?.IsSuccess;
        const wrapped = resp.data?.data || resp.data?.Data;
        const rawDto = resp.data && resp.data.id ? resp.data : null;
        const item = ok ? (wrapped || null) : rawDto;

        if (item && item.id) {
          setSelectedEmployee(item);
          const workNo = item.employeeWorkNo ? ` (${item.employeeWorkNo})` : '';
          setSearchTerm(item.fullName + workNo);
        }
      } catch (err) {
        console.warn('Unable to prefetch selected employee:', err);
      }
    };
    loadSelected();
  }, [value, selectedEmployee]);

  // Clear when value is null - but avoid infinite loops
  useEffect(() => {
    if (!value) {
      setSelectedEmployee(null);
      setSearchTerm('');
      setEmployees([]);
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
            {selectedEmployee && (
              <div
                className="dx-button dx-button-normal dx-button-mode-text dx-widget"
                style={{ backgroundColor: 'transparent', marginRight: '4px', cursor: 'pointer' }}
                onClick={handleClearSelection}
                title="Clear selection"
              >
                <div className="dx-button-content">
                  <i className="fa-light fa-times" style={{ color: '#666', fontSize: '12px' }}></i>
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
                      {employees.length > 0 ? (
                        employees.map((employee, index) => (
                          <div
                            key={employee.id}
                            className="dx-list-item"
                            onClick={() => handleEmployeeSelect(employee)}
                            onMouseEnter={(e) => e.currentTarget.classList.add('dx-state-hover')}
                            onMouseLeave={(e) => e.currentTarget.classList.remove('dx-state-hover')}
                            style={{
                              cursor: 'pointer',
                              borderBottom: index !== employees.length - 1 ? '1px solid #e6e6e6' : 'none'
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
                                      {employee.fullName}
                                    </span>
                                    {employee.employeeWorkNo && (
                                      <span style={{ color: '#666', fontSize: '13px' }}>
                                        ({employee.employeeWorkNo})
                                      </span>
                                    )}
                                    <span style={{ color: '#888', fontSize: '13px' }}>
                                      {employee.employeestatus}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ fontSize: '12px', color: '#999', textAlign: 'right', marginLeft: '16px' }}>
                                  {employee.siteName}
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
                            {isLoading ? 'Searching...' : searchTerm.length < 2 ? 'Type to search employees' : 'No employees found'}
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

export default EmployeeSearchableSelector;
