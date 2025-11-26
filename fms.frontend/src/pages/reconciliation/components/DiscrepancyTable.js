import React from 'react';
import { DataGrid } from 'devextreme-react';
import { Column, Paging, Pager, SearchPanel } from 'devextreme-react/data-grid';

/**
 * Discrepancy Table Component
 * Displays list of discrepancies found during reconciliation
 */
const DiscrepancyTable = ({ discrepancies = [], tankName = '' }) => {
  const renderField = (data) => {
    const fieldIcons = {
      'OpeningStock': 'fa-light fa-arrow-up-from-line',
      'ClosingStock': 'fa-light fa-arrow-down-to-line',
      'Deliveries': 'fa-light fa-truck',
      'TransfersIn': 'fa-light fa-arrow-right-to-arc',
      'TransfersOut': 'fa-light fa-arrow-left-from-arc'
    };

    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <i className={`${fieldIcons[data.value] || 'fa-light fa-file'} tw-text-blue-500`}></i>
        <span>{data.value}</span>
      </div>
    );
  };

  const renderDifference = (data) => {
    const diff = data.value;
    const colorClass = Math.abs(diff) > 1 ? 'tw-text-red-600' : 'tw-text-orange-500';

    return (
      <span className={`tw-font-semibold ${colorClass}`}>
        {diff > 0 ? '+' : ''}{diff.toFixed(2)}
      </span>
    );
  };

  const renderValue = (data) => {
    return <span className="tw-font-medium">{data.value?.toFixed(2) || '0.00'}</span>;
  };

  if (!discrepancies || discrepancies.length === 0) {
    return (
      <div className="tw-text-center tw-py-8 tw-text-gray-500">
        <i className="fa-light fa-circle-check tw-text-6xl tw-text-green-500 tw-mb-4"></i>
        <p className="tw-text-lg tw-font-semibold">No Discrepancies Found</p>
        <p className="tw-text-sm">Tank stock data is consistent with volume history</p>
      </div>
    );
  }

  return (
    <div className="tw-space-y-4">
      {tankName && (
        <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
          <div className="tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-gas-pump tw-text-blue-600"></i>
            <span className="tw-font-semibold tw-text-blue-900">Tank: {tankName}</span>
          </div>
        </div>
      )}

      <DataGrid
        dataSource={discrepancies}
        showBorders={true}
        showRowLines={true}
        showColumnLines={false}
        rowAlternationEnabled={true}
        hoverStateEnabled={true}
        columnAutoWidth={true}
      >
        <SearchPanel visible={true} width={240} placeholder="Search discrepancies..." />
        <Paging enabled={true} defaultPageSize={10} />
        <Pager
          showPageSizeSelector={true}
          allowedPageSizes={[5, 10, 20]}
          showInfo={true}
        />

        <Column
          dataField="field"
          caption="Field"
          cellRender={renderField}
        />
        <Column
          dataField="tankStockValue"
          caption="Tank Stock (Source)"
          cellRender={renderValue}
          cssClass="tw-bg-green-50"
        />
        <Column
          dataField="volumeHistoryValue"
          caption="Volume History (Current)"
          cellRender={renderValue}
          cssClass="tw-bg-yellow-50"
        />
        <Column
          dataField="difference"
          caption="Difference"
          cellRender={renderDifference}
          alignment="center"
        />
      </DataGrid>
    </div>
  );
};

export default DiscrepancyTable;
