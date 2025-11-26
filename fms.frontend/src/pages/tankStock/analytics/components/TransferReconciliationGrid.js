import React from 'react';
import PropTypes from 'prop-types';
import { DataGrid } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import {
  Column,
  Summary,
  TotalItem,
  Format,
  MasterDetail,
  Export,
  SearchPanel,
  FilterRow,
  HeaderFilter,
  Paging
} from 'devextreme-react/data-grid';

const TransferReconciliationGrid = ({ periods, tankName, onDiagnosticClick }) => {
  // Custom cell render for period number with icon
  const renderPeriodNumber = (cellData) => {
    return (
      <div className="tw-flex tw-items-center">
        <i className="fa-light fa-hashtag tw-mr-2 tw-text-gray-500"></i>
        <span className="tw-font-semibold">{cellData.value}</span>
      </div>
    );
  };

  // Custom cell render for date range
  const renderDateRange = (cellData) => {
    const startDate = new Date(cellData.data.startDate).toLocaleDateString();
    const endDate = new Date(cellData.data.endDate).toLocaleDateString();
    return (
      <div className="tw-text-sm">
        <div>{startDate}</div>
        <div className="tw-text-xs tw-text-gray-500">to {endDate}</div>
      </div>
    );
  };

  // Custom cell render for stock values
  const renderStockValue = (cellData) => {
    if (cellData.value === null || cellData.value === undefined) return '-';
    return <span className="tw-font-semibold">{Number(cellData.value).toFixed(2)} L</span>;
  };

  // Custom cell render for variance with color coding
  const renderVariance = (cellData) => {
    const value = cellData.value;
    if (value === null || value === undefined) return '-';

    const num = Number(value);
    const sign = num >= 0 ? '+' : '';
    const colorClass = num > 0 ? 'tw-text-orange-600' : num < 0 ? 'tw-text-red-600' : 'tw-text-green-600';

    return (
      <span className={`tw-font-bold ${colorClass}`}>
        {sign}{num.toFixed(2)} L
      </span>
    );
  };

  // Custom cell render for variance percentage
  const renderVariancePercentage = (cellData) => {
    const value = cellData.value;
    if (value === null || value === undefined) return '-';

    const num = Number(value);
    const sign = num >= 0 ? '+' : '';
    const colorClass = num > 0 ? 'tw-text-orange-600' : num < 0 ? 'tw-text-red-600' : 'tw-text-green-600';

    return (
      <span className={`tw-font-semibold tw-text-xs ${colorClass}`}>
        {sign}{num.toFixed(2)}%
      </span>
    );
  };

  // Custom cell render for severity status
  const renderSeverity = (cellData) => {
    const severity = cellData.value;
    if (!severity) return '-';

    let icon, color, bgColor, label;
    if (severity === 'acceptable') {
      icon = 'fa-circle-check';
      color = 'tw-text-green-600';
      bgColor = 'tw-bg-green-100';
      label = 'OK';
    } else if (severity === 'moderate') {
      icon = 'fa-exclamation';
      color = 'tw-text-yellow-600';
      bgColor = 'tw-bg-yellow-100';
      label = 'Review';
    } else {
      icon = 'fa-triangle-exclamation';
      color = 'tw-text-red-600';
      bgColor = 'tw-bg-red-100';
      label = 'Alert';
    }

    return (
      <div className={`tw-inline-flex tw-items-center tw-px-2 tw-py-1 tw-rounded-full ${bgColor}`}>
        <i className={`fa-light ${icon} tw-mr-1 ${color}`}></i>
        <span className={`tw-text-xs tw-font-semibold ${color}`}>{label}</span>
      </div>
    );
  };

  // Custom cell render for transfers with count badge
  const renderTransferValue = (cellData, direction) => {
    const value = cellData.data[`transfers${direction}`];
    const count = cellData.data[`transfers${direction}Count`];

    if (!value && !count) return '-';

    const icon = direction === 'In' ? 'fa-arrow-down-to-line' : 'fa-arrow-up-from-line';
    const iconColor = direction === 'In' ? 'tw-text-green-600' : 'tw-text-orange-600';

    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <i className={`fa-light ${icon} ${iconColor}`}></i>
        <span className="tw-font-semibold">{Number(value || 0).toFixed(2)} L</span>
        {count > 0 && (
          <span className="tw-bg-blue-100 tw-text-blue-700 tw-text-xs tw-px-2 tw-py-0.5 tw-rounded-full">
            {count}
          </span>
        )}
      </div>
    );
  };

  // Custom cell render for diagnostic button
  const renderDiagnosticButton = (cellData) => {
    const period = cellData.data;

    // Only show button if handler is provided
    if (!onDiagnosticClick) return null;

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onDiagnosticClick(period);
        }}
        className="tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-text-blue-600 hover:tw-text-blue-800 hover:tw-bg-blue-50 tw-rounded tw-p-2 tw-transition-colors"
        title="View Detailed Period Diagnostic"
      >
        <i className="fa-light fa-microscope tw-text-lg"></i>
      </div>
    );
  };

  // Master-Detail template for expanded rows
  const renderMasterDetail = (masterData) => {
    const period = masterData.data;

    return (
      <div className="tw-p-4 tw-bg-gray-50">
        {/* Dispensing Breakdown */}
        <div className="tw-mb-4">
          <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3 tw-flex tw-items-center">
            <i className="fa-light fa-gas-pump tw-mr-2 tw-text-purple-600"></i>
            Dispensing Breakdown
          </h4>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-3">
            <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-3">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <div className="tw-text-xs tw-text-gray-600 tw-mb-1">Manual Aggregate</div>
                  <div className="tw-text-lg tw-font-bold tw-text-gray-900">
                    {Number(period.dispensingDetails?.manualAggregate || 0).toFixed(2)} L
                  </div>
                </div>
                <i className="fa-light fa-hand tw-text-2xl tw-text-orange-600"></i>
              </div>
            </div>
            <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-3">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <div className="tw-text-xs tw-text-gray-600 tw-mb-1">Sensor Dispensing</div>
                  <div className="tw-text-lg tw-font-bold tw-text-gray-900">
                    {Number(period.dispensingDetails?.sensorDispensing || 0).toFixed(2)} L
                  </div>
                </div>
                <i className="fa-light fa-sensor tw-text-2xl tw-text-green-600"></i>
              </div>
            </div>
            <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-3">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <div className="tw-text-xs tw-text-gray-600 tw-mb-1">Automated (PTS)</div>
                  <div className="tw-text-lg tw-font-bold tw-text-gray-900">
                    {Number(period.dispensingDetails?.automatedDispensing || 0).toFixed(2)} L
                  </div>
                </div>
                <i className="fa-light fa-robot tw-text-2xl tw-text-blue-600"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Transfer Details (if available) */}
        {period.transferDetails && period.transferDetails.length > 0 && (
          <div>
            <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3 tw-flex tw-items-center">
              <i className="fa-light fa-exchange-alt tw-mr-2 tw-text-blue-600"></i>
              Transfer Transactions ({period.transferDetails.length})
            </h4>
            <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-overflow-hidden">
              <table className="tw-min-w-full tw-divide-y tw-divide-gray-200">
                <thead className="tw-bg-gray-100">
                  <tr>
                    <th className="tw-px-3 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase">
                      Transfer ID
                    </th>
                    <th className="tw-px-3 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase">
                      Date
                    </th>
                    <th className="tw-px-3 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase">
                      Direction
                    </th>
                    <th className="tw-px-3 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase">
                      From
                    </th>
                    <th className="tw-px-3 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase">
                      To
                    </th>
                    <th className="tw-px-3 tw-py-2 tw-text-right tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase">
                      Amount
                    </th>
                    <th className="tw-px-3 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase">
                      Recorded By
                    </th>
                  </tr>
                </thead>
                <tbody className="tw-divide-y tw-divide-gray-200">
                  {period.transferDetails.map((transfer, index) => (
                    <tr key={index} className="hover:tw-bg-gray-50">
                      <td className="tw-px-3 tw-py-2 tw-text-sm tw-text-gray-900">
                        #{transfer.transferId}
                      </td>
                      <td className="tw-px-3 tw-py-2 tw-text-sm tw-text-gray-600">
                        {new Date(transfer.transferDate).toLocaleString()}
                      </td>
                      <td className="tw-px-3 tw-py-2 tw-text-sm">
                        {transfer.direction === 'In' ? (
                          <span className="tw-text-green-600 tw-font-semibold">
                            <i className="fa-light fa-arrow-down tw-mr-1"></i>IN
                          </span>
                        ) : (
                          <span className="tw-text-orange-600 tw-font-semibold">
                            <i className="fa-light fa-arrow-up tw-mr-1"></i>OUT
                          </span>
                        )}
                      </td>
                      <td className="tw-px-3 tw-py-2 tw-text-sm tw-text-gray-600">
                        {transfer.sourceTankName || `Tank #${transfer.sourceTankId}`}
                      </td>
                      <td className="tw-px-3 tw-py-2 tw-text-sm tw-text-gray-600">
                        {transfer.destinationTankName || `Tank #${transfer.destinationTankId}`}
                      </td>
                      <td className="tw-px-3 tw-py-2 tw-text-sm tw-text-right tw-font-semibold tw-text-gray-900">
                        {Number(transfer.amount).toFixed(2)} L
                      </td>
                      <td className="tw-px-3 tw-py-2 tw-text-sm tw-text-gray-600">
                        {transfer.recordedByName || 'System'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No transfer details message */}
        {(!period.transferDetails || period.transferDetails.length === 0) && (
          <div className="tw-text-sm tw-text-gray-500 tw-text-center tw-py-3 tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg">
            <i className="fa-light fa-circle-info tw-mr-2"></i>
            No transfer details included. Enable "Include Transfer Details" to see transaction records.
          </div>
        )}
      </div>
    );
  };

  if (!periods || periods.length === 0) {
    return (
      <div className="tw-text-center tw-text-gray-500 tw-p-8">
        <i className="fa-light fa-table tw-text-4xl tw-text-gray-400 tw-mb-3"></i>
        <div className="tw-text-sm">No period data available</div>
      </div>
    );
  }

  return (
    <div className="transfer-reconciliation-grid">
      <DataGrid
        dataSource={periods}
        keyExpr="periodNumber"
        showBorders={true}
        showRowLines={true}
        showColumnLines={false}
        rowAlternationEnabled={true}
        hoverStateEnabled={true}
        allowColumnReordering={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
      >
        {/* Columns */}
        <Column
          dataField="periodNumber"
          caption="Period"
          width={100}
          alignment="center"
          cellRender={renderPeriodNumber}
        />
        <Column
          caption="Date Range"
          width={150}
          cellRender={renderDateRange}
          allowSorting={false}
        />
        <Column
          dataField="openingStock"
          caption="Opening"
          width={120}
          alignment="right"
          cellRender={renderStockValue}
        >
          <Format type="fixedPoint" precision={2} />
        </Column>
        <Column
          dataField="actualClosing"
          caption="Actual Closing"
          width={130}
          alignment="right"
          cellRender={renderStockValue}
        >
          <Format type="fixedPoint" precision={2} />
        </Column>
        <Column
          dataField="expectedClosing"
          caption="Expected Closing"
          width={140}
          alignment="right"
          cellRender={renderStockValue}
        >
          <Format type="fixedPoint" precision={2} />
        </Column>
        <Column
          dataField="variance"
          caption="Variance"
          width={120}
          alignment="right"
          cellRender={renderVariance}
        >
          <Format type="fixedPoint" precision={2} />
        </Column>
        <Column
          dataField="variancePercentage"
          caption="Var %"
          width={90}
          alignment="center"
          cellRender={renderVariancePercentage}
        />
        <Column
          dataField="severity"
          caption="Status"
          width={110}
          alignment="center"
          cellRender={renderSeverity}
        />
        <Column
          caption="Transfers In"
          width={140}
          alignment="left"
          cellRender={(cellData) => renderTransferValue(cellData, 'In')}
          allowSorting={false}
        />
        <Column
          caption="Transfers Out"
          width={140}
          alignment="left"
          cellRender={(cellData) => renderTransferValue(cellData, 'Out')}
          allowSorting={false}
        />
        <Column
          dataField="totalDispensing"
          caption="Dispensing"
          width={120}
          alignment="right"
          cellRender={renderStockValue}
        >
          <Format type="fixedPoint" precision={2} />
        </Column>

        {/* Diagnostic Button Column */}
        {onDiagnosticClick && (
          <Column
            caption="Diagnostic"
            width={100}
            alignment="center"
            cellRender={renderDiagnosticButton}
            allowSorting={false}
            allowFiltering={false}
            allowExporting={false}
          />
        )}

        {/* Master-Detail for expandable rows */}
        <MasterDetail
          enabled={true}
          render={renderMasterDetail}
        />

        {/* Summary Row */}
        <Summary>
          <TotalItem
            column="periodNumber"
            summaryType="count"
            displayFormat="Total: {0} periods"
          />
          <TotalItem
            column="transfersIn"
            summaryType="sum"
            valueFormat={{ type: 'fixedPoint', precision: 2 }}
            displayFormat="{0} L"
          />
          <TotalItem
            column="transfersOut"
            summaryType="sum"
            valueFormat={{ type: 'fixedPoint', precision: 2 }}
            displayFormat="{0} L"
          />
          <TotalItem
            column="totalDispensing"
            summaryType="sum"
            valueFormat={{ type: 'fixedPoint', precision: 2 }}
            displayFormat="{0} L"
          />
          <TotalItem
            column="variance"
            summaryType="avg"
            valueFormat={{ type: 'fixedPoint', precision: 2 }}
            displayFormat="Avg: {0} L"
          />
        </Summary>

        {/* Features */}
        <SearchPanel visible={true} width={240} placeholder="Search periods..." />
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <Paging enabled={false} />
        <Export enabled={true} fileName={`transfer_reconciliation_${tankName || 'tank'}`} allowExportSelectedData={true} />
      </DataGrid>
    </div>
  );
};

TransferReconciliationGrid.propTypes = {
  periods: PropTypes.array,
  tankName: PropTypes.string,
  onDiagnosticClick: PropTypes.func
};

export default TransferReconciliationGrid;
