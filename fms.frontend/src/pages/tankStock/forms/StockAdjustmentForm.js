/**
 * File: StockAdjustmentForm.js
 * Purpose: Capture manual tank stock adjustments and warn when the selected timestamp would rebalance later tank ledger entries.
 * Dependencies: React, Redux Toolkit, DevExtreme components, useStockManagement, useFutureRecordsValidation
 * Last Modified: 2026-03-13
 *
 * Key Functions:
 * - StockAdjustmentForm: Handles tank stock adjustment data entry and submission
 * - handleVolumeChange(): Synchronizes form state, volume deltas, and future-record validation
 * - validateForm(): Enforces required fields and capacity constraints before submit
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { SelectBox } from 'devextreme-react/select-box';
import { NumberBox } from 'devextreme-react/number-box';
import { TextArea } from 'devextreme-react/text-area';
import { DateBox } from 'devextreme-react/date-box';
import LoadIndicator from 'devextreme-react/load-indicator';
import { useStockManagement } from '../../../hooks/useStockManagement';
import { useFutureRecordsValidation } from '../../../hooks/useFutureRecordsValidation';
import FutureRecordsWarning from '../../../components/tank-stock/FutureRecordsWarning';
import { VolumeChangeReasons } from '../../../services/tankStockFutureRecordsService';
import notify from 'devextreme/ui/notify';
import './_m365-form-common.scss';

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
const StockAdjustmentForm = ({ onSubmit, onCancel, isVisible, initialData }) => {
  const { validateTankCapacity, calculateVolumeChange } = useStockManagement();
  const sites = useSelector((state) => state.site.sites);
  const tanks = useSelector((state) => state.tank.tanks);
  const user = useSelector((state) => state.auth.user);

  //Cursor - Local saving state for the form only
  const [saving, setSaving] = useState(false);
  const [showHistoricalNotice, setShowHistoricalNotice] = useState(true);

  // Future records validation hook
  const {
    isValidating,
    validationResult,
    error: validationError,
    showWarning,
    canSubmit: canSubmitForm,
    validateHistoricalEntry,
    confirmProceed,
    cancelProceed,
    resetValidation,
  } = useFutureRecordsValidation();

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

  //Cursor - Handle initialData for editing or quick actions
  useEffect(() => {
    if (initialData) {
      setFormData(prevData => ({
        ...prevData,
        ...initialData,
        // Ensure some fields are properly set
        adjustmentDate: initialData.adjustmentDate ? new Date(initialData.adjustmentDate) : new Date(),
        createdBy: user?.id || '',
        // Set reason text based on reasonCode if not provided
        reason: initialData.reason || (initialData.reasonCode ?
          AdjustmentReasons.find(r => r.id === initialData.reasonCode)?.name || '' : '')
      }));
    }
  }, [initialData, user]);

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
  const handleVolumeChange = useCallback(async (field, value) => {
    setFormData(prevFormData => {
      const updatedData = { ...prevFormData, [field]: value };

      if (field === 'siteId') {
        // Clear tank selection when site changes
        updatedData.tankId = '';
        updatedData.currentVolume = 0;
        updatedData.newVolume = 0;
        updatedData.volumeChange = 0;
        updatedData.adjustmentType = 2;
        resetValidation();
      }

      if (field === 'tankId') {
        const tank = tanks.find(t => t.id === value);
        if (tank) {
          updatedData.currentVolume = tank.currentStock || 0;
          updatedData.newVolume = tank.currentStock || 0;
          updatedData.volumeChange = 0;
          updatedData.adjustmentType = 2; // Correction when no change
        }
        resetValidation();

        // Validate historical entry for tank change
        if (value && formData.adjustmentDate) {
          validateHistoricalEntry(value, formData.adjustmentDate, VolumeChangeReasons.ADJUSTMENT).catch(err => {
            console.warn("Validation error:", err);
          });
        }
      }

      if (field === 'adjustmentDate') {
        resetValidation();

        // Validate historical entry for date change
        if (value && formData.tankId) {
          validateHistoricalEntry(formData.tankId, value, VolumeChangeReasons.ADJUSTMENT).catch(err => {
            console.warn("Validation error:", err);
          });
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
  }, [tanks, calculateVolumeChange, formData.adjustmentDate, formData.tankId, resetValidation, validateHistoricalEntry]);

  // Validation logic
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

    // Check if we can submit based on future records validation
    if (!canSubmitForm) {
      notify('Please resolve validation warnings before submitting', 'warning', 4000);
      return;
    }

    //Cursor - Set local saving state
    setSaving(true);

    try {
      //Cursor - Updated to match our new DTO structure
      const selectedReason = AdjustmentReasons.find(r => r.id === formData.reasonCode);
      const adjustmentData = {
        tankId: formData.tankId,
        siteId: formData.siteId,
        adjustmentDate: formData.adjustmentDate,
        currentVolume: formData.currentVolume,
        newVolume: formData.newVolume,
        volumeChange: formData.volumeChange, //Cursor - Added missing volumeChange field
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
    } catch (error) {
      console.error('Error submitting stock adjustment:', error);
      notify('An unexpected error occurred', 'error', 3000);
    } finally {
      //Cursor - Reset local saving state
      setSaving(false);
    }
  }, [formData, validateForm, onSubmit, user, canSubmitForm]);

  if (!isVisible) return null;

  return (
    <div className="m365-form-body">
      <div className="m365-form-body__scroll">

        {/* Description */}
        <p className="m365-form-body__description">
          Record a stock adjustment to correct or update the volume for a selected tank.
        </p>

        {/* ── Site & Tank Selection ── */}
        <div className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-location-dot m365-section-group__icon"></i>
            <span className="m365-section-group__title">Location</span>
          </div>
          <div className="m365-section-group__body">
            <div className="m365-field-row">
              <div className="m365-field">
                <label className="m365-field__label">
                  Site <span className="m365-required">*</span>
                </label>
                <SelectBox
                  dataSource={sites}
                  valueExpr="id"
                  displayExpr="name"
                  placeholder="Select Site"
                  value={formData.siteId}
                  onValueChanged={(e) => handleVolumeChange('siteId', e.value)}
                  isValid={!formErrors.siteId}
                  validationError={formErrors.siteId ? { message: formErrors.siteId } : null}
                  validationMessageMode="always"
                  width="100%"
                  searchEnabled={true}
                  showClearButton={true}
                />
                {formErrors.siteId && (
                  <span className="m365-field__error">{formErrors.siteId}</span>
                )}
              </div>

              <div className="m365-field">
                <label className="m365-field__label">
                  Tank <span className="m365-required">*</span>
                </label>
                <SelectBox
                  dataSource={filteredTanks}
                  valueExpr="id"
                  displayExpr="name"
                  placeholder={
                    !formData.siteId
                      ? "Select site first"
                      : filteredTanks.length > 0
                        ? "Select Tank"
                        : "No tanks available"
                  }
                  value={formData.tankId}
                  onValueChanged={(e) => handleVolumeChange('tankId', e.value)}
                  disabled={!formData.siteId}
                  isValid={!formErrors.tankId}
                  validationError={formErrors.tankId ? { message: formErrors.tankId } : null}
                  validationMessageMode="always"
                  width="100%"
                  searchEnabled={true}
                  showClearButton={true}
                />
                {formErrors.tankId && (
                  <span className="m365-field__error">{formErrors.tankId}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Selected Tank Information ── */}
        {selectedTank && (
          <div className="m365-section-group">
            <div className="m365-section-group__header">
              <i className="fa-light fa-gas-pump m365-section-group__icon"></i>
              <span className="m365-section-group__title">Selected Tank Information</span>
            </div>
            <div className="m365-section-group__body">
              <div className="m365-tank-info">
                <div className="m365-tank-info__item">
                  <span className="m365-tank-info__label">Capacity</span>
                  <span className="m365-tank-info__value">{selectedTank.tankVolume} L</span>
                </div>
                <div className="m365-tank-info__item">
                  <span className="m365-tank-info__label">Current Stock</span>
                  <span className="m365-tank-info__value">{selectedTank.currentStock} L</span>
                </div>
                <div className="m365-tank-info__item">
                  <span className="m365-tank-info__label">Utilization</span>
                  <span className="m365-tank-info__value">
                    {((selectedTank.currentStock / selectedTank.tankVolume) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="m365-tank-info__item">
                  <span className="m365-tank-info__label">Available Space</span>
                  <span className="m365-tank-info__value">
                    {selectedTank.tankVolume - selectedTank.currentStock} L
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Volume Fields ── */}
        <div className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-gauge-high m365-section-group__icon"></i>
            <span className="m365-section-group__title">Volume</span>
          </div>
          <div className="m365-section-group__body">
            <div className="m365-field-row m365-field-row--3">
              <div className="m365-field">
                <label className="m365-field__label">Current Volume (L)</label>
                <NumberBox
                  value={formData.currentVolume}
                  readOnly={true}
                  format="#0.##"
                  width="100%"
                />
              </div>

              <div className="m365-field">
                <label className="m365-field__label">
                  New Volume (L) <span className="m365-required">*</span>
                </label>
                <NumberBox
                  value={formData.newVolume}
                  onValueChanged={(e) => handleVolumeChange('newVolume', e.value)}
                  format="#0.##"
                  step={0.01}
                  min={0}
                  max={selectedTank?.tankVolume || 999999}
                  isValid={!formErrors.newVolume}
                  validationError={formErrors.newVolume ? { message: formErrors.newVolume } : null}
                  validationMessageMode="always"
                  width="100%"
                  showSpinButtons={true}
                  useMaskBehavior={true}
                />
                {formErrors.newVolume && (
                  <span className="m365-field__error">{formErrors.newVolume}</span>
                )}
              </div>

              <div className="m365-field">
                <label className="m365-field__label">Volume Change (L)</label>
                <NumberBox
                  value={formData.volumeChange}
                  readOnly={true}
                  format="#0.##"
                  width="100%"
                />
              </div>
            </div>

            {/* Adjustment Type Indicator */}
            {formData.volumeChange !== 0 && (
              <div className="m365-adjustment-type">
                <i
                  className={AdjustmentTypes[formData.adjustmentType]?.icon}
                  style={{ color: AdjustmentTypes[formData.adjustmentType]?.color }}
                ></i>
                <span
                  className="m365-adjustment-type__name"
                  style={{ color: AdjustmentTypes[formData.adjustmentType]?.color }}
                >
                  {AdjustmentTypes[formData.adjustmentType]?.name}
                </span>
                <span className="m365-adjustment-type__change">
                  ({formData.volumeChange > 0 ? '+' : ''}{formData.volumeChange.toFixed(2)} L)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Reason & Date ── */}
        <div className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-list-check m365-section-group__icon"></i>
            <span className="m365-section-group__title">Details</span>
          </div>
          <div className="m365-section-group__body">
            <div className="m365-field-row">
              <div className="m365-field">
                <label className="m365-field__label">
                  Adjustment Reason <span className="m365-required">*</span>
                </label>
                <SelectBox
                  dataSource={AdjustmentReasons}
                  valueExpr="id"
                  displayExpr="name"
                  placeholder="Select Reason"
                  value={formData.reasonCode}
                  onValueChanged={(e) => setFormData({ ...formData, reasonCode: e.value })}
                  isValid={!formErrors.reasonCode}
                  validationError={formErrors.reasonCode ? { message: formErrors.reasonCode } : null}
                  validationMessageMode="always"
                  width="100%"
                />
                {formErrors.reasonCode && (
                  <span className="m365-field__error">{formErrors.reasonCode}</span>
                )}
              </div>

              <div className="m365-field">
                <label className="m365-field__label">
                  Adjustment Date <span className="m365-required">*</span>
                </label>
                <DateBox
                  value={formData.adjustmentDate}
                  onValueChanged={(e) => setFormData({ ...formData, adjustmentDate: e.value })}
                  max={new Date()}
                  isValid={!formErrors.adjustmentDate}
                  validationError={formErrors.adjustmentDate ? { message: formErrors.adjustmentDate } : null}
                  validationMessageMode="always"
                  width="100%"
                />
                {formErrors.adjustmentDate && (
                  <span className="m365-field__error">{formErrors.adjustmentDate}</span>
                )}
              </div>
            </div>

            {/* Custom Reason */}
            {formData.reasonCode === 99 && (
              <div className="m365-field m365-field--full">
                <label className="m365-field__label">
                  Custom Reason <span className="m365-required">*</span>
                </label>
                <TextArea
                  value={formData.reason}
                  onValueChanged={(e) => setFormData({ ...formData, reason: e.value })}
                  placeholder="Enter custom reason"
                  height={60}
                  width="100%"
                  isValid={!formErrors.reason}
                  validationError={formErrors.reason ? { message: formErrors.reason } : null}
                  validationMessageMode="always"
                />
                {formErrors.reason && (
                  <span className="m365-field__error">{formErrors.reason}</span>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="m365-field m365-field--full">
              <label className="m365-field__label">Additional Notes</label>
              <TextArea
                value={formData.notes}
                onValueChanged={(e) => setFormData({ ...formData, notes: e.value })}
                placeholder="Enter any additional notes or comments"
                height={80}
                width="100%"
              />
            </div>
          </div>
        </div>

        {/* ── Historical Entry Notice (m365-info-banner--warning) ── */}
        {formData.adjustmentDate && formData.tankId && !isValidating && !showWarning && !validationError && showHistoricalNotice && (
          (() => {
            const selectedDate = new Date(formData.adjustmentDate);
            const today = new Date();
            const isHistorical = selectedDate < new Date(today.setHours(0, 0, 0, 0));

            if (isHistorical) {
              return (
                <div className="m365-info-banner m365-info-banner--warning">
                  <i className="fa-light fa-calendar-clock m365-info-banner__icon"></i>
                  <div className="m365-info-banner__content">
                    <div className="m365-info-banner__title">Historical Entry Detected</div>
                    <span className="m365-info-banner__text">
                      You are creating a stock adjustment for <strong>{selectedDate.toLocaleDateString()}</strong> (backdated entry).
                      <br />
                      <strong>Impact:</strong> This will recalculate the tank's current stock and affect all subsequent records.
                    </span>
                  </div>
                  <button
                    className="m365-info-banner__dismiss"
                    onClick={() => setShowHistoricalNotice(false)}
                    title="Dismiss"
                  >
                    <i className="fa-light fa-xmark"></i>
                  </button>
                </div>
              );
            }
            return null;
          })()
        )}

        {/* Future Records Warning */}
        {(showWarning || validationError) && (
          <FutureRecordsWarning
            validationResult={validationResult}
            onConfirm={confirmProceed}
            onCancel={cancelProceed}
            isVisible={showWarning || !!validationError}
          />
        )}

        {/* Validating indicator */}
        {isValidating && (
          <div className="m365-info-banner m365-info-banner--loading">
            <LoadIndicator height={20} width={20} />
            <div className="m365-info-banner__content">
              <span className="m365-info-banner__text">Validating historical entry...</span>
            </div>
          </div>
        )}

      </div>

      {/* ── Action Buttons (sticky footer) ── */}
      <div className="m365-form-actions">
        <button
          className="m365-btn m365-btn--ghost"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          className="m365-btn m365-btn--primary"
          onClick={handleSubmit}
          disabled={saving || !formData.siteId || !formData.tankId || isValidating || !canSubmitForm}
        >
          {saving && <LoadIndicator width="16px" height="16px" visible={true} />}
          <i className="fa-light fa-check"></i>
          {saving ? 'Saving...' : 'Create Adjustment'}
        </button>
      </div>
    </div>
  );
};

export default StockAdjustmentForm;