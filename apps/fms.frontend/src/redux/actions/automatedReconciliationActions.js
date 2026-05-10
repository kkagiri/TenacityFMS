// Action Types
export const AUTOMATED_RECONCILIATION_ACTION_TYPES = {
  // Policy Management
  FETCH_POLICIES_REQUEST: 'FETCH_POLICIES_REQUEST',
  FETCH_POLICIES_SUCCESS: 'FETCH_POLICIES_SUCCESS',
  FETCH_POLICIES_FAILURE: 'FETCH_POLICIES_FAILURE',

  FETCH_POLICY_BY_ID_REQUEST: 'FETCH_POLICY_BY_ID_REQUEST',
  FETCH_POLICY_BY_ID_SUCCESS: 'FETCH_POLICY_BY_ID_SUCCESS',
  FETCH_POLICY_BY_ID_FAILURE: 'FETCH_POLICY_BY_ID_FAILURE',

  CREATE_POLICY_REQUEST: 'CREATE_POLICY_REQUEST',
  CREATE_POLICY_SUCCESS: 'CREATE_POLICY_SUCCESS',
  CREATE_POLICY_FAILURE: 'CREATE_POLICY_FAILURE',

  UPDATE_POLICY_REQUEST: 'UPDATE_POLICY_REQUEST',
  UPDATE_POLICY_SUCCESS: 'UPDATE_POLICY_SUCCESS',
  UPDATE_POLICY_FAILURE: 'UPDATE_POLICY_FAILURE',

  DELETE_POLICY_REQUEST: 'DELETE_POLICY_REQUEST',
  DELETE_POLICY_SUCCESS: 'DELETE_POLICY_SUCCESS',
  DELETE_POLICY_FAILURE: 'DELETE_POLICY_FAILURE',

  // Execution Monitoring
  FETCH_EXECUTIONS_REQUEST: 'FETCH_EXECUTIONS_REQUEST',
  FETCH_EXECUTIONS_SUCCESS: 'FETCH_EXECUTIONS_SUCCESS',
  FETCH_EXECUTIONS_FAILURE: 'FETCH_EXECUTIONS_FAILURE',

  FETCH_EXECUTION_BY_ID_REQUEST: 'FETCH_EXECUTION_BY_ID_REQUEST',
  FETCH_EXECUTION_BY_ID_SUCCESS: 'FETCH_EXECUTION_BY_ID_SUCCESS',
  FETCH_EXECUTION_BY_ID_FAILURE: 'FETCH_EXECUTION_BY_ID_FAILURE',

  TRIGGER_MANUAL_EXECUTION_REQUEST: 'TRIGGER_MANUAL_EXECUTION_REQUEST',
  TRIGGER_MANUAL_EXECUTION_SUCCESS: 'TRIGGER_MANUAL_EXECUTION_SUCCESS',
  TRIGGER_MANUAL_EXECUTION_FAILURE: 'TRIGGER_MANUAL_EXECUTION_FAILURE',

  // Discrepancy Analysis
  FETCH_DISCREPANCIES_REQUEST: 'FETCH_DISCREPANCIES_REQUEST',
  FETCH_DISCREPANCIES_SUCCESS: 'FETCH_DISCREPANCIES_SUCCESS',
  FETCH_DISCREPANCIES_FAILURE: 'FETCH_DISCREPANCIES_FAILURE',

  // Analytics Dashboard
  FETCH_ANALYTICS_DASHBOARD_REQUEST: 'FETCH_ANALYTICS_DASHBOARD_REQUEST',
  FETCH_ANALYTICS_DASHBOARD_SUCCESS: 'FETCH_ANALYTICS_DASHBOARD_SUCCESS',
  FETCH_ANALYTICS_DASHBOARD_FAILURE: 'FETCH_ANALYTICS_DASHBOARD_FAILURE',

  // UI State
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  SET_USER_ROLE: 'SET_USER_ROLE',
  SET_FILTERS: 'SET_FILTERS',
  CLEAR_FILTERS: 'CLEAR_FILTERS'
};

// Policy Management Actions
export const fetchPolicies = (filters = {}) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_POLICIES_REQUEST,
  payload: filters
});

export const fetchPoliciesSuccess = (policies, totalCount = 0) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_POLICIES_SUCCESS,
  payload: { policies, totalCount }
});

export const fetchPoliciesFailure = (error) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_POLICIES_FAILURE,
  payload: error
});

export const fetchPolicyById = (policyId) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_POLICY_BY_ID_REQUEST,
  payload: policyId
});

export const fetchPolicyByIdSuccess = (policy) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_POLICY_BY_ID_SUCCESS,
  payload: policy
});

export const fetchPolicyByIdFailure = (error) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_POLICY_BY_ID_FAILURE,
  payload: error
});

export const createPolicy = (policyData) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.CREATE_POLICY_REQUEST,
  payload: policyData
});

export const createPolicySuccess = (policy) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.CREATE_POLICY_SUCCESS,
  payload: policy
});

export const createPolicyFailure = (error) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.CREATE_POLICY_FAILURE,
  payload: error
});

export const updatePolicy = (policyId, policyData) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.UPDATE_POLICY_REQUEST,
  payload: { policyId, policyData }
});

export const updatePolicySuccess = (policy) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.UPDATE_POLICY_SUCCESS,
  payload: policy
});

export const updatePolicyFailure = (error) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.UPDATE_POLICY_FAILURE,
  payload: error
});

export const deletePolicy = (policyId) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.DELETE_POLICY_REQUEST,
  payload: policyId
});

export const deletePolicySuccess = (policyId) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.DELETE_POLICY_SUCCESS,
  payload: policyId
});

export const deletePolicyFailure = (error) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.DELETE_POLICY_FAILURE,
  payload: error
});

// Execution Monitoring Actions
export const fetchExecutions = (filters = {}) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_EXECUTIONS_REQUEST,
  payload: filters
});

export const fetchExecutionsSuccess = (executions, totalCount = 0) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_EXECUTIONS_SUCCESS,
  payload: { executions, totalCount }
});

export const fetchExecutionsFailure = (error) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_EXECUTIONS_FAILURE,
  payload: error
});

export const fetchExecutionById = (executionId) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_EXECUTION_BY_ID_REQUEST,
  payload: executionId
});

export const fetchExecutionByIdSuccess = (execution) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_EXECUTION_BY_ID_SUCCESS,
  payload: execution
});

export const fetchExecutionByIdFailure = (error) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_EXECUTION_BY_ID_FAILURE,
  payload: error
});

export const triggerManualExecution = (executionData) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.TRIGGER_MANUAL_EXECUTION_REQUEST,
  payload: executionData
});

export const triggerManualExecutionSuccess = (execution) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.TRIGGER_MANUAL_EXECUTION_SUCCESS,
  payload: execution
});

export const triggerManualExecutionFailure = (error) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.TRIGGER_MANUAL_EXECUTION_FAILURE,
  payload: error
});

// Discrepancy Analysis Actions
export const fetchDiscrepancies = (filters = {}) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_DISCREPANCIES_REQUEST,
  payload: filters
});

export const fetchDiscrepanciesSuccess = (discrepancies, totalCount = 0) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_DISCREPANCIES_SUCCESS,
  payload: { discrepancies, totalCount }
});

export const fetchDiscrepanciesFailure = (error) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_DISCREPANCIES_FAILURE,
  payload: error
});

// Analytics Dashboard Actions
export const fetchAnalyticsDashboard = (filters = {}) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_ANALYTICS_DASHBOARD_REQUEST,
  payload: filters
});

export const fetchAnalyticsDashboardSuccess = (analytics) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_ANALYTICS_DASHBOARD_SUCCESS,
  payload: analytics
});

export const fetchAnalyticsDashboardFailure = (error) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.FETCH_ANALYTICS_DASHBOARD_FAILURE,
  payload: error
});

// UI State Actions
export const setActiveTab = (tabName) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.SET_ACTIVE_TAB,
  payload: tabName
});

export const setUserRole = (role) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.SET_USER_ROLE,
  payload: role
});

export const setFilters = (filters) => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.SET_FILTERS,
  payload: filters
});

export const clearFilters = () => ({
  type: AUTOMATED_RECONCILIATION_ACTION_TYPES.CLEAR_FILTERS
});