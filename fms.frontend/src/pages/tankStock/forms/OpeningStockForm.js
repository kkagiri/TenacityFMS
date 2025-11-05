/**
 * File: OpeningStockForm.js
 * Purpose: Render the tank stock opening form, orchestrating site/tank lookups, validation, and submission workflows.
 * Dependencies: React, Redux Toolkit, DevExtreme Form components, tankActions, siteActions, tankStockAction
 * Last Modified: 2025-10-06
 *
 * Key Functions/Components:
 * - OpeningStockForm: Main component handling opening stock entry lifecycle and validation
 * - handleSiteChange: Loads tanks for the selected site and resets dependent state
 * - handleSubmit: Validates the form and dispatches the createOpeningStock action
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, SimpleItem, Label, GroupItem } from "devextreme-react/form";
import { Button } from "devextreme-react";
import ScrollView from "devextreme-react/scroll-view";
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
import "./OpeningStockForm.scss";

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
  }, [usingPropTanks, tanksProp, tanksState]);  const [dataLoaded, setDataLoaded] = useState(false);

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
    siteId: null,
    tankId: null,
    amount: null, // Physical stock measurement
    bookBalance: null, // Current book balance (read-only)
    physicalStockValue: null, // Current physical stock value (read-only)
    date: new Date(),
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

      // Clear validation errors for the changed field
      setValidationErrors((prev) => ({ ...prev, [dataField]: null }));
      setBackendError(null);
    },
    [updateFormData]
  );

  // ✅ FIX #2 & #3: Filter tanks first, then update form data
  const handleSiteChange = useCallback(
    async (e) => {
      const siteId = e.value;

      setValidationErrors((prev) => ({ ...prev, siteId: null, tankId: null }));
      setBackendError(null);
      resetValidation();

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
      showNotification("Please fill in all required fields correctly", "error", 4000);
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
      };

      const response = await dispatch(createOpeningStock(preparedData));

      // Check for success - be more explicit about what constitutes success
      if (response && response.success === true) {
        showNotification(
          response.message || "Opening stock created successfully",
          "success",
          3000
        );

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
        const errorMessage =
          response?.message || "Failed to create opening stock";
        console.error("OpeningStockForm - Creation failed:", errorMessage, response);

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
      showNotification("Please fill in all required fields correctly", "error", 4000);
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
      };

      const response = await dispatch(createOpeningStock(preparedData));

      // Check for success - be more explicit about what constitutes success
      if (response && response.success === true) {
        showNotification(
          response.message || "Opening stock created successfully. Form cleared for new entry.",
          "success",
          3000
        );

        // Clear any previous backend errors on success
        setBackendError(null);

        // Clear form for new entry (keeps site and date)
        clearFormData();
        setHasAttemptedSubmit(false); // Reset for new entry
      } else {
        // Handle both explicit failure and undefined success - including backend validation errors
        const errorMessage =
          response?.message || "Failed to create opening stock";
        console.error("OpeningStockForm - Creation failed:", errorMessage, response);

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
    <div className="opening-stock-form tw-h-full tw-flex tw-flex-col">
      <ScrollView showScrollbar="onScroll" scrollByThumb={true} useNative={false}>
        <div className="tw-p-6">
          {/* Header */}
          <div className="tw-mb-6">
            <p className="tw-text-gray-600 tw-text-sm">
              Record the opening stock amount for the selected tank and date.
            </p>
          </div>

          {/* Loading indicator */}
          {!dataLoaded &&
            (sitesAvailable.length === 0 || tanksAvailable.length === 0) && (
              <div className="tw-flex tw-justify-center tw-items-center tw-py-8 tw-bg-blue-50 tw-rounded-lg tw-mb-4">
                <LoadIndicator width={"32px"} height={"32px"} visible={true} />
                <span className="tw-ml-3 tw-text-blue-700">
                  Loading form data...
                </span>
              </div>
            )}

          {loading && (
            <div className="tw-flex tw-justify-center tw-py-8">
              <LoadIndicator width={"48px"} height={"48px"} visible={true} />
            </div>
          )}

          <Form
            formData={formData}
            readOnly={isLoading}
            showColonAfterLabel={true}
            labelLocation="top"
            onFieldDataChanged={handleChange}
            colCount={2}
            className="tw-mb-6"
            scrollingEnabled={true}
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
                      width: "auto",
                      minWidth: 380,
                      maxWidth: 520,
                      wrapperAttr: { class: "datebox-wide" },
                    },
                    isValid: hasAttemptedSubmit ? !validationErrors.date : true,
                    validationError: validationErrors.date
                      ? { message: validationErrors.date }
                      : null,
                    validationMessageMode: "always",
                    // Add date validation to prevent invalid date formatting
                    acceptCustomValue: false,
                    openOnFieldClick: true,
                    // Add custom CSS class for enhanced datetime picker styling
                    elementAttr: {
                      class: "datebox-full-width-popup",
                    },
                  }}
                >
                  <Label text="Date & Time" />
                </SimpleItem>
              </GroupItem>

              <SimpleItem
                dataField="siteId"
                editorType="dxSelectBox"
                editorOptions={{
                  items: sitesAvailable,
                  displayExpr: "name",
                  valueExpr: "id",
                  onValueChanged: handleSiteChange,
                  placeholder:
                    sitesAvailable.length === 0
                      ? "Loading sites..."
                      : "Select a site",
                  width: "100%",
                  searchEnabled: true,
                  showClearButton: true,
                  dropDownOptions: {
                    container: "body",
                  },
                  isValid: hasAttemptedSubmit ? !validationErrors.siteId : true,
                  validationError: validationErrors.siteId
                    ? { message: validationErrors.siteId }
                    : null,
                  validationMessageMode: "always",
                }}
              >
                <Label text="Site" />
              </SimpleItem>

              <SimpleItem
                dataField="tankId"
                editorType="dxSelectBox"
                editorOptions={{
                  items: filteredTanks,
                  displayExpr: "name",
                  valueExpr: "id",
                  onValueChanged: handleTankChange,
                  disabled: !formData.siteId,
                  placeholder: !formData.siteId
                    ? "Select a site first"
                    : filteredTanks.length > 0
                    ? "Select a tank"
                    : "No tanks available",
                  width: "100%",
                  searchEnabled: true,
                  showClearButton: true,
                  dropDownOptions: {
                    container: "body",
                  },
                  isValid: hasAttemptedSubmit ? !validationErrors.tankId : true,
                  validationError: validationErrors.tankId
                    ? { message: validationErrors.tankId }
                    : null,
                  validationMessageMode: "always",
                }}
              >
                <Label text="Tank" />
              </SimpleItem>

              {/* Book Balance Display (Read-only) */}
              {formData.bookBalance !== null &&
                formData.bookBalance !== undefined && (
                  <SimpleItem
                    dataField="bookBalance"
                    editorType="dxTextBox"
                    editorOptions={{
                      value:
                        formData.bookBalance != null
                          ? Number(formData.bookBalance).toLocaleString() + " L"
                          : "0 L",
                      readOnly: true,
                      width: "100%",
                      stylingMode: "filled",
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
                    value:
                      formData.physicalStockValue != null
                        ? Number(formData.physicalStockValue).toLocaleString() +
                          " L"
                        : "No physical reading available",
                    readOnly: true,
                    width: "100%",
                    stylingMode: "filled",
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
                  ...(formData.amount !== null &&
                    formData.amount !== undefined && { format: "#,##0" }),
                  isValid: hasAttemptedSubmit ? !validationErrors.amount : true,
                  validationError: validationErrors.amount
                    ? { message: validationErrors.amount }
                    : null,
                  validationMessageMode: "always",
                }}
              >
                <Label text="Physical Stock Amount (Liters)" />
              </SimpleItem>

              {/* Discrepancy Indicator */}
              {formData.amount != null &&
                (formData.bookBalance != null ||
                  formData.physicalStockValue != null) && (
                  <div
                    className="discrepancy-indicator"
                    style={{
                      padding: "10px",
                      marginTop: "10px",
                      borderRadius: "4px",
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #dee2e6",
                    }}
                  >
                    <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                      Stock Comparison:
                    </div>
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
                            fontWeight: "bold",
                            color:
                              Math.abs(formData.amount - formData.bookBalance) >
                              formData.bookBalance * 0.05
                                ? "#f44336"
                                : "#4caf50",
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
                          {Number(formData.physicalStockValue).toLocaleString()}{" "}
                          L
                        </div>
                        <div
                          style={{
                            fontWeight: "bold",
                            color:
                              Math.abs(
                                formData.amount - formData.physicalStockValue
                              ) >
                              formData.physicalStockValue * 0.05
                                ? "#ff9800"
                                : "#4caf50",
                          }}
                        >
                          Physical Stock Change:{" "}
                          {Number(
                            formData.amount - formData.physicalStockValue
                          ).toLocaleString()}{" "}
                          L (
                          {formData.physicalStockValue > 0
                            ? (
                                ((formData.amount -
                                  formData.physicalStockValue) /
                                  formData.physicalStockValue) *
                                100
                              ).toFixed(2)
                            : "100"}
                          %)
                        </div>
                      </>
                    )}
                  </div>
                )}
            </Form>

          {/* Historical Entry Information Notice */}
          {formData.date && formData.tankId && !isValidating && !showWarning && !validationError && showHistoricalNotice && (
            (() => {
              const selectedDate = new Date(formData.date);
              const today = new Date();
              const isHistorical = selectedDate < new Date(today.setHours(0, 0, 0, 0));

              if (isHistorical) {
                return (
                  <div className="tw-mb-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
                    <div className="tw-flex tw-items-start tw-justify-between">
                      <div className="tw-flex tw-items-start tw-flex-1">
                        <i className="fa-light fa-calendar-clock tw-text-blue-600 tw-mt-0.5 tw-mr-3"></i>
                        <div className="tw-flex-1">
                          <h4 className="tw-font-medium tw-text-blue-800 tw-mb-1">
                            Historical Entry Detected
                          </h4>
                          <p className="tw-text-blue-700 tw-text-sm">
                            You are creating an opening stock entry for <strong>{selectedDate.toLocaleDateString()}</strong> (backdated entry).
                          </p>
                          <p className="tw-text-blue-700 tw-text-sm tw-mt-1">
                            <strong>Impact:</strong> This will recalculate the tank's current stock and affect all subsequent records.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowHistoricalNotice(false)}
                        className="tw-ml-2 tw-text-blue-600 hover:tw-text-blue-800 tw-transition-colors tw-flex-shrink-0"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', fontSize: '16px' }}
                        title="Dismiss"
                      >
                        <i className="fa-light fa-times"></i>
                      </button>
                    </div>
                  </div>
                );
              }
              return null;
            })()
          )}

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

          {/* Backend Error Display with Enhanced Closing Stock Guidance */}
          {backendError && (
            <div className="tw-mb-4 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-3">
              <div className="tw-flex tw-items-start">
                <i className="fa-light fa-exclamation-triangle tw-text-red-600 tw-mt-0.5 tw-mr-3"></i>
                <div className="tw-flex-1">
                  <h4 className="tw-font-medium tw-text-red-800 tw-mb-1">
                    Opening Stock Validation Error
                  </h4>

                  {/* Enhanced error description for unclosed opening stock */}
                  {backendError?.message?.includes(
                    "opening stock already exists"
                  ) &&
                    backendError?.message?.includes(
                      "without a subsequent closing stock"
                    ) ? (
                      <div className="tw-bg-white tw-rounded tw-p-3 tw-border tw-border-red-100">
                        <p className="tw-text-red-800 tw-text-sm tw-font-medium tw-mb-2">
                          <i className="fa-light fa-info-circle tw-mr-2"></i>
                          What happened?
                        </p>
                        <p className="tw-text-red-700 tw-text-sm">
                          {backendError?.message}
                        </p>
                      </div>
                    ) : (
                      <p className="tw-text-red-700 tw-text-sm tw-mb-3">
                        {backendError?.message || "An error occurred"}
                      </p>
                    )}
                </div>
                <button
                  type="button"
                  onClick={() => setBackendError(null)}
                  className="tw-ml-3 tw-text-red-600 hover:tw-text-red-800 tw-transition-colors tw-cursor-pointer tw-bg-transparent tw-border-0 tw-p-1"
                  title="Close error message"
                >
                  <i className="fa-light fa-times tw-text-lg"></i>
                </button>
              </div>
            </div>
          )}

          {/* Loading indicator for validation */}
          {isValidating && (
            <div className="tw-mb-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3 tw-flex tw-items-center tw-space-x-3">
              <LoadIndicator height={20} width={20} />
              <span className="tw-text-blue-700 tw-text-sm">
                Validating historical entry...
              </span>
            </div>
          )}

          {/* Information Notice - Moved to bottom */}
          {showInfoNotice && (
            <div className="tw-mb-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
              <div className="tw-flex tw-items-start">
                <i className="fa-light fa-info-circle tw-text-blue-600 tw-mt-0.5 tw-mr-3"></i>
                <div className="tw-flex-1">
                  <h4 className="tw-font-medium tw-text-blue-800 tw-mb-1">
                    Opening Stock Information
                  </h4>
                  <p className="tw-text-blue-700 tw-text-sm">
                    Opening stock that is not today's will affect the tank
                    current stock.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInfoNotice(false)}
                  className="tw-ml-3 tw-text-blue-600 hover:tw-text-blue-800 tw-transition-colors tw-cursor-pointer tw-bg-transparent tw-border-0 tw-p-1"
                  title="Close information"
                >
                  <i className="fa-light fa-times tw-text-lg"></i>
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
              onClick={handleSubmit}
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

export default OpeningStockForm;
