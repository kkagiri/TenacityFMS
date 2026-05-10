// Mock data for Automated Reconciliation System
// This file contains all sample data used across the dashboard components

export const mockCurrentExecutions = [
  {
    id: 1001,
    policyName: "Daily Tank Reconciliation",
    progress: 75,
    tanksProcessed: 35,
    totalTanks: 47,
    startTime: "02:00:00",
    estimatedCompletion: "02:15:00",
    status: "Running"
  },
  {
    id: 1002,
    policyName: "Critical Tank Monitoring",
    progress: 45,
    tanksProcessed: 9,
    totalTanks: 20,
    startTime: "01:45:00",
    estimatedCompletion: "02:10:00",
    status: "Running"
  }
];

export const mockRecentDiscrepancies = [
  {
    id: 5001,
    tankName: "Fuel Tank A-1",
    siteName: "Main Distribution Center",
    severity: "Medium",
    variance: -124.5,
    detectedTime: "02:05:15"
  },
  {
    id: 5002,
    tankName: "Chemical Tank B-3",
    siteName: "North Facility",
    severity: "High",
    variance: 245.8,
    detectedTime: "01:45:22"
  },
  {
    id: 5003,
    tankName: "Fuel Tank C-2",
    siteName: "South Distribution",
    severity: "Low",
    variance: 45.2,
    detectedTime: "01:30:10"
  }
];

export const mockPolicyMetrics = [
  {
    id: 1,
    name: "Daily Tank Reconciliation",
    type: "Scheduled",
    isActive: true,
    successRate: 98.5,
    executionCount: 45,
    lastExecution: "2025-06-12T02:00:00Z",
    nextExecution: "2025-06-13T02:00:00Z",
    tanksInScope: 47,
    description: "Automated reconciliation for all tanks daily at 2 AM",
    priority: 100,
    discrepancyThreshold: 5.0,
    discrepancyPercentageThreshold: 2.0,
    createdDate: "2025-05-01T10:00:00Z"
  },
  {
    id: 2,
    name: "Critical Tank Monitoring",
    type: "Threshold",
    isActive: true,
    successRate: 94.2,
    executionCount: 156,
    lastExecution: "2025-06-12T01:45:00Z",
    nextExecution: "On Threshold",
    tanksInScope: 20,
    description: "High-frequency monitoring for critical tanks",
    priority: 150,
    discrepancyThreshold: 25.0,
    discrepancyPercentageThreshold: 1.5,
    createdDate: "2025-04-15T14:30:00Z"
  },
  {
    id: 3,
    name: "Weekly Comprehensive Audit",
    type: "Scheduled",
    isActive: false,
    successRate: 96.8,
    executionCount: 12,
    lastExecution: "2025-06-08T00:00:00Z",
    nextExecution: "Inactive",
    tanksInScope: 85,
    description: "Weekly comprehensive reconciliation of all tanks",
    priority: 75,
    discrepancyThreshold: 10.0,
    discrepancyPercentageThreshold: 3.0,
    createdDate: "2025-04-01T08:00:00Z"
  }
];

export const mockPerformanceMetrics = {
  totalPolicies: 12,
  activePolicies: 8,
  averageSuccessRate: 95.7,
  totalExecutions: 1456,
  systemEfficiency: 94.2,
  trendsImproving: 3,
  trendsStable: 7,
  trendsDecreasing: 2
};

export const mockBusinessMetrics = {
  totalReconciliationsPerformed: 2891,
  totalVolumeReconciled: 45632.8,
  estimatedManualHoursSaved: 287.5,
  estimatedCostSavings: 14375.0,
  dataQualityImprovement: 12.8,
  complianceScore: 98.9,
  systemUptime: 99.7,
  processingEfficiency: 94.2
};

export const mockKpiData = [
  {
    title: "Cost Savings",
    value: `$${mockBusinessMetrics.estimatedCostSavings.toLocaleString()}`,
    change: "+18.5%",
    trend: "up",
    description: "Monthly operational savings",
    icon: "fa-dollar-sign"
  },
  {
    title: "Time Saved",
    value: `${mockBusinessMetrics.estimatedManualHoursSaved.toFixed(1)}h`,
    change: "+22.3%",
    trend: "up",
    description: "Manual hours eliminated",
    icon: "fa-clock"
  },
  {
    title: "Compliance Score",
    value: `${mockBusinessMetrics.complianceScore}%`,
    change: "+2.1%",
    trend: "up",
    description: "Regulatory compliance",
    icon: "fa-shield"
  },
  {
    title: "Data Quality",
    value: `+${mockBusinessMetrics.dataQualityImprovement}%`,
    change: "+5.2%",
    trend: "up",
    description: "Improvement in accuracy",
    icon: "fa-target"
  }
];

export const mockDiscrepancies = [
  {
    id: 5001,
    executionId: 1001,
    tankId: 101,
    tankName: "Fuel Tank A-1",
    siteId: 1,
    siteName: "Main Distribution Center",
    detectedDate: "2025-06-12T02:05:15Z",
    expectedVolume: 15750.0,
    actualVolume: 15625.5,
    varianceAmount: -124.5,
    variancePercentage: -0.79,
    severity: "Medium",
    trendAnalysis: {
      isRecurring: false,
      historicalPattern: "Stable",
      lastSimilarDiscrepancy: "2025-05-28T02:00:00Z",
      averageVariance: -15.2,
      varianceTrend: "Decreasing",
    },
    businessImpact: {
      estimatedCostImpact: 245.8,
      operationalRisk: "Low",
      complianceRisk: "None",
    },
    resolutionDetails: {
      isResolved: true,
      resolutionMethod: "AutomatedReconciliation",
      resolutionDate: "2025-06-12T02:06:45Z",
      newVolumeHistoryId: 98765,
    },
  },
  {
    id: 5002,
    executionId: 1002,
    tankId: 203,
    tankName: "Chemical Tank B-3",
    siteId: 2,
    siteName: "North Facility",
    detectedDate: "2025-06-12T01:45:22Z",
    expectedVolume: 8500.0,
    actualVolume: 8745.8,
    varianceAmount: 245.8,
    variancePercentage: 2.89,
    severity: "High",
    trendAnalysis: {
      isRecurring: true,
      historicalPattern: "Increasing",
      lastSimilarDiscrepancy: "2025-06-10T01:45:00Z",
      averageVariance: 185.3,
      varianceTrend: "Increasing",
    },
    businessImpact: {
      estimatedCostImpact: 1245.6,
      operationalRisk: "Medium",
      complianceRisk: "Low",
    },
    resolutionDetails: {
      isResolved: false,
      resolutionMethod: null,
      resolutionDate: null,
      newVolumeHistoryId: null,
    },
  },
  {
    id: 5003,
    executionId: 1001,
    tankId: 305,
    tankName: "Fuel Tank C-2",
    siteId: 3,
    siteName: "South Distribution",
    detectedDate: "2025-06-12T01:30:10Z",
    expectedVolume: 12000.0,
    actualVolume: 12045.2,
    varianceAmount: 45.2,
    variancePercentage: 0.38,
    severity: "Low",
    trendAnalysis: {
      isRecurring: false,
      historicalPattern: "Stable",
      lastSimilarDiscrepancy: "2025-06-05T02:00:00Z",
      averageVariance: 32.1,
      varianceTrend: "Stable",
    },
    businessImpact: {
      estimatedCostImpact: 89.4,
      operationalRisk: "Low",
      complianceRisk: "None",
    },
    resolutionDetails: {
      isResolved: true,
      resolutionMethod: "AutomatedReconciliation",
      resolutionDate: "2025-06-12T01:31:25Z",
      newVolumeHistoryId: 98766,
    },
  },
  {
    id: 5004,
    executionId: 1003,
    tankId: 407,
    tankName: "Diesel Tank D-1",
    siteId: 4,
    siteName: "East Terminal",
    detectedDate: "2025-06-12T03:15:30Z",
    expectedVolume: 22000.0,
    actualVolume: 21750.0,
    varianceAmount: -250.0,
    variancePercentage: -1.14,
    severity: "Critical",
    trendAnalysis: {
      isRecurring: true,
      historicalPattern: "Increasing",
      lastSimilarDiscrepancy: "2025-06-11T03:15:00Z",
      averageVariance: -195.7,
      varianceTrend: "Increasing",
    },
    businessImpact: {
      estimatedCostImpact: 2150.0,
      operationalRisk: "High",
      complianceRisk: "Medium",
    },
    resolutionDetails: {
      isResolved: false,
      resolutionMethod: null,
      resolutionDate: null,
      newVolumeHistoryId: null,
    },
  }
];

export const mockAnalytics = {
  totalDiscrepancies: 156,
  resolvedDiscrepancies: 152,
  averageResolutionTime: "00:01:45",
  severityDistribution: {
    Low: 89,
    Medium: 52,
    High: 13,
    Critical: 2,
  },
  trendSummary: {
    increasingTrend: 12,
    stableTrend: 134,
    decreasingTrend: 10,
  },
};

export const mockExecutions = [
  {
    id: 1001,
    policyId: 1,
    policyName: "Daily Tank Reconciliation",
    status: "Running",
    startTime: "2025-06-12T02:00:00Z",
    endTime: null,
    progress: 75,
    tanksProcessed: 35,
    totalTanks: 47,
    discrepanciesFound: 2,
    estimatedCompletion: "2025-06-12T02:15:00Z",
    executionDetails: {
      triggeredBy: "Schedule",
      executionMode: "Automatic",
      priority: 100
    }
  },
  {
    id: 1002,
    policyId: 2,
    policyName: "Critical Tank Monitoring",
    status: "Running",
    startTime: "2025-06-12T01:45:00Z",
    endTime: null,
    progress: 45,
    tanksProcessed: 9,
    totalTanks: 20,
    discrepanciesFound: 1,
    estimatedCompletion: "2025-06-12T02:10:00Z",
    executionDetails: {
      triggeredBy: "Threshold",
      executionMode: "Automatic",
      priority: 150
    }
  },
  {
    id: 1000,
    policyId: 1,
    policyName: "Daily Tank Reconciliation",
    status: "Completed",
    startTime: "2025-06-11T02:00:00Z",
    endTime: "2025-06-11T02:12:30Z",
    progress: 100,
    tanksProcessed: 47,
    totalTanks: 47,
    discrepanciesFound: 3,
    estimatedCompletion: null,
    executionDetails: {
      triggeredBy: "Schedule",
      executionMode: "Automatic",
      priority: 100
    }
  },
  {
    id: 999,
    policyId: 2,
    policyName: "Critical Tank Monitoring",
    status: "Failed",
    startTime: "2025-06-11T14:30:00Z",
    endTime: "2025-06-11T14:32:15Z",
    progress: 25,
    tanksProcessed: 5,
    totalTanks: 20,
    discrepanciesFound: 0,
    estimatedCompletion: null,
    executionDetails: {
      triggeredBy: "Threshold",
      executionMode: "Automatic",
      priority: 150,
      errorMessage: "Database connection timeout"
    }
  }
];

export const mockSystemConfig = {
  maxConcurrentExecutions: 3,
  defaultDiscrepancyThreshold: 5.0,
  defaultDiscrepancyPercentageThreshold: 2.0,
  executionTimeoutMinutes: 30,
  retryAttempts: 3,
  enableAutoReconciliation: true,
  enableNotifications: true,
  logRetentionDays: 90,
  systemMaintenanceWindow: {
    enabled: true,
    startTime: "03:00:00",
    endTime: "04:00:00",
    timezone: "UTC"
  }
};

export const mockNotificationSettings = {
  emailNotifications: {
    enabled: true,
    recipients: ["ops@company.com", "manager@company.com"],
    severityThreshold: "Medium"
  },
  slackNotifications: {
    enabled: true,
    webhookUrl: "https://hooks.slack.com/services/...",
    channel: "#fuel-management",
    severityThreshold: "High"
  },
  smsNotifications: {
    enabled: false,
    recipients: ["+1234567890"],
    severityThreshold: "Critical"
  }
};

export const mockSecuritySettings = {
  sessionTimeoutMinutes: 480,
  requireMfaForCriticalActions: true,
  auditLogRetentionDays: 365,
  allowedIpRanges: ["192.168.1.0/24", "10.0.0.0/8"],
  encryptionEnabled: true,
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90
  }
};

// Utility functions for mock data
export const getMockDataByType = (type) => {
  switch (type) {
    case 'currentExecutions':
      return mockCurrentExecutions;
    case 'recentDiscrepancies':
      return mockRecentDiscrepancies;
    case 'policyMetrics':
      return mockPolicyMetrics;
    case 'performanceMetrics':
      return mockPerformanceMetrics;
    case 'businessMetrics':
      return mockBusinessMetrics;
    case 'kpiData':
      return mockKpiData;
    case 'discrepancies':
      return mockDiscrepancies;
    case 'analytics':
      return mockAnalytics;
    case 'executions':
      return mockExecutions;
    case 'systemConfig':
      return mockSystemConfig;
    case 'notificationSettings':
      return mockNotificationSettings;
    case 'securitySettings':
      return mockSecuritySettings;
    default:
      return null;
  }
};

export const generateRandomDiscrepancy = () => {
  const tanks = ["Fuel Tank A-1", "Chemical Tank B-3", "Diesel Tank C-2", "Storage Tank D-4"];
  const sites = ["Main Distribution Center", "North Facility", "South Distribution", "East Terminal"];
  const severities = ["Low", "Medium", "High", "Critical"];

  return {
    id: Math.floor(Math.random() * 10000) + 5000,
    tankName: tanks[Math.floor(Math.random() * tanks.length)],
    siteName: sites[Math.floor(Math.random() * sites.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    variance: (Math.random() - 0.5) * 500,
    detectedTime: new Date().toLocaleTimeString()
  };
};

export const generateRandomExecution = () => {
  const policies = ["Daily Tank Reconciliation", "Critical Tank Monitoring", "Weekly Audit"];
  const statuses = ["Running", "Completed", "Failed", "Pending"];

  return {
    id: Math.floor(Math.random() * 1000) + 2000,
    policyName: policies[Math.floor(Math.random() * policies.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    progress: Math.floor(Math.random() * 100),
    tanksProcessed: Math.floor(Math.random() * 50),
    totalTanks: Math.floor(Math.random() * 50) + 20,
    startTime: new Date().toLocaleTimeString(),
    estimatedCompletion: new Date(Date.now() + Math.random() * 3600000).toLocaleTimeString()
  };
};