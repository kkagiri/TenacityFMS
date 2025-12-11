
/**
 * Step6Reconciliation.js
 * Step 6: Comprehensive Fuel Audit Review
 *
 * Displays a comprehensive view combining:
 * - Tank data from Step 3 (Opening/Closing stock, Deliveries, Transfers)
 * - Vehicle data from Step 5 (By category with refill details)
 *
 * Layout Structure (matching Python export):
 * ├── Tank Header Section (per tank)
 * │   ├── Tank name, period, capacity
 * │   ├── Opening/Closing stock values
 * │   ├── Deliveries, Transfers In/Out
 * │   └── Tank variance calculation
 * │
 * ├── Category Sections (nested under tank)
 * │   ├── Category 1: GPS Site Fleet (HIGH confidence)
 * │   ├── Category 4: Cross-Site Company (HIGH confidence)
 * │   ├── Category 2: Full Tank Policy (MEDIUM confidence)
 * │   ├── Category 3: Site Equipment (LOW confidence)
 * │   └── Category 5: External Non-Company (ACCOUNTED)
 * │
 * ├── Vehicle Details (nested under category)
 * │   ├── Vehicle summary row
 * │   └── Refill details (expandable)
 * │
 * └── Grand Total Section
 *
 * Features:
 * - Master-detail DataGrid for vehicles with refill history
 * - Category-specific column configurations
 * - Variance color coding
 * - Export to Excel functionality
 */

import React, { useMemo, useState, useCallback, memo } from 'react';
import { useSelector } from 'react-redux';
import DataGrid, {
  Column,
  Paging,
  Scrolling,
  Summary,
  TotalItem,
  MasterDetail
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import notify from 'devextreme/ui/notify';

import { selectWizard } from '../../../../../../redux/slices/fuelAuditSlice';

// ============================================================================
// CATEGORY CONFIGURATION
// ============================================================================

const CATEGORY_CONFIG = {
  1: {
    name: 'GPS Site Fleet',
    icon: 'fa-satellite',
    bgColor: 'tw-bg-green-50',
    borderColor: 'tw-border-green-200',
    headerBg: 'tw-bg-green-600',
    textColor: 'tw-text-green-700',
    badgeColor: 'tw-bg-green-100 tw-text-green-800',
    confidence: 'HIGH',
    description: 'Vehicles with GPS + Fuel Sensor belonging to this site',
    showGpsConsumption: true,
    showGpsDispensed: true,
    showOpeningClosing: true
  },
  2: {
    name: 'Site Full Tank',
    icon: 'fa-gas-pump',
    bgColor: 'tw-bg-yellow-50',
    borderColor: 'tw-border-yellow-200',
    headerBg: 'tw-bg-yellow-500',
    textColor: 'tw-text-yellow-700',
    badgeColor: 'tw-bg-yellow-100 tw-text-yellow-800',
    confidence: 'MEDIUM',
    description: 'Vehicles always filled to tank capacity',
    showGpsConsumption: false,
    showGpsDispensed: false,
    showOpeningClosing: true
  },
  3: {
    name: 'Site Equipment',
    icon: 'fa-gear',
    bgColor: 'tw-bg-orange-50',
    borderColor: 'tw-border-orange-200',
    headerBg: 'tw-bg-orange-500',
    textColor: 'tw-text-orange-700',
    badgeColor: 'tw-bg-orange-100 tw-text-orange-800',
    confidence: 'LOW',
    description: 'Equipment without GPS/sensor - fuel issued only',
    showGpsConsumption: false,
    showGpsDispensed: false,
    showOpeningClosing: false
  },
  4: {
    name: 'Cross-Site Company',
    icon: 'fa-arrow-right-arrow-left',
    bgColor: 'tw-bg-cyan-50',
    borderColor: 'tw-border-cyan-200',
    headerBg: 'tw-bg-cyan-600',
    textColor: 'tw-text-cyan-700',
    badgeColor: 'tw-bg-cyan-100 tw-text-cyan-800',
    confidence: 'HIGH',
    description: 'Company vehicles from other sites with GPS',
    showGpsConsumption: true,
    showGpsDispensed: true,
    showOpeningClosing: true
  },
  5: {
    name: 'External Non-Company',
    icon: 'fa-user-plus',
    bgColor: 'tw-bg-pink-50',
    borderColor: 'tw-border-pink-200',
    headerBg: 'tw-bg-pink-500',
    textColor: 'tw-text-pink-700',
    badgeColor: 'tw-bg-pink-100 tw-text-pink-800',
    confidence: 'ACCOUNTED',
    description: 'External/contractor vehicles - accounting only',
    showGpsConsumption: false,
    showGpsDispensed: false,
    showOpeningClosing: false
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatNumber = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

const getVarianceClass = (variance, thresholds = [5, 15]) => {
  const absVar = Math.abs(variance || 0);
  if (absVar < thresholds[0]) return 'tw-bg-green-100 tw-text-green-800';
  if (absVar < thresholds[1]) return 'tw-bg-yellow-100 tw-text-yellow-800';
  return 'tw-bg-red-100 tw-text-red-800';
};

const getConfidenceBadge = (confidence) => {
  const styles = {
    HIGH: 'tw-bg-green-600 tw-text-white',
    MEDIUM: 'tw-bg-yellow-500 tw-text-white',
    LOW: 'tw-bg-red-500 tw-text-white',
    ACCOUNTED: 'tw-bg-gray-500 tw-text-white'
  };
  return styles[confidence] || styles.MEDIUM;
};

/**
 * Merge GPS refill events with manual refills to calculate variance
 * GPS events have: entryId, refillDate, gpsRefillVolume, fuelBefore, fuelAfter
 * Manual refills have: refillId, refillDate, fuelAmount, tankName
 *
 * This function:
 * 1. Deduplicates GPS events by date (aggregating volumes for same day)
 * 2. Matches each manual refill only once to a GPS event
 */
const mergeGpsAndManualRefills = (gpsRefillEvents, manualRefills) => {
  if (!gpsRefillEvents || gpsRefillEvents.length === 0) {
    return [];
  }

  // Step 1: Deduplicate GPS events by date
  // Group by date string (YYYY-MM-DD)
  const gpsEventsByDate = new Map();

  gpsRefillEvents.forEach((gpsEvent) => {
    const dateKey = new Date(gpsEvent.refillDate).toISOString().split('T')[0];

    if (gpsEventsByDate.has(dateKey)) {
      // Aggregate: sum GPS volumes for same date
      const existing = gpsEventsByDate.get(dateKey);
      existing.gpsRefillVolume = (existing.gpsRefillVolume || 0) + (gpsEvent.gpsRefillVolume || 0);
      // Keep the first entry's other fields, but track count
      existing._count = (existing._count || 1) + 1;
    } else {
      // First entry for this date
      gpsEventsByDate.set(dateKey, {
        ...gpsEvent,
        _dateKey: dateKey,
        _count: 1
      });
    }
  });

  // Convert to array and sort by date
  const uniqueGpsEvents = Array.from(gpsEventsByDate.values())
    .sort((a, b) => new Date(a.refillDate) - new Date(b.refillDate));

  // Step 2: Track which manual refills have been matched
  const usedManualRefillIds = new Set();

  return uniqueGpsEvents.map((gpsEvent, index) => {
    // Try to find a matching manual refill by date (same day) that hasn't been used
    const gpsDate = new Date(gpsEvent.refillDate);
    const gpsDateKey = gpsDate.toISOString().split('T')[0];

    const matchedRefill = manualRefills?.find(r => {
      if (usedManualRefillIds.has(r.refillId)) {
        return false; // Already matched
      }
      const refillDateKey = new Date(r.refillDate).toISOString().split('T')[0];
      return refillDateKey === gpsDateKey;
    });

    // Mark this manual refill as used
    if (matchedRefill) {
      usedManualRefillIds.add(matchedRefill.refillId);
    }

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
      // Use date-based key for uniqueness
      entryId: gpsEvent.entryId || `gps_${gpsEvent._dateKey}_${index}`,
      manualRefillAmount: manualAmount,
      variance: variance,
      variancePercent: variancePercent,
      tankName: matchedRefill?.tankName || gpsEvent.tankName,
      fuelRefillId: matchedRefill?.refillId || gpsEvent.fuelRefillId
    };
  });
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Step6Reconciliation = memo(() => {
  const wizard = useSelector(selectWizard);

  // Expanded sections state
  const [expandedTanks, setExpandedTanks] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  // Get tank data from Step 3
  const tankPreview = useMemo(() => {
    return wizard.tankPreview || [];
  }, [wizard.tankPreview]);

  // Get selected vehicles from Step 5
  const selectedVehicles = useMemo(() => {
    const tankRefills = wizard.tankRefills || [];
    return tankRefills.filter(v => wizard.selectedVehicleIds?.includes(v.vehicleId));
  }, [wizard.tankRefills, wizard.selectedVehicleIds]);

  // Group vehicles by category
  const vehiclesByCategory = useMemo(() => {
    const grouped = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    selectedVehicles.forEach(v => {
      const cat = v.vehicleCategory || 5;
      if (grouped[cat]) {
        grouped[cat].push(v);
      }
    });
    return grouped;
  }, [selectedVehicles]);

  // Calculate totals per category
  const categoryTotals = useMemo(() => {
    const totals = {};
    Object.keys(CATEGORY_CONFIG).forEach(catId => {
      const vehicles = vehiclesByCategory[catId] || [];
      totals[catId] = {
        vehicleCount: vehicles.length,
        totalDispensed: vehicles.reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0),
        totalGpsConsumption: vehicles.reduce((sum, v) => sum + (v.gpsMeasuredConsumption || 0), 0),
        totalOpening: vehicles.reduce((sum, v) => sum + (v.openingFuel || 0), 0),
        totalClosing: vehicles.reduce((sum, v) => sum + (v.closingFuel || 0), 0),
        totalRefills: vehicles.reduce((sum, v) => sum + (v.refillCount || 0), 0)
      };
      // Calculate variance for GPS categories
      if (CATEGORY_CONFIG[catId].showGpsConsumption) {
        totals[catId].variance = totals[catId].totalDispensed - Math.abs(totals[catId].totalGpsConsumption);
      }
    });
    return totals;
  }, [vehiclesByCategory]);

  // Calculate grand totals
  const grandTotals = useMemo(() => {
    return {
      tanks: {
        count: tankPreview.length,
        totalOpening: tankPreview.reduce((sum, t) => sum + (t.openingStock || 0), 0),
        totalClosing: tankPreview.reduce((sum, t) => sum + (t.closingStock || 0), 0),
        totalDeliveries: tankPreview.reduce((sum, t) => sum + (t.totalDeliveries || 0), 0),
        totalDispensed: tankPreview.reduce((sum, t) => sum + (t.totalDispensed || 0), 0),
        totalTransferIn: tankPreview.reduce((sum, t) => sum + (t.totalTransfersIn || 0), 0),
        totalTransferOut: tankPreview.reduce((sum, t) => sum + (t.totalTransfersOut || 0), 0)
      },
      vehicles: {
        count: selectedVehicles.length,
        totalDispensed: Object.values(categoryTotals).reduce((sum, c) => sum + c.totalDispensed, 0),
        totalGpsConsumption: Object.values(categoryTotals).reduce((sum, c) => sum + Math.abs(c.totalGpsConsumption), 0),
        totalRefills: Object.values(categoryTotals).reduce((sum, c) => sum + c.totalRefills, 0)
      }
    };
  }, [tankPreview, selectedVehicles, categoryTotals]);

  // Toggle tank expansion
  const toggleTank = useCallback((tankId) => {
    setExpandedTanks(prev => ({
      ...prev,
      [tankId]: !prev[tankId]
    }));
  }, []);

  // Toggle category expansion
  const toggleCategory = useCallback((categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  }, []);

  // Expand/collapse all
  const expandAll = useCallback(() => {
    const allTanks = {};
    tankPreview.forEach(t => { allTanks[t.tankId] = true; });
    setExpandedTanks(allTanks);
    setExpandedCategories({ 1: true, 2: true, 3: true, 4: true, 5: true });
  }, [tankPreview]);

  const collapseAll = useCallback(() => {
    setExpandedTanks({});
    setExpandedCategories({});
  }, []);

  // Export to Excel - Comprehensive Fuel Audit Report
  const handleExportToExcel = useCallback(async () => {
    try {
      const workbook = new Workbook();
      workbook.creator = 'FMS Fuel Audit';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Format dates
      const periodStart = wizard.periodStart
        ? new Date(wizard.periodStart).toISOString().replace('T', ' ').substring(0, 16)
        : 'N/A';
      const periodEnd = wizard.periodEnd
        ? new Date(wizard.periodEnd).toISOString().replace('T', ' ').substring(0, 16)
        : 'N/A';
      const siteName = wizard.selectedSiteName || 'Unknown Site';

      // Color definitions
      const COLORS = {
        tankHeader: 'FF1F4E79',       // Dark blue
        tankHeaderText: 'FFFFFFFF',
        cat1Header: 'FF70AD47',       // Green - GPS Site Fleet
        cat1Vehicle: 'FFE2EFDA',      // Light green for vehicle rows
        cat2Header: 'FFFFC000',       // Yellow/Gold - Full Tank
        cat2Vehicle: 'FFFFF2CC',      // Light yellow
        cat3Header: 'FFED7D31',       // Orange - Equipment
        cat3Vehicle: 'FFFBE5D6',      // Light orange
        cat4Header: 'FF00B0F0',       // Cyan - Cross-Site
        cat4Vehicle: 'FFDDEBF7',      // Light cyan
        cat5Header: 'FFC00000',       // Dark red - External
        cat5Vehicle: 'FFFCE4D6',      // Light red/pink
        categoryTotal: 'FF4472C4',    // Blue
        grandTotal: 'FF1F4E79',       // Dark blue
        headerText: 'FFFFFFFF',
        refillHeader: 'FFD9E1F2',     // Light blue-gray
        positive: 'FFC6EFCE',         // Light green
        negative: 'FFFFC7CE',         // Light red
        yellow: 'FFFFFF00',           // Yellow highlight
        white: 'FFFFFFFF'
      };

      const CATEGORY_COLORS = {
        1: { header: COLORS.cat1Header, vehicle: COLORS.cat1Vehicle },
        2: { header: COLORS.cat2Header, vehicle: COLORS.cat2Vehicle },
        3: { header: COLORS.cat3Header, vehicle: COLORS.cat3Vehicle },
        4: { header: COLORS.cat4Header, vehicle: COLORS.cat4Vehicle },
        5: { header: COLORS.cat5Header, vehicle: COLORS.cat5Vehicle }
      };

      // Helper function to style a header row
      const styleHeaderRow = (row, bgColor, textColor = COLORS.headerText) => {
        row.font = { bold: true, color: { argb: textColor } };
        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
          cell.font = { bold: true, color: { argb: textColor } };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      };

      // Helper to style vehicle row with background
      const styleVehicleRow = (row, bgColor) => {
        row.font = { bold: true };
        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      };

      // Helper to format variance cell
      const formatVarianceCell = (cell, value) => {
        if (value > 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.negative } };
        } else if (value < 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.positive } };
        }
      };

      // ========================================
      // SHEET 1: EXECUTIVE SUMMARY
      // ========================================
      const summarySheet = workbook.addWorksheet('Executive Summary');
      let summaryRow = 1;

      // Title
      summarySheet.addRow(['FUEL AUDIT RECONCILIATION - EXECUTIVE SUMMARY']);
      summarySheet.mergeCells('A1:H1');
      summarySheet.getRow(1).font = { bold: true, size: 16, color: { argb: COLORS.headerText } };
      summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.grandTotal } };
      summarySheet.getRow(1).alignment = { horizontal: 'center' };
      summaryRow++;

      summarySheet.addRow([`Site: ${siteName}`, '', `Period: ${periodStart} to ${periodEnd}`]);
      summarySheet.addRow([`Generated: ${new Date().toLocaleString()}`]);
      summarySheet.addRow([]);
      summaryRow += 3;

      // TANK SUMMARY TABLE
      summarySheet.addRow(['TANK SUMMARY']);
      summarySheet.getRow(summaryRow).font = { bold: true, size: 14 };
      summaryRow++;

      const tankSummaryHeader = summarySheet.addRow([
        'Tank Name', 'Capacity', 'Opening', 'Deliveries', 'Transfer In', 'Transfer Out',
        'Closing', 'Dispensed', 'Expected', 'Variance', 'Var %'
      ]);
      styleHeaderRow(tankSummaryHeader, COLORS.tankHeader);
      summaryRow++;

      let totalTankDispensed = 0;
      let totalTankVariance = 0;

      tankPreview.forEach(tank => {
        const expected = (tank.openingStock || 0) + (tank.totalDeliveries || 0) +
                        (tank.totalTransfersIn || 0) - (tank.totalTransfersOut || 0) - (tank.totalDispensed || 0);
        const variance = (tank.closingStock || 0) - expected;
        const varPct = expected !== 0 ? ((variance / expected) * 100) : 0;

        totalTankDispensed += tank.totalDispensed || 0;
        totalTankVariance += variance;

        const row = summarySheet.addRow([
          tank.tankName || '',
          tank.tankCapacity || 0,
          tank.openingStock || 0,
          tank.totalDeliveries || 0,
          tank.totalTransfersIn || 0,
          tank.totalTransfersOut || 0,
          tank.closingStock || 0,
          tank.totalDispensed || 0,
          expected,
          variance,
          `${varPct.toFixed(1)}%`
        ]);
        formatVarianceCell(row.getCell(10), variance);
        summaryRow++;
      });

      // Tank totals
      const tankTotalRow = summarySheet.addRow([
        'TOTAL', '',
        grandTotals.tanks.totalOpening,
        grandTotals.tanks.totalDeliveries,
        grandTotals.tanks.totalTransferIn,
        grandTotals.tanks.totalTransferOut,
        grandTotals.tanks.totalClosing,
        totalTankDispensed,
        '',
        totalTankVariance,
        ''
      ]);
      styleHeaderRow(tankTotalRow, COLORS.categoryTotal);
      summaryRow++;

      summarySheet.addRow([]);
      summarySheet.addRow([]);
      summaryRow += 2;

      // VEHICLE CATEGORY SUMMARY TABLE
      summarySheet.addRow(['VEHICLE SUMMARY BY CATEGORY']);
      summarySheet.getRow(summaryRow).font = { bold: true, size: 14 };
      summaryRow++;

      const catSummaryHeader = summarySheet.addRow([
        'Category', 'Description', 'Confidence', 'Vehicles', 'Refills',
        'Manual Dispensed (L)', 'GPS Consumed (L)', 'Variance (L)', 'Var %'
      ]);
      styleHeaderRow(catSummaryHeader, COLORS.cat1Header);
      summaryRow++;

      let totalVehicles = 0;
      let totalRefills = 0;
      let totalManualDispensed = 0;
      let totalGpsConsumed = 0;

      Object.entries(CATEGORY_CONFIG).forEach(([catId, config]) => {
        const vehicles = vehiclesByCategory[catId] || [];
        if (vehicles.length === 0) return;

        const catManualDisp = vehicles.reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0);
        const catGpsConsumed = vehicles.reduce((sum, v) => sum + Math.abs(v.gpsMeasuredConsumption || 0), 0);
        const catRefills = vehicles.reduce((sum, v) => sum + (v.refillCount || 0), 0);
        const catVariance = catManualDisp - catGpsConsumed;
        const catVarPct = catManualDisp !== 0 ? ((catVariance / catManualDisp) * 100) : 0;

        totalVehicles += vehicles.length;
        totalRefills += catRefills;
        totalManualDispensed += catManualDisp;
        totalGpsConsumed += catGpsConsumed;

        const row = summarySheet.addRow([
          `Cat ${catId}: ${config.name}`,
          config.description,
          config.confidence,
          vehicles.length,
          catRefills,
          catManualDisp,
          config.showGpsConsumption ? catGpsConsumed : 'N/A',
          config.showGpsConsumption ? catVariance : 'N/A',
          config.showGpsConsumption ? `${catVarPct.toFixed(1)}%` : 'N/A'
        ]);
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CATEGORY_COLORS[catId].header } };
        row.getCell(1).font = { bold: true, color: { argb: COLORS.headerText } };
        summaryRow++;
      });

      // Category totals
      const totalVariance = totalManualDispensed - totalGpsConsumed;
      const totalVarPct = totalManualDispensed !== 0 ? ((totalVariance / totalManualDispensed) * 100) : 0;
      const catTotalRow = summarySheet.addRow([
        'GRAND TOTAL', '', '', totalVehicles, totalRefills,
        totalManualDispensed, totalGpsConsumed, totalVariance, `${totalVarPct.toFixed(1)}%`
      ]);
      styleHeaderRow(catTotalRow, COLORS.grandTotal);
      summaryRow++;

      summarySheet.addRow([]);
      summarySheet.addRow([]);
      summaryRow += 2;

      // ========================================
      // CAT1 VEHICLE RECONCILIATION TABLE
      // Formula: Variance = Opening + Manual Dispensed - Other Cats Dispensed - GPS Consumption - Closing
      // This accounts for fuel that went to other categories (not tracked by GPS)
      // ========================================
      summarySheet.addRow(['CAT1 VEHICLE FUEL RECONCILIATION']);
      summarySheet.getRow(summaryRow).font = { bold: true, size: 14 };
      summaryRow++;

      summarySheet.addRow(['Formula: Variance = Opening + Cat1 Dispensed - Other Cats Dispensed - GPS Consumed - Closing']);
      summarySheet.getRow(summaryRow).font = { italic: true, size: 10, color: { argb: 'FF666666' } };
      summaryRow++;

      summarySheet.addRow(['Accounts for fuel dispensed to other categories (Cat2-5) that is not tracked by GPS']);
      summarySheet.getRow(summaryRow).font = { italic: true, size: 10, color: { argb: 'FF666666' } };
      summaryRow++;

      summarySheet.addRow([]);
      summaryRow++;

      // Get Cat1 vehicles only (GPS tracked site fleet)
      const cat1Vehicles = selectedVehicles.filter(v => v.vehicleCategory === 1);

      // Calculate other categories dispensed (Cat2-5)
      const otherCatsDispensed = selectedVehicles
        .filter(v => v.vehicleCategory !== 1)
        .reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0);

      if (cat1Vehicles.length > 0) {
        // Header for vehicle reconciliation
        const vehReconHeader = summarySheet.addRow([
          'Vehicle', 'Type', 'Refills', 'Manual Dispensed', 'GPS Consumption', 'Opening Stock', 'Closing Stock',
          'Expected Consumption', 'VARIANCE', 'Var %'
        ]);
        styleHeaderRow(vehReconHeader, COLORS.cat1Header);
        summaryRow++;

        let totalManualDisp = 0;
        let totalGpsCons = 0;
        let totalOpeningStock = 0;
        let totalClosingStock = 0;

        // Row for each Cat1 vehicle
        cat1Vehicles.forEach(vehicle => {
          const manualDisp = vehicle.totalFuelAmount || 0;
          const gpsCons = Math.abs(vehicle.gpsMeasuredConsumption || 0);
          const openingStock = vehicle.openingFuel || 0;
          const closingStock = vehicle.closingFuel || 0;

          // Expected consumption = Opening + Dispensed - Closing
          // This is how much fuel the vehicle SHOULD have consumed
          const expectedConsumption = openingStock + manualDisp - closingStock;

          // Variance = Expected Consumption - GPS Consumption
          // = Opening + Manual Dispensed - GPS Consumption - Closing
          // Positive variance = unaccounted fuel (possible loss/theft)
          const variance = openingStock + manualDisp - gpsCons - closingStock;
          const varPct = manualDisp !== 0 ? ((variance / manualDisp) * 100) : 0;

          totalManualDisp += manualDisp;
          totalGpsCons += gpsCons;
          totalOpeningStock += openingStock;
          totalClosingStock += closingStock;

          const row = summarySheet.addRow([
            vehicle.vehicleNo || '',
            vehicle.vehicleTypeName || '',
            vehicle.refillCount || 0,
            manualDisp.toFixed(1),
            gpsCons.toFixed(1),
            openingStock.toFixed(1),
            closingStock.toFixed(1),
            expectedConsumption.toFixed(1),
            variance.toFixed(1),
            `${varPct.toFixed(1)}%`
          ]);

          // Style
          row.getCell(1).font = { bold: true };
          row.getCell(4).font = { color: { argb: 'FF0066CC' } }; // Blue for manual
          row.getCell(5).font = { color: { argb: 'FF00B050' } }; // Green for GPS
          row.getCell(8).font = { bold: true };

          // Variance coloring
          const varianceCell = row.getCell(9);
          varianceCell.font = { bold: true };
          if (variance > 20) {
            varianceCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.negative } };
          } else if (variance > 5) {
            varianceCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.yellow } };
          } else if (variance < -5) {
            varianceCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9999FF' } }; // Light blue for negative (unusual)
          } else {
            varianceCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.positive } };
          }

          // Borders
          row.eachCell((cell, colNum) => {
            if (colNum <= 10) {
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
            }
          });

          summaryRow++;
        });

        // Total row
        // Expected Consumption = Opening + Dispensed - Closing
        const totalExpectedConsumption = totalOpeningStock + totalManualDisp - totalClosingStock;

        // Total Variance = Opening + Cat1 Dispensed - Other Cats Dispensed - GPS Consumed - Closing
        // For Cat1 totals, we account for fuel dispensed to other categories
        const totalVarianceCalc = totalOpeningStock + totalManualDisp - otherCatsDispensed - totalGpsCons - totalClosingStock;
        const totalVarPctCalc = totalManualDisp !== 0 ? ((totalVarianceCalc / totalManualDisp) * 100) : 0;

        const totRow = summarySheet.addRow([
          'TOTAL CAT1 VEHICLES', '', cat1Vehicles.reduce((s, v) => s + (v.refillCount || 0), 0),
          totalManualDisp.toFixed(1),
          totalGpsCons.toFixed(1),
          totalOpeningStock.toFixed(1),
          totalClosingStock.toFixed(1),
          totalExpectedConsumption.toFixed(1),
          totalVarianceCalc.toFixed(1),
          `${totalVarPctCalc.toFixed(1)}%`
        ]);
        styleHeaderRow(totRow, COLORS.grandTotal);

        // Variance coloring for total
        const totVarCell = totRow.getCell(9);
        if (Math.abs(totalVarianceCalc) > 50) {
          totVarCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.negative } };
        } else if (Math.abs(totalVarianceCalc) > 20) {
          totVarCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.yellow } };
        }
        summaryRow++;

        summarySheet.addRow([]);
        summaryRow++;

        // Summary box with correct formula
        summarySheet.addRow(['RECONCILIATION SUMMARY']);
        summarySheet.getRow(summaryRow).font = { bold: true, size: 12 };
        summaryRow++;

        const summaryBoxData = [
          ['Total Cat1 Opening Stock (A)', totalOpeningStock.toFixed(1), 'L'],
          ['Total Cat1 Manual Dispensed (B)', totalManualDisp.toFixed(1), 'L'],
          ['Other Categories Dispensed (C)', otherCatsDispensed.toFixed(1), 'L'],
          ['Total GPS Consumption (D)', totalGpsCons.toFixed(1), 'L'],
          ['Total Cat1 Closing Stock (E)', totalClosingStock.toFixed(1), 'L'],
          ['VARIANCE: A + B - C - D - E', totalVarianceCalc.toFixed(1), 'L'],
          ['Variance %', `${totalVarPctCalc.toFixed(1)}%`, '']
        ];

        summaryBoxData.forEach(([label, value, unit]) => {
          const row = summarySheet.addRow([label, value, unit]);
          row.getCell(1).font = { bold: label.includes('VARIANCE') };
          row.getCell(2).font = { bold: true };
          if (label.includes('VARIANCE')) {
            row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0B2' } };
            row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0B2' } };
            if (totalVarianceCalc > 50) {
              row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.negative } };
            }
          }
          summaryRow++;
        });
      } else {
        summarySheet.addRow(['No Cat1 (GPS Site Fleet) vehicles found']);
        summaryRow++;
      }

      summarySheet.addRow([]);
      summarySheet.addRow([]);
      summaryRow += 2;

      // ========================================
      // TANK RECONCILIATION SUMMARY
      // ========================================
      summarySheet.addRow(['TANK STOCK RECONCILIATION']);
      summarySheet.getRow(summaryRow).font = { bold: true, size: 14 };
      summaryRow++;

      summarySheet.addRow(['Expected = Opening + Deliveries + TransIn - TransOut - Cat1Disp - OtherCatsDisp']);
      summarySheet.getRow(summaryRow).font = { italic: true, size: 10, color: { argb: 'FF666666' } };
      summaryRow++;

      summarySheet.addRow(['Adjusted = Tank Closing + Other Categories Dispensed | Variance = Expected - Adjusted']);
      summarySheet.getRow(summaryRow).font = { italic: true, size: 10, color: { argb: 'FF666666' } };
      summaryRow++;

      summarySheet.addRow([]);
      summaryRow++;

      // Calculate category dispensed totals
      const cat1TotalDispensed = selectedVehicles
        .filter(v => v.vehicleCategory === 1)
        .reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0);

      const otherCatsTotalDispensed = selectedVehicles
        .filter(v => v.vehicleCategory !== 1)
        .reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0);

      // For each tank, show reconciliation with adjusted closing
      tankPreview.forEach(tank => {
        const tankName = tank.tankName || 'Unknown Tank';

        // Tank header row
        const tankHeaderRow = summarySheet.addRow([
          `🛢️ ${tankName}`, '', '', '', '', '', '', '', '', ''
        ]);
        tankHeaderRow.font = { bold: true, size: 12, color: { argb: COLORS.headerText } };
        tankHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.tankHeader } };
        summarySheet.mergeCells(summaryRow, 1, summaryRow, 10);
        summaryRow++;

        // Column headers
        const reconHeader = summarySheet.addRow([
          'Opening', 'Deliveries', 'Trans In', 'Trans Out', 'Cat1 Disp.', 'Other Cats', '= Expected', 'Tank Closing', '= Adjusted', 'Variance'
        ]);
        styleHeaderRow(reconHeader, COLORS.tankHeader);
        summaryRow++;

        // Calculate
        // Expected = Opening + Deliveries + TransIn - TransOut - Cat1Dispensed - OtherCatsDispensed
        const expectedClosing = (tank.openingStock || 0)
          + (tank.totalDeliveries || 0)
          + (tank.totalTransfersIn || 0)
          - (tank.totalTransfersOut || 0)
          - cat1TotalDispensed
          - otherCatsTotalDispensed;

        // Adjusted Actual = Tank Closing Stock + Other Categories Dispensed
        const adjustedActual = (tank.closingStock || 0) + otherCatsTotalDispensed;

        // Variance = Expected - Adjusted Actual
        const tankVarianceVal = expectedClosing - adjustedActual;

        const dataRow = summarySheet.addRow([
          tank.openingStock || 0,
          tank.totalDeliveries || 0,
          tank.totalTransfersIn || 0,
          tank.totalTransfersOut || 0,
          cat1TotalDispensed.toFixed(1),
          otherCatsTotalDispensed.toFixed(1),
          expectedClosing.toFixed(1),
          tank.closingStock || 0,
          adjustedActual.toFixed(1),
          tankVarianceVal.toFixed(1)
        ]);

        dataRow.getCell(5).font = { color: { argb: 'FFFF0000' } }; // Red for Cat1 dispensed
        dataRow.getCell(6).font = { color: { argb: 'FFFF6600' } }; // Orange for other cats dispensed
        dataRow.getCell(7).font = { bold: true };
        dataRow.getCell(8).font = { bold: true };
        dataRow.getCell(9).font = { bold: true };

        // Variance coloring
        const varCell = dataRow.getCell(10);
        varCell.font = { bold: true };
        if (Math.abs(tankVarianceVal) > 50) {
          varCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.negative } };
        } else if (Math.abs(tankVarianceVal) > 20) {
          varCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.yellow } };
        } else {
          varCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.positive } };
        }

        // Borders
        dataRow.eachCell((cell, colNum) => {
          if (colNum <= 10) {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          }
        });

        summaryRow++;
        summarySheet.addRow([]);
        summaryRow++;
      });

      // Set summary column widths
      summarySheet.columns = [
        { width: 22 }, { width: 14 }, { width: 12 }, { width: 12 }, { width: 16 },
        { width: 14 }, { width: 14 }, { width: 16 }, { width: 12 }, { width: 10 }
      ];

      // ========================================
      // SHEETS 2+: ONE SHEET PER TANK
      // ========================================
      tankPreview.forEach((tank, tankIndex) => {
        const tankName = tank.tankName || `Tank ${tankIndex + 1}`;
        const sheetName = tankName.substring(0, 31); // Excel limit
        const sheet = workbook.addWorksheet(sheetName);
        let currentRow = 1;

        // TANK HEADER
        const tankTitleRow = sheet.addRow([
          `🛢️ ${tankName}`, '', '', `Period: ${periodStart} to ${periodEnd}`, '', '', '', `Capacity: ${tank.tankCapacity || 0}`
        ]);
        styleHeaderRow(tankTitleRow, COLORS.tankHeader);
        sheet.mergeCells(currentRow, 1, currentRow, 3);
        sheet.mergeCells(currentRow, 4, currentRow, 7);
        currentRow++;

        // Tank details header
        const tankDetailHeader = sheet.addRow([
          'Opening Date', 'Dispensed', 'Transfer In', 'Transfer Out', 'Closing Date', 'Opening', 'Closing', ''
        ]);
        styleHeaderRow(tankDetailHeader, COLORS.tankHeader);
        currentRow++;

        // Tank details data
        sheet.addRow([
          periodStart,
          tank.totalDispensed || 0,
          tank.totalTransfersIn || 0,
          tank.totalTransfersOut || 0,
          periodEnd,
          tank.openingStock || 0,
          tank.closingStock || 0,
          ''
        ]);
        currentRow++;

        // Tank variance row
        const expected = (tank.openingStock || 0) + (tank.totalDeliveries || 0) +
                        (tank.totalTransfersIn || 0) - (tank.totalTransfersOut || 0) - (tank.totalDispensed || 0);
        const tankVariance = (tank.closingStock || 0) - expected;
        const tankVarPct = expected !== 0 ? ((tankVariance / expected) * 100) : 0;

        const varianceRow = sheet.addRow([
          'Tank Variance:', `Expected: ${expected.toFixed(1)}L`, `Actual: ${(tank.closingStock || 0).toFixed(1)}L`,
          '', `Variance: ${tankVariance.toFixed(1)}L`, `(${tankVarPct.toFixed(1)}%)`, '', ''
        ]);
        varianceRow.font = { bold: true };
        if (Math.abs(tankVariance) > 50) {
          varianceRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.negative } };
        }
        currentRow++;

        sheet.addRow([]);
        currentRow++;

        // Filter vehicles to only include those with refills from THIS tank
        // And recalculate their totals based only on refills from this tank
        const tankId = tank.tankId;
        const tankVehicles = selectedVehicles
          .map(vehicle => {
            // Filter manual refills for this specific tank
            const tankRefills = (vehicle.refills || []).filter(r =>
              r.tankId === tankId || r.tankName === tankName
            );

            if (tankRefills.length === 0) {
              return null; // Vehicle has no refills from this tank
            }

            // Calculate fuel dispensed from OTHER tanks (not this tank)
            const otherTanksRefills = (vehicle.refills || []).filter(r =>
              r.tankId !== tankId && r.tankName !== tankName
            );
            const fuelFromOtherTanks = otherTanksRefills.reduce((sum, r) => sum + (r.fuelAmount || 0), 0);

            // For GPS categories (1 and 4), we need to match GPS refill events
            // with manual refills from this tank by date
            const isGpsCategory = vehicle.vehicleCategory === 1 || vehicle.vehicleCategory === 4;
            let tankGpsRefillEvents = [];

            if (isGpsCategory && vehicle.gpsRefillEvents) {
              // Get dates of refills from this tank
              const tankRefillDates = new Set(
                tankRefills.map(r => new Date(r.refillDate).toISOString().split('T')[0])
              );

              // Filter GPS events that match dates of refills from this tank
              tankGpsRefillEvents = (vehicle.gpsRefillEvents || []).filter(gpsEvent => {
                const gpsDate = new Date(gpsEvent.refillDate).toISOString().split('T')[0];
                return tankRefillDates.has(gpsDate);
              });
            }

            // Recalculate totals for this tank only
            const tankTotalFuelAmount = tankRefills.reduce((sum, r) => sum + (r.fuelAmount || 0), 0);
            const tankRefillCount = tankRefills.length;

            // Calculate GPS consumption for this tank based on matched GPS events
            const tankGpsConsumption = tankGpsRefillEvents.reduce((sum, e) => sum + (e.gpsRefillVolume || 0), 0);

            // Adjusted closing = Vehicle Closing - Fuel from Other Tanks
            // This represents the closing stock attributable to this tank's dispensing
            const originalClosing = vehicle.closingFuel || 0;
            const adjustedClosing = originalClosing - fuelFromOtherTanks;

            return {
              ...vehicle,
              refills: tankRefills,
              gpsRefillEvents: tankGpsRefillEvents,
              totalFuelAmount: tankTotalFuelAmount,
              refillCount: tankRefillCount,
              // Store both original and adjusted closing
              originalClosingFuel: originalClosing,
              closingFuel: adjustedClosing,  // Use adjusted closing for this tank
              fuelFromOtherTanks: fuelFromOtherTanks,
              // Override GPS consumption with tank-specific calculation
              gpsMeasuredConsumption: isGpsCategory ? tankGpsConsumption : (vehicle.gpsMeasuredConsumption || 0)
            };
          })
          .filter(v => v !== null);

        // Pre-calculate dispensed totals for each category (needed for reconciliation)
        const categoryDispensed = {};
        const categoryOrder = [1, 4, 2, 5, 3]; // Order as in your images
        categoryOrder.forEach(catId => {
          const catVehicles = tankVehicles.filter(v => v.vehicleCategory === catId);
          categoryDispensed[catId] = catVehicles.reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0);
        });

        // Process each category
        categoryOrder.forEach(catId => {
          const catVehicles = tankVehicles.filter(v => v.vehicleCategory === catId);
          if (catVehicles.length === 0) return;

          const config = CATEGORY_CONFIG[catId];
          const catColors = CATEGORY_COLORS[catId];
          const catStartRow = currentRow;

          // CATEGORY HEADER (collapsible group start)
          const catHeaderRow = sheet.addRow([
            `📁 Category ${catId}: ${config.name}`, '', `${config.description}`, '', '',
            `Vehicles: ${catVehicles.length}`, '', `Confidence: ${config.confidence}`
          ]);
          styleHeaderRow(catHeaderRow, catColors.header);
          sheet.mergeCells(currentRow, 1, currentRow, 2);
          sheet.mergeCells(currentRow, 3, currentRow, 5);
          currentRow++;

          // Note: We don't show Category Summary with GPS Consumed/Variance on tank-specific worksheets
          // because GPS consumption is a vehicle-level total that spans all tanks.
          // The Executive Summary shows the proper variance calculation with all tanks combined.

          sheet.addRow([]);
          currentRow++;

          // Define columns based on category
          // For tank worksheets: show only tank-specific data (refills, manual dispensed)
          // GPS Consumed, Opening, Closing are vehicle-level values shown for reference only
          let vehicleColumns;
          if (catId === 1 || catId === 4) {
            // GPS categories - show reference data but note that GPS values are vehicle totals
            vehicleColumns = ['Vehicle', 'Type', 'Refills', 'Manual Disp.', '', '', '', ''];
          } else if (catId === 2) {
            // Full Tank - Tank Capacity, no Opening/Closing
            vehicleColumns = ['Vehicle', 'Type', 'Tank Cap.', 'Refills', 'Manual Dispensed', '', '', ''];
          } else if (catId === 5) {
            // External - with Owner
            vehicleColumns = ['Vehicle', 'Type', 'Owner', 'Refills', 'Manual Dispensed', '', '', ''];
          } else {
            // Equipment (Cat 3)
            vehicleColumns = ['Vehicle', 'Type', 'Refills', 'Manual Dispensed', '', '', '', ''];
          }

          let catTotalManualDisp = 0;

          // Process each vehicle
          catVehicles.forEach(vehicle => {
            const vManualDisp = vehicle.totalFuelAmount || 0;

            catTotalManualDisp += vManualDisp;

            // VEHICLE COLUMN HEADER ROW (repeat for each vehicle)
            const colHeaderRow = sheet.addRow(vehicleColumns);
            styleHeaderRow(colHeaderRow, catColors.header);
            currentRow++;

            // VEHICLE DATA ROW (with background color)
            // For tank worksheets: only show tank-specific data (refills from this tank, manual dispensed from this tank)
            let vehicleData;
            if (catId === 1 || catId === 4) {
              vehicleData = [
                vehicle.vehicleNo || '',
                vehicle.vehicleTypeName || '',
                vehicle.refillCount || 0,
                vManualDisp,
                '', '', '', ''
              ];
            } else if (catId === 2) {
              vehicleData = [
                vehicle.vehicleNo || '',
                vehicle.vehicleTypeName || '',
                vehicle.tankCapacity || 0,
                vehicle.refillCount || 0,
                vManualDisp,
                '', '', ''
              ];
            } else if (catId === 5) {
              vehicleData = [
                vehicle.vehicleNo || '',
                vehicle.vehicleTypeName || '',
                vehicle.ownerName || vehicle.externalOwner || '',
                vehicle.refillCount || 0,
                vManualDisp,
                '', '', ''
              ];
            } else {
              vehicleData = [
                vehicle.vehicleNo || '',
                vehicle.vehicleTypeName || '',
                vehicle.refillCount || 0,
                vManualDisp,
                '', '', '', ''
              ];
            }

            const vRow = sheet.addRow(vehicleData);
            styleVehicleRow(vRow, catColors.vehicle);
            currentRow++;

            // REFILL DETAILS (grouped under vehicle for collapsing)
            // For GPS categories (1 and 4), merge GPS events with manual refills
            // For other categories, use manual refills directly
            const isGpsCategory = catId === 1 || catId === 4;
            let refills;
            if (isGpsCategory) {
              const gpsEvents = vehicle.gpsRefillEvents || [];
              const manualRefillsList = vehicle.refills || [];
              refills = mergeGpsAndManualRefills(gpsEvents, manualRefillsList);
            } else {
              refills = vehicle.refills || [];
            }

            if (refills.length > 0) {
              // Refill header
              let refillColumns;
              if (isGpsCategory) {
                refillColumns = ['Date', 'Tank', 'GPS Dispensed', 'Manual Disp.', 'Variance', 'Var %', '', ''];
              } else {
                refillColumns = ['Date', 'Tank', 'Manual Dispensed', '', '', '', '', ''];
              }

              const refillHeaderRow = sheet.addRow(refillColumns);
              refillHeaderRow.font = { bold: true, size: 10 };
              refillHeaderRow.eachCell((cell, colNum) => {
                if (isGpsCategory ? colNum <= 6 : colNum <= 3) {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.refillHeader } };
                }
              });
              currentRow++;

              let refillTotalManual = 0;
              let refillTotalGps = 0;

              // Refill data rows
              refills.forEach(refill => {
                // For GPS categories, gpsRefillVolume is the GPS-measured amount
                // manualRefillAmount or fuelAmount is the manual amount
                const rGps = refill.gpsRefillVolume || 0;
                const rManual = refill.manualRefillAmount || refill.fuelAmount || 0;
                const rVariance = rManual - rGps;
                const rVarPct = rManual !== 0 ? ((rVariance / rManual) * 100) : 0;
                const refillTankName = refill.tankName || tankName;

                refillTotalManual += rManual;
                refillTotalGps += rGps;

                let refillData;
                if (isGpsCategory) {
                  refillData = [
                    refill.refillDate ? new Date(refill.refillDate).toISOString().split('T')[0] : '',
                    refillTankName,
                    rGps,
                    rManual,
                    rVariance,
                    `${rVarPct.toFixed(1)}%`,
                    '', ''
                  ];
                } else {
                  // For non-GPS categories, use fuelAmount as manual dispensed
                  const manualAmt = refill.fuelAmount || 0;
                  refillData = [
                    refill.refillDate ? new Date(refill.refillDate).toISOString().split('T')[0] : '',
                    refillTankName,
                    manualAmt,
                    '', '', '', '', ''
                  ];
                }

                const rRow = sheet.addRow(refillData);
                rRow.font = { size: 10 };
                rRow.getCell(3).font = { color: { argb: 'FF00B050' }, size: 10 }; // Green
                if (isGpsCategory) {
                  rRow.getCell(4).font = { color: { argb: 'FF00B050' }, size: 10 }; // Green
                  if (Math.abs(rVariance) > 10) {
                    rRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.yellow } };
                  }
                }
                // Set row outline level for grouping (collapsible)
                sheet.getRow(currentRow).outlineLevel = 2;
                currentRow++;
              });

              // REFILL TOTAL ROW
              let refillTotalData;
              const refillVariance = refillTotalManual - refillTotalGps;
              const refillVarPct = refillTotalManual !== 0 ? ((refillVariance / refillTotalManual) * 100) : 0;

              if (isGpsCategory) {
                refillTotalData = [
                  '', 'TOTAL:', refillTotalGps.toFixed(1), refillTotalManual.toFixed(1),
                  refillVariance.toFixed(1), `${refillVarPct.toFixed(1)}%`, '', ''
                ];
              } else {
                refillTotalData = [
                  '', 'TOTAL:', refillTotalManual.toFixed(1), '', '', '', '', ''
                ];
              }

              const refillTotalRow = sheet.addRow(refillTotalData);
              refillTotalRow.font = { bold: true, size: 10 };
              refillTotalRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.refillHeader } };
              refillTotalRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.refillHeader } };
              if (isGpsCategory) {
                refillTotalRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.refillHeader } };
                refillTotalRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.refillHeader } };
                refillTotalRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.refillHeader } };
              }
              sheet.getRow(currentRow).outlineLevel = 2;
              currentRow++;
            }

            sheet.addRow([]);
            sheet.getRow(currentRow).outlineLevel = 1; // Group under category
            currentRow++;
          });

          // CATEGORY TOTAL ROW - for tank worksheets, only show manual dispensed from this tank
          const catTotalData = [
            `Category ${catId} Total (${catVehicles.length} vehicles)`, '', '',
            `Manual Dispensed: ${catTotalManualDisp.toFixed(1)}L`, '', '', '', ''
          ];

          const catTotalRowEl = sheet.addRow(catTotalData);
          styleHeaderRow(catTotalRowEl, COLORS.categoryTotal);
          currentRow++;

          // ===================================
          // CATEGORY RECONCILIATION TABLE
          // Shows: Opening + Delivery + TransferIn - CatDispensed - TransferOut = Expected
          // Compare with: Closing + OtherCategoriesDispensed
          // ===================================
          sheet.addRow([]);
          currentRow++;

          // Calculate other categories' dispensed (excluding current category)
          const otherCatsDispensed = Object.entries(categoryDispensed)
            .filter(([key]) => parseInt(key) !== catId)
            .reduce((sum, [, val]) => sum + val, 0);

          // Calculate expected closing based on this category's dispensing
          const catExpectedClosing = (tank.openingStock || 0)
            + (tank.totalDeliveries || 0)
            + (tank.totalTransfersIn || 0)
            - catTotalManualDisp
            - (tank.totalTransfersOut || 0);

          // What we should see: Closing Stock + Other Categories Dispensed
          const actualPlusOthers = (tank.closingStock || 0) + otherCatsDispensed;

          // Variance for this category
          const catReconcileVariance = catExpectedClosing - actualPlusOthers;

          // Reconciliation Header
          const reconHeaderRow = sheet.addRow([
            `📊 Cat ${catId} Reconciliation`, '', '', '', '', '', '', ''
          ]);
          reconHeaderRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
          reconHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: catColors.header.replace('#', '') } };
          sheet.mergeCells(currentRow, 1, currentRow, 8);
          currentRow++;

          // Left side calculation header
          const reconCalcHeaderRow = sheet.addRow([
            'Opening', 'Delivery', 'Transfer In', `Cat${catId} Disp.`, 'Transfer Out', '= Expected', '', ''
          ]);
          reconCalcHeaderRow.font = { bold: true, size: 10 };
          reconCalcHeaderRow.eachCell((cell, colNum) => {
            if (colNum <= 6) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
              cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            }
          });
          currentRow++;

          // Left side calculation values
          const reconCalcValuesRow = sheet.addRow([
            (tank.openingStock || 0).toFixed(1),
            `+${(tank.totalDeliveries || 0).toFixed(1)}`,
            `+${(tank.totalTransfersIn || 0).toFixed(1)}`,
            `-${catTotalManualDisp.toFixed(1)}`,
            `-${(tank.totalTransfersOut || 0).toFixed(1)}`,
            `=${catExpectedClosing.toFixed(1)}`,
            '', ''
          ]);
          reconCalcValuesRow.eachCell((cell, colNum) => {
            if (colNum <= 6) {
              cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            }
            if (colNum === 4) cell.font = { color: { argb: 'FFFF0000' } }; // Red for dispensed
            if (colNum === 5) cell.font = { color: { argb: 'FFFF0000' } }; // Red for transfer out
            if (colNum === 2 || colNum === 3) cell.font = { color: { argb: 'FF00B050' } }; // Green for additions
            if (colNum === 6) cell.font = { bold: true };
          });
          currentRow++;

          // Right side comparison header
          const reconCompHeaderRow = sheet.addRow([
            'Closing', 'Other Cats Disp.', '= Actual+Others', 'VARIANCE', '', '', '', ''
          ]);
          reconCompHeaderRow.font = { bold: true, size: 10 };
          reconCompHeaderRow.eachCell((cell, colNum) => {
            if (colNum <= 4) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
              cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            }
          });
          currentRow++;

          // Right side comparison values
          const reconCompValuesRow = sheet.addRow([
            (tank.closingStock || 0).toFixed(1),
            `+${otherCatsDispensed.toFixed(1)}`,
            `=${actualPlusOthers.toFixed(1)}`,
            catReconcileVariance.toFixed(1),
            '', '', '', ''
          ]);
          reconCompValuesRow.eachCell((cell, colNum) => {
            if (colNum <= 4) {
              cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            }
            if (colNum === 2) cell.font = { color: { argb: 'FF00B050' } }; // Green for other cats
            if (colNum === 3) cell.font = { bold: true };
            if (colNum === 4) {
              cell.font = { bold: true };
              if (Math.abs(catReconcileVariance) > 50) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.negative } };
              } else if (Math.abs(catReconcileVariance) > 10) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.yellow } };
              } else {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.positive } };
              }
            }
          });
          currentRow++;

          sheet.addRow([]);
          currentRow++;

          // Set outline level for category grouping
          for (let i = catStartRow + 1; i < currentRow - 1; i++) {
            if (sheet.getRow(i).outlineLevel === undefined || sheet.getRow(i).outlineLevel < 1) {
              sheet.getRow(i).outlineLevel = 1;
            }
          }
        });

        // TANK TOTAL ROW
        const allTankVehicleCount = tankVehicles.length;
        const totalCalcDispensed = tankVehicles.reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0);
        const tankRecordDispensed = tank.totalDispensed || 0;
        const tankDiff = totalCalcDispensed - tankRecordDispensed;

        const tankTotalRowEl = sheet.addRow([
          `TANK TOTAL: ${tankName}`, `Vehicles: ${allTankVehicleCount}`, '',
          `Calculated: ${totalCalcDispensed.toFixed(1)}L`, `Tank Record: ${tankRecordDispensed.toFixed(1)}L`,
          `Diff: ${tankDiff.toFixed(1)}L`, '', ''
        ]);
        styleHeaderRow(tankTotalRowEl, COLORS.grandTotal);
        currentRow++;

        sheet.addRow([]);
        currentRow++;

        // GRAND TOTAL ROW
        const grandTotalRowEl = sheet.addRow([
          '🏁 GRAND TOTAL - ALL CATEGORIES', '', '',
          `Total Fuel Dispensed: ${totalCalcDispensed.toFixed(1)} Liters`, '', '', '', ''
        ]);
        styleHeaderRow(grandTotalRowEl, COLORS.grandTotal);
        sheet.mergeCells(currentRow, 4, currentRow, 8);

        // Set column widths
        sheet.columns = [
          { width: 20 }, { width: 16 }, { width: 16 }, { width: 16 },
          { width: 16 }, { width: 16 }, { width: 14 }, { width: 12 }
        ];

        // Enable outline/grouping
        sheet.properties.outlineLevelCol = 0;
        sheet.properties.outlineLevelRow = 2;
        sheet.properties.outlineProperties = {
          summaryBelow: false,
          summaryRight: false
        };
      });

      // Generate filename and save
      const fileStartDate = wizard.periodStart
        ? new Date(wizard.periodStart).toISOString().split('T')[0]
        : 'start';
      const fileEndDate = wizard.periodEnd
        ? new Date(wizard.periodEnd).toISOString().split('T')[0]
        : 'end';
      const fileName = `Fuel_Audit_${siteName.replace(/[^a-zA-Z0-9]/g, '_')}_${fileStartDate}_to_${fileEndDate}.xlsx`;

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: 'application/octet-stream' }), fileName);

      notify('Fuel audit report exported successfully!', 'success', 3000);
    } catch (error) {
      console.error('Export error:', error);
      notify('Failed to export report. Please try again.', 'error', 3000);
    }
  }, [wizard, tankPreview, selectedVehicles, vehiclesByCategory, grandTotals]);

  // Render refill details for a vehicle (master-detail)
  const renderRefillDetails = useCallback((vehicle) => {
    const categoryId = vehicle.data?.vehicleCategory || 5;
    const config = CATEGORY_CONFIG[categoryId];

    // For GPS categories (1 and 4), use gpsRefillEvents which has gpsRefillVolume
    // For other categories, use manual refills
    const isGpsCategory = categoryId === 1 || categoryId === 4;

    // For GPS categories, merge GPS events with manual refills to get variance data
    let refills;
    let keyField;

    if (isGpsCategory) {
      const gpsEvents = vehicle.data?.gpsRefillEvents || [];
      const manualRefills = vehicle.data?.refills || [];
      // Merge GPS events with manual refills to populate manualRefillAmount and variance
      refills = mergeGpsAndManualRefills(gpsEvents, manualRefills);
      keyField = 'entryId';
    } else {
      refills = vehicle.data?.refills || [];
      keyField = 'refillId';
    }

    if (refills.length === 0) {
      return (
        <div className="tw-p-4 tw-text-center tw-text-gray-500 tw-bg-gray-50">
          <i className="fa-light fa-inbox tw-mr-2"></i>
          No refill records for this vehicle
        </div>
      );
    }

    return (
      <div className="tw-p-2 tw-bg-gray-50">
        <DataGrid
          dataSource={refills}
          keyExpr={keyField}
          showBorders={true}
          columnAutoWidth={true}
          rowAlternationEnabled={true}
          height="auto"
          width="100%"
          allowColumnResizing={true}
          columnResizingMode="nextColumn"
        >
          <Paging enabled={true} pageSize={5} />
          <Scrolling mode="standard" />

          <Column
            dataField="refillDate"
            caption="Date"
            width={100}
            dataType="date"
            format="dd/MM/yyyy"
            sortOrder="desc"
          />
          <Column
            dataField="tankName"
            caption="Tank"
            width={120}
          />
          {config.showGpsDispensed && (
            <Column
              dataField="gpsRefillVolume"
              caption="GPS Dispensed"
              width={110}
              dataType="number"
              alignment="right"
              cellRender={(cellData) => (
                <span className="tw-font-medium tw-text-blue-600">
                  +{formatNumber(cellData.value)}
                </span>
              )}
            />
          )}
          <Column
            dataField={config.showGpsDispensed ? "manualRefillAmount" : "fuelAmount"}
            caption="Manual Disp."
            width={110}
            dataType="number"
            alignment="right"
            calculateCellValue={(rowData) => {
              // For GPS categories, use manualRefillAmount; for others, use fuelAmount
              return rowData.manualRefillAmount || rowData.fuelAmount || 0;
            }}
            cellRender={(cellData) => (
              <span className="tw-font-medium tw-text-green-600">
                +{formatNumber(cellData.value)}
              </span>
            )}
          />
          {config.showGpsDispensed && (
            <Column
              caption="Variance"
              width={90}
              alignment="right"
              calculateCellValue={(rowData) => {
                const gps = rowData.gpsRefillVolume || 0;
                const manual = rowData.manualRefillAmount || rowData.fuelAmount || 0;
                return manual - gps;
              }}
              cellRender={(cellData) => {
                const value = cellData.value || 0;
                return (
                  <span className={`tw-font-medium tw-px-2 tw-py-0.5 tw-rounded ${getVarianceClass(value)}`}>
                    {value >= 0 ? '+' : ''}{formatNumber(value)}
                  </span>
                );
              }}
            />
          )}
          <Column
            dataField="operatorName"
            caption="Operator"
            width={120}
          />
        </DataGrid>
      </div>
    );
  }, []);

  // Render vehicle grid for a category
  const renderCategoryVehicles = useCallback((categoryId) => {
    const vehicles = vehiclesByCategory[categoryId] || [];
    const config = CATEGORY_CONFIG[categoryId];

    if (vehicles.length === 0) return null;

    return (
      <DataGrid
        dataSource={vehicles}
        keyExpr="vehicleId"
        showBorders={true}
        columnAutoWidth={true}
        rowAlternationEnabled={true}
        height="auto"
        width="100%"
        allowColumnResizing={true}
        columnResizingMode="nextColumn"
        columnMinWidth={50}
      >
        <Paging enabled={true} pageSize={10} />
        <Scrolling mode="standard" />
        <MasterDetail
          enabled={true}
          render={renderRefillDetails}
        />

        <Column dataField="vehicleNo" caption="Vehicle" width={100} />
        <Column dataField="vehicleTypeName" caption="Type" width={100} />
        <Column
          dataField="refillCount"
          caption="Refills"
          width={70}
          alignment="center"
          cellRender={(cellData) => (
            <span className="tw-px-2 tw-py-0.5 tw-rounded tw-bg-gray-100 tw-text-gray-700 tw-text-xs">
              {cellData.value || 0}
            </span>
          )}
        />

        {config.showOpeningClosing && (
          <Column
            dataField="openingFuel"
            caption="Opening (L)"
            width={100}
            dataType="number"
            alignment="right"
            cellRender={(cellData) => (
              <span className="tw-text-gray-700">
                {formatNumber(cellData.value, 0)}
              </span>
            )}
          />
        )}

        <Column
          dataField="totalFuelAmount"
          caption="Manual Disp."
          width={100}
          dataType="number"
          alignment="right"
          cellRender={(cellData) => (
            <span className="tw-font-medium tw-text-green-600">
              +{formatNumber(cellData.value, 0)}
            </span>
          )}
        />

        {config.showGpsConsumption && (
          <Column
            dataField="gpsMeasuredConsumption"
            caption="Vehicle Consumption (GPS)"
            width={140}
            dataType="number"
            alignment="right"
            cellRender={(cellData) => {
              const value = cellData.value;
              if (value === null || value === undefined) {
                return <span className="tw-text-gray-400">-</span>;
              }
              return (
                <span className="tw-font-medium tw-text-blue-600">
                  -{formatNumber(Math.abs(value), 0)}
                </span>
              );
            }}
          />
        )}

        {config.showOpeningClosing && (
          <Column
            dataField="closingFuel"
            caption="Closing (L)"
            width={100}
            dataType="number"
            alignment="right"
            cellRender={(cellData) => (
              <span className="tw-text-gray-700">
                {formatNumber(cellData.value, 0)}
              </span>
            )}
          />
        )}

        {config.showGpsConsumption && (
          <Column
            caption="Variance"
            width={90}
            alignment="right"
            calculateCellValue={(rowData) => {
              const dispensed = rowData.totalFuelAmount || 0;
              const consumed = Math.abs(rowData.gpsMeasuredConsumption || 0);
              return dispensed - consumed;
            }}
            cellRender={(cellData) => {
              const value = cellData.value || 0;
              return (
                <span className={`tw-font-medium tw-px-2 tw-py-0.5 tw-rounded ${getVarianceClass(value, [10, 50])}`}>
                  {value >= 0 ? '+' : ''}{formatNumber(value, 0)}
                </span>
              );
            }}
          />
        )}

        <Summary>
          <TotalItem
            column="refillCount"
            summaryType="sum"
            displayFormat="Total: {0}"
          />
          <TotalItem
            column="totalFuelAmount"
            summaryType="sum"
            valueFormat="#,##0.0"
            displayFormat="{0} L"
          />
          {config.showGpsConsumption && (
            <TotalItem
              column="gpsMeasuredConsumption"
              summaryType="sum"
              valueFormat="#,##0.0"
              displayFormat="{0} L"
            />
          )}
        </Summary>
      </DataGrid>
    );
  }, [vehiclesByCategory, renderRefillDetails]);

  // Render category section
  const renderCategorySection = useCallback((categoryId) => {
    const vehicles = vehiclesByCategory[categoryId] || [];
    const config = CATEGORY_CONFIG[categoryId];
    const totals = categoryTotals[categoryId];
    const isExpanded = expandedCategories[categoryId];

    if (vehicles.length === 0) return null;

    return (
      <div key={categoryId} className={`tw-border tw-rounded-lg tw-overflow-hidden tw-mb-3 ${config.borderColor}`}>
        {/* Category Header */}
        <button
          className={`tw-w-full tw-px-4 tw-py-3 ${config.bgColor} tw-flex tw-items-center tw-justify-between tw-transition-colors hover:tw-opacity-90`}
          onClick={() => toggleCategory(categoryId)}
        >
          <div className="tw-flex tw-items-center tw-gap-3">
            <i className={`fa-light ${config.icon} ${config.textColor} tw-text-lg`}></i>
            <span className={`tw-font-semibold ${config.textColor}`}>
              Category {categoryId}: {config.name}
            </span>
            <span className={`tw-px-2 tw-py-0.5 tw-rounded tw-text-xs ${getConfidenceBadge(config.confidence)}`}>
              {config.confidence}
            </span>
            <span className="tw-text-gray-500 tw-text-sm">
              ({vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''})
            </span>
          </div>
          <div className="tw-flex tw-items-center tw-gap-4">
            <span className="tw-text-sm tw-text-gray-600">
              Dispensed: <span className="tw-font-semibold tw-text-green-700">+{formatNumber(totals.totalDispensed, 0)} L</span>
            </span>
            {config.showGpsConsumption && totals.variance !== undefined && (
              <span className={`tw-text-sm tw-px-2 tw-py-0.5 tw-rounded ${getVarianceClass(totals.variance, [50, 100])}`}>
                Variance: {totals.variance >= 0 ? '+' : ''}{formatNumber(totals.variance, 0)} L
              </span>
            )}
            <i className={`fa-light fa-chevron-${isExpanded ? 'up' : 'down'} tw-text-gray-400`}></i>
          </div>
        </button>

        {/* Category Description */}
        {isExpanded && (
          <div className="tw-px-4 tw-py-2 tw-bg-gray-50 tw-border-b tw-text-xs tw-text-gray-500">
            <i className="fa-light fa-info-circle tw-mr-1"></i>
            {config.description}
          </div>
        )}

        {/* Vehicle Grid */}
        {isExpanded && (
          <div className="tw-border-t">
            {renderCategoryVehicles(categoryId)}
          </div>
        )}

        {/* Category Subtotal */}
        {isExpanded && (
          <div className={`tw-px-4 tw-py-2 tw-border-t ${config.bgColor} tw-flex tw-justify-between tw-items-center`}>
            <span className={`tw-font-semibold tw-text-sm ${config.textColor}`}>
              {config.name} Total ({vehicles.length} vehicles)
            </span>
            <div className="tw-flex tw-gap-4 tw-text-sm">
              <span>
                Manual Disp.: <span className="tw-font-bold tw-text-green-700">{formatNumber(totals.totalDispensed, 0)} L</span>
              </span>
              {config.showGpsConsumption && (
                <>
                  <span>
                    GPS Consumed: <span className="tw-font-bold tw-text-blue-700">{formatNumber(Math.abs(totals.totalGpsConsumption), 0)} L</span>
                  </span>
                  <span className={`tw-px-2 tw-py-0.5 tw-rounded ${getVarianceClass(totals.variance, [50, 100])}`}>
                    Variance: {totals.variance >= 0 ? '+' : ''}{formatNumber(totals.variance, 0)} L
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }, [vehiclesByCategory, categoryTotals, expandedCategories, toggleCategory, renderCategoryVehicles]);

  // Render tank section
  const renderTankSection = useCallback((tank) => {
    const isExpanded = expandedTanks[tank.tankId];

    // Calculate tank variance
    const expectedClosing = (tank.openingStock || 0) + (tank.totalDeliveries || 0) + (tank.totalTransfersIn || 0)
                          - (tank.totalDispensed || 0) - (tank.totalTransfersOut || 0);
    const tankVariance = (tank.closingStock || 0) - expectedClosing;

    return (
      <div key={tank.tankId} className="tw-border tw-rounded-lg tw-overflow-hidden tw-mb-4 tw-border-blue-300">
        {/* Tank Header */}
        <button
          className="tw-w-full tw-px-4 tw-py-3 tw-bg-blue-800 tw-text-white tw-flex tw-items-center tw-justify-between hover:tw-bg-blue-700 tw-transition-colors"
          onClick={() => toggleTank(tank.tankId)}
        >
          <div className="tw-flex tw-items-center tw-gap-3">
            <i className="fa-light fa-oil-can tw-text-xl"></i>
            <span className="tw-font-bold tw-text-lg">{tank.tankName}</span>
            <span className="tw-text-blue-200 tw-text-sm">
              | {tank.siteName}
            </span>
          </div>
          <div className="tw-flex tw-items-center tw-gap-4">
            <span className="tw-text-blue-200 tw-text-sm">
              Period: {wizard.periodStart} to {wizard.periodEnd}
            </span>
            <i className={`fa-light fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
          </div>
        </button>

        {isExpanded && (
          <>
            {/* Tank Data Row */}
            <div className="tw-bg-blue-600 tw-text-white">
              <div className="tw-grid tw-grid-cols-8 tw-text-center tw-text-xs tw-font-semibold tw-py-2 tw-border-b tw-border-blue-500">
                <div>Opening Date</div>
                <div>Dispensed</div>
                <div>Transfer In</div>
                <div>Transfer Out</div>
                <div>Closing Date</div>
                <div>Opening (L)</div>
                <div>Closing (L)</div>
                <div>Capacity (L)</div>
              </div>
              <div className="tw-grid tw-grid-cols-8 tw-text-center tw-py-2 tw-bg-blue-100 tw-text-gray-800">
                <div className="tw-text-sm">{wizard.periodStart}</div>
                <div className="tw-font-semibold tw-text-red-600">-{formatNumber(tank.totalDispensed, 0)}</div>
                <div className="tw-font-semibold tw-text-green-600">+{formatNumber(tank.totalTransfersIn, 0)}</div>
                <div className="tw-font-semibold tw-text-red-600">-{formatNumber(tank.totalTransfersOut, 0)}</div>
                <div className="tw-text-sm">{wizard.periodEnd}</div>
                <div className="tw-font-semibold">{formatNumber(tank.openingStock, 0)}</div>
                <div className="tw-font-semibold">{formatNumber(tank.closingStock, 0)}</div>
                <div className="tw-text-gray-600">{formatNumber(tank.tankCapacity, 0)}</div>
              </div>
            </div>

            {/* Tank Variance Row */}
            <div className={`tw-px-4 tw-py-2 tw-flex tw-justify-between tw-items-center ${getVarianceClass(tankVariance, [50, 100])}`}>
              <span className="tw-font-semibold">Tank Variance:</span>
              <div className="tw-flex tw-gap-6 tw-text-sm">
                <span>Expected Closing: <span className="tw-font-bold">{formatNumber(expectedClosing, 0)} L</span></span>
                <span>Actual Closing: <span className="tw-font-bold">{formatNumber(tank.closingStock, 0)} L</span></span>
                <span className="tw-font-bold">
                  Variance: {tankVariance >= 0 ? '+' : ''}{formatNumber(tankVariance, 0)} L
                </span>
              </div>
            </div>

            {/* Categories Section */}
            <div className="tw-p-4 tw-bg-white">
              <h4 className="tw-font-semibold tw-text-gray-700 tw-mb-3 tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-truck tw-text-blue-500"></i>
                Vehicle Categories
              </h4>

              {/* Render categories in order: 1, 4, 2, 3, 5 */}
              {[1, 4, 2, 3, 5].map(catId => renderCategorySection(catId))}

              {/* Tank Total */}
              <div className="tw-mt-4 tw-bg-blue-100 tw-rounded-lg tw-p-4 tw-border tw-border-blue-300">
                <div className="tw-flex tw-justify-between tw-items-center">
                  <span className="tw-font-bold tw-text-blue-900">
                    TANK TOTAL: {tank.tankName}
                  </span>
                  <div className="tw-flex tw-gap-6 tw-text-sm">
                    <span>
                      Vehicles: <span className="tw-font-bold">{selectedVehicles.length}</span>
                    </span>
                    <span>
                      Total Dispensed: <span className="tw-font-bold tw-text-green-700">{formatNumber(grandTotals.vehicles.totalDispensed, 0)} L</span>
                    </span>
                    <span>
                      Tank Record: <span className="tw-font-bold">{formatNumber(tank.totalDispensed, 0)} L</span>
                    </span>
                    <span className={`tw-px-2 tw-py-0.5 tw-rounded ${getVarianceClass(grandTotals.vehicles.totalDispensed - tank.totalDispensed, [20, 50])}`}>
                      Diff: {(grandTotals.vehicles.totalDispensed - tank.totalDispensed) >= 0 ? '+' : ''}
                      {formatNumber(grandTotals.vehicles.totalDispensed - tank.totalDispensed, 0)} L
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }, [expandedTanks, wizard.periodStart, wizard.periodEnd, toggleTank, renderCategorySection, selectedVehicles.length, grandTotals]);

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="wizard-step tw-p-4 tw-w-full">
      {/* Header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
        <div className="tw-flex tw-items-center tw-gap-3">
          <i className="fa-light fa-chart-pie tw-text-xl tw-text-blue-600"></i>
          <h3 className="tw-text-lg tw-font-semibold">Comprehensive Fuel Audit Review</h3>
        </div>
        <div className="tw-flex tw-gap-2">
          <Button
            text="Expand All"
            icon="expand"
            type="default"
            stylingMode="outlined"
            onClick={expandAll}
          />
          <Button
            text="Collapse All"
            icon="collapse"
            type="default"
            stylingMode="outlined"
            onClick={collapseAll}
          />
          <Button
            text="Export to Excel"
            icon="exportxlsx"
            type="success"
            stylingMode="contained"
            onClick={handleExportToExcel}
          />
        </div>
      </div>

      {/* Description */}
      <p className="tw-text-sm tw-text-gray-600 tw-mb-4">
        Review the complete fuel audit data combining tank volumes (Step 3) and vehicle dispensing records (Step 5).
        Expand sections to view detailed breakdowns by category and individual vehicles.
      </p>

      {/* Summary Stats */}
      <div className="tw-mb-4 tw-grid tw-grid-cols-2 md:tw-grid-cols-4 lg:tw-grid-cols-6 tw-gap-3">
        <div className="tw-bg-blue-50 tw-p-3 tw-rounded-lg tw-border tw-border-blue-200">
          <p className="tw-text-2xl tw-font-bold tw-text-blue-700">{grandTotals.tanks.count}</p>
          <p className="tw-text-xs tw-text-blue-600">Tanks</p>
        </div>
        <div className="tw-bg-green-50 tw-p-3 tw-rounded-lg tw-border tw-border-green-200">
          <p className="tw-text-2xl tw-font-bold tw-text-green-700">{grandTotals.vehicles.count}</p>
          <p className="tw-text-xs tw-text-green-600">Vehicles</p>
        </div>
        <div className="tw-bg-purple-50 tw-p-3 tw-rounded-lg tw-border tw-border-purple-200">
          <p className="tw-text-2xl tw-font-bold tw-text-purple-700">{grandTotals.vehicles.totalRefills}</p>
          <p className="tw-text-xs tw-text-purple-600">Total Refills</p>
        </div>
        <div className="tw-bg-orange-50 tw-p-3 tw-rounded-lg tw-border tw-border-orange-200">
          <p className="tw-text-2xl tw-font-bold tw-text-orange-700">{formatNumber(grandTotals.tanks.totalDispensed, 0)}</p>
          <p className="tw-text-xs tw-text-orange-600">Tank Dispensed (L)</p>
        </div>
        <div className="tw-bg-cyan-50 tw-p-3 tw-rounded-lg tw-border tw-border-cyan-200">
          <p className="tw-text-2xl tw-font-bold tw-text-cyan-700">{formatNumber(grandTotals.vehicles.totalDispensed, 0)}</p>
          <p className="tw-text-xs tw-text-cyan-600">Vehicle Dispensed (L)</p>
        </div>
        <div className={`tw-p-3 tw-rounded-lg tw-border ${getVarianceClass(grandTotals.vehicles.totalDispensed - grandTotals.tanks.totalDispensed, [20, 50])}`}>
          <p className="tw-text-2xl tw-font-bold">
            {(grandTotals.vehicles.totalDispensed - grandTotals.tanks.totalDispensed) >= 0 ? '+' : ''}
            {formatNumber(grandTotals.vehicles.totalDispensed - grandTotals.tanks.totalDispensed, 0)}
          </p>
          <p className="tw-text-xs">Variance (L)</p>
        </div>
      </div>

      {/* No Data Message */}
      {tankPreview.length === 0 && selectedVehicles.length === 0 && (
        <div className="tw-text-center tw-py-12 tw-bg-gray-50 tw-rounded-lg tw-border">
          <i className="fa-light fa-inbox tw-text-4xl tw-text-gray-300 tw-mb-4"></i>
          <p className="tw-text-gray-500">No data available. Please complete Steps 3 and 5 first.</p>
        </div>
      )}

      {/* Tank Sections */}
      {tankPreview.map(tank => renderTankSection(tank))}

      {/* Grand Total Section */}
      {(tankPreview.length > 0 || selectedVehicles.length > 0) && (
        <div className="tw-bg-blue-900 tw-text-white tw-rounded-lg tw-p-4 tw-mt-4">
          <div className="tw-flex tw-justify-between tw-items-center">
            <div className="tw-flex tw-items-center tw-gap-3">
              <i className="fa-light fa-flag-checkered tw-text-2xl"></i>
              <span className="tw-font-bold tw-text-xl">GRAND TOTAL - ALL CATEGORIES</span>
            </div>
            <div className="tw-text-right">
              <p className="tw-text-2xl tw-font-bold">
                {formatNumber(grandTotals.vehicles.totalDispensed, 0)} Liters
              </p>
              <p className="tw-text-sm tw-text-blue-200">
                Total Fuel Dispensed to {grandTotals.vehicles.count} Vehicles
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="tw-mt-6 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-border">
        <h4 className="tw-font-medium tw-text-gray-700 tw-mb-3">
          <i className="fa-light fa-info-circle tw-mr-2"></i>
          Category Legend
        </h4>
        <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-5 tw-gap-3 tw-text-xs">
          {Object.entries(CATEGORY_CONFIG).map(([catId, config]) => (
            <div key={catId} className={`tw-flex tw-items-center tw-gap-2 tw-p-2 tw-rounded ${config.bgColor}`}>
              <i className={`fa-light ${config.icon} ${config.textColor}`}></i>
              <div>
                <span className={`tw-font-medium ${config.textColor}`}>{config.name}</span>
                <span className={`tw-ml-1 tw-px-1 tw-rounded tw-text-xs ${getConfidenceBadge(config.confidence)}`}>
                  {config.confidence}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default Step6Reconciliation;
