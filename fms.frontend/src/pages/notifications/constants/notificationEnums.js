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
  { value: 'System', text: 'System' },
  { value: 'Email', text: 'Email' },
  { value: 'SMS', text: 'SMS' }
];

// Helper maps for quick validation / membership checks
export const notificationTypesSet = new Set(notificationTypeOptions.map(o => o.value));
export const notificationPrioritiesSet = new Set(notificationPriorityOptions.map(o => o.value));
export const deliveryMethodsSet = new Set(deliveryMethodOptions.map(o => o.value));
