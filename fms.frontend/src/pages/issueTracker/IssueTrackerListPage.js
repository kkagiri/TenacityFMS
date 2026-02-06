import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DataGrid,
  Column,
  Paging,
  FilterRow,
  SearchPanel,
  Toolbar,
  Item,
  LoadPanel,
  Button,
  Popup,
  SelectBox,
  Export,
  Summary,
  TotalItem,
  GroupPanel,
  Grouping
} from 'devextreme-react';

import useIssueTracker from '../../hooks/useIssueTracker';
import IssueCard from './components/IssueCard';
import IssuePriorityBadge from './components/IssuePriorityBadge';
import IssueStatusIndicator from './components/IssueStatusIndicator';
import IssueFilters from './components/IssueFilters';

/**
 * Issue Tracker List Page
 * Comprehensive list view with advanced filtering and bulk operations
 */
const IssueTrackerListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we came from a related issue link
  const highlightIssueId = location.state?.highlightIssueId;

  const {
    issues,
    totalCount,
    categories,
    priorities,
    statuses,
    filters,
    selectedIssues,
    loading,
    error,
    hasSelectedIssues,
    selectedIssuesCount,
    loadIssues,
    updateFilters,
    resetFilters,
    selectIssues,
    clearSelection,
    assignIssuesBulk,
    updateStatusBulk,
    clearErrorState
  } = useIssueTracker();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'cards'
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkAssignTo, setBulkAssignTo] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const dataGridRef = useRef(null);

  // Apply filters from navigation state (e.g., from detail page vehicle/site history links)
  useEffect(() => {
    if (location.state?.applyFilters) {
      updateFilters(location.state.applyFilters);
      // Clear the navigation state after applying
      window.history.replaceState({}, document.title);
    }
  }, [location.state, updateFilters]);

  useEffect(() => {
    loadIssues(filters);
  }, [filters, loadIssues]);

  // Debug: Log issue data to console
  useEffect(() => {
    if (issues && issues.length > 0) {
      console.log('🔍 Issue data structure:', issues[0]);
      console.log('🔍 Assigned to value:', issues[0]?.assignToUserName);
    }
  }, [issues]);

  // Handle row highlighting when coming from related issue
  useEffect(() => {
    if (highlightIssueId && dataGridRef.current && issues.length > 0) {
      const instance = dataGridRef.current.instance;
      const rowIndex = instance.getRowIndexByKey(highlightIssueId);
      if (rowIndex >= 0) {
        instance.selectRows([highlightIssueId], false);
        instance.navigateToRow(highlightIssueId);

        // Clear highlight after a few seconds
        setTimeout(() => {
          instance.clearSelection();
        }, 3000);
      }
    }
  }, [highlightIssueId, issues]);

  const handleRowClick = (e) => {
    if (e.rowType === 'data') {
      navigate(`/issue-tracker/details/${e.data.id}`);
    }
  };

  const handleSelectionChanged = (e) => {
    selectIssues(e.selectedRowsData);
  };

  const handleFilterChange = (newFilters) => {
    updateFilters(newFilters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    resetFilters();
    setShowFilters(false);
  };

  const handleBulkAction = async () => {
    if (!hasSelectedIssues) return;

    try {
      const issueIds = selectedIssues.map(issue => issue.id);

      if (bulkAction === 'assign' && bulkAssignTo) {
        await assignIssuesBulk({
          issueIds,
          assignedTo: bulkAssignTo
        });
      } else if (bulkAction === 'status' && bulkStatus) {
        await updateStatusBulk({
          issueIds,
          status: bulkStatus
        });
      }

      // Refresh the list
      loadIssues(filters);
      clearSelection();
      setShowBulkActions(false);
      setBulkAction('');
      setBulkAssignTo('');
      setBulkStatus('');
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const formatDate = (cellData) => {
    if (!cellData.value) return '';
    const date = new Date(cellData.value);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderPriorityCell = (cellData) => (
    <IssuePriorityBadge priority={cellData.value} size="sm" />
  );

  const renderStatusCell = (cellData) => (
    <IssueStatusIndicator status={cellData.value} size="sm" />
  );

  const renderActionsCell = (cellData) => (
    <div className="tw-flex tw-gap-1">
      <Button
        icon="fa-light fa-eye"
        hint="View Details"
        stylingMode="text"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/issue-tracker/details/${cellData.data.id}`);
        }}
      />
      <Button
        icon="fa-light fa-edit"
        hint="Edit Issue"
        stylingMode="text"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/issue-tracker/details/${cellData.data.id}`);
        }}
      />
      {cellData.data.gpsLatitude && cellData.data.gpsLongitude && (
        <Button
          icon="fa-light fa-map-marker-alt"
          hint="View Location"
          stylingMode="text"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Open GPS map modal
          }}
        />
      )}
    </div>
  );

  if (loading.issues && issues.length === 0) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-min-h-screen">
        <LoadPanel visible={true} message="Loading issues..." />
      </div>
    );
  }

  return (
    <div className="issue-tracker-list-page tw-p-6">
      {/* Header */}
      <div className="tw-flex tw-flex-col lg:tw-flex-row tw-justify-between tw-items-start lg:tw-items-center tw-mb-6">
        <div className="tw-mb-4 lg:tw-mb-0">
          <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-mb-2">
            <i className="fa-light fa-list tw-mr-3 tw-text-blue-500"></i>
            Issues List
          </h1>
          <p className="tw-text-gray-600">
            {totalCount > 0 ? `${totalCount} issues total` : 'No issues found'}
          </p>
        </div>

        <div className="tw-flex tw-flex-wrap tw-gap-3">
          <Button
            text="New Issue"
            type="default"
            stylingMode="contained"
            icon="fa-light fa-plus"
            onClick={() => navigate('/issue-tracker/new')}
            className="tw-bg-blue-600 tw-text-white"
          />

          <Button
            text="Filters"
            type="normal"
            stylingMode="outlined"
            icon="fa-light fa-filter"
            onClick={() => setShowFilters(true)}
          />

          {hasSelectedIssues && (
            <Button
              text={`Bulk Actions (${selectedIssuesCount})`}
              type="normal"
              stylingMode="outlined"
              icon="fa-light fa-tasks"
              onClick={() => setShowBulkActions(true)}
            />
          )}

          <div className="tw-flex tw-items-center tw-gap-2 tw-ml-4">
            <span className="tw-text-sm tw-text-gray-600">View:</span>
            <Button
              icon="fa-light fa-th"
              type={viewMode === 'grid' ? 'default' : 'normal'}
              stylingMode={viewMode === 'grid' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('grid')}
              hint="Grid View"
            />
            <Button
              icon="fa-light fa-th-list"
              type={viewMode === 'cards' ? 'default' : 'normal'}
              stylingMode={viewMode === 'cards' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('cards')}
              hint="Card View"
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-md tw-p-4 tw-mb-4">
          <div className="tw-flex tw-justify-between tw-items-center">
            <div className="tw-flex">
              <i className="fa-light fa-exclamation-triangle tw-text-red-400 tw-mr-2"></i>
              <div className="tw-text-sm tw-text-red-800">
                <h4 className="tw-font-medium">Error loading issues</h4>
                <p>{error}</p>
              </div>
            </div>
            <Button
              icon="fa-light fa-times"
              stylingMode="text"
              onClick={clearErrorState}
            />
          </div>
        </div>
      )}

      {/* Content */}
      {viewMode === 'grid' ? (
        // DataGrid View
        <div className="tw-bg-white tw-rounded-lg tw-shadow-sm">
          <DataGrid
            ref={dataGridRef}
            dataSource={issues}
            keyExpr="id"
            showBorders={false}
            showRowLines={true}
            showColumnLines={false}
            rowAlternationEnabled={true}
            hoverStateEnabled={true}
            allowColumnResizing={true}
            columnAutoWidth={true}
            selection={{ mode: 'multiple', showCheckBoxesMode: 'always' }}
            onRowClick={handleRowClick}
            onSelectionChanged={handleSelectionChanged}
            height="calc(100vh - 250px)"
          >
            <FilterRow visible={true} />
            <SearchPanel visible={true} placeholder="Search issues..." />
            <GroupPanel visible={true} />
            <Paging enabled={true} pageSize={25} />
            <Export enabled={true} fileName="Issues" />

            <Toolbar>
              <Item name="groupPanel" />
              <Item name="searchPanel" />
              <Item name="exportButton" />
            </Toolbar>

            <Column
              dataField="id"
              caption="ID"
              width="80"
              allowSorting={true}
              cellRender={(data) => (
                <span className="tw-font-mono tw-text-sm">#{data.value}</span>
              )}
            />

            <Column
              dataField="problemTitle"
              caption="Title"
              minWidth="250"
              cellRender={(data) => (
                <div className="tw-flex tw-items-center">
                  {data.data.autoCreated && (
                    <i className="fa-light fa-satellite-dish tw-text-blue-500 tw-mr-2" title="Auto-Created"></i>
                  )}
                  <span className="tw-font-medium tw-truncate">{data.value}</span>
                </div>
              )}
            />

            <Column
              dataField="priorityName"
              caption="Priority"
              width="120"
              cellRender={renderPriorityCell}
              allowSorting={true}
            />

            <Column
              dataField="statusName"
              caption="Status"
              width="130"
              cellRender={renderStatusCell}
              allowSorting={true}
            />

            <Column
              dataField="categoryName"
              caption="Category"
              width="120"
              allowSorting={true}
            />

            {/* V2: Device Type Column */}
            <Column
              dataField="deviceTypeName"
              caption="Device Type"
              width="130"
              allowSorting={true}
              cellRender={(data) => {
                if (!data.value) return <span className="tw-text-gray-400">-</span>;
                const iconMap = {
                  'ATG': 'fa-gauge-high',
                  'PTS': 'fa-gas-pump',
                  'GPS': 'fa-satellite-dish',
                  'Vehicle': 'fa-car',
                  'Fuel Card': 'fa-credit-card',
                  'Network': 'fa-network-wired',
                  'Software': 'fa-laptop-code',
                  'Other': 'fa-question-circle'
                };
                const icon = iconMap[data.value] || 'fa-microchip';
                return (
                  <div className="tw-flex tw-items-center tw-gap-1">
                    <i className={`fa-light ${icon} tw-text-blue-500`}></i>
                    <span className="tw-text-sm">{data.value}</span>
                  </div>
                );
              }}
            />

            {/* V2: Template Name Column */}
            <Column
              dataField="templateName"
              caption="Template"
              width="150"
              allowSorting={true}
              cellRender={(data) => {
                if (!data.value) return <span className="tw-text-gray-400">-</span>;
                return (
                  <div className="tw-flex tw-items-center tw-gap-1">
                    <i className="fa-light fa-file-lines tw-text-orange-500"></i>
                    <span className="tw-text-sm tw-truncate" title={data.value}>{data.value}</span>
                  </div>
                );
              }}
            />

            {/* V2: Auto-Close Indicator */}
            <Column
              dataField="canAutoClose"
              caption="Auto-Close"
              width="100"
              allowSorting={true}
              cellRender={(data) => (
                <div className="tw-flex tw-justify-center">
                  {data.value ? (
                    <span className="tw-inline-flex tw-items-center tw-bg-green-100 tw-text-green-700 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs">
                      <i className="fa-light fa-robot tw-mr-1"></i>
                      Yes
                    </span>
                  ) : (
                    <span className="tw-text-gray-400 tw-text-xs">Manual</span>
                  )}
                </div>
              )}
            />

            <Column
              dataField="vehicleHyoungNo"
              caption="Vehicle"
              width="150"
              allowSorting={true}
              visible={true}
              cellRender={(data) => (
                <div className="tw-flex tw-items-center">
                  {data.data.vehicleHyoungNo || data.data.vehicleNumber ? (
                    <span className="tw-font-medium tw-text-gray-700">
                      {data.data.vehicleHyoungNo || data.data.vehicleNumber}
                    </span>
                  ) : (
                    <span className="tw-text-gray-400 tw-text-sm">N/A</span>
                  )}
                </div>
              )}
            />

            <Column
              dataField="assignToUserName"
              caption="Assigned To"
              width="150"
              allowSorting={true}
              visible={true}
              cellRender={(data) => (
                <div className="tw-flex tw-items-center">
                  {data.value ? (
                    <div className="tw-flex tw-items-center tw-bg-blue-50 tw-px-2 tw-py-1 tw-rounded tw-border tw-border-blue-200">
                      <i className="fa-light fa-user tw-mr-1 tw-text-blue-600"></i>
                      <span className="tw-font-medium tw-text-blue-700 tw-text-sm">
                        {data.value}
                      </span>
                    </div>
                  ) : (
                    <div className="tw-flex tw-items-center tw-bg-gray-100 tw-px-2 tw-py-1 tw-rounded tw-border tw-border-gray-200">
                      <i className="fa-light fa-user-slash tw-mr-1 tw-text-gray-400"></i>
                      <span className="tw-text-gray-500 tw-italic tw-text-sm">Unassigned</span>
                    </div>
                  )}
                </div>
              )}
            />

            <Column
              dataField="relatedIssue"
              caption="Related Issue"
              width="130"
              allowSorting={true}
              cellRender={(data) => (
                <div>
                  {data.value ? (
                    <Button
                      text={`#${data.value}`}
                      type="normal"
                      stylingMode="text"
                      icon="fa-light fa-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        // First navigate to list page with highlight state
                        navigate('/issue-tracker', {
                          state: { highlightIssueId: data.value },
                          replace: true
                        });
                        // Then navigate to details after a brief delay to show the highlight
                        setTimeout(() => {
                          navigate(`/issue-tracker/details/${data.value}`);
                        }, 1000);
                      }}
                      className="tw-text-blue-600 tw-font-mono tw-text-sm"
                      hint={`Go to related issue #${data.value}`}
                    />
                  ) : (
                    <span className="tw-text-gray-400 tw-text-sm">-</span>
                  )}
                </div>
              )}
            />

            <Column
              dataField="openDate"
              caption="Created"
              dataType="datetime"
              width="160"
              cellRender={formatDate}
              allowSorting={true}
            />

            <Column
              caption="Actions"
              width="120"
              allowSorting={false}
              allowFiltering={false}
              cellRender={renderActionsCell}
            />

            <Summary>
              <TotalItem
                column="id"
                summaryType="count"
                displayFormat="Total: {0} issues"
              />
            </Summary>

            <Grouping autoExpandAll={false} />
          </DataGrid>
        </div>
      ) : (
        // Card View
        <div className="issue-list-view">
          {issues.length > 0 ? (
            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 xl:tw-grid-cols-3 tw-gap-6">
              {issues.map(issue => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onView={(issue) => navigate(`/issue-tracker/details/${issue.id}`)}
                  onEdit={(issue) => navigate(`/issue-tracker/details/${issue.id}`)}
                  className="tw-h-full"
                />
              ))}
            </div>
          ) : (
            <div className="tw-text-center tw-py-12">
              <i className="fa-light fa-inbox tw-text-6xl tw-text-gray-300 tw-mb-4"></i>
              <h3 className="tw-text-xl tw-font-semibold tw-text-gray-600 tw-mb-2">
                No Issues Found
              </h3>
              <p className="tw-text-gray-500 tw-mb-6">
                {Object.keys(filters).length > 0
                  ? 'Try adjusting your filters or create a new issue.'
                  : 'Get started by creating your first issue.'
                }
              </p>
              <div className="tw-flex tw-justify-center tw-gap-3">
                <Button
                  text="Create New Issue"
                  type="default"
                  stylingMode="contained"
                  icon="fa-light fa-plus"
                  onClick={() => navigate('/issue-tracker/new')}
                  className="tw-bg-blue-600 tw-text-white"
                />
                {Object.keys(filters).length > 0 && (
                  <Button
                    text="Clear Filters"
                    type="normal"
                    stylingMode="outlined"
                    icon="fa-light fa-times"
                    onClick={handleClearFilters}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters Popup */}
      <Popup
        visible={showFilters}
        onHiding={() => setShowFilters(false)}
        title="Filter Issues"
        showCloseButton={true}
        width="800"
        height="auto"
      >
        <IssueFilters
          categories={categories}
          priorities={priorities}
          statuses={statuses}
          currentFilters={filters}
          onApplyFilters={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </Popup>

      {/* Bulk Actions Popup */}
      <Popup
        visible={showBulkActions}
        onHiding={() => setShowBulkActions(false)}
        title={`Bulk Actions (${selectedIssuesCount} issues selected)`}
        showCloseButton={true}
        width="500"
        height="auto"
      >
        <div className="tw-p-4">
          <div className="tw-mb-4">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Select Action:
            </label>
            <SelectBox
              items={[
                { id: 'assign', name: 'Assign Issues' },
                { id: 'status', name: 'Update Status' }
              ]}
              displayExpr="name"
              valueExpr="id"
              value={bulkAction}
              onValueChanged={(e) => setBulkAction(e.value)}
              placeholder="Choose an action..."
            />
          </div>

          {bulkAction === 'assign' && (
            <div className="tw-mb-4">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Assign To:
              </label>
              <SelectBox
                items={['John Doe', 'Jane Smith', 'Mike Johnson']} // TODO: Load from users API
                value={bulkAssignTo}
                onValueChanged={(e) => setBulkAssignTo(e.value)}
                placeholder="Select user to assign..."
              />
            </div>
          )}

          {bulkAction === 'status' && (
            <div className="tw-mb-4">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                New Status:
              </label>
              <SelectBox
                dataSource={statuses}
                displayExpr="name"
                valueExpr="name"
                value={bulkStatus}
                onValueChanged={(e) => setBulkStatus(e.value)}
                placeholder="Select new status..."
              />
            </div>
          )}

          <div className="tw-flex tw-justify-end tw-gap-3 tw-pt-4 tw-border-t tw-border-gray-200">
            <Button
              text="Cancel"
              type="normal"
              stylingMode="outlined"
              onClick={() => setShowBulkActions(false)}
            />
            <Button
              text="Apply Action"
              type="default"
              stylingMode="contained"
              disabled={!bulkAction || (bulkAction === 'assign' && !bulkAssignTo) || (bulkAction === 'status' && !bulkStatus)}
              onClick={handleBulkAction}
              className="tw-bg-blue-600 tw-text-white"
            />
          </div>
        </div>
      </Popup>

      {/* Loading Overlay */}
      <LoadPanel visible={loading.issues} message="Loading issues..." />
    </div>
  );
};

export default IssueTrackerListPage;
