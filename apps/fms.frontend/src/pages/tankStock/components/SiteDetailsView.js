import React, { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { DataGrid } from 'devextreme-react/data-grid';
import { Column, Paging, FilterRow, HeaderFilter, Scrolling, Selection } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { Toolbar, Item } from 'devextreme-react/toolbar';
import { SelectBox } from 'devextreme-react/select-box';
import { TextBox } from 'devextreme-react/text-box';
import { DropDownButton } from 'devextreme-react/drop-down-button';
import notify from 'devextreme/ui/notify';
import TankLevelGauge from '../dashboard/components/TankLevelGauge';
import './SiteDetailsView.scss';

//Cursor - Site Details component with tank filtering and management actions
const SiteDetailsView = ({
  selectedSite,
  onAddTank,
  onEditSite,
  onEditTank,
  onViewTransactions,
  onStockReconciliation,
  onStockAdjustmentSubmit
}) => {
  const sites = useSelector((state) => state.site.sites);
  const tanks = useSelector((state) => state.tank.tanks);

  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'grid'
  const [tankFilter, setTankFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [selectedTanks, setSelectedTanks] = useState([]);

  // Get current site info
  const currentSite = useMemo(() => {
    return sites.find(site => site.id === selectedSite);
  }, [sites, selectedSite]);

  // Filter tanks based on selected site and filters
  const filteredTanks = useMemo(() => {
    let filtered = tanks.filter(tank => tank.siteId === selectedSite);

    // Apply tank status filter
    if (tankFilter !== 'all') {
      filtered = filtered.filter(tank => {
        const fillPercentage = (tank.currentStock / tank.tankVolume) * 100;
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const lastUpdate = new Date(tank.lastStockUpdate);

        switch (tankFilter) {
          case 'active':
            return lastUpdate >= oneMonthAgo;
          case 'inactive':
            return lastUpdate < oneMonthAgo;
          case 'low':
            return fillPercentage < 30;
          case 'critical':
            return tank.currentStock < 0 || tank.currentStock > tank.tankVolume;
          case 'normal':
            return fillPercentage >= 30 && tank.currentStock >= 0 && tank.currentStock <= tank.tankVolume;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(tank =>
        tank.name.toLowerCase().includes(searchText.toLowerCase()) ||
        tank.ptsId?.toLowerCase().includes(searchText.toLowerCase()) ||
        tank.fuelGradeName?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return filtered;
  }, [tanks, selectedSite, tankFilter, searchText]);

  // Tank filter options
  const tankFilterOptions = [
    { value: 'all', text: 'All Tanks' },
    { value: 'active', text: 'Active Tanks' },
    { value: 'inactive', text: 'Inactive Tanks' },
    { value: 'low', text: 'Low Stock' },
    { value: 'critical', text: 'Critical Status' },
    { value: 'normal', text: 'Normal Status' }
  ];

  // Bulk actions for selected tanks
  const bulkActions = [
    {
      text: 'Bulk Stock Adjustment',
      icon: 'fa-light fa-clipboard-list',
      onClick: () => handleBulkStockAdjustment()
    },
    {
      text: 'Export Tank Data',
      icon: 'fa-light fa-download',
      onClick: () => handleExportTanks()
    },
    {
      text: 'Schedule Maintenance',
      icon: 'fa-light fa-wrench',
      onClick: () => handleBulkMaintenance()
    }
  ];

  const handleBulkStockAdjustment = useCallback(() => {
    if (selectedTanks.length === 0) {
      notify('Please select tanks first', 'warning', 3000);
      return;
    }
    notify(`Bulk adjustment for ${selectedTanks.length} tanks`, 'info', 3000);
  }, [selectedTanks]);

  const handleExportTanks = useCallback(() => {
    const tanksToExport = selectedTanks.length > 0 ? selectedTanks : filteredTanks;
    notify(`Exporting ${tanksToExport.length} tanks`, 'info', 3000);
  }, [selectedTanks, filteredTanks]);

  const handleBulkMaintenance = useCallback(() => {
    if (selectedTanks.length === 0) {
      notify('Please select tanks first', 'warning', 3000);
      return;
    }
    notify(`Scheduling maintenance for ${selectedTanks.length} tanks`, 'info', 3000);
  }, [selectedTanks]);

  // Calculate site metrics
  const siteMetrics = useMemo(() => {
    const totalCapacity = filteredTanks.reduce((sum, tank) => sum + tank.tankVolume, 0);
    const currentStock = filteredTanks.reduce((sum, tank) => sum + (tank.currentStock || 0), 0);
    const criticalCount = filteredTanks.filter(tank =>
      tank.currentStock < 0 || tank.currentStock > tank.tankVolume
    ).length;
    const lowStockCount = filteredTanks.filter(tank =>
      (tank.currentStock / tank.tankVolume) * 100 < 30
    ).length;

    return {
      totalTanks: filteredTanks.length,
      totalCapacity,
      currentStock,
      fillPercentage: totalCapacity > 0 ? (currentStock / totalCapacity) * 100 : 0,
      criticalCount,
      lowStockCount
    };
  }, [filteredTanks]);

  const renderTankCard = useCallback((tank) => (
    <div key={tank.id} className="tank-card">
      <TankLevelGauge
        tank={tank}
        enhanced={true}
        showActions={true}
        onViewTransactions={onViewTransactions}
        onStockReconciliation={onStockReconciliation}
        onEditTank={onEditTank}
        onStockAdjustmentSubmit={onStockAdjustmentSubmit}
      />
    </div>
  ), [onViewTransactions, onStockReconciliation, onEditTank, onStockAdjustmentSubmit]);

  if (!currentSite) {
    return (
      <div className="tw-text-center tw-py-12">
        <i className="fa-light fa-building tw-text-4xl tw-text-gray-300 tw-mb-4"></i>
        <p className="tw-text-gray-500 tw-text-lg">No site selected</p>
      </div>
    );
  }

  return (
    <div className="site-details-view">
      {/* Header */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6 tw-mb-6">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
          <div className="tw-flex tw-items-center">
            <i className="fa-light fa-building tw-text-blue-600 tw-text-2xl tw-mr-4"></i>
            <div>
              <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800">{currentSite.name}</h2>
              <p className="tw-text-gray-600">{currentSite.address || 'No address specified'}</p>
            </div>
          </div>
          <div className="tw-flex tw-space-x-3">
            <Button
              text="Edit Site"
              icon="fa-light fa-edit"
              onClick={() => onEditSite(currentSite)}
              stylingMode="outlined"
            />
            <Button
              text="Add Tank"
              icon="fa-light fa-plus"
              onClick={() => onAddTank(currentSite.id)}
              stylingMode="contained"
              type="default"
            />
          </div>
        </div>

        {/* Site Metrics */}
        <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 lg:tw-grid-cols-6 tw-gap-4">
          <div className="tw-text-center">
            <div className="tw-text-2xl tw-font-bold tw-text-blue-600">{siteMetrics.totalTanks}</div>
            <div className="tw-text-sm tw-text-gray-600">Total Tanks</div>
          </div>
          <div className="tw-text-center">
            <div className="tw-text-2xl tw-font-bold tw-text-green-600">
              {siteMetrics.totalCapacity.toLocaleString()}L
            </div>
            <div className="tw-text-sm tw-text-gray-600">Total Capacity</div>
          </div>
          <div className="tw-text-center">
            <div className="tw-text-2xl tw-font-bold tw-text-blue-600">
              {siteMetrics.currentStock.toLocaleString()}L
            </div>
            <div className="tw-text-sm tw-text-gray-600">Current Stock</div>
          </div>
          <div className="tw-text-center">
            <div className="tw-text-2xl tw-font-bold tw-text-purple-600">
              {siteMetrics.fillPercentage.toFixed(1)}%
            </div>
            <div className="tw-text-sm tw-text-gray-600">Fill Percentage</div>
          </div>
          <div className="tw-text-center">
            <div className={`tw-text-2xl tw-font-bold ${siteMetrics.lowStockCount > 0 ? 'tw-text-yellow-600' : 'tw-text-green-600'}`}>
              {siteMetrics.lowStockCount}
            </div>
            <div className="tw-text-sm tw-text-gray-600">Low Stock</div>
          </div>
          <div className="tw-text-center">
            <div className={`tw-text-2xl tw-font-bold ${siteMetrics.criticalCount > 0 ? 'tw-text-red-600' : 'tw-text-green-600'}`}>
              {siteMetrics.criticalCount}
            </div>
            <div className="tw-text-sm tw-text-gray-600">Critical</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-mb-6">
        <Toolbar>
          <Item location="before" widget="dxSelectBox">
            <SelectBox
              dataSource={tankFilterOptions}
              valueExpr="value"
              displayExpr="text"
              value={tankFilter}
              onValueChanged={(e) => setTankFilter(e.value)}
              width={150}
              placeholder="Filter tanks"
            />
          </Item>

          <Item location="before" widget="dxTextBox">
            <TextBox
              placeholder="Search tanks..."
              value={searchText}
              onValueChanged={(e) => setSearchText(e.value)}
              width={200}
              mode="search"
            />
          </Item>

          <Item location="before" widget="dxButton">
            <Button
              icon={viewMode === 'cards' ? 'fa-light fa-table' : 'fa-light fa-grid'}
              hint={`Switch to ${viewMode === 'cards' ? 'grid' : 'cards'} view`}
              onClick={() => setViewMode(viewMode === 'cards' ? 'grid' : 'cards')}
              stylingMode="text"
            />
          </Item>

          <Item location="after" widget="dxDropDownButton" visible={selectedTanks.length > 0}>
            <DropDownButton
              text={`Bulk Actions (${selectedTanks.length})`}
              icon="fa-light fa-tasks"
              items={bulkActions}
              keyExpr="text"
              displayExpr="text"
              onItemClick={(e) => e.itemData.onClick()}
              stylingMode="outlined"
            />
          </Item>
        </Toolbar>
      </div>

      {/* Tanks Display */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
        {viewMode === 'cards' ? (
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 tw-gap-6">
            {filteredTanks.map(renderTankCard)}
            {filteredTanks.length === 0 && (
              <div className="tw-col-span-full tw-text-center tw-py-12">
                <i className="fa-light fa-tank-water tw-text-4xl tw-text-gray-300 tw-mb-4"></i>
                <p className="tw-text-gray-500 tw-text-lg">No tanks found</p>
                <p className="tw-text-gray-400 tw-text-sm tw-mt-2">
                  Try adjusting your filter criteria or add a new tank
                </p>
              </div>
            )}
          </div>
        ) : (
          <DataGrid
            dataSource={filteredTanks}
            keyExpr="id"
            showBorders={true}
            columnAutoWidth={true}
            selection={{ mode: 'multiple' }}
            onSelectionChanged={(e) => setSelectedTanks(e.selectedRowsData)}
          >
            <Selection mode="multiple" />
            <FilterRow visible={true} />
            <HeaderFilter visible={true} />
            <Scrolling mode="virtual" />
            <Paging defaultPageSize={20} />

            <Column dataField="name" caption="Tank Name" />
            <Column dataField="ptsId" caption="PTS ID" />
            <Column dataField="fuelGradeName" caption="Fuel Grade" />
            <Column
              dataField="currentStock"
              caption="Current Stock (L)"
              format="#,##0.##"
              alignment="right"
            />
            <Column
              dataField="tankVolume"
              caption="Capacity (L)"
              format="#,##0.##"
              alignment="right"
            />
            <Column
              caption="Fill %"
              calculateCellValue={(data) => ((data.currentStock / data.tankVolume) * 100).toFixed(1)}
              alignment="right"
            />
            <Column
              dataField="lastStockUpdate"
              caption="Last Updated"
              dataType="datetime"
              format="dd/MM/yyyy HH:mm"
            />
            <Column
              caption="Status"
              calculateCellValue={(data) => {
                const fillPercentage = (data.currentStock / data.tankVolume) * 100;
                if (data.currentStock < 0 || data.currentStock > data.tankVolume) return 'Critical';
                if (fillPercentage < 30) return 'Low Stock';
                return 'Normal';
              }}
              cellTemplate={(container, options) => {
                const status = options.value;
                const colorClass = status === 'Critical' ? 'tw-text-red-600' :
                                 status === 'Low Stock' ? 'tw-text-yellow-600' : 'tw-text-green-600';
                container.addClass(colorClass);
                container.text(status);
              }}
            />
          </DataGrid>
        )}
      </div>
    </div>
  );
};

export default SiteDetailsView;
