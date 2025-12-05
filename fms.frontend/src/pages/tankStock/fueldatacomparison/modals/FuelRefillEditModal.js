/**
 * FuelRefillEditModal - Modal for editing fuel refill records
 *
 * Features:
 * - Edit fuel refill amount, meter readings, and comments
 * - Validate input data
 * - Submit changes to API
 *
 * @param {Object} fuelRefill - Fuel refill record to edit
 * @param {Function} onClose - Callback when modal closes
 * @param {Function} onSave - Callback when changes are saved
 * @param {Array} sites - Available sites
 * @param {Array} vehicles - Available vehicles
 */

import React, { useState } from 'react';
import { Popup, Button, TextBox, NumberBox, SelectBox, TextArea, LoadPanel } from 'devextreme-react';
import notify from 'devextreme/ui/notify';
import { updateFuelRefill } from '../../../../api/fuelRefillClient';
import './FuelRefillEditModal.scss';

const FuelRefillEditModal = ({ fuelRefill, onClose, onSave, sites = [], vehicles = [] }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: fuelRefill.id,
    vehicleId: fuelRefill.vehicleId,
    siteId: fuelRefill.siteId,
    date: fuelRefill.date ? new Date(fuelRefill.date) : new Date(),
    manualFuelrefillAmount: fuelRefill.manualFuelrefillAmount || 0,
    previousMeterReading: fuelRefill.previousMeterReading || 0,
    currentMeterReading: fuelRefill.currentMeterReading || 0,
    driverId: fuelRefill.driverId || null,
    tagId: fuelRefill.tagId || '',
    comment: fuelRefill.comment || ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.vehicleId) {
        notify({
          message: 'Vehicle is required',
          type: 'warning',
          displayTime: 3000
        });
        return;
      }

      if (!formData.siteId) {
        notify({
          message: 'Site is required',
          type: 'warning',
          displayTime: 3000
        });
        return;
      }

      if (formData.manualFuelrefillAmount <= 0) {
        notify({
          message: 'Fuel amount must be greater than 0',
          type: 'warning',
          displayTime: 3000
        });
        return;
      }

      setIsLoading(true);

      // Prepare data for API
      const updateData = {
        id: formData.id,
        vehicleId: formData.vehicleId,
        siteId: formData.siteId,
        date: formData.date.toISOString(),
        manualFuelrefillAmount: formData.manualFuelrefillAmount,
        previousMeterReading: formData.previousMeterReading,
        currentMeterReading: formData.currentMeterReading,
        driverId: formData.driverId,
        tagId: formData.tagId,
        comment: formData.comment
      };

      const response = await updateFuelRefill(formData.id, updateData);

      if (response?.success || response?.isSuccess) {
        notify({
          message: 'Fuel refill updated successfully',
          type: 'success',
          displayTime: 3000
        });
        onSave?.();
      } else {
        notify({
          message: response?.message || 'Failed to update fuel refill',
          type: 'error',
          displayTime: 3000
        });
      }
    } catch (error) {
      console.error('Error updating fuel refill:', error);
      notify({
        message: error?.response?.data?.message || 'Error updating fuel refill',
        type: 'error',
        displayTime: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popup
      visible={true}
      onHiding={onClose}
      title="Edit Fuel Refill"
      maxWidth={600}
      maxHeight="90vh"
      showCloseButton={true}
      showTitle={true}
    >
      <LoadPanel visible={isLoading} />

      <div className="tw-space-y-4 tw-max-h-[calc(90vh-120px)] tw-overflow-y-auto tw-p-4">
        {/* Vehicle */}
        <div className="tw-mb-4">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            Vehicle <span className="tw-text-red-500">*</span>
          </label>
          <SelectBox
            dataSource={vehicles}
            displayExpr="vehicleNo"
            valueExpr="id"
            value={formData.vehicleId}
            onValueChanged={(e) => handleInputChange('vehicleId', e.value)}
            searchEnabled={true}
            showClearButton={false}
          />
        </div>

        {/* Site */}
        <div className="tw-mb-4">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            Site <span className="tw-text-red-500">*</span>
          </label>
          <SelectBox
            dataSource={sites}
            displayExpr="name"
            valueExpr="id"
            value={formData.siteId}
            onValueChanged={(e) => handleInputChange('siteId', e.value)}
            searchEnabled={true}
            showClearButton={false}
          />
        </div>

        {/* Date */}
        <div className="tw-mb-4">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            Date <span className="tw-text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.date.toISOString().split('T')[0]}
            onChange={(e) => handleInputChange('date', new Date(e.target.value))}
            className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm"
          />
        </div>

        {/* Fuel Amount */}
        <div className="tw-mb-4">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            Fuel Amount (L) <span className="tw-text-red-500">*</span>
          </label>
          <NumberBox
            value={formData.manualFuelrefillAmount}
            onValueChanged={(e) => handleInputChange('manualFuelrefillAmount', e.value)}
            min={0}
            step={0.01}
            format="#,##0.##"
          />
        </div>

        {/* Previous Meter Reading */}
        <div className="tw-mb-4">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            Previous Meter Reading
          </label>
          <NumberBox
            value={formData.previousMeterReading}
            onValueChanged={(e) => handleInputChange('previousMeterReading', e.value)}
            min={0}
            step={0.01}
            format="#,##0.##"
          />
        </div>

        {/* Current Meter Reading */}
        <div className="tw-mb-4">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            Current Meter Reading
          </label>
          <NumberBox
            value={formData.currentMeterReading}
            onValueChanged={(e) => handleInputChange('currentMeterReading', e.value)}
            min={0}
            step={0.01}
            format="#,##0.##"
          />
        </div>

        {/* Driver ID */}
        <div className="tw-mb-4">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            Driver ID
          </label>
          <NumberBox
            value={formData.driverId}
            onValueChanged={(e) => handleInputChange('driverId', e.value)}
            min={0}
          />
        </div>

        {/* Tag ID */}
        <div className="tw-mb-4">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            Tag ID
          </label>
          <TextBox
            value={formData.tagId}
            onValueChanged={(e) => handleInputChange('tagId', e.value)}
            maxLength={50}
          />
        </div>

        {/* Comment */}
        <div className="tw-mb-4">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            Comment
          </label>
          <TextArea
            value={formData.comment}
            onValueChanged={(e) => handleInputChange('comment', e.value)}
            height={80}
            maxLength={500}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="tw-flex tw-justify-end tw-gap-3 tw-p-4 tw-border-t tw-border-gray-200">
        <Button
          text="Cancel"
          onClick={onClose}
          type="default"
          stylingMode="outlined"
        />
        <Button
          text="Save"
          onClick={handleSave}
          type="default"
          stylingMode="contained"
          disabled={isLoading}
        />
      </div>
    </Popup>
  );
};

export default FuelRefillEditModal;
