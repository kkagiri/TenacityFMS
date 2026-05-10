/**
 * Volume Change Reason Enum mapping
 * IMPORTANT: Must match backend enum in FMS.Domain/Entities/enums/VolumeChangeReasonEnum.cs
 */
export const VolumeChangeReasonEnum = [
  { id: 0, name: 'Opening Stock' },
  { id: 1, name: 'Closing Stock' },
  { id: 2, name: 'Delivery' },
  { id: 3, name: 'Transfer In' },
  { id: 4, name: 'Transfer Out' },
  { id: 5, name: 'Adjustment' },
  { id: 6, name: 'Dispensing' },
  { id: 7, name: 'Automated Dispensing' },
  { id: 8, name: 'Reconciliation' },
  { id: 9, name: 'Automated Reconciliation' }
];