/**
 * File: IssueTicketsPage.js
 * Purpose: Issue ticket list page with filtering, export, and row-level actions
 * Dependencies: React, react-router-dom, DevExtreme DataGrid, issueTrackerService
 * Last Modified: 2026-02-03
 *
 * Key Functions/Components:
 * - IssueTicketsPage: Displays issue tickets and navigates to detail/edit screens
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
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import { Workbook } from 'exceljs';
import { exportDataGrid } from 'devextreme/excel_exporter';
import saveAs from 'file-saver';
import issueTrackerService from '../../../services/issueTrackerService';

const IssueTicketsPage = () => {
  const navigate = useNavigate();
  const dataGridRef = useRef(null);

  // State management
  const [issues, setIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

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

      setIssues(issuesData || []);
      setCategories(categoriesData || []);
      setPriorities(prioritiesData || []);
      setStatuses(statusesData || []);
      setTotalCount(issuesData?.length || 0);

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
  }, []);

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
    </div>
  );
};

export default IssueTicketsPage;
