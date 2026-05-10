/**
 * File: ManualRefillForm.js
 * Purpose: Record manual fuel refills while leveraging shared site/tank datasets and on-demand lookups for related entities.
 * Dependencies: React, Redux Toolkit, DevExtreme components, siteActions, tankActions, fuelRefillAction
 * Last Modified: 2025-11-27
 *
 * Key Functions/Components:
 * - ManualRefillForm: Main component handling manual refill submission and validation workflows
 * - handleSiteChange: Filters tanks based on selected site with API fallback when cache misses occur
 * - handleSaveAndClose/handleSaveAndNew: Persist data and coordinate UI feedback
 * - useTankStockFormData: Shared context for persisting date and site across forms
 */
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DateBox } from "devextreme-react/date-box";
import { NumberBox } from "devextreme-react/number-box";
import { TextArea } from "devextreme-react/text-area";
import LoadIndicator from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import {
  fetchTanks,
  fetctTankbySiteId,
} from "../../../redux/actions/tankActions";
import { createFuelRefill } from "../../../redux/actions/fuelRefillAction";
// Switch to search-based selectors instead of bulk loading
import VehicleSearchableSelector from "../../../components/selectors/VehicleSearchableSelector";
import EmployeeSearchableSelector from "../../../components/selectors/EmployeeSearchableSelector";
import { useFutureRecordsValidation } from "../../../hooks/useFutureRecordsValidation";
import FutureRecordsWarning from "../../../components/tank-stock/FutureRecordsWarning";
import FixedHeightSelector from "../../../components/selectors/FixedHeightSelector";
import { VolumeChangeReasons } from "../../../services/tankStockFutureRecordsService";
import { useTankStockFormData } from "../shared/context/TankStockFormContext";
import "./_m365-form-common.scss";

const ManualRefillForm = ({
  onCancel,
  onSuccess,
  sites: sitesProp = [],
  tanks: tanksProp = [],
  isLoading = false,
  updateFormData,
  user: userProp,
}) => {
  const dispatch = useDispatch();
  const sitesState = useSelector((state) => state.site.sites || []);
  const tanksState = useSelector((state) => state.tank.tanks || []);
  const userState = useSelector((state) => state.auth.user);
  // Remove bulk vehicle/employee lists; we'll search on demand
  const usingPropSites = Array.isArray(sitesProp) && sitesProp.length > 0;
  const usingPropTanks = Array.isArray(tanksProp) && tanksProp.length > 0;
  const sitesAvailable = usingPropSites ? sitesProp : sitesState;
  const tanksAvailable = usingPropTanks ? tanksProp : tanksState;
  const currentUser = userProp || userState;
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const combinedLoading = isLoading || loading;

  // ✅ Get shared form data from context
  const {
    date: sharedDate,
    siteId: sharedSiteId,
    updateDate,
    updateSiteId,
  } = useTankStockFormData();

  const [filteredTanks, setFilteredTanks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [showInfoNotice, setShowInfoNotice] = useState(true);
  const [showHistoricalNotice, setShowHistoricalNotice] = useState(true);
  const [backendError, setBackendError] = useState(null);

  // ✅ REF to guard against double submissions (refs update synchronously unlike state)
  const isSubmittingRef = useRef(false);
  const [formData, setFormData] = useState({
    vehicleId: null,
    manualFuelrefillAmount: null,
    previousMeterReading: null,
    currentMeterReading: null,
    date: sharedDate
      ? typeof sharedDate === "string"
        ? sharedDate
        : sharedDate.toISOString()
      : new Date().toISOString(), // Initialize from shared context, handle both string and Date
    siteId: sharedSiteId, // Initialize from shared context
    comment: "",
    driverId: null,
    fuelBy: currentUser?.userName || "",
    tankId: null,
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
    resetValidation,
  } = useFutureRecordsValidation();

  // Helper function for notifications
  const showNotification = useCallback(
    (message, type = "info", duration = 3000) => {
      notify({
        message,
        type,
        displayTime: duration,
        position: {
          my: "top center",
          at: "top center",
          of: window,
          offset: "0 20",
        },
      });
    },
    []
  );

  // Load initial data (sites and tanks)
  useEffect(() => {
    const sitesReady = sitesAvailable.length > 0;
    const tanksReady = tanksAvailable.length > 0;

    if (sitesReady && tanksReady) {
      if (!dataLoaded) {
        setDataLoaded(true);
      }
      return;
    }

    const fetchData = async () => {
      try {
        if (!sitesReady && !usingPropSites) {
          await dispatch(fetchSiteList());
        }
        if (!tanksReady && !usingPropTanks) {
          await dispatch(fetchTanks());
        }
        setDataLoaded(true);
      } catch (error) {
        console.error("ManualRefillForm - Error loading data:", error);
        showNotification("Error loading form data", "error");
      }
    };

    fetchData();
  }, [
    dispatch,
    showNotification,
    sitesAvailable.length,
    tanksAvailable.length,
    dataLoaded,
    usingPropSites,
    usingPropTanks,
  ]);

  // No bulk loading for vehicles/employees; selectors will fetch as user types

  const handleSiteChange = useCallback(
    async (e) => {
      const siteId = e.value;

      setFormData((prev) => ({
        ...prev,
        siteId: siteId,
        tankId: null,
      }));
      setBackendError(null);

      // ✅ Update shared context when site changes
      updateSiteId(siteId);

      setValidationErrors((prev) => ({ ...prev, siteId: null, tankId: null }));

      if (!siteId) {
        setFilteredTanks([]);
        return;
      }

      let tanksForSite = tanksAvailable.filter(
        (tank) => tank.siteId === siteId
      );

      if (tanksForSite.length === 0 && !usingPropTanks) {
        setLoading(true);
        try {
          const result = await dispatch(fetctTankbySiteId(siteId));
          if (result?.success && Array.isArray(result.data)) {
            tanksForSite = result.data;
          }
        } catch (error) {
          console.error(
            "ManualRefillForm - Failed to load tanks for site:",
            error
          );
          showNotification(
            "Unable to load tanks for the selected site. Please try again.",
            "error"
          );
        } finally {
          setLoading(false);
        }
      }

      setFilteredTanks(tanksForSite);
    },
    [dispatch, showNotification, tanksAvailable, usingPropTanks, updateSiteId]
  );

  useEffect(() => {
    if (!formData.siteId) {
      setFilteredTanks([]);
      return;
    }

    const tanksForSite = tanksAvailable.filter(
      (tank) => tank.siteId === formData.siteId
    );

    if (tanksForSite.length > 0) {
      setFilteredTanks(tanksForSite);
    }
  }, [formData.siteId, tanksAvailable]);

  const handleTankChange = useCallback(
    async (e) => {
      const tankId = e.value;
      const updatedData = {
        ...formData,
        tankId: tankId,
      };
      setFormData(updatedData);
      setBackendError(null);

      // Clear validation errors for this field
      setValidationErrors((prev) => ({ ...prev, tankId: null }));

      // Reset future records validation when tank changes
      resetValidation();

      // Validate if this is a historical entry and we have date selected
      if (tankId && formData.date) {
        try {
          await validateHistoricalEntry(
            tankId,
            formData.date,
            VolumeChangeReasons.DISPENSING
          );
        } catch (error) {
          showNotification(error.message, "error");
        }
      }
    },
    [formData, resetValidation, validateHistoricalEntry, showNotification]
  );

  const handleDateChange = useCallback(
    async (e) => {
      const newDate = e.value;
      const updatedData = {
        ...formData,
        date: newDate,
      };
      setFormData(updatedData);
      setBackendError(null);

      // ✅ Update shared context when date changes
      updateDate(newDate);

      // Clear validation errors for this field
      setValidationErrors((prev) => ({ ...prev, date: null }));

      // Reset future records validation when date changes
      resetValidation();

      // Validate if this is a historical entry and we have tank selected
      if (newDate && formData.tankId) {
        try {
          await validateHistoricalEntry(
            formData.tankId,
            newDate,
            VolumeChangeReasons.DISPENSING
          );
        } catch (error) {
          showNotification(error.message, "error");
        }
      }
    },
    [
      formData,
      resetValidation,
      validateHistoricalEntry,
      showNotification,
      updateDate,
    ]
  );

  useEffect(() => {
    if (typeof updateFormData === "function") {
      updateFormData(formData);
    }
  }, [formData, updateFormData]);

  const handleFieldChange = useCallback(
    (field) => (e) => {
      setFormData((prevData) => {
        const updatedData = {
          ...prevData,
          [field]: e.value,
        };
        return updatedData;
      });
      setBackendError(null);

      // Clear validation errors for this field
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
    },
    []
  ); // Remove formData dependency

  // Maximum allowed difference between current and previous meter readings
  const MAX_METER_READING_DIFFERENCE = 1500;

  // Validation logic
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.siteId) {
      errors.siteId = "Site is required";
    }
    if (!formData.tankId) {
      errors.tankId = "Tank is required";
    }
    if (!formData.vehicleId) {
      errors.vehicleId = "Vehicle is required";
    }
    if (
      !formData.manualFuelrefillAmount ||
      formData.manualFuelrefillAmount <= 0
    ) {
      errors.manualFuelrefillAmount = "Valid fuel amount is required";
    }
    if (!formData.date) {
      errors.date = "Date is required";
    }
    if (!formData.driverId) {
      errors.driverId = "Driver is required";
    }

    // Validate meter reading difference
    if (
      formData.currentMeterReading !== null &&
      formData.previousMeterReading !== null
    ) {
      const currentReading = parseFloat(formData.currentMeterReading) || 0;
      const previousReading = parseFloat(formData.previousMeterReading) || 0;
      const difference = Math.abs(currentReading - previousReading);

      if (difference > MAX_METER_READING_DIFFERENCE) {
        errors.meterReadingDifference = `The difference between current and previous meter readings cannot exceed ${MAX_METER_READING_DIFFERENCE}. Current difference: ${difference.toFixed(
          2
        )}`;
      }

      // Also validate that current reading should be greater than or equal to previous reading
      if (currentReading < previousReading) {
        errors.currentMeterReading =
          "Current meter reading cannot be less than previous meter reading";
      }
    }

    return errors;
  }, [formData]);

  // Clear form data for new entry (preserve site, tank, and date selections)
  const clearFormData = useCallback(() => {
    setFormData((prevData) => ({
      vehicleId: null, // Clear vehicle
      manualFuelrefillAmount: null,
      previousMeterReading: null,
      currentMeterReading: null,
      date: prevData.date, // Preserve date from previous submission
      siteId: prevData.siteId, // Preserve site selection
      comment: "",
      driverId: null, // Clear driver
      fuelBy: currentUser?.userName || "",
      tankId: prevData.tankId, // Preserve tank selection
    }));
    // Don't clear filteredTanks since we're keeping the site/tank selection
    setValidationErrors({});
    resetValidation();
  }, [currentUser?.userName, resetValidation]);

  // Handle form submission and close
  const handleSaveAndClose = useCallback(async () => {
    // ✅ GUARD: Prevent double submission using ref (synchronous check)
    if (isSubmittingRef.current) {
      console.warn("ManualRefillForm: Submission already in progress, ignoring duplicate click");
      return;
    }

    setHasAttemptedSubmit(true);
    setBackendError(null);
    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      showNotification("Please fill in all required fields correctly", "error");
      return;
    }

    if (!canSubmitForm) {
      showNotification(
        "Please resolve validation warnings before submitting",
        "warning"
      );
      return;
    }

    // ✅ Set ref immediately (synchronous) to prevent race conditions
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const result = await dispatch(createFuelRefill(formData));

      // Check if the operation was successful
      if (result && result.success) {
        showNotification(
          result.message || "Manual refill recorded successfully",
          "success"
        );
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Handle failure case
        const errorMessage =
          result?.message || "Failed to record manual refill";
        setBackendError({ message: errorMessage });
        showNotification(errorMessage, "error");
      }
    } catch (error) {
      console.error("Error creating manual refill:", error);
      setBackendError({
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to record manual refill",
      });
      showNotification("Failed to record manual refill", "error");
    } finally {
      // ✅ Reset both ref and state
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [
    formData,
    validateForm,
    canSubmitForm,
    dispatch,
    onSuccess,
    showNotification,
  ]);

  // Handle save and new entry
  const handleSaveAndNew = useCallback(async () => {
    // ✅ GUARD: Prevent double submission using ref (synchronous check)
    if (isSubmittingRef.current) {
      console.warn("ManualRefillForm: Submission already in progress, ignoring duplicate click");
      return;
    }

    setHasAttemptedSubmit(true);
    setBackendError(null);
    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      showNotification("Please fill in all required fields correctly", "error");
      return;
    }

    if (!canSubmitForm) {
      showNotification(
        "Please resolve validation warnings before submitting",
        "warning"
      );
      return;
    }

    // ✅ Set ref immediately (synchronous) to prevent race conditions
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const result = await dispatch(createFuelRefill(formData));

      // Check if the operation was successful
      if (result && result.success) {
        showNotification(
          result.message ||
          "Manual refill recorded successfully. Form cleared for new entry.",
          "success"
        );
        clearFormData();
        setHasAttemptedSubmit(false); // Reset for new entry
      } else {
        // Handle failure case - don't clear form, let user fix the issue
        const errorMessage =
          result?.message || "Failed to record manual refill";
        setBackendError({ message: errorMessage });
        showNotification(errorMessage, "error");
      }
    } catch (error) {
      console.error("Error creating manual refill:", error);
      setBackendError({
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to record manual refill",
      });
      showNotification("Failed to record manual refill", "error");
    } finally {
      // ✅ Reset both ref and state
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [
    formData,
    validateForm,
    canSubmitForm,
    dispatch,
    showNotification,
    clearFormData,
  ]);

  return (
    <div className="m365-form-body">
      <div className="m365-form-body__scroll">
        {/* Description */}
        <p className="m365-field__hint" style={{ margin: '0 0 12px', fontSize: '13px' }}>
          Record manual fuel refill for vehicles.
        </p>

        {/* Information Banner */}
        {showInfoNotice && (
          <div className="m365-info-banner" style={{ margin: '0 0 16px' }}>
            <i className="fa-light fa-circle-info m365-info-banner__icon" />
            <div className="m365-info-banner__content">
              <span className="m365-info-banner__text">
                <strong>Important:</strong> Opening stock must be done on the tank before inserting entry.
              </span>
              <span className="m365-info-banner__text" style={{ display: 'block', marginTop: '4px' }}>
                Back-dated entry will force Auto-Correlation on Tank current stock. (Limit is 30 days)
              </span>
            </div>
            <button
              type="button"
              className="m365-info-banner__dismiss"
              onClick={() => setShowInfoNotice(false)}
              title="Dismiss"
            >
              <i className="fa-light fa-xmark" />
            </button>
          </div>
        )}

        {/* Date & Time — full width */}
        <div className="m365-field m365-field--full">
          <label className="m365-field__label">Date &amp; Time</label>
          <DateBox
            value={formData.date}
            max={new Date()}
            displayFormat="yyyy-MM-dd HH:mm"
            type="datetime"
            onValueChanged={handleDateChange}
            width="100%"
            readOnly={isSubmitting || combinedLoading}
            dropDownOptions={{
              width: "auto",
              minWidth: 380,
              maxWidth: 520,
              wrapperAttr: { class: "datebox-wide" },
            }}
            elementAttr={{ class: "datebox-full-width-popup" }}
            isValid={hasAttemptedSubmit ? !validationErrors.date : true}
          />
          {hasAttemptedSubmit && validationErrors.date && (
            <span className="m365-field__error">{validationErrors.date}</span>
          )}
        </div>

        {/* Site & Tank — 2 column row */}
        <div className="m365-field-row">
          <div className="m365-field">
            <label className="m365-field__label">Site</label>
            <FixedHeightSelector
              items={sitesAvailable}
              displayExpr="name"
              valueExpr="id"
              value={formData.siteId}
              onChange={handleSiteChange}
              placeholder={
                !dataLoaded && sitesAvailable.length === 0
                  ? "Loading sites..."
                  : sitesAvailable.length > 0
                    ? "Select a site"
                    : "No sites available"
              }
              isValid={hasAttemptedSubmit ? !validationErrors.siteId : true}
              maxHeight={250}
              searchEnabled={true}
              dropDownOptions={{ container: "body" }}
            />
            {hasAttemptedSubmit && validationErrors.siteId && (
              <span className="m365-field__error">{validationErrors.siteId}</span>
            )}
          </div>
          <div className="m365-field">
            <label className="m365-field__label">Tank</label>
            <FixedHeightSelector
              items={filteredTanks}
              displayExpr="name"
              valueExpr="id"
              value={formData.tankId}
              onChange={handleTankChange}
              placeholder={
                !formData.siteId
                  ? "Select site first"
                  : combinedLoading && filteredTanks.length === 0
                    ? "Loading tanks..."
                    : filteredTanks.length === 0
                      ? "No tanks available"
                      : "Select a tank"
              }
              disabled={!formData.siteId || combinedLoading}
              isValid={hasAttemptedSubmit ? !validationErrors.tankId : true}
              maxHeight={250}
              searchEnabled={true}
              dropDownOptions={{
                container: "body",
                position: { my: "top", at: "bottom", collision: "flip" },
              }}
            />
            {hasAttemptedSubmit && validationErrors.tankId && (
              <span className="m365-field__error">{validationErrors.tankId}</span>
            )}
          </div>
        </div>

        {/* Vehicle & Driver — 2 column row */}
        <div className="m365-field-row">
          <div className="m365-field">
            <label className="m365-field__label">Vehicle</label>
            <VehicleSearchableSelector
              value={formData.vehicleId}
              onValueChanged={(e) => handleFieldChange("vehicleId")(e)}
              placeholder="Type to search vehicle"
              width="100%"
              isValid={hasAttemptedSubmit ? !validationErrors.vehicleId : true}
            />
            {hasAttemptedSubmit && validationErrors.vehicleId && (
              <span className="m365-field__error">{validationErrors.vehicleId}</span>
            )}
          </div>
          <div className="m365-field">
            <label className="m365-field__label">Driver</label>
            <EmployeeSearchableSelector
              value={formData.driverId}
              onValueChanged={(e) => handleFieldChange("driverId")(e)}
              placeholder="Type to search driver"
              width="100%"
              isValid={hasAttemptedSubmit ? !validationErrors.driverId : true}
              activeOnly={true}
              siteId={formData.siteId}
            />
            {hasAttemptedSubmit && validationErrors.driverId && (
              <span className="m365-field__error">{validationErrors.driverId}</span>
            )}
          </div>
        </div>

        {/* Current Meter Reading & Previous Meter Reading — 2 column row */}
        <div className="m365-field-row">
          <div className="m365-field">
            <label className="m365-field__label">Current Meter Reading</label>
            <NumberBox
              showSpinButtons={true}
              value={formData.currentMeterReading}
              onValueChanged={handleFieldChange("currentMeterReading")}
              width="100%"
              showClearButton={false}
              readOnly={isSubmitting || combinedLoading}
              {...(formData.currentMeterReading !== null &&
                formData.currentMeterReading !== undefined && {
                format: "#,##0.00",
              })}
              isValid={
                hasAttemptedSubmit
                  ? !validationErrors.currentMeterReading &&
                  !validationErrors.meterReadingDifference
                  : true
              }
            />
            {hasAttemptedSubmit && validationErrors.currentMeterReading && (
              <span className="m365-field__error">{validationErrors.currentMeterReading}</span>
            )}
          </div>
          <div className="m365-field">
            <label className="m365-field__label">Previous Meter Reading</label>
            <NumberBox
              showSpinButtons={true}
              value={formData.previousMeterReading}
              onValueChanged={handleFieldChange("previousMeterReading")}
              width="100%"
              showClearButton={false}
              readOnly={isSubmitting || combinedLoading}
              {...(formData.previousMeterReading !== null &&
                formData.previousMeterReading !== undefined && {
                format: "#,##0.00",
              })}
              isValid={hasAttemptedSubmit ? !validationErrors.meterReadingDifference : true}
            />
            {hasAttemptedSubmit && validationErrors.meterReadingDifference && (
              <span className="m365-field__error">{validationErrors.meterReadingDifference}</span>
            )}
          </div>
        </div>

        {/* Fuel Amount — full width */}
        <div className="m365-field m365-field--full">
          <label className="m365-field__label">Fuel Amount (Liters)</label>
          <NumberBox
            showSpinButtons={true}
            value={formData.manualFuelrefillAmount}
            onValueChanged={handleFieldChange("manualFuelrefillAmount")}
            width="100%"
            showClearButton={false}
            readOnly={isSubmitting || combinedLoading}
            {...(formData.manualFuelrefillAmount !== null &&
              formData.manualFuelrefillAmount !== undefined && {
              format: "#,##0.00",
            })}
            isValid={hasAttemptedSubmit ? !validationErrors.manualFuelrefillAmount : true}
          />
          {hasAttemptedSubmit && validationErrors.manualFuelrefillAmount && (
            <span className="m365-field__error">{validationErrors.manualFuelrefillAmount}</span>
          )}
        </div>

        {/* Comments — full width */}
        <div className="m365-field m365-field--full">
          <label className="m365-field__label">Comments</label>
          <TextArea
            value={formData.comment}
            onValueChanged={handleFieldChange("comment")}
            width="100%"
            height={80}
            showClearButton={false}
            readOnly={isSubmitting || combinedLoading}
          />
        </div>

        {/* Historical Entry Information Notice */}
        {formData.date &&
          formData.tankId &&
          !isValidating &&
          !showWarning &&
          !validationError &&
          showHistoricalNotice &&
          (() => {
            const selectedDate = new Date(formData.date);
            const today = new Date();
            const isHistorical =
              selectedDate < new Date(today.setHours(0, 0, 0, 0));

            if (isHistorical) {
              return (
                <div className="m365-info-banner m365-info-banner--warning" style={{ margin: '0 0 16px' }}>
                  <i className="fa-light fa-calendar-clock m365-info-banner__icon" />
                  <div className="m365-info-banner__content">
                    <span className="m365-info-banner__text">
                      <strong>Historical Entry Detected</strong>
                    </span>
                    <span className="m365-info-banner__text" style={{ display: 'block', marginTop: '4px' }}>
                      You are creating a manual refill for{" "}
                      <strong>{selectedDate.toLocaleDateString()}</strong>{" "}
                      (backdated entry).
                    </span>
                    <span className="m365-info-banner__text" style={{ display: 'block', marginTop: '4px' }}>
                      <strong>Impact:</strong> This will recalculate the
                      tank's current stock and affect all subsequent records.
                    </span>
                  </div>
                  <button
                    className="m365-info-banner__dismiss"
                    onClick={() => setShowHistoricalNotice(false)}
                    title="Dismiss"
                  >
                    <i className="fa-light fa-xmark" />
                  </button>
                </div>
              );
            }
            return null;
          })()}

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
          <div className="m365-info-banner" style={{ margin: '0 0 16px' }}>
            <LoadIndicator height={20} width={20} />
            <div className="m365-info-banner__content">
              <span className="m365-info-banner__text">
                Validating historical entry...
              </span>
            </div>
          </div>
        )}

        {backendError && (
          <div className="m365-info-banner m365-info-banner--error" style={{ margin: '0 0 16px' }}>
            <i className="fa-light fa-triangle-exclamation m365-info-banner__icon" />
            <div className="m365-info-banner__content">
              <span className="m365-info-banner__text">
                <strong>Manual Fuel Refill Error</strong>
              </span>
              <span className="m365-info-banner__text" style={{ display: 'block', marginTop: '4px' }}>
                {backendError.message || 'An error occurred'}
              </span>
            </div>
            <button
              type="button"
              className="m365-info-banner__dismiss"
              onClick={() => setBackendError(null)}
              title="Dismiss"
            >
              <i className="fa-light fa-xmark" />
            </button>
          </div>
        )}
      </div>

      {isSubmitting && (
        <div className="m365-info-banner" style={{ alignItems: "center" }}>
          <LoadIndicator height={20} width={20} />
          <div className="m365-info-banner__content">
            <span className="m365-info-banner__text">Posting manual fuel refill...</span>
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="m365-form-actions">
        <button
          type="button"
          className="m365-btn m365-btn--ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <i className="fa-light fa-xmark" />
          Cancel
        </button>
        <button
          type="button"
          className="m365-btn m365-btn--ghost"
          onClick={handleSaveAndNew}
          disabled={isSubmitting || isValidating || combinedLoading || !!validationError}
        >
          <i className="fa-light fa-plus" />
          Save and New
        </button>
        <button
          type="button"
          className="m365-btn m365-btn--primary"
          onClick={handleSaveAndClose}
          disabled={isSubmitting || isValidating || combinedLoading || !!validationError}
        >
          <i className="fa-light fa-floppy-disk" />
          Save and Close
        </button>
      </div>
    </div>
  );
};

export default ManualRefillForm;
