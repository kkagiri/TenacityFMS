import React, { useState } from 'react';
import { Popup } from 'devextreme-react/popup';
import { Button } from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import { updateGpsEntry } from '../../../../api/fuelComparisonClient';
import './EditGpsEntryModal.scss';

/**
 * EditGpsEntryModal - Modal for editing GPS entry volume
 *
 * Features:
 * - Shows original GPS volume (read-only)
 * - Input for modified volume (required, > 0)
 * - Textarea for modification reason (required, min 10 chars)
 * - Shows last modification info if exists
 * - Validation before saving
 *
 * @param {boolean} visible - Modal visibility
 * @param {object} gpsEntry - FuelDataComparisonDto with GPS entry data
 * @param {Function} onClose - Close callback
 * @param {Function} onSave - Save success callback
 * @returns {JSX.Element} Edit GPS Entry Modal
 */
const EditGpsEntryModal = ({ visible, gpsEntry, onClose, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    modifiedVolume: gpsEntry.effectiveGpsVolume || gpsEntry.gpsVolume || 0,
    modificationReason: ''
  });

  /**
   * Handle form field change
   */
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const errors = [];

    if (!formData.modifiedVolume || formData.modifiedVolume <= 0) {
      errors.push('Modified volume must be greater than 0');
    }

    if (!formData.modificationReason || formData.modificationReason.trim().length < 10) {
      errors.push('Modification reason must be at least 10 characters');
    }

    return errors;
  };

  /**
   * Handle save
   */
  const handleSave = async () => {
    // Validate
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => notify(error, 'error', 3000));
      return;
    }

    try {
      setIsSaving(true);

      const updateData = {
        id: gpsEntry.gpsEntryId,
        modifiedVolume: parseFloat(formData.modifiedVolume),
        modificationReason: formData.modificationReason.trim()
      };

      const response = await updateGpsEntry(gpsEntry.gpsEntryId, updateData);

      if (response.isSuccess) {
        notify('GPS entry updated successfully', 'success', 3000);
        onSave();
      } else {
        notify(response.message || 'Failed to update GPS entry', 'error', 3000);
      }
    } catch (error) {
      console.error('Error updating GPS entry:', error);
      notify('Failed to update GPS entry', 'error', 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      title="Edit GPS Entry"
      width={600}
      height="auto"
      showCloseButton={true}
      dragEnabled={false}
    >
      <div className="edit-gps-entry-modal">
        {/* Vehicle Info */}
        <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4 tw-mb-4">
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
          </div>
        </div>

        {/* Original Volume Info */}
        <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-mb-4">
          <div className="tw-grid tw-grid-cols-3 tw-gap-3 tw-text-center">
            <div>
              <span className="tw-text-xs tw-font-medium tw-text-gray-600">Manual Vol</span>
              <div className="tw-text-sm tw-font-bold tw-text-gray-800">
                {gpsEntry.manualVolume?.toFixed(2) || '-'} L
              </div>
            </div>
            <div>
              <span className="tw-text-xs tw-font-medium tw-text-gray-600">PTS Vol</span>
              <div className="tw-text-sm tw-font-bold tw-text-gray-800">
                {gpsEntry.ptsVolume?.toFixed(2) || '-'} L
              </div>
            </div>
            <div>
              <span className="tw-text-xs tw-font-medium tw-text-gray-600">Original GPS Vol</span>
              <div className="tw-text-sm tw-font-bold tw-text-blue-600">
                {gpsEntry.gpsVolume?.toFixed(2) || '-'} L
              </div>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="tw-mb-4">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            Modified Volume (Liters) <span className="tw-text-red-500">*</span>
          </label>
          <input
            type="number"
            className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
            value={formData.modifiedVolume}
            onChange={(e) => handleFieldChange('modifiedVolume', e.target.value)}
            step="0.01"
            min="0"
            placeholder="Enter modified volume"
          />
        </div>

        <div className="tw-mb-4">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            Modification Reason <span className="tw-text-red-500">*</span>
          </label>
          <textarea
            className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
            value={formData.modificationReason}
            onChange={(e) => handleFieldChange('modificationReason', e.target.value)}
            rows={4}
            placeholder="Explain why the GPS volume is being modified (minimum 10 characters)"
          />
          <div className="tw-text-xs tw-text-gray-500 tw-mt-1">
            {formData.modificationReason.length} / 10 characters minimum
          </div>
        </div>

        {/* Last Modified Info */}
        {gpsEntry.isGpsModified && (
          <div className="tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-rounded-lg tw-p-3 tw-mb-4">
            <div className="tw-flex tw-items-start tw-gap-2">
              <i className="fa-light fa-info-circle tw-text-yellow-600 tw-mt-1"></i>
              <div className="tw-text-xs tw-text-yellow-800">
                <strong>Previously Modified:</strong> {gpsEntry.gpsModificationReason}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6">
          <Button
            text="Cancel"
            onClick={onClose}
            type="normal"
            stylingMode="outlined"
            disabled={isSaving}
          />
          <Button
            text={isSaving ? "Saving..." : "Save Changes"}
            onClick={handleSave}
            type="default"
            stylingMode="contained"
            disabled={isSaving}
            icon={isSaving ? "fa-light fa-spinner fa-spin" : "fa-light fa-save"}
          />
        </div>
      </div>
    </Popup>
  );
};

export default EditGpsEntryModal;
