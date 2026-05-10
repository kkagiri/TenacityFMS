import {
  FETCH_DAILY_RECONCILIATION_REPORT_REQUEST,
  FETCH_DAILY_RECONCILIATION_REPORT_SUCCESS,
  FETCH_DAILY_RECONCILIATION_REPORT_FAILURE,
  FETCH_RECONCILIATION_SUMMARY_REQUEST,
  FETCH_RECONCILIATION_SUMMARY_SUCCESS,
  FETCH_RECONCILIATION_SUMMARY_FAILURE,
  FETCH_DISCREPANCY_ALERTS_REQUEST,
  FETCH_DISCREPANCY_ALERTS_SUCCESS,
  FETCH_DISCREPANCY_ALERTS_FAILURE,
  PROCESS_RECONCILIATION_REQUEST,
  PROCESS_RECONCILIATION_SUCCESS,
  PROCESS_RECONCILIATION_FAILURE,
  CLEAR_DAILY_RECONCILIATION
} from '../actions/dailyTankReconciliationActions';

const initialState = {
  report: null,
  summary: null,
  alerts: [],
  processingResult: null,
  reportLoading: false,
  summaryLoading: false,
  alertsLoading: false,
  processingLoading: false,
  error: null,
};

const dailyTankReconciliationReducer = (state = initialState, action) => {
  switch (action.type) {
    // Report Actions
    case FETCH_DAILY_RECONCILIATION_REPORT_REQUEST:
      return { ...state, reportLoading: true, error: null };
    case FETCH_DAILY_RECONCILIATION_REPORT_SUCCESS:
      return { ...state, report: action.payload, reportLoading: false, error: null };
    case FETCH_DAILY_RECONCILIATION_REPORT_FAILURE:
      return { ...state, report: null, reportLoading: false, error: action.payload };

    // Summary Actions
    case FETCH_RECONCILIATION_SUMMARY_REQUEST:
      return { ...state, summaryLoading: true, error: null };
    case FETCH_RECONCILIATION_SUMMARY_SUCCESS:
      return { ...state, summary: action.payload, summaryLoading: false, error: null };
    case FETCH_RECONCILIATION_SUMMARY_FAILURE:
      return { ...state, summary: null, summaryLoading: false, error: action.payload };

    // Alerts Actions
    case FETCH_DISCREPANCY_ALERTS_REQUEST:
      return { ...state, alertsLoading: true, error: null };
    case FETCH_DISCREPANCY_ALERTS_SUCCESS:
      return { ...state, alerts: action.payload, alertsLoading: false, error: null };
    case FETCH_DISCREPANCY_ALERTS_FAILURE:
      return { ...state, alerts: [], alertsLoading: false, error: action.payload };

    // Processing Actions
    case PROCESS_RECONCILIATION_REQUEST:
      return { ...state, processingLoading: true, error: null };
    case PROCESS_RECONCILIATION_SUCCESS:
      return { ...state, processingResult: action.payload, processingLoading: false, error: null };
    case PROCESS_RECONCILIATION_FAILURE:
      return { ...state, processingResult: null, processingLoading: false, error: action.payload };

    // Clear Action
    case CLEAR_DAILY_RECONCILIATION:
      return initialState;

    default:
      return state;
  }
};

export default dailyTankReconciliationReducer;
