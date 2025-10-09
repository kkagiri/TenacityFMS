/**
 * File: ClosingStockForm.js
 * Purpose: Manage closing stock entry workflow, reusing shared site/tank datasets and handling validation plus history insights.
 * Dependencies: React, Redux Toolkit, DevExtreme components, tankActions, siteActions, ClosingStockActions, tankVolumeHistoryActions
 * Last Modified: 2025-10-06
 *
 * Key Functions/Components:
 * - ClosingStockForm: Main component orchestrating closing stock submission lifecycle
 * - handleSiteChange: Filters tanks for selected site and primes dependent state
 * - handleTankChange: Retrieves tank metrics and triggers validation/history loads
 */
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, SimpleItem, Label } from "devextreme-react/form";
import { Button } from "devextreme-react";
import { IsolatedForm } from "../../../components/common/SignalRIsolation";
import DataGrid, {
  Column,
  GroupPanel,
  Grouping,
  Summary,
  TotalItem,
  SearchPanel,
  ColumnChooser,
  HeaderFilter,
  FilterRow,
} from "devextreme-react/data-grid";
import { fetchSitebyUserId } from "../../../redux/actions/siteActions";
import {
  fetchTanks,
  fetctTankbySiteId,
} from "../../../redux/actions/tankActions";
import { fetchTankVolumeHistoryByTankId } from "../../../redux/actions/tankVolumeHistoryActions";
import { createClosingStock } from "../../../redux/actions/ClosingStockActions";
import { prepareOpeningClosingStockParams } from "../../../utils/stockDataPreparation";
import LoadIndicator from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";
import "./ClosingStockForm.scss";

// Future records validation imports
import { useFutureRecordsValidation } from "../../../hooks/useFutureRecordsValidation";
import FutureRecordsWarning from "../../../components/tank-stock/FutureRecordsWarning";

const ClosingStockForm = ({
  updateFormData,
  isLoading,
  onSubmit,
  onCancel,
  prefilledData,
  sites: sitesProp = [],
  tanks: tanksProp = [],
}) => {
  const dispatch = useDispatch();
  const tanksState = useSelector((state) => state.tank.tanks || []);
  const sitesState = useSelector((state) => state.site.sites || []);
  const tankVolumeHistory = useSelector(
    (state) => state.tankVolumeHistory.tankVolumeHistory || []
  );
  const usingPropSites = Array.isArray(sitesProp) && sitesProp.length > 0;
  const usingPropTanks = Array.isArray(tanksProp) && tanksProp.length > 0;
  const sitesAvailable = usingPropSites ? sitesProp : sitesState;
  const tanksAvailable = usingPropTanks ? tanksProp : tanksState;
  const [dataLoaded, setDataLoaded] = useState(false);

  // Helper function for notifications with consistent positioning
  const showNotification = useCallback((message, type = "info", duration = 3000) => {
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
  }, []);

  const [filteredTanks, setFilteredTanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    siteId: prefilledData?.siteId || 0, // ✅ Changed from null to 0 for DevExtreme Form compatibility (Site ID is int)
    tankId: prefilledData?.tankId || 0, // ✅ Changed from null to 0 for DevExtreme Form compatibility (Tank ID is int)
    amount: null, // Physical stock measurement
    bookBalance: null, // Current book balance (read-only)
    physicalStockValue: null, // Current physical stock value (read-only)
    date: prefilledData?.suggestedDate || new Date(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [showInfoNotice, setShowInfoNotice] = useState(true);
  const [showVolumeHistory, setShowVolumeHistory] = useState(true);

  // Future records validation hook
  const {
    validationResult,
    error: validationError,
    showWarning,
    canSubmit,
    validateHistoricalEntry,
    confirmProceed,
    cancelProceed,
    resetValidation,
  } = useFutureRecordsValidation();

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
        if (!sitesReady && !usingPropSites) {
          await dispatch(fetchSitebyUserId());
        }
        if (!tanksReady && !usingPropTanks) {
          await dispatch(fetchTanks());
        }
        setDataLoaded(true);
      } catch (error) {
        console.error("ClosingStockForm - Error loading data:", error);
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
    usingPropSites,
    usingPropTanks,
  ]);

  // Handle prefilled data
  useEffect(() => {
    if (prefilledData?.siteId && tanksAvailable.length > 0) {
      const tanksForSite = tanksAvailable.filter(
        (tank) => tank.siteId === prefilledData.siteId
      );
      setFilteredTanks(tanksForSite);

      // If we have a specific tank, get its data
      if (prefilledData.tankId) {
        const selectedTank = tanksAvailable.find(
          (tank) => tank.id === prefilledData.tankId
        );
        if (selectedTank) {
          const bookBalance = selectedTank.currentStock;
          const physicalStockValue = selectedTank.physicalStockValue;

          setFormData((prev) => ({
            ...prev,
            bookBalance: bookBalance,
            physicalStockValue: physicalStockValue,
          }));

          // Load tank volume history for the prefilled tank
          setLoading(true);
          dispatch(fetchTankVolumeHistoryByTankId(prefilledData.tankId))
            .catch((error) => {
              console.error("Error loading tank volume history:", error);
              showNotification("Failed to load tank volume history", "error");
            })
            .finally(() => {
              setLoading(false);
            });
        }
      }
    }
  }, [prefilledData, tanksAvailable, dispatch, showNotification]);

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
    },
    [updateFormData]
  );

  const handleSiteChange = useCallback(
    async (e) => {
      const siteId = e?.value ?? null;

      setValidationErrors((prev) => ({ ...prev, siteId: null, tankId: null }));
      setFormData((prev) => ({
        ...prev,
        siteId,
        tankId: 0, // ✅ Changed from null to 0 for DevExtreme Form compatibility
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
            "ClosingStockForm - Failed to fetch tanks for site:",
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
    [dispatch, tanksAvailable, usingPropTanks, showNotification]
  );

  const handleTankChange = useCallback(
    (e) => {
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

      if (tankId) {
        setLoading(true);
        dispatch(fetchTankVolumeHistoryByTankId(tankId))
          .then(() => {
            console.log("Tank volume history loaded successfully");
          })
          .catch((error) => {
            console.error("ClosingStockForm - Error loading tank volume history:", error);
            showNotification("Failed to load tank volume history", "error");
          })
          .finally(() => {
            setLoading(false);
          });

        // Trigger future records validation when tank and date are available
        if (formData.date) {
          validateHistoricalEntry(tankId, formData.date, "ClosingStock");
        }
      } else {
        // Reset validation when tank is cleared
        resetValidation();
      }

      // Clear validation errors for this field
      setValidationErrors((prev) => ({ ...prev, tankId: null }));
    },
    [
      formData,
      dispatch,
      validateHistoricalEntry,
      resetValidation,
      tanksAvailable,
      showNotification,
    ]
  );

  const handleDateChange = useCallback(
    (e) => {
      const newDate = e.value;
      const updatedData = {
        ...formData,
        date: newDate,
      };
      setFormData(updatedData);

      // Clear validation errors for this field
      setValidationErrors((prev) => ({ ...prev, date: null }));

      // Trigger future records validation when date and tank are available
      if (newDate && formData.tankId) {
        validateHistoricalEntry(formData.tankId, newDate, "ClosingStock");
      }
    },
    [formData, validateHistoricalEntry]
  );

  const handleAmountChange = useCallback(
    (e) => {
      const amount = e.value;
      const updatedData = {
        ...formData,
        amount: amount,
      };
      setFormData(updatedData);

      // Clear validation errors for this field
      setValidationErrors((prev) => ({ ...prev, amount: null }));
    },
    [formData]
  );

  // Validation logic
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.siteId) errors.siteId = "Site is required";
    if (!formData.tankId) errors.tankId = "Tank is required";
    if (!formData.amount || formData.amount <= 0)
      errors.amount = "Valid closing stock amount is required";
    if (!formData.date) errors.date = "Date is required";

    return errors;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    setHasAttemptedSubmit(true);
    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      showNotification("Please fill in all required fields correctly", "error", 3000);
      return;
    }

    // Check if submission is allowed based on future records validation
    if (!canSubmit) {
      showNotification(
        "Unable to submit due to future records policy. Please check the warnings above.",
        "error",
        5000
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const params = prepareOpeningClosingStockParams(formData);
      const response = await dispatch(createClosingStock(params));

      if (response.success) {
        showNotification(
          response.message || "Closing stock created successfully",
          "success",
          3000
        );
        // Reset validation on success
        resetValidation();
        // Close form on success
        if (onCancel) {
          onCancel();
        }
        if (onSubmit) {
          onSubmit(formData);
        }
      } else {
        showNotification(
          response.message || "Failed to create closing stock",
          "error",
          5000
        );
      }
    } catch (error) {
      console.error("Error creating closing stock:", error);
      showNotification("An unexpected error occurred", "error", 3000);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    formData,
    validateForm,
    dispatch,
    onSubmit,
    onCancel,
    canSubmit,
    resetValidation,
    showNotification,
  ]);

  return (
    <div formId="closing-stock-form" className="tw-h-full">
      <div className="closing-stock-form tw-h-full tw-flex tw-flex-col">
        <div className="closing-stock-scroll-container tw-flex-1 tw-overflow-y-auto">
          <div className="tw-p-6">
            <div className="tw-mb-6">
              <p className="tw-text-gray-600 tw-text-sm">
                Record the closing stock amount for the selected tank and date.
              </p>
            </div>

            {/* Special notice for prefilled closing stock */}
            {prefilledData?.reason && (
              <div className="tw-mb-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
                <div className="tw-flex tw-items-start">
                  <i className="fa-light fa-info-circle tw-text-blue-600 tw-mt-0.5 tw-mr-3"></i>
                  <div className="tw-flex-1">
                    <h4 className="tw-font-medium tw-text-blue-800 tw-mb-1">
                      Required Closing Stock
                    </h4>
                    <p className="tw-text-blue-700 tw-text-sm">
                      {prefilledData.reason}
                    </p>
                    <p className="tw-text-blue-600 tw-text-xs tw-mt-2">
                      The tank and date have been pre-selected to match the
                      existing opening stock. Please enter the appropriate
                      closing stock amount for this date.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Dismissible Information Notice */}
            {showInfoNotice && (
              <div className="tw-mb-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
                <div className="tw-flex tw-items-start">
                  <i className="fa-light fa-info-circle tw-text-blue-600 tw-mt-0.5 tw-mr-3"></i>
                  <div className="tw-flex-1">
                    <h4 className="tw-font-medium tw-text-blue-800 tw-mb-1">
                      Closing Stock Information
                    </h4>
                    <p className="tw-text-blue-700 tw-text-sm">
                      Closing stock represents the fuel quantity available in
                      the tank at the end of the specified date and time. This
                      value will be used for reconciliation and stock
                      calculations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowInfoNotice(false);
                    }}
                    className="tw-ml-3 tw-text-blue-600 hover:tw-text-blue-800 tw-transition-colors tw-cursor-pointer tw-bg-transparent tw-border-0 tw-p-1"
                    title="Close information"
                  >
                    <i className="fa-light fa-times tw-text-lg"></i>
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <div className="tw-flex tw-justify-center tw-py-8">
                <LoadIndicator width={"48px"} height={"48px"} visible={true} />
              </div>
            )}

            <Form
              readOnly={isLoading}
              formData={formData}
              showColonAfterLabel={true}
              labelLocation="top"
              onFieldDataChanged={handleChange}
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
                    width: "auto",
                    minWidth: 380,
                    maxWidth: 520,
                    wrapperAttr: { class: "datebox-wide" },
                  },
                  elementAttr: { class: "datebox-full-width-popup" },
                  isValid: hasAttemptedSubmit ? !validationErrors.date : true,
                  validationError: validationErrors.date
                    ? { message: validationErrors.date }
                    : null,
                  validationMessageMode: "always",
                }}
              >
                <Label text="Date & Time" />
              </SimpleItem>

              <SimpleItem
                key={`site-${formData.siteId || 'empty'}`}
                dataField="siteId"
                editorType="dxSelectBox"
                editorOptions={{
                  items: sitesAvailable,
                  displayExpr: "name",
                  valueExpr: "id",
                  onValueChanged: handleSiteChange,
                  placeholder:
                    !dataLoaded && sitesAvailable.length === 0
                      ? "Loading sites..."
                      : sitesAvailable.length > 0
                      ? "Select a site"
                      : "No sites available",
                  width: "100%",
                  searchEnabled: true,
                  showClearButton: true,
                  isValid: hasAttemptedSubmit ? !validationErrors.siteId : true,
                  validationError: validationErrors.siteId
                    ? { message: validationErrors.siteId }
                    : null,
                  validationMessageMode: "always",
                  dropDownOptions: {
                    container: "body",
                  },
                }}
              >
                <Label text="Site" />
              </SimpleItem>

              <SimpleItem
                key={`tank-${formData.siteId || 'empty'}-${formData.tankId || 'none'}`}
                dataField="tankId"
                editorType="dxSelectBox"
                editorOptions={{
                  items: filteredTanks,
                  displayExpr: "name",
                  valueExpr: "id",
                  onValueChanged: handleTankChange,
                  disabled: !formData.siteId || formData.siteId === 0,
                  placeholder: !formData.siteId || formData.siteId === 0
                    ? "Select site first"
                    : filteredTanks.length > 0
                    ? "Select a tank"
                    : "No tanks available",
                  width: "100%",
                  searchEnabled: true,
                  showClearButton: true,
                  isValid: hasAttemptedSubmit ? !validationErrors.tankId : true,
                  validationError: validationErrors.tankId
                    ? { message: validationErrors.tankId }
                    : null,
                  validationMessageMode: "always",
                  dropDownOptions: {
                    container: "body",
                  },
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
              {formData.tankId > 0 && (
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
                  value: formData.amount,
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

            {/* Future Records Warning */}
            {(showWarning || validationError) && (
              <div className="tw-mb-4">
                <FutureRecordsWarning
                  validationResult={validationResult}
                  onConfirm={confirmProceed}
                  onCancel={cancelProceed}
                  isVisible={showWarning}
                />
                {validationError && (
                  <div className="tw-mt-2 tw-p-3 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded tw-text-red-700">
                    <i className="fa-light fa-exclamation-triangle tw-mr-2"></i>
                    {validationError}
                  </div>
                )}
              </div>
            )}

            {/* Tank Volume History Section - Only show if tank is selected */}
            {formData.siteId > 0 && formData.tankId > 0 && showVolumeHistory && (
              <div className="tw-mt-6 tw-mb-6">
                <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-shadow-sm">
                  <div className="tw-p-4 tw-border-b tw-border-gray-200 tw-flex tw-items-start tw-justify-between">
                    <div className="tw-flex-1">
                      <h4 className="tw-font-semibold tw-text-gray-800">
                        <i className="fa-light fa-history tw-mr-2 tw-text-blue-600"></i>
                        Tank Volume History
                      </h4>
                      <p className="tw-text-sm tw-text-gray-600">
                        Recent volume changes for selected tank. Use search and
                        filters to analyze transaction data. Negative values
                        indicate fuel dispensed or transferred out.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowVolumeHistory(false)}
                      className="tw-ml-3 tw-text-gray-600 hover:tw-text-gray-800 tw-transition-colors tw-cursor-pointer tw-bg-transparent tw-border-0 tw-p-1"
                      title="Hide volume history"
                    >
                      <i className="fa-light fa-times tw-text-lg"></i>
                    </button>
                  </div>

                  <div className="tw-p-4">
                    {Array.isArray(tankVolumeHistory) &&
                    tankVolumeHistory.length > 0 ? (
                      <DataGrid
                        dataSource={tankVolumeHistory}
                        showBorders={true}
                        columnAutoWidth={true}
                        height="400px"
                        width="100%"
                        columnResizingMode="widget"
                        allowColumnResizing={true}
                        className="tw-text-sm"
                      >
                        <GroupPanel visible={false} />
                        <Grouping autoExpandAll={false} />
                        {/* Search functionality */}
                        <SearchPanel
                          visible={true}
                          highlightCaseSensitive={true}
                        />
                        {/* Column chooser */}
                        <ColumnChooser enabled={true} />
                        {/* Header filter */}
                        <HeaderFilter visible={true} />
                        {/* Filter row */}
                        <FilterRow visible={true} />{" "}
                        {/* Transaction Type Column */}
                        <Column
                          dataField="timestamp"
                          caption="Date/Time"
                          dataType="datetime"
                          format="dd/MM/yyyy HH:mm"
                          width="140"
                          sortOrder="desc"
                        />
                        <Column
                          dataField="volumeChange"
                          caption="Volume Change (L)"
                          dataType="number"
                          format="#,##0.00"
                          width="120"
                          cellRender={(cellData) => (
                            <span
                              className={
                                cellData.value >= 0
                                  ? "tw-text-green-600 tw-font-medium"
                                  : "tw-text-red-600 tw-font-medium"
                              }
                            >
                              {cellData.value >= 0 ? "+" : ""}
                              {cellData.value?.toFixed(2)}
                            </span>
                          )}
                        />
                        <Column
                          dataField="newVolume"
                          caption="Resulting Volume (L)"
                          dataType="number"
                          format="#,##0.00"
                          width="130"
                        />
                        <Column
                          dataField="recordedByUserName"
                          caption="Recorded By"
                          width="110"
                        />
                        <Column
                          dataField="vehicleName"
                          caption="Vehicle"
                          width="100"
                        />
                        <Column
                          dataField="referenceType"
                          caption="Reference"
                          width="100"
                        />
                      </DataGrid>
                    ) : (
                      <div className="tw-text-center tw-py-8">
                        <i className="fa-light fa-inbox tw-text-gray-400 tw-text-3xl tw-mb-3"></i>
                        <p className="tw-text-gray-500">
                          No volume history available for this tank
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="tw-flex tw-justify-end tw-space-x-3 tw-mt-6 tw-pt-6 tw-border-t tw-border-gray-200">
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
                disabled={isSubmitting || !canSubmit}
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
      </div>
    </div>
  );
};

export default ClosingStockForm;
