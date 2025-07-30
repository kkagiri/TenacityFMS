import React from 'react';
import { Button } from 'devextreme-react';

/**
 * Issue Dashboard Statistics Component
 * Displays key statistics and metrics for the Issue Tracker dashboard
 */
const IssueDashboardStats = ({ stats, onPriorityFilter, onStatusFilter, className = '' }) => {
  if (!stats) {
    return null;
  }

  const {
    totalIssues = 0,
    openCount = 0,
    inProgressCount = 0,
    criticalCount = 0,
    highCount = 0,
    averageResolutionTime = 0,
    issuesCreatedToday = 0,
    issuesResolvedToday = 0,
    overdueIssues = 0,
    unassignedIssues = 0,
    gpsGeneratedIssues = 0
  } = stats;

  const StatCard = ({
    title,
    value,
    icon,
    color = 'blue',
    subtitle,
    onClick,
    trend,
    trendDirection
  }) => {
    const getColorClasses = (color) => {
      switch (color) {
        case 'red':
          return {
            bg: 'tw-bg-red-50',
            border: 'tw-border-red-200',
            icon: 'tw-text-red-600',
            text: 'tw-text-red-900',
            button: 'hover:tw-bg-red-100'
          };
        case 'orange':
          return {
            bg: 'tw-bg-orange-50',
            border: 'tw-border-orange-200',
            icon: 'tw-text-orange-600',
            text: 'tw-text-orange-900',
            button: 'hover:tw-bg-orange-100'
          };
        case 'yellow':
          return {
            bg: 'tw-bg-yellow-50',
            border: 'tw-border-yellow-200',
            icon: 'tw-text-yellow-600',
            text: 'tw-text-yellow-900',
            button: 'hover:tw-bg-yellow-100'
          };
        case 'green':
          return {
            bg: 'tw-bg-green-50',
            border: 'tw-border-green-200',
            icon: 'tw-text-green-600',
            text: 'tw-text-green-900',
            button: 'hover:tw-bg-green-100'
          };
        case 'purple':
          return {
            bg: 'tw-bg-purple-50',
            border: 'tw-border-purple-200',
            icon: 'tw-text-purple-600',
            text: 'tw-text-purple-900',
            button: 'hover:tw-bg-purple-100'
          };
        case 'gray':
          return {
            bg: 'tw-bg-gray-50',
            border: 'tw-border-gray-200',
            icon: 'tw-text-gray-600',
            text: 'tw-text-gray-900',
            button: 'hover:tw-bg-gray-100'
          };
        default: // blue
          return {
            bg: 'tw-bg-blue-50',
            border: 'tw-border-blue-200',
            icon: 'tw-text-blue-600',
            text: 'tw-text-blue-900',
            button: 'hover:tw-bg-blue-100'
          };
      }
    };

    const colorClasses = getColorClasses(color);
    const isClickable = typeof onClick === 'function';

    const content = (
      <div className={`
        tw-bg-white tw-rounded-lg tw-shadow-sm tw-border-l-4 tw-p-6 tw-transition-all tw-duration-200
        ${colorClasses.border}
        ${isClickable ? `tw-cursor-pointer ${colorClasses.button}` : ''}
      `}>
        <div className="tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex-1">
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
              <h3 className="tw-text-sm tw-font-medium tw-text-gray-600 tw-uppercase tw-tracking-wide">
                {title}
              </h3>
              {icon && (
                <i className={`${icon} tw-text-2xl ${colorClasses.icon}`}></i>
              )}
            </div>

            <div className="tw-flex tw-items-baseline tw-justify-between">
              <p className={`tw-text-3xl tw-font-bold ${colorClasses.text}`}>
                {value.toLocaleString()}
              </p>

              {trend !== undefined && (
                <div className={`tw-flex tw-items-center tw-text-sm ${
                  trendDirection === 'up' ? 'tw-text-green-600' :
                  trendDirection === 'down' ? 'tw-text-red-600' : 'tw-text-gray-600'
                }`}>
                  {trendDirection === 'up' && <i className="fa-light fa-arrow-up tw-mr-1"></i>}
                  {trendDirection === 'down' && <i className="fa-light fa-arrow-down tw-mr-1"></i>}
                  {trend}%
                </div>
              )}
            </div>

            {subtitle && (
              <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    );

    return isClickable ? (
      <div onClick={onClick}>
        {content}
      </div>
    ) : content;
  };

  const formatTime = (hours) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  return (
    <div className={`issue-dashboard-stats tw-mb-8 ${className}`}>
      {/* Main Statistics Grid */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6 tw-mb-6">

        {/* Total Issues */}
        <StatCard
          title="Total Issues"
          value={totalIssues}
          icon="fa-light fa-exclamation-triangle"
          color="blue"
          subtitle="All issues in system"
        />

        {/* Open Issues */}
        <StatCard
          title="Open Issues"
          value={openCount}
          icon="fa-light fa-folder-open"
          color="orange"
          subtitle="Requires attention"
          onClick={() => onStatusFilter && onStatusFilter('Open')}
        />

        {/* In Progress */}
        <StatCard
          title="In Progress"
          value={inProgressCount}
          icon="fa-light fa-clock"
          color="yellow"
          subtitle="Being worked on"
          onClick={() => onStatusFilter && onStatusFilter('In Progress')}
        />

        {/* Resolved Today */}
        <StatCard
          title="Resolved Today"
          value={issuesResolvedToday}
          icon="fa-light fa-check-circle"
          color="green"
          subtitle="Completed today"
        />
      </div>

      {/* Priority and Status Grid */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6 tw-mb-6">

        {/* Critical Issues */}
        <StatCard
          title="Critical"
          value={criticalCount}
          icon="fa-light fa-exclamation-triangle"
          color="red"
          subtitle="Immediate attention"
          onClick={() => onPriorityFilter && onPriorityFilter('Critical')}
        />

        {/* High Priority */}
        <StatCard
          title="High Priority"
          value={highCount}
          icon="fa-light fa-chevron-up"
          color="orange"
          subtitle="High importance"
          onClick={() => onPriorityFilter && onPriorityFilter('High')}
        />

        {/* Overdue Issues */}
        <StatCard
          title="Overdue"
          value={overdueIssues}
          icon="fa-light fa-clock-exclamation"
          color="red"
          subtitle="Past due date"
        />

        {/* Unassigned */}
        <StatCard
          title="Unassigned"
          value={unassignedIssues}
          icon="fa-light fa-user-slash"
          color="gray"
          subtitle="Needs assignment"
        />
      </div>

      {/* Performance and GPS Stats */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6">

        {/* Average Resolution Time */}
        <StatCard
          title="Avg Resolution Time"
          value={formatTime(averageResolutionTime)}
          icon="fa-light fa-stopwatch"
          color="purple"
          subtitle="Time to resolve"
        />

        {/* GPS Generated Issues */}
        <StatCard
          title="GPS Auto-Created"
          value={gpsGeneratedIssues}
          icon="fa-light fa-satellite-dish"
          color="blue"
          subtitle="From GPS monitoring"
        />

        {/* Issues Created Today */}
        <StatCard
          title="Created Today"
          value={issuesCreatedToday}
          icon="fa-light fa-plus-circle"
          color="green"
          subtitle="New issues today"
        />
      </div>

      {/* Quick Action Buttons */}
      <div className="tw-flex tw-flex-wrap tw-gap-3 tw-mt-6 tw-pt-6 tw-border-t tw-border-gray-200">
        <Button
          text="View Critical Issues"
          icon="fa-light fa-exclamation-triangle"
          type="default"
          stylingMode="outlined"
          onClick={() => onPriorityFilter && onPriorityFilter('Critical')}
          className="tw-border-red-500 tw-text-red-600 hover:tw-bg-red-50"
        />

        <Button
          text="View Open Issues"
          icon="fa-light fa-folder-open"
          type="normal"
          stylingMode="outlined"
          onClick={() => onStatusFilter && onStatusFilter('Open')}
          className="tw-border-blue-500 tw-text-blue-600 hover:tw-bg-blue-50"
        />

        <Button
          text="View Unassigned"
          icon="fa-light fa-user-slash"
          type="normal"
          stylingMode="outlined"
          onClick={() => {/* TODO: Filter unassigned */}}
          className="tw-border-gray-500 tw-text-gray-600 hover:tw-bg-gray-50"
        />

        {overdueIssues > 0 && (
          <Button
            text={`View ${overdueIssues} Overdue`}
            icon="fa-light fa-clock-exclamation"
            type="normal"
            stylingMode="outlined"
            onClick={() => {/* TODO: Filter overdue */}}
            className="tw-border-orange-500 tw-text-orange-600 hover:tw-bg-orange-50"
          />
        )}
      </div>
    </div>
  );
};

export default IssueDashboardStats;
