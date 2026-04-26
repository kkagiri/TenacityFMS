/**
 * File: transactionExportUtils.js
 * Purpose: Utility functions for exporting transaction data to Excel with proper formatting
 * Last Modified: 2025-11-24
 */

import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';

/**
 * Format date to local time (UTC+3)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateToLocal = (date) => {
  if (!date) return '';

  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';

  // Convert to local time string (will use browser's timezone, which should be UTC+3)
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

/**
 * Format date for display (date only)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
export const formatDateOnly = (date) => {
  if (!date) return '';

  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Export transaction data to Excel with custom header
 * @param {Object} params - Export parameters
 * @param {Object} params.dataGridInstance - DevExtreme DataGrid instance
 * @param {Date} params.startDate - Filter start date
 * @param {Date} params.endDate - Filter end date
 * @param {string} params.userName - Current user's name
 * @param {Array} params.volumeChangeReasonEnum - Enum for transaction types
 */
export const exportTransactionsToExcel = async ({
  dataGridInstance,
  startDate,
  endDate,
  userName,
  volumeChangeReasonEnum
}) => {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('Transaction History');

  // Configure worksheet
  worksheet.properties.defaultRowHeight = 20;

  // Add title row
  worksheet.mergeCells('A1:K1');
  const titleRow = worksheet.getCell('A1');
  titleRow.value = 'TENACY FUEL TRANSACTION LEDGER';
  titleRow.font = {
    name: 'Calibri',
    size: 16,
    bold: true,
    color: { argb: 'FF1F4788' }
  };
  titleRow.alignment = {
    vertical: 'middle',
    horizontal: 'center'
  };
  worksheet.getRow(1).height = 30;

  // Add report date range
  const startDateFormatted = formatDateOnly(startDate);
  const endDateFormatted = formatDateOnly(endDate);
  worksheet.mergeCells('A2:K2');
  const dateRow = worksheet.getCell('A2');
  dateRow.value = `Report Date: ${startDateFormatted} - ${endDateFormatted}`;
  dateRow.font = {
    name: 'Calibri',
    size: 12,
    bold: true
  };
  dateRow.alignment = {
    vertical: 'middle',
    horizontal: 'center'
  };
  worksheet.getRow(2).height = 25;

  // Add created by info
  worksheet.mergeCells('A3:K3');
  const createdByRow = worksheet.getCell('A3');
  createdByRow.value = `Created by: ${userName}`;
  createdByRow.font = {
    name: 'Calibri',
    size: 11
  };
  createdByRow.alignment = {
    vertical: 'middle',
    horizontal: 'center'
  };
  worksheet.getRow(3).height = 20;

  // Add created date (current date/time)
  worksheet.mergeCells('A4:K4');
  const createdDateRow = worksheet.getCell('A4');
  const now = new Date();
  createdDateRow.value = `Created Date: ${formatDateToLocal(now)}`;
  createdDateRow.font = {
    name: 'Calibri',
    size: 9,
    italic: true,
    color: { argb: 'FF666666' }
  };
  createdDateRow.alignment = {
    vertical: 'middle',
    horizontal: 'center'
  };
  worksheet.getRow(4).height = 18;

  // Add spacing row
  worksheet.getRow(5).height = 10;

  // Export data grid starting from row 6
  await exportDataGrid({
    component: dataGridInstance,
    worksheet: worksheet,
    topLeftCell: { row: 6, column: 1 },
    autoFilterEnabled: true,
    customizeCell: ({ gridCell, excelCell }) => {
      // Format transaction type (change reason)
      if (gridCell.column.dataField === 'changeReason') {
        const reason = volumeChangeReasonEnum.find(r => r.id === gridCell.value);
        if (reason) {
          excelCell.value = reason.name;
        }
      }

      // Format timestamp to local time
      if (gridCell.column.dataField === 'timestamp') {
        if (gridCell.value) {
          excelCell.value = formatDateToLocal(gridCell.value);
        }
      }

      // Style header row
      if (gridCell.rowType === 'header') {
        excelCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        excelCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' }
        };
        excelCell.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        };
      }

      // Style data cells
      if (gridCell.rowType === 'data') {
        excelCell.alignment = {
          vertical: 'middle',
          horizontal: gridCell.column.dataType === 'number' ? 'right' : 'left'
        };

        // Add borders
        excelCell.border = {
          top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
        };

        // Highlight negative volume changes (dispensing)
        if (gridCell.column.dataField === 'volumeChange' && gridCell.value < 0) {
          excelCell.font = { color: { argb: 'FFDC3545' }, bold: true };
        }

        // Highlight positive volume changes (refills)
        if (gridCell.column.dataField === 'volumeChange' && gridCell.value > 0) {
          excelCell.font = { color: { argb: 'FF28A745' }, bold: true };
        }
      }

      // Style group rows
      if (gridCell.rowType === 'group') {
        excelCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F0F0' }
        };
        excelCell.font = { bold: true };
      }

      // Style total rows
      if (gridCell.rowType === 'totalFooter' || gridCell.rowType === 'groupFooter') {
        excelCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFE699' }
        };
        excelCell.font = { bold: true };
      }
    }
  });

  // Auto-fit columns (starting from row 6 where data begins)
  worksheet.columns.forEach((column) => {
    let maxLength = 10;
    column.eachCell({ includeEmpty: false }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(maxLength + 2, 50); // Max width of 50
  });

  // Generate filename with date range
  const filename = `Tenacy_Fuel_Transaction_Ledger_${startDateFormatted}_to_${endDateFormatted}.xlsx`;

  // Save file
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: 'application/octet-stream' }), filename);
};
