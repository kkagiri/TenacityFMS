import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, SimpleItem, Label } from 'devextreme-react/form';
import Button from 'devextreme-react/button';
import { LoadPanel } from 'devextreme-react/load-panel';
import  notify from 'devextreme/ui/notify';
import ScrollView from 'devextreme-react/scroll-view';
import { createFuelRefill } from '../../../redux/actions/fuelRefillAction';
// Switch to search-based selectors instead of bulk loading
import VehicleSearchableSelector from '../../../components/selectors/VehicleSearchableSelector';
import EmployeeSearchableSelector from '../../../components/selectors/EmployeeSearchableSelector';
import { useFutureRecordsValidation } from '../../../hooks/useFutureRecordsValidation';
import FutureRecordsConfirmationPopup from '../../../components/tank-stock/FutureRecordsConfirmationPopup';
import './ManualRefillForm.css';

const ManualRefillForm = ({ onCancel, onSuccess }) => {
  const dispatch = useDispatch();
  const sites = useSelector((state) => state.site.sites);
  const tanks = useSelector((state) => state.tank.tanks);
  // Remove bulk vehicle/employee lists; we'll search on demand
  const user = useSelector((state) => state.auth.user);

  // Memoize sites and tanks to prevent unnecessary re-renders from SignalR updates
  const memoizedSites = useMemo(() => sites || [], [sites]);
  const memoizedTanks = useMemo(() => tanks || [], [tanks]);

  // Scroll position preservation
  const scrollViewRef = useRef(null);
  const lastScrollPositionRef = useRef(0);
  const preserveScrollTimeoutRef = useRef(null);

  const [filteredTanks, setFilteredTanks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showInfoNotice, setShowInfoNotice] = useState(false); // Changed to false by default
  const [autoHideTimeout, setAutoHideTimeout] = useState(null);
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
  }, [autoHideTimeout]);

  // Scroll position preservation functions
  const preserveScrollPosition = useCallback(() => {
    if (scrollViewRef.current) {
      const scrollView = scrollViewRef.current.instance;
      if (scrollView) {
        lastScrollPositionRef.current = scrollView.scrollTop();
      }
    }
  }, []);

  const restoreScrollPosition = useCallback(() => {
    if (preserveScrollTimeoutRef.current) {
      clearTimeout(preserveScrollTimeoutRef.current);
    }

    preserveScrollTimeoutRef.current = setTimeout(() => {
      if (scrollViewRef.current && lastScrollPositionRef.current > 0) {
        const scrollView = scrollViewRef.current.instance;
        if (scrollView) {
          scrollView.scrollTo(lastScrollPositionRef.current);
        }
      }
    }, 50); // Small delay to ensure DOM is updated
  }, []);

  // Save scroll position before potential re-renders
  useEffect(() => {
    const interval = setInterval(preserveScrollPosition, 1000); // Reduce frequency
    return () => {
      clearInterval(interval);
      if (preserveScrollTimeoutRef.current) {
        clearTimeout(preserveScrollTimeoutRef.current);
      }
    };
  }, [preserveScrollPosition]);

  // Remove the automatic scroll restoration on sites/tanks update to reduce flickering
  // The scroll position will be preserved through the interval and manual calls

  // No bulk loading for vehicles/employees; selectors will fetch as user types

  const handleSiteChange = useCallback((e) => {
    // Preserve scroll position before state change
    preserveScrollPosition();

    const siteId = e.value;
    const updatedData = {
      ...formData,
      siteId: siteId,
      tankId: null
    };
    setFormData(updatedData);

    const tanksForSite = memoizedTanks.filter(tank => tank.siteId === siteId);
    setFilteredTanks(tanksForSite);

    // Clear validation errors for this field
    setValidationErrors(prev => ({ ...prev, siteId: null, tankId: null }));

    // Restore scroll position after state change
    restoreScrollPosition();
  }, [memoizedTanks, formData, preserveScrollPosition, restoreScrollPosition]);

  const handleTankChange = useCallback(async (e) => {
    // Preserve scroll position before state change
    preserveScrollPosition();

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
        await validateHistoricalEntry(tankId, formData.date, 'Dispensing');
      } catch (error) {
        showNotification(error.message, 'error');
      }
    }

    // Restore scroll position after validation
    restoreScrollPosition();
  }, [formData, resetValidation, validateHistoricalEntry, showNotification, preserveScrollPosition, restoreScrollPosition]);

  const handleDateChange = useCallback(async (e) => {
    // Preserve scroll position before state change
    preserveScrollPosition();

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
        await validateHistoricalEntry(formData.tankId, newDate, 'Dispensing');
      } catch (error) {
        showNotification(error.message, 'error');
      }
    }

    // Restore scroll position after validation
    restoreScrollPosition();
  }, [formData, resetValidation, validateHistoricalEntry, showNotification, preserveScrollPosition, restoreScrollPosition]);

  const handleFieldChange = useCallback((field) => (e) => {
    // Preserve scroll position before state change
    preserveScrollPosition();

    setFormData(prevData => {
      const updatedData = {
        ...prevData,
        [field]: e.value
      };
      return updatedData;
    });

    // Clear validation errors for this field
    setValidationErrors(prev => ({ ...prev, [field]: null }));

    // Restore scroll position after state change
    restoreScrollPosition();
  }, [preserveScrollPosition, restoreScrollPosition]);

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
      const result = await dispatch(createFuelRefill(formData));

      if (result && result.success) {
        showNotification('Manual refill recorded successfully', 'success');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const errorMessage = result?.message || 'Failed to record manual refill';
        showNotification(errorMessage, 'error');
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
      const result = await dispatch(createFuelRefill(formData));

      if (result && result.success) {
        showNotification('Manual refill recorded successfully. Form cleared for new entry.', 'success');
        clearFormData();
      } else {
        const errorMessage = result?.message || 'Failed to record manual refill';
        showNotification(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error creating manual refill:', error);
      showNotification('Failed to record manual refill', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, canSubmitForm, dispatch, showNotification, clearFormData]);

  return (
    <div className="manual-refill-form tw-h-full tw-flex tw-flex-col">
      <ScrollView
        key="manual-refill-scroll"
        ref={scrollViewRef}
        className="tw-flex-1"
        onScroll={preserveScrollPosition}
        showScrollbar="onHover"
        scrollByContent={true}
        scrollByThumb={true}
        direction="vertical"
      >
        <div className="tw-p-6 tw-max-w-4xl tw-mx-auto">
          {/* Header with Info Toggle */}
          <div className="tw-mb-6">
            <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
              <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-m-0">Manual Refill Entry</h2>
              <button
                onClick={handleInfoToggle}
                className="tw-text-blue-500 hover:tw-text-blue-700 tw-transition-colors tw-p-1 hover:tw-bg-blue-50 tw-rounded-full tw-border-0 tw-bg-transparent"
                title="Show information"
                type="button"
              >
                <i className="fa-light fa-question tw-text-sm"></i>
              </button>
            </div>

            <p className="tw-text-gray-600 tw-text-sm tw-mb-3">
              Record manual fuel refill for vehicles.
            </p>

            {/* Information Panel */}
            {showInfoNotice && (
              <div className="tw-mb-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-md tw-p-2 tw-transition-all tw-duration-300 tw-ease-in-out">
                <div className="tw-flex tw-items-center">
                  <i className="fa-light fa-info-circle tw-text-blue-500 tw-mr-2 tw-text-sm"></i>
                  <div className="tw-text-blue-700 tw-text-xs">
                    <span className="tw-font-medium">Important:</span> Opening stock must be done before entry.
                    <span className="tw-text-blue-600"> • Back-dated entries auto-correlate tank stock (30 day limit)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Form
            key="manual-refill-form" // Prevent unnecessary re-renders
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
              colSpan={2}
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
                items: memoizedSites || [],
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
                items: filteredTanks || [],
                displayExpr: 'name',
                valueExpr: 'id',
                onValueChanged: handleTankChange,
                value: formData.tankId,
                placeholder: "Select a tank",
                disabled: !formData.siteId,
                width: "100%",
                searchEnabled: true,
                isValid: !validationErrors.tankId,
                validationError: validationErrors.tankId ? { message: validationErrors.tankId } : null
              }}
            >
              <Label text="Tank" />
            </SimpleItem>

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

export default React.memo(ManualRefillForm);
