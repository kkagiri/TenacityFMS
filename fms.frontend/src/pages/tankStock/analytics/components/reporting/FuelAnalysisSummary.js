import React, { useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'devextreme-react/button';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import './FuelAnalysisSummary.scss';

// Map change reason enum values to readable labels
// Based on VolumeChangeReasonEnum from backend
const changeReasonLabels = {
  // Enum integer values (0-based)
  0: 'Opening Stock',
  1: 'Closing Stock',
  2: 'Delivery',
  3: 'Transfer In',
  4: 'Transfer Out',
  5: 'Adjustment',
  6: 'Manual Dispensing',
  7: 'Automated Dispensing',
  8: 'Reconciliation',
  9: 'Automated Reconciliation',
  10: 'In-Tank Delivery',
  // String enum names (if sent as strings)
  'OpeningStock': 'Opening Stock',
  'ClosingStock': 'Closing Stock',
  'Delivery': 'Delivery',
  'TransferIn': 'Transfer In',
  'TransferOut': 'Transfer Out',
  'Adjustment': 'Adjustment',
  'Dispensing': 'Manual Dispensing',
  'AutomatedDispensing': 'Automated Dispensing',
  'Reconciliation': 'Reconciliation',
  'AutomatedReconciliation': 'Automated Reconciliation',
  'InTankDelivery': 'In-Tank Delivery',
  'Unknown': 'Unknown'
};

const getChangeReasonLabel = (reason) => {
  if (!reason && reason !== 0) return 'Unknown';
  // Check if we have a direct mapping
  if (changeReasonLabels[reason]) {
    return changeReasonLabels[reason];
  }
  // Fallback for unmapped values
  return typeof reason === 'string' ? reason : `Reason ${reason}`;
};

const FuelAnalysisSummary = ({ data }) => {
  // Sorting state
  const [sortField, setSortField] = useState('totalVolume');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  // Calculate average fuel summary by volume change reason
  const analysisSummary = useMemo(() => {
    if (!data?.data || !Array.isArray(data.data)) {
      return [];
    }

    // Group by changeReason and calculate averages
    const reasonGroups = {};

    data.data.forEach(item => {
      const reason = getChangeReasonLabel(item.changeReason);

      if (!reasonGroups[reason]) {
        reasonGroups[reason] = {
          reason,
          totalVolume: 0,
          count: 0,
          transactions: 0
        };
      }

      reasonGroups[reason].totalVolume += item.totalVolume || 0;
      reasonGroups[reason].count += 1;
      reasonGroups[reason].transactions += item.transactionCount || 0;
    });

    // Convert to array and calculate averages
    const summaryArray = Object.values(reasonGroups).map(group => ({
      reason: group.reason,
      totalVolume: group.totalVolume,
      averageVolume: group.count > 0 ? group.totalVolume / group.count : 0,
      count: group.count,
      transactions: group.transactions
    }));

    // Apply sorting
    summaryArray.sort((a, b) => {
      let compareValue = 0;

      if (sortField === 'reason') {
        compareValue = a.reason.localeCompare(b.reason);
      } else {
        compareValue = a[sortField] - b[sortField];
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return summaryArray;
  }, [data, sortField, sortOrder]);

  // Calculate grand totals
  const grandTotals = useMemo(() => {
    const totals = analysisSummary.reduce((acc, item) => ({
      totalVolume: acc.totalVolume + item.totalVolume,
      transactions: acc.transactions + item.transactions,
      records: acc.records + item.count
    }), { totalVolume: 0, transactions: 0, records: 0 });

    // Calculate total dispensing (changeReason 6 or 'Dispensing')
    const dispensingItem = analysisSummary.find(item =>
      item.reason === 'Dispensing' || item.reason === 'Automated Dispensing'
    );

    totals.totalDispensing = dispensingItem ? dispensingItem.totalVolume : 0;

    return totals;
  }, [analysisSummary]);

  // Handle column header click for sorting
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortOrder('desc');
    }
  }, [sortField, sortOrder]);

  // Render sort icon
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <i className="fa-light fa-sort tw-ml-1 tw-text-gray-400"></i>;
    }
    return sortOrder === 'asc'
      ? <i className="fa-light fa-sort-up tw-ml-1"></i>
      : <i className="fa-light fa-sort-down tw-ml-1"></i>;
  };

  // Export to Excel
  const handleExportToExcel = useCallback(async () => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Fuel Analysis Summary');

    // Set column widths
    worksheet.columns = [
      { width: 30 }, // Volume Change Reason
      { width: 20 }, // Total Volume
      { width: 20 }, // Average Volume
      { width: 15 }, // Records
      { width: 15 }, // Transactions
      { width: 15 }, // % of Total
    ];

    // Add title
    const titleRow = worksheet.getRow(1);
    titleRow.height = 30;
    worksheet.mergeCells(1, 1, 1, 6);
    const titleCell = titleRow.getCell(1);
    titleCell.value = 'Fuel Analysis Summary Report';
    titleCell.font = { name: 'Segoe UI Light', size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Add date info
    const dateRow = worksheet.getRow(2);
    worksheet.mergeCells(2, 1, 2, 6);
    const dateCell = dateRow.getCell(1);
    dateCell.value = `Generated on: ${new Date().toLocaleDateString()}`;
    dateCell.font = { size: 10 };
    dateCell.alignment = { horizontal: 'center' };

    // Add summary info
    const summaryRow = worksheet.getRow(3);
    worksheet.mergeCells(3, 1, 3, 6);
    const summaryCell = summaryRow.getCell(1);
    summaryCell.value = `Total Dispensing: ${grandTotals.totalDispensing.toLocaleString()} | Total Transactions: ${grandTotals.transactions.toLocaleString()} | Total Records: ${grandTotals.records.toLocaleString()}`;
    summaryCell.font = { size: 10, bold: true };
    summaryCell.alignment = { horizontal: 'center' };

    // Empty row
    worksheet.getRow(4);

    // Add headers
    const headerRow = worksheet.addRow([
      'Volume Change Reason',
      'Total Volume',
      'Average Volume',
      'Records',
      'Transactions',
      '% of Total'
    ]);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add data rows
    analysisSummary.forEach((item) => {
      const row = worksheet.addRow([
        item.reason,
        item.totalVolume,
        item.averageVolume,
        item.count,
        item.transactions,
        grandTotals.totalVolume > 0 ? ((item.totalVolume / grandTotals.totalVolume) * 100).toFixed(1) : 0
      ]);

      // Format numbers
      row.getCell(2).numFmt = '#,##0';
      row.getCell(3).numFmt = '#,##0.00';
      row.getCell(4).numFmt = '#,##0';
      row.getCell(5).numFmt = '#,##0';
      row.getCell(6).numFmt = '0.0"%"';

      // Add borders
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Generate and save file
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: 'application/octet-stream' }),
      `fuel-analysis-summary-${new Date().toISOString().split('T')[0]}.xlsx`
    );
  }, [analysisSummary, grandTotals]);

  return (
    <div className="fuel-analysis-summary tw-bg-white tw-rounded-lg tw-shadow tw-p-4 tw-mb-6">
      {/* Header */}
      <div className="tw-flex tw-flex-col md:tw-flex-row tw-justify-between tw-items-start md:tw-items-center tw-mb-4 tw-gap-3">
        <div>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
            <i className="fa-light fa-chart-bar tw-mr-2 tw-text-blue-600"></i>
            Fuel Analysis Summary
          </h3>
          <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
            Average fuel summary by volume change reason
          </p>
        </div>

        <Button
          icon="fa-light fa-file-excel"
          text="Export to Excel"
          type="default"
          stylingMode="contained"
          onClick={handleExportToExcel}
          disabled={analysisSummary.length === 0}
          hint="Export fuel analysis summary to Excel"
        />
      </div>

      {/* Grand Totals Summary */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4 tw-mb-4">
        <div className="tw-bg-blue-50 tw-rounded-lg tw-p-4 tw-border tw-border-blue-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-blue-600 tw-font-medium">Total Dispensing</p>
              <p className="tw-text-2xl tw-font-bold tw-text-blue-900">
                {grandTotals.totalDispensing.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}
              </p>
            </div>
            <i className="fa-light fa-gas-pump tw-text-3xl tw-text-blue-400"></i>
          </div>
        </div>

        <div className="tw-bg-green-50 tw-rounded-lg tw-p-4 tw-border tw-border-green-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-green-600 tw-font-medium">Total Transactions</p>
              <p className="tw-text-2xl tw-font-bold tw-text-green-900">
                {grandTotals.transactions.toLocaleString()}
              </p>
            </div>
            <i className="fa-light fa-receipt tw-text-3xl tw-text-green-400"></i>
          </div>
        </div>

        <div className="tw-bg-purple-50 tw-rounded-lg tw-p-4 tw-border tw-border-purple-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-purple-600 tw-font-medium">Total Records</p>
              <p className="tw-text-2xl tw-font-bold tw-text-purple-900">
                {grandTotals.records.toLocaleString()}
              </p>
            </div>
            <i className="fa-light fa-database tw-text-3xl tw-text-purple-400"></i>
          </div>
        </div>
      </div>

      {/* Analysis Table */}
      <div className="tw-overflow-x-auto">
        <table className="tw-w-full tw-text-sm">
          <thead className="tw-bg-gray-100 tw-border-b tw-border-gray-200">
            <tr>
              <th
                className="tw-text-left tw-p-3 tw-font-semibold tw-text-gray-700 tw-cursor-pointer hover:tw-bg-gray-200"
                onClick={() => handleSort('reason')}
              >
                Volume Change Reason {renderSortIcon('reason')}
              </th>
              <th
                className="tw-text-right tw-p-3 tw-font-semibold tw-text-gray-700 tw-cursor-pointer hover:tw-bg-gray-200"
                onClick={() => handleSort('totalVolume')}
              >
                Total Volume {renderSortIcon('totalVolume')}
              </th>
              <th
                className="tw-text-right tw-p-3 tw-font-semibold tw-text-gray-700 tw-cursor-pointer hover:tw-bg-gray-200"
                onClick={() => handleSort('averageVolume')}
              >
                Average Volume {renderSortIcon('averageVolume')}
              </th>
              <th
                className="tw-text-right tw-p-3 tw-font-semibold tw-text-gray-700 tw-cursor-pointer hover:tw-bg-gray-200"
                onClick={() => handleSort('count')}
              >
                Records {renderSortIcon('count')}
              </th>
              <th
                className="tw-text-right tw-p-3 tw-font-semibold tw-text-gray-700 tw-cursor-pointer hover:tw-bg-gray-200"
                onClick={() => handleSort('transactions')}
              >
                Transactions {renderSortIcon('transactions')}
              </th>
              <th className="tw-text-right tw-p-3 tw-font-semibold tw-text-gray-700">
                % of Total
              </th>
            </tr>
          </thead>
          <tbody>
            {analysisSummary.length > 0 ? (
              analysisSummary.map((item, index) => (
                <tr
                  key={item.reason}
                  className={`tw-border-b tw-border-gray-100 hover:tw-bg-gray-50 ${
                    index % 2 === 0 ? 'tw-bg-white' : 'tw-bg-gray-50'
                  }`}
                >
                  <td className="tw-p-3 tw-font-medium tw-text-gray-800">
                    {item.reason}
                  </td>
                  <td className="tw-p-3 tw-text-right tw-text-gray-700">
                    {item.totalVolume.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </td>
                  <td className="tw-p-3 tw-text-right tw-text-gray-700">
                    {item.averageVolume.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                  <td className="tw-p-3 tw-text-right tw-text-gray-700">
                    {item.count.toLocaleString()}
                  </td>
                  <td className="tw-p-3 tw-text-right tw-text-gray-700">
                    {item.transactions.toLocaleString()}
                  </td>
                  <td className="tw-p-3 tw-text-right tw-text-gray-700">
                    <span className="tw-inline-flex tw-items-center tw-px-2 tw-py-1 tw-rounded tw-bg-blue-100 tw-text-blue-800 tw-font-medium">
                      {grandTotals.totalVolume > 0
                        ? ((item.totalVolume / grandTotals.totalVolume) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="tw-p-8 tw-text-center tw-text-gray-500">
                  <i className="fa-light fa-inbox tw-text-4xl tw-mb-2"></i>
                  <p>No data available for analysis</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

FuelAnalysisSummary.propTypes = {
  data: PropTypes.object
};

export default FuelAnalysisSummary;
