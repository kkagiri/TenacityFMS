/**
 * File: issueDetailUtils.js
 * Purpose: Pure utility functions for the Issue Tracker Detail page
 * Dependencies: None
 * Last Modified: 2026-02-23
 *
 * Key Functions:
 * - parseDateSafe: Safely parses a date value
 * - formatDateTime: Formats a date for display
 * - toDateInputValue: Converts date for HTML date input
 * - toNullableInt: Converts a value to nullable integer
 * - getCategoryLabel / getPriorityLabel / getStatusLabel: Display label extractors
 * - normalizeIssueTags: Extracts tag names from issue data
 * - findStatusByKeywords / findPriorityByKeywords: Lookup helpers
 * - normalizeIssueListResponse / normalizeLookupResponse: API response normalizers
 * - formatFileSize: Human-readable byte sizes
 * - getCategoryIcon / getCategoryColor: Attachment category visuals
 */

export const ATTACHMENT_CATEGORIES = ['Installation', 'Calibration', 'General'];
export const ISSUE_DELETE_PERMISSION = '_Delete_Issues';

export const parseDateSafe = (value) => {
  if (!value) return null;
  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const formatDateTime = (value) => {
  const parsedDate = parseDateSafe(value);
  if (!parsedDate) return 'Not available';
  return parsedDate.toLocaleString();
};

export const toDateInputValue = (value) => {
  const parsedDate = parseDateSafe(value);
  if (!parsedDate) return '';
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const toNullableInt = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

export const getCategoryLabel = (category) => category?.name || category?.categoryName || '';
export const getPriorityLabel = (priority) => priority?.name || priority?.priorityName || priority?.priority || '';
export const getStatusLabel = (status) => status?.status || status?.name || status?.statusName || '';

export const normalizeIssueTags = (issueData) => {
  if (!issueData) return [];
  if (Array.isArray(issueData.issueCategoryTagNames) && issueData.issueCategoryTagNames.length > 0) {
    return issueData.issueCategoryTagNames;
  }
  if (issueData.categoryName) return [issueData.categoryName];
  return [];
};

export const findStatusByKeywords = (items, keywords) => {
  if (!Array.isArray(items)) return null;
  return items.find((item) => {
    const normalizedLabel = getStatusLabel(item).toLowerCase();
    return keywords.some((keyword) => normalizedLabel.includes(keyword));
  }) || null;
};

export const findPriorityByKeywords = (items, keywords) => {
  if (!Array.isArray(items)) return null;
  return items.find((item) => {
    const normalizedLabel = getPriorityLabel(item).toLowerCase();
    return keywords.some((keyword) => normalizedLabel.includes(keyword));
  }) || null;
};

export const includesKeyword = (value, keywords) => {
  const normalizedValue = (value || '').toLowerCase();
  return keywords.some((keyword) => normalizedValue.includes(keyword));
};

export const normalizeIssueListResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

export const normalizeLookupResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

export const getCategoryIcon = (cat) => {
  switch ((cat || '').toLowerCase()) {
    case 'installation': return 'fa-light fa-camera';
    case 'calibration': return 'fa-light fa-ruler-combined';
    default: return 'fa-light fa-file';
  }
};

export const getCategoryColor = (cat) => {
  switch ((cat || '').toLowerCase()) {
    case 'installation': return 'tw-bg-green-100 tw-text-green-700';
    case 'calibration': return 'tw-bg-orange-100 tw-text-orange-700';
    default: return 'tw-bg-gray-100 tw-text-gray-700';
  }
};
