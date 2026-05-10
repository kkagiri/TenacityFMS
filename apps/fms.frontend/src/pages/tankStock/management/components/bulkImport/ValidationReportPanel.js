import React, { useState } from 'react';
import DataGrid, {
  Column,
  Paging,
  Scrolling,
  HeaderFilter,
  FilterRow,
  Grouping,
  GroupPanel,
  Export,
  Summary,
  GroupItem
} from 'devextreme-react/data-grid';
import Button from 'devextreme-react/button';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ValidationReportPanel = ({ validationResult }) => {
  const [showAnomalies, setShowAnomalies] = useState(true);

  const validation = validationResult.validationResult;
  const anomalies = validation.anomalies || [];

  // Severity badge styling
  const getSeverityBadge = (severity) => {
    const badges = {
      Critical: 'tw-bg-red-100 tw-text-red-800 tw-border-red-300',
      High: 'tw-bg-orange-100 tw-text-orange-800 tw-border-orange-300',
      Medium: 'tw-bg-yellow-100 tw-text-yellow-800 tw-border-yellow-300',
      Low: 'tw-bg-blue-100 tw-text-blue-800 tw-border-blue-300',
      Info: 'tw-bg-gray-100 tw-text-gray-800 tw-border-gray-300'
    };

    return badges[severity] || badges.Info;
  };

  // Anomaly type icon
  const getAnomalyIcon = (type) => {
    const icons = {
      DailyBalance: 'fa-balance-scale',
      ContinuityBreak: 'fa-chain-broken',
      CumulativeDrift: 'fa-chart-line-down',
      MeterRollback: 'fa-undo',
      MeterMismatch: 'fa-not-equal',
      CapacityOverflow: 'fa-fill-drip',
      NegativeStock: 'fa-minus-circle',
      TransferImbalance: 'fa-exchange-alt',
      ZeroMovement: 'fa-equals',
      ImplausibleDispensing: 'fa-exclamation-triangle',
      DeliveryNoSpace: 'fa-truck-loading',
      TankNotFound: 'fa-search',
      InvalidDate: 'fa-calendar-times',
      DuplicateEntry: 'fa-copy',
      MissingRequiredField: 'fa-asterisk'
    };

    return icons[type] || 'fa-info-circle';
  };

  // Download validation report
  const downloadReport = () => {
    const reportData = anomalies.map((anomaly, index) => ({
      '#': index + 1,
      'Severity': anomaly.severity,
      'Type': anomaly.type,
      'Tank': anomaly.tankName,
      'Date': new Date(anomaly.date).toLocaleDateString(),
      'Row #': anomaly.rowNumber,
      'Message': anomaly.message,
      'Expected': anomaly.expectedValue || '-',
      'Actual': anomaly.actualValue || '-',
      'Variance': anomaly.variance || '-',
      'Details': anomaly.details || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Validation Report');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `TankStock_Validation_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Custom cell render for severity
  const renderSeverityCell = (cellData) => {
    const badgeClass = getSeverityBadge(cellData.value);
    return (
      <div className={`tw-inline-flex tw-items-center tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium tw-border ${badgeClass}`}>
        {cellData.value}
      </div>
    );
  };

  // Custom cell render for type
  const renderTypeCell = (cellData) => {
    const icon = getAnomalyIcon(cellData.value);
    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <i className={`fa-light ${icon} tw-text-gray-600`}></i>
        <span>{cellData.value}</span>
      </div>
    );
  };

  // Custom cell render for message
  const renderMessageCell = (cellData) => {
    return (
      <div className="tw-text-sm">
        <div className="tw-font-medium">{cellData.data.message}</div>
        {cellData.data.details && (
          <div className="tw-text-xs tw-text-gray-500 tw-mt-1">{cellData.data.details}</div>
        )}
      </div>
    );
  };

  return (
    <div className="validation-report-panel">
      {/* Summary Stats */}
      <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-5 tw-gap-4 tw-mb-6">
        <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4 tw-border tw-border-gray-200">
          <div className="tw-text-sm tw-text-gray-600 tw-mb-1">Total Rows</div>
          <div className="tw-text-2xl tw-font-bold tw-text-gray-900">{validation.totalRows}</div>
        </div>

        <div className="tw-bg-green-50 tw-rounded-lg tw-p-4 tw-border tw-border-green-200">
          <div className="tw-text-sm tw-text-green-600 tw-mb-1 tw-flex tw-items-center tw-gap-1">
            <i className="fa-light fa-check-circle"></i>
            Valid Rows
          </div>
          <div className="tw-text-2xl tw-font-bold tw-text-green-900">{validation.validRows}</div>
        </div>

        {validation.criticalCount > 0 && (
          <div className="tw-bg-red-50 tw-rounded-lg tw-p-4 tw-border tw-border-red-200">
            <div className="tw-text-sm tw-text-red-600 tw-mb-1 tw-flex tw-items-center tw-gap-1">
              <i className="fa-light fa-times-circle"></i>
              Critical Errors
            </div>
            <div className="tw-text-2xl tw-font-bold tw-text-red-900">{validation.criticalCount}</div>
          </div>
        )}

        {validation.highCount > 0 && (
          <div className="tw-bg-orange-50 tw-rounded-lg tw-p-4 tw-border tw-border-orange-200">
            <div className="tw-text-sm tw-text-orange-600 tw-mb-1 tw-flex tw-items-center tw-gap-1">
              <i className="fa-light fa-exclamation-circle"></i>
              High Errors
            </div>
            <div className="tw-text-2xl tw-font-bold tw-text-orange-900">{validation.highCount}</div>
          </div>
        )}

        {(validation.mediumCount + validation.lowCount) > 0 && (
          <div className="tw-bg-yellow-50 tw-rounded-lg tw-p-4 tw-border tw-border-yellow-200">
            <div className="tw-text-sm tw-text-yellow-600 tw-mb-1 tw-flex tw-items-center tw-gap-1">
              <i className="fa-light fa-exclamation-triangle"></i>
              Warnings
            </div>
            <div className="tw-text-2xl tw-font-bold tw-text-yellow-900">
              {validation.mediumCount + validation.lowCount}
            </div>
          </div>
        )}
      </div>

      {/* Summary Message */}
      <div className={`tw-rounded-lg tw-p-4 tw-mb-6 ${
        validation.isValid && !validation.hasWarnings
          ? 'tw-bg-green-50 tw-border tw-border-green-200'
          : validation.hasBlockingAnomalies
          ? 'tw-bg-red-50 tw-border tw-border-red-200'
          : 'tw-bg-yellow-50 tw-border tw-border-yellow-200'
      }`}>
        <div className="tw-flex tw-items-start tw-gap-3">
          <i className={`fa-light ${
            validation.isValid && !validation.hasWarnings
              ? 'fa-check-circle tw-text-green-600'
              : validation.hasBlockingAnomalies
              ? 'fa-times-circle tw-text-red-600'
              : 'fa-exclamation-triangle tw-text-yellow-600'
          } tw-text-xl tw-mt-1`}></i>
          <div className="tw-flex-1">
            <h4 className={`tw-font-semibold tw-mb-1 ${
              validation.isValid && !validation.hasWarnings
                ? 'tw-text-green-900'
                : validation.hasBlockingAnomalies
                ? 'tw-text-red-900'
                : 'tw-text-yellow-900'
            }`}>
              {validation.summary}
            </h4>
            {validation.hasBlockingAnomalies && (
              <p className="tw-text-sm tw-text-red-700">
                Please fix the critical and high severity errors before importing.
              </p>
            )}
            {validation.hasWarnings && !validation.hasBlockingAnomalies && (
              <p className="tw-text-sm tw-text-yellow-700">
                You can proceed with import, but it's recommended to review the warnings first.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Duplicates Info */}
      {validationResult.duplicates && validationResult.duplicates.length > 0 && (
        <div className="tw-bg-orange-50 tw-border tw-border-orange-200 tw-rounded-lg tw-p-4 tw-mb-6">
          <h4 className="tw-font-semibold tw-text-orange-900 tw-mb-2 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-copy"></i>
            Duplicate Entries ({validationResult.duplicates.length})
          </h4>
          <div className="tw-text-sm tw-text-orange-800">
            <p>The following entries already exist in the database:</p>
            <ul className="tw-list-disc tw-list-inside tw-mt-2 tw-space-y-1">
              {validationResult.duplicates.slice(0, 5).map((dup, idx) => (
                <li key={idx}>
                  Row {dup.rowNumber}: {dup.tankName} on {new Date(dup.date).toLocaleDateString()}
                  {dup.action && ` - ${dup.action}`}
                </li>
              ))}
              {validationResult.duplicates.length > 5 && (
                <li className="tw-text-orange-600">... and {validationResult.duplicates.length - 5} more</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Anomalies List */}
      {anomalies.length > 0 && (
        <div className="tw-mt-6">
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
            <h4 className="tw-font-semibold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-list-ul"></i>
              Detected Anomalies ({anomalies.length})
            </h4>
            <div className="tw-flex tw-gap-2">
              <Button
                text={showAnomalies ? "Hide Details" : "Show Details"}
                icon={showAnomalies ? "fa-light fa-chevron-up" : "fa-light fa-chevron-down"}
                type="normal"
                stylingMode="text"
                onClick={() => setShowAnomalies(!showAnomalies)}
              />
              <Button
                text="Download Report"
                icon="fa-light fa-download"
                type="default"
                stylingMode="outlined"
                onClick={downloadReport}
              />
            </div>
          </div>

          {showAnomalies && (
            <DataGrid
              dataSource={anomalies}
              showBorders={true}
              showRowLines={true}
              showColumnLines={false}
              rowAlternationEnabled={true}
              hoverStateEnabled={true}
              columnAutoWidth={true}
              wordWrapEnabled={true}
              height={500}
            >
              <Scrolling mode="virtual" />
              <Paging enabled={false} />
              <HeaderFilter visible={true} />
              <FilterRow visible={true} />
              <Grouping autoExpandAll={false} />
              <GroupPanel visible={true} />
              <Export enabled={true} />

              <Column
                dataField="severity"
                caption="Severity"
                width={120}
                groupIndex={0}
                cellRender={renderSeverityCell}
              />

              <Column
                dataField="type"
                caption="Type"
                width={180}
                cellRender={renderTypeCell}
              />

              <Column
                dataField="tankName"
                caption="Tank"
                width={100}
              />

              <Column
                dataField="date"
                caption="Date"
                dataType="date"
                width={120}
                format="MMM dd, yyyy"
              />

              <Column
                dataField="rowNumber"
                caption="Row #"
                width={80}
                alignment="center"
              />

              <Column
                caption="Message & Details"
                cellRender={renderMessageCell}
                minWidth={300}
              />

              <Column
                dataField="expectedValue"
                caption="Expected"
                width={100}
                alignment="right"
                dataType="number"
                format="#,##0"
                calculateCellValue={(rowData) => rowData.expectedValue ?? null}
                customizeText={(cellInfo) => cellInfo.value != null ? cellInfo.valueText : '-'}
              />

              <Column
                dataField="actualValue"
                caption="Actual"
                width={100}
                alignment="right"
                dataType="number"
                format="#,##0"
                calculateCellValue={(rowData) => rowData.actualValue ?? null}
                customizeText={(cellInfo) => cellInfo.value != null ? cellInfo.valueText : '-'}
              />

              <Column
                dataField="variance"
                caption="Variance"
                width={100}
                alignment="right"
                dataType="number"
                format="#,##0"
                calculateCellValue={(rowData) => rowData.variance ?? null}
                customizeText={(cellInfo) => cellInfo.value != null ? cellInfo.valueText : '-'}
              />

              <Summary>
                <GroupItem
                  column="type"
                  summaryType="count"
                  displayFormat="{0} anomalies"
                />
              </Summary>
            </DataGrid>
          )}
        </div>
      )}
    </div>
  );
};

export default ValidationReportPanel;
