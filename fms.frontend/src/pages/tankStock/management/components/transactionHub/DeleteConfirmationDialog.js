/**
 * File: DeleteConfirmationDialog.js
 * Purpose: Delete confirmation dialog component for TransactionHub
 * Last Modified: 2025-11-26
 */
import React from 'react';
import Popup from 'devextreme-react/popup';
import Button from 'devextreme-react/button';
import { ScrollView } from 'devextreme-react/scroll-view';
import { VolumeChangeReasonEnum } from './transactionHubConstants';

/**
 * Loading state component shown while validating deletion
 */
const LoadingState = () => (
  <div className="tw-flex tw-items-center tw-justify-center tw-py-8">
    <div className="tw-text-center">
      <i className="fa-light fa-spinner tw-animate-spin tw-text-2xl tw-text-blue-600 tw-mb-3"></i>
      <p className="tw-text-gray-600">Validating deletion...</p>
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
      <h4 className="tw-text-base tw-font-semibold tw-text-gray-800 tw-mb-2">
        Transaction Summary
      </h4>
      <div className="tw-bg-gray-50 tw-p-3 tw-rounded-lg tw-text-sm tw-space-y-1">
        <div className="tw-flex tw-justify-between">
          <span className="tw-font-medium">Date:</span>
          <span>{transactionDate}</span>
        </div>
        <div className="tw-flex tw-justify-between">
          <span className="tw-font-medium">Type:</span>
          <span>{transactionType}</span>
        </div>
        <div className="tw-flex tw-justify-between">
          <span className="tw-font-medium">Volume Change:</span>
          <span className={`tw-font-medium ${volumeChange >= 0 ? 'tw-text-green-600' : 'tw-text-red-600'}`}>
            {volumeChange.toLocaleString()} L
          </span>
        </div>
        <div className="tw-flex tw-justify-between">
          <span className="tw-font-medium">Tank:</span>
          <span>{tankName}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Delete blocked message component
 */
const DeleteBlocked = ({ validationResult }) => (
  <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4">
    <div className="tw-flex tw-items-start">
      <i className="fa-light fa-exclamation-triangle tw-text-red-600 tw-mr-3 tw-mt-1"></i>
      <div className="tw-flex-1">
        <h5 className="tw-font-semibold tw-text-red-800 tw-mb-2">Delete Blocked</h5>
        <p className="tw-text-red-700">{validationResult.message || 'Cannot delete this transaction'}</p>
        {validationResult.detailedWarning && (
          <p className="tw-text-red-600 tw-text-sm tw-mt-2">
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
  <div className="tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-rounded-lg tw-p-4">
    <div className="tw-flex tw-items-start">
      <i className="fa-light fa-exclamation-triangle tw-text-yellow-600 tw-mr-3 tw-mt-1"></i>
      <div className="tw-flex-1">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
          <h5 className="tw-font-semibold tw-text-yellow-800">Warning: Future Records Detected</h5>
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
        <p className="tw-text-yellow-700 tw-mb-3">{validationResult.message || 'This action will affect future records'}</p>

        {showDetails && validationResult.futureRecordsCount > 0 && (
          <div className="tw-bg-white tw-p-3 tw-rounded tw-border tw-mb-3">
            <div className="tw-text-sm tw-space-y-1">
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
          <p className="tw-text-yellow-600 tw-text-sm tw-mb-3">
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
            <span className="tw-text-sm tw-text-gray-700">
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
  <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded-lg tw-p-4">
    <div className="tw-flex tw-items-start">
      <i className="fa-light fa-check-circle tw-text-green-600 tw-mr-3 tw-mt-1"></i>
      <div className="tw-flex-1">
        <h5 className="tw-font-semibold tw-text-green-800 tw-mb-2">Safe to Delete</h5>
        <p className="tw-text-green-700">{validationResult.message || 'This transaction can be safely deleted'}</p>
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
        <div className="tw-flex tw-justify-end tw-space-x-3 tw-pt-2">
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
 * Main DeleteConfirmationDialog component
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
    <Popup
      visible={visible}
      onHiding={onHiding}
      showTitle={true}
      title="Delete Transaction"
      width={() => window.innerWidth <= 768 ? '98%' : 600}
      height={500}
      showCloseButton={true}
      dragEnabled={true}
      hideOnOutsideClick={false}
    >
      <div className="tw-h-full tw-flex tw-flex-col">
        <DeleteConfirmationContent
          deleteConfirmation={deleteConfirmation}
          tanks={tanks}
          onToggleDetails={onToggleDetails}
          onConfirmChange={onConfirmChange}
          onCancel={onCancel}
          onDelete={onExecuteDelete}
        />
      </div>
    </Popup>
  );
};

export default DeleteConfirmationDialog;
