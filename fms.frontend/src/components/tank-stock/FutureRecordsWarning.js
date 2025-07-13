import React from 'react';
import { Button } from 'devextreme-react';
import './FutureRecordsWarning.scss';

/**
 * Component to display future records warnings and handle user confirmation
 */
const FutureRecordsWarning = ({
  validationResult,
  onConfirm,
  onCancel,
  isVisible = true,
  className = ''
}) => {
  if (!isVisible || !validationResult || !validationResult.config.showWarning) {
    return null;
  }

  const { config, formattedMessage, detailedWarning, policy, futureRecordsCount } = validationResult;

  const getAlertClassName = () => {
    const baseClass = 'future-records-warning tw-rounded tw-p-4 tw-mb-4 tw-border tw-border-solid';
    switch (config.alertType) {
      case 'error':
        return `${baseClass} tw-bg-red-50 tw-border-red-200 tw-text-red-800`;
      case 'warning':
        return `${baseClass} tw-bg-yellow-50 tw-border-yellow-200 tw-text-yellow-800`;
      case 'info':
        return `${baseClass} tw-bg-blue-50 tw-border-blue-200 tw-text-blue-800`;
      case 'success':
        return `${baseClass} tw-bg-green-50 tw-border-green-200 tw-text-green-800`;
      default:
        return `${baseClass} tw-bg-gray-50 tw-border-gray-200 tw-text-gray-800`;
    }
  };

  return (
    <div className={`${getAlertClassName()} ${className}`}>
      {/* Header with icon and title */}
      <div className="tw-flex tw-items-start tw-space-x-3">
        <div className="tw-flex-shrink-0">
          <i className={`${config.icon} ${config.iconClass} tw-text-lg`} />
        </div>

        <div className="tw-flex-1">
          {/* Main warning title */}
          <h4 className="tw-font-semibold tw-text-sm tw-mb-2">
            {config.blockSubmission ? 'Entry Blocked' :
             config.requiresConfirmation ? 'Confirmation Required' :
             'Information'}
          </h4>

          {/* Main message */}
          <p className="tw-text-sm tw-mb-3">
            {formattedMessage}
          </p>

          {/* Detailed warning if available */}
          {detailedWarning && (
            <div className="tw-bg-white tw-bg-opacity-50 tw-rounded tw-p-3 tw-text-xs tw-mb-3">
              <div className="tw-font-medium tw-mb-1">Details:</div>
              <pre className="tw-whitespace-pre-wrap tw-font-mono tw-text-xs">
                {detailedWarning}
              </pre>
            </div>
          )}

          {/* Policy information */}
          <div className="tw-text-xs tw-opacity-75 tw-mb-3">
            Current policy: <span className="tw-font-medium">{policy}</span>
            {config.recommendedAction && (
              <span> • {config.recommendedAction}</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="tw-flex tw-space-x-2">
            {config.requiresConfirmation && onConfirm && (
              <Button
                text="Proceed Anyway"
                type="default"
                stylingMode="contained"
                onClick={onConfirm}
                disabled={config.blockSubmission}
                className="tw-text-xs"
              />
            )}

            {onCancel && (
              <Button
                text={config.blockSubmission ? "OK" : "Cancel"}
                type={config.blockSubmission ? "default" : "normal"}
                stylingMode="outlined"
                onClick={onCancel}
                className="tw-text-xs"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FutureRecordsWarning;
