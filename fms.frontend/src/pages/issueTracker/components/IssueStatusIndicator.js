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
          color: 'tw-bg-blue-100 tw-text-blue-800 tw-border-blue-200',
          icon: 'fa-light fa-folder-open',
          label: 'Open',
          dotColor: 'tw-bg-blue-500'
        };
      case 'inprogress':
      case 'in-progress':
        return {
          color: 'tw-bg-yellow-100 tw-text-yellow-800 tw-border-yellow-200',
          icon: 'fa-light fa-clock',
          label: 'In Progress',
          dotColor: 'tw-bg-yellow-500'
        };
      case 'pending':
        return {
          color: 'tw-bg-orange-100 tw-text-orange-800 tw-border-orange-200',
          icon: 'fa-light fa-pause',
          label: 'Pending',
          dotColor: 'tw-bg-orange-500'
        };
      case 'resolved':
        return {
          color: 'tw-bg-green-100 tw-text-green-800 tw-border-green-200',
          icon: 'fa-light fa-check-circle',
          label: 'Resolved',
          dotColor: 'tw-bg-green-500'
        };
      case 'closed':
        return {
          color: 'tw-bg-gray-100 tw-text-gray-800 tw-border-gray-200',
          icon: 'fa-light fa-times-circle',
          label: 'Closed',
          dotColor: 'tw-bg-gray-500'
        };
      case 'cancelled':
      case 'canceled':
        return {
          color: 'tw-bg-red-100 tw-text-red-800 tw-border-red-200',
          icon: 'fa-light fa-ban',
          label: 'Cancelled',
          dotColor: 'tw-bg-red-500'
        };
      case 'onhold':
      case 'on-hold':
        return {
          color: 'tw-bg-purple-100 tw-text-purple-800 tw-border-purple-200',
          icon: 'fa-light fa-hand',
          label: 'On Hold',
          dotColor: 'tw-bg-purple-500'
        };
      default:
        return {
          color: 'tw-bg-gray-100 tw-text-gray-800 tw-border-gray-200',
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
