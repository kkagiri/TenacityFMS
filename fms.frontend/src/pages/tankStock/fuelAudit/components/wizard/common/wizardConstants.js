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
  { step: 1, title: 'Sites & Period', icon: 'fa-building', description: 'Select sites and audit period' },
  { step: 2, title: 'Select Tanks', icon: 'fa-database', description: 'Choose tanks to include' },
  { step: 3, title: 'Tank Preview', icon: 'fa-chart-bar', description: 'Preview tank volume data' },
  { step: 4, title: 'Select Vehicles', icon: 'fa-truck', description: 'Choose vehicles to include' },
  { step: 5, title: 'Vehicle Preview', icon: 'fa-satellite', description: 'Preview GPS fuel data' },
  { step: 6, title: 'Reconciliation', icon: 'fa-scale-balanced', description: 'Fuel reconciliation view' },
  { step: 7, title: 'Audit Report', icon: 'fa-file-invoice', description: 'Final report & complete' }
];

// Total number of steps
export const TOTAL_STEPS = 7;

// Default wizard values
export const DEFAULT_WIZARD_VALUES = {
  auditType: 'Weekly',
  includeGpsFleet: true,
  includePickups: true,
  autoPopulateTankReadings: true
};
