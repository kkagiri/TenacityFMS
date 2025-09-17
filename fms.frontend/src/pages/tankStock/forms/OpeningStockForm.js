import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, SimpleItem, Label, GroupItem } from 'devextreme-react/form';
import { Button } from 'devextreme-react';
import { LoadPanel } from 'devextreme-react/load-panel';
import { fetchSitebyUserId } from '../../../redux/actions/siteActions';
import { fetchTanks } from '../../../redux/actions/tankActions';
import { createOpeningStock } from '../../../redux/actions/tankStockAction';
import LoadIndicator from 'devextreme-react/load-indicator';
import ScrollView from 'devextreme-react/scroll-view';
import notify from 'devextreme/ui/notify';
import FutureRecordsConfirmationPopup from '../../../components/tank-stock/FutureRecordsConfirmationPopup';
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
    const displayTime = type === 'error' ? Math.max(duration, 6000) : duration;
    notify({
      message,
      type,
      displayTime,
      position: { my: 'top center', at: 'top center', of: window, offset: '0 20' },
      animation: {
        show: { type: 'slide', duration: 300, from: { top: 0, opacity: 1 }, to: { top: -100, opacity: 0 } }
      }
    });
  }, []);

  // State declarations - moved before useEffect hooks
  const [filteredTanks, setFilteredTanks] = useState([]);
  const [loading] = useState(false);
  const [formData, setFormData] = useState({
    siteId: null,
    tankId: null,
    amount: null,           // Physical stock measurement
    bookBalance: null,      // Current book balance (read-only)
    physicalStockValue: null, // Current physical stock value (read-only)
    date: new Date()
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showInfoNotice, setShowInfoNotice] = useState(false); // Changed to false by default
  const [autoHideTimeout, setAutoHideTimeout] = useState(null);
  const [backendError, setBackendError] = useState(null);

  // Handle info panel display with auto-hide
  const handleInfoToggle = useCallback(() => {
    if (showInfoNotice) {
      // If already showing, hide it
      setShowInfoNotice(false);
      if (autoHideTimeout) {
        clearTimeout(autoHideTimeout);
        setAutoHideTimeout(null);
      }
    } else {
      // Show the panel
      setShowInfoNotice(true);

      // Clear any existing timeout
      if (autoHideTimeout) {
        clearTimeout(autoHideTimeout);
      }

      // Set up auto-hide after 3 seconds
      const timeout = setTimeout(() => {
        setShowInfoNotice(false);
        setAutoHideTimeout(null);
      }, 3000);

      setAutoHideTimeout(timeout);
    }
  }, [showInfoNotice, autoHideTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoHideTimeout) {
        clearTimeout(autoHideTimeout);
      }
    };
  }, [autoHideTimeout]);  useEffect(() => {
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

    // Get selected tank to retrieve book balance and physical stock value
    const selectedTank = tanksFromStore.find(tank => tank.id === tankId);
    const bookBalance = selectedTank ? selectedTank.currentStock : null;
    const physicalStockValue = selectedTank ? selectedTank.physicalStockValue : null;

    const updatedData = {
      ...formData,
      tankId: tankId,
      bookBalance: bookBalance,  // Set current book balance for comparison
      physicalStockValue: physicalStockValue  // Set current physical stock value for comparison
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
  }, [formData, resetValidation, validateHistoricalEntry, showNotification, tanksFromStore]);

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
  // Send ISO UTC to avoid server-side future-date rejections due to timezone
  dateTime: formData.date ? new Date(formData.date).toISOString() : null
      };

      const response = await dispatch(createOpeningStock(preparedData));

      console.log('Opening stock creation response:', response);

      // Check for success - be more explicit about what constitutes success
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
        // Handle both explicit failure and undefined success - including backend validation errors
        const errorMessage = response?.message || 'Failed to create opening stock';
        console.error('Opening stock creation failed:', errorMessage, response);

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
          {/* Header with Info Toggle */}
          <div className="tw-mb-6">
            <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
              <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-m-0">Opening Stock Entry</h2>
              <button
                onClick={handleInfoToggle}
                className="tw-text-blue-500 hover:tw-text-blue-700 tw-transition-colors tw-p-1 hover:tw-bg-blue-50 tw-rounded-full tw-border-0 tw-bg-transparent"
                title="Show information"
                type="button"
              >
                <i className="fa-light fa-question tw-text-sm"></i>
              </button>
            </div>

            <p className="tw-text-gray-600 tw-text-sm">
              Record the opening stock amount for the selected tank and date.
            </p>

            {/* Information Panel */}
            {showInfoNotice && (
              <div className="tw-mb-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-md tw-p-2 tw-transition-all tw-duration-300 tw-ease-in-out tw-mt-3">
                <div className="tw-flex tw-items-center">
                  <i className="fa-light fa-info-circle tw-text-blue-500 tw-mr-2 tw-text-sm"></i>
                  <div className="tw-text-blue-700 tw-text-xs">
                    <span className="tw-font-medium">Opening Stock:</span> Record tank fuel quantity at start of specified date.
                    <span className="tw-text-blue-600"> • Non-today entries affect tank current stock</span>
                  </div>
                </div>
              </div>
            )}
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
            <GroupItem colCount={1} colSpan={2}>
              <SimpleItem
                dataField="date"
                editorType="dxDateBox"
                cssClass="datebox-full-width"
                editorOptions={{
                  value: formData.date,
                  max: new Date(),
                  ...(formData.date && { displayFormat: "yyyy-MM-dd HH:mm" }),
                  type: "datetime",
                  onValueChanged: handleDateChange,
                  width: "100%",
                  className: "datebox-full-width",
                  // Ensure the dropdown/popup is wide enough and not constrained
                  dropDownOptions: {
                    width: 'auto',
                    minWidth: 380,
                    maxWidth: 520,
                    wrapperAttr: { class: 'datebox-wide' },
                  },
                  isValid: !validationErrors.date,
                  validationError: validationErrors.date ? { message: validationErrors.date } : null,
                  // Add date validation to prevent invalid date formatting
                  acceptCustomValue: false,
                  openOnFieldClick: true,
                  // Add custom CSS class for enhanced datetime picker styling
                  elementAttr: {
                    class: "datebox-full-width-popup"
                  }
                }}
              >
                <Label text="Date & Time" />
              </SimpleItem>
            </GroupItem>

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
                searchEnabled: true,
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

            {/* Book Balance Display (Read-only) */}
            {formData.bookBalance !== null && formData.bookBalance !== undefined && (
        <SimpleItem
                dataField="bookBalance"
                editorType="dxTextBox"
                editorOptions={{
          value: formData.bookBalance != null ? Number(formData.bookBalance).toLocaleString() + ' L' : '0 L',
                  readOnly: true,
                  width: "100%",
                  stylingMode: "filled"
                }}
              >
                <Label text="Current Book Balance (Calculated)" />
              </SimpleItem>
            )}

            {/* Physical Stock Value Display (Read-only) */}
            {formData.tankId && (
              <SimpleItem
                dataField="physicalStockValue"
                editorType="dxTextBox"
                editorOptions={{
                  value: formData.physicalStockValue != null ? Number(formData.physicalStockValue).toLocaleString() + ' L' : 'No physical reading available',
                  readOnly: true,
                  width: "100%",
                  stylingMode: "filled"
                }}
              >
                <Label text="Current Physical Stock Value (Last Recorded)" />
              </SimpleItem>
            )}

            <SimpleItem
              dataField="amount"
              editorType="dxNumberBox"
              editorOptions={{
                showSpinButtons: true,
                value: formData.amount || null,
                onValueChanged: handleAmountChange,
                placeholder: "Enter physical stock measurement",
                width: "100%",
                ...(formData.amount !== null && formData.amount !== undefined && { format: "#,##0" }),
                isValid: !validationErrors.amount,
                validationError: validationErrors.amount ? { message: validationErrors.amount } : null
              }}
            >
              <Label text="Physical Stock Amount (Liters)" />
            </SimpleItem>

            {/* Discrepancy Indicator */}
            {formData.amount != null && (formData.bookBalance != null || formData.physicalStockValue != null) && (
              <div className="discrepancy-indicator" style={{
                padding: '10px',
                marginTop: '10px',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  Stock Comparison:
                </div>
                <div>New Physical Stock: {Number(formData.amount).toLocaleString()} L</div>

                {formData.bookBalance != null && (
                  <>
                    <div>Current Book Balance: {Number(formData.bookBalance).toLocaleString()} L</div>
                    <div style={{
                      fontWeight: 'bold',
                      color: Math.abs(formData.amount - formData.bookBalance) > (formData.bookBalance * 0.05) ? '#f44336' : '#4caf50'
                    }}>
                      Book Balance Discrepancy: {Number(formData.amount - formData.bookBalance).toLocaleString()} L
                      ({formData.bookBalance > 0 ? (((formData.amount - formData.bookBalance) / formData.bookBalance) * 100).toFixed(2) : '100'}%)
                    </div>
                  </>
                )}

                {formData.physicalStockValue != null && (
                  <>
                    <div>Current Physical Stock: {Number(formData.physicalStockValue).toLocaleString()} L</div>
                    <div style={{
                      fontWeight: 'bold',
                      color: Math.abs(formData.amount - formData.physicalStockValue) > (formData.physicalStockValue * 0.05) ? '#ff9800' : '#4caf50'
                    }}>
                      Physical Stock Change: {Number(formData.amount - formData.physicalStockValue).toLocaleString()} L
                      ({formData.physicalStockValue > 0 ? (((formData.amount - formData.physicalStockValue) / formData.physicalStockValue) * 100).toFixed(2) : '100'}%)
                    </div>
                  </>
                )}
              </div>
            )}
          </Form>

          {/* Future Records Validation Loading Panel */}
          <LoadPanel
            visible={isValidating}
            message="Validating historical entry..."
            showIndicator={true}
            showPane={true}
            shading={true}
            position={{ my: 'center', at: 'center', of: window }}
            shadingColor="rgba(0, 0, 0, 0.4)"
            width={300}
            height={120}
          />

          {/* Future Records Confirmation Popup */}
          <FutureRecordsConfirmationPopup
            validationResult={validationResult}
            onConfirm={confirmProceed}
            onCancel={cancelProceed}
            isVisible={showWarning || !!validationError}
            isLoading={false}
          />

          {/* Backend Error Display with Enhanced Closing Stock Guidance */}
          {backendError && (
            <div className="tw-mb-4 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-3">
              <div className="tw-flex tw-items-start">
                <i className="fa-light fa-exclamation-triangle tw-text-red-600 tw-mt-0.5 tw-mr-3"></i>
                <div className="tw-flex-1">
                  <h4 className="tw-font-medium tw-text-red-800 tw-mb-1">Validation Error</h4>
                  <p className="tw-text-red-700 tw-text-sm tw-mb-3">
                    {backendError?.message || 'An error occurred'}
                  </p>

                  {/* Enhanced guidance for unclosed opening stock */}
                  {backendError?.message?.includes('opening stock already exists') &&
                   backendError?.message?.includes('without a subsequent closing stock') && (
                    <div className="tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-rounded tw-p-3 tw-mt-3">
                      <h5 className="tw-font-medium tw-text-yellow-800 tw-mb-2">
                        <i className="fa-light fa-lightbulb tw-mr-2"></i>
                        Solution Required
                      </h5>
                      <p className="tw-text-yellow-700 tw-text-sm tw-mb-3">
                        You need to create a closing stock for the same date as the existing opening stock before you can add a new opening stock.
                      </p>
                      <div className="tw-flex tw-flex-col tw-space-y-2">
                        <button
                          onClick={() => {
                            // Extract date from error message if possible
                            const dateMatch = backendError.message.match(/(\d{4}-\d{2}-\d{2})/);
                            const suggestedDate = dateMatch ? new Date(dateMatch[1]) : new Date();

                            // Use the SAME date as the opening stock, not the next day
                            // Closing stock must be on the same date as opening stock per backend validation

                            // Call the parent component to open closing stock form
                            if (onCancel) {
                              onCancel('create-closing-stock', {
                                tankId: formData.tankId,
                                siteId: formData.siteId,
                                suggestedDate: suggestedDate, // Same date as opening stock
                                reason: 'Required to close existing opening stock before creating new opening stock'
                              });
                            }
                          }}
                          className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-text-sm hover:tw-bg-blue-700 tw-transition-colors tw-flex tw-items-center tw-justify-center tw-space-x-2"
                          disabled={!formData.tankId}
                        >
                          <i className="fa-light fa-plus tw-mr-2"></i>
                          Create Required Closing Stock
                        </button>


                        <p className="tw-text-yellow-600 tw-text-xs">
                          This will open the closing stock form with the same tank and date as the existing opening stock.
                          After creating the closing stock, you can return to create your new opening stock.
                        </p>
                      </div>
                    </div>
                  )}
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
