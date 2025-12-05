/**
 * Step5VehiclePreviewExport.js
 * Excel export utility for Step 5: Vehicle Data Preview
 * Handles exporting vehicle data by category with refill details
 */

import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { CATEGORY_CONFIG, getDataQualityInfo } from './Step5VehiclePreviewHelpers';

// Column configurations for export
const EXPORT_COLUMNS = {
  // Common columns for all categories
  common: [
    { header: 'Vehicle No', key: 'vehicleNo', width: 15 },
    { header: 'Driver', key: 'driverName', width: 20 },
    { header: 'Vehicle Type', key: 'vehicleTypeName', width: 20 },
  ],
  // GPS Fleet specific columns (Category 1)
  gpsFleet: [
    { header: 'Opening Fuel (L)', key: 'openingFuel', width: 15 },
    { header: 'Opening Quality', key: 'openingDataQuality', width: 15 },
    { header: 'Closing Fuel (L)', key: 'closingFuel', width: 15 },
    { header: 'Closing Quality', key: 'closingDataQuality', width: 15 },
    { header: 'Total Dispensed (L)', key: 'totalFuelAmount', width: 18 },
    { header: 'Consumption (L)', key: 'consumption', width: 15 },
    { header: 'GPS Consumption (L)', key: 'gpsMeasuredConsumption', width: 18 },
    { header: 'Variance (L)', key: 'consumptionVariance', width: 12 },
  ],
  // Full Tank Policy columns (Category 2)
  fullTank: [
    { header: 'Tank Capacity (L)', key: 'tankCapacity', width: 15 },
    { header: 'Opening Fuel (L)', key: 'openingFuel', width: 15 },
    { header: 'Closing Fuel (L)', key: 'closingFuel', width: 15 },
    { header: 'Total Dispensed (L)', key: 'totalFuelAmount', width: 18 },
    { header: 'Consumption (L)', key: 'consumption', width: 15 },
  ],
  // Equipment columns (Category 3)
  equipment: [
    { header: 'Total Dispensed (L)', key: 'totalFuelAmount', width: 18 },
    { header: 'Refill Count', key: 'refillCount', width: 12 },
  ],
  // Cross-Site columns (Category 4)
  crossSite: [
    { header: 'Opening Fuel (L)', key: 'openingFuel', width: 15 },
    { header: 'Closing Fuel (L)', key: 'closingFuel', width: 15 },
    { header: 'Total Dispensed (L)', key: 'totalFuelAmount', width: 18 },
    { header: 'Consumption (L)', key: 'consumption', width: 15 },
    { header: 'Variance (L)', key: 'consumptionVariance', width: 12 },
  ],
  // External columns (Category 5)
  external: [
    { header: 'Total Dispensed (L)', key: 'totalFuelAmount', width: 18 },
    { header: 'Refill Count', key: 'refillCount', width: 12 },
  ],
};

/**
 * Get the appropriate column configuration for a category
 * @param {number} categoryId - The category ID
 * @returns {Array} - Array of column configurations
 */
export const getColumnsForCategory = (categoryId) => {
  const common = EXPORT_COLUMNS.common;

  switch (categoryId) {
    case 1:
      return [...common, ...EXPORT_COLUMNS.gpsFleet];
    case 2:
      return [...common, ...EXPORT_COLUMNS.fullTank];
    case 3:
      return [...common, ...EXPORT_COLUMNS.equipment];
    case 4:
      return [...common, ...EXPORT_COLUMNS.crossSite];
    case 5:
      return [...common, ...EXPORT_COLUMNS.external];
    default:
      return common;
  }
};

/**
 * Format a number value for export
 * @param {number} value - The value to format
 * @param {number} decimals - Number of decimal places
 * @returns {number|string} - Formatted value or empty string
 */
export const formatExportNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '';
  }
  return Number(value.toFixed(decimals));
};

/**
 * Get data quality label for export
 * @param {string|number} quality - The quality value
 * @returns {string} - Human-readable quality label
 */
export const getQualityLabel = (quality) => {
  const info = getDataQualityInfo(quality);
  return info?.label || String(quality || '-');
};

/**
 * Apply header styling to a worksheet
 * @param {Object} worksheet - ExcelJS worksheet
 * @param {number} rowNumber - Row number to style
 */
const applyHeaderStyle = (worksheet, rowNumber = 1) => {
  const headerRow = worksheet.getRow(rowNumber);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 25;
};

/**
 * Apply alternating row colors to worksheet
 * @param {Object} worksheet - ExcelJS worksheet
 * @param {number} startRow - Starting row number
 * @param {number} endRow - Ending row number
 */
const applyAlternatingRowColors = (worksheet, startRow, endRow) => {
  for (let i = startRow; i <= endRow; i++) {
    if (i % 2 === 0) {
      const row = worksheet.getRow(i);
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      };
    }
  }
};

/**
 * Add summary row to worksheet
 * @param {Object} worksheet - ExcelJS worksheet
 * @param {Array} data - Vehicle data array
 * @param {number} categoryId - Category ID
 */
const addSummaryRow = (worksheet, data, categoryId) => {
  const columns = getColumnsForCategory(categoryId);
  const summaryRow = {};

  // Calculate totals for numeric columns
  summaryRow.vehicleNo = 'TOTAL';
  summaryRow.driverName = `${data.length} vehicle(s)`;

  // Sum up numeric values
  if (categoryId === 1 || categoryId === 2 || categoryId === 4) {
    summaryRow.totalFuelAmount = data.reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0);
    summaryRow.consumption = data.reduce((sum, v) => sum + (v.consumption || 0), 0);
  }
  if (categoryId === 1) {
    summaryRow.gpsMeasuredConsumption = data.reduce((sum, v) => sum + (v.gpsMeasuredConsumption || 0), 0);
    summaryRow.consumptionVariance = data.reduce((sum, v) => sum + (v.consumptionVariance || 0), 0);
  }
  if (categoryId === 3 || categoryId === 5) {
    summaryRow.totalFuelAmount = data.reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0);
  }

  const rowValues = columns.map(col => {
    const val = summaryRow[col.key];
    if (typeof val === 'number') {
      return formatExportNumber(val);
    }
    return val || '';
  });

  const rowNum = worksheet.addRow(rowValues).number;
  const row = worksheet.getRow(rowNum);
  row.font = { bold: true };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2EFDA' }
  };
};

/**
 * Add refill details sheet for a category
 * @param {Object} workbook - ExcelJS workbook
 * @param {Array} data - Vehicle data array
 * @param {number} categoryId - Category ID
 * @param {string} siteName - Site name for title
 */
const addRefillDetailsSheet = (workbook, data, categoryId, siteName) => {
  const config = CATEGORY_CONFIG[categoryId];
  const sheetName = `${config?.name || 'Category ' + categoryId} - Refills`;

  // Truncate sheet name if too long (Excel limit is 31 characters)
  const truncatedName = sheetName.length > 31 ? sheetName.substring(0, 28) + '...' : sheetName;
  const worksheet = workbook.addWorksheet(truncatedName);

  // Define refill columns
  const columns = [
    { header: 'Vehicle No', key: 'vehicleNo', width: 15 },
    { header: 'Refill Date', key: 'refillDate', width: 20 },
    { header: 'Fuel Type', key: 'fuelTypeName', width: 15 },
    { header: 'Quantity (L)', key: 'fuelAmount', width: 15 },
    { header: 'Unit Price', key: 'unitPrice', width: 12 },
    { header: 'Total Cost', key: 'totalCost', width: 15 },
    { header: 'Odometer', key: 'odometer', width: 12 },
    { header: 'Data Source', key: 'dataSource', width: 15 },
    { header: 'GPS Fuel Before', key: 'gpsFuelBefore', width: 15 },
    { header: 'GPS Fuel After', key: 'gpsFuelAfter', width: 15 },
  ];

  worksheet.columns = columns;
  applyHeaderStyle(worksheet);

  // Collect all refills from all vehicles
  let rowIndex = 2;
  data.forEach(vehicle => {
    const refills = vehicle.refills || vehicle.fuelRefills || [];
    refills.forEach(refill => {
      worksheet.addRow({
        vehicleNo: vehicle.vehicleNo,
        refillDate: refill.refillDate ? new Date(refill.refillDate).toLocaleString() : '',
        fuelTypeName: refill.fuelTypeName || refill.fuelType || '',
        fuelAmount: formatExportNumber(refill.fuelAmount),
        unitPrice: formatExportNumber(refill.unitPrice),
        totalCost: formatExportNumber(refill.totalCost || (refill.fuelAmount * refill.unitPrice)),
        odometer: formatExportNumber(refill.odometer, 0),
        dataSource: refill.dataSource || (refill.isGpsData ? 'GPS' : 'Manual'),
        gpsFuelBefore: formatExportNumber(refill.gpsFuelBefore),
        gpsFuelAfter: formatExportNumber(refill.gpsFuelAfter),
      });
      rowIndex++;
    });
  });

  applyAlternatingRowColors(worksheet, 2, rowIndex - 1);

  // Add borders
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });
};

/**
 * Export category data to Excel
 * @param {number} categoryId - Category ID to export
 * @param {Array} data - Vehicle data array for the category
 * @param {Object} options - Export options
 * @param {string} options.siteName - Site name
 * @param {Date} options.startDate - Period start date
 * @param {Date} options.endDate - Period end date
 * @param {boolean} options.includeRefillDetails - Whether to include refill details sheet
 */
export const exportCategoryToExcel = async (categoryId, data, options = {}) => {
  const {
    siteName = 'Unknown Site',
    startDate,
    endDate,
    includeRefillDetails = true
  } = options;

  const config = CATEGORY_CONFIG[categoryId];
  const categoryName = config?.name || `Category ${categoryId}`;

  const workbook = new Workbook();

  // Set workbook properties
  workbook.creator = 'FMS Fuel Audit';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Create summary sheet
  const summarySheetName = `${categoryName} Summary`;
  const truncatedSummaryName = summarySheetName.length > 31
    ? summarySheetName.substring(0, 28) + '...'
    : summarySheetName;
  const worksheet = workbook.addWorksheet(truncatedSummaryName);

  // Add title
  const titleRow = worksheet.addRow([`${categoryName} - Vehicle Data`]);
  titleRow.font = { bold: true, size: 14 };
  worksheet.mergeCells('A1:D1');

  // Add period info
  const periodText = startDate && endDate
    ? `Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
    : 'Period: Not specified';
  const periodRow = worksheet.addRow([`Site: ${siteName}`, periodText]);
  periodRow.font = { italic: true, color: { argb: 'FF666666' } };
  worksheet.addRow([]); // Empty row

  // Get columns for this category
  const columns = getColumnsForCategory(categoryId);
  worksheet.columns = columns;

  // Add header row
  const headerRowNum = 4;
  const headerValues = columns.map(col => col.header);
  worksheet.getRow(headerRowNum).values = headerValues;
  applyHeaderStyle(worksheet, headerRowNum);

  // Add data rows
  let rowNum = headerRowNum + 1;
  data.forEach(vehicle => {
    const rowData = {};
    columns.forEach(col => {
      let value = vehicle[col.key];

      // Special handling for certain columns
      if (col.key.includes('Quality')) {
        value = getQualityLabel(value);
      } else if (typeof value === 'number') {
        value = formatExportNumber(value);
      }

      rowData[col.key] = value ?? '';
    });

    worksheet.addRow(Object.values(rowData));
    rowNum++;
  });

  // Apply alternating row colors
  applyAlternatingRowColors(worksheet, headerRowNum + 1, rowNum - 1);

  // Add summary row
  if (data.length > 0) {
    addSummaryRow(worksheet, data, categoryId);
  }

  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= headerRowNum) {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    }
  });

  // Add refill details sheet if requested and data has refills
  const hasRefills = data.some(v => (v.refills || v.fuelRefills || []).length > 0);
  if (includeRefillDetails && hasRefills) {
    addRefillDetailsSheet(workbook, data, categoryId, siteName);
  }

  // Generate filename
  const dateStr = new Date().toISOString().split('T')[0];
  const safeFileName = `FuelAudit_${categoryName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.xlsx`;

  // Save the file
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), safeFileName);

  return safeFileName;
};

/**
 * Export all categories to a single Excel file
 * @param {Object} vehiclesByCategory - Object with category IDs as keys and vehicle arrays as values
 * @param {Object} options - Export options
 */
export const exportAllCategoriesToExcel = async (vehiclesByCategory, options = {}) => {
  const {
    siteName = 'Unknown Site',
    // startDate and endDate available for future use in sheet headers
    // startDate,
    // endDate,
    includeRefillDetails = true
  } = options;

  const workbook = new Workbook();

  // Set workbook properties
  workbook.creator = 'FMS Fuel Audit';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Add a sheet for each category that has data
  Object.entries(vehiclesByCategory).forEach(([categoryId, vehicles]) => {
    if (!vehicles || vehicles.length === 0) return;

    const catId = parseInt(categoryId);
    const config = CATEGORY_CONFIG[catId];
    const categoryName = config?.name || `Category ${catId}`;

    // Create summary sheet for this category
    const sheetName = categoryName.length > 31 ? categoryName.substring(0, 28) + '...' : categoryName;
    const worksheet = workbook.addWorksheet(sheetName);

    // Get columns for this category
    const columns = getColumnsForCategory(catId);
    worksheet.columns = columns;

    // Add header row
    applyHeaderStyle(worksheet);

    // Add data rows
    let rowNum = 2;
    vehicles.forEach(vehicle => {
      const rowData = columns.map(col => {
        let value = vehicle[col.key];
        if (col.key.includes('Quality')) {
          value = getQualityLabel(value);
        } else if (typeof value === 'number') {
          value = formatExportNumber(value);
        }
        return value ?? '';
      });
      worksheet.addRow(rowData);
      rowNum++;
    });

    // Apply styling
    applyAlternatingRowColors(worksheet, 2, rowNum - 1);
    addSummaryRow(worksheet, vehicles, catId);

    // Add borders
    worksheet.eachRow((row) => {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
  });

  // Add combined refill details sheet if requested
  if (includeRefillDetails) {
    const allRefills = [];
    Object.entries(vehiclesByCategory).forEach(([categoryId, vehicles]) => {
      if (!vehicles) return;
      vehicles.forEach(vehicle => {
        const refills = vehicle.refills || vehicle.fuelRefills || [];
        refills.forEach(refill => {
          allRefills.push({
            categoryId: parseInt(categoryId),
            vehicleNo: vehicle.vehicleNo,
            ...refill
          });
        });
      });
    });

    if (allRefills.length > 0) {
      const refillSheet = workbook.addWorksheet('All Refills');
      refillSheet.columns = [
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Vehicle No', key: 'vehicleNo', width: 15 },
        { header: 'Refill Date', key: 'refillDate', width: 20 },
        { header: 'Fuel Type', key: 'fuelTypeName', width: 15 },
        { header: 'Quantity (L)', key: 'fuelAmount', width: 15 },
        { header: 'Unit Price', key: 'unitPrice', width: 12 },
        { header: 'Total Cost', key: 'totalCost', width: 15 },
        { header: 'Data Source', key: 'dataSource', width: 15 },
      ];

      applyHeaderStyle(refillSheet);

      allRefills.forEach((refill, idx) => {
        refillSheet.addRow({
          category: CATEGORY_CONFIG[refill.categoryId]?.name || `Category ${refill.categoryId}`,
          vehicleNo: refill.vehicleNo,
          refillDate: refill.refillDate ? new Date(refill.refillDate).toLocaleString() : '',
          fuelTypeName: refill.fuelTypeName || refill.fuelType || '',
          fuelAmount: formatExportNumber(refill.fuelAmount),
          unitPrice: formatExportNumber(refill.unitPrice),
          totalCost: formatExportNumber(refill.totalCost || (refill.fuelAmount * refill.unitPrice)),
          dataSource: refill.dataSource || (refill.isGpsData ? 'GPS' : 'Manual'),
        });
      });

      applyAlternatingRowColors(refillSheet, 2, allRefills.length + 1);

      // Add borders
      refillSheet.eachRow((row) => {
        row.eachCell(cell => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });
    }
  }

  // Generate filename
  const dateStr = new Date().toISOString().split('T')[0];
  const safeFileName = `FuelAudit_AllCategories_${siteName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.xlsx`;

  // Save the file
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), safeFileName);

  return safeFileName;
};

// Re-export CATEGORY_CONFIG for convenience
export { CATEGORY_CONFIG };
