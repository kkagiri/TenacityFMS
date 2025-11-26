/**
 * File: transactionAnalysisExportUtils.js
 * Purpose: AI Agent Style Report Generator for Fuel Transactions
 * Generates comprehensive Excel report with site-specific analysis
 * Last Modified: 2025-11-25
 */

import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';

// Color palette matching AI agent specification
const COLORS = {
  HEADER_BG: '366092',      // Dark Blue
  HEADER_FONT: 'FFFFFF',    // White
  SUBHEADER_BG: 'B7DEE8',   // Light Blue
  TOTAL_BG: 'FFC000',       // Orange
  OPENING_CLOSING: 'FFFF00', // Yellow
  DELIVERY: 'C6EFCE',       // Light Green
  DISPENSING: 'FFC7CE',     // Light Pink
  DAILY_TOTAL: 'D9E1F2',    // Pale Blue
  VARIANCE_NEG: 'FF0000',   // Red
  VARIANCE_POS: '008000'    // Green
};

/**
 * Get transaction type enum name
 */
const getTransactionTypeName = (changeReason, volumeChangeReasonEnum) => {
  const reason = volumeChangeReasonEnum.find(r => r.id === changeReason);
  return reason ? reason.name : 'Unknown';
};

/**
 * Group transactions by site
 */
const groupBySite = (transactions) => {
  const grouped = {};

  transactions.forEach(tx => {
    const site = tx.site || 'Unknown Site';
    if (!grouped[site]) {
      grouped[site] = [];
    }
    grouped[site].push(tx);
  });

  return grouped;
};

/**
 * Group transactions by tank within a site
 */
const groupByTank = (transactions) => {
  const grouped = {};

  transactions.forEach(tx => {
    const tankId = tx.tankId;
    if (!grouped[tankId]) {
      grouped[tankId] = [];
    }
    grouped[tankId].push(tx);
  });

  return grouped;
};

/**
 * Get transaction type sort priority
 * Enforces logical order: Opening -> Operations -> Closing
 * This fixes legacy data where timestamps may be out of order
 */
const getTransactionTypePriority = (changeReason) => {
  switch (changeReason) {
    case 0: return 0;  // OpeningStock - Always first
    case 2: return 1;  // Delivery
    case 3: return 2;  // TransferIn
    case 4: return 3;  // TransferOut
    case 5: return 4;  // Adjustment
    case 6: return 5;  // Dispensing
    case 7: return 6;  // AutomatedDispensing
    case 8: return 7;  // Reconciliation
    case 9: return 8;  // AutomatedReconciliation
    case 1: return 99; // ClosingStock - Always last
    default: return 50; // Unknown - middle
  }
};

/**
 * Sort transactions in logical order per day per tank
 * Order: Date ASC -> Tank -> OpeningStock -> Operations (by timestamp) -> ClosingStock
 * This ensures proper presentation even when legacy data has wrong timestamps
 * and groups each tank's transactions together within a day
 */
const sortTransactionsLogically = (transactions) => {
  return [...transactions].sort((a, b) => {
    // 1. First, sort by date (day only)
    const dateA = new Date(a.timestamp).toISOString().split('T')[0];
    const dateB = new Date(b.timestamp).toISOString().split('T')[0];

    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    // 2. Same day - sort by tank ID to group all tank transactions together
    if (a.tankId !== b.tankId) {
      return a.tankId - b.tankId;
    }

    // 3. Same tank - sort by transaction type priority
    const priorityA = getTransactionTypePriority(a.changeReason);
    const priorityB = getTransactionTypePriority(b.changeReason);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // 4. Same type - sort by timestamp
    return new Date(a.timestamp) - new Date(b.timestamp);
  });
};

/**
 * Calculate site summary by tank
 */
const calculateTankSummary = (tankTransactions) => {
  // Sort by timestamp to get first and last transactions
  const sorted = [...tankTransactions].sort((a, b) =>
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  // Find opening stock (first OpeningStock transaction)
  const openingStock = sorted.find(tx => tx.changeReason === 0); // OpeningStock = 0
  const opening = openingStock ? openingStock.newVolume : 0;

  // Find closing stock (last ClosingStock transaction)
  const closingStock = [...sorted].reverse().find(tx => tx.changeReason === 1); // ClosingStock = 1
  const actualClosing = closingStock ? closingStock.newVolume : 0;

  // Calculate totals by transaction type
  const deliveries = sorted
    .filter(tx => tx.changeReason === 2) // Delivery = 2
    .reduce((sum, tx) => sum + (tx.volumeChange || 0), 0);

  const transfersIn = sorted
    .filter(tx => tx.changeReason === 3) // TransferIn = 3
    .reduce((sum, tx) => sum + (tx.volumeChange || 0), 0);

  const transfersOut = sorted
    .filter(tx => tx.changeReason === 4) // TransferOut = 4
    .reduce((sum, tx) => sum + (tx.volumeChange || 0), 0);

  const dispensed = sorted
    .filter(tx => tx.changeReason === 6 || tx.changeReason === 7) // Dispensing = 6, AutomatedDispensing = 7
    .reduce((sum, tx) => sum + (tx.volumeChange || 0), 0);

  // Calculate expected closing
  const expectedClosing = opening + deliveries + transfersIn + transfersOut + dispensed;

  // Calculate variance
  const variance = actualClosing - expectedClosing;

  return {
    opening,
    deliveries,
    transfersIn,
    transfersOut,
    dispensed,
    expectedClosing,
    actualClosing,
    variance
  };
};

/**
 * Apply header styling
 */
const applyHeaderStyle = (cell) => {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.HEADER_BG }
  };
  cell.font = {
    color: { argb: COLORS.HEADER_FONT },
    bold: true,
    size: 11
  };
  cell.alignment = {
    horizontal: 'center',
    vertical: 'middle',
    wrapText: true
  };
  cell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };
};

/**
 * Apply cell highlighting based on transaction type
 */
const applyCellHighlight = (row, transactionType) => {
  const typeCell = row.getCell(4); // Transaction Type column

  switch (transactionType) {
    case 'OpeningStock':
    case 'ClosingStock':
      typeCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.OPENING_CLOSING }
      };
      row.getCell(8).fill = { // New Volume column
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.OPENING_CLOSING }
      };
      break;
    case 'Delivery':
      typeCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.DELIVERY }
      };
      break;
    case 'Dispensing':
    case 'AutomatedDispensing':
      typeCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.DISPENSING }
      };
      break;
    default:
      // No special highlighting for other transaction types
      break;
  }
};

/**
 * Create site summary section
 */
const createSiteSummary = (worksheet, siteTransactions, tanks) => {
  let currentRow = 5;

  // Title
  const titleRow = worksheet.getRow(currentRow);
  titleRow.getCell(1).value = 'SITE SUMMARY BY TANK';
  titleRow.getCell(1).font = { bold: true, size: 12, color: { argb: COLORS.HEADER_BG } };
  currentRow += 2;

  // Header row
  const headerRow = worksheet.getRow(currentRow);
  const headers = [
    'Tank',
    'Opening Stock (L)',
    'Deliveries (L)',
    'Transfers In (L)',
    'Transfers Out (L)',
    'Dispensed (L)',
    'Expected Closing (L)',
    'Actual Closing (L)',
    'Variance (L)'
  ];

  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    applyHeaderStyle(cell);
  });

  currentRow++;

  // Group by tank and calculate summaries
  const tankGroups = groupByTank(siteTransactions);

  Object.entries(tankGroups).forEach(([tankId, tankTxs]) => {
    const tank = tanks.find(t => t.id === parseInt(tankId));
    const tankName = tank ? tank.name : `Tank ${tankId}`;

    const summary = calculateTankSummary(tankTxs);

    const dataRow = worksheet.getRow(currentRow);
    dataRow.getCell(1).value = tankName;
    dataRow.getCell(2).value = summary.opening;
    dataRow.getCell(3).value = summary.deliveries;
    dataRow.getCell(4).value = summary.transfersIn;
    dataRow.getCell(5).value = summary.transfersOut;
    dataRow.getCell(6).value = summary.dispensed;
    dataRow.getCell(7).value = summary.expectedClosing;
    dataRow.getCell(8).value = summary.actualClosing;
    dataRow.getCell(9).value = summary.variance;

    // Format numbers
    for (let i = 2; i <= 9; i++) {
      dataRow.getCell(i).numFmt = '#,##0.00';
      dataRow.getCell(i).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }

    // Add border to tank name
    dataRow.getCell(1).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    // Format variance cell
    const varianceCell = dataRow.getCell(9);
    if (summary.variance < 0) {
      varianceCell.font = { color: { argb: COLORS.VARIANCE_NEG }, bold: true };
    } else if (summary.variance > 0) {
      varianceCell.font = { color: { argb: COLORS.VARIANCE_POS } };
    }

    currentRow++;
  });

  return currentRow + 2; // Return next available row with spacing
};

/**
 * Create detailed transaction log
 */
const createTransactionLog = (worksheet, siteTransactions, tanks, volumeChangeReasonEnum, startRow) => {
  let currentRow = startRow;

  // Title
  const titleRow = worksheet.getRow(currentRow);
  titleRow.getCell(1).value = 'DETAILED TRANSACTION LOG';
  titleRow.getCell(1).font = { bold: true, size: 12, color: { argb: COLORS.HEADER_BG } };
  currentRow += 2;

  // Header row
  const headerRow = worksheet.getRow(currentRow);
  const headers = [
    'Date',
    'Time',
    'Tank',
    'Transaction Type',
    'Vehicle',
    'Vehicle Type',
    'Volume Change (L)',
    'New Volume (L)'
  ];

  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    applyHeaderStyle(cell);
  });

  currentRow++;

  // Sort transactions logically: Date -> Opening -> Operations -> Closing
  // This fixes legacy data where timestamps may be out of order
  const sorted = sortTransactionsLogically(siteTransactions);

  // Group by date (after logical sorting is applied)
  const byDate = {};
  sorted.forEach(tx => {
    const date = new Date(tx.timestamp);
    const dateKey = date.toLocaleDateString();
    if (!byDate[dateKey]) {
      byDate[dateKey] = [];
    }
    byDate[dateKey].push(tx);
  });

  // Process each date
  Object.entries(byDate).forEach(([dateKey, dateTxs]) => {
    let dailyDispensing = 0;
    let lastTankId = null; // Track tank changes for spacing

    dateTxs.forEach((tx, index) => {
      const date = new Date(tx.timestamp);
      const tank = tanks.find(t => t.id === tx.tankId);
      const tankName = tank ? tank.name : `Tank ${tx.tankId}`;
      const transactionType = getTransactionTypeName(tx.changeReason, volumeChangeReasonEnum);

      // Add blank row between different tanks (after ClosingStock, before next tank's OpeningStock)
      if (lastTankId !== null && tx.tankId !== lastTankId) {
        currentRow++; // Add spacing row between tanks
      }
      lastTankId = tx.tankId;

      const dataRow = worksheet.getRow(currentRow);
      dataRow.getCell(1).value = date.toLocaleDateString();
      dataRow.getCell(2).value = date.toLocaleTimeString();
      dataRow.getCell(3).value = tankName;
      dataRow.getCell(4).value = transactionType;
      dataRow.getCell(5).value = tx.vehicleName || '';
      dataRow.getCell(6).value = tx.vehicleType || '';
      dataRow.getCell(7).value = tx.volumeChange || 0;
      dataRow.getCell(8).value = tx.newVolume || 0;

      // Format numbers
      dataRow.getCell(7).numFmt = '#,##0.00';
      dataRow.getCell(8).numFmt = '#,##0.00';

      // Apply borders
      for (let i = 1; i <= 8; i++) {
        dataRow.getCell(i).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }

      // Apply highlighting
      applyCellHighlight(dataRow, transactionType);

      // Track daily dispensing
      if (tx.changeReason === 6 || tx.changeReason === 7) { // Dispensing or AutomatedDispensing
        dailyDispensing += Math.abs(tx.volumeChange || 0);
      }

      currentRow++;
    });

    // Add daily total if there was dispensing
    if (dailyDispensing > 0) {
      const totalRow = worksheet.getRow(currentRow);
      totalRow.getCell(4).value = 'DAILY TOTAL DISPENSED';
      totalRow.getCell(7).value = -dailyDispensing; // Show as negative

      totalRow.getCell(4).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.DAILY_TOTAL }
      };
      totalRow.getCell(7).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.DAILY_TOTAL }
      };

      totalRow.getCell(4).font = { bold: true, size: 10, color: { argb: '1F4E78' } };
      totalRow.getCell(7).font = { bold: true, size: 10, color: { argb: '1F4E78' } };
      totalRow.getCell(7).numFmt = '#,##0.00';

      currentRow++;
    }

    // Empty row between dates
    currentRow++;
  });

  return currentRow;
};

/**
 * Main export function - AI Agent Style Report
 */
export const exportAnalysisReport = async ({
  transactions,
  tanks,
  sites,
  startDate,
  endDate,
  volumeChangeReasonEnum,
  userName
}) => {
  try {
    const workbook = new Workbook();

    // Set workbook properties
    workbook.creator = userName || 'FMS System';
    workbook.lastModifiedBy = userName || 'FMS System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Group transactions by site
    const siteGroups = groupBySite(transactions);

    // Create a sheet for each site
    Object.entries(siteGroups).forEach(([siteName, siteTransactions]) => {
      const worksheet = workbook.addWorksheet(siteName);

      // Set column widths
      worksheet.columns = [
        { width: 12 },  // Date
        { width: 10 },  // Time
        { width: 10 },  // Tank
        { width: 22 },  // Transaction Type
        { width: 12 },  // Vehicle
        { width: 14 },  // Vehicle Type
        { width: 16 },  // Volume Change
        { width: 16 }   // New Volume
      ];

      // Row 1: Site header
      const headerRow = worksheet.getRow(1);
      headerRow.getCell(1).value = `${siteName.toUpperCase()} - FUEL TRANSACTION REPORT`;
      headerRow.getCell(1).font = { bold: true, size: 14, color: { argb: COLORS.HEADER_BG } };
      headerRow.height = 25;

      // Row 2: Period
      const periodRow = worksheet.getRow(2);
      periodRow.getCell(1).value = `Period: ${startDate ? startDate.toLocaleDateString() : 'N/A'} to ${endDate ? endDate.toLocaleDateString() : 'N/A'}`;
      periodRow.getCell(1).font = { size: 11 };
      periodRow.height = 20;

      // Row 3: Generated timestamp
      const timestampRow = worksheet.getRow(3);
      timestampRow.getCell(1).value = `Report Generated: ${new Date().toLocaleString()}`;
      timestampRow.getCell(1).font = { size: 10, italic: true };
      timestampRow.height = 18;

      // Create site summary
      const logStartRow = createSiteSummary(worksheet, siteTransactions, tanks);

      // Create detailed transaction log
      createTransactionLog(worksheet, siteTransactions, tanks, volumeChangeReasonEnum, logStartRow);
    });

    // Generate filename
    const startDateStr = startDate ? startDate.toISOString().split('T')[0] : 'Unknown';
    const endDateStr = endDate ? endDate.toISOString().split('T')[0] : 'Unknown';
    const filename = `Fuel_Transaction_Analysis_${startDateStr}_to_${endDateStr}.xlsx`;

    // Write to buffer and save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    saveAs(blob, filename);

    return { success: true, filename };
  } catch (error) {
    console.error('Error generating analysis report:', error);
    throw error;
  }
};
