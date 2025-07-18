//Cursor - System Configuration Filters Component
import React from 'react';
import PropTypes from 'prop-types';
import SelectBox from 'devextreme-react/select-box';
import TextBox from 'devextreme-react/text-box';
import Button from 'devextreme-react/button';

const SystemConfigFilters = ({ filters, onFilterChange, loading }) => {
  // Category options for filtering
  const categoryOptions = [
    { value: '', text: 'All Categories' },
    { value: 'General', text: 'General' },
    { value: 'System', text: 'System' },
    { value: 'Security', text: 'Security' },
    { value: 'Database', text: 'Database' },
    { value: 'API', text: 'API' },
    { value: 'UI', text: 'User Interface' },
    { value: 'Performance', text: 'Performance' },
    { value: 'Logging', text: 'Logging' },
    { value: 'Notification', text: 'Notification' },
    { value: 'Integration', text: 'Integration' }
  ];

  // Data type options for filtering
  const dataTypeOptions = [
    { value: '', text: 'All Data Types' },
    { value: 'String', text: 'String' },
    { value: 'Integer', text: 'Integer' },
    { value: 'Decimal', text: 'Decimal' },
    { value: 'Boolean', text: 'Boolean' },
    { value: 'DateTime', text: 'DateTime' },
    { value: 'Json', text: 'JSON' },
    { value: 'Url', text: 'URL' },
    { value: 'Email', text: 'Email' },
    { value: 'Password', text: 'Password' }
  ];

  // Status options for filtering
  const statusOptions = [
    { value: null, text: 'All Status' },
    { value: true, text: 'Active Only' },
    { value: false, text: 'Inactive Only' }
  ];

  // Editable options for filtering
  const editableOptions = [
    { value: null, text: 'All Configurations' },
    { value: true, text: 'Editable Only' },
    { value: false, text: 'Read-Only Only' }
  ];

  const handleFilterChange = (field, value) => {
    const newFilters = {
      ...filters,
      [field]: value
    };
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      category: '',
      dataType: '',
      isActive: null,
      isEditable: null,
      searchTerm: ''
    };
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = filters.category || filters.dataType ||
    filters.isActive !== null || filters.isEditable !== null || filters.searchTerm;

  return (
    <div className="system-config-filters">
      <div className="filter-row">
        <div className="filter-item">
          <label className="filter-label">Search</label>
          <TextBox
            value={filters.searchTerm || ''}
            placeholder="Search by key, value, or description..."
            onValueChanged={(e) => handleFilterChange('searchTerm', e.value)}
            disabled={loading}
            showClearButton={true}
          />
        </div>

        <div className="filter-item">
          <label className="filter-label">Category</label>
          <SelectBox
            dataSource={categoryOptions}
            valueExpr="value"
            displayExpr="text"
            value={filters.category || ''}
            onValueChanged={(e) => handleFilterChange('category', e.value)}
            disabled={loading}
          />
        </div>

        <div className="filter-item">
          <label className="filter-label">Data Type</label>
          <SelectBox
            dataSource={dataTypeOptions}
            valueExpr="value"
            displayExpr="text"
            value={filters.dataType || ''}
            onValueChanged={(e) => handleFilterChange('dataType', e.value)}
            disabled={loading}
          />
        </div>

        <div className="filter-item">
          <label className="filter-label">Status</label>
          <SelectBox
            dataSource={statusOptions}
            valueExpr="value"
            displayExpr="text"
            value={filters.isActive}
            onValueChanged={(e) => handleFilterChange('isActive', e.value)}
            disabled={loading}
          />
        </div>

        <div className="filter-item">
          <label className="filter-label">Editability</label>
          <SelectBox
            dataSource={editableOptions}
            valueExpr="value"
            displayExpr="text"
            value={filters.isEditable}
            onValueChanged={(e) => handleFilterChange('isEditable', e.value)}
            disabled={loading}
          />
        </div>

        <div className="filter-actions">
          <Button
            text="Clear Filters"
            type="normal"
            icon="fa fa-times"
            onClick={handleClearFilters}
            disabled={loading || !hasActiveFilters}
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2">
          <span className="tw-text-sm tw-font-medium tw-text-gray-700">Active filters:</span>

          {filters.searchTerm && (
            <span className="tw-inline-flex tw-items-center tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium tw-bg-blue-100 tw-text-blue-800">
              Search: "{filters.searchTerm}"
              <button
                onClick={() => handleFilterChange('searchTerm', '')}
                className="tw-ml-1 tw-text-blue-600 hover:tw-text-blue-800"
              >
                ×
              </button>
            </span>
          )}

          {filters.category && (
            <span className="tw-inline-flex tw-items-center tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium tw-bg-green-100 tw-text-green-800">
              Category: {filters.category}
              <button
                onClick={() => handleFilterChange('category', '')}
                className="tw-ml-1 tw-text-green-600 hover:tw-text-green-800"
              >
                ×
              </button>
            </span>
          )}

          {filters.dataType && (
            <span className="tw-inline-flex tw-items-center tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium tw-bg-purple-100 tw-text-purple-800">
              Type: {filters.dataType}
              <button
                onClick={() => handleFilterChange('dataType', '')}
                className="tw-ml-1 tw-text-purple-600 hover:tw-text-purple-800"
              >
                ×
              </button>
            </span>
          )}

          {filters.isActive !== null && (
            <span className="tw-inline-flex tw-items-center tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium tw-bg-yellow-100 tw-text-yellow-800">
              Status: {filters.isActive ? 'Active' : 'Inactive'}
              <button
                onClick={() => handleFilterChange('isActive', null)}
                className="tw-ml-1 tw-text-yellow-600 hover:tw-text-yellow-800"
              >
                ×
              </button>
            </span>
          )}

          {filters.isEditable !== null && (
            <span className="tw-inline-flex tw-items-center tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium tw-bg-indigo-100 tw-text-indigo-800">
              Editable: {filters.isEditable ? 'Yes' : 'No'}
              <button
                onClick={() => handleFilterChange('isEditable', null)}
                className="tw-ml-1 tw-text-indigo-600 hover:tw-text-indigo-800"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

SystemConfigFilters.propTypes = {
  filters: PropTypes.shape({
    category: PropTypes.string,
    dataType: PropTypes.string,
    isActive: PropTypes.bool,
    isEditable: PropTypes.bool,
    searchTerm: PropTypes.string
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

SystemConfigFilters.defaultProps = {
  loading: false
};

export default SystemConfigFilters;
