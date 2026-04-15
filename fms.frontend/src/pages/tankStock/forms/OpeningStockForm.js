/**
 * File: OpeningStockForm.js
 * Purpose: Render the tank stock opening form, orchestrating site/tank lookups, validation, and submission workflows.
 * Dependencies: React, Redux Toolkit, DevExtreme Form components, tankActions, siteActions, tankStockAction
 * Last Modified: 2025-11-27
 *
 * Key Functions/Components:
 * - OpeningStockForm: Main component handling opening stock entry lifecycle and validation
 * - handleSiteChange: Loads tanks for the selected site and resets dependent state
 * - handleSubmit: Validates the form and dispatches the createOpeningStock action
 * - useTankStockFormData: Shared context for persisting date and site across forms
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import SelectBox from "devextreme-react/select-box";
import DateBox from "devextreme-react/date-box";
import NumberBox from "devextreme-react/number-box";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import {
  fetchTanks,
  fetctTankbySiteId,
} from "../../../redux/actions/tankActions";
import { createOpeningStock } from "../../../redux/actions/tankStockAction";
import LoadIndicator from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";
import FutureRecordsWarning from "../../../components/tank-stock/FutureRecordsWarning";
import { useFutureRecordsValidation } from "../../../hooks/useFutureRecordsValidation";
import { useTankStockFormData } from "../shared/context/TankStockFormContext";
import "./_m365-form-common.scss";

const OpeningStockForm = ({
  updateFormData,
  isLoading,
  onSubmit,
  onCancel,
  sites: sitesProp = [],
  tanks: tanksProp = [],
}) => {
  const dispatch = useDispatch();
  const tanksState = useSelector((state) => state.tank.tanks || []);
  const sitesState = useSelector((state) => state.site.sites || []);

  const usingPropSites = Array.isArray(sitesProp) && sitesProp.length > 0;
  const usingPropTanks = Array.isArray(tanksProp) && tanksProp.length > 0;

  const sitesAvailable = useMemo(() => {
    if (usingPropSites) {
      return sitesProp;
    }
    return sitesState;
  }, [usingPropSites, sitesProp, sitesState]);

  const tanksAvailable = useMemo(() => {
    if (usingPropTanks) {
      return tanksProp;
    }
    return tanksState;
  }, [usingPropTanks, tanksProp, tanksState]);

  // ✅ NEW: Get shared form data from context
  const {
    date: sharedDate,
    siteId: sharedSiteId,
    updateDate,
    updateSiteId,
  } = useTankStockFormData();

  const [dataLoaded, setDataLoaded] = useState(false);

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

  // Helper function for notifications with consistent positioning
  const showNotification = useCallback(
    (message, type = "info", duration = 3000) => {
      const displayTime =
        type === "error" ? Math.max(duration, 6000) : duration;
      notify({
        message,
        type,
        displayTime,
        position: {
          my: "top center",
          at: "top center",
          of: window,
          offset: "0 20",
        },
        animation: {
          show: {
            type: "slide",
            duration: 300,
            from: { top: -100, opacity: 0 },
            to: { top: 0, opacity: 1 },
          },
          hide: {
            type: "slide",
            duration: 300,
            from: { top: 0, opacity: 1 },
            to: { top: -100, opacity: 0 },
          },
        },
      });
    },
    []
  );

  const [filteredTanks, setFilteredTanks] = useState([]);
  const [loading] = useState(false);
  const [formData, setFormData] = useState({
    siteId: sharedSiteId, // Initialize from shared context
    tankId: null,
    amount: null, // Physical stock measurement
    openingMeter: null, // Opening meter reading (optional)
    bookBalance: null, // Current book balance (read-only)
    physicalStockValue: null, // Current physical stock value (read-only)
    date: sharedDate, // Initialize from shared context
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [showInfoNotice, setShowInfoNotice] = useState(true);
  const [backendError, setBackendError] = useState(null);
  const [showHistoricalNotice, setShowHistoricalNotice] = useState(true);

  // ✅ FIX #1: Load sites and tanks on mount
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
        if (!sitesReady) {
          await dispatch(fetchSiteList());
        }

        if (!tanksReady) {
          await dispatch(fetchTanks());
        }

        setDataLoaded(true);
      } catch (error) {
        console.error("OpeningStockForm - Error loading data:", error);
        showNotification(
          "Failed to load form data. Please try again.",
          "error",
          5000
        );
      }
    };
    fetchData();
  }, [
    dispatch,
    showNotification,
    sitesAvailable.length,
    tanksAvailable.length,
    dataLoaded,
  ]);

  // Keep filtered tanks synchronized with store updates
  useEffect(() => {
    if (!formData.siteId) {
      setFilteredTanks([]);
      return;
    }

    const matchingTanks = tanksAvailable.filter(
      (tank) => tank.siteId === formData.siteId
    );

    setFilteredTanks((previous) => {
      const previousIds = previous.map((tank) => tank.id).join("|");
      const nextIds = matchingTanks.map((tank) => tank.id).join("|");

      if (previousIds === nextIds) {
        return previous;
      }

      return matchingTanks;
    });
  }, [formData.siteId, tanksAvailable]);

  // Notify parent component of form data changes
  useEffect(() => {
    if (updateFormData) {
      updateFormData(formData);
    }
  }, [formData, updateFormData]);

  // Generic change handler for all form fields (controlled mode)
  const handleChange = useCallback(
    (e) => {
      const { dataField, value } = e;

      setFormData((prev) => {
        const updated = { ...prev, [dataField]: value };
        if (typeof updateFormData === "function") {
          updateFormData(updated);
        }
        return updated;
      });

      // ✅ Update shared context when date changes
      if (dataField === "date") {
        updateDate(value);
      }

      // Clear validation errors for the changed field
      setValidationErrors((prev) => ({ ...prev, [dataField]: null }));
      setBackendError(null);
    },
    [updateFormData, updateDate]
  );

  // ✅ FIX #2 & #3: Filter tanks first, then update form data
  const handleSiteChange = useCallback(
    async (e) => {
      const siteId = e.value;

      setValidationErrors((prev) => ({ ...prev, siteId: null, tankId: null }));
      setBackendError(null);
      resetValidation();

      // ✅ Update shared context when site changes
      updateSiteId(siteId);

      setFormData((prev) => ({
        ...prev,
        siteId,
        tankId: "", // ✅ Using empty string for no selection state
        bookBalance: null,
        physicalStockValue: null,
      }));

      if (!siteId) {
        setFilteredTanks([]);
        return;
      }

      let tanksForSite = tanksAvailable.filter(
        (tank) => tank.siteId === siteId
      );

      if (tanksForSite.length === 0 && !usingPropTanks) {
        try {
          const result = await dispatch(fetctTankbySiteId(siteId));
          if (result?.success && Array.isArray(result.data)) {
            tanksForSite = result.data;
          }
        } catch (siteTankError) {
          console.error(
            "OpeningStockForm - Failed to fetch tanks for site:",
            siteTankError
          );
          showNotification(
            "Unable to load tanks for the selected site. Please try again.",
            "error",
            5000
          );
        }
      }

      setFilteredTanks(tanksForSite);
    },
    [
      dispatch,
      tanksAvailable,
      resetValidation,
      showNotification,
      usingPropTanks,
      updateSiteId,
    ]
  );

  const handleTankChange = useCallback(
    async (e) => {
      const tankId = e.value;

      // Get selected tank to retrieve book balance and physical stock value
      const selectedTank = tanksAvailable.find((tank) => tank.id === tankId);
      const bookBalance = selectedTank ? selectedTank.currentStock : null;
      const physicalStockValue = selectedTank
        ? selectedTank.physicalStockValue
        : null;

      const updatedData = {
        ...formData,
        tankId: tankId,
        bookBalance: bookBalance, // Set current book balance for comparison
        physicalStockValue: physicalStockValue, // Set current physical stock value for comparison
      };
      setFormData(updatedData);

      // Clear validation errors and backend errors for this field
      setValidationErrors((prev) => ({ ...prev, tankId: null }));
      setBackendError(null);

      // Reset future records validation when tank changes
      resetValidation();

      // Validate if this is a historical entry and we have date selected
      if (tankId && formData.date) {
        const validation = await validateHistoricalEntry(
          tankId,
          formData.date,
          "OpeningStock"
        );

        if (validation.error) {
          showNotification(validation.error, "error");
        }
      }
    },
    [
      formData,
      resetValidation,
      validateHistoricalEntry,
      showNotification,
      tanksAvailable,
    ]
  );

  const handleDateChange = useCallback(
    async (e) => {
      // Ensure we have a valid date object or null
      const dateValue = e && e.value !== undefined ? e.value : e;
      setFormData((prev) => ({ ...prev, date: dateValue }));
      // Clear validation errors and backend errors for this field
      setValidationErrors((prev) => ({ ...prev, date: null }));
      setBackendError(null);

      // Reset future records validation when date changes
      resetValidation();

      // Validate if this is a historical entry and we have tank selected
      if (dateValue && formData.tankId) {
        const validation = await validateHistoricalEntry(
          formData.tankId,
          dateValue,
          "OpeningStock"
        );

        if (validation.error) {
          showNotification(validation.error, "error");
        }
      }
    },
    [
      formData.tankId,
      resetValidation,
      validateHistoricalEntry,
      showNotification,
    ]
  );

  const handleAmountChange = (e) => {
    const value = e && e.value !== undefined ? e.value : e;
    setFormData((prev) => ({ ...prev, amount: value }));
    // Clear validation errors and backend errors for this field
    setValidationErrors((prev) => ({ ...prev, amount: null }));
    setBackendError(null);
  };

  // Validation logic
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.siteId) errors.siteId = "Site is required";
    if (!formData.tankId) errors.tankId = "Tank is required";
    if (!formData.amount || formData.amount <= 0)
      errors.amount = "Valid opening stock amount is required";
    if (!formData.date) errors.date = "Date is required";

    return errors;
  }, [formData]);

  // Clear form data for new entry (preserve site and date)
  const clearFormData = useCallback(() => {
    setFormData((prevData) => ({
      siteId: prevData.siteId, // Preserve site selection
      tankId: null, // Clear tank
      amount: null, // Clear physical stock amount
      bookBalance: null,
      physicalStockValue: null,
      date: prevData.date, // Preserve date from previous submission
    }));
    setValidationErrors({});
    resetValidation();
  }, [resetValidation]);

  // Handle form submission and close
  const handleSubmit = useCallback(async () => {
    console.log("Starting form submission...");

    setHasAttemptedSubmit(true);
    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      showNotification(
        "Please fill in all required fields correctly",
        "error",
        4000
      );
      return;
    }

    // Check if we can submit based on future records validation
    if (!canSubmitForm) {
      showNotification(
        "Please resolve the validation warnings before submitting",
        "warning",
        4000
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare the data in the format expected by the action
      const preparedData = {
        tankId: formData.tankId,
        amount: formData.amount,
        // Send ISO UTC to avoid server-side future-date rejections due to timezone
        dateTime: formData.date ? new Date(formData.date).toISOString() : null,
        openingMeter: formData.openingMeter, // Include optional opening meter
      };

      const response = await dispatch(createOpeningStock(preparedData));

      console.log("OpeningStockForm - Response received:", response);

      // Check for success - handle both direct response and unwrapped response
      const isSuccess =
        response &&
        (response.success === true || response.payload?.success === true);

      if (isSuccess) {
        const message =
          response.message ||
          response.payload?.message ||
          "Opening stock created successfully";
        showNotification(message, "success", 3000);

        // Clear any previous backend errors on success
        setBackendError(null);

        // Only close form on successful creation
        if (onSubmit) {
          onSubmit(preparedData);
        }
        if (onCancel) {
          onCancel();
        }
      } else {
        // Handle both explicit failure and undefined success - including backend validation errors
        const errorMessage =
          response?.message ||
          response?.payload?.message ||
          "Failed to create opening stock";
        console.error(
          "OpeningStockForm - Creation failed:",
          errorMessage,
          response
        );

        // Set backend error for inline display instead of notification
        setBackendError({
          message: errorMessage,
          type: "error",
        });

        // Form stays open so user can retry or make corrections
      }
    } catch (error) {
      console.error("OpeningStockForm - Error creating opening stock:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred";

      // Set backend error for inline display instead of notification
      setBackendError({
        message: errorMessage,
        type: "error",
      });

      // Form stays open on error
    } finally {
      setIsSubmitting(false);
    }
  }, [
    formData,
    validateForm,
    canSubmitForm,
    dispatch,
    onSubmit,
    onCancel,
    showNotification,
  ]);

  // Handle save and new entry
  const handleSaveAndNew = useCallback(async () => {
    console.log("Starting form submission for save and new...");

    setHasAttemptedSubmit(true);
    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      showNotification(
        "Please fill in all required fields correctly",
        "error",
        4000
      );
      return;
    }

    // Check if we can submit based on future records validation
    if (!canSubmitForm) {
      showNotification(
        "Please resolve the validation warnings before submitting",
        "warning",
        4000
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare the data in the format expected by the action
      const preparedData = {
        tankId: formData.tankId,
        amount: formData.amount,
        // Send ISO UTC to avoid server-side future-date rejections due to timezone
        dateTime: formData.date ? new Date(formData.date).toISOString() : null,
        openingMeter: formData.openingMeter, // Include optional opening meter
      };

      const response = await dispatch(createOpeningStock(preparedData));

      console.log(
        "OpeningStockForm (Save and New) - Response received:",
        response
      );

      // Check for success - handle both direct response and unwrapped response
      const isSuccess =
        response &&
        (response.success === true || response.payload?.success === true);

      if (isSuccess) {
        const message =
          response.message ||
          response.payload?.message ||
          "Opening stock created successfully. Form cleared for new entry.";
        showNotification(message, "success", 3000);

        // Clear any previous backend errors on success
        setBackendError(null);

        // Clear form for new entry (keeps site and date)
        clearFormData();
        setHasAttemptedSubmit(false); // Reset for new entry
      } else {
        // Handle both explicit failure and undefined success - including backend validation errors
        const errorMessage =
          response?.message ||
          response?.payload?.message ||
          "Failed to create opening stock";
        console.error(
          "OpeningStockForm - Creation failed:",
          errorMessage,
          response
        );

        // Set backend error for inline display instead of notification
        setBackendError({
          message: errorMessage,
          type: "error",
        });

        // Form stays open so user can retry or make corrections
      }
    } catch (error) {
      console.error("OpeningStockForm - Error creating opening stock:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred";

      // Set backend error for inline display instead of notification
      setBackendError({
        message: errorMessage,
        type: "error",
      });

      // Form stays open on error
    } finally {
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
        <p style={{ fontSize: 13, color: "#605e5c", marginBottom: 16 }}>
          Record the opening stock amount for the selected tank and date.
        </p>

        {/* Loading indicator */}
        {!dataLoaded &&
          (sitesAvailable.length === 0 || tanksAvailable.length === 0) && (
            <div className="m365-info-banner">
              <LoadIndicator width={"32px"} height={"32px"} visible={true} />
              <div className="m365-info-banner__content">
                <span className="m365-info-banner__text">
                  Loading form data...
                </span>
              </div>
            </div>
          )}

        {loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "24px 0",
            }}
          >
            <LoadIndicator width={"48px"} height={"48px"} visible={true} />
          </div>
        )}

        {/* Date & Time — full width */}
        <div className="m365-field m365-field--full">
          <label className="m365-field__label">Date &amp; Time</label>
          <DateBox
            value={formData.date}
            max={new Date()}
            {...(formData.date && { displayFormat: "yyyy-MM-dd HH:mm" })}
            type="datetime"
            onValueChanged={handleDateChange}
            width="100%"
            className="datebox-full-width"
            dropDownOptions={{
              width: "auto",
              minWidth: 380,
              maxWidth: 520,
              wrapperAttr: { class: "datebox-wide" },
            }}
            isValid={hasAttemptedSubmit ? !validationErrors.date : true}
            validationError={
              validationErrors.date
                ? { message: validationErrors.date }
                : null
            }
            validationMessageMode="always"
            acceptCustomValue={false}
            openOnFieldClick={true}
            elementAttr={{ class: "datebox-full-width-popup" }}
          />
        </div>

        {/* Site */}
        <div className="m365-field m365-field--full">
          <label className="m365-field__label">Site</label>
          <SelectBox
            items={sitesAvailable}
            displayExpr="name"
            valueExpr="id"
            value={formData.siteId}
            onValueChanged={handleSiteChange}
            placeholder={
              sitesAvailable.length === 0
                ? "Loading sites..."
                : "Select a site"
            }
            width="100%"
            searchEnabled={true}
            showClearButton={true}
            dropDownOptions={{ container: "body" }}
            isValid={hasAttemptedSubmit ? !validationErrors.siteId : true}
            validationError={
              validationErrors.siteId
                ? { message: validationErrors.siteId }
                : null
            }
            validationMessageMode="always"
          />
        </div>

        {/* Tank */}
        <div className="m365-field m365-field--full">
          <label className="m365-field__label">Tank</label>
          <SelectBox
            items={filteredTanks}
            displayExpr="name"
            valueExpr="id"
            value={formData.tankId}
            onValueChanged={handleTankChange}
            disabled={!formData.siteId}
            placeholder={
              !formData.siteId
                ? "Select a site first"
                : filteredTanks.length > 0
                  ? "Select a tank"
                  : "No tanks available"
            }
            width="100%"
            searchEnabled={true}
            showClearButton={true}
            dropDownOptions={{ container: "body" }}
            isValid={hasAttemptedSubmit ? !validationErrors.tankId : true}
            validationError={
              validationErrors.tankId
                ? { message: validationErrors.tankId }
                : null
            }
            validationMessageMode="always"
          />
        </div>

        {/* Read-only: Book Balance & Physical Stock Value */}
        {(formData.bookBalance != null || formData.tankId) && (
          <div className="m365-field-row">
            {formData.bookBalance !== null &&
              formData.bookBalance !== undefined && (
                <div className="m365-field">
                  <label className="m365-field__label">
                    Current Book Balance (Calculated)
                  </label>
                  <div
                    className="m365-input"
                    style={{ background: "#f3f2f1", cursor: "default", display: "flex", alignItems: "center", fontWeight: 600 }}
                  >
                    {formData.bookBalance != null
                      ? Number(formData.bookBalance).toLocaleString() + " L"
                      : "0 L"}
                  </div>
                </div>
              )}

            {formData.tankId && (
              <div className="m365-field">
                <label className="m365-field__label">
                  Current Physical Stock Value (Last Recorded)
                </label>
                <div
                  className="m365-input"
                  style={{ background: "#f3f2f1", cursor: "default", display: "flex", alignItems: "center", fontWeight: 600 }}
                >
                  {formData.physicalStockValue != null
                    ? Number(formData.physicalStockValue).toLocaleString() +
                    " L"
                    : "No physical reading available"}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Physical Stock Amount */}
        <div className="m365-field m365-field--full">
          <label className="m365-field__label">
            Physical Stock Amount (Liters)
          </label>
          <NumberBox
            showSpinButtons={true}
            value={formData.amount || null}
            onValueChanged={handleAmountChange}
            placeholder="Enter physical stock measurement"
            width="100%"
            {...(formData.amount !== null &&
              formData.amount !== undefined && { format: "#,##0" })}
            isValid={hasAttemptedSubmit ? !validationErrors.amount : true}
            validationError={
              validationErrors.amount
                ? { message: validationErrors.amount }
                : null
            }
            validationMessageMode="always"
          />
        </div>

        {/* Opening Meter Reading */}
        <div className="m365-field m365-field--full">
          <label className="m365-field__label">
            Opening Meter Reading (Optional)
          </label>
          <NumberBox
            showSpinButtons={true}
            value={formData.openingMeter || null}
            onValueChanged={(e) =>
              handleChange({ dataField: "openingMeter", value: e.value })
            }
            placeholder="Enter opening meter reading (optional)"
            width="100%"
            {...(formData.openingMeter !== null &&
              formData.openingMeter !== undefined && {
              format: "#,##0.00",
            })}
          />
        </div>

        {/* Discrepancy Indicator */}
        {formData.amount != null &&
          (formData.bookBalance != null ||
            formData.physicalStockValue != null) && (
            <div className="m365-section-group" style={{ marginBottom: 16 }}>
              <div className="m365-section-group__header">
                <i className="fa-light fa-scale-balanced m365-section-group__icon" />
                <h3 className="m365-section-group__title">Stock Comparison</h3>
              </div>
              <div
                className="m365-section-group__body"
                style={{ fontSize: 13, color: "#201f1e", lineHeight: "1.8" }}
              >
                <div>
                  New Physical Stock:{" "}
                  {Number(formData.amount).toLocaleString()} L
                </div>

                {formData.bookBalance != null && (
                  <>
                    <div>
                      Current Book Balance:{" "}
                      {Number(formData.bookBalance).toLocaleString()} L
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color:
                          Math.abs(formData.amount - formData.bookBalance) >
                            formData.bookBalance * 0.05
                            ? "#d13438"
                            : "#107c10",
                      }}
                    >
                      Book Balance Discrepancy:{" "}
                      {Number(
                        formData.amount - formData.bookBalance
                      ).toLocaleString()}{" "}
                      L (
                      {formData.bookBalance > 0
                        ? (
                          ((formData.amount - formData.bookBalance) /
                            formData.bookBalance) *
                          100
                        ).toFixed(2)
                        : "100"}
                      %)
                    </div>
                  </>
                )}

                {formData.physicalStockValue != null && (
                  <>
                    <div>
                      Current Physical Stock:{" "}
                      {Number(formData.physicalStockValue).toLocaleString()} L
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color:
                          Math.abs(
                            formData.amount - formData.physicalStockValue
                          ) >
                            formData.physicalStockValue * 0.05
                            ? "#ca5010"
                            : "#107c10",
                      }}
                    >
                      Physical Stock Change:{" "}
                      {Number(
                        formData.amount - formData.physicalStockValue
                      ).toLocaleString()}{" "}
                      L (
                      {formData.physicalStockValue > 0
                        ? (
                          ((formData.amount - formData.physicalStockValue) /
                            formData.physicalStockValue) *
                          100
                        ).toFixed(2)
                        : "100"}
                      %)
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

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
                <div className="m365-info-banner m365-info-banner--warning">
                  <i className="fa-light fa-calendar-clock m365-info-banner__icon" />
                  <div className="m365-info-banner__content">
                    <span className="m365-info-banner__text">
                      <strong>Historical Entry Detected</strong> — You are
                      creating an opening stock entry for{" "}
                      <strong>{selectedDate.toLocaleDateString()}</strong>{" "}
                      (backdated entry). This will recalculate the tank's
                      current stock and affect all subsequent records.
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

        {/* Future Records Validation Warning */}
        {(showWarning || validationError) && (
          <FutureRecordsWarning
            validationResult={validationResult}
            onConfirm={confirmProceed}
            onCancel={cancelProceed}
            isVisible={showWarning || !!validationError}
          />
        )}

        {/* Backend Error Display */}
        {backendError && (
          <div className="m365-info-banner m365-info-banner--error">
            <i className="fa-light fa-triangle-exclamation m365-info-banner__icon" />
            <div className="m365-info-banner__content">
              <span className="m365-info-banner__text">
                <strong>Opening Stock Validation Error</strong>
              </span>
              {backendError?.message?.includes(
                "opening stock already exists"
              ) &&
                backendError?.message?.includes(
                  "without a subsequent closing stock"
                ) ? (
                <span
                  className="m365-info-banner__text"
                  style={{ display: "block", marginTop: 4 }}
                >
                  <i
                    className="fa-light fa-circle-info"
                    style={{ marginRight: 6 }}
                  />
                  {backendError?.message}
                </span>
              ) : (
                <span
                  className="m365-info-banner__text"
                  style={{ display: "block", marginTop: 4 }}
                >
                  {backendError?.message || "An error occurred"}
                </span>
              )}
            </div>
            <button
              className="m365-info-banner__dismiss"
              onClick={() => setBackendError(null)}
              title="Close error message"
            >
              <i className="fa-light fa-xmark" />
            </button>
          </div>
        )}

        {/* Validating indicator */}
        {isValidating && (
          <div
            className="m365-info-banner"
            style={{ alignItems: "center" }}
          >
            <LoadIndicator height={20} width={20} />
            <div className="m365-info-banner__content">
              <span className="m365-info-banner__text">
                Validating historical entry...
              </span>
            </div>
          </div>
        )}

        {/* Information Notice */}
        {showInfoNotice && (
          <div className="m365-info-banner">
            <i className="fa-light fa-circle-info m365-info-banner__icon" />
            <div className="m365-info-banner__content">
              <span className="m365-info-banner__text">
                <strong>Opening Stock Information</strong> — Opening stock that
                is not today's will affect the tank current stock.
              </span>
            </div>
            <button
              className="m365-info-banner__dismiss"
              onClick={() => setShowInfoNotice(false)}
              title="Close information"
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
            <span className="m365-info-banner__text">
              Posting opening stock...
            </span>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="m365-form-actions">
        <button
          className="m365-btn m365-btn--ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <i className="fa-light fa-xmark" />
          Cancel
        </button>
        <button
          className="m365-btn m365-btn--ghost"
          onClick={handleSaveAndNew}
          disabled={isSubmitting || !canSubmitForm || isValidating}
        >
          <i className="fa-light fa-plus" />
          Save and New
        </button>
        <button
          className="m365-btn m365-btn--primary"
          onClick={handleSubmit}
          disabled={isSubmitting || !canSubmitForm || isValidating}
        >
          <i className="fa-light fa-floppy-disk" />
          Save and Close
        </button>
      </div>
    </div>
  );
};

export default OpeningStockForm;
