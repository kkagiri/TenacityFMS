// Shared notification enum options aligned with backend NotificationEnums.cs
// Each exported array contains objects: { value, text }

export const notificationPriorityOptions = [
  { value: 'Low', text: 'Low' },
  { value: 'Medium', text: 'Medium' },
  { value: 'High', text: 'High' },
  { value: 'Critical', text: 'Critical' }
];

export const notificationTypeOptions = [
  // Backend enum: Info, Warning, Alert, Error
  { value: 'Info', text: 'Info' },
  { value: 'Warning', text: 'Warning' },
  { value: 'Alert', text: 'Alert' },
  { value: 'Error', text: 'Error' }
];

export const deliveryMethodOptions = [
  { value: 'System', text: 'In-App', icon: 'fa-light fa-bell', description: 'Real-time in-app notifications' },
  { value: 'Email', text: 'Email', icon: 'fa-light fa-envelope', description: 'Email notifications' },
  { value: 'SMS', text: 'SMS', icon: 'fa-light fa-message-sms', description: 'Text message notifications' },
  { value: 'Push', text: 'Push', icon: 'fa-light fa-mobile-notch', description: 'Mobile/web push notifications' }
];

// Helper maps for quick validation / membership checks
export const notificationTypesSet = new Set(notificationTypeOptions.map(o => o.value));
export const notificationPrioritiesSet = new Set(notificationPriorityOptions.map(o => o.value));
export const deliveryMethodsSet = new Set(deliveryMethodOptions.map(o => o.value));

// Priority colors for UI
export const priorityColors = {
  Low: { bg: 'tw-bg-gray-100', text: 'tw-text-gray-600', border: 'tw-border-gray-300' },
  Medium: { bg: 'tw-bg-blue-100', text: 'tw-text-blue-600', border: 'tw-border-blue-300' },
  High: { bg: 'tw-bg-orange-100', text: 'tw-text-orange-600', border: 'tw-border-orange-300' },
  Critical: { bg: 'tw-bg-red-100', text: 'tw-text-red-600', border: 'tw-border-red-300' }
};

// Notification type colors for UI
export const typeColors = {
  Info: { bg: 'tw-bg-blue-100', text: 'tw-text-blue-600', icon: 'fa-circle-info' },
  Warning: { bg: 'tw-bg-yellow-100', text: 'tw-text-yellow-600', icon: 'fa-triangle-exclamation' },
  Alert: { bg: 'tw-bg-orange-100', text: 'tw-text-orange-600', icon: 'fa-bell' },
  Error: { bg: 'tw-bg-red-100', text: 'tw-text-red-600', icon: 'fa-circle-xmark' }
};
