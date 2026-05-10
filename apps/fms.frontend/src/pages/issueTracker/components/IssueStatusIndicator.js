import React from 'react';

/**
 * Issue Status Indicator Component
 * Displays status with appropriate styling and icons
 */
const IssueStatusIndicator = ({ status, size = 'md', showIcon = true, className = '' }) => {
  if (!status) {
    return null;
  }

  const getStatusConfig = (status) => {
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '');

    switch (normalizedStatus) {
      case 'open':
        return {
          color: 'tw-bg-blue-100 dark:tw-bg-blue-900/30 tw-text-blue-800 dark:tw-text-blue-300 tw-border-blue-200 dark:tw-border-blue-700',
          icon: 'fa-light fa-folder-open',
          label: 'Open',
          dotColor: 'tw-bg-blue-500'
        };
      case 'inprogress':
      case 'in-progress':
        return {
          color: 'tw-bg-yellow-100 dark:tw-bg-yellow-900/30 tw-text-yellow-800 dark:tw-text-yellow-300 tw-border-yellow-200 dark:tw-border-yellow-700',
          icon: 'fa-light fa-clock',
          label: 'In Progress',
          dotColor: 'tw-bg-yellow-500'
        };
      case 'pending':
        return {
          color: 'tw-bg-orange-100 dark:tw-bg-orange-900/30 tw-text-orange-800 dark:tw-text-orange-300 tw-border-orange-200 dark:tw-border-orange-700',
          icon: 'fa-light fa-pause',
          label: 'Pending',
          dotColor: 'tw-bg-orange-500'
        };
      case 'resolved':
        return {
          color: 'tw-bg-green-100 dark:tw-bg-green-900/30 tw-text-green-800 dark:tw-text-green-300 tw-border-green-200 dark:tw-border-green-700',
          icon: 'fa-light fa-check-circle',
          label: 'Resolved',
          dotColor: 'tw-bg-green-500'
        };
      case 'complete':
      case 'completed':
        return {
          color: 'tw-bg-emerald-100 dark:tw-bg-emerald-900/30 tw-text-emerald-800 dark:tw-text-emerald-300 tw-border-emerald-200 dark:tw-border-emerald-700',
          icon: 'fa-light fa-circle-check',
          label: 'Completed',
          dotColor: 'tw-bg-emerald-500'
        };
      case 'closed':
        return {
          color: 'tw-bg-gray-100 dark:tw-bg-gray-700 tw-text-gray-800 dark:tw-text-gray-200 tw-border-gray-200 dark:tw-border-gray-600',
          icon: 'fa-light fa-times-circle',
          label: 'Closed',
          dotColor: 'tw-bg-gray-500'
        };
      case 'cancelled':
      case 'canceled':
        return {
          color: 'tw-bg-red-100 dark:tw-bg-red-900/30 tw-text-red-800 dark:tw-text-red-300 tw-border-red-200 dark:tw-border-red-700',
          icon: 'fa-light fa-ban',
          label: 'Cancelled',
          dotColor: 'tw-bg-red-500'
        };
      case 'onhold':
      case 'on-hold':
        return {
          color: 'tw-bg-purple-100 dark:tw-bg-purple-900/30 tw-text-purple-800 dark:tw-text-purple-300 tw-border-purple-200 dark:tw-border-purple-700',
          icon: 'fa-light fa-hand',
          label: 'On Hold',
          dotColor: 'tw-bg-purple-500'
        };
      default:
        return {
          color: 'tw-bg-gray-100 dark:tw-bg-gray-700 tw-text-gray-800 dark:tw-text-gray-200 tw-border-gray-200 dark:tw-border-gray-600',
          icon: 'fa-light fa-question',
          label: status,
          dotColor: 'tw-bg-gray-500'
        };
    }
  };

  const getSizeClasses = (size) => {
    switch (size) {
      case 'sm':
        return {
          container: 'tw-px-2 tw-py-1 tw-text-xs',
          dot: 'tw-w-2 tw-h-2',
          icon: 'tw-text-xs'
        };
      case 'lg':
        return {
          container: 'tw-px-4 tw-py-2 tw-text-base',
          dot: 'tw-w-4 tw-h-4',
          icon: 'tw-text-base'
        };
      default: // md
        return {
          container: 'tw-px-3 tw-py-1 tw-text-sm',
          dot: 'tw-w-3 tw-h-3',
          icon: 'tw-text-sm'
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);

  return (
    <span className={`
      tw-inline-flex tw-items-center tw-rounded-full tw-border tw-font-medium
      ${config.color}
      ${sizeClasses.container}
      ${className}
    `}>
      {showIcon ? (
        <i className={`${config.icon} tw-mr-1 ${sizeClasses.icon}`}></i>
      ) : (
        <span className={`tw-rounded-full tw-mr-2 ${config.dotColor} ${sizeClasses.dot}`}></span>
      )}
      {config.label}
    </span>
  );
};

export default IssueStatusIndicator;
