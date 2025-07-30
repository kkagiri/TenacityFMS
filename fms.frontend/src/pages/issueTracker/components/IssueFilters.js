import React, { useState, useEffect } from 'react';
import {
  SelectBox,
  DateBox,
  TextBox,
  Button
} from 'devextreme-react';

import Form, {
  Item,
  GroupItem
} from 'devextreme-react/form';

/**
 * Issue Filters Component
 * Advanced filtering interface for issues with multiple criteria
 */
const IssueFilters = ({
  categories = [],
  priorities = [],
  statuses = [],
  currentFilters = {},
  onApplyFilters,
  onClearFilters,
  className = ''
}) => {
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    vehicleId: '',
    assignedTo: '',
    dateFrom: null,
    dateTo: null,
    searchText: '',
    ...currentFilters
  });

  useEffect(() => {
    setFilters({
      status: '',
      priority: '',
      category: '',
      vehicleId: '',
      assignedTo: '',
      dateFrom: null,
      dateTo: null,
      searchText: '',
      ...currentFilters
    });
  }, [currentFilters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilters = () => {
    // Remove empty values
    const cleanFilters = Object.keys(filters).reduce((acc, key) => {
      if (filters[key] !== null && filters[key] !== '' && filters[key] !== undefined) {
        acc[key] = filters[key];
      }
      return acc;
    }, {});

    onApplyFilters && onApplyFilters(cleanFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      status: '',
      priority: '',
      category: '',
      vehicleId: '',
      assignedTo: '',
      dateFrom: null,
      dateTo: null,
      searchText: ''
    };
    setFilters(emptyFilters);
    onClearFilters && onClearFilters();
  };

  const hasActiveFilters = Object.values(filters).some(value =>
    value !== null && value !== '' && value !== undefined
  );

  // Prepare data sources for SelectBoxes
  const statusDataSource = statuses.map(status => ({
    id: status.id || status.name || status,
    name: status.name || status
  }));

  const priorityDataSource = priorities.map(priority => ({
    id: priority.id || priority.name || priority,
    name: priority.name || priority
  }));

  const categoryDataSource = categories.map(category => ({
    id: category.id || category.name || category,
    name: category.name || category
  }));

  return (
    <div className={`issue-filters tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-sm ${className}`}>
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">
          <i className="fa-light fa-filter tw-mr-2"></i>
          Filter Issues
        </h3>
        {hasActiveFilters && (
          <span className="tw-inline-flex tw-items-center tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium tw-bg-blue-100 tw-text-blue-800">
            <i className="fa-light fa-check tw-mr-1"></i>
            Filters Applied
          </span>
        )}
      </div>

      <Form
        formData={filters}
        colCount={2}
        labelMode="top"
        className="tw-mb-6"
      >
        <GroupItem colSpan={2} caption="Search">
          <Item dataField="searchText" editorType="dxTextBox">
            <TextBox
              placeholder="Search by title, description, or ID..."
              value={filters.searchText}
              onValueChanged={(e) => handleFilterChange('searchText', e.value)}
              showClearButton={true}
            />
          </Item>
        </GroupItem>

        <GroupItem colSpan={2} caption="Status & Priority">
          <Item dataField="status" editorType="dxSelectBox">
            <SelectBox
              dataSource={statusDataSource}
              displayExpr="name"
              valueExpr="name"
              placeholder="Select status..."
              value={filters.status}
              onValueChanged={(e) => handleFilterChange('status', e.value)}
              showClearButton={true}
            />
          </Item>

          <Item dataField="priority" editorType="dxSelectBox">
            <SelectBox
              dataSource={priorityDataSource}
              displayExpr="name"
              valueExpr="name"
              placeholder="Select priority..."
              value={filters.priority}
              onValueChanged={(e) => handleFilterChange('priority', e.value)}
              showClearButton={true}
            />
          </Item>
        </GroupItem>

        <GroupItem colSpan={2} caption="Category & Assignment">
          <Item dataField="category" editorType="dxSelectBox">
            <SelectBox
              dataSource={categoryDataSource}
              displayExpr="name"
              valueExpr="name"
              placeholder="Select category..."
              value={filters.category}
              onValueChanged={(e) => handleFilterChange('category', e.value)}
              showClearButton={true}
            />
          </Item>

          <Item dataField="assignedTo" editorType="dxTextBox">
            <TextBox
              placeholder="Assigned to..."
              value={filters.assignedTo}
              onValueChanged={(e) => handleFilterChange('assignedTo', e.value)}
              showClearButton={true}
            />
          </Item>
        </GroupItem>

        <GroupItem colSpan={2} caption="Date Range">
          <Item dataField="dateFrom" editorType="dxDateBox">
            <DateBox
              placeholder="From date..."
              value={filters.dateFrom}
              onValueChanged={(e) => handleFilterChange('dateFrom', e.value)}
              showClearButton={true}
              displayFormat="MM/dd/yyyy"
              max={filters.dateTo || new Date()}
            />
          </Item>

          <Item dataField="dateTo" editorType="dxDateBox">
            <DateBox
              placeholder="To date..."
              value={filters.dateTo}
              onValueChanged={(e) => handleFilterChange('dateTo', e.value)}
              showClearButton={true}
              displayFormat="MM/dd/yyyy"
              min={filters.dateFrom}
              max={new Date()}
            />
          </Item>
        </GroupItem>

        <GroupItem colSpan={2} caption="Vehicle">
          <Item dataField="vehicleId" editorType="dxTextBox">
            <TextBox
              placeholder="Vehicle ID or name..."
              value={filters.vehicleId}
              onValueChanged={(e) => handleFilterChange('vehicleId', e.value)}
              showClearButton={true}
            />
          </Item>
        </GroupItem>
      </Form>

      {/* Action Buttons */}
      <div className="tw-flex tw-justify-between tw-items-center tw-pt-4 tw-border-t tw-border-gray-200">
        <div className="tw-text-sm tw-text-gray-600">
          {hasActiveFilters ? (
            <span>
              <i className="fa-light fa-filter tw-mr-1"></i>
              Active filters applied
            </span>
          ) : (
            <span>
              <i className="fa-light fa-info-circle tw-mr-1"></i>
              No filters applied
            </span>
          )}
        </div>

        <div className="tw-flex tw-gap-3">
          <Button
            text="Clear All"
            type="normal"
            stylingMode="outlined"
            icon="fa-light fa-times"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
          />

          <Button
            text="Apply Filters"
            type="default"
            stylingMode="contained"
            icon="fa-light fa-check"
            onClick={handleApplyFilters}
            className="tw-bg-blue-600 tw-text-white"
          />
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="tw-mt-4 tw-pt-4 tw-border-t tw-border-gray-100">
        <h4 className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-3">Quick Filters:</h4>
        <div className="tw-flex tw-flex-wrap tw-gap-2">
          <Button
            text="Critical Issues"
            type="normal"
            stylingMode="outlined"
            onClick={() => {
              setFilters(prev => ({ ...prev, priority: 'Critical' }));
              handleFilterChange('priority', 'Critical');
            }}
            className="tw-text-xs tw-border-red-500 tw-text-red-600 hover:tw-bg-red-50"
          />

          <Button
            text="Open Issues"
            type="normal"
            stylingMode="outlined"
            onClick={() => {
              setFilters(prev => ({ ...prev, status: 'Open' }));
              handleFilterChange('status', 'Open');
            }}
            className="tw-text-xs tw-border-blue-500 tw-text-blue-600 hover:tw-bg-blue-50"
          />

          <Button
            text="Unassigned"
            type="normal"
            stylingMode="outlined"
            onClick={() => {
              setFilters(prev => ({ ...prev, assignedTo: '' }));
              handleFilterChange('assignedTo', '');
            }}
            className="tw-text-xs tw-border-gray-500 tw-text-gray-600 hover:tw-bg-gray-50"
          />

          <Button
            text="This Week"
            type="normal"
            stylingMode="outlined"
            onClick={() => {
              const today = new Date();
              const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
              setFilters(prev => ({
                ...prev,
                dateFrom: weekAgo,
                dateTo: today
              }));
            }}
            className="tw-text-xs tw-border-green-500 tw-text-green-600 hover:tw-bg-green-50"
          />
        </div>
      </div>
    </div>
  );
};

export default IssueFilters;
