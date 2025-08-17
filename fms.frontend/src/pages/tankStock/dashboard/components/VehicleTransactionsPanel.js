import React, { useMemo } from 'react';
import { DataGrid, Column, Paging, SearchPanel, FilterRow } from 'devextreme-react/data-grid';

/**
 * Component to display recent tank volume transactions with vehicle information
 * Optimized for the /api/tankvolumehistory/filtered endpoint data
 */
const VehicleTransactionsPanel = ({
  volumeHistoryData = [],
  loading = false,
  className = '',
  showOnlyVehicles = true,
  maxRecords = 50
}) => {

  // Process and filter data for display
  const transactionData = useMemo(() => {
    if (!Array.isArray(volumeHistoryData)) return [];

    let filtered = volumeHistoryData;

    // Filter to show only records with vehicles if specified
    if (showOnlyVehicles) {
      filtered = filtered.filter(record =>
        record.vehicleName || record.VehicleName
      );
    }

    // Sort by timestamp (most recent first)
    filtered = filtered.sort((a, b) =>
      new Date(b.timestamp || b.Timestamp) - new Date(a.timestamp || a.Timestamp)
    );

    // Limit records
    if (maxRecords) {
      filtered = filtered.slice(0, maxRecords);
    }

    // Normalize data structure
    return filtered.map((record, index) => ({
      id: record.id || index,
      timestamp: record.timestamp || record.Timestamp,
      tankName: record.tankName || record.TankName || `Tank ${record.tankId || record.TankId}`,
      vehicleName: record.vehicleName || record.VehicleName || '-',
      newVolume: record.newVolume ?? record.NewVolume ?? 0,
      volumeChange: record.volumeChange ?? record.VolumeChange ?? 0,
      changeReason: record.changeReason ?? record.ChangeReason,
      referenceType: record.referenceType || record.ReferenceType || '-',
      recordedBy: record.recordedBy || record.RecordedBy || '-',
      formattedTime: new Date(record.timestamp || record.Timestamp).toLocaleString(),
      isDispensing: (record.changeReason ?? record.ChangeReason) === 6, // Dispensing = 6
      volumeChangeDisplay: `${(record.volumeChange ?? record.VolumeChange) > 0 ? '+' : ''}${(record.volumeChange ?? record.VolumeChange)?.toFixed(2) || '0.00'} L`,
      volumeDisplay: `${(record.newVolume ?? record.NewVolume)?.toFixed(2) || '0.00'} L`
    }));
  }, [volumeHistoryData, showOnlyVehicles, maxRecords]);

  const getChangeReasonDisplay = (cellData) => {
    const reasonMap = {
      0: 'Opening Stock',
      1: 'Closing Stock',
      2: 'Delivery',
      3: 'Transfer In',
      4: 'Transfer Out',
      5: 'Adjustment',
      6: 'Dispensing'
    };

    return reasonMap[cellData.value] || `Unknown (${cellData.value})`;
  };

  const customizeVolumeChangeCell = (cellData) => {
    const value = cellData.value || 0;
    const isPositive = value > 0;
    const className = isPositive ? 'tw-text-green-600 tw-font-semibold' : 'tw-text-red-600 tw-font-semibold';

    return `<span class="${className}">${cellData.displayValue}</span>`;
  };

  if (loading) {
    return (
      <div className={`tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6 ${className}`}>
        <div className="tw-flex tw-items-center tw-justify-center tw-h-40">
          <div className="tw-text-center">
            <i className="fa-light fa-spinner tw-animate-spin tw-text-2xl tw-text-blue-600 tw-mb-2"></i>
            <div className="tw-text-gray-600">Loading vehicle transactions...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6 ${className}`}>
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
          <i className="fa-light fa-truck tw-mr-2 tw-text-blue-600"></i>
          Recent Vehicle Transactions
        </h3>
        <div className="tw-text-sm tw-text-gray-500">
          {transactionData.length} records
        </div>
      </div>

      {transactionData.length === 0 ? (
        <div className="tw-text-center tw-py-8">
          <i className="fa-light fa-truck tw-text-4xl tw-text-gray-300 tw-mb-4"></i>
          <p className="tw-text-gray-500 tw-text-lg">No vehicle transactions found</p>
          <p className="tw-text-gray-400 tw-text-sm tw-mt-2">
            {showOnlyVehicles ? 'Try including all transactions' : 'Check your date range or site selection'}
          </p>
        </div>
      ) : (
        <DataGrid
          dataSource={transactionData}
          keyExpr="id"
          showBorders={true}
          showRowLines={true}
          showColumnLines={false}
          rowAlternationEnabled={true}
          height={400}
          columnAutoWidth={true}
          wordWrapEnabled={true}
        >
          <SearchPanel
            visible={true}
            placeholder="Search transactions..."
            width={240}
          />
          <FilterRow visible={true} />
          <Paging enabled={true} pageSize={20} />

          <Column
            dataField="formattedTime"
            caption="Time"
            width={180}
            sortOrder="desc"
            allowSorting={true}
          />

          <Column
            dataField="tankName"
            caption="Tank"
            width={120}
            allowFiltering={true}
          />

          <Column
            dataField="vehicleName"
            caption="Vehicle"
            width={140}
            allowFiltering={true}
            cellRender={(cellData) => (
              <span className={cellData.value === '-' ? 'tw-text-gray-400 tw-italic' : 'tw-font-medium'}>
                {cellData.value}
              </span>
            )}
          />

          <Column
            dataField="changeReason"
            caption="Type"
            width={120}
            allowFiltering={true}
            customizeText={getChangeReasonDisplay}
            cellRender={(cellData) => {
              const isDispensing = cellData.data.isDispensing;
              const className = isDispensing ? 'tw-bg-red-100 tw-text-red-800 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium' : 'tw-bg-blue-100 tw-text-blue-800 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium';
              return (
                <span className={className}>
                  {getChangeReasonDisplay(cellData)}
                </span>
              );
            }}
          />

          <Column
            dataField="volumeChangeDisplay"
            caption="Volume Change"
            width={130}
            allowSorting={true}
            encodeHtml={false}
            customizeText={customizeVolumeChangeCell}
          />

          <Column
            dataField="volumeDisplay"
            caption="New Volume"
            width={120}
            allowSorting={true}
          />

          <Column
            dataField="recordedBy"
            caption="Recorded By"
            width={120}
            allowFiltering={true}
            cellRender={(cellData) => (
              <span className={cellData.value === '-' ? 'tw-text-gray-400 tw-italic' : ''}>
                {cellData.value}
              </span>
            )}
          />
        </DataGrid>
      )}
    </div>
  );
};

export default VehicleTransactionsPanel;
