import { AUTOMATED_RECONCILIATION_ACTION_TYPES } from '../actions/automatedReconciliationActions';

const initialState = {
  // Policy Management
  policies: [],
  selectedPolicy: null,
  policiesLoading: false,
  policiesError: null,
  totalPolicies: 0,

  // Execution Monitoring
  executions: [],
  selectedExecution: null,
  executionsLoading: false,
  executionsError: null,
  totalExecutions: 0,

  // Discrepancy Analysis
  discrepancies: [],
  discrepanciesLoading: false,
  discrepanciesError: null,
  totalDiscrepancies: 0,

  // Analytics Dashboard
  analytics: null,
  analyticsLoading: false,
  analyticsError: null,

  // UI State
  activeTab: 'dashboard',
  userRole: 'operator',
  filters: {
    policies: {
      isActive: null,
      siteId: null,
      policyType: null,
      pageNumber: 1,
      pageSize: 20
    },
    executions: {
      policyId: null,
      status: null,
      startDate: null,
      endDate: null,
      siteId: null,
      pageNumber: 1,
      pageSize: 20
    },
    discrepancies: {
      siteId: null,
      tankId: null,
      severity: null,
      isResolved: null,
      startDate: null,
      endDate: null,
      pageNumber: 1,
      pageSize: 20
    }
  }
};

const automatedReconciliationReducer = (state = initialState, action) => {
  switch (action.type) {
    // Policy Management Cases
    case AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_POLICIES_REQUEST:
      return {
        ...state,
        policiesLoading: true,
        policiesError: null
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_POLICIES_SUCCESS:
      return {
        ...state,
        policies: action.payload.policies,
        totalPolicies: action.payload.totalCount,
        policiesLoading: false,
        policiesError: null
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_POLICIES_FAILURE:
      return {
        ...state,
        policiesLoading: false,
        policiesError: action.payload
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_POLICY_BY_ID_REQUEST:
      return {
        ...state,
        policiesLoading: true,
        policiesError: null
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_POLICY_BY_ID_SUCCESS:
      return {
        ...state,
        selectedPolicy: action.payload,
        policiesLoading: false,
        policiesError: null
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_POLICY_BY_ID_FAILURE:
      return {
        ...state,
        policiesLoading: false,
        policiesError: action.payload
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.CREATE_POLICY_REQUEST:
      return {
        ...state,
        policiesLoading: true,
        policiesError: null
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.CREATE_POLICY_SUCCESS:
      return {
        ...state,
        policies: [...state.policies, action.payload],
        totalPolicies: state.totalPolicies + 1,
        policiesLoading: false,
        policiesError: null
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.CREATE_POLICY_FAILURE:
      return {
        ...state,
        policiesLoading: false,
        policiesError: action.payload
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.UPDATE_POLICY_REQUEST:
      return {
        ...state,
        policiesLoading: true,
        policiesError: null
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.UPDATE_POLICY_SUCCESS:
      return {
        ...state,
        policies: state.policies.map(policy =>
          policy.id === action.payload.id ? action.payload : policy
        ),
        selectedPolicy: action.payload,
        policiesLoading: false,
        policiesError: null
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.UPDATE_POLICY_FAILURE:
      return {
        ...state,
        policiesLoading: false,
        policiesError: action.payload
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.DELETE_POLICY_REQUEST:
      return {
        ...state,
        policiesLoading: true,
        policiesError: null
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.DELETE_POLICY_SUCCESS:
      return {
        ...state,
        policies: state.policies.filter(policy => policy.id !== action.payload),
        totalPolicies: state.totalPolicies - 1,
        policiesLoading: false,
        policiesError: null
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.DELETE_POLICY_FAILURE:
      return {
        ...state,
        policiesLoading: false,
        policiesError: action.payload
      };

    // Execution Monitoring Cases
    case AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_EXECUTIONS_REQUEST:
      return {
        ...state,
        executionsLoading: true,
        executionsError: null
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_EXECUTIONS_SUCCESS:
      return {
        ...state,
        executions: action.payload.executions,
        totalExecutions: action.payload.totalCount,
        executionsLoading: false,
        executionsError: null
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_EXECUTIONS_FAILURE:
      return {
        ...state,
        executionsLoading: false,
        executionsError: action.payload
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_EXECUTION_BY_ID_REQUEST:
      return {
        ...state,
        executionsLoading: true,
        executionsError: null
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_EXECUTION_BY_ID_SUCCESS:
      return {
        ...state,
        selectedExecution: action.payload,
        executionsLoading: false,
        executionsError: null
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_EXECUTION_BY_ID_FAILURE:
      return {
        ...state,
        executionsLoading: false,
        executionsError: action.payload
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.TRIGGER_MANUAL_EXECUTION_REQUEST:
      return {
        ...state,
        executionsLoading: true,
        executionsError: null
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.TRIGGER_MANUAL_EXECUTION_SUCCESS:
      return {
        ...state,
        executions: [action.payload, ...state.executions],
        totalExecutions: state.totalExecutions + 1,
        executionsLoading: false,
        executionsError: null
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.TRIGGER_MANUAL_EXECUTION_FAILURE:
      return {
        ...state,
        executionsLoading: false,
        executionsError: action.payload
      };

    // Discrepancy Analysis Cases
    case AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_DISCREPANCIES_REQUEST:
      return {
        ...state,
        discrepanciesLoading: true,
        discrepanciesError: null
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_DISCREPANCIES_SUCCESS:
      return {
        ...state,
        discrepancies: action.payload.discrepancies,
        totalDiscrepancies: action.payload.totalCount,
        discrepanciesLoading: false,
        discrepanciesError: null
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_DISCREPANCIES_FAILURE:
      return {
        ...state,
        discrepanciesLoading: false,
        discrepanciesError: action.payload
      };

    // Analytics Dashboard Cases
    case AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_ANALYTICS_DASHBOARD_REQUEST:
      return {
        ...state,
        analyticsLoading: true,
        analyticsError: null
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_ANALYTICS_DASHBOARD_SUCCESS:
      return {
        ...state,
        analytics: action.payload,
        analyticsLoading: false,
        analyticsError: null
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_ANALYTICS_DASHBOARD_FAILURE:
      return {
        ...state,
        analyticsLoading: false,
        analyticsError: action.payload
      };

    // UI State Cases
    case AUTOMATED_RECONCILIATION_ACTION_TYPES.SET_ACTIVE_TAB:
      return {
        ...state,
        activeTab: action.payload
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.SET_USER_ROLE:
      return {
        ...state,
        userRole: action.payload
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.SET_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };

    case AUTOMATED_RECONCILIATION_ACTION_TYPES.CLEAR_FILTERS:
      return {
        ...state,
        filters: initialState.filters
      };

    default:
      return state;
  }
};

export default automatedReconciliationReducer;