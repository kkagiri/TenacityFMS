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
import { Popup, Button, TextArea, LoadPanel } from 'devextreme-react';
import notify from 'devextreme/ui/notify';
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
    <Popup
      visible={true}
      onHiding={onClose}
      title="Delete Fuel Refill"
      maxWidth={500}
      showCloseButton={true}
      showTitle={true}
    >
      <LoadPanel visible={isLoading} />

      <div className="tw-p-4">
        {/* Warning message */}
        <div className="tw-mb-4 tw-p-3 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg">
          <div className="tw-flex tw-items-start tw-gap-2">
            <i className="fa-light fa-triangle-exclamation tw-text-red-600 tw-text-lg tw-flex-shrink-0"></i>
            <div>
              <p className="tw-text-sm tw-font-medium tw-text-red-800">
                Are you sure you want to delete this fuel refill record?
              </p>
              <p className="tw-text-xs tw-text-red-600 tw-mt-1">
                This action cannot be undone. You must provide a reason for the deletion.
              </p>
            </div>
          </div>
        </div>

        {/* Fuel refill details */}
        <div className="tw-mb-4 tw-p-3 tw-bg-gray-50 tw-rounded-lg tw-space-y-2">
          <div className="tw-flex tw-justify-between">
            <span className="tw-text-sm tw-text-gray-600">ID:</span>
            <span className="tw-text-sm tw-font-medium tw-text-gray-900">{fuelRefill.id}</span>
          </div>
          <div className="tw-flex tw-justify-between">
            <span className="tw-text-sm tw-text-gray-600">Vehicle ID:</span>
            <span className="tw-text-sm tw-font-medium tw-text-gray-900">{fuelRefill.vehicleId}</span>
          </div>
          <div className="tw-flex tw-justify-between">
            <span className="tw-text-sm tw-text-gray-600">Date:</span>
            <span className="tw-text-sm tw-font-medium tw-text-gray-900">
              {formatDate(fuelRefill.date)}
            </span>
          </div>
          <div className="tw-flex tw-justify-between">
            <span className="tw-text-sm tw-text-gray-600">Amount:</span>
            <span className="tw-text-sm tw-font-medium tw-text-gray-900">
              {fuelRefill.manualFuelrefillAmount?.toFixed(2) || 0} L
            </span>
          </div>
        </div>

        {/* Delete reason */}
        <div className="tw-mb-4">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            Reason for Deletion <span className="tw-text-red-500">*</span>
          </label>
          <TextArea
            value={deleteReason}
            onValueChanged={(e) => setDeleteReason(e.value)}
            placeholder="Please explain why this record is being deleted"
            height={100}
            maxLength={500}
          />
          <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
            {deleteReason.length}/500 characters
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="tw-flex tw-justify-end tw-gap-3 tw-p-4 tw-border-t tw-border-gray-200">
        <Button
          text="Cancel"
          onClick={onClose}
          type="default"
          stylingMode="outlined"
          disabled={isLoading}
        />
        <Button
          text="Delete"
          onClick={handleConfirm}
          type="danger"
          stylingMode="contained"
          disabled={isLoading || deleteReason.trim().length === 0}
        />
      </div>
    </Popup>
  );
};

export default FuelRefillDeleteModal;
