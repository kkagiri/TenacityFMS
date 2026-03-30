/**
 * File: FuelRefillEditModal.js
 * Purpose: M365 side panel for editing fuel refill records.
 * Dependencies: react, devextreme-react, SlidePanel, fuelRefillClient.
 * Last Modified: 2026-03-11
 *
 * Key Behaviors:
 * - Edits refill details in a Fluent M365 side panel.
 * - Sends correction reason for backend update workflow.
 * - Uses compact admin-center form styling.
 */
import React, { useState } from 'react';
import { TextBox, NumberBox, SelectBox, TextArea, LoadPanel } from 'devextreme-react';
import notify from 'devextreme/ui/notify';
import { updateFuelRefill } from '../../../../api/fuelRefillClient';
import SlidePanel from '../../../../components/ui/SlidePanel';
import './FuelRefillEditModal.scss';

const formatDateTimeInputValue = (value) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return '';
  }

  const localDate = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

const parseDateTimeInputValue = (value, fallbackValue) => {
  const parsedDate = value ? new Date(value) : null;

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return fallbackValue;
  }

  return parsedDate;
};

const formatApiDateTime = (value) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return null;
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  const seconds = String(value.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

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
    comment: fuelRefill.comment || '',
    correctionReason: fuelRefill.correctionReason || ''
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      if (!formData.vehicleId) {
        notify({ message: 'Vehicle is required', type: 'warning', displayTime: 3000 });
        return;
      }

      if (!formData.siteId) {
        notify({ message: 'Site is required', type: 'warning', displayTime: 3000 });
        return;
      }

      if (formData.manualFuelrefillAmount <= 0) {
        notify({ message: 'Fuel amount must be greater than 0', type: 'warning', displayTime: 3000 });
        return;
      }

      setIsLoading(true);

      const updateData = {
        id: formData.id,
        vehicleId: formData.vehicleId,
        siteId: formData.siteId,
        date: formatApiDateTime(formData.date),
        manualFuelrefillAmount: formData.manualFuelrefillAmount,
        previousMeterReading: formData.previousMeterReading,
        currentMeterReading: formData.currentMeterReading,
        driverId: formData.driverId,
        tagId: formData.tagId,
        comment: formData.comment,
        correctionReason: formData.correctionReason?.trim() || 'Manual fuel refill update'
      };

      const response = await updateFuelRefill(formData.id, updateData);

      if (response?.success || response?.isSuccess) {
        notify({ message: 'Fuel refill updated successfully', type: 'success', displayTime: 3000 });
        onSave?.();
        return;
      }

      notify({
        message: response?.message || 'Failed to update fuel refill',
        type: 'error',
        displayTime: 3000
      });
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
    <SlidePanel
      open={true}
      onClose={onClose}
      title="Edit Fuel Refill"
      width={640}
      panelClassName="fuel-refill-edit-panel"
    >
      <LoadPanel visible={isLoading} />

      <div className="fuel-refill-edit-panel__content">
        <div className="fuel-refill-edit-panel__intro">
          <div className="fuel-refill-edit-panel__intro-icon">
            <i className="fa-light fa-pen-to-square"></i>
          </div>
          <div>
            <h4 className="fuel-refill-edit-panel__intro-title">Update refill details</h4>
            <p className="fuel-refill-edit-panel__intro-text">
              Edit the refill entry using the M365 side panel workflow. Stock recalculation only runs when the amount,
              tank, site, or date changes.
            </p>
          </div>
        </div>

        <div className="fuel-refill-edit-panel__meta-card">
          <div className="fuel-refill-edit-panel__meta-item">
            <span className="fuel-refill-edit-panel__meta-label">Refill ID</span>
            <span className="fuel-refill-edit-panel__meta-value">{fuelRefill.id}</span>
          </div>
          <div className="fuel-refill-edit-panel__meta-item">
            <span className="fuel-refill-edit-panel__meta-label">Current amount</span>
            <span className="fuel-refill-edit-panel__meta-value">
              {Number(fuelRefill.manualFuelrefillAmount || 0).toFixed(2)} L
            </span>
          </div>
        </div>

        <div className="fuel-refill-edit-panel__section">
          <h5 className="fuel-refill-edit-panel__section-title">Core details</h5>
          <div className="fuel-refill-edit-panel__form-grid">
            <div className="fuel-refill-edit-panel__field fuel-refill-edit-panel__field--full">
              <label className="fuel-refill-edit-panel__label">
                Vehicle <span className="fuel-refill-edit-panel__required">*</span>
              </label>
              <SelectBox
                dataSource={vehicles}
                displayExpr="vehicleNo"
                valueExpr="id"
                value={formData.vehicleId}
                onValueChanged={(e) => handleInputChange('vehicleId', e.value)}
                searchEnabled={true}
                showClearButton={false}
                className="fuel-refill-edit-panel__editor"
                inputAttr={{ 'aria-label': 'Vehicle' }}
              />
            </div>

            <div className="fuel-refill-edit-panel__field">
              <label className="fuel-refill-edit-panel__label">
                Site <span className="fuel-refill-edit-panel__required">*</span>
              </label>
              <SelectBox
                dataSource={sites}
                displayExpr="name"
                valueExpr="id"
                value={formData.siteId}
                onValueChanged={(e) => handleInputChange('siteId', e.value)}
                searchEnabled={true}
                showClearButton={false}
                className="fuel-refill-edit-panel__editor"
                inputAttr={{ 'aria-label': 'Site' }}
              />
            </div>

            <div className="fuel-refill-edit-panel__field">
              <label className="fuel-refill-edit-panel__label">
                Date <span className="fuel-refill-edit-panel__required">*</span>
              </label>
              <input
                type="datetime-local"
                value={formatDateTimeInputValue(formData.date)}
                onChange={(e) => handleInputChange('date', parseDateTimeInputValue(e.target.value, formData.date))}
                className="fuel-refill-edit-panel__input"
              />
            </div>

            <div className="fuel-refill-edit-panel__field">
              <label className="fuel-refill-edit-panel__label">
                Fuel Amount (L) <span className="fuel-refill-edit-panel__required">*</span>
              </label>
              <NumberBox
                value={formData.manualFuelrefillAmount}
                onValueChanged={(e) => handleInputChange('manualFuelrefillAmount', e.value)}
                min={0}
                step={0.01}
                format="#,##0.##"
                className="fuel-refill-edit-panel__editor"
                inputAttr={{ 'aria-label': 'Fuel Amount' }}
              />
            </div>

            <div className="fuel-refill-edit-panel__field">
              <label className="fuel-refill-edit-panel__label">Previous Meter Reading</label>
              <NumberBox
                value={formData.previousMeterReading}
                onValueChanged={(e) => handleInputChange('previousMeterReading', e.value)}
                min={0}
                step={0.01}
                format="#,##0.##"
                className="fuel-refill-edit-panel__editor"
                inputAttr={{ 'aria-label': 'Previous Meter Reading' }}
              />
            </div>

            <div className="fuel-refill-edit-panel__field">
              <label className="fuel-refill-edit-panel__label">Current Meter Reading</label>
              <NumberBox
                value={formData.currentMeterReading}
                onValueChanged={(e) => handleInputChange('currentMeterReading', e.value)}
                min={0}
                step={0.01}
                format="#,##0.##"
                className="fuel-refill-edit-panel__editor"
                inputAttr={{ 'aria-label': 'Current Meter Reading' }}
              />
            </div>
          </div>
        </div>

        <div className="fuel-refill-edit-panel__section">
          <h5 className="fuel-refill-edit-panel__section-title">Additional details</h5>
          <div className="fuel-refill-edit-panel__form-grid">
            <div className="fuel-refill-edit-panel__field">
              <label className="fuel-refill-edit-panel__label">Driver ID</label>
              <NumberBox
                value={formData.driverId}
                onValueChanged={(e) => handleInputChange('driverId', e.value)}
                min={0}
                className="fuel-refill-edit-panel__editor"
                inputAttr={{ 'aria-label': 'Driver ID' }}
              />
            </div>

            <div className="fuel-refill-edit-panel__field">
              <label className="fuel-refill-edit-panel__label">Tag ID</label>
              <TextBox
                value={formData.tagId}
                onValueChanged={(e) => handleInputChange('tagId', e.value)}
                maxLength={50}
                className="fuel-refill-edit-panel__editor"
                inputAttr={{ 'aria-label': 'Tag ID' }}
              />
            </div>

            <div className="fuel-refill-edit-panel__field fuel-refill-edit-panel__field--full">
              <label className="fuel-refill-edit-panel__label">Comment</label>
              <TextArea
                value={formData.comment}
                onValueChanged={(e) => handleInputChange('comment', e.value)}
                height={92}
                maxLength={500}
                className="fuel-refill-edit-panel__editor fuel-refill-edit-panel__editor--textarea"
              />
            </div>

            <div className="fuel-refill-edit-panel__field fuel-refill-edit-panel__field--full">
              <label className="fuel-refill-edit-panel__label">Correction Reason</label>
              <TextArea
                value={formData.correctionReason}
                onValueChanged={(e) => handleInputChange('correctionReason', e.value)}
                height={88}
                maxLength={200}
                placeholder="Explain why this refill is being updated"
                className="fuel-refill-edit-panel__editor fuel-refill-edit-panel__editor--textarea"
              />
              <p className="fuel-refill-edit-panel__hint">
                Used when the update affects tank stock or transaction history.
              </p>
            </div>
          </div>
        </div>

        <div className="fuel-refill-edit-panel__footer">
          <button
            type="button"
            className="fuel-refill-edit-panel__button fuel-refill-edit-panel__button--ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="fuel-refill-edit-panel__button fuel-refill-edit-panel__button--primary"
            onClick={handleSave}
            disabled={isLoading}
          >
            <i className="fa-light fa-floppy-disk"></i>
            Save changes
          </button>
        </div>
      </div>
    </SlidePanel>
  );
};

export default FuelRefillEditModal;
