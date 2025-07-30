import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, SimpleItem, Label } from 'devextreme-react/form';
import { Button } from 'devextreme-react';
import { fetchSitebyUserId } from '../../../redux/actions/siteActions';
import { fetchTanks } from '../../../redux/actions/tankActions';
import { createOpeningStock } from '../../../redux/actions/tankStockAction';
import LoadIndicator from 'devextreme-react/load-indicator';
import ScrollView from 'devextreme-react/scroll-view';
import notify from 'devextreme/ui/notify';
import FutureRecordsWarning from '../../../components/tank-stock/FutureRecordsWarning';
import { useFutureRecordsValidation } from '../../../hooks/useFutureRecordsValidation';
import TankStockErrorHandler from '../../../utils/tankStockErrorHandler';
import './OpeningStockForm.scss';

const OpeningStockForm = ({ updateFormData, isLoading, onSubmit, onCancel }) => {
  const dispatch = useDispatch();
  const tanksFromStore = useSelector((state) => state.tank.tanks);
  const sites = useSelector((state) => state.site.sites);

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

  // Helper function for notifications with consistent positioning
  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    // Use longer duration for errors to give user time to read
    const notificationDuration = type === 'error' ? Math.max(duration, 6000) : duration;

    notify({
      message,
      type,
      displayTime: notificationDuration,
      position: {
        my: 'top center',
        at: 'top center',
        of: window,
        offset: '0 20'
      },
      animation: {
        show: {
          type: 'slide',
          duration: 300,
          from: { top: -100, opacity: 0 },
          to: { top: 0, opacity: 1 }
        },
        hide: {
          type: 'slide',
          duration: 300,
          from: { top: 0, opacity: 1 },
          to: { top: -100, opacity: 0 }
        }
      }
    });
  }, []);

  const [filteredTanks, setFilteredTanks] = useState([]);
  const [loading] = useState(false);
  const [formData, setFormData] = useState({
    siteId: null,
    tankId: null,
    amount: null,
    date: new Date()
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showInfoNotice, setShowInfoNotice] = useState(true);
  const [backendError, setBackendError] = useState(null);

  useEffect(() => {
    if (!sites || sites.length === 0) {
      dispatch(fetchSitebyUserId());
    }
    dispatch(fetchTanks());
  }, [dispatch, sites]);

  // Notify parent component of form data changes
  useEffect(() => {
    if (updateFormData) {
      updateFormData(formData);
    }
  }, [formData, updateFormData]);

  const handleSiteChange = useCallback((e) => {
    const siteId = e.value;
    const updatedData = {
      ...formData,
      siteId: siteId,
      tankId: null
    };
    setFormData(updatedData);

    const tanksForSite = tanksFromStore.filter(tank => tank.siteId === siteId);
    setFilteredTanks(tanksForSite);

    // Clear validation errors and backend errors for this field
    setValidationErrors(prev => ({ ...prev, siteId: null, tankId: null }));
    setBackendError(null);
  }, [tanksFromStore, formData]);

  const handleTankChange = useCallback(async (e) => {
    const tankId = e.value;
    const updatedData = {
      ...formData,
      tankId: tankId
    };
    setFormData(updatedData);

    // Clear validation errors and backend errors for this field
    setValidationErrors(prev => ({ ...prev, tankId: null }));
    setBackendError(null);

    // Reset future records validation when tank changes
    resetValidation();

    // Validate if this is a historical entry and we have date selected
    if (tankId && formData.date) {
      const validation = await validateHistoricalEntry(tankId, formData.date, 'OpeningStock');

      if (validation.error) {
        showNotification(validation.error, 'error');
      }
    }
  }, [formData, resetValidation, validateHistoricalEntry, showNotification]);

  const handleDateChange = (e) => {
    // Ensure we have a valid date object or null
    const dateValue = e && e.value !== undefined ? e.value : e;
    setFormData(prev => ({ ...prev, date: dateValue }));
    // Clear validation errors and backend errors for this field
    setValidationErrors(prev => ({ ...prev, date: null }));
    setBackendError(null);
  };

    const handleAmountChange = (e) => {
    const value = e && e.value !== undefined ? e.value : e;
    setFormData(prev => ({ ...prev, amount: value }));
    // Clear validation errors and backend errors for this field
    setValidationErrors(prev => ({ ...prev, amount: null }));
    setBackendError(null);
  };

  // Validation logic
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.siteId) errors.siteId = 'Site is required';
    if (!formData.tankId) errors.tankId = 'Tank is required';
    if (!formData.amount || formData.amount <= 0) errors.amount = 'Valid opening stock amount is required';
    if (!formData.date) errors.date = 'Date is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    console.log('Starting form submission...');

    if (!validateForm()) {
      console.log('Form validation failed');
      showNotification('Please correct the errors in the form', 'error', 4000);
      return;
    }

    // Check if we can submit based on future records validation
    if (!canSubmitForm) {
      showNotification('Please resolve the validation warnings before submitting', 'warning', 4000);
      return;
    }

    console.log('Form data before submission:', formData);

    setIsSubmitting(true);
    try {
      // Prepare the data in the format expected by the action
      const preparedData = {
        tankId: formData.tankId,
        amount: formData.amount,
        dateTime: formData.date
      };

      const response = await dispatch(createOpeningStock(preparedData));

      console.log('Opening stock creation response:', response);

      // Check for success more thoroughly
      if (response && response.success === true) {
        showNotification(response.message || 'Opening stock created successfully', 'success', 3000);

        // Clear any previous backend errors on success
        setBackendError(null);

        // Only close form on successful creation
        if (onCancel) {
          onCancel();
        }
        if (onSubmit) {
          onSubmit(preparedData);
        }
      } else {
        // Handle both explicit failure and undefined success
        const errorMessage = response?.message || 'Failed to create opening stock';
        console.error('Opening stock creation failed:', errorMessage);

        // Set backend error for inline display instead of notification
        setBackendError({
          message: errorMessage,
          type: 'error'
        });

        // Form stays open so user can retry or make corrections
      }
    } catch (error) {
      console.error('Error creating opening stock:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';

      // Set backend error for inline display instead of notification
      setBackendError({
        message: errorMessage,
        type: 'error'
      });

      // Form stays open on error
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, canSubmitForm, dispatch, onSubmit, onCancel, showNotification]);

  return (
    <div className="opening-stock-form tw-h-full tw-flex tw-flex-col">
      <ScrollView className="tw-flex-1">
        <div className="tw-p-1">
          {/* Header */}
          <div className="tw-mb">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-1 tw-flex tw-items-center">
              <i className="fa-light fa-lock-open tw-mr-2 tw-text-blue-600"></i>
              Opening Stock Entry
            </h3>
            <p className="tw-text-gray-600 tw-text-sm">
              Record the opening stock amount for the selected tank and date.
            </p>
          </div>

          {loading && (
            <div className="tw-flex tw-justify-center tw-py-8">
              <LoadIndicator width={'48px'} height={'48px'} visible={true} />
            </div>
          )}

          <Form
            readOnly={isLoading}
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
                ...(formData.date && { displayFormat: "yyyy-MM-dd HH:mm" }),
                type: "datetime",
                onValueChanged: handleDateChange,
                width: "100%",
                isValid: !validationErrors.date,
                validationError: validationErrors.date ? { message: validationErrors.date } : null,
                // Add date validation to prevent invalid date formatting
                acceptCustomValue: false,
                openOnFieldClick: true
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
              dataField="amount"
              editorType="dxNumberBox"
              editorOptions={{
                showSpinButtons: true,
                value: formData.amount || null,
                onValueChanged: handleAmountChange,
                placeholder: "Enter value ",
                width: "100%",
                ...(formData.amount !== null && formData.amount !== undefined && { format: "#,##0" }),
                isValid: !validationErrors.amount,
                validationError: validationErrors.amount ? { message: validationErrors.amount } : null
              }}
            >
              <Label text="Amount (Liters)" />
            </SimpleItem>
          </Form>

          {/* Future Records Validation Warning */}
          {(showWarning || validationError) && (
            <FutureRecordsWarning
              validationResult={validationResult}
              onConfirm={confirmProceed}
              onCancel={cancelProceed}
              isVisible={showWarning || !!validationError}
              className="tw-mb-4"
            />
          )}

          {/* Backend Error Display */}
          {backendError && (
            <div className="tw-mb-4 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-3">
              <div className="tw-flex tw-items-start">
                <i className="fa-light fa-exclamation-triangle tw-text-red-600 tw-mt-0.5 tw-mr-3"></i>
                <div className="tw-flex-1">
                  <h4 className="tw-font-medium tw-text-red-800 tw-mb-1">Validation Error</h4>
                  <p className="tw-text-red-700 tw-text-sm">
                    {backendError?.message || 'An error occurred'}
                  </p>
                </div>
                <button
                  onClick={() => setBackendError(null)}
                  className="tw-ml-3 tw-text-red-600 hover:tw-text-red-800 tw-transition-colors"
                  title="Dismiss error"
                >
                  <i className="fa-light fa-times"></i>
                </button>
              </div>
            </div>
          )}

          {/* Loading indicator for validation */}
          {isValidating && (
            <div className="tw-mb-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3 tw-flex tw-items-center tw-space-x-3">
              <LoadIndicator height={20} width={20} />
              <span className="tw-text-blue-700 tw-text-sm">Validating historical entry...</span>
            </div>
          )}

          {/* Information Notice - Moved to bottom */}
          {showInfoNotice && (
            <div className="tw-mb-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
              <div className="tw-flex tw-items-start">
                <i className="fa-light fa-info-circle tw-text-blue-600 tw-mt-0.5 tw-mr-3"></i>
                <div className="tw-flex-1">
                  <h4 className="tw-font-medium tw-text-blue-800 tw-mb-1">Opening Stock Information</h4>
                  <p className="tw-text-blue-700 tw-text-sm">
                    Opening stock that is not today's will affect the tank current stock.
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

          {/* Form Actions */}
          <div className="tw-flex tw-justify-end tw-space-x-3 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">

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
      </ScrollView>
    </div>
  );
};

export default OpeningStockForm;
