import React, { useState } from 'react';
import { Popup } from 'devextreme-react/popup';
import { Button } from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import { deleteGpsEntry } from '../../../../api/fuelComparisonClient';
import './DeleteConfirmationModal.scss';

/**
 * DeleteConfirmationModal - Modal for deleting (soft delete) GPS entry
 *
 * Features:
 * - Shows GPS entry details
 * - Textarea for deletion reason (required, min 10 chars)
 * - Warning message about exclusion from comparisons
 * - Validation before deleting
 *
 * @param {boolean} visible - Modal visibility
 * @param {object} gpsEntry - FuelDataComparisonDto with GPS entry data
 * @param {Function} onClose - Close callback
 * @param {Function} onDelete - Delete success callback
 * @returns {JSX.Element} Delete Confirmation Modal
 */
const DeleteConfirmationModal = ({ visible, gpsEntry, onClose, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');

  /**
   * Validate form data
   */
  const validateForm = () => {
    const errors = [];

    if (!deletionReason || deletionReason.trim().length < 10) {
      errors.push('Deletion reason must be at least 10 characters');
    }

    return errors;
  };

  /**
   * Handle delete
   */
  const handleDelete = async () => {
    // Validate
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => notify(error, 'error', 3000));
      return;
    }

    try {
      setIsDeleting(true);

      const deleteData = {
        id: gpsEntry.gpsEntryId,
        deletionReason: deletionReason.trim()
      };

      const response = await deleteGpsEntry(gpsEntry.gpsEntryId, deleteData);

      if (response.isSuccess) {
        notify('GPS entry deleted successfully', 'success', 3000);
        onDelete();
      } else {
        notify(response.message || 'Failed to delete GPS entry', 'error', 3000);
      }
    } catch (error) {
      console.error('Error deleting GPS entry:', error);
      notify('Failed to delete GPS entry', 'error', 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      title="Delete GPS Entry"
      width={600}
      height="auto"
      showCloseButton={true}
      dragEnabled={false}
    >
      <div className="delete-confirmation-modal">
        {/* Warning Banner */}
        <div className="tw-bg-red-50 tw-border-l-4 tw-border-red-500 tw-p-4 tw-mb-4">
          <div className="tw-flex tw-items-start tw-gap-3">
            <i className="fa-light fa-triangle-exclamation tw-text-2xl tw-text-red-600"></i>
            <div>
              <h3 className="tw-text-sm tw-font-bold tw-text-red-800 tw-mb-1">
                Warning: This action will soft-delete the GPS entry
              </h3>
              <p className="tw-text-xs tw-text-red-700">
                The GPS entry will be excluded from all future comparisons unless "Show Deleted" is enabled.
                This action can be reversed by system administrators if needed.
              </p>
            </div>
          </div>
        </div>

        {/* GPS Entry Details */}
        <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-mb-4">
          <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3">GPS Entry Details</h4>
          <div className="tw-grid tw-grid-cols-2 tw-gap-3">
            <div>
              <span className="tw-text-xs tw-font-medium tw-text-gray-600">Vehicle:</span>
              <div className="tw-text-sm tw-font-semibold tw-text-gray-800">
                {gpsEntry.vehicleName} (ID: {gpsEntry.vehicleId})
              </div>
            </div>
            <div>
              <span className="tw-text-xs tw-font-medium tw-text-gray-600">Date:</span>
              <div className="tw-text-sm tw-font-semibold tw-text-gray-800">
                {new Date(gpsEntry.dispenseDate).toLocaleDateString()}
              </div>
            </div>
            <div>
              <span className="tw-text-xs tw-font-medium tw-text-gray-600">GPS Volume:</span>
              <div className="tw-text-sm tw-font-bold tw-text-blue-600">
                {gpsEntry.effectiveGpsVolume?.toFixed(2) || gpsEntry.gpsVolume?.toFixed(2) || '-'} L
              </div>
            </div>
            <div>
              <span className="tw-text-xs tw-font-medium tw-text-gray-600">Variance:</span>
              <div className="tw-text-sm tw-font-bold tw-text-red-600">
                {gpsEntry.totalVariance?.toFixed(2) || '-'} L ({gpsEntry.variancePercent?.toFixed(1) || '-'}%)
              </div>
            </div>
          </div>

          {gpsEntry.siteName && (
            <div className="tw-mt-3 tw-pt-3 tw-border-t tw-border-gray-200">
              <span className="tw-text-xs tw-font-medium tw-text-gray-600">Site:</span>
              <div className="tw-text-sm tw-text-gray-800">
                {gpsEntry.siteName} {gpsEntry.tankName && `- ${gpsEntry.tankName}`}
              </div>
            </div>
          )}
        </div>

        {/* Deletion Reason */}
        <div className="tw-mb-4">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            Deletion Reason <span className="tw-text-red-500">*</span>
          </label>
          <textarea
            className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-red-500"
            value={deletionReason}
            onChange={(e) => setDeletionReason(e.target.value)}
            rows={4}
            placeholder="Explain why this GPS entry is being deleted (minimum 10 characters)"
          />
          <div className="tw-text-xs tw-text-gray-500 tw-mt-1">
            {deletionReason.length} / 10 characters minimum
          </div>
        </div>

        {/* Info Box */}
        <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3 tw-mb-4">
          <div className="tw-flex tw-items-start tw-gap-2">
            <i className="fa-light fa-info-circle tw-text-blue-600 tw-mt-0.5"></i>
            <div className="tw-text-xs tw-text-blue-800">
              <strong>What happens after deletion?</strong>
              <ul className="tw-mt-1 tw-ml-4 tw-list-disc tw-space-y-1">
                <li>GPS entry will be marked as deleted (soft delete)</li>
                <li>Excluded from variance calculations by default</li>
                <li>Can be viewed by enabling "Show Deleted" in settings</li>
                <li>Audit trail preserved (deletion reason and timestamp)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6">
          <Button
            text="Cancel"
            onClick={onClose}
            type="normal"
            stylingMode="outlined"
            disabled={isDeleting}
          />
          <Button
            text={isDeleting ? "Deleting..." : "Delete GPS Entry"}
            onClick={handleDelete}
            type="danger"
            stylingMode="contained"
            disabled={isDeleting}
            icon={isDeleting ? "fa-light fa-spinner fa-spin" : "fa-light fa-trash"}
          />
        </div>
      </div>
    </Popup>
  );
};

export default DeleteConfirmationModal;
