import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, SimpleItem, Label } from 'devextreme-react/form';
import Button from 'devextreme-react/button';
import LoadIndicator from 'devextreme-react/load-indicator';
import  notify from 'devextreme/ui/notify';
import ScrollView from 'devextreme-react/scroll-view';
import { createFuelRefill } from '../../../redux/actions/fuelRefillAction';
// Switch to search-based selectors instead of bulk loading
import VehicleSearchableSelector from '../../../components/selectors/VehicleSearchableSelector';
import EmployeeSearchableSelector from '../../../components/selectors/EmployeeSearchableSelector';
import { useFutureRecordsValidation } from '../../../hooks/useFutureRecordsValidation';
import FutureRecordsWarning from '../../../components/tank-stock/FutureRecordsWarning';
import FixedHeightSelector from '../../../components/selectors/FixedHeightSelector';
import './ManualRefillForm.css';

const ManualRefillForm = ({ onCancel, onSuccess }) => {
  const dispatch = useDispatch();
  const sites = useSelector((state) => state.site.sites);
  const tanks = useSelector((state) => state.tank.tanks);
  // Remove bulk vehicle/employee lists; we'll search on demand
  const user = useSelector((state) => state.auth.user);

  const [filteredTanks, setFilteredTanks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showInfoNotice, setShowInfoNotice] = useState(true);
  const [formData, setFormData] = useState({
    vehicleId: null,
    manualFuelrefillAmount: null,
    previousMeterReading: null,
    currentMeterReading: null,
    date: new Date().toISOString(),
    siteId: null,
    comment: '',
    driverId: null,
    fuelBy: user?.userName || '',
    tankId: null
  });

  // Track if data has been loaded to prevent multiple API calls
  // No local data loading ref needed now that lists are searched on-demand

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
    resetValidation
  } = useFutureRecordsValidation();

  // Helper function for notifications
  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    notify({
      message,
      type,
      displayTime: duration,
      position: {
        my: 'top center',
        at: 'top center',
        of: window,
        offset: '0 20'
      }
    });
  }, []);

  // No bulk loading for vehicles/employees; selectors will fetch as user types

  const handleSiteChange = useCallback((e) => {
    const siteId = e.value;
    const updatedData = {
      ...formData,
      siteId: siteId,
      tankId: null
    };
    setFormData(updatedData);

    const tanksForSite = tanks.filter(tank => tank.siteId === siteId);
    setFilteredTanks(tanksForSite);

    // Clear validation errors for this field
    setValidationErrors(prev => ({ ...prev, siteId: null, tankId: null }));
  }, [tanks, formData]);

  const handleTankChange = useCallback(async (e) => {
    const tankId = e.value;
    const updatedData = {
      ...formData,
      tankId: tankId
    };
    setFormData(updatedData);

    // Clear validation errors for this field
    setValidationErrors(prev => ({ ...prev, tankId: null }));

    // Reset future records validation when tank changes
    resetValidation();

    // Validate if this is a historical entry and we have date selected
    if (tankId && formData.date) {
      try {
        await validateHistoricalEntry(tankId, formData.date);
      } catch (error) {
        showNotification(error.message, 'error');
      }
    }
  }, [formData, resetValidation, validateHistoricalEntry, showNotification]);

  const handleDateChange = useCallback(async (e) => {
    const newDate = e.value;
    const updatedData = {
      ...formData,
      date: newDate
    };
    setFormData(updatedData);

    // Clear validation errors for this field
    setValidationErrors(prev => ({ ...prev, date: null }));

    // Reset future records validation when date changes
    resetValidation();

    // Validate if this is a historical entry and we have tank selected
    if (newDate && formData.tankId) {
      try {
        await validateHistoricalEntry(formData.tankId, newDate);
      } catch (error) {
        showNotification(error.message, 'error');
      }
    }
  }, [formData, resetValidation, validateHistoricalEntry, showNotification]);

  const handleFieldChange = useCallback((field) => (e) => {
    setFormData(prevData => {
      const updatedData = {
        ...prevData,
        [field]: e.value
      };
      return updatedData;
    });

    // Clear validation errors for this field
    setValidationErrors(prev => ({ ...prev, [field]: null }));
  }, []); // Remove formData dependency

  // Validation logic
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.siteId) {
      errors.siteId = 'Site is required';
    }
    if (!formData.tankId) {
      errors.tankId = 'Tank is required';
    }
    if (!formData.vehicleId) {
      errors.vehicleId = 'Vehicle is required';
    }
    if (!formData.manualFuelrefillAmount || formData.manualFuelrefillAmount <= 0) {
      errors.manualFuelrefillAmount = 'Valid fuel amount is required';
    }
    if (!formData.date) {
      errors.date = 'Date is required';
    }
    if (!formData.driverId) {
      errors.driverId = 'Driver is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Clear form data for new entry (preserve site and tank selections)
  const clearFormData = useCallback(() => {
    setFormData(prevData => ({
      vehicleId: null,
      manualFuelrefillAmount: null,
      previousMeterReading: null,
      currentMeterReading: null,
      date: new Date().toISOString(),
      siteId: prevData.siteId, // Preserve site selection
      comment: '',
      driverId: null,
      fuelBy: user?.userName || '',
      tankId: prevData.tankId // Preserve tank selection
    }));
    // Don't clear filteredTanks since we're keeping the site/tank selection
    setValidationErrors({});
    resetValidation();
  }, [user?.userName, resetValidation]);

  // Handle form submission and close
  const handleSaveAndClose = useCallback(async () => {
    if (!validateForm()) {
      showNotification('Please correct the validation errors', 'error');
      return;
    }

    if (!canSubmitForm) {
      showNotification('Please resolve validation warnings before submitting', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(createFuelRefill(formData));
      showNotification('Manual refill recorded successfully', 'success');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating manual refill:', error);
      showNotification('Failed to record manual refill', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, canSubmitForm, dispatch, onSuccess, showNotification]);

  // Handle save and new entry
  const handleSaveAndNew = useCallback(async () => {
    if (!validateForm()) {
      showNotification('Please correct the validation errors', 'error');
      return;
    }

    if (!canSubmitForm) {
      showNotification('Please resolve validation warnings before submitting', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(createFuelRefill(formData));
      showNotification('Manual refill recorded successfully. Form cleared for new entry.', 'success');
      clearFormData();
    } catch (error) {
      console.error('Error creating manual refill:', error);
      showNotification('Failed to record manual refill', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, canSubmitForm, dispatch, showNotification, clearFormData]);

  return (
    <div className="manual-refill-form tw-h-full tw-flex tw-flex-col">
      <ScrollView className="tw-flex-1">
        <div className="tw-p-6 tw-max-w-4xl tw-mx-auto">
          {/* Header */}
          <div className="tw-mb-6">

            <p className="tw-text-gray-600 tw-text-sm tw-mb-3">
              Record manual fuel refill for vehicles.
            </p>

            {/* Information Panel */}
            {showInfoNotice && (
              <div className="tw-mb-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
                <div className="tw-flex tw-items-start">
                  <i className="fa-light fa-info-circle tw-text-blue-600 tw-mt-0.5 tw-mr-3"></i>
                  <div className="tw-flex-1">
                    <h4 className="tw-font-medium tw-text-blue-800 tw-mb-1">Manual Refill Information</h4>
                    <p className="tw-text-blue-700 tw-text-sm">
                      <strong>Important:</strong> Opening stock must be done on the tank before inserting entry.
                    </p>
                    <p className="tw-text-blue-700 tw-text-sm tw-mt-1">
                      Back-dated entry will force Auto-Correlation on Tank current stock. (Limit is 30 days)
                    </p>
                  </div>
                  <button
                    onClick={() => setShowInfoNotice(false)}
                    className="tw-ml-3 tw-text-blue-600 hover:tw-text-blue-800 tw-transition-colors"
                    title="Close information"
                  >
                    <i className="fa-light fa-times"></i>
                  </button>
                </div>
              </div>
            )}
          </div>

          <Form
            readOnly={isSubmitting}
            formData={formData}
            showColonAfterLabel={true}
            labelLocation="top"
            colCount={2}
            className="tw-mb-6"
          >
            <SimpleItem
              dataField="date"
              editorType="dxDateBox"
              cssClass="datebox-full-width"
              colSpan={2}
              editorOptions={{
                value: formData.date,
                max: new Date(),
                displayFormat: "yyyy-MM-dd HH:mm",
                type: "datetime",
                onValueChanged: handleDateChange,
                width: "100%",
                dropDownOptions: {
                  width: 'auto',
                  minWidth: 380,
                  maxWidth: 520,
                  wrapperAttr: { class: 'datebox-wide' },
                },
                elementAttr: { class: 'datebox-full-width-popup' },
                isValid: !validationErrors.date,
                validationError: validationErrors.date ? { message: validationErrors.date } : null
              }}
            >
              <Label text="Date & Time" />
            </SimpleItem>

            <SimpleItem
              dataField="siteId"
              render={() => (
                <div>
                  <Label text="Site" />
                  <FixedHeightSelector
                    items={sites || []}
                    displayExpr="name"
                    valueExpr="id"
                    value={formData.siteId}
                    onChange={handleSiteChange}
                    placeholder="Select a site"
                    isValid={!validationErrors.siteId}
                    validationError={validationErrors.siteId ? { message: validationErrors.siteId } : null}
                    maxHeight={250}
                    searchEnabled={true}
                  />
                </div>
              )}
            />

            <SimpleItem
              dataField="tankId"
              render={() => (
                <div>
                  <Label text="Tank" />
                  <FixedHeightSelector
                    items={filteredTanks}
                    displayExpr="name"
                    valueExpr="id"
                    value={formData.tankId}
                    onChange={handleTankChange}
                    placeholder="Select a tank"
                    disabled={!formData.siteId}
                    isValid={!validationErrors.tankId}
                    validationError={validationErrors.tankId ? { message: validationErrors.tankId } : null}
                    maxHeight={250}
                    searchEnabled={true}
                  />
                </div>
              )}
            />

            <SimpleItem
              dataField="vehicleId"
              render={() => (
                <div>
                  <Label text="Vehicle" />
                  <VehicleSearchableSelector
                    value={formData.vehicleId}
                    onValueChanged={(e) => handleFieldChange('vehicleId')(e)}
                    placeholder="Type to search vehicle"
                    width="100%"
                    isValid={!validationErrors.vehicleId}
                    validationError={validationErrors.vehicleId ? { message: validationErrors.vehicleId } : null}
                  />
                </div>
              )}
            />

            <SimpleItem
              dataField="driverId"
              render={() => (
                <div>
                  <Label text="Driver" />
                  <EmployeeSearchableSelector
                    value={formData.driverId}
                    onValueChanged={(e) => handleFieldChange('driverId')(e)}
                    placeholder="Type to search driver"
                    width="100%"
                    isValid={!validationErrors.driverId}
                    validationError={validationErrors.driverId ? { message: validationErrors.driverId } : null}
                    activeOnly={true}
                    siteId={formData.siteId}
                  />
                </div>
              )}
            />

            <SimpleItem
              dataField="manualFuelrefillAmount"
              editorType="dxNumberBox"
              editorOptions={{
                showSpinButtons: true,
                value: formData.manualFuelrefillAmount,
                onValueChanged: handleFieldChange('manualFuelrefillAmount'),
                width: "100%",
                showClearButton: false,
                ...(formData.manualFuelrefillAmount !== null && formData.manualFuelrefillAmount !== undefined && { format: "#,##0.00" }),
                isValid: !validationErrors.manualFuelrefillAmount,
                validationError: validationErrors.manualFuelrefillAmount ? { message: validationErrors.manualFuelrefillAmount } : null
              }}
            >
              <Label text="Fuel Amount (Liters)" />
            </SimpleItem>

            <SimpleItem
              dataField="previousMeterReading"
              editorType="dxNumberBox"
              editorOptions={{
                showSpinButtons: true,
                value: formData.previousMeterReading,
                onValueChanged: handleFieldChange('previousMeterReading'),
                width: "100%",
                showClearButton: false,
                ...(formData.previousMeterReading !== null && formData.previousMeterReading !== undefined && { format: "#,##0" })
              }}
            >
              <Label text="Previous Meter Reading" />
            </SimpleItem>

            <SimpleItem
              dataField="currentMeterReading"
              editorType="dxNumberBox"
              editorOptions={{
                showSpinButtons: true,
                value: formData.currentMeterReading,
                onValueChanged: handleFieldChange('currentMeterReading'),
                width: "100%",
                showClearButton: false,
                ...(formData.currentMeterReading !== null && formData.currentMeterReading !== undefined && { format: "#,##0" })
              }}
            >
              <Label text="Current Meter Reading" />
            </SimpleItem>

            <SimpleItem
              dataField="comment"
              editorType="dxTextArea"
              colSpan={2}
              editorOptions={{
                value: formData.comment,
                onValueChanged: handleFieldChange('comment'),
                width: "100%",
                height: 80,
                showClearButton: false
              }}
            >
              <Label text="Comments" />
            </SimpleItem>
          </Form>

          {/* Future Records Warning */}
          {(showWarning || validationError) && (
            <FutureRecordsWarning
              validationResult={validationResult}
              onConfirm={confirmProceed}
              onCancel={cancelProceed}
              isVisible={showWarning || !!validationError}
              className="tw-mb-4"
            />
          )}

          {/* Validating indicator */}
          {isValidating && (
            <div className="tw-mb-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3 tw-flex tw-items-center tw-space-x-3">
              <LoadIndicator height={20} width={20} />
              <span className="tw-text-blue-700 tw-text-sm">Validating historical entry...</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="tw-flex tw-justify-end tw-space-x-3 tw-mt-4 tw-pt-4 tw-border-t tw-border-gray-200">
            <Button
              text="Cancel"
              onClick={onCancel}
              disabled={isSubmitting}
              className="tw-min-w-24"
              stylingMode="outlined"
            >
              <i className="fa-light fa-times tw-mr-2"></i>
              Cancel
            </Button>
            <Button
              text="Save and New"
              onClick={handleSaveAndNew}
              disabled={isSubmitting || !canSubmitForm || isValidating}
              loading={isSubmitting}
              className="tw-min-w-32"
              stylingMode="outlined"
            >
              <i className="fa-light fa-plus tw-mr-2"></i>
              Save and New
            </Button>
            <Button
              text="Save and Close"
              onClick={handleSaveAndClose}
              disabled={isSubmitting || !canSubmitForm || isValidating}
              loading={isSubmitting}
              className="tw-min-w-32"
              type="default"
            >
              <i className="fa-light fa-save tw-mr-2"></i>
              Save and Close
            </Button>
          </div>
        </div>
      </ScrollView>
    </div>
  );
};

export default ManualRefillForm;
