import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Popup, ToolbarItem } from 'devextreme-react/popup';
import { TextBox } from 'devextreme-react/text-box';
import { SelectBox } from 'devextreme-react/select-box';
import { useSelector } from 'react-redux';
import notify from 'devextreme/ui/notify';
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
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    fullName: '',
    employeestatus: 'Active',
    siteId: siteId || null
  });
  const [isSaving, setIsSaving] = useState(false);
  const searchTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  // Get sites from Redux store
  const sites = useSelector((state) => state.site?.sites || []);

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

    // Stop any ongoing search immediately
    setIsLoading(false);

    // Clear any pending search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    // Clear all local state immediately
    setSelectedEmployee(null);
    setSearchTerm('');
    setEmployees([]);
    setShowDropdown(false);

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

  const handleAddNewEmployee = useCallback(() => {
    setShowDropdown(false);
    setNewEmployee({
      fullName: searchTerm || '',
      employeestatus: 'Active',
      siteId: siteId || null
    });
    setShowAddPopup(true);
  }, [searchTerm, siteId]);

  const handleSaveNewEmployee = useCallback(async () => {
    // Validation
    if (!newEmployee.fullName || newEmployee.fullName.trim().length < 2) {
      notify('Please enter employee full name (minimum 2 characters)', 'error', 3000);
      return;
    }

    setIsSaving(true);
    try {
      const response = await axiosInstance.post('/employee', newEmployee);
      console.log('Employee creation response:', response.data);

      // Response structure: { success: bool, message: string, employeeDto: {...} }
      const success = response.data?.success || response.data?.Success;
      const message = response.data?.message || response.data?.Message;
      const created = response.data?.employeeDto || response.data?.EmployeeDto;

      if (success && created && created.id) {
        notify(message || 'Employee created successfully', 'success', 2000);

        // Close popup first
        setShowAddPopup(false);

        // Update search term with the newly created employee's name
        const workNo = created.employeeWorkNo ? ` (${created.employeeWorkNo})` : '';
        const displayName = created.fullName + workNo;
        setSearchTerm(displayName);

        // Select the newly created employee
        setSelectedEmployee(created);

        // Notify parent component
        if (onValueChanged) {
          onValueChanged({ value: created.id });
        }

        // Trigger search to refresh dropdown with the new employee
        await performSearch(created.fullName);

        // Reset form
        setNewEmployee({
          fullName: '',
          employeestatus: 'Active',
          siteId: siteId || null
        });
      } else {
        notify(message || 'Failed to create employee', 'error', 3000);
      }
    } catch (err) {
      console.error('Error creating employee:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.Message || 'Error creating employee';
      notify(errorMsg, 'error', 3000);
    } finally {
      setIsSaving(false);
    }
  }, [newEmployee, siteId, onValueChanged, performSearch]);

  const handleCancelAddEmployee = useCallback(() => {
    setShowAddPopup(false);
    setNewEmployee({
      fullName: '',
      employeestatus: 'Active',
      siteId: siteId || null
    });
  }, [siteId]);

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
              backgroundColor: disabled ? '#f8f9fa' : 'transparent',
              paddingRight: '40px',
              border: 'none',
              outline: 'none'
            }}
          />
          <div className="dx-texteditor-buttons-container">
            {(selectedEmployee || searchTerm) && (
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
                              <div style={{ display: 'flex', alignItems: 'center' }}>
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
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
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
                          {searchTerm.length >= 2 && !isLoading && (
                            <div className="dx-list-item"
                              style={{
                                borderTop: '1px solid #e6e6e6',
                                cursor: 'pointer'
                              }}
                              onClick={handleAddNewEmployee}
                              onMouseEnter={(e) => e.currentTarget.classList.add('dx-state-hover')}
                              onMouseLeave={(e) => e.currentTarget.classList.remove('dx-state-hover')}
                            >
                              <div className="dx-list-item-content" style={{
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#337ab7',
                                fontSize: '14px',
                                fontWeight: '500'
                              }}>
                                <i className="fa-light fa-plus-circle" style={{ fontSize: '16px' }}></i>
                                <span>Add New Employee</span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Employee Popup */}
      <Popup
        visible={showAddPopup}
        onHiding={handleCancelAddEmployee}
        dragEnabled={false}
        showTitle={true}
        title="Add New Employee / Driver"
        showCloseButton={true}
        width="auto"
        maxWidth={500}
        height="auto"
        position={{ my: 'center', at: 'center', of: window }}
        wrapperAttr={{ class: 'tw-mx-4' }}
      >
        <div className="tw-p-4 tw-min-w-[280px] tw-max-w-full">
          <div className="tw-mb-4">
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-2 tw-text-gray-700">
              Full Name <span className="tw-text-red-500">*</span>
            </label>
            <TextBox
              value={newEmployee.fullName}
              onValueChanged={(e) => setNewEmployee({ ...newEmployee, fullName: e.value })}
              placeholder="Enter employee full name"
              width="100%"
            />
          </div>

          <div className="tw-mb-4">
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-2 tw-text-gray-700">
              Site
            </label>
            <SelectBox
              dataSource={sites}
              displayExpr="name"
              valueExpr="id"
              value={newEmployee.siteId}
              onValueChanged={(e) => setNewEmployee({ ...newEmployee, siteId: e.value })}
              placeholder="Select a site"
              width="100%"
              showClearButton={true}
            />
          </div>
        </div>

        <ToolbarItem
          widget="dxButton"
          toolbar="bottom"
          location="after"
          options={{
            text: "Cancel",
            icon: "close",
            type: "normal",
            stylingMode: "contained",
            onClick: handleCancelAddEmployee,
            disabled: isSaving
          }}
        />
        <ToolbarItem
          widget="dxButton"
          toolbar="bottom"
          location="after"
          options={{
            text: isSaving ? "Saving..." : "Save Employee",
            icon: isSaving ? "fas fa-spinner fa-spin" : "check",
            type: "success",
            stylingMode: "contained",
            onClick: handleSaveNewEmployee,
            disabled: isSaving || !newEmployee.fullName || newEmployee.fullName.trim().length < 2
          }}
        />
      </Popup>
    </div>
  );
};

export default EmployeeSearchableSelector;
