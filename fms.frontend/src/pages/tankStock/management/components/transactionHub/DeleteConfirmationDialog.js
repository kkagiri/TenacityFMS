/**
 * File: DeleteConfirmationDialog.js
 * Purpose: Delete confirmation side-panel component for TransactionHub
 * Dependencies: SlidePanel, devextreme-react/button, devextreme-react/scroll-view
 * Last Modified: 2026-03-04
 */
import React from 'react';
import Button from 'devextreme-react/button';
import { ScrollView } from 'devextreme-react/scroll-view';
import SlidePanel from '../../../../../components/ui/SlidePanel';
import { VolumeChangeReasonEnum } from './transactionHubConstants';

/**
 * Loading state component shown while validating deletion
 */
const LoadingState = () => (
  <div className="tw-flex tw-items-center tw-justify-center tw-py-8">
    <div className="tw-text-center">
      <i className="fa-light fa-spinner tw-animate-spin tw-text-2xl tw-mb-3" style={{ color: 'var(--fms-text-secondary, #2563eb)' }}></i>
      <p style={{ color: 'var(--fms-text-secondary, #4b5563)' }}>Validating deletion...</p>
    </div>
  </div>
);

/**
 * Transaction summary section
 */
const TransactionSummary = ({ transaction, tanks }) => {
  if (!transaction) return null;

  const transactionDate = new Date(transaction.timestamp).toLocaleString();
  const transactionType = VolumeChangeReasonEnum.find(r => r.id === transaction.changeReason)?.name || 'Unknown';
  const tankName = tanks?.find(t => t.id === transaction.tankId)?.name || 'Unknown';
  const volumeChange = transaction.volumeChange || 0;

  return (
    <div className="tw-mb-4">
      <h4 className="tw-text-base tw-font-semibold tw-mb-2" style={{ color: 'var(--fms-text-primary, #1f2937)' }}>
        Transaction Summary
      </h4>
      <div className="tw-p-3 tw-rounded-lg tw-text-sm tw-space-y-1 delete-dialog-summary" style={{ background: 'var(--fms-surface-secondary, #f9fafb)', border: '1px solid var(--fms-border, #e5e7eb)' }}>
        <div className="tw-flex tw-justify-between">
          <span className="tw-font-medium" style={{ color: 'var(--fms-text-primary, #374151)' }}>Date:</span>
          <span style={{ color: 'var(--fms-text-primary, #374151)' }}>{transactionDate}</span>
        </div>
        <div className="tw-flex tw-justify-between">
          <span className="tw-font-medium" style={{ color: 'var(--fms-text-primary, #374151)' }}>Type:</span>
          <span style={{ color: 'var(--fms-text-primary, #374151)' }}>{transactionType}</span>
        </div>
        <div className="tw-flex tw-justify-between">
          <span className="tw-font-medium" style={{ color: 'var(--fms-text-primary, #374151)' }}>Volume Change:</span>
          <span className={`tw-font-medium ${volumeChange >= 0 ? 'tw-text-green-600' : 'tw-text-red-600'}`}>
            {volumeChange.toLocaleString()} L
          </span>
        </div>
        <div className="tw-flex tw-justify-between">
          <span className="tw-font-medium" style={{ color: 'var(--fms-text-primary, #374151)' }}>Tank:</span>
          <span style={{ color: 'var(--fms-text-primary, #374151)' }}>{tankName}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Delete blocked message component
 */
const DeleteBlocked = ({ validationResult }) => (
  <div className="tw-rounded-lg tw-p-4 delete-dialog-blocked" style={{ background: 'var(--delete-blocked-bg, #fef2f2)', border: '1px solid var(--delete-blocked-border, #fecaca)' }}>
    <div className="tw-flex tw-items-start">
      <i className="fa-light fa-exclamation-triangle tw-mr-3 tw-mt-1" style={{ color: 'var(--delete-blocked-icon, #dc2626)' }}></i>
      <div className="tw-flex-1">
        <h5 className="tw-font-semibold tw-mb-2" style={{ color: 'var(--delete-blocked-title, #991b1b)' }}>Delete Blocked</h5>
        <p style={{ color: 'var(--delete-blocked-text, #b91c1c)' }}>{validationResult.message || 'Cannot delete this transaction'}</p>
        {validationResult.detailedWarning && (
          <p className="tw-text-sm tw-mt-2" style={{ color: 'var(--delete-blocked-text, #dc2626)' }}>
            {validationResult.detailedWarning}
          </p>
        )}
      </div>
    </div>
  </div>
);

/**
 * Warning with confirmation component
 */
const DeleteWarning = ({ validationResult, showDetails, userConfirmed, onToggleDetails, onConfirmChange }) => (
  <div className="tw-rounded-lg tw-p-4 delete-dialog-warning" style={{ background: 'var(--delete-warning-bg, #fffbeb)', border: '1px solid var(--delete-warning-border, #fde68a)' }}>
    <div className="tw-flex tw-items-start">
      <i className="fa-light fa-exclamation-triangle tw-mr-3 tw-mt-1" style={{ color: 'var(--delete-warning-icon, #d97706)' }}></i>
      <div className="tw-flex-1">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
          <h5 className="tw-font-semibold" style={{ color: 'var(--delete-warning-title, #92400e)' }}>Warning: Future Records Detected</h5>
          <Button
            text={showDetails ? "Hide Details" : "View Details"}
            icon={showDetails ? "fa-light fa-chevron-up" : "fa-light fa-chevron-down"}
            stylingMode="text"
            onClick={onToggleDetails}
            elementAttr={{
              style: { height: '24px', fontSize: '11px' }
            }}
          />
        </div>
        <p className="tw-mb-3" style={{ color: 'var(--delete-warning-text, #b45309)' }}>{validationResult.message || 'This action will affect future records'}</p>

        {showDetails && validationResult.futureRecordsCount > 0 && (
          <div className="tw-p-3 tw-rounded tw-mb-3" style={{ background: 'var(--fms-surface, #ffffff)', border: '1px solid var(--fms-border, #e5e7eb)' }}>
            <div className="tw-text-sm tw-space-y-1" style={{ color: 'var(--fms-text-primary, #374151)' }}>
              <div className="tw-flex tw-justify-between">
                <span>Future Records:</span>
                <span className="tw-font-medium">{validationResult.futureRecordsCount}</span>
              </div>
              {validationResult.earliestFutureRecord && (
                <div className="tw-flex tw-justify-between">
                  <span>Earliest:</span>
                  <span className="tw-font-medium">
                    {new Date(validationResult.earliestFutureRecord).toLocaleString()}
                  </span>
                </div>
              )}
              {validationResult.latestFutureRecord && (
                <div className="tw-flex tw-justify-between">
                  <span>Latest:</span>
                  <span className="tw-font-medium">
                    {new Date(validationResult.latestFutureRecord).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {showDetails && validationResult.detailedWarning && (
          <p className="tw-text-sm tw-mb-3" style={{ color: 'var(--delete-warning-text, #d97706)' }}>
            {validationResult.detailedWarning}
          </p>
        )}

        <div className="tw-mt-4">
          <label className="tw-flex tw-items-center tw-space-x-2">
            <input
              type="checkbox"
              checked={userConfirmed}
              onChange={(e) => onConfirmChange(e.target.checked)}
              className="tw-w-4 tw-h-4"
            />
            <span className="tw-text-sm" style={{ color: 'var(--fms-text-secondary, #374151)' }}>
              I understand the impact and want to proceed with the deletion
            </span>
          </label>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Safe to delete message component
 */
const SafeToDelete = ({ validationResult }) => (
  <div className="tw-rounded-lg tw-p-4 delete-dialog-safe" style={{ background: 'var(--delete-safe-bg, #f0fdf4)', border: '1px solid var(--delete-safe-border, #bbf7d0)' }}>
    <div className="tw-flex tw-items-start">
      <i className="fa-light fa-check-circle tw-mr-3 tw-mt-1" style={{ color: 'var(--delete-safe-icon, #16a34a)' }}></i>
      <div className="tw-flex-1">
        <h5 className="tw-font-semibold tw-mb-2" style={{ color: 'var(--delete-safe-title, #166534)' }}>Safe to Delete</h5>
        <p style={{ color: 'var(--delete-safe-text, #15803d)' }}>{validationResult.message || 'No future records found. Entry can proceed without issues.'}</p>
      </div>
    </div>
  </div>
);

/**
 * Delete confirmation dialog content
 */
const DeleteConfirmationContent = ({
  deleteConfirmation,
  tanks,
  onToggleDetails,
  onConfirmChange,
  onCancel,
  onDelete
}) => {
  const { validationResult, transaction, userConfirmed, isDeleting, showDetails } = deleteConfirmation;

  // Loading state
  if (!validationResult) {
    return <LoadingState />;
  }

  return (
    <ScrollView height="100%" width="100%" showScrollbar="onScroll">
      <div className="tw-px-1">
        {/* Transaction Summary */}
        <TransactionSummary transaction={transaction} tanks={tanks} />

        {/* Validation Results */}
        <div className="tw-mb-6">
          {!validationResult.isAllowed ? (
            <DeleteBlocked validationResult={validationResult} />
          ) : validationResult.requiresUserConfirmation ? (
            <DeleteWarning
              validationResult={validationResult}
              showDetails={showDetails}
              userConfirmed={userConfirmed}
              onToggleDetails={onToggleDetails}
              onConfirmChange={onConfirmChange}
            />
          ) : (
            <SafeToDelete validationResult={validationResult} />
          )}
        </div>

        {/* Action Buttons */}
        <div className="tw-flex tw-justify-end tw-space-x-3 tw-pt-2 delete-dialog-actions" style={{ borderTop: '1px solid var(--fms-border, #e5e7eb)', paddingTop: '12px' }}>
          <Button
            text="Cancel"
            onClick={onCancel}
            stylingMode="outlined"
            disabled={isDeleting}
          />
          {validationResult.isAllowed && (
            <Button
              text={isDeleting ? "Deleting..." : "Delete Transaction"}
              onClick={onDelete}
              type="default"
              disabled={
                isDeleting ||
                (validationResult.requiresUserConfirmation && !userConfirmed)
              }
              className="tw-bg-red-600 hover:tw-bg-red-700"
            />
          )}
        </div>
      </div>
    </ScrollView>
  );
};

/**
 * Main DeleteConfirmationDialog component — uses SlidePanel
 */
export const DeleteConfirmationDialog = ({
  visible,
  onHiding,
  transaction,
  validationResult,
  isDeleting,
  showDetails,
  userConfirmed,
  onToggleDetails,
  onConfirmChange,
  onCancel,
  onExecuteDelete,
  tanks
}) => {
  // Build deleteConfirmation object for internal components
  const deleteConfirmation = {
    visible,
    transaction,
    validationResult,
    isDeleting,
    showDetails,
    userConfirmed
  };

  return (
    <SlidePanel
      open={visible}
      onClose={onCancel}
      title="Delete Transaction"
      width={520}
    >
      <div className="tw-h-full tw-flex tw-flex-col tw-p-4">
        <DeleteConfirmationContent
          deleteConfirmation={deleteConfirmation}
          tanks={tanks}
          onToggleDetails={onToggleDetails}
          onConfirmChange={onConfirmChange}
          onCancel={onCancel}
          onDelete={onExecuteDelete}
        />
      </div>
    </SlidePanel>
  );
};

export default DeleteConfirmationDialog;
