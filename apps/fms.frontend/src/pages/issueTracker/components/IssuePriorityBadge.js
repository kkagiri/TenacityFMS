import React from 'react';

/**
 * Issue Priority Badge Component
 * Displays priority level with appropriate styling
 */
const IssuePriorityBadge = ({ priority, size = 'md', showIcon = true, className = '' }) => {
  if (!priority) {
    return null;
  }

  const getPriorityConfig = (priority) => {
    const normalizedPriority = priority.toLowerCase();

    switch (normalizedPriority) {
      case 'critical':
        return {
          color: 'tw-bg-red-100 dark:tw-bg-red-900/30 tw-text-red-800 dark:tw-text-red-300 tw-border-red-200 dark:tw-border-red-700',
          icon: 'fa-light fa-exclamation-triangle',
          label: 'Critical'
        };
      case 'high':
        return {
          color: 'tw-bg-orange-100 dark:tw-bg-orange-900/30 tw-text-orange-800 dark:tw-text-orange-300 tw-border-orange-200 dark:tw-border-orange-700',
          icon: 'fa-light fa-chevron-up',
          label: 'High'
        };
      case 'medium':
        return {
          color: 'tw-bg-yellow-100 dark:tw-bg-yellow-900/30 tw-text-yellow-800 dark:tw-text-yellow-300 tw-border-yellow-200 dark:tw-border-yellow-700',
          icon: 'fa-light fa-minus',
          label: 'Medium'
        };
      case 'low':
        return {
          color: 'tw-bg-green-100 dark:tw-bg-green-900/30 tw-text-green-800 dark:tw-text-green-300 tw-border-green-200 dark:tw-border-green-700',
          icon: 'fa-light fa-chevron-down',
          label: 'Low'
        };
      default:
        return {
          color: 'tw-bg-gray-100 dark:tw-bg-gray-700 tw-text-gray-800 dark:tw-text-gray-200 tw-border-gray-200 dark:tw-border-gray-600',
          icon: 'fa-light fa-question',
          label: priority
        };
    }
  };

  const getSizeClasses = (size) => {
    switch (size) {
      case 'sm':
        return 'tw-px-2 tw-py-1 tw-text-xs';
      case 'lg':
        return 'tw-px-4 tw-py-2 tw-text-base';
      default: // md
        return 'tw-px-3 tw-py-1 tw-text-sm';
    }
  };

  const config = getPriorityConfig(priority);
  const sizeClasses = getSizeClasses(size);

  return (
    <span className={`
      tw-inline-flex tw-items-center tw-rounded-full tw-border tw-font-medium
      ${config.color}
      ${sizeClasses}
      ${className}
    `}>
      {showIcon && (
        <i className={`${config.icon} tw-mr-1`}></i>
      )}
      {config.label}
    </span>
  );
};

export default IssuePriorityBadge;
