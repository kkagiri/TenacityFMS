// vehicleDashboardReducer.js
import {
  FETCH_DASHBOARD_ANALYTICS_REQUEST,
  FETCH_DASHBOARD_ANALYTICS_SUCCESS,
  FETCH_DASHBOARD_ANALYTICS_FAILURE,
  FETCH_DASHBOARD_METRICS_REQUEST,
  FETCH_DASHBOARD_METRICS_SUCCESS,
  FETCH_DASHBOARD_METRICS_FAILURE,
  FETCH_STATUS_DISTRIBUTION_REQUEST,
  FETCH_STATUS_DISTRIBUTION_SUCCESS,
  FETCH_STATUS_DISTRIBUTION_FAILURE,
  FETCH_FLEET_UTILIZATION_REQUEST,
  FETCH_FLEET_UTILIZATION_SUCCESS,
  FETCH_FLEET_UTILIZATION_FAILURE,
  FETCH_MAINTENANCE_ALERTS_REQUEST,
  FETCH_MAINTENANCE_ALERTS_SUCCESS,
  FETCH_MAINTENANCE_ALERTS_FAILURE,
  FETCH_RECENT_ACTIVITIES_REQUEST,
  FETCH_RECENT_ACTIVITIES_SUCCESS,
  FETCH_RECENT_ACTIVITIES_FAILURE,
  FETCH_PERFORMANCE_METRICS_REQUEST,
  FETCH_PERFORMANCE_METRICS_SUCCESS,
  FETCH_PERFORMANCE_METRICS_FAILURE,
  CLEAR_DASHBOARD_DATA,
  SET_DASHBOARD_LOADING,
  SET_DASHBOARD_ERROR
} from '../actions/vehicleDashboardActions';

const initialState = {
  // Complete analytics data
  analytics: null,

  // Individual dashboard components
  metrics: {
    totalVehicles: 0,
    activeVehicles: 0,
    onlineVehicles: 0,
    offlineVehicles: 0,
    vehiclesWithIssues: 0,
    pendingVehicles: 0,
    maintenanceDue: 0,
    inTransit: 0,
    idle: 0,
    averageUtilization: 0,
    fleetHealthScore: 0,
    gpsEnabledVehicles: 0,
    unassignedVehicles: 0
  },

  statusDistribution: [],
  fleetUtilization: {
    overallUtilization: 0,
    dailyUtilization: [],
    vehicleUtilization: [],
    averageHoursPerDay: 0
  },
  maintenanceAlerts: [],
  recentActivities: [],
  performanceMetrics: {
    fuelEfficiency: 0,
    averageSpeed: 0,
    totalDistance: 0,
    totalFuelConsumed: 0,
    averageIdleTime: 0,
    costEfficiency: 0
  },

  // Loading states
  loading: {
    analytics: false,
    metrics: false,
    statusDistribution: false,
    fleetUtilization: false,
    maintenanceAlerts: false,
    recentActivities: false,
    performanceMetrics: false,
    global: false
  },

  // Error states
  errors: {
    analytics: null,
    metrics: null,
    statusDistribution: null,
    fleetUtilization: null,
    maintenanceAlerts: null,
    recentActivities: null,
    performanceMetrics: null,
    global: null
  },

  // Last updated timestamps
  lastUpdated: {
    analytics: null,
    metrics: null,
    statusDistribution: null,
    fleetUtilization: null,
    maintenanceAlerts: null,
    recentActivities: null,
    performanceMetrics: null
  }
};

const vehicleDashboardReducer = (state = initialState, action) => {
  switch (action.type) {
    // Dashboard Analytics
    case FETCH_DASHBOARD_ANALYTICS_REQUEST:
      return {
        ...state,
        loading: {
          ...state.loading,
          analytics: true
        },
        errors: {
          ...state.errors,
          analytics: null
        }
      };

    case FETCH_DASHBOARD_ANALYTICS_SUCCESS:
      return {
        ...state,
        analytics: action.payload,
        loading: {
          ...state.loading,
          analytics: false
        },
        errors: {
          ...state.errors,
          analytics: null
        },
        lastUpdated: {
          ...state.lastUpdated,
          analytics: new Date().toISOString()
        }
      };

    case FETCH_DASHBOARD_ANALYTICS_FAILURE:
      return {
        ...state,
        loading: {
          ...state.loading,
          analytics: false
        },
        errors: {
          ...state.errors,
          analytics: action.payload
        }
      };

    // Dashboard Metrics
    case FETCH_DASHBOARD_METRICS_REQUEST:
      return {
        ...state,
        loading: {
          ...state.loading,
          metrics: true
        },
        errors: {
          ...state.errors,
          metrics: null
        }
      };

    case FETCH_DASHBOARD_METRICS_SUCCESS:
      return {
        ...state,
        metrics: {
          ...state.metrics,
          ...action.payload
        },
        loading: {
          ...state.loading,
          metrics: false
        },
        errors: {
          ...state.errors,
          metrics: null
        },
        lastUpdated: {
          ...state.lastUpdated,
          metrics: new Date().toISOString()
        }
      };

    case FETCH_DASHBOARD_METRICS_FAILURE:
      return {
        ...state,
        loading: {
          ...state.loading,
          metrics: false
        },
        errors: {
          ...state.errors,
          metrics: action.payload
        }
      };

    // Status Distribution
    case FETCH_STATUS_DISTRIBUTION_REQUEST:
      return {
        ...state,
        loading: {
          ...state.loading,
          statusDistribution: true
        },
        errors: {
          ...state.errors,
          statusDistribution: null
        }
      };

    case FETCH_STATUS_DISTRIBUTION_SUCCESS:
      return {
        ...state,
        statusDistribution: action.payload,
        loading: {
          ...state.loading,
          statusDistribution: false
        },
        errors: {
          ...state.errors,
          statusDistribution: null
        },
        lastUpdated: {
          ...state.lastUpdated,
          statusDistribution: new Date().toISOString()
        }
      };

    case FETCH_STATUS_DISTRIBUTION_FAILURE:
      return {
        ...state,
        loading: {
          ...state.loading,
          statusDistribution: false
        },
        errors: {
          ...state.errors,
          statusDistribution: action.payload
        }
      };

    // Fleet Utilization
    case FETCH_FLEET_UTILIZATION_REQUEST:
      return {
        ...state,
        loading: {
          ...state.loading,
          fleetUtilization: true
        },
        errors: {
          ...state.errors,
          fleetUtilization: null
        }
      };

    case FETCH_FLEET_UTILIZATION_SUCCESS:
      return {
        ...state,
        fleetUtilization: {
          ...state.fleetUtilization,
          ...action.payload
        },
        loading: {
          ...state.loading,
          fleetUtilization: false
        },
        errors: {
          ...state.errors,
          fleetUtilization: null
        },
        lastUpdated: {
          ...state.lastUpdated,
          fleetUtilization: new Date().toISOString()
        }
      };

    case FETCH_FLEET_UTILIZATION_FAILURE:
      return {
        ...state,
        loading: {
          ...state.loading,
          fleetUtilization: false
        },
        errors: {
          ...state.errors,
          fleetUtilization: action.payload
        }
      };

    // Maintenance Alerts
    case FETCH_MAINTENANCE_ALERTS_REQUEST:
      return {
        ...state,
        loading: {
          ...state.loading,
          maintenanceAlerts: true
        },
        errors: {
          ...state.errors,
          maintenanceAlerts: null
        }
      };

    case FETCH_MAINTENANCE_ALERTS_SUCCESS:
      return {
        ...state,
        maintenanceAlerts: action.payload,
        loading: {
          ...state.loading,
          maintenanceAlerts: false
        },
        errors: {
          ...state.errors,
          maintenanceAlerts: null
        },
        lastUpdated: {
          ...state.lastUpdated,
          maintenanceAlerts: new Date().toISOString()
        }
      };

    case FETCH_MAINTENANCE_ALERTS_FAILURE:
      return {
        ...state,
        loading: {
          ...state.loading,
          maintenanceAlerts: false
        },
        errors: {
          ...state.errors,
          maintenanceAlerts: action.payload
        }
      };

    // Recent Activities
    case FETCH_RECENT_ACTIVITIES_REQUEST:
      return {
        ...state,
        loading: {
          ...state.loading,
          recentActivities: true
        },
        errors: {
          ...state.errors,
          recentActivities: null
        }
      };

    case FETCH_RECENT_ACTIVITIES_SUCCESS:
      return {
        ...state,
        recentActivities: action.payload,
        loading: {
          ...state.loading,
          recentActivities: false
        },
        errors: {
          ...state.errors,
          recentActivities: null
        },
        lastUpdated: {
          ...state.lastUpdated,
          recentActivities: new Date().toISOString()
        }
      };

    case FETCH_RECENT_ACTIVITIES_FAILURE:
      return {
        ...state,
        loading: {
          ...state.loading,
          recentActivities: false
        },
        errors: {
          ...state.errors,
          recentActivities: action.payload
        }
      };

    // Performance Metrics
    case FETCH_PERFORMANCE_METRICS_REQUEST:
      return {
        ...state,
        loading: {
          ...state.loading,
          performanceMetrics: true
        },
        errors: {
          ...state.errors,
          performanceMetrics: null
        }
      };

    case FETCH_PERFORMANCE_METRICS_SUCCESS:
      return {
        ...state,
        performanceMetrics: {
          ...state.performanceMetrics,
          ...action.payload
        },
        loading: {
          ...state.loading,
          performanceMetrics: false
        },
        errors: {
          ...state.errors,
          performanceMetrics: null
        },
        lastUpdated: {
          ...state.lastUpdated,
          performanceMetrics: new Date().toISOString()
        }
      };

    case FETCH_PERFORMANCE_METRICS_FAILURE:
      return {
        ...state,
        loading: {
          ...state.loading,
          performanceMetrics: false
        },
        errors: {
          ...state.errors,
          performanceMetrics: action.payload
        }
      };

    // Global actions
    case CLEAR_DASHBOARD_DATA:
      return {
        ...initialState
      };

    case SET_DASHBOARD_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          global: action.payload
        }
      };

    case SET_DASHBOARD_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          global: action.payload
        }
      };

    default:
      return state;
  }
};

export default vehicleDashboardReducer;