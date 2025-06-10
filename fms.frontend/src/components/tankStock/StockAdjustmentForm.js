import React, { useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Button } from 'devextreme-react/button';
import { SelectBox } from 'devextreme-react/select-box';
import { NumberBox } from 'devextreme-react/number-box';
import { TextArea } from 'devextreme-react/text-area';
import { DateBox } from 'devextreme-react/date-box';
import LoadIndicator from 'devextreme-react/load-indicator';
import { useStockManagement } from '../../hooks/useStockManagement';
import notify from 'devextreme/ui/notify';

const AdjustmentTypes = [
  { id: 0, name: 'Increase', icon: 'fa-light fa-arrow-up', color: '#28a745' },
  { id: 1, name: 'Decrease', icon: 'fa-light fa-arrow-down', color: '#dc3545' },
  { id: 2, name: 'Correction', icon: 'fa-light fa-pen-to-square', color: '#ffc107' }
];

//Cursor - Updated Stock Adjustment Reasons to match StockAdjustmentReasonEnum
const AdjustmentReasons = [
  { id: 1, name: 'Physical Count' },
  { id: 2, name: 'System Error' },
  { id: 3, name: 'Calibration' },
  { id: 4, name: 'Temperature Compensation' },
  { id: 5, name: 'Spillage or Loss' },
  { id: 6, name: 'Meter Correction' },
  { id: 7, name: 'Tank Maintenance' },
  { id: 8, name: 'Data Migration' },
  { id: 99, name: 'Other' }
];

//Cursor - Stock Adjustment Form Component - Updated for new entity structure
const StockAdjustmentForm = ({ onSubmit, onCancel, isVisible, saving }) => {
  const { validateTankCapacity, calculateVolumeChange } = useStockManagement();
  const sites = useSelector((state) => state.site.sites);
  const tanks = useSelector((state) => state.tank.tanks);
  const user = useSelector((state) => state.auth.user);

  const [formData, setFormData] = useState({
    tankId: '',
    siteId: '',
    adjustmentDate: new Date(),
    currentVolume: 0,
    newVolume: 0,
    volumeChange: 0, //Cursor - Added missing volumeChange field
    adjustmentType: 0,
    reasonCode: 1, //Cursor - Updated to use reasonCode instead of reasonId
    reason: '', //Cursor - Human readable reason
    notes: '',
    createdBy: user?.id || '',
    status: 1 //Cursor - Default to approved
  });

  const [formErrors, setFormErrors] = useState({});

  // Filter tanks based on selected site
  const filteredTanks = useMemo(() => {
    if (!formData.siteId) return [];
    return tanks.filter(tank => tank.siteId === formData.siteId);
  }, [tanks, formData.siteId]);

  // Get selected tank info
  const selectedTank = useMemo(() => {
    return tanks.find(tank => tank.id === formData.tankId);
  }, [tanks, formData.tankId]);

  // Calculate volume change when values change
  const handleVolumeChange = useCallback((field, value) => {
    setFormData(prevFormData => {
      const updatedData = { ...prevFormData, [field]: value };

      if (field === 'tankId') {
        const tank = tanks.find(t => t.id === value);
        if (tank) {
          updatedData.currentVolume = tank.currentStock || 0;
          updatedData.newVolume = tank.currentStock || 0;
          updatedData.volumeChange = 0;
          updatedData.adjustmentType = 2; // Correction when no change
        }
      }

      if (field === 'newVolume' || field === 'currentVolume') {
        updatedData.volumeChange = calculateVolumeChange(
          updatedData.currentVolume,
          updatedData.newVolume
        );

        // Determine adjustment type based on volume change
        if (updatedData.volumeChange > 0) {
          updatedData.adjustmentType = 0; // Increase
        } else if (updatedData.volumeChange < 0) {
          updatedData.adjustmentType = 1; // Decrease
        } else {
          updatedData.adjustmentType = 2; // Correction
        }
      }

      return updatedData;
    });
  }, [tanks, calculateVolumeChange]);

  // Validation functions
  const validateTank = useCallback((value) => {
    if (!value) return false;
    return filteredTanks.some(tank => tank.id === value);
  }, [filteredTanks]);

  const validateVolume = useCallback((value) => {
    if (!selectedTank) return true;
    const validation = validateTankCapacity(selectedTank.id, value, tanks);
    return validation.isValid;
  }, [selectedTank, validateTankCapacity, tanks]);

  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.siteId) errors.siteId = 'Site is required';
    if (!formData.tankId) errors.tankId = 'Tank is required';
    if (!formData.reasonCode || formData.reasonCode === '') errors.reasonCode = 'Reason is required'; //Cursor - Fixed validation
    if (formData.reasonCode === 99 && (!formData.reason || !formData.reason.trim())) { //Cursor - Better validation for custom reason
      errors.reason = 'Custom reason is required';
    }
    if (!formData.adjustmentDate) errors.adjustmentDate = 'Date is required';

    // Volume validation
    if (selectedTank) {
      const volumeValidation = validateTankCapacity(selectedTank.id, formData.newVolume, tanks);
      if (!volumeValidation.isValid) {
        errors.newVolume = volumeValidation.message;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, selectedTank, validateTankCapacity, tanks]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      notify('Please fix the validation errors', 'error', 3000);
      return;
    }

    //Cursor - Updated to match our new DTO structure
    const selectedReason = AdjustmentReasons.find(r => r.id === formData.reasonCode);
    const adjustmentData = {
      tankId: formData.tankId,
      siteId: formData.siteId,
      adjustmentDate: formData.adjustmentDate,
      currentVolume: formData.currentVolume,
      newVolume: formData.newVolume,
      adjustmentType: formData.adjustmentType,
      reasonCode: formData.reasonCode,
      reason: formData.reasonCode === 99 ? formData.reason : selectedReason?.name || '',
      notes: formData.notes,
      createdBy: formData.createdBy,
      status: formData.status
    };

    const result = await onSubmit(adjustmentData);
    if (result?.success) {
      // Reset form
      setFormData({
        tankId: '',
        siteId: '',
        adjustmentDate: new Date(),
        currentVolume: 0,
        newVolume: 0,
        volumeChange: 0, //Cursor - Added volumeChange to reset
        adjustmentType: 0,
        reasonCode: 1, //Cursor - Fixed to use reasonCode instead of reasonId
        reason: '', //Cursor - Fixed to use reason instead of customReason
        notes: '',
        createdBy: user?.id || '',
        status: 1 //Cursor - Added status field to reset
      });
      setFormErrors({});
    }
  }, [formData, validateForm, onSubmit, user]);

  if (!isVisible) return null;

  return (
    <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-lg">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
        <div className="tw-flex tw-items-center">
          <i className="fa-light fa-clipboard-list tw-text-blue-600 tw-text-xl tw-mr-3"></i>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">Stock Adjustment</h3>
        </div>
        {/* Close Button */}
        <Button
          icon="fa-light fa-times"
          hint="Close Form"
          onClick={onCancel}
          stylingMode="text"
          width={36}
          height={36}
        />
      </div>

      {/* Site Selection */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6 tw-mb-6">
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            Site <span className="tw-text-red-500">*</span>
          </label>
          <SelectBox
            dataSource={sites}
            valueExpr="id"
            displayExpr="name"
            placeholder="Select Site"
            value={formData.siteId}
            onValueChanged={(e) => handleVolumeChange('siteId', e.value)}
            validationError={formErrors.siteId}
            isValid={!formErrors.siteId}
            height={40}
          />
          {formErrors.siteId && (
            <div className="tw-text-red-500 tw-text-xs tw-mt-1">{formErrors.siteId}</div>
          )}
        </div>

        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            Tank <span className="tw-text-red-500">*</span>
          </label>
          <SelectBox
            dataSource={filteredTanks}
            valueExpr="id"
            displayExpr="name"
            placeholder="Select Tank"
            value={formData.tankId}
            onValueChanged={(e) => handleVolumeChange('tankId', e.value)}
            disabled={!formData.siteId}
            validationError={formErrors.tankId}
            isValid={!formErrors.tankId}
            height={40}
          />
          {formErrors.tankId && (
            <div className="tw-text-red-500 tw-text-xs tw-mt-1">{formErrors.tankId}</div>
          )}
        </div>
      </div>

      {/* Tank Information Display */}
      {selectedTank && (
        <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-mb-6">
          <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4 tw-text-sm">
            <div>
              <span className="tw-font-medium tw-text-gray-600">Capacity:</span>
              <span className="tw-ml-2 tw-text-gray-800">{selectedTank.tankVolume} L</span>
            </div>
            <div>
              <span className="tw-font-medium tw-text-gray-600">Current Stock:</span>
              <span className="tw-ml-2 tw-text-gray-800">{selectedTank.currentStock} L</span>
            </div>
            <div>
              <span className="tw-font-medium tw-text-gray-600">Utilization:</span>
              <span className="tw-ml-2 tw-text-gray-800">
                {((selectedTank.currentStock / selectedTank.tankVolume) * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="tw-font-medium tw-text-gray-600">Available Space:</span>
              <span className="tw-ml-2 tw-text-gray-800">
                {selectedTank.tankVolume - selectedTank.currentStock} L
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Volume Fields */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6 tw-mb-6">
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            Current Volume (L)
          </label>
          <NumberBox
            value={formData.currentVolume}
            readOnly={true}
            format="#0.##"
            height={40}
          />
        </div>

        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            New Volume (L) <span className="tw-text-red-500">*</span>
          </label>
          <NumberBox
            value={formData.newVolume}
            onValueChanged={(e) => handleVolumeChange('newVolume', e.value)}
            format="#0.##"
            step={0.01}
            min={0}
            max={selectedTank?.tankVolume || 999999}
            validationError={formErrors.newVolume}
            isValid={!formErrors.newVolume}
            height={40}
            showSpinButtons={true}
            useMaskBehavior={true}
          />
          {formErrors.newVolume && (
            <div className="tw-text-red-500 tw-text-xs tw-mt-1">{formErrors.newVolume}</div>
          )}
        </div>

        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            Volume Change (L)
          </label>
          <NumberBox
            value={formData.volumeChange}
            readOnly={true}
            format="#0.##"
            height={40}
            className={formData.volumeChange >= 0 ? 'tw-text-green-600' : 'tw-text-red-600'}
          />
        </div>
      </div>

      {/* Adjustment Type Display */}
      {formData.volumeChange !== 0 && (
        <div className="tw-flex tw-items-center tw-mb-6 tw-p-3 tw-rounded-lg tw-bg-gray-50">
          <i className={`${AdjustmentTypes[formData.adjustmentType]?.icon} tw-mr-2`}
             style={{ color: AdjustmentTypes[formData.adjustmentType]?.color }}></i>
          <span className="tw-font-medium" style={{ color: AdjustmentTypes[formData.adjustmentType]?.color }}>
            {AdjustmentTypes[formData.adjustmentType]?.name}
          </span>
          <span className="tw-ml-2 tw-text-gray-600">
            ({formData.volumeChange > 0 ? '+' : ''}{formData.volumeChange.toFixed(2)} L)
          </span>
        </div>
      )}

      {/* Reason and Date */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6 tw-mb-6">
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            Adjustment Reason <span className="tw-text-red-500">*</span>
          </label>
          <SelectBox
            dataSource={AdjustmentReasons}
            valueExpr="id"
            displayExpr="name"
            placeholder="Select Reason"
            value={formData.reasonCode}
            onValueChanged={(e) => setFormData({ ...formData, reasonCode: e.value })}
            validationError={formErrors.reasonCode}
            isValid={!formErrors.reasonCode}
            height={40}
          />
          {formErrors.reasonCode && (
            <div className="tw-text-red-500 tw-text-xs tw-mt-1">{formErrors.reasonCode}</div>
          )}
        </div>

        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            Adjustment Date <span className="tw-text-red-500">*</span>
          </label>
          <DateBox
            value={formData.adjustmentDate}
            onValueChanged={(e) => setFormData({ ...formData, adjustmentDate: e.value })}
            max={new Date()}
            validationError={formErrors.adjustmentDate}
            isValid={!formErrors.adjustmentDate}
            height={40}
          />
          {formErrors.adjustmentDate && (
            <div className="tw-text-red-500 tw-text-xs tw-mt-1">{formErrors.adjustmentDate}</div>
          )}
        </div>
      </div>

      {/* Custom Reason */}
      {formData.reasonCode === 99 && (
        <div className="tw-mb-6">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            Custom Reason <span className="tw-text-red-500">*</span>
          </label>
          <TextArea
            value={formData.reason}
            onValueChanged={(e) => setFormData({ ...formData, reason: e.value })}
            placeholder="Enter custom reason"
            height={60}
            validationError={formErrors.reason}
            isValid={!formErrors.reason}
          />
          {formErrors.reason && (
            <div className="tw-text-red-500 tw-text-xs tw-mt-1">{formErrors.reason}</div>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="tw-mb-6">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
          Additional Notes
        </label>
        <TextArea
          value={formData.notes}
          onValueChanged={(e) => setFormData({ ...formData, notes: e.value })}
          placeholder="Enter any additional notes or comments"
          height={80}
        />
      </div>

      {/* Action Buttons */}
      <div className="tw-flex tw-justify-end tw-space-x-3">
        <Button
          text="Cancel"
          onClick={onCancel}
          disabled={saving}
          stylingMode="outlined"
        />
        <Button
          text={saving ? "Saving..." : "Create Adjustment"}
          onClick={handleSubmit}
          disabled={saving || !formData.siteId || !formData.tankId}
          stylingMode="contained"
          type="default"
        >
          {saving && <LoadIndicator width="16px" height="16px" visible={true} />}
        </Button>
      </div>
    </div>
  );
};

export default StockAdjustmentForm;