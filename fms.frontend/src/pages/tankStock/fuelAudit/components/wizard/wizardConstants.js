/**
 * wizardConstants.js
 * Constants and configuration for the Fuel Audit Wizard
 */

// Audit type options
export const AUDIT_TYPES = [
  { value: 'Daily', label: 'Daily Audit' },
  { value: 'Weekly', label: 'Weekly Audit' },
  { value: 'Monthly', label: 'Monthly Audit' },
  { value: 'Special', label: 'Special Investigation' }
];

// Step configuration with titles and icons
export const STEP_CONFIG = [
  { step: 1, title: 'Site & Period', icon: 'fa-building', description: 'Select site and audit period' },
  { step: 2, title: 'Select Tanks', icon: 'fa-database', description: 'Choose tanks to include' },
  { step: 3, title: 'Tank Preview', icon: 'fa-chart-bar', description: 'Preview tank volume data' },
  { step: 4, title: 'Select Vehicles', icon: 'fa-truck', description: 'Choose vehicles to include' },
  { step: 5, title: 'GPS Preview', icon: 'fa-satellite', description: 'Preview GPS fuel data' },
  { step: 6, title: 'Review & Create', icon: 'fa-check-circle', description: 'Review and create audit' }
];

// Total number of steps
export const TOTAL_STEPS = 6;

// Default wizard values
export const DEFAULT_WIZARD_VALUES = {
  auditType: 'Weekly',
  includeGpsFleet: true,
  includePickups: true,
  autoPopulateTankReadings: true
};
