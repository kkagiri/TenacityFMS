// Active Alarm types and interfaces

// Alarm States
export const ALARM_STATES = {
  ACTIVE: 'Active',
  ACKNOWLEDGED: 'Acknowledged',
  RESOLVED: 'Resolved',
  SUPPRESSED: 'Suppressed',
};

// Alarm Priorities
export const ALARM_PRIORITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

// Trigger Sources
export const TRIGGER_SOURCES = {
  MANUAL: 'Manual',
  POLICY: 'Policy',
  HARDWARE: 'Hardware',
  SYSTEM: 'System',
};

// Alarm Types (extend as needed)
export const ALARM_TYPES = {
  // Tank-related alarms
  LOW_TANK_VOLUME: 'LowTankVolume',
  HIGH_TANK_VOLUME: 'HighTankVolume',
  TANK_CRITICAL_HIGH_LEVEL: 'TankCriticalHighLevel',
  TANK_CRITICAL_LOW_LEVEL: 'TankCriticalLowLevel',
  TANK_LEAK_DETECTED: 'TankLeakDetected',
  TANK_OVERFILLING: 'TankOverfilling',

  // Device alarms
  DEVICE_DISCONNECTION: 'DeviceDisconnection',
  DEVICE_OFFLINE: 'DeviceOffline',
  PUMP_OFFLINE: 'PumpOffline',
  SENSOR_MALFUNCTION: 'SensorMalfunction',
  HARDWARE_FAILURE: 'HardwareFailure',

  // System alarms
  DISCREPANCY_DETECTED: 'DiscrepancyDetected',
  STOCK_DISCREPANCY: 'StockDiscrepancy',
  SYSTEM_ERROR: 'SystemError',
  COMMUNICATION_FAILURE: 'CommunicationFailure',
  POLICY_VIOLATION: 'PolicyViolation',
};

// Severity levels (maps to backend DiscrepancySeverity)
export const SEVERITY_LEVELS = {
  INFORMATION: 'Information',
  WARNING: 'Warning',
  ERROR: 'Error',
  CRITICAL: 'Critical',
};

// View modes for alarm display
export const VIEW_MODES = {
  GRID: 'grid',
  TABLE: 'table',
  CARD: 'card',
  LIST: 'list',
};

// Filter options
export const FILTER_OPTIONS = {
  states: Object.values(ALARM_STATES),
  priorities: Object.values(ALARM_PRIORITIES),
  triggerSources: Object.values(TRIGGER_SOURCES),
  alarmTypes: Object.values(ALARM_TYPES),
  severities: Object.values(SEVERITY_LEVELS),
};

// Default pagination
export const DEFAULT_PAGINATION = {
  skip: 0,
  take: 50,
  currentPage: 1,
};

// Priority colors for UI
export const PRIORITY_COLORS = {
  [ALARM_PRIORITIES.LOW]: '#28a745',      // Green
  [ALARM_PRIORITIES.MEDIUM]: '#ffc107',   // Yellow
  [ALARM_PRIORITIES.HIGH]: '#fd7e14',     // Orange
  [ALARM_PRIORITIES.CRITICAL]: '#dc3545', // Red
};

// State colors for UI
export const STATE_COLORS = {
  [ALARM_STATES.ACTIVE]: '#dc3545',       // Red
  [ALARM_STATES.ACKNOWLEDGED]: '#ffc107', // Yellow
  [ALARM_STATES.RESOLVED]: '#28a745',     // Green
  [ALARM_STATES.SUPPRESSED]: '#6c757d',   // Gray
};

// Priority order for sorting
export const PRIORITY_ORDER = {
  [ALARM_PRIORITIES.CRITICAL]: 4,
  [ALARM_PRIORITIES.HIGH]: 3,
  [ALARM_PRIORITIES.MEDIUM]: 2,
  [ALARM_PRIORITIES.LOW]: 1,
};

// Auto-resolve default times (in minutes)
export const AUTO_RESOLVE_DEFAULTS = {
  [ALARM_TYPES.DEVICE_DISCONNECTION]: 30,
  [ALARM_TYPES.COMMUNICATION_FAILURE]: 15,
  [ALARM_TYPES.SENSOR_MALFUNCTION]: 60,
  [ALARM_TYPES.LOW_TANK_VOLUME]: 0, // Manual only
  [ALARM_TYPES.HIGH_TANK_VOLUME]: 0, // Manual only
  [ALARM_TYPES.TANK_LEAK_DETECTED]: 0, // Manual only
  DEFAULT: 0, // Manual resolution
};

// Escalation intervals (in minutes)
export const ESCALATION_INTERVALS = {
  [ALARM_PRIORITIES.CRITICAL]: 30,
  [ALARM_PRIORITIES.HIGH]: 120,
  [ALARM_PRIORITIES.MEDIUM]: 1440, // 24 hours
  [ALARM_PRIORITIES.LOW]: 10080,   // 7 days
};

// Alarm type categories for grouping
export const ALARM_CATEGORIES = {
  TANK: 'Tank Operations',
  DEVICE: 'Device & Hardware',
  SYSTEM: 'System & Communication',
  FUEL: 'Fuel Management',
  SAFETY: 'Safety & Compliance',
};

// Alarm type to category mapping
export const ALARM_TYPE_CATEGORIES = {
  [ALARM_TYPES.LOW_TANK_VOLUME]: ALARM_CATEGORIES.TANK,
  [ALARM_TYPES.HIGH_TANK_VOLUME]: ALARM_CATEGORIES.TANK,
  [ALARM_TYPES.TANK_CRITICAL_HIGH_LEVEL]: ALARM_CATEGORIES.SAFETY,
  [ALARM_TYPES.TANK_CRITICAL_LOW_LEVEL]: ALARM_CATEGORIES.SAFETY,
  [ALARM_TYPES.TANK_LEAK_DETECTED]: ALARM_CATEGORIES.SAFETY,
  [ALARM_TYPES.TANK_OVERFILLING]: ALARM_CATEGORIES.SAFETY,

  [ALARM_TYPES.DEVICE_DISCONNECTION]: ALARM_CATEGORIES.DEVICE,
  [ALARM_TYPES.DEVICE_OFFLINE]: ALARM_CATEGORIES.DEVICE,
  [ALARM_TYPES.PUMP_OFFLINE]: ALARM_CATEGORIES.DEVICE,
  [ALARM_TYPES.SENSOR_MALFUNCTION]: ALARM_CATEGORIES.DEVICE,
  [ALARM_TYPES.HARDWARE_FAILURE]: ALARM_CATEGORIES.DEVICE,

  [ALARM_TYPES.DISCREPANCY_DETECTED]: ALARM_CATEGORIES.FUEL,
  [ALARM_TYPES.STOCK_DISCREPANCY]: ALARM_CATEGORIES.FUEL,
  [ALARM_TYPES.SYSTEM_ERROR]: ALARM_CATEGORIES.SYSTEM,
  [ALARM_TYPES.COMMUNICATION_FAILURE]: ALARM_CATEGORIES.SYSTEM,
  [ALARM_TYPES.POLICY_VIOLATION]: ALARM_CATEGORIES.SYSTEM,
};

// Icons for alarm types
export const ALARM_TYPE_ICONS = {
  [ALARM_TYPES.LOW_TANK_VOLUME]: 'fa-light fa-gas-pump-slash',
  [ALARM_TYPES.HIGH_TANK_VOLUME]: 'fa-light fa-gas-pump',
  [ALARM_TYPES.TANK_CRITICAL_HIGH_LEVEL]: 'fa-light fa-triangle-exclamation',
  [ALARM_TYPES.TANK_CRITICAL_LOW_LEVEL]: 'fa-light fa-triangle-exclamation',
  [ALARM_TYPES.TANK_LEAK_DETECTED]: 'fa-light fa-droplet',
  [ALARM_TYPES.TANK_OVERFILLING]: 'fa-light fa-fill-drip',

  [ALARM_TYPES.DEVICE_DISCONNECTION]: 'fa-light fa-wifi-slash',
  [ALARM_TYPES.DEVICE_OFFLINE]: 'fa-light fa-power-off',
  [ALARM_TYPES.PUMP_OFFLINE]: 'fa-light fa-gas-pump-slash',
  [ALARM_TYPES.SENSOR_MALFUNCTION]: 'fa-light fa-sensor',
  [ALARM_TYPES.HARDWARE_FAILURE]: 'fa-light fa-microchip',

  [ALARM_TYPES.DISCREPANCY_DETECTED]: 'fa-light fa-balance-scale',
  [ALARM_TYPES.STOCK_DISCREPANCY]: 'fa-light fa-boxes',
  [ALARM_TYPES.SYSTEM_ERROR]: 'fa-light fa-bug',
  [ALARM_TYPES.COMMUNICATION_FAILURE]: 'fa-light fa-wifi-slash',
  [ALARM_TYPES.POLICY_VIOLATION]: 'fa-light fa-shield-xmark',
};

// Default icons
export const DEFAULT_ICONS = {
  ALARM: 'fa-light fa-bell',
  ACKNOWLEDGE: 'fa-light fa-check',
  RESOLVE: 'fa-light fa-check-double',
  SUPPRESS: 'fa-light fa-volume-mute',
  ESCALATE: 'fa-light fa-arrow-up',
  PRIORITY: 'fa-light fa-flag',
  STATE: 'fa-light fa-circle',
};

// Sort options for alarm lists
export const SORT_OPTIONS = [
  { value: 'triggeredAt_desc', label: 'Newest First' },
  { value: 'triggeredAt_asc', label: 'Oldest First' },
  { value: 'priority_desc', label: 'Highest Priority' },
  { value: 'priority_asc', label: 'Lowest Priority' },
  { value: 'alarmType_asc', label: 'Alarm Type A-Z' },
  { value: 'site_asc', label: 'Site A-Z' },
  { value: 'state_asc', label: 'State' },
];

// Quick filter presets
export const QUICK_FILTERS = {
  CRITICAL_ACTIVE: {
    priority: ALARM_PRIORITIES.CRITICAL,
    state: ALARM_STATES.ACTIVE,
    name: 'Critical Active',
    icon: 'fa-light fa-exclamation-triangle',
    color: '#dc3545',
  },
  UNACKNOWLEDGED: {
    state: ALARM_STATES.ACTIVE,
    name: 'Unacknowledged',
    icon: 'fa-light fa-bell',
    color: '#ffc107',
  },
  HIGH_PRIORITY: {
    priority: [ALARM_PRIORITIES.HIGH, ALARM_PRIORITIES.CRITICAL],
    name: 'High Priority',
    icon: 'fa-light fa-flag',
    color: '#fd7e14',
  },
  TANK_ALARMS: {
    alarmType: [
      ALARM_TYPES.LOW_TANK_VOLUME,
      ALARM_TYPES.HIGH_TANK_VOLUME,
      ALARM_TYPES.TANK_CRITICAL_HIGH_LEVEL,
      ALARM_TYPES.TANK_CRITICAL_LOW_LEVEL,
      ALARM_TYPES.TANK_LEAK_DETECTED,
    ],
    name: 'Tank Alarms',
    icon: 'fa-light fa-gas-pump',
    color: '#0d6efd',
  },
  DEVICE_ALARMS: {
    alarmType: [
      ALARM_TYPES.DEVICE_DISCONNECTION,
      ALARM_TYPES.DEVICE_OFFLINE,
      ALARM_TYPES.PUMP_OFFLINE,
      ALARM_TYPES.SENSOR_MALFUNCTION,
      ALARM_TYPES.HARDWARE_FAILURE,
    ],
    name: 'Device Issues',
    icon: 'fa-light fa-microchip',
    color: '#6f42c1',
  },
};

// Response time targets (in minutes)
export const RESPONSE_TIME_TARGETS = {
  [ALARM_PRIORITIES.CRITICAL]: 15,
  [ALARM_PRIORITIES.HIGH]: 60,
  [ALARM_PRIORITIES.MEDIUM]: 240,
  [ALARM_PRIORITIES.LOW]: 1440,
};

// Notification settings
export const NOTIFICATION_SETTINGS = {
  DISABLE_FALLBACK_ALL_USERS: true,
  AUTO_SUPPRESS_DUPLICATES: true,
  MAX_NOTIFICATIONS_PER_HOUR: 10,
  BATCH_NOTIFICATION_DELAY: 300, // 5 minutes
};
