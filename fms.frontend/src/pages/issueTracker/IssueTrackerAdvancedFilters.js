import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Form,
  Button,
  Popup,
  DataGrid,
  FilterBuilder,
  SelectBox,
  DateBox,
  TagBox,
  CheckBox,
  LoadPanel,
  Toast
} from 'devextreme-react';

import {
  SimpleItem,
  GroupItem,
  ButtonItem
} from 'devextreme-react/form';

import {
  Column,
  FilterRow,
  HeaderFilter,
  SearchPanel,
  Paging,
  ColumnChooser,
  Export,
  Summary,
  TotalItem
} from 'devextreme-react/data-grid';

import {
  fetchAdvancedFilters,
  saveAdvancedFilter,
  deleteAdvancedFilter,
  applyAdvancedFilter,
  fetchFilterMetadata
} from '../../../redux/actions/issueTrackerActions';

import useIssueTracker from '../../../hooks/useIssueTracker';
import './IssueTrackerAdvancedFilters.scss';

/**
 * Advanced Filtering Component for Issue Tracker
 * Features:
 * - Complex filter builder with nested conditions
 * - Saved filter templates
 * - Quick filter presets
 * - Custom date ranges
 * - Multi-field search
 * - Export filtered results
 * - Filter sharing and collaboration
 */
const IssueTrackerAdvancedFilters = () => {
  const dispatch = useDispatch();

  // Redux state
  const {
    issues,
    savedFilters,
    filterMetadata,
    loading
  } = useSelector(state => state.issueTracker);

  // Custom hook
  const { applyFilters, exportFilteredData } = useIssueTracker();

  // Local state
  const [activeFilter, setActiveFilter] = useState(null);
  const [filterBuilderValue, setFilterBuilderValue] = useState(null);
  const [quickFilters, setQuickFilters] = useState({});
  const [saveFilterPopupVisible, setSaveFilterPopupVisible] = useState(false);
  const [shareFilterPopupVisible, setShareFilterPopupVisible] = useState(false);
  const [filterToSave, setFilterToSave] = useState({
    name: '',
    description: '',
    isPublic: false,
    category: 'general'
  });
  const [filteredData, setFilteredData] = useState([]);
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    type: 'success',
    message: ''
  });

  // Filter field definitions
  const filterFields = [
    {
      dataField: 'id',
      caption: 'Issue ID',
      dataType: 'number'
    },
    {
      dataField: 'title',
      caption: 'Title',
      dataType: 'string'
    },
    {
      dataField: 'description',
      caption: 'Description',
      dataType: 'string'
    },
    {
      dataField: 'category',
      caption: 'Category',
      dataType: 'string',
      lookup: {
        dataSource: filterMetadata?.categories || [],
        displayExpr: 'name',
        valueExpr: 'value'
      }
    },
    {
      dataField: 'priority',
      caption: 'Priority',
      dataType: 'string',
      lookup: {
        dataSource: [
          { value: 'Critical', text: 'Critical' },
          { value: 'High', text: 'High' },
          { value: 'Medium', text: 'Medium' },
          { value: 'Low', text: 'Low' }
        ],
        displayExpr: 'text',
        valueExpr: 'value'
      }
    },
    {
      dataField: 'status',
      caption: 'Status',
      dataType: 'string',
      lookup: {
        dataSource: [
          { value: 'Open', text: 'Open' },
          { value: 'In Progress', text: 'In Progress' },
          { value: 'Pending', text: 'Pending' },
          { value: 'Resolved', text: 'Resolved' },
          { value: 'Closed', text: 'Closed' }
        ],
        displayExpr: 'text',
        valueExpr: 'value'
      }
    },
    {
      dataField: 'assignedTo',
      caption: 'Assigned To',
      dataType: 'string',
      lookup: {
        dataSource: filterMetadata?.users || [],
        displayExpr: 'fullName',
        valueExpr: 'id'
      }
    },
    {
      dataField: 'createdDate',
      caption: 'Created Date',
      dataType: 'date'
    },
    {
      dataField: 'dueDate',
      caption: 'Due Date',
      dataType: 'date'
    },
    {
      dataField: 'resolutionDate',
      caption: 'Resolution Date',
      dataType: 'date'
    },
    {
      dataField: 'vehicleId',
      caption: 'Vehicle',
      dataType: 'string',
      lookup: {
        dataSource: filterMetadata?.vehicles || [],
        displayExpr: 'name',
        valueExpr: 'id'
      }
    },
    {
      dataField: 'estimatedCost',
      caption: 'Estimated Cost',
      dataType: 'number',
      format: 'currency'
    },
    {
      dataField: 'actualCost',
      caption: 'Actual Cost',
      dataType: 'number',
      format: 'currency'
    },
    {
      dataField: 'tags',
      caption: 'Tags',
      dataType: 'string'
    }
  ];

  // Quick filter presets
  const quickFilterPresets = [
    {
      name: 'My Open Issues',
      icon: 'user',
      filter: ['assignedTo', '=', 'currentUser'],
      description: 'Issues assigned to me that are still open'
    },
    {
      name: 'High Priority',
      icon: 'priorityhigh',
      filter: [['priority', '=', 'Critical'], 'or', ['priority', '=', 'High']],
      description: 'Critical and high priority issues'
    },
    {
      name: 'Overdue',
      icon: 'clock',
      filter: [['dueDate', '<', new Date()], 'and', ['status', '<>', 'Closed']],
      description: 'Issues past their due date'
    },
    {
      name: 'Recent',
      icon: 'recent',
      filter: ['createdDate', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)],
      description: 'Issues created in the last 7 days'
    },
    {
      name: 'Unassigned',
      icon: 'user',
      filter: [['assignedTo', '=', null], 'or', ['assignedTo', '=', '']],
      description: 'Issues without an assigned user'
    },
    {
      name: 'Cost > $1000',
      icon: 'money',
      filter: [['estimatedCost', '>', 1000], 'or', ['actualCost', '>', 1000]],
      description: 'High-cost issues exceeding $1000'
    }
  ];

  // Initialize component
  useEffect(() => {
    loadFilterData();
  }, []);

  // Load filter data
  const loadFilterData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchAdvancedFilters()),
        dispatch(fetchFilterMetadata())
      ]);
    } catch (error) {
      console.error('Failed to load filter data:', error);
    }
  }, [dispatch]);

  // Apply filter
  const handleApplyFilter = useCallback(async (filterValue) => {
    try {
      if (!filterValue) {
        setFilteredData(issues);
        return;
      }

      const result = await dispatch(applyAdvancedFilter(filterValue));
      setFilteredData(result.data || []);
      setActiveFilter(filterValue);
    } catch (error) {
      console.error('Failed to apply filter:', error);
      showToast('error', 'Failed to apply filter');
    }
  }, [dispatch, issues]);

  // Handle quick filter
  const handleQuickFilter = (preset) => {
    setFilterBuilderValue(preset.filter);
    handleApplyFilter(preset.filter);
  };

  // Handle save filter
  const handleSaveFilter = async () => {
    try {
      const filterData = {
        ...filterToSave,
        filterValue: filterBuilderValue,
        createdBy: 'currentUser', // Will be replaced by actual user
        createdDate: new Date()
      };

      await dispatch(saveAdvancedFilter(filterData));
      setSaveFilterPopupVisible(false);
      setFilterToSave({
        name: '',
        description: '',
        isPublic: false,
        category: 'general'
      });
      showToast('success', 'Filter saved successfully');
    } catch (error) {
      console.error('Failed to save filter:', error);
      showToast('error', 'Failed to save filter');
    }
  };

  // Handle load saved filter
  const handleLoadSavedFilter = (savedFilter) => {
    setFilterBuilderValue(savedFilter.filterValue);
    handleApplyFilter(savedFilter.filterValue);
  };

  // Handle delete saved filter
  const handleDeleteSavedFilter = async (filterId) => {
    try {
      await dispatch(deleteAdvancedFilter(filterId));
      showToast('success', 'Filter deleted successfully');
    } catch (error) {
      console.error('Failed to delete filter:', error);
      showToast('error', 'Failed to delete filter');
    }
  };

  // Handle export filtered data
  const handleExportFiltered = async (format = 'excel') => {
    try {
      await exportFilteredData(filteredData, format);
      showToast('success', `Data exported to ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      showToast('error', 'Export failed');
    }
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilterBuilderValue(null);
    setActiveFilter(null);
    setFilteredData(issues);
    setQuickFilters({});
  };

  // Show toast message
  const showToast = (type, message) => {
    setToastConfig({
      visible: true,
      type,
      message
    });
  };

  // Render quick filters
  const renderQuickFilters = () => (
    <div className="quick-filters">
      <h3>Quick Filters</h3>
      <div className="quick-filter-buttons">
        {quickFilterPresets.map((preset, index) => (
          <Button
            key={index}
            text={preset.name}
            icon={preset.icon}
            type="default"
            hint={preset.description}
            onClick={() => handleQuickFilter(preset)}
            className="quick-filter-btn"
          />
        ))}
      </div>
    </div>
  );

  // Render saved filters
  const renderSavedFilters = () => (
    <div className="saved-filters">
      <div className="saved-filters-header">
        <h3>Saved Filters</h3>
        <Button
          text="Save Current"
          icon="save"
          type="default"
          onClick={() => setSaveFilterPopupVisible(true)}
          disabled={!filterBuilderValue}
        />
      </div>

      <div className="saved-filters-list">
        {savedFilters?.map((filter) => (
          <div key={filter.id} className="saved-filter-item">
            <div className="filter-info">
              <span className="filter-name">{filter.name}</span>
              <span className="filter-description">{filter.description}</span>
              <span className="filter-meta">
                {filter.isPublic ? 'Public' : 'Private'} • {filter.category}
              </span>
            </div>

            <div className="filter-actions">
              <Button
                icon="check"
                hint="Apply Filter"
                onClick={() => handleLoadSavedFilter(filter)}
              />
              <Button
                icon="trash"
                hint="Delete Filter"
                onClick={() => handleDeleteSavedFilter(filter.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render results grid
  const renderResultsGrid = () => (
    <div className="results-section">
      <div className="results-header">
        <h3>Filtered Results ({filteredData.length} items)</h3>

        <div className="results-actions">
          <Button
            text="Export Excel"
            icon="export"
            onClick={() => handleExportFiltered('excel')}
            disabled={filteredData.length === 0}
          />
          <Button
            text="Export PDF"
            icon="exportpdf"
            onClick={() => handleExportFiltered('pdf')}
            disabled={filteredData.length === 0}
          />
          <Button
            text="Clear Filters"
            icon="clear"
            onClick={handleClearFilters}
            disabled={!activeFilter}
          />
        </div>
      </div>

      <DataGrid
        dataSource={filteredData}
        showBorders={true}
        allowColumnReordering={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
        wordWrapEnabled={true}
      >
        <Column dataField="id" caption="ID" width={80} />
        <Column dataField="title" caption="Title" />
        <Column dataField="category" caption="Category" width={120} />
        <Column dataField="priority" caption="Priority" width={100} />
        <Column dataField="status" caption="Status" width={120} />
        <Column dataField="assignedTo" caption="Assigned To" width={150} />
        <Column dataField="createdDate" caption="Created" dataType="date" width={120} />
        <Column dataField="dueDate" caption="Due Date" dataType="date" width={120} />
        <Column dataField="actualCost" caption="Cost" dataType="number" format="currency" width={100} />

        <SearchPanel visible={true} width={240} placeholder="Search..." />
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <ColumnChooser enabled={true} />
        <Paging pageSize={20} />
        <Export enabled={true} fileName="Filtered_Issues" />

        <Summary>
          <TotalItem
            column="id"
            summaryType="count"
            displayFormat="Total: {0} issues"
          />
          <TotalItem
            column="actualCost"
            summaryType="sum"
            displayFormat="Total Cost: {0}"
            valueFormat="currency"
          />
        </Summary>
      </DataGrid>
    </div>
  );

  return (
    <div className="issue-tracker-advanced-filters">
      <div className="filters-header">
        <h1>Advanced Filters</h1>

        <div className="header-actions">
          <Button
            text="Reset All"
            icon="refresh"
            onClick={handleClearFilters}
          />
        </div>
      </div>

      <div className="filters-content">
        <div className="filters-panel">
          {renderQuickFilters()}

          <div className="filter-builder">
            <h3>Custom Filter Builder</h3>
            <FilterBuilder
              value={filterBuilderValue}
              onValueChanged={(e) => setFilterBuilderValue(e.value)}
              fields={filterFields}
              groupOperations={['and', 'or', 'notAnd', 'notOr']}
              allowHierarchicalFields={true}
            />

            <div className="filter-builder-actions">
              <Button
                text="Apply Filter"
                type="success"
                icon="check"
                onClick={() => handleApplyFilter(filterBuilderValue)}
                disabled={!filterBuilderValue}
              />
              <Button
                text="Clear"
                icon="clear"
                onClick={() => setFilterBuilderValue(null)}
                disabled={!filterBuilderValue}
              />
            </div>
          </div>

          {renderSavedFilters()}
        </div>

        <div className="results-panel">
          {renderResultsGrid()}
        </div>
      </div>

      {/* Save Filter Popup */}
      <Popup
        visible={saveFilterPopupVisible}
        onHiding={() => setSaveFilterPopupVisible(false)}
        dragEnabled={false}
        closeOnOutsideClick={true}
        showTitle={true}
        title="Save Filter"
        width={500}
        height="auto"
      >
        <div className="save-filter-popup">
          <Form
            formData={filterToSave}
            onFieldDataChanged={(e) =>
              setFilterToSave({ ...filterToSave, [e.dataField]: e.value })
            }
            labelLocation="top"
          >
            <SimpleItem
              dataField="name"
              caption="Filter Name"
              isRequired={true}
              editorOptions={{
                placeholder: 'Enter filter name...'
              }}
              validationRules={[
                { type: 'required', message: 'Filter name is required' }
              ]}
            />

            <SimpleItem
              dataField="description"
              caption="Description"
              editorType="dxTextArea"
              editorOptions={{
                placeholder: 'Enter filter description...',
                height: 80
              }}
            />

            <SimpleItem
              dataField="category"
              caption="Category"
              editorType="dxSelectBox"
              editorOptions={{
                dataSource: [
                  { value: 'general', text: 'General' },
                  { value: 'reports', text: 'Reports' },
                  { value: 'management', text: 'Management' },
                  { value: 'analysis', text: 'Analysis' }
                ],
                displayExpr: 'text',
                valueExpr: 'value'
              }}
            />

            <SimpleItem
              dataField="isPublic"
              caption="Share with team"
              editorType="dxCheckBox"
            />
          </Form>

          <div className="popup-actions">
            <Button
              text="Cancel"
              onClick={() => setSaveFilterPopupVisible(false)}
            />
            <Button
              text="Save Filter"
              type="success"
              onClick={handleSaveFilter}
            />
          </div>
        </div>
      </Popup>

      {/* Toast Messages */}
      <Toast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        onHiding={() => setToastConfig({ ...toastConfig, visible: false })}
        displayTime={3000}
      />

      <LoadPanel
        visible={loading.filters}
        message="Loading filter data..."
        showPane={true}
        shading={true}
      />
    </div>
  );
};

export default IssueTrackerAdvancedFilters;
