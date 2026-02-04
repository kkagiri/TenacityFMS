/**
 * File: issueCreateFormUtils.js
 * Purpose: Utility helpers and constants for IssueCreateForm data shaping and progress mapping
 * Dependencies: None
 * Last Modified: 2026-02-03
 *
 * Key Functions:
 * - createInitialFormState: Creates default form state with locked Opened By and Status values
 * - normalizeCollection: Normalizes Redux payload shapes into arrays
 * - resolveIssueId: Resolves issue IDs from backend response shapes
 */
export const PROCESS_STEP_LABELS = [
  'Device Type',
  'Template',
  'Issue Details',
  'Assigned To',
  'Timeline',
  'Attachments',
  'Save'
];

export const createInitialFormState = (openByUserName, openStatus) => ({
  deviceTypeId: null,
  deviceType: null,
  issueTemplateId: null,
  issueTemplate: null,
  issueCategoryId: null,
  siteId: null,
  vehicleId: null,
  assignTo: '',
  openBy: openByUserName || 'System',
  statusId: openStatus?.id ?? null,
  statusName: openStatus?.status || openStatus?.name || 'Open',
  openDate: new Date(),
  dueDate: '',
  timelineNotes: '',
  priorityId: null,
  canAutoClose: false,
  issueTitle: '',
  issueDescription: '',
  attachments: []
});

export const normalizeCollection = (source) => {
  if (Array.isArray(source)) {
    return source;
  }

  if (Array.isArray(source?.data)) {
    return source.data;
  }

  return [];
};

export const getUserName = (user) => user?.userName || user?.username || user?.UserName || '';
export const getUserEmail = (user) => user?.email || user?.Email || '';

export const resolveIssueId = (response) => {
  if (typeof response === 'number' && Number.isFinite(response)) {
    return response;
  }

  if (typeof response === 'string' && response.trim() && !Number.isNaN(Number(response))) {
    return Number(response);
  }

  if (!response || typeof response !== 'object') {
    return null;
  }

  return (
    resolveIssueId(response.id) ||
    resolveIssueId(response.Id) ||
    resolveIssueId(response.issueId) ||
    resolveIssueId(response.IssueId) ||
    resolveIssueId(response.data) ||
    resolveIssueId(response.Data)
  );
};
