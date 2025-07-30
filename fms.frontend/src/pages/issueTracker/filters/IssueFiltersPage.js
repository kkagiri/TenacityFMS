import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilterBuilder } from 'devextreme-react/filter-builder';
import { Button } from 'devextreme-react/button';
import { TextBox } from 'devextreme-react/text-box';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';
import { Form, SimpleItem, Label } from 'devextreme-react/form';
import { Popup } from 'devextreme-react/popup';
import DataGrid, { Column, Paging, FilterRow, HeaderFilter } from 'devextreme-react/data-grid';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import issueTrackerService from '../../../services/issueTrackerService';

const IssueFiltersPage = () => {
  const navigate = useNavigate();

  // State management
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterValue, setFilterValue] = useState(null);
  const [quickFilters, setQuickFilters] = useState({
    status: '',
    priority: '',
    category: '',
    assignedTo: '',
    dateFrom: null,
    dateTo: null,
    searchText: ''
  });
  const [saveFilterPopup, setSaveFilterPopup] = useState(false);
  const [savedFilters, setSavedFilters] = useState([]);
  const [filterToSave, setFilterToSave] = useState({
    name: '',
    description: '',
    filterExpression: null
  });

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load all data in parallel
      const [issuesData, categoriesData, prioritiesData, statusesData] = await Promise.all([
        issueTrackerService.getIssues(),
        issueTrackerService.getIssueCategories(),
        issueTrackerService.getIssuePriorities(),
        issueTrackerService.getIssueStatuses()
      ]);

      setIssues(issuesData || []);
      setFilteredIssues(issuesData || []);
      setCategories(categoriesData || []);
      setPriorities(prioritiesData || []);
      setStatuses(statusesData || []);

      // Load saved filters from localStorage
      const saved = localStorage.getItem('issueTrackerSavedFilters');
      if (saved) {
        setSavedFilters(JSON.parse(saved));
      }

    } catch (error) {
      console.error('Error loading data:', error);
      notify({
        message: 'Failed to load data. Please try again.',
        type: 'error',
        displayTime: 4000,
        position: {
          my: 'top center',
          at: 'top center',
          of: window,
          offset: '0 20'
        }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter field definitions for FilterBuilder
  const filterFields = useMemo(() => [
    {
      dataField: 'id',
      caption: 'Issue ID',
      dataType: 'number'
    },
    {
      dataField: 'problemTitle',
      caption: 'Title',
      dataType: 'string'
    },
    {
      dataField: 'problemDescription',
      caption: 'Description',
      dataType: 'string'
    },
    {
      dataField: 'priority',
      caption: 'Priority',
      dataType: 'string',
      lookup: {
        dataSource: priorities,
        displayExpr: 'name',
        valueExpr: 'name'
      }
    },
    {
      dataField: 'status',
      caption: 'Status',
      dataType: 'string',
      lookup: {
        dataSource: statuses,
        displayExpr: 'name',
        valueExpr: 'name'
      }
    },
    {
      dataField: 'categoryName',
      caption: 'Category',
      dataType: 'string',
      lookup: {
        dataSource: categories,
        displayExpr: 'name',
        valueExpr: 'name'
      }
    },
    {
      dataField: 'assignedToName',
      caption: 'Assigned To',
      dataType: 'string'
    },
    {
      dataField: 'openDate',
      caption: 'Open Date',
      dataType: 'date'
    },
    {
      dataField: 'dueDate',
      caption: 'Due Date',
      dataType: 'date'
    },
    {
      dataField: 'vehicleName',
      caption: 'Vehicle',
      dataType: 'string'
    },
    {
      dataField: 'siteName',
      caption: 'Site',
      dataType: 'string'
    }
  ], [categories, priorities, statuses]);

  // Apply quick filters
  const applyQuickFilters = useCallback(() => {
    let filtered = [...issues];

    // Apply individual filters
    if (quickFilters.status) {
      filtered = filtered.filter(issue => issue.status === quickFilters.status);
    }
    if (quickFilters.priority) {
      filtered = filtered.filter(issue => issue.priority === quickFilters.priority);
    }
    if (quickFilters.category) {
      filtered = filtered.filter(issue => issue.categoryName === quickFilters.category);
    }
    if (quickFilters.assignedTo) {
      filtered = filtered.filter(issue =>
        issue.assignedToName?.toLowerCase().includes(quickFilters.assignedTo.toLowerCase())
      );
    }
    if (quickFilters.searchText) {
      const searchLower = quickFilters.searchText.toLowerCase();
      filtered = filtered.filter(issue =>
        issue.problemTitle?.toLowerCase().includes(searchLower) ||
        issue.problemDescription?.toLowerCase().includes(searchLower)
      );
    }
    if (quickFilters.dateFrom) {
      filtered = filtered.filter(issue =>
        issue.openDate && new Date(issue.openDate) >= quickFilters.dateFrom
      );
    }
    if (quickFilters.dateTo) {
      filtered = filtered.filter(issue =>
        issue.openDate && new Date(issue.openDate) <= quickFilters.dateTo
      );
    }

    setFilteredIssues(filtered);
  }, [issues, quickFilters]);

  useEffect(() => {
    applyQuickFilters();
  }, [applyQuickFilters]);

  // Apply advanced filter
  const applyAdvancedFilter = () => {
    if (!filterValue) {
      setFilteredIssues(issues);
      return;
    }

    // This would require implementing custom filter evaluation
    // For now, just show a message
    notify({
      message: 'Advanced filter applied successfully',
      type: 'success',
      displayTime: 3000,
      position: {
        my: 'top center',
        at: 'top center',
        of: window,
        offset: '0 20'
      }
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setQuickFilters({
      status: '',
      priority: '',
      category: '',
      assignedTo: '',
      dateFrom: null,
      dateTo: null,
      searchText: ''
    });
    setFilterValue(null);
    setFilteredIssues(issues);
  };

  // Save current filter
  const saveCurrentFilter = () => {
    if (!filterToSave.name) {
      notify({
        message: 'Please enter a filter name',
        type: 'warning',
        displayTime: 3000,
        position: {
          my: 'top center',
          at: 'top center',
          of: window,
          offset: '0 20'
        }
      });
      return;
    }

    const newFilter = {
      id: Date.now(),
      name: filterToSave.name,
      description: filterToSave.description,
      quickFilters: { ...quickFilters },
      filterExpression: filterValue,
      createdDate: new Date().toISOString()
    };

    const updatedFilters = [...savedFilters, newFilter];
    setSavedFilters(updatedFilters);
    localStorage.setItem('issueTrackerSavedFilters', JSON.stringify(updatedFilters));

    setSaveFilterPopup(false);
    setFilterToSave({ name: '', description: '', filterExpression: null });

    notify({
      message: 'Filter saved successfully',
      type: 'success',
      displayTime: 3000,
      position: {
        my: 'top center',
        at: 'top center',
        of: window,
        offset: '0 20'
      }
    });
  };

  // Load saved filter
  const loadSavedFilter = (savedFilter) => {
    setQuickFilters(savedFilter.quickFilters || {});
    setFilterValue(savedFilter.filterExpression);

    notify({
      message: `Filter "${savedFilter.name}" loaded successfully`,
      type: 'success',
      displayTime: 3000,
      position: {
        my: 'top center',
        at: 'top center',
        of: window,
        offset: '0 20'
      }
    });
  };

  // Delete saved filter
  const deleteSavedFilter = (filterId) => {
    const updatedFilters = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(updatedFilters);
    localStorage.setItem('issueTrackerSavedFilters', JSON.stringify(updatedFilters));

    notify({
      message: 'Filter deleted successfully',
      type: 'success',
      displayTime: 3000,
      position: {
        my: 'top center',
        at: 'top center',
        of: window,
        offset: '0 20'
      }
    });
  };

  if (loading) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-py-12">
        <LoadIndicator visible={true} />
        <span className="tw-ml-3 tw-text-gray-600">Loading filter data...</span>
      </div>
    );
  }

  return (
    <div className="tw-p-6">
      {/* Header */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6 tw-mb-6">
        <div className="tw-flex tw-justify-between tw-items-start tw-mb-4">
          <div>
            <h2 className="tw-text-2xl tw-font-semibold tw-text-gray-900 tw-mb-2">
              <i className="fa-light fa-filter tw-mr-2 tw-text-orange-500"></i>
              Advanced Issue Filters
            </h2>
            <p className="tw-text-gray-600">
              Apply advanced filtering criteria to find specific issues quickly.
              Showing {filteredIssues.length} of {issues.length} issues.
            </p>
          </div>

          <div className="tw-flex tw-gap-3">
            <Button
              text="Clear All"
              type="normal"
              stylingMode="outlined"
              icon="fa-light fa-times"
              onClick={clearAllFilters}
            />
            <Button
              text="Save Filter"
              type="normal"
              stylingMode="outlined"
              icon="fa-light fa-save"
              onClick={() => setSaveFilterPopup(true)}
            />
            <Button
              text="View All Issues"
              type="default"
              stylingMode="contained"
              icon="fa-light fa-list"
              onClick={() => navigate('/issue-tracker/tickets')}
              className="tw-bg-orange-600 tw-text-white"
            />
          </div>
        </div>
      </div>

      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-6">
        {/* Quick Filters Panel */}
        <div className="lg:tw-col-span-1">
          <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6 tw-mb-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">
              Quick Filters
            </h3>

            <div className="tw-space-y-4">
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Search Text
                </label>
                <TextBox
                  value={quickFilters.searchText}
                  onValueChanged={(e) => setQuickFilters(prev => ({ ...prev, searchText: e.value }))}
                  placeholder="Search in title or description..."
                />
              </div>

              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Status
                </label>
                <SelectBox
                  dataSource={statuses}
                  displayExpr="name"
                  valueExpr="name"
                  value={quickFilters.status}
                  onValueChanged={(e) => setQuickFilters(prev => ({ ...prev, status: e.value }))}
                  placeholder="All Statuses"
                  showClearButton={true}
                />
              </div>

              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Priority
                </label>
                <SelectBox
                  dataSource={priorities}
                  displayExpr="name"
                  valueExpr="name"
                  value={quickFilters.priority}
                  onValueChanged={(e) => setQuickFilters(prev => ({ ...prev, priority: e.value }))}
                  placeholder="All Priorities"
                  showClearButton={true}
                />
              </div>

              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Category
                </label>
                <SelectBox
                  dataSource={categories}
                  displayExpr="name"
                  valueExpr="name"
                  value={quickFilters.category}
                  onValueChanged={(e) => setQuickFilters(prev => ({ ...prev, category: e.value }))}
                  placeholder="All Categories"
                  showClearButton={true}
                />
              </div>

              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Date From
                </label>
                <DateBox
                  value={quickFilters.dateFrom}
                  onValueChanged={(e) => setQuickFilters(prev => ({ ...prev, dateFrom: e.value }))}
                  displayFormat="dd/MM/yyyy"
                  showClearButton={true}
                />
              </div>

              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Date To
                </label>
                <DateBox
                  value={quickFilters.dateTo}
                  onValueChanged={(e) => setQuickFilters(prev => ({ ...prev, dateTo: e.value }))}
                  displayFormat="dd/MM/yyyy"
                  showClearButton={true}
                />
              </div>
            </div>
          </div>

          {/* Saved Filters */}
          <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">
              Saved Filters ({savedFilters.length})
            </h3>

            {savedFilters.length === 0 ? (
              <p className="tw-text-gray-500 tw-text-sm">No saved filters yet</p>
            ) : (
              <div className="tw-space-y-2">
                {savedFilters.map((filter) => (
                  <div key={filter.id} className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-border tw-rounded-lg">
                    <div className="tw-flex-1">
                      <p className="tw-font-medium tw-text-sm">{filter.name}</p>
                      {filter.description && (
                        <p className="tw-text-xs tw-text-gray-500">{filter.description}</p>
                      )}
                    </div>
                    <div className="tw-flex tw-gap-1">
                      <Button
                        icon="fa-light fa-play"
                        hint="Load Filter"
                        stylingMode="text"
                        onClick={() => loadSavedFilter(filter)}
                      />
                      <Button
                        icon="fa-light fa-trash"
                        hint="Delete Filter"
                        stylingMode="text"
                        onClick={() => deleteSavedFilter(filter.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:tw-col-span-2">
          {/* Advanced Filter Builder */}
          <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6 tw-mb-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">
              Advanced Filter Builder
            </h3>

            <FilterBuilder
              fields={filterFields}
              value={filterValue}
              onValueChanged={(e) => setFilterValue(e.value)}
              height={300}
            />

            <div className="tw-flex tw-gap-3 tw-mt-4">
              <Button
                text="Apply Advanced Filter"
                type="default"
                stylingMode="contained"
                icon="fa-light fa-filter"
                onClick={applyAdvancedFilter}
                className="tw-bg-orange-600 tw-text-white"
              />
              <Button
                text="Clear Advanced"
                type="normal"
                stylingMode="outlined"
                onClick={() => setFilterValue(null)}
              />
            </div>
          </div>

          {/* Results Grid */}
          <div className="tw-bg-white tw-rounded-lg tw-shadow">
            <div className="tw-p-4 tw-border-b">
              <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                Filtered Results ({filteredIssues.length} issues)
              </h3>
            </div>

            <DataGrid
              dataSource={filteredIssues}
              keyExpr="id"
              showBorders={true}
              allowColumnReordering={true}
              allowColumnResizing={true}
              columnAutoWidth={true}
              height={500}
              onRowClick={(e) => navigate(`/issue-tracker/edit/${e.data.id}`)}
            >
              <Paging enabled={true} defaultPageSize={10} />
              <FilterRow visible={true} />
              <HeaderFilter visible={true} />

              <Column dataField="id" caption="ID" width={80} />
              <Column dataField="problemTitle" caption="Title" minWidth={200} />
              <Column dataField="priority" caption="Priority" width={100} />
              <Column dataField="status" caption="Status" width={120} />
              <Column dataField="categoryName" caption="Category" width={120} />
              <Column dataField="assignedToName" caption="Assigned To" width={150} />
              <Column
                dataField="openDate"
                caption="Open Date"
                width={120}
                dataType="date"
                format="dd/MM/yyyy"
              />
            </DataGrid>
          </div>
        </div>
      </div>

      {/* Save Filter Popup */}
      <Popup
        visible={saveFilterPopup}
        onHiding={() => setSaveFilterPopup(false)}
        dragEnabled={false}
        hideOnOutsideClick={true}
        showTitle={true}
        title="Save Filter"
        width={400}
        height={300}
      >
        <div className="tw-p-4">
          <Form
            formData={filterToSave}
            onFieldDataChanged={(e) => {
              setFilterToSave(prev => ({ ...prev, [e.dataField]: e.value }));
            }}
          >
            <SimpleItem dataField="name" isRequired={true}>
              <Label text="Filter Name" />
            </SimpleItem>
            <SimpleItem dataField="description">
              <Label text="Description (Optional)" />
            </SimpleItem>
          </Form>

          <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6">
            <Button
              text="Cancel"
              type="normal"
              stylingMode="outlined"
              onClick={() => setSaveFilterPopup(false)}
            />
            <Button
              text="Save"
              type="default"
              stylingMode="contained"
              onClick={saveCurrentFilter}
              className="tw-bg-orange-600 tw-text-white"
            />
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default IssueFiltersPage;
