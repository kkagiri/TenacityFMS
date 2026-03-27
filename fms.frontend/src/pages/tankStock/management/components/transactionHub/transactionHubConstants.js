/**
 * File: transactionHubConstants.js
 * Purpose: Constants and enum mappings for TransactionHub component
 * Last Modified: 2025-11-26
 */

/**
 * Volume Change Reason Enum mapping
 * Maps numeric IDs to human-readable names for transaction types
 * IMPORTANT: Must match backend enum in FMS.Domain/Entities/enums/VolumeChangeReasonEnum.cs
 */
export const VolumeChangeReasonEnum = [
  { id: 0, name: 'Opening Stock' },
  { id: 1, name: 'Closing Stock' },
  { id: 2, name: 'Delivery' },
  { id: 3, name: 'Transfer In' },
  { id: 4, name: 'Transfer Out' },
  { id: 5, name: 'Adjustment' },
  { id: 6, name: 'Dispensing' },
  { id: 7, name: 'Automated Dispensing' },
  { id: 8, name: 'Reconciliation' },
  { id: 9, name: 'Automated Reconciliation' },
  { id: 10, name: 'In-Tank Delivery' }
];

/**
 * Chart type options for dropdown (currently commented out in main component)
 */
export const chartTypeOptions = [
  {
    key: 'candlestick',
    text: '📈 Candlestick Chart',
    icon: 'fa-light fa-chart-line'
  },
  {
    key: 'volume',
    text: '📊 Volume Chart',
    icon: 'fa-light fa-chart-bar'
  },
  {
    key: 'multi-series',
    text: '🎯 Multi-Series Line',
    icon: 'fa-light fa-chart-area'
  },
  {
    key: 'ohlc',
    text: '📉 OHLC Bars',
    icon: 'fa-light fa-chart-column'
  }
];

/**
 * Default delete confirmation state
 */
export const defaultDeleteConfirmationState = {
  visible: false,
  transaction: null,
  validationResult: null,
  isDeleting: false,
  showImpactDetails: false,
  showDetails: false,
  deletionReason: '',
  userConfirmed: false
};

export const defaultBulkDeleteConfirmationState = {
  visible: false,
  transactions: [],
  validationResult: null,
  isDeleting: false,
  userConfirmed: false
};

/**
 * Default edit state
 */
export const defaultEditState = {
  visible: false,
  transaction: null,
  isLoading: false
};

/**
 * Default grouping state
 */
export const defaultGroupByState = {
  date: false,
  site: false,
  tank: false
};

/**
 * DataGrid page sizes
 */
export const allowedPageSizes = [50, 100, 200, 500];

/**
 * Default page size for DataGrid
 */
export const defaultPageSize = 100;
