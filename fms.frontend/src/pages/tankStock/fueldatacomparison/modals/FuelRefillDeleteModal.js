/**
 * FuelRefillDeleteModal - Modal for confirming deletion of fuel refill records
 *
 * Features:
 * - Display fuel refill details before deletion
 * - Optional reason for deletion
 * - Confirm/cancel actions
 *
 * @param {Object} fuelRefill - Fuel refill record to delete
 * @param {boolean} isLoading - Loading state
 * @param {Function} onClose - Callback when modal closes
 * @param {Function} onConfirm - Callback when deletion is confirmed
 */

import React, { useState } from 'react';
import { TextArea, LoadPanel } from 'devextreme-react';
import notify from 'devextreme/ui/notify';
import SlidePanel from '../../../../components/ui/SlidePanel';
import './FuelRefillDeleteModal.scss';

const FuelRefillDeleteModal = ({ fuelRefill, isLoading = false, onClose, onConfirm }) => {
  const [deleteReason, setDeleteReason] = useState('');

  const handleConfirm = () => {
    if (deleteReason.trim().length === 0) {
      notify({
        message: 'Please provide a reason for deletion',
        type: 'warning',
        displayTime: 3000
      });
      return;
    }

    onConfirm?.(deleteReason);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <SlidePanel
      open={true}
      onClose={onClose}
      title="Delete Fuel Refill"
      width={520}
      panelClassName="fuel-refill-delete-panel"
    >
      <LoadPanel visible={isLoading} />

      <div className="fuel-refill-delete-panel__content">
        <div className="fuel-refill-delete-panel__warning-card">
          <div className="fuel-refill-delete-panel__warning-icon">
            <i className="fa-light fa-triangle-exclamation"></i>
          </div>
          <div>
            <p className="fuel-refill-delete-panel__warning-title">
              Delete this fuel refill?
            </p>
            <p className="fuel-refill-delete-panel__warning-text">
              This follows the transaction workflow and may recalculate tank stock, tank volume history, and linked
              dispensing records.
            </p>
          </div>
        </div>

        <div className="fuel-refill-delete-panel__details-card">
          <div className="fuel-refill-delete-panel__detail-row">
            <span className="fuel-refill-delete-panel__detail-label">Refill ID</span>
            <span className="fuel-refill-delete-panel__detail-value">{fuelRefill.id}</span>
          </div>
          <div className="fuel-refill-delete-panel__detail-row">
            <span className="fuel-refill-delete-panel__detail-label">Vehicle ID</span>
            <span className="fuel-refill-delete-panel__detail-value">{fuelRefill.vehicleId}</span>
          </div>
          <div className="fuel-refill-delete-panel__detail-row">
            <span className="fuel-refill-delete-panel__detail-label">Date</span>
            <span className="fuel-refill-delete-panel__detail-value">{formatDate(fuelRefill.date)}</span>
          </div>
          <div className="fuel-refill-delete-panel__detail-row">
            <span className="fuel-refill-delete-panel__detail-label">Amount</span>
            <span className="fuel-refill-delete-panel__detail-value">
              {fuelRefill.manualFuelrefillAmount?.toFixed(2) || 0} L
            </span>
          </div>
        </div>

        <div className="fuel-refill-delete-panel__field">
          <label className="fuel-refill-delete-panel__label">
            Reason for Deletion <span className="fuel-refill-delete-panel__required">*</span>
          </label>
          <TextArea
            value={deleteReason}
            onValueChanged={(e) => setDeleteReason(e.value)}
            placeholder="Please explain why this record is being deleted"
            height={120}
            maxLength={500}
            className="fuel-refill-delete-panel__editor"
          />
          <p className="fuel-refill-delete-panel__hint">
            {deleteReason.length}/500 characters
          </p>
        </div>

        <div className="fuel-refill-delete-panel__footer">
          <button
            type="button"
            className="fuel-refill-delete-panel__button fuel-refill-delete-panel__button--ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="fuel-refill-delete-panel__button fuel-refill-delete-panel__button--danger"
            onClick={handleConfirm}
            disabled={isLoading || deleteReason.trim().length === 0}
          >
            <i className="fa-light fa-trash"></i>
            Delete refill
          </button>
        </div>
      </div>
    </SlidePanel>
  );
};

export default FuelRefillDeleteModal;
