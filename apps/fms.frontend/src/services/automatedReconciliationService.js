 

const BASE_URL = '/api/v1/automated-reconciliation';

export const automatedReconciliationService = {
  // Policy Management
  getPolicies: (params = {}) => {
    return apiClient.get(`${BASE_URL}/policies`, { params });
  },

  getPolicyById: (id) => {
    return apiClient.get(`${BASE_URL}/policies/${id}`);
  },

  createPolicy: (policyData) => {
    return apiClient.post(`${BASE_URL}/policies`, policyData);
  },

  updatePolicy: (id, policyData) => {
    return apiClient.put(`${BASE_URL}/policies/${id}`, policyData);
  },

  deletePolicy: (id) => {
    return apiClient.delete(`${BASE_URL}/policies/${id}`);
  },

  // Execution Monitoring
  getExecutions: (params = {}) => {
    return apiClient.get(`${BASE_URL}/executions`, { params });
  },

  getExecutionById: (id) => {
    return apiClient.get(`${BASE_URL}/executions/${id}`);
  },

  triggerManualExecution: (executionData) => {
    return apiClient.post(`${BASE_URL}/executions/manual-trigger`, executionData);
  },

  // Discrepancy Analysis
  getDiscrepancies: (params = {}) => {
    return apiClient.get(`${BASE_URL}/discrepancies`, { params });
  },

  // Analytics Dashboard
  getAnalyticsDashboard: (params = {}) => {
    return apiClient.get(`${BASE_URL}/analytics/dashboard`, { params });
  },

  // System Health
  getSystemHealth: () => {
    return apiClient.get(`${BASE_URL}/system/health`);
  }
};

export default automatedReconciliationService;