/**
 * File: transactionHubUtils.js
 * Purpose: Utility functions for TransactionHub component
 * Last Modified: 2025-11-26
 */

import { VolumeChangeReasonEnum } from './transactionHubConstants';

/**
 * Get transaction type priority for sorting
 * OpeningStock should come first, ClosingStock should come last
 * @param {number} changeReason - The change reason ID
 * @returns {number} Priority value (lower = earlier in sort order)
 */
export const getTypePriority = (changeReason) => {
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
    default: return 50;
  }
};

/**
 * Sort transactions in logical order per day per tank:
 * Date ASC -> Tank -> OpeningStock -> Operations (by timestamp) -> ClosingStock
 * This fixes legacy data where timestamps may be out of order
 * and ensures each tank's transactions are grouped together within a day
 *
 * @param {Array} transactions - Array of tank volume history records
 * @returns {Array} Sorted array of transactions
 */
export const sortTransactions = (transactions) => {
  if (!transactions || transactions.length === 0) return [];

  return [...transactions].sort((a, b) => {
    // 1. First sort by date (day only)
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
    const priorityA = getTypePriority(a.changeReason);
    const priorityB = getTypePriority(b.changeReason);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // 4. Same type - sort by timestamp
    return new Date(a.timestamp) - new Date(b.timestamp);
  });
};

/**
 * Format timestamp for display (full date and time)
 * @param {Object} cellInfo - DevExtreme cell info object
 * @returns {string} Formatted date string
 */
export const formatTimestamp = (cellInfo) => {
  if (!cellInfo.value) return '';
  const date = new Date(cellInfo.value);
  return isNaN(date.getTime()) ? cellInfo.value : date.toLocaleString();
};

/**
 * Render change reason - just the reason type, no vehicle info
 * @param {Object} cellInfo - DevExtreme cell info object
 * @returns {string} Human-readable reason name
 */
export const renderChangeReason = (cellInfo) => {
  const reason = VolumeChangeReasonEnum.find(r => r.id === cellInfo.value);
  return reason ? reason.name : cellInfo.value;
};

/**
 * Build filters object for API calls
 * @param {Object} options - Filter options
 * @returns {Object} Filters object for API
 */
export const buildFiltersObject = ({
  selectedSiteIds,
  selectedTankIds,
  filterUserId,
  headerStartDate,
  headerEndDate,
  useManualDispensing,
  showGpsVolume
}) => ({
  siteId: selectedSiteIds.length === 1 ? selectedSiteIds[0] : null,
  tankId: selectedTankIds.length === 1 ? selectedTankIds[0] : null,
  siteIds: selectedSiteIds.length > 0 ? selectedSiteIds : null,
  tankIds: selectedTankIds.length > 0 ? selectedTankIds : null,
  recordedBy: filterUserId,
  startDate: headerStartDate?.toISOString(),
  endDate: headerEndDate?.toISOString(),
  includeVehicleNames: true,
  useManualDispensing: useManualDispensing,
  includeGpsData: showGpsVolume
});

/**
 * Format date range for display
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {string} Formatted date range string
 */
export const formatDateRangeDisplay = (startDate, endDate) => {
  if (!startDate || !endDate) return '📅 Today';

  const startDay = startDate.toLocaleDateString();
  const endDay = endDate.toLocaleDateString();

  // Check if it's the same day (single day filter)
  if (startDay === endDay) {
    const today = new Date().toLocaleDateString();
    const isToday = startDay === today;
    return `📅 ${startDay}${isToday ? ' (Today)' : ''}`;
  } else {
    return `📅 ${startDay} - ${endDay}`;
  }
};

/**
 * Calculate custom summary for dispensing totals
 * @param {Object} options - DevExtreme summary options
 * @param {boolean} showDispensingTotal - Whether to show dispensing totals
 */
export const calculateDispensingCustomSummary = (options, showDispensingTotal) => {
  if (showDispensingTotal && (options.name === 'GroupDispensing' || options.name === 'TotalDispensing')) {
    if (options.summaryProcess === 'start') {
      options.totalValue = 0;
    } else if (options.summaryProcess === 'calculate') {
      // Only sum dispensing transactions (changeReason === 6)
      if (options.value.changeReason === 6) {
        options.totalValue += Math.abs(options.value.volumeChange || 0);
      }
    }
  }
};

/**
 * Customize text for dispensing summary display
 * @param {Object} data - Summary data
 * @param {boolean} isTotal - Whether this is a total item (vs group item)
 * @returns {string} Formatted display text
 */
export const customizeDispensingText = (data, isTotal = false) => {
  const prefix = isTotal ? 'Total Dispensing' : 'Dispensing';
  const decimals = isTotal ? 2 : 0;
  const value = data.value?.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }) || (isTotal ? '0.00' : '0');
  return `${prefix}: ${value}${isTotal ? 'L' : ' L'}`;
};
