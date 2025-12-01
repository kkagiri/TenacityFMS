import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, {
  Column,
  Paging,
  Pager,
  FilterRow,
  SearchPanel,
  Sorting,
  HeaderFilter
} from 'devextreme-react/data-grid';
import SelectBox from 'devextreme-react/select-box';
import DateBox from 'devextreme-react/date-box';
import Button from 'devextreme-react/button';
import {
  fetchFuelAudits,
  selectAudits,
  selectAuditsPagination,
  selectLoading
} from '../../../../redux/slices/fuelAuditSlice';

/**
 * AuditList Component
 * Displays list of fuel audits with filtering and pagination
 */
const AuditList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const audits = useSelector(selectAudits);
  const pagination = useSelector(selectAuditsPagination);
  const loading = useSelector(selectLoading);

  const [localFilters, setLocalFilters] = useState({
    status: 'all',
    fromDate: null,
    toDate: null
  });

  // Status options
  const statusOptions = [
    { value: 'all', text: 'All Statuses' },
    { value: 'Draft', text: 'Draft' },
    { value: 'Calculated', text: 'Calculated' },
    { value: 'Finalized', text: 'Finalized' },
    { value: 'Cancelled', text: 'Cancelled' }
  ];

  // Load audits on mount and filter change
  useEffect(() => {
    const params = {
      pageSize: 20,
      status: localFilters.status !== 'all' ? localFilters.status : undefined,
      fromDate: localFilters.fromDate?.toISOString(),
      toDate: localFilters.toDate?.toISOString()
    };
    dispatch(fetchFuelAudits(params));
  }, [dispatch, localFilters]);

  const handleFilterChange = useCallback((field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleRowClick = useCallback((e) => {
    navigate(`/tankstock/fuel-audit/detail/${e.data.id}`);
  }, [navigate]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchFuelAudits({ pageSize: 20 }));
  }, [dispatch]);

  // Custom cell renders
  const renderStatus = useCallback((cellData) => {
    const status = cellData.value;
    const statusConfig = {
      Draft: { className: 'draft', icon: 'fa-file-pen' },
      Calculated: { className: 'calculated', icon: 'fa-calculator' },
      Finalized: { className: 'finalized', icon: 'fa-check-circle' },
      Cancelled: { className: 'cancelled', icon: 'fa-times-circle' }
    };
    const config = statusConfig[status] || statusConfig.Draft;
    return (
      <span className={`status-badge ${config.className}`}>
        <i className={`fa-light ${config.icon}`}></i>
        {status}
      </span>
    );
  }, []);

  const renderVariance = useCallback((cellData) => {
    const value = cellData.value;
    if (value === null || value === undefined) return '-';

    const absValue = Math.abs(value);
    let className = 'low';
    if (absValue >= 5) className = 'critical';
    else if (absValue >= 3) className = 'high';
    else if (absValue >= 1) className = 'medium';

    return (
      <span className={`variance-indicator ${className}`}>
        <i className={`fa-light ${value >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
        {value.toFixed(2)}%
      </span>
    );
  }, []);

  const renderFlags = useCallback((cellData) => {
    const count = cellData.value || 0;
    if (count === 0) {
      return <span className="tw-text-green-600"><i className="fa-light fa-check"></i></span>;
    }
    return (
      <span className="tw-text-orange-600 tw-font-medium tw-flex tw-items-center tw-gap-1">
        <i className="fa-light fa-flag"></i>
        {count}
      </span>
    );
  }, []);

  const renderPeriod = useCallback((cellData) => {
    const row = cellData.data;
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-';
    return (
      <span className="tw-text-gray-600">
        {formatDate(row.auditPeriodStart)} - {formatDate(row.auditPeriodEnd)}
      </span>
    );
  }, []);

  const renderActions = useCallback((cellData) => {
    return (
      <div className="tw-flex tw-gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/tankstock/fuel-audit/detail/${cellData.data.id}`);
          }}
          className="tw-p-1 tw-text-blue-600 hover:tw-bg-blue-50 tw-rounded"
          title="View Details"
        >
          <i className="fa-light fa-eye"></i>
        </button>
      </div>
    );
  }, [navigate]);

  return (
    <div className="tw-p-6">
      <div className="audit-list-container">
        {/* Header */}
        <div className="audit-list-header">
          <h2 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-list-check tw-text-gray-400"></i>
            Fuel Audits
            {audits.length > 0 && (
              <span className="tw-text-sm tw-font-normal tw-text-gray-500">
                ({pagination.totalCount || audits.length} total)
              </span>
            )}
          </h2>
          <div className="tw-flex tw-items-center tw-gap-2">
            <Button
              icon="refresh"
              onClick={handleRefresh}
              hint="Refresh"
              stylingMode="text"
            />
            <button
              onClick={() => navigate('/tankstock/fuel-audit/create')}
              className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-flex tw-items-center tw-gap-2 hover:tw-bg-blue-700"
            >
              <i className="fa-light fa-plus"></i>
              New Audit
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="audit-list-filters">
          <div className="tw-flex tw-items-center tw-gap-2">
            <label className="tw-text-sm tw-text-gray-600">Status:</label>
            <SelectBox
              items={statusOptions}
              value={localFilters.status}
              valueExpr="value"
              displayExpr="text"
              onValueChanged={(e) => handleFilterChange('status', e.value)}
              width={150}
              stylingMode="outlined"
            />
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <label className="tw-text-sm tw-text-gray-600">From:</label>
            <DateBox
              value={localFilters.fromDate}
              onValueChanged={(e) => handleFilterChange('fromDate', e.value)}
              type="date"
              width={150}
              stylingMode="outlined"
              showClearButton
            />
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <label className="tw-text-sm tw-text-gray-600">To:</label>
            <DateBox
              value={localFilters.toDate}
              onValueChanged={(e) => handleFilterChange('toDate', e.value)}
              type="date"
              width={150}
              stylingMode="outlined"
              showClearButton
            />
          </div>
          <Button
            text="Clear Filters"
            onClick={() => setLocalFilters({ status: 'all', fromDate: null, toDate: null })}
            stylingMode="text"
          />
        </div>

        {/* Data Grid */}
        <DataGrid
          dataSource={audits}
          showBorders={false}
          showRowLines={true}
          showColumnLines={false}
          rowAlternationEnabled={false}
          hoverStateEnabled={true}
          onRowClick={handleRowClick}
          className="tw-cursor-pointer"
          noDataText={loading.audits ? "Loading..." : "No audits found"}
        >
          <SearchPanel visible={true} width={240} placeholder="Search audits..." />
          <FilterRow visible={false} />
          <HeaderFilter visible={true} />
          <Sorting mode="multiple" />
          <Paging defaultPageSize={20} />
          <Pager
            showPageSizeSelector={true}
            allowedPageSizes={[10, 20, 50]}
            showInfo={true}
          />

          <Column
            dataField="auditNumber"
            caption="Audit #"
            width={150}
            cellRender={(cellData) => (
              <span className="tw-font-medium tw-text-blue-600">{cellData.value}</span>
            )}
          />
          <Column
            dataField="siteName"
            caption="Site"
            width={150}
          />
          <Column
            caption="Period"
            width={180}
            cellRender={renderPeriod}
            allowSorting={false}
          />
          <Column
            dataField="status"
            caption="Status"
            width={130}
            cellRender={renderStatus}
          />
          <Column
            dataField="variancePercentage"
            caption="Variance"
            width={120}
            cellRender={renderVariance}
            alignment="center"
          />
          <Column
            dataField="unresolvedFlags"
            caption="Flags"
            width={80}
            cellRender={renderFlags}
            alignment="center"
          />
          <Column
            dataField="createdAt"
            caption="Created"
            width={120}
            dataType="date"
            format="MMM dd, yyyy"
          />
          <Column
            dataField="finalizedAt"
            caption="Finalized"
            width={120}
            dataType="date"
            format="MMM dd, yyyy"
          />
          <Column
            caption=""
            width={60}
            cellRender={renderActions}
            allowSorting={false}
            allowFiltering={false}
          />
        </DataGrid>
      </div>
    </div>
  );
};

export default AuditList;
