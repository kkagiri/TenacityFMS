/**
 * File: EditTransactionDialog.js
 * Purpose: Direct volume edit side-panel for admin users - allows editing volume change
 *          and triggers volume history recalculation
 * Dependencies: SlidePanel, DevExtreme NumberBox, TextArea, Button
 * Last Modified: 2026-03-04
 *
 * Key Features:
 * - Direct edit of VolumeChange value (admin only)
 * - Triggers volume history recalculation after update
 * - Shows transaction details for context
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ScrollView from 'devextreme-react/scroll-view';
import { NumberBox } from 'devextreme-react/number-box';
import { TextArea } from 'devextreme-react/text-area';
import { CheckBox } from 'devextreme-react/check-box';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import Button from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';

import SlidePanel from '../../../../../components/ui/SlidePanel';
import { VolumeChangeReasonEnum } from './transactionHubConstants';
import transactionEditService from '../../../../../services/transactionEditService';

/**
 * Non-editable transaction types
 */
const NON_EDITABLE_TYPES = [7, 8, 9]; // AutomatedDispensing, Reconciliation, AutomatedReconciliation

/**
 * Get transaction type name
 */
const getTypeName = (changeReason) => {
  const found = VolumeChangeReasonEnum.find(r => r.id === changeReason);
  return found?.name || 'Unknown';
};

/**
 * Main EditTransactionDialog component
 */
export const EditTransactionDialog = ({
  visible,
  onHiding,
  transaction,
  tanks,
  onSuccess,
  onCancel
}) => {
  // State
  const [isUpdating, setIsUpdating] = useState(false);
  const [volumeChange, setVolumeChange] = useState(0);
  const [updateReason, setUpdateReason] = useState('');
  const [recalculateHistory, setRecalculateHistory] = useState(true);

  // Ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Determine if editable
  const isEditable = transaction && !NON_EDITABLE_TYPES.includes(transaction.changeReason);

  // Get tank name
  const tankName = tanks?.find(t => t.id === transaction?.tankId)?.name || 'Unknown';
  const typeName = getTypeName(transaction?.changeReason);

  // Initialize form when dialog opens
  useEffect(() => {
    if (visible && transaction) {
      setVolumeChange(transaction.volumeChange || 0);
      setUpdateReason('');
      setRecalculateHistory(true);
      setIsUpdating(false);
    }
  }, [visible, transaction]);

  // Safe close function - delays to avoid React/DevExtreme conflicts
  const safeClose = useCallback((successCallback) => {
    setTimeout(() => {
      if (isMountedRef.current) {
        if (successCallback) {
          successCallback();
        }
        if (onHiding) {
          onHiding();
        }
      }
    }, 50);
  }, [onHiding]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (isUpdating) return;

    setVolumeChange(0);
    setUpdateReason('');
    if (onCancel) {
      onCancel();
    }
    if (onHiding) {
      onHiding();
    }
  }, [onCancel, onHiding, isUpdating]);

  // Handle update
  const handleUpdate = useCallback(async () => {
    if (!transaction || isUpdating) return;

    // Validate
    if (!updateReason.trim()) {
      notify({
        message: 'Please provide a reason for this update',
        type: 'warning',
        displayTime: 3000,
        position: { my: 'top center', at: 'top center', of: window }
      });
      return;
    }

    setIsUpdating(true);

    try {
      // Call update API
      const result = await transactionEditService.updateTransaction({
        transactionId: transaction.id,
        volumeChange: volumeChange,
        recalculateHistory: recalculateHistory,
        updateReason: updateReason.trim()
      });

      if (!isMountedRef.current) return;

      if (result.success) {
        notify({
          message: 'Transaction updated successfully!',
          type: 'success',
          displayTime: 3000,
          position: { my: 'top center', at: 'top center', of: window }
        });

        // Reset updating state first
        setIsUpdating(false);

        // Then close with callback
        safeClose(() => {
          if (onSuccess) {
            onSuccess(result.data);
          }
        });
      } else {
        setIsUpdating(false);
        notify({
          message: result.error || 'Failed to update transaction',
          type: 'error',
          displayTime: 4000,
          position: { my: 'top center', at: 'top center', of: window }
        });
      }
    } catch (err) {
      console.error('Error updating transaction:', err);
      if (isMountedRef.current) {
        setIsUpdating(false);
        notify({
          message: err.message || 'Failed to update transaction',
          type: 'error',
          displayTime: 4000,
          position: { my: 'top center', at: 'top center', of: window }
        });
      }
    }
  }, [transaction, volumeChange, updateReason, recalculateHistory, onSuccess, safeClose, isUpdating]);

  // Calculate volume difference
  const volumeDiff = volumeChange - (transaction?.volumeChange || 0);

  return (
    <SlidePanel
      open={visible}
      onClose={handleCancel}
      title="Edit Transaction (Admin)"
      width={520}
    >
      <ScrollView height="100%" width="100%" showScrollbar="onScroll">
        <div className="tw-p-4 tw-relative edit-transaction-panel">
          {/* Not Editable */}
          {!isEditable && (
            <>
              <div className="tw-rounded-lg tw-p-4 tw-mb-4 edit-dialog-warning" style={{ background: 'var(--delete-warning-bg, #fffbeb)', border: '1px solid var(--delete-warning-border, #fde68a)' }}>
                <div className="tw-flex tw-items-start">
                  <i className="fa-light fa-exclamation-triangle tw-text-xl tw-mr-3" style={{ color: 'var(--delete-warning-icon, #d97706)' }}></i>
                  <div>
                    <h4 className="tw-font-semibold tw-mb-1" style={{ color: 'var(--delete-warning-title, #92400e)' }}>Cannot Edit</h4>
                    <p className="tw-text-sm" style={{ color: 'var(--delete-warning-text, #b45309)' }}>
                      Transactions of type "{typeName}" cannot be edited.
                    </p>
                  </div>
                </div>
              </div>
              <div className="tw-flex tw-justify-end tw-pt-2">
                <Button text="Close" onClick={handleCancel} stylingMode="outlined" />
              </div>
            </>
          )}

          {/* Edit Form */}
          {isEditable && (
            <>
              {/* Transaction Info */}
              <div className="tw-rounded-lg tw-p-3 tw-mb-4 edit-dialog-info" style={{ background: 'var(--fms-surface-secondary, #f9fafb)', border: '1px solid var(--fms-border, #e5e7eb)' }}>
                <h5 className="tw-font-medium tw-mb-2 tw-text-sm" style={{ color: 'var(--fms-text-secondary, #374151)' }}>
                  <i className="fa-light fa-info-circle tw-mr-1"></i>
                  Transaction Details
                </h5>
                <div className="tw-grid tw-grid-cols-2 tw-gap-2 tw-text-sm">
                  <div>
                    <span style={{ color: 'var(--fms-text-tertiary, #6b7280)' }}>ID:</span>
                    <span className="tw-ml-1 tw-font-medium" style={{ color: 'var(--fms-text-primary, #374151)' }}>{transaction?.id}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--fms-text-tertiary, #6b7280)' }}>Type:</span>
                    <span className="tw-ml-1 tw-font-medium" style={{ color: 'var(--fms-text-primary, #374151)' }}>{typeName}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--fms-text-tertiary, #6b7280)' }}>Tank:</span>
                    <span className="tw-ml-1 tw-font-medium" style={{ color: 'var(--fms-text-primary, #374151)' }}>{tankName}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--fms-text-tertiary, #6b7280)' }}>Date:</span>
                    <span className="tw-ml-1 tw-font-medium" style={{ color: 'var(--fms-text-primary, #374151)' }}>
                      {transaction?.timestamp ? new Date(transaction.timestamp).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="tw-col-span-2">
                    <span style={{ color: 'var(--fms-text-tertiary, #6b7280)' }}>Current Volume:</span>
                    <span className="tw-ml-1 tw-font-medium" style={{ color: 'var(--fms-text-primary, #374151)' }}>
                      {(transaction?.newVolume || 0).toLocaleString()} L
                    </span>
                  </div>
                </div>
              </div>

              {/* Volume Change Input */}
              <div className="tw-mb-4">
                <label className="tw-block tw-text-sm tw-font-medium tw-mb-1" style={{ color: 'var(--fms-text-primary, #374151)' }}>
                  Volume Change (Liters) <span className="tw-text-red-500">*</span>
                </label>
                <NumberBox
                  value={volumeChange}
                  onValueChanged={(e) => setVolumeChange(e.value)}
                  format="#,##0.00"
                  showSpinButtons={true}
                  disabled={isUpdating}
                  width="100%"
                />
                <div className="tw-flex tw-justify-between tw-mt-1 tw-text-xs">
                  <span style={{ color: 'var(--fms-text-tertiary, #6b7280)' }}>
                    Original: {(transaction?.volumeChange || 0).toLocaleString()} L
                  </span>
                  {volumeDiff !== 0 && (
                    <span className={volumeDiff > 0 ? 'tw-text-green-600' : 'tw-text-red-600'}>
                      Difference: {volumeDiff > 0 ? '+' : ''}{volumeDiff.toLocaleString()} L
                    </span>
                  )}
                </div>
              </div>

              {/* Recalculate Checkbox */}
              <div className="tw-mb-4 tw-rounded-lg tw-p-3 edit-dialog-recalc" style={{ background: 'var(--edit-recalc-bg, #eff6ff)', border: '1px solid var(--edit-recalc-border, #bfdbfe)' }}>
                <CheckBox
                  value={recalculateHistory}
                  onValueChanged={(e) => setRecalculateHistory(e.value)}
                  disabled={isUpdating}
                  text="Recalculate volume history after update"
                />
                <p className="tw-text-xs tw-mt-2 tw-ml-6" style={{ color: 'var(--edit-recalc-text, #1d4ed8)' }}>
                  <i className="fa-light fa-info-circle tw-mr-1"></i>
                  When enabled, all subsequent volume records will be recalculated.
                </p>
              </div>

              {/* Update Reason */}
              <div className="tw-mb-4">
                <label className="tw-block tw-text-sm tw-font-medium tw-mb-1" style={{ color: 'var(--fms-text-primary, #374151)' }}>
                  Reason for Update <span className="tw-text-red-500">*</span>
                </label>
                <TextArea
                  value={updateReason}
                  onValueChanged={(e) => setUpdateReason(e.value)}
                  placeholder="Enter the reason for this update (required)"
                  height={80}
                  disabled={isUpdating}
                />
              </div>

              {/* Warning */}
              <div className="tw-rounded-lg tw-p-3 tw-mb-4 edit-dialog-admin-warning" style={{ background: 'var(--edit-admin-warning-bg, #fff7ed)', border: '1px solid var(--edit-admin-warning-border, #fed7aa)' }}>
                <div className="tw-flex tw-items-start">
                  <i className="fa-light fa-exclamation-triangle tw-mr-2 tw-mt-0.5" style={{ color: 'var(--edit-admin-warning-icon, #f97316)' }}></i>
                  <p className="tw-text-xs" style={{ color: 'var(--edit-admin-warning-text, #c2410c)' }}>
                    <strong>Warning:</strong> This is an admin override. Editing this transaction will affect
                    the volume history and may impact reporting accuracy. Ensure this change is necessary.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="tw-flex tw-justify-end tw-gap-2 tw-pt-3 edit-dialog-actions" style={{ borderTop: '1px solid var(--fms-border, #e5e7eb)' }}>
                <Button
                  text="Cancel"
                  onClick={handleCancel}
                  stylingMode="outlined"
                  disabled={isUpdating}
                />
                <Button
                  text={isUpdating ? "Updating..." : "Update Transaction"}
                  onClick={handleUpdate}
                  type="default"
                  disabled={isUpdating || !updateReason.trim()}
                />
              </div>

              {/* Loading Overlay */}
              {isUpdating && (
                <div className="tw-absolute tw-inset-0 tw-bg-opacity-75 tw-flex tw-items-center tw-justify-center tw-rounded-lg" style={{ background: 'var(--fms-surface, rgba(255,255,255,0.75))' }}>
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <LoadIndicator visible={true} height={24} width={24} />
                    <span style={{ color: 'var(--fms-text-secondary, #4b5563)' }}>Updating...</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollView>
    </SlidePanel>
  );
};

export default EditTransactionDialog;
