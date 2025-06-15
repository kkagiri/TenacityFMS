import { STOCK_MANAGEMENT_TYPES } from '../actions/stockManagementActions';

//Cursor - Stock Management Reducer for handling all stock management state
const initialState = {
  // Stock Adjustments
  stockAdjustments: [],
  stockAdjustmentsLoading: false,
  stockAdjustmentsError: null,
  createAdjustmentLoading: false,
  createAdjustmentError: null,

  // Stock Reconciliation
  stockDiscrepancies: [],
  stockDiscrepanciesLoading: false,
  stockDiscrepanciesError: null,
  reconcileLoading: false,
  reconcileError: null,
  lastReconciliationResult: null,

  // Stock Reporting
  stockReports: [],
  stockReportsLoading: false,
  stockReportsError: null,
  generateReportLoading: false,
  generateReportError: null,
  currentReport: null,

  // General
  lastUpdated: null
};

const stockManagementReducer = (state = initialState, action) => {
  switch (action.type) {
    // Stock Adjustments
    case STOCK_MANAGEMENT_TYPES.FETCH_STOCK_ADJUSTMENTS_REQUEST:
      return {
        ...state,
        stockAdjustmentsLoading: true,
        stockAdjustmentsError: null
      };

    case STOCK_MANAGEMENT_TYPES.FETCH_STOCK_ADJUSTMENTS_SUCCESS:
      return {
        ...state,
        stockAdjustments: action.payload,
        stockAdjustmentsLoading: false,
        stockAdjustmentsError: null,
        lastUpdated: new Date().toISOString()
      };

    case STOCK_MANAGEMENT_TYPES.FETCH_STOCK_ADJUSTMENTS_FAILURE:
      return {
        ...state,
        stockAdjustmentsLoading: false,
        stockAdjustmentsError: action.payload
      };

    case STOCK_MANAGEMENT_TYPES.CREATE_STOCK_ADJUSTMENT_REQUEST:
      return {
        ...state,
        createAdjustmentLoading: true,
        createAdjustmentError: null
      };

    case STOCK_MANAGEMENT_TYPES.CREATE_STOCK_ADJUSTMENT_SUCCESS:
      return {
        ...state,
        createAdjustmentLoading: false,
        createAdjustmentError: null,
        stockAdjustments: [action.payload, ...state.stockAdjustments],
        lastUpdated: new Date().toISOString()
      };

    case STOCK_MANAGEMENT_TYPES.CREATE_STOCK_ADJUSTMENT_FAILURE:
      return {
        ...state,
        createAdjustmentLoading: false,
        createAdjustmentError: action.payload
      };

    // Stock Reconciliation
    case STOCK_MANAGEMENT_TYPES.FETCH_STOCK_DISCREPANCIES_REQUEST:
      return {
        ...state,
        stockDiscrepanciesLoading: true,
        stockDiscrepanciesError: null
      };

    case STOCK_MANAGEMENT_TYPES.FETCH_STOCK_DISCREPANCIES_SUCCESS:
      return {
        ...state,
        stockDiscrepancies: action.payload,
        stockDiscrepanciesLoading: false,
        stockDiscrepanciesError: null,
        lastUpdated: new Date().toISOString()
      };

    case STOCK_MANAGEMENT_TYPES.FETCH_STOCK_DISCREPANCIES_FAILURE:
      return {
        ...state,
        stockDiscrepanciesLoading: false,
        stockDiscrepanciesError: action.payload
      };

    case STOCK_MANAGEMENT_TYPES.RECONCILE_STOCKS_REQUEST:
      return {
        ...state,
        reconcileLoading: true,
        reconcileError: null
      };

    case STOCK_MANAGEMENT_TYPES.RECONCILE_STOCKS_SUCCESS:
      return {
        ...state,
        reconcileLoading: false,
        reconcileError: null,
        lastReconciliationResult: action.payload,
        // Remove reconciled items from discrepancies
        stockDiscrepancies: state.stockDiscrepancies.filter(
          discrepancy => !action.payload.reconciledIds?.includes(discrepancy.id)
        ),
        lastUpdated: new Date().toISOString()
      };

    case STOCK_MANAGEMENT_TYPES.RECONCILE_STOCKS_FAILURE:
      return {
        ...state,
        reconcileLoading: false,
        reconcileError: action.payload
      };

    // Stock Reporting
    case STOCK_MANAGEMENT_TYPES.GENERATE_STOCK_REPORT_REQUEST:
      return {
        ...state,
        generateReportLoading: true,
        generateReportError: null
      };

    case STOCK_MANAGEMENT_TYPES.GENERATE_STOCK_REPORT_SUCCESS:
      return {
        ...state,
        generateReportLoading: false,
        generateReportError: null,
        currentReport: action.payload,
        stockReports: [action.payload, ...state.stockReports],
        lastUpdated: new Date().toISOString()
      };

    case STOCK_MANAGEMENT_TYPES.GENERATE_STOCK_REPORT_FAILURE:
      return {
        ...state,
        generateReportLoading: false,
        generateReportError: action.payload
      };

    case STOCK_MANAGEMENT_TYPES.FETCH_STOCK_REPORTS_REQUEST:
      return {
        ...state,
        stockReportsLoading: true,
        stockReportsError: null
      };

    case STOCK_MANAGEMENT_TYPES.FETCH_STOCK_REPORTS_SUCCESS:
      return {
        ...state,
        stockReports: action.payload,
        stockReportsLoading: false,
        stockReportsError: null,
        lastUpdated: new Date().toISOString()
      };

    case STOCK_MANAGEMENT_TYPES.FETCH_STOCK_REPORTS_FAILURE:
      return {
        ...state,
        stockReportsLoading: false,
        stockReportsError: action.payload
      };

    // Clear Actions
    case STOCK_MANAGEMENT_TYPES.CLEAR_STOCK_ADJUSTMENTS:
      return {
        ...state,
        stockAdjustments: [],
        stockAdjustmentsError: null,
        createAdjustmentError: null
      };

    case STOCK_MANAGEMENT_TYPES.CLEAR_STOCK_DISCREPANCIES:
      return {
        ...state,
        stockDiscrepancies: [],
        stockDiscrepanciesError: null,
        reconcileError: null,
        lastReconciliationResult: null
      };

    case STOCK_MANAGEMENT_TYPES.CLEAR_STOCK_REPORTS:
      return {
        ...state,
        stockReports: [],
        stockReportsError: null,
        generateReportError: null,
        currentReport: null
      };

    default:
      return state;
  }
};

export default stockManagementReducer;