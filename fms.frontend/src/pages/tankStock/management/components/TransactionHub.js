import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, {
  Paging,
  HeaderFilter,
  SearchPanel,
  Toolbar,
  Item as TBItem,
  FilterRow,
  Column,
  Lookup,
  LoadPanel,
  Selection,
  FilterPanel,
  GroupPanel,
  Grouping
} from 'devextreme-react/data-grid';
import Button from 'devextreme-react/button';
import Popup from 'devextreme-react/popup';
import  notify  from 'devextreme/ui/notify';
import { Workbook } from 'exceljs';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { fetchTankVolumeHistoryFiltered } from '../../../redux/actions/tankVolumeHistoryActions';
import { fetchTanks } from '../../../../redux/actions/tankActions';
import { fetchSites } from '../../../../redux/actions/siteActions';
import ManualRefillForm from './ManualRefillForm';
import TransactionFilterPopup from './TransactionFilterPopup';

const TransactionHub = ({ selectedSite, dateRange }) => {
  const dispatch = useDispatch();
  const dataGridRef = useRef(null);

  // Redux state
  const tankVolumeHistory = useSelector((state) => state.tankVolumeHistory.tankVolumeHistory);
  const tanks = useSelector((state) => state.tank.tanks);
  const sites = useSelector((state) => state.site.sites);
  const isLoading = useSelector((state) => state.tankVolumeHistory.isLoading);

  // Local state
  const [showManualRefillForm, setShowManualRefillForm] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({
    siteId: null,
    tankId: null,
    startDate: null,
    endDate: null,
    take: 100,
    includeVehicleNames: true
  });

  // Volume Change Reason Enum mapping
  const VolumeChangeReasonEnum = useMemo(() => [
    { id: 0, name: 'OpeningStock' },
    { id: 1, name: 'ClosingStock' },
    { id: 2, name: 'Delivery' },
    { id: 3, name: 'TransferIn' },
    { id: 4, name: 'TransferOut' },
    { id: 5, name: 'Adjustment' },
    { id: 6, name: 'Dispensing' },
    { id: 7, name: 'ManualRefill' }
  ], []);

  // Load transaction data with filters
  const loadTransactionData = useCallback((filters = currentFilters) => {
    dispatch(fetchTankVolumeHistoryFiltered(filters));
  }, [dispatch, currentFilters]);

  // Initialize data and load sites
  useEffect(() => {
    dispatch(fetchTanks());
    dispatch(fetchSites());

    // Set initial filters based on props
    const initialFilters = {
      siteId: selectedSite && selectedSite !== 'all' ? parseInt(selectedSite) : null,
      tankId: null,
      startDate: dateRange?.startDate || null,
      endDate: dateRange?.endDate || null,
      take: 100,
      includeVehicleNames: true
    };

    setCurrentFilters(initialFilters);
    loadTransactionData(initialFilters);
  }, [dispatch, selectedSite, dateRange, loadTransactionData]);

  // Apply filters from popup
  const handleApplyFilters = useCallback((filters) => {
    setCurrentFilters(filters);
    loadTransactionData(filters);
  }, [loadTransactionData]);

  // Refresh data after successful manual refill
  const handleManualRefillSuccess = useCallback(() => {
    setShowManualRefillForm(false);
    loadTransactionData();
    notify({
      message: 'Manual refill recorded successfully',
      type: 'success',
      displayTime: 3000
    });
  }, [loadTransactionData]);

  // Format timestamp for display
  const formatTime = (cellInfo) => {
    const date = new Date(cellInfo.value);
    return date.toLocaleString();
  };

  // Render change reason with additional info
  const changeReasonCellRender = (cellInfo) => {
    const reason = VolumeChangeReasonEnum.find(r => r.id === cellInfo.value);
    if (reason) {
      if (reason.name === 'Dispensing' && cellInfo.data.vehicleName) {
        return `${reason.name} - ${cellInfo.data.vehicleName}`;
      }
      return reason.name;
    }
    return cellInfo.value;
  };

  // Export functionality
  const onExporting = useCallback((e) => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Transaction History');

    exportDataGrid({
      component: dataGridRef.current.instance,
      worksheet: worksheet,
      autoFilterEnabled: true,
      customizeCell: ({ gridCell, excelCell }) => {
        if (gridCell.column.dataField === 'changeReason') {
          const reason = VolumeChangeReasonEnum.find(r => r.id === gridCell.value);
          if (reason) {
            excelCell.value = reason.name;
          }
        }
        if (gridCell.column.dataField === 'timestamp') {
          if (gridCell.value instanceof Date) {
            excelCell.value = gridCell.value.toLocaleString();
          }
        }
      }
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transaction_history_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
      });
    });
    e.cancel = true;
  }, [VolumeChangeReasonEnum]);



  return (
    <div className="transaction-hub tw-h-full tw-flex tw-flex-col">
      {/* Header with actions */}
      <div className="tw-bg-white tw-p-4 tw-border-b tw-border-gray-200">
        <div className="tw-flex tw-justify-between tw-items-center">
          <div>
            <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-flex tw-items-center">
              <i className="fa-light fa-exchange-alt tw-mr-2 tw-text-blue-600"></i>
              Transaction Hub
            </h2>
            <p className="tw-text-gray-600 tw-text-sm tw-mt-1">
              Unified view of all tank transactions and volume changes
            </p>
          </div>
          <div className="tw-flex tw-space-x-2">
            <Button
              text="Filters"
              icon="fa-light fa-filter"
              onClick={() => setShowFilterPopup(true)}
              stylingMode="outlined"
              className="tw-min-w-24"
            />
            <Button
              text="Manual Refill"
              icon="fa-light fa-plus"
              onClick={() => setShowManualRefillForm(true)}
              type="default"
              className="tw-min-w-32"
            />
            <Button
              text="Refresh"
              icon="fa-light fa-refresh"
              onClick={() => loadTransactionData()}
              stylingMode="outlined"
            />
          </div>
        </div>

        {/* Current Filters Display */}
        {(currentFilters.siteId || currentFilters.tankId || currentFilters.startDate || currentFilters.endDate) && (
          <div className="tw-mt-3 tw-p-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div className="tw-flex tw-items-center tw-text-sm tw-text-blue-800">
                <i className="fa-light fa-info-circle tw-mr-2"></i>
                <span className="tw-font-medium">Active Filters:</span>
                <div className="tw-ml-2 tw-flex tw-flex-wrap tw-gap-2">
                  {currentFilters.siteId && (
                    <span className="tw-bg-blue-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs">
                      Site: {sites?.find(s => s.id === currentFilters.siteId)?.name || 'Unknown'}
                    </span>
                  )}
                  {currentFilters.tankId && (
                    <span className="tw-bg-blue-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs">
                      Tank: {tanks?.find(t => t.id === currentFilters.tankId)?.name || 'Unknown'}
                    </span>
                  )}
                  {currentFilters.startDate && (
                    <span className="tw-bg-blue-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs">
                      From: {new Date(currentFilters.startDate).toLocaleDateString()}
                    </span>
                  )}
                  {currentFilters.endDate && (
                    <span className="tw-bg-blue-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs">
                      To: {new Date(currentFilters.endDate).toLocaleDateString()}
                    </span>
                  )}
                  <span className="tw-bg-green-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs">
                    Limit: {currentFilters.take} records
                  </span>
                </div>
              </div>
              <Button
                text="Clear All"
                onClick={() => handleApplyFilters({
                  siteId: null,
                  tankId: null,
                  startDate: null,
                  endDate: null,
                  take: 100,
                  includeVehicleNames: true
                })}
                stylingMode="text"
                className="tw-text-xs tw-text-blue-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="tw-flex-1 tw-p-4">
        <DataGrid
          dataSource={tankVolumeHistory}
          keyExpr="id"
          showBorders={true}
          ref={dataGridRef}
          showColumnLines={true}
          showRowLines={true}
          allowColumnResizing={true}
          showColumnHeaders={true}
          className="tw-h-full"
        >
          <FilterPanel visible={true} />
          <GroupPanel visible={true} />
          <Grouping visible={true} autoExpandAll={false} />
          <HeaderFilter visible={true} />
          <FilterRow visible={true} />
          <SearchPanel visible={true} placeholder="Search transactions..." />
          <Paging defaultPageSize={50} />
          <Selection mode="multiple" />

          <Toolbar>
            <TBItem
              location="after"
              widget="dxButton"
              options={{
                icon: 'fa-light fa-file-export',
                text: 'Export',
                onClick: onExporting
              }}
            />
          </Toolbar>

          <LoadPanel enabled={isLoading} />

          {/* Columns */}
          <Column dataField="id" caption="ID" visible={false} defaultSortOrder="desc" />
          <Column
            dataField="timestamp"
            caption="Date & Time"
            cellRender={formatTime}
            minWidth={150}
            sortOrder="desc"
          />
          <Column dataField="site" caption="Site" groupIndex={0} />
          <Column dataField="tankId" caption="Tank" groupIndex={1}>
            <Lookup dataSource={tanks} valueExpr="id" displayExpr="name" />
          </Column>
          <Column
            dataField="changeReason"
            caption="Transaction Type"
            minWidth={130}
            cellRender={changeReasonCellRender}
          >
            <Lookup dataSource={VolumeChangeReasonEnum} valueExpr="id" displayExpr="name" />
          </Column>
          <Column
            dataField="volumeChange"
            caption="Volume Change (L)"
            minWidth={150}
            format="#,##0.00"
          />
          <Column
            dataField="newVolume"
            caption="New Volume (L)"
            minWidth={120}
            format="#,##0.00"
          />
          <Column
            dataField="recordedBy"
            caption="Recorded By"
            minWidth={100}

          >
          </Column>


        </DataGrid>
      </div>

      {/* Manual Refill Popup */}
      <Popup
        visible={showManualRefillForm}
        onHiding={() => setShowManualRefillForm(false)}
        showTitle={true}
        title="Manual Fuel Refill"
        width="90%"
        height="90%"
        showCloseButton={true}
        dragEnabled={false}
        className="manual-refill-popup"
      >
        <ManualRefillForm
          onCancel={() => setShowManualRefillForm(false)}
          onSuccess={handleManualRefillSuccess}
        />
      </Popup>

      {/* Transaction Filter Popup */}
      <TransactionFilterPopup
        visible={showFilterPopup}
        onHiding={() => setShowFilterPopup(false)}
        currentFilters={currentFilters}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default TransactionHub;
