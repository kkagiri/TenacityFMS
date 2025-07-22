import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, SimpleItem, Label } from 'devextreme-react/form';
import Button from 'devextreme-react/button';
import LoadIndicator from 'devextreme-react/load-indicator';
import  notify from 'devextreme/ui/notify';
import { createFuelRefill } from '../../../redux/actions/fuelRefillAction';
import { fetchVehicleList } from '../../../redux/actions/vehicleActions';
import { fetchEmployees } from '../../../redux/actions/employeeActions';
import { useFutureRecordsValidation } from '../../../hooks/useFutureRecordsValidation';
import FutureRecordsWarning from '../../../components/tank-stock/FutureRecordsWarning';

const ManualRefillForm = ({ onCancel, onSuccess }) => {
  const dispatch = useDispatch();
  const sites = useSelector((state) => state.site.sites);
  const tanks = useSelector((state) => state.tank.tanks);
  const vehicles = useSelector((state) => state.vehicle.vehicles);
  const employees = useSelector((state) => state.employee.employees);
  const user = useSelector((state) => state.auth.user);

  const [filteredTanks, setFilteredTanks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({
    vehicleId: null,
    manualFuelrefillAmount: null,
    previousMeterReading: null,
    currentMeterReading: null,
    date: new Date(),
    siteId: null,
    comment: '',
    driverId: null,
    fuelBy: user?.userName || '',
    tankId: null
  });

  // Track if data has been loaded to prevent multiple API calls
  const dataLoadedRef = useRef(false);

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

  // Load vehicles and employees on component mount if not already loaded
  useEffect(() => {
    const loadData = async () => {
      if (dataLoadedRef.current) return; // Prevent multiple loads

      try {
        // Only load if data is empty or not available
        if (!vehicles || vehicles.length === 0) {
          console.log('Loading vehicles...');
          await dispatch(fetchVehicleList());
        }

        if (!employees || employees.length === 0) {
          console.log('Loading employees...');
          await dispatch(fetchEmployees());
        }

        dataLoadedRef.current = true;
      } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error loading form data', 'error');
      }
    };

    loadData();
  }, [dispatch, showNotification, vehicles, employees]);

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
    const updatedData = {
      ...formData,
      [field]: e.value
    };
    setFormData(updatedData);

    // Clear validation errors for this field
    setValidationErrors(prev => ({ ...prev, [field]: null }));
  }, [formData]);

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

  // Handle form submission
  const handleSubmit = useCallback(async () => {
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

  return (
    <div className="manual-refill-form tw-max-w-4xl tw-mx-auto">
      <div className="tw-p-6">
          {/* Header */}
          <div className="tw-mb-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-2 tw-flex tw-items-center">
              <i className="fa-light fa-gas-pump tw-mr-2 tw-text-blue-600"></i>
              Manual Fuel Refill
            </h3>
            <p className="tw-text-gray-600 tw-text-sm tw-mb-3">
              Record manual fuel refill for vehicles.
            </p>

            {/* Information Panel */}
            <div className="tw-bg-blue-50 tw-border-l-4 tw-border-blue-400 tw-p-3 tw-mb-4">
              <div className="tw-flex">
                <div className="tw-flex-shrink-0">
                  <i className="fa-light fa-info-circle tw-text-blue-400"></i>
                </div>
                <div className="tw-ml-3">
                  <p className="tw-text-sm tw-text-blue-700">
                    <strong>Important:</strong> Opening stock must be done on the tank before inserting entry.
                  </p>
                  <p className="tw-text-sm tw-text-blue-700 tw-mt-1">
                    Back-dated entry will force Auto-Correlation on Tank current stock. (Limit is 30 days)
                  </p>
                </div>
              </div>
            </div>
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
              editorOptions={{
                value: formData.date,
                max: new Date(),
                displayFormat: "yyyy-MM-dd HH:mm",
                type: "datetime",
                onValueChanged: handleDateChange,
                width: "100%",
                isValid: !validationErrors.date,
                validationError: validationErrors.date ? { message: validationErrors.date } : null
              }}
            >
              <Label text="Date & Time" />
            </SimpleItem>

            <SimpleItem
              dataField="siteId"
              editorType="dxSelectBox"
              editorOptions={{
                items: sites || [],
                displayExpr: 'name',
                valueExpr: 'id',
                onValueChanged: handleSiteChange,
                value: formData.siteId,
                placeholder: "Select a site",
                width: "100%",
                isValid: !validationErrors.siteId,
                validationError: validationErrors.siteId ? { message: validationErrors.siteId } : null
              }}
            >
              <Label text="Site" />
            </SimpleItem>

            <SimpleItem
              dataField="tankId"
              editorType="dxSelectBox"
              editorOptions={{
                items: filteredTanks,
                displayExpr: 'name',
                valueExpr: 'id',
                onValueChanged: handleTankChange,
                value: formData.tankId,
                disabled: !formData.siteId,
                placeholder: "Select a tank",
                width: "100%",
                isValid: !validationErrors.tankId,
                validationError: validationErrors.tankId ? { message: validationErrors.tankId } : null
              }}
            >
              <Label text="Tank" />
            </SimpleItem>

            <SimpleItem
              dataField="vehicleId"
              editorType="dxSelectBox"
              editorOptions={{
                items: vehicles || [],
                displayExpr: 'vehicleName',
                valueExpr: 'id',
                onValueChanged: handleFieldChange('vehicleId'),
                value: formData.vehicleId,
                placeholder: "Select a vehicle",
                width: "100%",
                isValid: !validationErrors.vehicleId,
                validationError: validationErrors.vehicleId ? { message: validationErrors.vehicleId } : null
              }}
            >
              <Label text="Vehicle" />
            </SimpleItem>

            <SimpleItem
              dataField="driverId"
              editorType="dxSelectBox"
              editorOptions={{
                items: employees || [],
                displayExpr: 'fullName',
                valueExpr: 'id',
                onValueChanged: handleFieldChange('driverId'),
                value: formData.driverId,
                placeholder: "Select a driver",
                width: "100%",
                isValid: !validationErrors.driverId,
                validationError: validationErrors.driverId ? { message: validationErrors.driverId } : null
              }}
            >
              <Label text="Driver" />
            </SimpleItem>

            <SimpleItem
              dataField="manualFuelrefillAmount"
              editorType="dxNumberBox"
              editorOptions={{
                showSpinButtons: true,
                value: formData.manualFuelrefillAmount,
                onValueChanged: handleFieldChange('manualFuelrefillAmount'),
                placeholder: "Enter fuel amount",
                width: "100%",
                format: "#,##0.00",
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
                placeholder: "Previous reading",
                width: "100%",
                format: "#,##0"
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
                placeholder: "Current reading",
                width: "100%",
                format: "#,##0"
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
                placeholder: "Optional comments",
                width: "100%",
                height: 80
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
              text="Save"
              onClick={handleSubmit}
              disabled={isSubmitting || !canSubmitForm || isValidating}
              loading={isSubmitting}
              className="tw-min-w-32"
              type="default"
            >
              <i className="fa-light fa-save tw-mr-2"></i>
              Save
            </Button>
          </div>
        </div>
    </div>
  );
};

export default ManualRefillForm;
