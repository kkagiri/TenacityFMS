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

/**
 * Export ONLY refill details for a single category to a separate Excel file
 * This exports the detailed refill records (master-detail data) without the vehicle summary
 * @param {number} categoryId - Category ID to export
 * @param {Array} data - Vehicle data array for the category
 * @param {Object} options - Export options
 * @param {string} options.siteName - Site name
 * @param {Date} options.startDate - Period start date
 * @param {Date} options.endDate - Period end date
 */
export const exportRefillDetailsToExcel = async (categoryId, data, options = {}) => {
  const {
    siteName = 'Unknown Site',
    startDate,
    endDate,
  } = options;

  const config = CATEGORY_CONFIG[categoryId];
  const categoryName = config?.name || `Category ${categoryId}`;

  const workbook = new Workbook();

  // Set workbook properties
  workbook.creator = 'FMS Fuel Audit';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Create single sheet for refill details
  const worksheet = workbook.addWorksheet('Fuel Refill Details');

  // Add title
  const titleRow = worksheet.addRow([`${categoryName} - Fuel Refill Details`]);
  titleRow.font = { bold: true, size: 14 };
  worksheet.mergeCells('A1:H1');

  // Add period info
  const periodText = startDate && endDate
    ? `Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
    : 'Period: Not specified';
  const periodRow = worksheet.addRow([`Site: ${siteName}`, periodText]);
  periodRow.font = { italic: true, color: { argb: 'FF666666' } };
  worksheet.addRow([]); // Empty row

  // Define columns based on category - matching the master-detail grid display
  let columns;

  // Category 1 (GPS Fleet) - Matches "GPS Refill Events (SOAP Report 212)" detail grid
  if (categoryId === 1) {
    columns = [
      { header: 'Vehicle No', key: 'vehicleNo', width: 15 },
      { header: 'Date', key: 'refillDate', width: 18 },
      { header: 'Tank', key: 'tankName', width: 12 },
      { header: 'Fuel Before', key: 'fuelBefore', width: 12 },
      { header: 'Fuel After', key: 'fuelAfter', width: 12 },
      { header: 'GPS Fuel', key: 'gpsFuel', width: 12 },
      { header: 'Manual (L)', key: 'manualAmount', width: 12 },
      { header: 'Variance', key: 'variance', width: 12 },
      { header: 'Var %', key: 'variancePercent', width: 10 },
      { header: 'At Site', key: 'atSite', width: 10 },
    ];
  }
  // Category 2 (Full Tank) - Vehicle, Date, Tank, Fuel Issued, Odometer, Distance, km/L
  else if (categoryId === 2) {
    columns = [
      { header: 'Vehicle No', key: 'vehicleNo', width: 15 },
      { header: 'Refill Date', key: 'refillDate', width: 18 },
      { header: 'Tank', key: 'tankName', width: 12 },
      { header: 'Fuel Issued (L)', key: 'fuelAmount', width: 14 },
      { header: 'Prev Odo', key: 'prevOdometer', width: 12 },
      { header: 'Curr Odo', key: 'odometer', width: 12 },
      { header: 'Distance (km)', key: 'distance', width: 13 },
      { header: 'km/L', key: 'efficiency', width: 10 },
    ];
  }
  // Category 4 (Cross-Site) - Same as Category 1 with GPS Refill Events
  else if (categoryId === 4) {
    columns = [
      { header: 'Vehicle No', key: 'vehicleNo', width: 15 },
      { header: 'Date', key: 'refillDate', width: 18 },
      { header: 'Tank', key: 'tankName', width: 12 },
      { header: 'Fuel Before', key: 'fuelBefore', width: 12 },
      { header: 'Fuel After', key: 'fuelAfter', width: 12 },
      { header: 'GPS Fuel', key: 'gpsFuel', width: 12 },
      { header: 'Manual (L)', key: 'manualAmount', width: 12 },
      { header: 'Variance', key: 'variance', width: 12 },
      { header: 'Var %', key: 'variancePercent', width: 10 },
      { header: 'At Site', key: 'atSite', width: 10 },
    ];
  }
  // Category 3 & 5 (Equipment & External) - Vehicle, Date, Tank, Quantity
  else {
    columns = [
      { header: 'Vehicle No', key: 'vehicleNo', width: 15 },
      { header: 'Refill Date', key: 'refillDate', width: 18 },
      { header: 'Tank', key: 'tankName', width: 12 },
      { header: 'Quantity (L)', key: 'fuelAmount', width: 12 },
      { header: 'Odometer', key: 'odometer', width: 12 },
    ];
  }

  worksheet.columns = columns;

  // Add header row at row 4
  const headerRowNum = 4;
  const headerValues = columns.map(col => col.header);
  worksheet.getRow(headerRowNum).values = headerValues;
  applyHeaderStyle(worksheet, headerRowNum);

  // Helper function to merge GPS events with manual refills (same as UI)
  const mergeGpsAndManualRefills = (gpsRefillEvents, manualRefills) => {
    if (!gpsRefillEvents || gpsRefillEvents.length === 0) return [];

    return gpsRefillEvents.map(gpsEvent => {
      // Try to find a matching manual refill by date (same day)
      const gpsDate = new Date(gpsEvent.refillDate);
      const matchedRefill = manualRefills?.find(r => {
        const refillDate = new Date(r.refillDate);
        // Match if same date (within a day)
        return Math.abs(gpsDate - refillDate) < 24 * 60 * 60 * 1000;
      });

      const manualAmount = matchedRefill?.fuelAmount || null;
      const gpsAmount = gpsEvent.gpsRefillVolume || 0;

      // Calculate variance: Manual - GPS (positive = manual shows more than GPS)
      let variance = null;
      let variancePercent = null;
      if (manualAmount !== null && gpsAmount > 0) {
        variance = manualAmount - gpsAmount;
        variancePercent = (variance / manualAmount) * 100;
      }

      return {
        ...gpsEvent,
        manualRefillAmount: manualAmount,
        variance: variance,
        variancePercent: variancePercent,
        tankName: matchedRefill?.tankName || gpsEvent.tankName,
        fuelRefillId: matchedRefill?.refillId || gpsEvent.fuelRefillId
      };
    });
  };

  // Collect all refills from all vehicles with calculated fields
  let rowIndex = headerRowNum + 1;
  let totalFuelAmount = 0;
  let totalGpsDispensed = 0;
  let refillCount = 0;

  data.forEach(vehicle => {
    // For GPS Categories (1 and 4): merge gpsRefillEvents with manual refills (same as UI detail grid)
    // For other categories: use refills or fuelRefills
    // Also try to get tank name from vehicle level if not in refill
    const vehicleTankName = vehicle.tankName || vehicle.tank || '';

    const isGpsCategory = categoryId === 1 || categoryId === 4;
    const gpsRefillEvents = vehicle.gpsRefillEvents || [];
    const manualRefills = vehicle.refills || vehicle.fuelRefills || [];

    // For GPS categories, merge GPS events with manual refills (same logic as UI)
    const refills = (isGpsCategory && gpsRefillEvents.length > 0)
      ? mergeGpsAndManualRefills(gpsRefillEvents, manualRefills)
      : manualRefills;
    let prevOdometer = null;

    // Debug log to help identify data structure
    if (refills.length > 0) {
      console.log(`[Export] Vehicle ${vehicle.vehicleNo} - First refill keys:`, Object.keys(refills[0]));
    }

    refills.forEach((refill, idx) => {
      // Handle different field names between GPS events and manual refills
      // Try multiple field names for manual amount
      const fuelAmount = refill.manualRefillAmount || refill.fuelAmount || refill.quantity || refill.amount || 0;
      // Try multiple field names for GPS dispensed
      const gpsDispensedValue = refill.gpsRefillVolume || refill.gpsDispensed || refill.gpsAmount || refill.gpsFuelAmount || null;
      // Try multiple field names for tank
      const tankName = refill.tankName || refill.tank || refill.fuelTankName || vehicleTankName || '';

      totalFuelAmount += fuelAmount;
      if (gpsDispensedValue != null) totalGpsDispensed += gpsDispensedValue;
      refillCount++;

      // Calculate distance and efficiency for Category 2
      const currentOdometer = refill.odometer || refill.currentOdometer || 0;
      const prevOdo = refill.previousOdometer || (idx > 0 ? refills[idx - 1]?.odometer : null) || prevOdometer;
      const distance = prevOdo && currentOdometer ? (currentOdometer - prevOdo) : null;
      const efficiency = distance && fuelAmount ? (distance / fuelAmount) : null;

      // Get GPS fuel values - from refill data
      const gpsFuelBefore = refill.fuelBefore ?? refill.gpsFuelBefore ?? null;
      const gpsFuelAfter = refill.fuelAfter ?? refill.gpsFuelAfter ?? null;

      // GPS Fuel = Fuel After - Fuel Before (what GPS sensor measured as dispensed)
      const gpsFuel = gpsDispensedValue ?? ((gpsFuelBefore != null && gpsFuelAfter != null)
        ? (gpsFuelAfter - gpsFuelBefore)
        : null);

      // Build row data based on category
      let rowData;

      // Calculate variance - Manual minus GPS (positive = manual higher than GPS)
      const variance = (gpsFuel != null && fuelAmount)
        ? (fuelAmount - gpsFuel)
        : (refill.variance ?? null);

      // Calculate variance percentage
      const variancePercent = (variance != null && fuelAmount && fuelAmount !== 0)
        ? ((variance / fuelAmount) * 100)
        : (refill.variancePercent ?? null);

      if (categoryId === 1) {
        // Category 1: GPS Refill Events - matches detail grid columns exactly
        rowData = {
          vehicleNo: vehicle.vehicleNo,
          refillDate: refill.refillDate ? new Date(refill.refillDate).toLocaleDateString() : '',
          tankName: tankName,
          fuelBefore: formatExportNumber(gpsFuelBefore, 1),
          fuelAfter: formatExportNumber(gpsFuelAfter, 1),
          gpsFuel: formatExportNumber(gpsFuel, 1),
          manualAmount: formatExportNumber(fuelAmount, 1),
          variance: formatExportNumber(variance, 1),
          variancePercent: variancePercent != null ? `${formatExportNumber(variancePercent, 1)}%` : '',
          atSite: refill.isAuditSiteRefill ? 'Yes' : 'No',
        };
      } else if (categoryId === 2) {
        rowData = {
          vehicleNo: vehicle.vehicleNo,
          refillDate: refill.refillDate ? new Date(refill.refillDate).toLocaleDateString() : '',
          tankName: tankName,
          fuelAmount: formatExportNumber(fuelAmount),
          prevOdometer: formatExportNumber(prevOdo, 0),
          odometer: formatExportNumber(currentOdometer, 0),
          distance: formatExportNumber(distance, 1),
          efficiency: formatExportNumber(efficiency, 2),
        };
      } else if (categoryId === 4) {
        // Category 4: Cross-Site GPS Refill Events - same structure as Category 1
        rowData = {
          vehicleNo: vehicle.vehicleNo,
          refillDate: refill.refillDate ? new Date(refill.refillDate).toLocaleDateString() : '',
          tankName: tankName,
          fuelBefore: formatExportNumber(gpsFuelBefore, 1),
          fuelAfter: formatExportNumber(gpsFuelAfter, 1),
          gpsFuel: formatExportNumber(gpsFuel, 1),
          manualAmount: formatExportNumber(fuelAmount, 1),
          variance: formatExportNumber(variance, 1),
          variancePercent: variancePercent != null ? `${formatExportNumber(variancePercent, 1)}%` : '',
          atSite: refill.isAuditSiteRefill ? 'Yes' : 'No',
        };
      } else {
        rowData = {
          vehicleNo: vehicle.vehicleNo,
          refillDate: refill.refillDate ? new Date(refill.refillDate).toLocaleDateString() : '',
          tankName: tankName,
          fuelAmount: formatExportNumber(fuelAmount),
          odometer: formatExportNumber(currentOdometer, 0),
        };
      }

      // Add row as array of values in column order
      const rowValues = columns.map(col => rowData[col.key] ?? '');
      worksheet.addRow(rowValues);
      rowIndex++;

      prevOdometer = currentOdometer;
    });
  });

  // Apply alternating row colors
  applyAlternatingRowColors(worksheet, headerRowNum + 1, rowIndex - 1);

  // Add summary row
  const summaryRow = worksheet.addRow([]);
  summaryRow.getCell(1).value = 'TOTAL';
  summaryRow.getCell(1).font = { bold: true };
  summaryRow.getCell(2).value = `${refillCount} refill(s) from ${data.length} vehicle(s)`;

  // Find the manual amount column and add total (for Categories 1 and 4)
  const manualAmountColIdx = columns.findIndex(c => c.key === 'manualAmount') + 1;
  if (manualAmountColIdx > 0) {
    summaryRow.getCell(manualAmountColIdx).value = formatExportNumber(totalFuelAmount, 1);
    summaryRow.getCell(manualAmountColIdx).font = { bold: true };
  }

  // Find the fuel amount column and add total (for Categories 2, 3, 5)
  const fuelAmountColIdx = columns.findIndex(c => c.key === 'fuelAmount') + 1;
  if (fuelAmountColIdx > 0) {
    summaryRow.getCell(fuelAmountColIdx).value = formatExportNumber(totalFuelAmount);
    summaryRow.getCell(fuelAmountColIdx).font = { bold: true };
  }

  // Find the GPS Fuel column and add total (for Category 1 and 4)
  const gpsFuelColIdx = columns.findIndex(c => c.key === 'gpsFuel') + 1;
  if (gpsFuelColIdx > 0 && totalGpsDispensed > 0) {
    summaryRow.getCell(gpsFuelColIdx).value = formatExportNumber(totalGpsDispensed, 1);
    summaryRow.getCell(gpsFuelColIdx).font = { bold: true };
  }

  summaryRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2EFDA' }
  };

  // Add borders to all data cells
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

  // Generate filename
  const dateStr = new Date().toISOString().split('T')[0];
  const periodStr = startDate && endDate
    ? `_${new Date(startDate).toISOString().split('T')[0]}_to_${new Date(endDate).toISOString().split('T')[0]}`
    : '';
  const safeFileName = `FuelRefillDetails_${categoryName.replace(/[^a-zA-Z0-9]/g, '_')}${periodStr}_${dateStr}.xlsx`;

  // Save the file
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), safeFileName);

  return safeFileName;
};

// Re-export CATEGORY_CONFIG for convenience
export { CATEGORY_CONFIG };
