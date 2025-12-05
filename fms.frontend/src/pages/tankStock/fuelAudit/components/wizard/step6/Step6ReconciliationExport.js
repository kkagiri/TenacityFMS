/**
 * Step6ReconciliationExport.js
 * Excel Export functionality for Fuel Reconciliation Report
 *
 * Generates a multi-sheet Excel workbook with:
 * - Sheet 1: Reconciliation Summary (matching the on-screen format)
 * - Sheet 2: Vehicle Details (tabular format)
 * - Sheet 3: Tank Details (tabular format)
 */

import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';

// Category configuration (shared with main component)
export const CATEGORY_CONFIG = {
  1: { name: 'Site GPS Fleet', icon: 'fa-satellite-dish', color: 'tw-text-blue-600', bgColor: 'tw-bg-blue-50', hasGpsData: true },
  2: { name: 'Full Tank Policy', icon: 'fa-gas-pump', color: 'tw-text-yellow-600', bgColor: 'tw-bg-yellow-50', hasGpsData: false },
  3: { name: 'Site Equipment', icon: 'fa-tractor', color: 'tw-text-green-600', bgColor: 'tw-bg-green-50', hasGpsData: false },
  4: { name: 'Cross-Site Company', icon: 'fa-route', color: 'tw-text-purple-600', bgColor: 'tw-bg-purple-50', hasGpsData: true },
  5: { name: 'External Non-Company', icon: 'fa-building', color: 'tw-text-gray-600', bgColor: 'tw-bg-gray-50', hasGpsData: false }
};

/**
 * Format number with commas for display
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number string
 */
export const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

/**
 * Export reconciliation report to Excel
 * @param {Object} params - Export parameters
 * @param {Object} params.wizard - Wizard state from Redux
 * @param {Array} params.selectedVehicles - Array of selected vehicle objects
 * @param {Object} params.reconciliation - Calculated reconciliation data
 * @param {Object} params.tankData - Tank data object
 */
export const exportReconciliationToExcel = async ({ wizard, selectedVehicles, reconciliation, tankData }) => {
  const workbook = new Workbook();

  // Period dates for filename and header
  const periodStart = wizard.periodStart ? new Date(wizard.periodStart).toLocaleDateString() : 'N/A';
  const periodEnd = wizard.periodEnd ? new Date(wizard.periodEnd).toLocaleDateString() : 'N/A';

  // ========== Sheet 1: Reconciliation Summary ==========
  addReconciliationSummarySheet(workbook, {
    periodStart,
    periodEnd,
    selectedVehicles,
    reconciliation,
    tankData
  });

  // ========== Sheet 2: Vehicle Details ==========
  addVehicleDetailsSheet(workbook, selectedVehicles);

  // ========== Sheet 3: Tank Details ==========
  addTankDetailsSheet(workbook, tankData);

  // Save the workbook
  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `FuelReconciliation_${periodStart.replace(/\//g, '-')}_${periodEnd.replace(/\//g, '-')}.xlsx`;
  saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);
};

/**
 * Add Reconciliation Summary sheet to workbook
 */
const addReconciliationSummarySheet = (workbook, { periodStart, periodEnd, selectedVehicles, reconciliation, tankData }) => {
  const summarySheet = workbook.addWorksheet('Reconciliation Summary');

  // Set column widths
  summarySheet.columns = [
    { width: 40 },
    { width: 20 },
    { width: 15 }
  ];

  // Title
  summarySheet.addRow(['FUEL RECONCILIATION REPORT']);
  summarySheet.mergeCells('A1:C1');
  summarySheet.getCell('A1').font = { bold: true, size: 16 };
  summarySheet.getCell('A1').alignment = { horizontal: 'center' };

  // Period info
  summarySheet.addRow([`Audit Period: ${periodStart} - ${periodEnd}`]);
  summarySheet.mergeCells('A2:C2');
  summarySheet.addRow([`Generated: ${new Date().toLocaleString()}`]);
  summarySheet.addRow([]);

  // ========== OPENING STOCK SECTION ==========
  addSectionHeader(summarySheet, 'OPENING STOCK (Start of Audit Period)', 'FFE3F2FD');

  // Vehicle dead stock
  summarySheet.addRow(['Fleet Dead Stock:', '', '']);
  selectedVehicles.forEach(v => {
    summarySheet.addRow([`  ${v.vehicleNo || v.vehicleName || 'Unknown'} Dead Stock:`, `${formatNumber(v.openingFuel || 0)} L`, '']);
  });
  addDividerRow(summarySheet);
  addBoldRow(summarySheet, '  Total Fleet Dead Stock:', `${formatNumber(reconciliation.totalVehicleOpening)} L`);

  // Tank stock
  summarySheet.addRow([]);
  summarySheet.addRow(['FT and ST Stock:', `${formatNumber(reconciliation.tankOpening)} L`, '']);
  if (tankData.tanks.length > 0) {
    tankData.tanks.forEach(t => {
      summarySheet.addRow([`  ${t.tankName}:`, `${formatNumber(t.openingVolume || t.openingStock || 0)} L`, '']);
    });
  }

  addDoubleDividerRow(summarySheet);
  const totalOpeningRow = summarySheet.addRow(['TOTAL OPENING:', `${formatNumber(reconciliation.totalOpening)} L`, '']);
  totalOpeningRow.font = { bold: true, size: 12 };
  totalOpeningRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90CAF9' } };

  // ========== MOVEMENTS SECTION ==========
  summarySheet.addRow([]);
  addSectionHeader(summarySheet, 'MOVEMENTS DURING PERIOD', 'FFE8F5E9');

  const deliveriesRow = summarySheet.addRow(['Deliveries to Tanker (external fuel in):', `+${formatNumber(reconciliation.totalDeliveries)} L`, '']);
  deliveriesRow.getCell(2).font = { color: { argb: 'FF2E7D32' } };

  summarySheet.addRow([]);
  const consumptionHeaderRow = summarySheet.addRow(['Fleet Consumption (GPS confirmed):', `-${formatNumber(reconciliation.totalConsumption)} L`, '']);
  consumptionHeaderRow.getCell(2).font = { color: { argb: 'FFC62828' } };

  // Per vehicle consumption
  selectedVehicles.forEach(v => {
    const consumption = v.gpsMeasuredConsumption || v.consumption || v.totalFuelAmount || 0;
    if (consumption > 0) {
      const sourceLabel = (v.vehicleCategory === 1 || v.vehicleCategory === 4) ? '(GPS)' : '(Issued)';
      summarySheet.addRow([`  ${v.vehicleNo || v.vehicleName || 'Unknown'} ${sourceLabel}:`, `-${formatNumber(consumption)} L`, '']);
    }
  });

  // ========== CLOSING STOCK SECTION ==========
  summarySheet.addRow([]);
  addSectionHeader(summarySheet, 'CLOSING STOCK (End of Audit Period)', 'FFF3E5F5');

  // Vehicle dead stock
  summarySheet.addRow(['Fleet Dead Stock:', '', '']);
  selectedVehicles.forEach(v => {
    summarySheet.addRow([`  ${v.vehicleNo || v.vehicleName || 'Unknown'} Dead Stock:`, `${formatNumber(v.closingFuel || 0)} L`, '']);
  });
  addDividerRow(summarySheet);
  addBoldRow(summarySheet, '  Total Fleet Dead Stock:', `${formatNumber(reconciliation.totalVehicleClosing)} L`);

  // Tank stock
  summarySheet.addRow([]);
  summarySheet.addRow(['Tankers Stock:', `${formatNumber(reconciliation.tankClosing)} L`, '']);
  if (tankData.tanks.length > 0) {
    tankData.tanks.forEach(t => {
      summarySheet.addRow([`  ${t.tankName}:`, `${formatNumber(t.closingVolume || t.closingStock || 0)} L`, '']);
    });
  }

  addDoubleDividerRow(summarySheet);
  const totalClosingRow = summarySheet.addRow(['TOTAL CLOSING:', `${formatNumber(reconciliation.totalClosing)} L`, '']);
  totalClosingRow.font = { bold: true, size: 12 };
  totalClosingRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCE93D8' } };

  // ========== THE RECONCILIATION SECTION ==========
  summarySheet.addRow([]);
  addSectionHeader(summarySheet, 'THE RECONCILIATION', 'FFFAFAFA', 14);

  summarySheet.addRow(['Total Opening Stock:', `${formatNumber(reconciliation.totalOpening)} L`, '']);

  const deliveriesReconcRow = summarySheet.addRow(['+ Deliveries (external in):', `+${formatNumber(reconciliation.totalDeliveries)} L`, '']);
  deliveriesReconcRow.getCell(2).font = { color: { argb: 'FF2E7D32' } };

  const consumptionReconcRow = summarySheet.addRow(['- Consumption (GPS confirmed):', `-${formatNumber(reconciliation.totalConsumption)} L`, '']);
  consumptionReconcRow.getCell(2).font = { color: { argb: 'FFC62828' } };

  addDividerRow(summarySheet);

  const expectedClosingRow = summarySheet.addRow(['Expected Closing:', `${formatNumber(reconciliation.expectedClosing)} L`, '']);
  expectedClosingRow.font = { bold: true };

  const actualClosingRow = summarySheet.addRow(['Actual Closing (Vehicles + Tanker):', `${formatNumber(reconciliation.totalClosing)} L`, '']);
  actualClosingRow.font = { bold: true };

  addDividerRow(summarySheet);

  // Variance row
  const varianceRow = summarySheet.addRow([
    'VARIANCE:',
    `${reconciliation.variance >= 0 ? '+' : ''}${formatNumber(reconciliation.variance)} L`,
    `(${reconciliation.variancePercent >= 0 ? '+' : ''}${reconciliation.variancePercent.toFixed(2)}%)`
  ]);
  varianceRow.font = { bold: true, size: 14 };
  const varianceColor = Math.abs(reconciliation.variance) > 50 ? 'FFC62828' : 'FF2E7D32';
  varianceRow.getCell(2).font = { bold: true, size: 14, color: { argb: varianceColor } };
  varianceRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: Math.abs(reconciliation.variance) > 50 ? 'FFFFEBEE' : 'FFE8F5E9' } };
};

/**
 * Add Vehicle Details sheet to workbook
 */
const addVehicleDetailsSheet = (workbook, selectedVehicles) => {
  const vehicleSheet = workbook.addWorksheet('Vehicle Details');
  vehicleSheet.columns = [
    { header: 'Vehicle No', key: 'vehicleNo', width: 15 },
    { header: 'Type', key: 'vehicleType', width: 12 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Opening (L)', key: 'opening', width: 12 },
    { header: 'GPS Consumption (L)', key: 'gpsConsumption', width: 18 },
    { header: 'Refueled (L)', key: 'refueled', width: 12 },
    { header: 'Closing (L)', key: 'closing', width: 12 },
    { header: 'Variance (L)', key: 'variance', width: 12 },
    { header: 'Data Source', key: 'dataSource', width: 12 }
  ];

  // Style header row
  vehicleSheet.getRow(1).font = { bold: true };
  vehicleSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };

  selectedVehicles.forEach(v => {
    const catConfig = CATEGORY_CONFIG[v.vehicleCategory || 5];
    vehicleSheet.addRow({
      vehicleNo: v.vehicleNo || v.vehicleName || 'Unknown',
      vehicleType: v.vehicleTypeName || '-',
      category: catConfig?.name || 'Unknown',
      opening: v.openingFuel || 0,
      gpsConsumption: v.gpsMeasuredConsumption || v.consumption || 0,
      refueled: v.totalFuelAmount || 0,
      closing: v.closingFuel || 0,
      variance: v.vehicleVariance || 0,
      dataSource: v.dataSourcePrimary || 'N/A'
    });
  });

  // Add totals row
  const totalsRow = vehicleSheet.addRow({
    vehicleNo: 'TOTALS',
    vehicleType: '',
    category: '',
    opening: selectedVehicles.reduce((sum, v) => sum + (v.openingFuel || 0), 0),
    gpsConsumption: selectedVehicles.reduce((sum, v) => sum + (v.gpsMeasuredConsumption || v.consumption || 0), 0),
    refueled: selectedVehicles.reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0),
    closing: selectedVehicles.reduce((sum, v) => sum + (v.closingFuel || 0), 0),
    variance: selectedVehicles.reduce((sum, v) => sum + (v.vehicleVariance || 0), 0),
    dataSource: ''
  });
  totalsRow.font = { bold: true };
  totalsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
};

/**
 * Add Tank Details sheet to workbook
 */
const addTankDetailsSheet = (workbook, tankData) => {
  const tankSheet = workbook.addWorksheet('Tank Details');
  tankSheet.columns = [
    { header: 'Tank Name', key: 'tankName', width: 20 },
    { header: 'Fuel Type', key: 'fuelType', width: 12 },
    { header: 'Opening (L)', key: 'opening', width: 12 },
    { header: 'Deliveries (L)', key: 'deliveries', width: 12 },
    { header: 'Dispensed (L)', key: 'dispensed', width: 12 },
    { header: 'Closing (L)', key: 'closing', width: 12 },
    { header: 'Variance (L)', key: 'variance', width: 12 }
  ];

  tankSheet.getRow(1).font = { bold: true };
  tankSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };

  tankData.tanks.forEach(t => {
    tankSheet.addRow({
      tankName: t.tankName || 'Unknown',
      fuelType: t.fuelType || 'Diesel',
      opening: t.openingVolume || t.openingStock || 0,
      deliveries: t.deliveries || t.totalDeliveries || 0,
      dispensed: t.dispensed || t.totalDispensed || 0,
      closing: t.closingVolume || t.closingStock || 0,
      variance: t.variance || 0
    });
  });

  // Add totals row
  const totalsRow = tankSheet.addRow({
    tankName: 'TOTALS',
    fuelType: '',
    opening: tankData.totalOpening,
    deliveries: tankData.totalDeliveries,
    dispensed: tankData.totalDispensed,
    closing: tankData.totalClosing,
    variance: tankData.tanks.reduce((sum, t) => sum + (t.variance || 0), 0)
  });
  totalsRow.font = { bold: true };
  totalsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
};

// ============ Helper Functions ============

/**
 * Add a section header row with background color
 */
const addSectionHeader = (sheet, title, bgColor, fontSize = null) => {
  const row = sheet.addRow([title, '', '']);
  row.font = { bold: true };
  if (fontSize) {
    row.font.size = fontSize;
  }
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
};

/**
 * Add a divider row
 */
const addDividerRow = (sheet) => {
  sheet.addRow(['  ─────────────────────────────────', '', '']);
};

/**
 * Add a double divider row
 */
const addDoubleDividerRow = (sheet) => {
  sheet.addRow(['═══════════════════════════════════', '', '']);
};

/**
 * Add a bold row
 */
const addBoldRow = (sheet, label, value) => {
  const row = sheet.addRow([label, value, '']);
  row.font = { bold: true };
  return row;
};

export default exportReconciliationToExcel;
