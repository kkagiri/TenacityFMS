import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import DataGrid, {
  Column,
  Paging,
  FilterRow,
  HeaderFilter,
  Scrolling,
  Selection,
  Toolbar,
  Item as ToolbarItem,
  Export,
  SearchPanel,
  ColumnChooser
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { SelectBox } from 'devextreme-react/select-box';
import { DateRangeBox } from 'devextreme-react/date-range-box';
import LoadIndicator from 'devextreme-react/load-indicator';
import { useStockManagement } from '../../../hooks/useStockManagement';
import notify from 'devextreme/ui/notify';

const AdjustmentTypes = [
  { id: 0, name: 'Increase', icon: 'fa-light fa-arrow-up', color: '#28a745' },
  { id: 1, name: 'Decrease', icon: 'fa-light fa-arrow-down', color: '#dc3545' },
  { id: 2, name: 'Correction', icon: 'fa-light fa-pen-to-square', color: '#ffc107' }
];

//Cursor - Stock Adjustment List Component
const StockAdjustmentList = ({ selectedSite, onEdit, onDelete, refreshTrigger }) => {
  const { fetchStockAdjustments, isLoading } = useStockManagement();
  const sites = useSelector((state) => state.site.sites);
  const tanks = useSelector((state) => state.tank.tanks);

  const [adjustments, setAdjustments] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [filters, setFilters] = useState({
    siteId: selectedSite || '',
    dateRange: [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()], // Last 30 days
    tankId: ''
  });

  // Filter tanks based on selected site
  const filteredTanks = useMemo(() => {
    if (!filters.siteId || filters.siteId === 'all') return tanks;
    return tanks.filter(tank => tank.siteId === filters.siteId);
  }, [tanks, filters.siteId]);

  //Cursor - Removed mock data - will fetch from API

  // Fetch adjustments data
  const fetchData = useCallback(async () => {
    try {
      //Cursor - Fetch actual data from API
      const filterParams = {
        siteId: filters.siteId && filters.siteId !== 'all' ? filters.siteId : null,
        startDate: filters.dateRange[0]?.toISOString().split('T')[0],
        endDate: filters.dateRange[1]?.toISOString().split('T')[0],
        tankId: filters.tankId || null
      };

      const result = await fetchStockAdjustments(filterParams);
      if (result.success) {
        setAdjustments(result.data || []);
      } else {
        setAdjustments([]);
        notify(result.message || 'Failed to fetch adjustments', 'error', 3000);
      }
    } catch (error) {
      console.error('Error fetching adjustments:', error);
      setAdjustments([]);
      notify('Error fetching stock adjustments', 'error', 3000);
    }
  }, [filters, fetchStockAdjustments]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  useEffect(() => {
    setFilters(prev => ({ ...prev, siteId: selectedSite || '' }));
  }, [selectedSite]);

  // Handle filter changes
  const handleSiteFilterChange = useCallback((e) => {
    setFilters(prev => ({ ...prev, siteId: e.value, tankId: '' }));
  }, []);

  const handleTankFilterChange = useCallback((e) => {
    setFilters(prev => ({ ...prev, tankId: e.value }));
  }, []);

  const handleDateRangeChange = useCallback((e) => {
    if (e.value && e.value.length === 2) {
      setFilters(prev => ({ ...prev, dateRange: e.value }));
    }
  }, []);

  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Column cell render functions
  const renderAdjustmentType = useCallback((cellData) => {
    const adjustment = AdjustmentTypes[cellData.value] || AdjustmentTypes[2];
    return (
      <div className="tw-flex tw-items-center">
        <i className={`${adjustment.icon} tw-mr-2`} style={{ color: adjustment.color }}></i>
        <span style={{ color: adjustment.color }}>{adjustment.name}</span>
      </div>
    );
  }, []);

  const renderVolumeChange = useCallback((cellData) => {
    const value = cellData.value || 0;
    const isPositive = value >= 0;
    return (
      <span className={isPositive ? 'tw-text-green-600 tw-font-medium' : 'tw-text-red-600 tw-font-medium'}>
        {isPositive ? '+' : ''}{value.toFixed(2)} L
      </span>
    );
  }, []);

  const renderTank = useCallback((cellData) => {
    const tank = tanks.find(t => t.id === cellData.value);
    return tank ? tank.name : `Tank ${cellData.value}`;
  }, [tanks]);

  const renderSite = useCallback((cellData) => {
    const site = sites.find(s => s.id === cellData.value);
    return site ? site.name : `Site ${cellData.value}`;
  }, [sites]);

  const renderDate = useCallback((cellData) => {
    return new Date(cellData.value).toLocaleDateString('en-GB');
  }, []);

  const renderActions = useCallback((cellData) => {
    return (
      <div className="tw-flex tw-space-x-2">
        <Button
          icon="fa-light fa-eye"
          hint="View Details"
          onClick={() => onEdit && onEdit(cellData.data)}
          stylingMode="text"
          width={30}
          height={30}
        />
        <Button
          icon="fa-light fa-pen"
          hint="Edit"
          onClick={() => onEdit && onEdit(cellData.data)}
          stylingMode="text"
          width={30}
          height={30}
        />
        <Button
          icon="fa-light fa-trash"
          hint="Delete"
          onClick={() => onDelete && onDelete(cellData.data)}
          stylingMode="text"
          width={30}
          height={30}
          className="tw-text-red-600"
        />
      </div>
    );
  }, [onEdit, onDelete]);

  const onSelectionChanged = useCallback((e) => {
    setSelectedRows(e.selectedRowKeys);
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedRows.length === 0) {
      notify('Please select adjustments to delete', 'warning', 3000);
      return;
    }
    notify(`Delete ${selectedRows.length} selected adjustments`, 'info', 3000);
  }, [selectedRows]);

  if (isLoading) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-h-64">
        <LoadIndicator width={'24px'} height={'24px'} visible={true} />
      </div>
    );
  }

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
        <div className="tw-flex tw-items-center">
          <i className="fa-light fa-list tw-text-blue-600 tw-text-xl tw-mr-3"></i>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">Stock Adjustments</h3>
          <span className="tw-ml-3 tw-bg-blue-100 tw-text-blue-800 tw-px-2 tw-py-1 tw-rounded-full tw-text-sm">
            {adjustments.length} records
          </span>
        </div>
        <Button
          icon="fa-light fa-rotate"
          text="Refresh"
          onClick={handleRefresh}
          stylingMode="outlined"
        />
      </div>

      {/* Filters */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4 tw-mb-6 tw-p-4 tw-bg-gray-50 tw-rounded-lg">
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Site</label>
          <SelectBox
            dataSource={[{ id: 'all', name: 'All Sites' }, ...sites]}
            valueExpr="id"
            displayExpr="name"
            value={filters.siteId}
            onValueChanged={handleSiteFilterChange}
            placeholder="Select Site"
          />
        </div>
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Tank</label>
          <SelectBox
            dataSource={[{ id: '', name: 'All Tanks' }, ...filteredTanks]}
            valueExpr="id"
            displayExpr="name"
            value={filters.tankId}
            onValueChanged={handleTankFilterChange}
            placeholder="Select Tank"
            disabled={!filters.siteId || filters.siteId === 'all'}
          />
        </div>
        <div className="md:tw-col-span-2">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Date Range</label>
          <DateRangeBox
            startDate={filters.dateRange[0]}
            endDate={filters.dateRange[1]}
            onValueChanged={handleDateRangeChange}
            max={new Date()}
          />
        </div>
      </div>

      <DataGrid
        dataSource={adjustments}
        keyExpr="id"
        showBorders={true}
        showRowLines={true}
        showColumnLines={true}
        rowAlternationEnabled={true}
        columnAutoWidth={true}
        onSelectionChanged={onSelectionChanged}
        hoverStateEnabled={true}
      >
        <Selection mode="multiple" />
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <SearchPanel visible={true} width={240} placeholder="Search adjustments..." />
        <ColumnChooser enabled={true} />
        <Scrolling mode="virtual" />
        <Paging defaultPageSize={50} />
        <Export enabled={true} fileName="stock-adjustments" />

        <Toolbar>
          <ToolbarItem location="before">
            <Button
              icon="fa-light fa-trash"
              text="Delete Selected"
              onClick={handleBulkDelete}
              disabled={selectedRows.length === 0}
              stylingMode="outlined"
            />
          </ToolbarItem>
          <ToolbarItem location="after" name="exportButton" />
          <ToolbarItem location="after" name="columnChooserButton" />
          <ToolbarItem location="after" name="searchPanel" />
        </Toolbar>

        <Column dataField="adjustmentDate" caption="Date" dataType="date" cellRender={renderDate} width={100} />
        <Column dataField="siteId" caption="Site" cellRender={renderSite} width={120} />
        <Column dataField="tankId" caption="Tank" cellRender={renderTank} width={120} />
        <Column dataField="adjustmentType" caption="Type" cellRender={renderAdjustmentType} width={120} />
        <Column dataField="currentVolume" caption="Previous Vol. (L)" dataType="number" format="0.00" width={120} />
        <Column dataField="newVolume" caption="New Vol. (L)" dataType="number" format="0.00" width={120} />
        <Column dataField="volumeChange" caption="Change (L)" cellRender={renderVolumeChange} width={120} />
        <Column dataField="reason" caption="Reason" width={150} />
        <Column dataField="notes" caption="Notes" width={200} />
        <Column dataField="createdBy" caption="Created By" width={120} />
        <Column
          caption="Actions"
          cellRender={renderActions}
          width={120}
          allowSorting={false}
          allowFiltering={false}
        />
      </DataGrid>
    </div>
  );
};

export default StockAdjustmentList;
