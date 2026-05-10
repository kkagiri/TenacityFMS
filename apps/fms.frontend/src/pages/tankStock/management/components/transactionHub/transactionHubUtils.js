/**
 * File: transactionHubUtils.js
 * Purpose: Utility functions for TransactionHub component
 * Last Modified: 2025-11-26
 */

import { VolumeChangeReasonEnum } from './transactionHubConstants';

const EAST_AFRICA_TIME_ZONE = 'Africa/Nairobi';

/**
 * Parse backend UTC dates safely.
 * Backend dates are stored in UTC; if timezone suffix is missing, assume UTC.
 * @param {Date|string|number} value - Raw date value
 * @returns {Date|null} Parsed date or null when invalid
 */
export const parseUtcDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const hasTimezone = /(?:[zZ]|[+\-]\d{2}:?\d{2})$/.test(raw);
  const normalized = hasTimezone
    ? raw
    : `${raw.replace(' ', 'T').replace(/\//g, '-')}${raw.includes('T') || raw.includes(' ') ? 'Z' : 'T00:00:00Z'}`;

  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

/**
 * Format a UTC date value for East Africa Time (UTC+3).
 * @param {Date|string|number} value - Raw date value
 * @returns {string} Formatted date-time string
 */
export const formatUtcDateTimeToEastAfrica = (value) => {
  const date = parseUtcDate(value);
  if (!date) return value ? String(value) : '';

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: EAST_AFRICA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
};

/**
 * Build a YYYY-MM-DD date key using East Africa Time (UTC+3).
 * @param {Date|string|number} value - Raw date value
 * @returns {string|null} Date key for grouping
 */
export const getEastAfricaDateKey = (value) => {
  const date = parseUtcDate(value);
  if (!date) return null;

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: EAST_AFRICA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return year && month && day ? `${year}-${month}-${day}` : null;
};

/**
 * Format a YYYY-MM-DD date key for grouped date labels.
 * @param {string} dateKey - Group date key
 * @returns {string} Human-readable date label
 */
export const formatEastAfricaDateKey = (dateKey) => {
  if (!dateKey) return 'No Date';

  const [year, month, day] = String(dateKey).split('-').map(Number);
  if (![year, month, day].every(Number.isFinite)) {
    return dateKey;
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)));
};

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
  return formatUtcDateTimeToEastAfrica(cellInfo?.value);
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
 * Convert a local date to an API-safe string without UTC conversion.
 * This prevents timezone shifts (e.g., 00:00 local becoming previous day in UTC).
 * @param {Date} date - The date to convert
 * @returns {string|null} Local date-time string (YYYY-MM-DDTHH:mm:ss.SSS)
 */
export const toLocalISOString = (date) => {
  if (!date) return null;
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return null;

  const pad2 = (num) => String(num).padStart(2, "0");
  const pad3 = (num) => String(num).padStart(3, "0");

  return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}` +
    `T${pad2(value.getHours())}:${pad2(value.getMinutes())}:${pad2(value.getSeconds())}.${pad3(value.getMilliseconds())}`;
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
}) => {
  // Ensure end date covers the full day (23:59:59.999) if it's at midnight
  let adjustedEndDate = headerEndDate;
  if (headerEndDate) {
    const endDateCopy = new Date(headerEndDate);
    // If end date is at midnight (00:00:00), set it to end of day
    if (endDateCopy.getHours() === 0 && endDateCopy.getMinutes() === 0 && endDateCopy.getSeconds() === 0) {
      endDateCopy.setHours(23, 59, 59, 999);
      adjustedEndDate = endDateCopy;
    }
  }

  return {
    siteId: selectedSiteIds.length === 1 ? selectedSiteIds[0] : null,
    tankId: selectedTankIds.length === 1 ? selectedTankIds[0] : null,
    siteIds: selectedSiteIds.length > 0 ? selectedSiteIds : null,
    tankIds: selectedTankIds.length > 0 ? selectedTankIds : null,
    recordedBy: filterUserId,
    startDate: toLocalISOString(headerStartDate),
    endDate: toLocalISOString(adjustedEndDate),
    includeVehicleNames: true,
    useManualDispensing: useManualDispensing,
    includeGpsData: showGpsVolume
  };
};

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
