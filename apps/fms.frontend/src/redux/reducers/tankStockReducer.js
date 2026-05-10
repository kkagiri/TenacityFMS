import {
  FETCH_TANK_STOCKS_SUCCESS,
  FETCH_TANK_STOCKS_FAILURE,
  FETCH_TANK_STOCK_BY_ID_SUCCESS,
  FETCH_TANK_STOCK_BY_ID_FAILURE,
  CREATE_TANK_STOCK_SUCCESS,
  CREATE_TANK_STOCK_FAILURE,
  UPDATE_TANK_STOCK_SUCCESS,
  UPDATE_TANK_STOCK_FAILURE,
  DELETE_TANK_STOCK_SUCCESS,
  DELETE_TANK_STOCK_FAILURE,
  CREATE_OPENING_STOCK_SUCCESS,
  CREATE_OPENING_STOCK_FAILURE,
  CREATE_CLOSING_STOCK_SUCCESS,
  CREATE_CLOSING_STOCK_FAILURE,
  CREATE_DELIVERY_SUCCESS,
  CREATE_DELIVERY_FAILURE,
  FETCH_DELIVERIES_SUCCESS,
  FETCH_DELIVERIES_FAILURE,
  CREATE_TANK_TRANSFER_SUCCESS,
  CREATE_TANK_TRANSFER_FAILURE,
  FETCH_STOCK_DISCREPANCIES_REQUEST,
  FETCH_STOCK_DISCREPANCIES_SUCCESS,
  FETCH_STOCK_DISCREPANCIES_FAILURE,
  // New action types
  CREATE_STOCK_ADJUSTMENT_REQUEST,
  CREATE_STOCK_ADJUSTMENT_SUCCESS,
  CREATE_STOCK_ADJUSTMENT_FAILURE,
  FETCH_STOCK_ADJUSTMENTS_REQUEST,
  FETCH_STOCK_ADJUSTMENTS_SUCCESS,
  FETCH_STOCK_ADJUSTMENTS_FAILURE,
  RECONCILE_STOCKS_REQUEST,
  RECONCILE_STOCKS_SUCCESS,
  RECONCILE_STOCKS_FAILURE,
  GENERATE_STOCK_REPORT_REQUEST,
  GENERATE_STOCK_REPORT_SUCCESS,
  GENERATE_STOCK_REPORT_FAILURE,
  FETCH_TANK_STOCKS_REQUEST,
  // Variance Analysis action types
  FETCH_VARIANCE_ANALYSIS_REQUEST,
  FETCH_VARIANCE_ANALYSIS_SUCCESS,
  FETCH_VARIANCE_ANALYSIS_FAILURE,
  // Delivery Cycle Analysis action types
  FETCH_DELIVERY_CYCLE_ANALYSIS_REQUEST,
  FETCH_DELIVERY_CYCLE_ANALYSIS_SUCCESS,
  FETCH_DELIVERY_CYCLE_ANALYSIS_FAILURE,
  // Transfer Reconciliation action types
  FETCH_TRANSFER_RECONCILIATION_REQUEST,
  FETCH_TRANSFER_RECONCILIATION_SUCCESS,
  FETCH_TRANSFER_RECONCILIATION_FAILURE,
  CLEAR_TRANSFER_RECONCILIATION,
  // Period Diagnostic action types
  FETCH_PERIOD_DIAGNOSTIC_REQUEST,
  FETCH_PERIOD_DIAGNOSTIC_SUCCESS,
  FETCH_PERIOD_DIAGNOSTIC_FAILURE,
  CLEAR_PERIOD_DIAGNOSTIC
} from '../actions/tankStockAction';

const initialState = {
  tankStocks: [],
  currentTankStock: null,
  deliveries: [],
  stockDiscrepancies: [],
  stockAdjustments: [],
  reconciliationData: [],
  reports: [],
  varianceAnalysis: null,
  deliveryCycleAnalysis: null,
  transferReconciliation: null,
  periodDiagnostic: null,
  discrepanciesLoading: false,
  adjustmentsLoading: false,
  reconciliationLoading: false,
  reportsLoading: false,
  varianceLoading: false,
  deliveryCycleLoading: false,
  transferReconciliationLoading: false,
  periodDiagnosticLoading: false,
  loading: false,
  error: null,
};

const tankStockReducer = (state = initialState, action) => {
  switch (action.type) {
      // Tank Stocks
      case FETCH_TANK_STOCKS_REQUEST:
          return { ...state, loading: true, error: null };
      case FETCH_TANK_STOCKS_SUCCESS:
          return { ...state, tankStocks: action.payload, loading: false, error: null };
      case FETCH_TANK_STOCKS_FAILURE:
          return { ...state, tankStocks: [], loading: false, error: action.payload };

      // Tank Stock CRUD Operations
      case FETCH_TANK_STOCK_BY_ID_SUCCESS:
          return { ...state, currentTankStock: action.payload, loading: false, error: null };
      case FETCH_TANK_STOCK_BY_ID_FAILURE:
          return { ...state, currentTankStock: null, loading: false, error: action.payload };
      case CREATE_TANK_STOCK_SUCCESS:
          return { ...state, tankStocks: [...state.tankStocks, action.payload], loading: false, error: null };
      case CREATE_TANK_STOCK_FAILURE:
          return { ...state, loading: false, error: action.payload };
      case UPDATE_TANK_STOCK_SUCCESS:
          return {
              ...state,
              tankStocks: state.tankStocks.map(stock => stock.id === action.payload.id ? action.payload : stock),
              loading: false,
              error: null
          };
      case UPDATE_TANK_STOCK_FAILURE:
          return { ...state, loading: false, error: action.payload };
      case DELETE_TANK_STOCK_SUCCESS:
          return {
              ...state,
              tankStocks: state.tankStocks.filter(stock => stock.id !== action.payload),
              loading: false,
              error: null
          };
      case DELETE_TANK_STOCK_FAILURE:
          return { ...state, loading: false, error: action.payload };

      // Opening and Closing Stocks
      case CREATE_OPENING_STOCK_SUCCESS:
      case CREATE_CLOSING_STOCK_SUCCESS:
          return { ...state, loading: false, error: null };
      case CREATE_OPENING_STOCK_FAILURE:
      case CREATE_CLOSING_STOCK_FAILURE:
          return { ...state, loading: false, error: action.payload };

      // Tank Transfer
      case CREATE_TANK_TRANSFER_SUCCESS:
          return { ...state, loading: false, error: null };
      case CREATE_TANK_TRANSFER_FAILURE:
          return { ...state, loading: false, error: action.payload };

      // Deliveries
      case CREATE_DELIVERY_SUCCESS:
          return { ...state, deliveries: [...state.deliveries, action.payload], loading: false, error: null };
      case CREATE_DELIVERY_FAILURE:
          return { ...state, loading: false, error: action.payload };
      case FETCH_DELIVERIES_SUCCESS:
          return { ...state, deliveries: action.payload, loading: false, error: null };
      case FETCH_DELIVERIES_FAILURE:
          return { ...state, deliveries: [], loading: false, error: action.payload };

      // Stock Discrepancies
      case FETCH_STOCK_DISCREPANCIES_REQUEST:
          return { ...state, discrepanciesLoading: true, error: null };
      case FETCH_STOCK_DISCREPANCIES_SUCCESS:
          return {
              ...state,
              stockDiscrepancies: action.payload,
              discrepanciesLoading: false,
              error: null
          };
      case FETCH_STOCK_DISCREPANCIES_FAILURE:
          return {
              ...state,
              stockDiscrepancies: [],
              discrepanciesLoading: false,
              error: action.payload
          };

      // Stock Adjustments
      case CREATE_STOCK_ADJUSTMENT_REQUEST:
          return { ...state, adjustmentsLoading: true, error: null };
      case CREATE_STOCK_ADJUSTMENT_SUCCESS:
          return {
              ...state,
              stockAdjustments: [...state.stockAdjustments, action.payload],
              adjustmentsLoading: false,
              error: null
          };
      case CREATE_STOCK_ADJUSTMENT_FAILURE:
          return { ...state, adjustmentsLoading: false, error: action.payload };

      case FETCH_STOCK_ADJUSTMENTS_REQUEST:
          return { ...state, adjustmentsLoading: true, error: null };
      case FETCH_STOCK_ADJUSTMENTS_SUCCESS:
          return {
              ...state,
              stockAdjustments: action.payload,
              adjustmentsLoading: false,
              error: null
          };
      case FETCH_STOCK_ADJUSTMENTS_FAILURE:
          return {
              ...state,
              stockAdjustments: [],
              adjustmentsLoading: false,
              error: action.payload
          };

      // Stock Reconciliation
      case RECONCILE_STOCKS_REQUEST:
          return { ...state, reconciliationLoading: true, error: null };
      case RECONCILE_STOCKS_SUCCESS:
          return {
              ...state,
              reconciliationData: action.payload,
              reconciliationLoading: false,
              error: null
          };
      case RECONCILE_STOCKS_FAILURE:
          return {
              ...state,
              reconciliationLoading: false,
              error: action.payload
          };

      // Stock Reports
      case GENERATE_STOCK_REPORT_REQUEST:
          return { ...state, reportsLoading: true, error: null };
      case GENERATE_STOCK_REPORT_SUCCESS:
          return {
              ...state,
              reports: [...state.reports, action.payload],
              reportsLoading: false,
              error: null
          };
      case GENERATE_STOCK_REPORT_FAILURE:
          return {
              ...state,
              reportsLoading: false,
              error: action.payload
          };

      // Variance Analysis
      case FETCH_VARIANCE_ANALYSIS_REQUEST:
          return { ...state, varianceLoading: true, error: null };
      case FETCH_VARIANCE_ANALYSIS_SUCCESS:
          return {
              ...state,
              varianceAnalysis: action.payload,
              varianceLoading: false,
              error: null
          };
      case FETCH_VARIANCE_ANALYSIS_FAILURE:
          return {
              ...state,
              varianceAnalysis: null,
              varianceLoading: false,
              error: action.payload
          };

      // Delivery Cycle Analysis
      case FETCH_DELIVERY_CYCLE_ANALYSIS_REQUEST:
          return { ...state, deliveryCycleLoading: true, error: null };
      case FETCH_DELIVERY_CYCLE_ANALYSIS_SUCCESS:
          return {
              ...state,
              deliveryCycleAnalysis: action.payload,
              deliveryCycleLoading: false,
              error: null
          };
      case FETCH_DELIVERY_CYCLE_ANALYSIS_FAILURE:
          return {
              ...state,
              deliveryCycleAnalysis: null,
              deliveryCycleLoading: false,
              error: action.payload
          };

      // Transfer Reconciliation
      case FETCH_TRANSFER_RECONCILIATION_REQUEST:
          return { ...state, transferReconciliationLoading: true, error: null };
      case FETCH_TRANSFER_RECONCILIATION_SUCCESS:
          return {
              ...state,
              transferReconciliation: action.payload,
              transferReconciliationLoading: false,
              error: null
          };
      case FETCH_TRANSFER_RECONCILIATION_FAILURE:
          return {
              ...state,
              transferReconciliation: null,
              transferReconciliationLoading: false,
              error: action.payload
          };
      case CLEAR_TRANSFER_RECONCILIATION:
          return {
              ...state,
              transferReconciliation: null,
              transferReconciliationLoading: false,
              error: null
          };

      // Period Diagnostic
      case FETCH_PERIOD_DIAGNOSTIC_REQUEST:
          return {
              ...state,
              periodDiagnosticLoading: true,
              error: null
          };
      case FETCH_PERIOD_DIAGNOSTIC_SUCCESS:
          return {
              ...state,
              periodDiagnostic: action.payload,
              periodDiagnosticLoading: false,
              error: null
          };
      case FETCH_PERIOD_DIAGNOSTIC_FAILURE:
          return {
              ...state,
              periodDiagnostic: null,
              periodDiagnosticLoading: false,
              error: action.payload
          };
      case CLEAR_PERIOD_DIAGNOSTIC:
          return {
              ...state,
              periodDiagnostic: null,
              periodDiagnosticLoading: false,
              error: null
          };

      default:
          return state;
  }
};

export default tankStockReducer;