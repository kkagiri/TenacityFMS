import React from 'react';
import { Button } from 'devextreme-react';
import IssuePriorityBadge from './IssuePriorityBadge';
import IssueStatusIndicator from './IssueStatusIndicator';
import './IssueCard.scss';

/**
 * Issue Card Component
 * Displays individual issue information in a card format
 */
const IssueCard = ({
  issue,
  onView,
  onEdit,
  onAssign,
  className = '',
  showActions = true,
  compact = false
}) => {
  if (!issue) {
    return null;
  }

  const {
    id,
    title,
    description,
    priority,
    status,
    vehicle,
    assignedTo,
    createdDate,
    updatedDate,
    category,
    gpsLatitude,
    gpsLongitude,
    autoCreated
  } = issue;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'tw-border-red-500 tw-bg-red-50';
      case 'high':
        return 'tw-border-orange-500 tw-bg-orange-50';
      case 'medium':
        return 'tw-border-yellow-500 tw-bg-yellow-50';
      case 'low':
        return 'tw-border-green-500 tw-bg-green-50';
      default:
        return 'tw-border-gray-300 tw-bg-white';
    }
  };

  const hasGPSData = gpsLatitude && gpsLongitude;

  return (
    <div className={`issue-card tw-border-l-4 tw-bg-white tw-rounded-lg tw-shadow-sm hover:tw-shadow-md tw-transition-shadow tw-duration-200 ${getPriorityColor(priority)} ${className}`}>
      <div className={`tw-p-4 ${compact ? 'tw-p-3' : 'tw-p-4'}`}>

        {/* Header */}
        <div className="tw-flex tw-justify-between tw-items-start tw-mb-3">
          <div className="tw-flex-1">
            <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
              <span className="tw-text-sm tw-font-medium tw-text-gray-500">#{id}</span>
              {autoCreated && (
                <span className="tw-inline-flex tw-items-center tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium tw-bg-blue-100 tw-text-blue-800">
                  <i className="fa-light fa-satellite-dish tw-mr-1"></i>
                  Auto-Created
                </span>
              )}
              {hasGPSData && (
                <span className="tw-inline-flex tw-items-center tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium tw-bg-green-100 tw-text-green-800">
                  <i className="fa-light fa-map-marker-alt tw-mr-1"></i>
                  GPS
                </span>
              )}
            </div>

            <h4 className={`tw-font-semibold tw-text-gray-900 tw-line-clamp-2 ${compact ? 'tw-text-sm' : 'tw-text-base'}`}>
              {title}
            </h4>
          </div>

          <div className="tw-flex tw-items-center tw-gap-2 tw-ml-3">
            <IssuePriorityBadge priority={priority} size={compact ? 'sm' : 'md'} />
          </div>
        </div>

        {/* Description */}
        {!compact && description && (
          <p className="tw-text-sm tw-text-gray-600 tw-line-clamp-2 tw-mb-3">
            {description}
          </p>
        )}

        {/* Metadata */}
        <div className="tw-grid tw-grid-cols-2 tw-gap-3 tw-mb-4">
          {/* Vehicle */}
          {vehicle && (
            <div className="tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-car tw-text-gray-400 tw-text-sm"></i>
              <span className="tw-text-sm tw-text-gray-700 tw-truncate">
                {vehicle.name || vehicle}
              </span>
            </div>
          )}

          {/* Category */}
          {category && (
            <div className="tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-tag tw-text-gray-400 tw-text-sm"></i>
              <span className="tw-text-sm tw-text-gray-700 tw-truncate">
                {category}
              </span>
            </div>
          )}

          {/* Assigned To */}
          {assignedTo && (
            <div className="tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-user tw-text-gray-400 tw-text-sm"></i>
              <span className="tw-text-sm tw-text-gray-700 tw-truncate">
                {assignedTo}
              </span>
            </div>
          )}

          {/* Status */}
          <div className="tw-flex tw-items-center tw-gap-2">
            <IssueStatusIndicator status={status} size="sm" />
          </div>
        </div>

        {/* Timestamps */}
        <div className="tw-border-t tw-border-gray-100 tw-pt-3 tw-mt-3">
          <div className="tw-flex tw-justify-between tw-items-center tw-text-xs tw-text-gray-500">
            <span>
              <i className="fa-light fa-clock tw-mr-1"></i>
              Created: {formatDate(createdDate)}
            </span>
            {updatedDate && updatedDate !== createdDate && (
              <span>
                <i className="fa-light fa-edit tw-mr-1"></i>
                Updated: {formatDate(updatedDate)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="tw-flex tw-justify-end tw-items-center tw-gap-2 tw-mt-4 tw-pt-3 tw-border-t tw-border-gray-100">
            {hasGPSData && (
              <Button
                icon="fa-light fa-map-marker-alt"
                hint="View Location"
                stylingMode="text"
                onClick={() => onView && onView(issue)}
                className="tw-text-blue-600 hover:tw-text-blue-800"
              />
            )}

            <Button
              icon="fa-light fa-eye"
              hint="View Details"
              stylingMode="text"
              onClick={() => onView && onView(issue)}
              className="tw-text-gray-600 hover:tw-text-gray-800"
            />

            <Button
              icon="fa-light fa-edit"
              hint="Edit Issue"
              stylingMode="text"
              onClick={() => onEdit && onEdit(issue)}
              className="tw-text-blue-600 hover:tw-text-blue-800"
            />

            {onAssign && !assignedTo && (
              <Button
                icon="fa-light fa-user-plus"
                hint="Assign Issue"
                stylingMode="text"
                onClick={() => onAssign(issue)}
                className="tw-text-green-600 hover:tw-text-green-800"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueCard;
