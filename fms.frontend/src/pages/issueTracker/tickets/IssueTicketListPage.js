/**
 * File: IssueTicketListPage.js
 * Purpose: Issue ticket list page with filtering, export, and row-level actions
 * Dependencies: React, react-router-dom, DevExtreme DataGrid, issueTrackerService
 * Last Modified: 2026-02-12
 *
 * Key Functions/Components:
 * - IssueTicketListPage: Displays issue tickets and navigates to detail/edit screens
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DataGrid, {
  Column,
  Paging,
  Pager,
  FilterRow,
  HeaderFilter,
  SearchPanel,
  Toolbar,
  Item as ToolbarItem,
  Export,
  Selection,
  LoadPanel,
  Lookup,
  Sorting
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import { TextArea } from 'devextreme-react/text-area';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import { Workbook } from 'exceljs';
import { exportDataGrid } from 'devextreme/excel_exporter';
import saveAs from 'file-saver';
import issueTrackerService from '../../../services/issueTrackerService';
import { usePermissions } from '../../../hooks/usePermissions';

const IssueTicketListPage = () => {
  const navigate = useNavigate();
  const dataGridRef = useRef(null);
  const { hasRole, hasPermission } = usePermissions();
  const canDeleteIssue = hasRole('Admin') || hasPermission('_Delete_Issues');

  // State management
  const [issues, setIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [closeMonitorPopupVisible, setCloseMonitorPopupVisible] = useState(false);
  const [closeMonitorNotes, setCloseMonitorNotes] = useState('');
  const [closingInProgress, setClosingInProgress] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const humanizeElapsedMinutes = useCallback((minutesValue) => {
    const minutes = Number(minutesValue);
    if (!Number.isFinite(minutes) || minutes < 0) {
      return `${minutesValue} min ago`;
    }

    if (minutes < 60) {
      const roundedMinutes = Math.floor(minutes);
      return `${roundedMinutes} min ago`;
    }

    const hours = minutes / 60;
    if (hours < 24) {
      const roundedHours = Math.floor(hours);
      return `${roundedHours} ${roundedHours === 1 ? 'hr' : 'hrs'} ago`;
    }

    const days = hours / 24;
    if (days < 30) {
      const roundedDays = Math.floor(days);
      return `${roundedDays} ${roundedDays === 1 ? 'day' : 'days'} ago`;
    }

    const months = days / 30;
    if (months < 12) {
      const roundedMonths = Math.floor(months);
      return `${roundedMonths} ${roundedMonths === 1 ? 'month' : 'months'} ago`;
    }

    const years = months / 12;
    const roundedYears = Math.floor(years);
    return `${roundedYears} ${roundedYears === 1 ? 'year' : 'years'} ago`;
  }, []);

  const parseLastSeenDetails = useCallback((description) => {
    if (!description || typeof description !== 'string') {
      return {
        lastSeenAtUtc: null,
        lastSeenMinutesAgo: null,
        lastSeenDisplay: ''
      };
    }

    const match = description.match(
      /Last seen:\s*([0-9]{4}-[0-9]{2}-[0-9]{2}\s+[0-9]{2}:[0-9]{2}:[0-9]{2})\s*UTC(?:\s*\(([\d.]+)\s*(?:min|mins|minute|minutes)\s+ago\))?/i
    );

    if (!match) {
      return {
        lastSeenAtUtc: null,
        lastSeenMinutesAgo: null,
        lastSeenDisplay: ''
      };
    }

    const utcText = match[1];
    const parsedUtcDate = new Date(`${utcText.replace(' ', 'T')}Z`);
    const isValidDate = !Number.isNaN(parsedUtcDate.getTime());

    let lastSeenMinutesAgo = null;
    if (match[2] !== undefined && match[2] !== null) {
      const parsedMinutes = Number(match[2]);
      if (Number.isFinite(parsedMinutes)) {
        lastSeenMinutesAgo = parsedMinutes;
      }
    }

    if (lastSeenMinutesAgo === null && isValidDate) {
      lastSeenMinutesAgo = Math.max(
        0,
        Math.floor((Date.now() - parsedUtcDate.getTime()) / (1000 * 60))
      );
    }

    return {
      lastSeenAtUtc: isValidDate ? parsedUtcDate : null,
      lastSeenMinutesAgo,
      lastSeenDisplay: lastSeenMinutesAgo !== null ? humanizeElapsedMinutes(lastSeenMinutesAgo) : ''
    };
  }, [humanizeElapsedMinutes]);

  const normalizeIssueRow = useCallback((issue) => {
    const assignedToName =
      issue.assignedToName ||
      issue.assignToUserName ||
      issue.assignTo ||
      '';

    const vehicleName =
      issue.vehicleName ||
      issue.vehicleHyoungNo ||
      issue.vehicleNumber ||
      issue.vehicleNo ||
      '';

    const rawDescription = issue.problemDescription || '';
    const lastSeenDetails = parseLastSeenDetails(rawDescription);
    const problemDescription = rawDescription.replace(
      /(\d+(?:\.\d+)?)\s*(?:min|mins|minute|minutes)\s+ago/gi,
      (match, minuteValue) => humanizeElapsedMinutes(minuteValue)
    );

    return {
      ...issue,
      assignedToName,
      vehicleName,
      problemDescription,
      lastSeenAtUtc: lastSeenDetails.lastSeenAtUtc,
      lastSeenMinutesAgo: lastSeenDetails.lastSeenMinutesAgo,
      lastSeenDisplay: lastSeenDetails.lastSeenDisplay
    };
  }, [humanizeElapsedMinutes, parseLastSeenDetails]);

  const formatDateTime = (cellData) => {
    if (!cellData.value) return '';
    const date = new Date(cellData.value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Load data on component mount
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);

      // Load all data in parallel
      const [issuesData, categoriesData, prioritiesData, statusesData] = await Promise.all([
        issueTrackerService.getIssues(),
        issueTrackerService.getIssueCategories(),
        issueTrackerService.getIssuePriorities(),
        issueTrackerService.getIssueStatuses()
      ]);

      const normalizedIssues = (issuesData || []).map(normalizeIssueRow);

      setIssues(normalizedIssues);
      setCategories(categoriesData || []);
      setPriorities(prioritiesData || []);
      setStatuses(statusesData || []);
      setTotalCount(normalizedIssues.length || 0);

    } catch (error) {
      console.error('Error loading initial data:', error);
      notify({
        message: 'Failed to load issue data. Please try again.',
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
  }, [normalizeIssueRow]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleRefresh = useCallback(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleRowClick = (e) => {
    const issueId = e.data.id;
    navigate(`/issue-tracker/details/${issueId}`);
  };

  const handleCreateNew = () => {
    navigate('/issue-tracker/create');
  };

  // ===== Close & Monitor =====
  const getSelectedIssues = useCallback(() => {
    if (!dataGridRef.current?.instance) return [];
    return dataGridRef.current.instance.getSelectedRowsData();
  }, []);

  const handleOpenCloseMonitor = useCallback(() => {
    const selected = getSelectedIssues();
    if (selected.length === 0) {
      notify({
        message: 'Please select at least one issue to close.',
        type: 'warning',
        displayTime: 3000,
        position: { my: 'top center', at: 'top center', of: window, offset: '0 20' }
      });
      return;
    }
    setCloseMonitorNotes('');
    setCloseMonitorPopupVisible(true);
  }, [getSelectedIssues]);

  const handleConfirmCloseMonitor = useCallback(async () => {
    const selected = getSelectedIssues();
    if (selected.length === 0) return;

    setClosingInProgress(true);
    let successCount = 0;
    let failCount = 0;

    const monitorNote = (closeMonitorNotes || '').trim();
    const notes = monitorNote
      ? `[Close & Monitor] ${monitorNote}. Vehicle will continue to be monitored for fuel activity.`
      : '[Close & Monitor] Issue closed. Vehicle will continue to be monitored — if fuel activity occurs while GPS is offline, a new issue will be created.';

    for (const issue of selected) {
      try {
        await issueTrackerService.closeIssue(issue.id, notes);
        successCount++;
      } catch (err) {
        failCount++;
        console.error(`Failed to close issue ${issue.id}:`, err);
      }
    }

    setClosingInProgress(false);
    setCloseMonitorPopupVisible(false);

    if (successCount > 0) {
      notify({
        message: `${successCount} issue(s) closed & set for monitoring.${failCount > 0 ? ` ${failCount} failed.` : ''}`,
        type: failCount > 0 ? 'warning' : 'success',
        displayTime: 4000,
        position: { my: 'top center', at: 'top center', of: window, offset: '0 20' }
      });
      loadInitialData();
    }
  }, [getSelectedIssues, closeMonitorNotes, loadInitialData]);

  // ===== Delete Handlers =====
  const handleDeleteSingleIssue = useCallback(async (issueId) => {
    if (!canDeleteIssue || !issueId) return;
    if (!window.confirm(`Delete issue #${issueId}? This action cannot be undone.`)) return;

    try {
      setIsDeleting(true);
      await issueTrackerService.deleteIssue(issueId);
      loadInitialData();
    } catch (err) {
      console.error('Delete issue failed:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [canDeleteIssue, loadInitialData]);

  const handleBulkDelete = useCallback(async () => {
    if (!canDeleteIssue) return;
    const selected = getSelectedIssues();
    if (selected.length === 0) {
      notify({
        message: 'Please select at least one issue to delete.',
        type: 'warning',
        displayTime: 3000,
        position: { my: 'top center', at: 'top center', of: window, offset: '0 20' }
      });
      return;
    }

    if (!window.confirm(`Delete ${selected.length} selected issue(s)? This action cannot be undone.`)) return;

    try {
      setIsDeleting(true);
      const issueIds = selected.map((i) => i.id);
      await issueTrackerService.bulkDeleteIssues(issueIds);
      loadInitialData();
    } catch (err) {
      console.error('Bulk delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [canDeleteIssue, getSelectedIssues, loadInitialData]);

  const handleExport = useCallback((e) => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Issues');

    exportDataGrid({
      component: dataGridRef.current.instance,
      worksheet: worksheet,
      autoFilterEnabled: true
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'IssueTracker.xlsx');
      });
    });
    e.cancel = true;
  }, []);

  // Custom cell renderers
  const renderPriorityCell = (cellData) => {
    const priority = cellData.value;
    let colorClass = '';
    let icon = '';

    switch (priority) {
      case 'Critical':
        colorClass = 'tw-text-red-600 tw-font-semibold';
        icon = 'fa-light fa-exclamation-triangle';
        break;
      case 'High':
        colorClass = 'tw-text-orange-600 tw-font-semibold';
        icon = 'fa-light fa-arrow-up';
        break;
      case 'Medium':
        colorClass = 'tw-text-yellow-600 tw-font-medium';
        icon = 'fa-light fa-minus';
        break;
      case 'Low':
        colorClass = 'tw-text-green-600';
        icon = 'fa-light fa-arrow-down';
        break;
      default:
        colorClass = 'tw-text-gray-600';
        icon = 'fa-light fa-question';
    }

    return (
      <div className={`tw-flex tw-items-center ${colorClass}`}>
        <i className={`${icon} tw-mr-2`}></i>
        {priority || 'Not Set'}
      </div>
    );
  };

  const renderStatusCell = (cellData) => {
    const status = cellData.value;
    let colorClass = '';
    let bgClass = '';

    switch (status) {
      case 'Open':
        colorClass = 'tw-text-blue-700';
        bgClass = 'tw-bg-blue-100';
        break;
      case 'In Progress':
        colorClass = 'tw-text-yellow-700';
        bgClass = 'tw-bg-yellow-100';
        break;
      case 'Resolved':
        colorClass = 'tw-text-green-700';
        bgClass = 'tw-bg-green-100';
        break;
      case 'Closed':
        colorClass = 'tw-text-gray-700';
        bgClass = 'tw-bg-gray-100';
        break;
      default:
        colorClass = 'tw-text-gray-600';
        bgClass = 'tw-bg-gray-50';
    }

    return (
      <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${colorClass} ${bgClass}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  const renderActionsCell = (cellData) => (
    <div className="tw-flex tw-gap-1">
      <Button
        icon="fa-light fa-eye"
        hint="View Details"
        stylingMode="text"
        onClick={(e) => {
          e.event.stopPropagation();
          navigate(`/issue-tracker/details/${cellData.data.id}`);
        }}
      />
      <Button
        icon="fa-light fa-edit"
        hint="Edit Issue"
        stylingMode="text"
        onClick={(e) => {
          e.event.stopPropagation();
          navigate(`/issue-tracker/details/${cellData.data.id}`);
        }}
      />
      {canDeleteIssue && (
        <Button
          icon="fa-light fa-trash"
          hint="Delete Issue"
          stylingMode="text"
          type="danger"
          disabled={isDeleting}
          onClick={(e) => {
            e.event.stopPropagation();
            handleDeleteSingleIssue(cellData.data.id);
          }}
        />
      )}
    </div>
  );

  const formatDate = (cellData) => {
    if (!cellData.value) return '';
    const date = new Date(cellData.value);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-py-12">
        <LoadIndicator visible={true} />
        <span className="tw-ml-3 tw-text-gray-600">Loading issue tickets...</span>
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
              <i className="fa-light fa-ticket tw-mr-2 tw-text-orange-500"></i>
              Issue Tickets
            </h2>
            <p className="tw-text-gray-600">
              {totalCount} total issues found. Click on any issue to view details.
            </p>
          </div>

          <div className="tw-flex tw-gap-3">
            <Button
              text="Refresh"
              type="normal"
              stylingMode="outlined"
              icon="fa-light fa-sync"
              onClick={handleRefresh}
            />
            <Button
              text="Create New Issue"
              type="default"
              stylingMode="contained"
              icon="fa-light fa-plus"
              onClick={handleCreateNew}
              className="tw-bg-orange-600 tw-text-white"
            />
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow">
        <DataGrid
          ref={dataGridRef}
          dataSource={issues}
          keyExpr="id"
          showBorders={true}
          showRowLines={true}
          showColumnLines={true}
          allowColumnReordering={true}
          allowColumnResizing={true}
          columnAutoWidth={true}
          onRowClick={handleRowClick}
          onExporting={handleExport}
          height={600}
        >
          <LoadPanel enabled={loading} />

          <Paging enabled={true} defaultPageSize={20} />
          <Pager
            showPageSizeSelector={true}
            allowedPageSizes={[10, 20, 50, 100]}
            showInfo={true}
          />

          <FilterRow visible={true} />
          <HeaderFilter visible={true} />
          <SearchPanel visible={true} placeholder="Search issues..." />
          <Sorting mode="multiple" />
          <Selection mode="multiple" />

          <Export enabled={true} allowExportSelectedData={true} />

          <Toolbar>
            <ToolbarItem name="exportButton" />
            <ToolbarItem name="columnChooserButton" />
            <ToolbarItem location="before">
              <Button
                text="Close & Monitor"
                icon="fa-light fa-eye"
                type="normal"
                stylingMode="outlined"
                onClick={handleOpenCloseMonitor}
                hint="Close selected issues and continue monitoring vehicles for fuel activity"
              />
            </ToolbarItem>
            {canDeleteIssue && (
              <ToolbarItem location="before">
                <Button
                  text={isDeleting ? 'Deleting...' : 'Delete Selected'}
                  icon="fa-light fa-trash"
                  type="danger"
                  stylingMode="outlined"
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  hint="Delete selected issues (admin only)"
                />
              </ToolbarItem>
            )}
            <ToolbarItem
              location="after"
              widget="dxButton"
              options={{
                text: 'Refresh',
                icon: 'refresh',
                onClick: handleRefresh
              }}
            />
          </Toolbar>

          {/* Columns */}
          <Column
            dataField="id"
            caption="ID"
            width={80}
            defaultSortOrder="desc"
            allowSorting={true}
          />

          <Column
            dataField="problemTitle"
            caption="Title"
            minWidth={200}
            allowSorting={true}
          />

          <Column
            dataField="problemDescription"
            caption="Description"
            minWidth={250}
            allowSorting={false}
          />

          <Column
            dataField="lastSeenAtUtc"
            caption="Last Seen (UTC)"
            width={180}
            dataType="datetime"
            cellRender={formatDateTime}
            allowSorting={true}
            allowFiltering={true}
          />

          <Column
            dataField="lastSeenMinutesAgo"
            caption="Offline For"
            width={140}
            dataType="number"
            allowSorting={true}
            allowFiltering={true}
            cellRender={(cellData) => (
              <span>{cellData.data.lastSeenDisplay || ''}</span>
            )}
          />

          <Column
            dataField="priorityName"
            caption="Priority"
            width={120}
            cellRender={renderPriorityCell}
            allowSorting={true}
          >
            <Lookup
              dataSource={priorities}
              valueExpr="name"
              displayExpr="name"
            />
          </Column>

          <Column
            dataField="statusName"
            caption="Status"
            width={120}
            cellRender={renderStatusCell}
            allowSorting={true}
          >
            <Lookup
              dataSource={statuses}
              valueExpr="name"
              displayExpr="name"
            />
          </Column>

          <Column
            dataField="categoryName"
            caption="Category"
            width={150}
            allowSorting={true}
          >
            <Lookup
              dataSource={categories}
              valueExpr="name"
              displayExpr="name"
            />
          </Column>

          <Column
            dataField="assignedToName"
            caption="Assigned To"
            width={150}
            allowSorting={true}
          />

          <Column
            dataField="vehicleName"
            caption="Vehicle"
            width={120}
            allowSorting={true}
          />

          <Column
            dataField="siteName"
            caption="Site"
            width={120}
            allowSorting={true}
          />

          <Column
            dataField="openDate"
            caption="Open Date"
            width={120}
            dataType="date"
            cellRender={formatDate}
            allowSorting={true}
          />

          <Column
            dataField="dueDate"
            caption="Due Date"
            width={120}
            dataType="date"
            cellRender={formatDate}
            allowSorting={true}
          />

          <Column
            caption="Actions"
            width={100}
            allowSorting={false}
            allowFiltering={false}
            cellRender={renderActionsCell}
          />
        </DataGrid>
      </div>

      {/* Close & Monitor Popup */}
      <Popup
        visible={closeMonitorPopupVisible}
        onHiding={() => setCloseMonitorPopupVisible(false)}
        title="Close & Monitor"
        showCloseButton={true}
        width={520}
        height="auto"
        maxHeight={420}
        dragEnabled={false}
      >
        <div className="tw-p-4">
          <div className="tw-flex tw-items-start tw-gap-3 tw-mb-4 tw-p-3 tw-bg-blue-50 tw-rounded-lg tw-border tw-border-blue-200">
            <i className="fa-light fa-info-circle tw-text-blue-500 tw-text-lg tw-mt-0.5"></i>
            <p className="tw-text-sm tw-text-blue-800 tw-m-0">
              Closing these issues will mark them as complete. The system will <strong>continue monitoring</strong> the
              associated vehicles. If a vehicle has fuel activity (refill or pump transaction) while its GPS
              device is offline, a new issue will automatically be created for investigation.
            </p>
          </div>

          <div className="tw-mb-4">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Closing Notes <span className="tw-text-gray-400">(optional)</span>
            </label>
            <TextArea
              value={closeMonitorNotes}
              onValueChanged={(e) => setCloseMonitorNotes(e.value)}
              placeholder="Add any notes about why these issues are being closed..."
              height={80}
              maxLength={500}
            />
          </div>

          <div className="tw-text-sm tw-text-gray-500 tw-mb-4">
            <i className="fa-light fa-ticket tw-mr-1"></i>
            {getSelectedIssues().length} issue(s) selected
          </div>

          <div className="tw-flex tw-justify-end tw-gap-3">
            <Button
              text="Cancel"
              stylingMode="outlined"
              onClick={() => setCloseMonitorPopupVisible(false)}
              disabled={closingInProgress}
            />
            <Button
              text={closingInProgress ? 'Closing...' : 'Close & Monitor'}
              type="default"
              stylingMode="contained"
              icon={closingInProgress ? '' : 'fa-light fa-check'}
              onClick={handleConfirmCloseMonitor}
              disabled={closingInProgress}
            />
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default IssueTicketListPage;
