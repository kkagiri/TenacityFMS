/**
 * File: TankDeliveryForm.js
 * Purpose: Capture tank delivery details, validate entries, and dispatch API calls to create deliveries in the backend
 * Dependencies: React, Redux Toolkit, DevExtreme Form components, siteActions, tankActions, SupplierActions, DeliveryActions
 * Last Modified: 2025-11-27
 *
 * Key Functions/Components:
 * - TankDeliveryForm: Main component orchestrating delivery data entry, validation, and submission
 * - handleSiteChange: Filters tanks by site with API fallback when local cache is empty
 * - handleChange: Syncs DevExtreme form changes with React state and parent callbacks
 * - handleSubmit: Validates form and dispatches createDelivery Redux action to backend API
 * - useTankStockFormData: Shared context for persisting date and site across forms
 */
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Form,
  SimpleItem,
  GroupItem,
  Label,
  RequiredRule,
  NumericRule,
} from "devextreme-react/form";
import { Button } from "devextreme-react";
import notify from "devextreme/ui/notify";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import {
  fetchTanks,
  fetctTankbySiteId,
} from "../../../redux/actions/tankActions";
import { fetchSuppliers } from "../../../redux/actions/SupplierActions"; // Assuming you have this action
import { createDelivery } from "../../../redux/actions/DeliveryActions";
//import './deliveryForm.scss';
import ScrollView from "devextreme-react/scroll-view";
import LoadIndicator from "devextreme-react/load-indicator";
import FutureRecordsWarning from "../../../components/tank-stock/FutureRecordsWarning";
import { useFutureRecordsValidation } from "../../../hooks/useFutureRecordsValidation";
import { VolumeChangeReasons } from "../../../services/tankStockFutureRecordsService";
import { useTankStockFormData } from "../shared/context/TankStockFormContext";

const TankDeliveryForm = ({
  updateFormData,
  isLoading,
  onSubmit,
  onCancel,
  sites: sitesProp = [],
  tanks: tanksProp = [],
}) => {
  const dispatch = useDispatch();
  const sitesState = useSelector((state) => state.site.sites || []);
  const tanksState = useSelector((state) => state.tank.tanks || []);
  const suppliers = useSelector((state) => state.supplier.suppliers || []);
  const [filteredTanks, setFilteredTanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendError, setBackendError] = useState(null);

  const usingPropSites = Array.isArray(sitesProp) && sitesProp.length > 0;
  const usingPropTanks = Array.isArray(tanksProp) && tanksProp.length > 0;
  const sitesAvailable = usingPropSites ? sitesProp : sitesState;
  const tanksAvailable = usingPropTanks ? tanksProp : tanksState;
  const combinedLoading = isLoading || loading || isSubmitting;

  // ✅ Get shared form data from context
  const {
    date: sharedDate,
    siteId: sharedSiteId,
    updateDate,
    updateSiteId,
  } = useTankStockFormData();

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
    siteId: sharedSiteId, // Initialize from shared context
    tankId: null,
    deliveryDate: sharedDate, // Initialize from shared context
    manualDeliveryAmount: null,
    sensorDeliveryAmount: null,
    deliveryTemperature: null,
    deliveryDensity: null,
    deliveryMass: null,
    supplierId: null,
  });

  // Validation errors state for visual feedback
  const [validationErrors, setValidationErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [showHistoricalNotice, setShowHistoricalNotice] = useState(true);

  useEffect(() => {
    const sitesReady = sitesAvailable.length > 0;
    const tanksReady = tanksAvailable.length > 0;

    if (sitesReady && tanksReady) {
      if (!dataLoaded) {
        setDataLoaded(true);
      }
      return;
    }

    const initializeData = async () => {
      try {
        if (!sitesReady && !usingPropSites) {
          await dispatch(fetchSiteList());
        }
        if (!tanksReady && !usingPropTanks) {
          await dispatch(fetchTanks());
        }
        setDataLoaded(true);
      } catch (error) {
        console.error("TankDeliveryForm - Failed to load initial data:", error);
        notify({
          message: "Failed to load delivery form data. Please try again.",
          type: "error",
          displayTime: 4000,
        });
      }
    };

    initializeData();
  }, [
    dispatch,
    sitesAvailable.length,
    tanksAvailable.length,
    dataLoaded,
    usingPropSites,
    usingPropTanks,
  ]);

  useEffect(() => {
    if (!suppliers || suppliers.length === 0) {
      dispatch(fetchSuppliers());
    }
  }, [dispatch, suppliers]);

  useEffect(() => {
    if (!formData.siteId) {
      return;
    }

    const tanksForSite = tanksAvailable.filter(
      (tank) => tank.siteId === formData.siteId
    );

    if (tanksForSite.length > 0) {
      setFilteredTanks(tanksForSite);
    }
  }, [formData.siteId, tanksAvailable]);

  const handleChange = useCallback(
    async (e) => {
      const { dataField, value } = e;

      setFormData((prev) => {
        const updated = { ...prev, [dataField]: value };

        if (typeof updateFormData === "function") {
          updateFormData(updated);
        }

        return updated;
      });

      // ✅ Update shared context when date or site changes
      if (dataField === "deliveryDate") {
        updateDate(value);
      } else if (dataField === "siteId") {
        updateSiteId(value);
      }

      // Clear validation error for this field when user changes it
      setValidationErrors((prev) => ({ ...prev, [dataField]: null }));

      // Handle tank change - validate historical entry
      if (dataField === "tankId" && value && formData.deliveryDate) {
        resetValidation();
        try {
          await validateHistoricalEntry(
            value,
            formData.deliveryDate,
            VolumeChangeReasons.DELIVERY
          );
        } catch (error) {
          console.warn("Validation error:", error);
        }
      }

      // Handle date change - validate historical entry
      if (dataField === "deliveryDate" && value && formData.tankId) {
        resetValidation();
        try {
          await validateHistoricalEntry(
            formData.tankId,
            value,
            VolumeChangeReasons.DELIVERY
          );
        } catch (error) {
          console.warn("Validation error:", error);
        }
      }
    },
    [
      updateFormData,
      formData.deliveryDate,
      formData.tankId,
      resetValidation,
      validateHistoricalEntry,
      updateDate,
      updateSiteId,
    ]
  );

  // Validation function
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.siteId) errors.siteId = "Site is required";
    if (!formData.tankId) errors.tankId = "Tank is required";
    if (!formData.deliveryDate)
      errors.deliveryDate = "Delivery date is required";
    if (!formData.manualDeliveryAmount || formData.manualDeliveryAmount <= 0)
      errors.manualDeliveryAmount =
        "Manual delivery amount must be greater than 0";
    if (!formData.supplierId) errors.supplierId = "Supplier is required";

    return errors;
  }, [formData]);

  // Handle submit with validation and API call
  const handleSubmit = useCallback(async () => {
    console.log("🚀 TankDeliveryForm - handleSubmit called");
    console.log("📋 Form Data:", formData);

    setHasAttemptedSubmit(true);
    const errors = validateForm();
    setValidationErrors(errors);

    console.log("✅ Validation errors:", errors);

    if (Object.keys(errors).length > 0) {
      console.warn("❌ Validation failed - form has errors");
      notify({
        message: "Please fill in all required fields correctly",
        type: "error",
        displayTime: 3000,
      });
      return;
    }

    // Check if we can submit based on future records validation
    if (!canSubmitForm) {
      console.warn("⚠️ Cannot submit - future records validation not passed");
      notify({
        message: "Please resolve validation warnings before submitting",
        type: "warning",
        displayTime: 4000,
      });
      return;
    }

    console.log("🔄 Starting API call...");
    setIsSubmitting(true);
    setBackendError(null);

    try {
      // Prepare the data in the format expected by the backend DTO
      const deliveryDTO = {
        tankId: formData.tankId,
        deliveryDate: formData.deliveryDate
          ? new Date(formData.deliveryDate).toISOString()
          : null,
        manualDeliveryAmount: formData.manualDeliveryAmount,
        sensorDeliveryAmount: formData.sensorDeliveryAmount,
        deliveryTemperature: formData.deliveryTemperature,
        deliveryDensity: formData.deliveryDensity,
        deliveryMass: formData.deliveryMass,
        supplierId: formData.supplierId,
      };

      console.log("📤 Sending to API:", deliveryDTO);

      // Dispatch the create delivery action
      const response = await dispatch(createDelivery(deliveryDTO));

      console.log("📥 API Response:", response);

      // Check for success
      if (response && response.success === true) {
        console.log("✅ Delivery created successfully");
        notify({
          message: response.message || "Delivery created successfully",
          type: "success",
          displayTime: 3000,
        });

        // Close the form on success
        if (onCancel) {
          onCancel();
        }
        if (onSubmit) {
          onSubmit(formData);
        }
      } else {
        // Handle failure
        console.error("❌ Delivery creation failed:", response);
        const errorMessage = response?.message || "Failed to create delivery";
        setBackendError({
          message: errorMessage,
          type: "error",
        });
        notify({
          message: errorMessage,
          type: "error",
          displayTime: 4000,
        });
      }
    } catch (error) {
      console.error("💥 TankDeliveryForm - Error creating delivery:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error creating delivery";
      setBackendError({
        message: errorMessage,
        type: "error",
      });
      notify({
        message: errorMessage,
        type: "error",
        displayTime: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit, onCancel, canSubmitForm, dispatch]);

  const handleSiteChange = useCallback(
    async (e) => {
      const siteId = e.value;
      setFormData((prevData) => ({
        ...prevData,
        siteId: siteId,
        tankId: null,
      }));
      setFilteredTanks([]);

      // Clear validation errors for site and tank
      setValidationErrors((prev) => ({ ...prev, siteId: null, tankId: null }));

      if (!siteId) {
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
            "TankDeliveryForm - Failed to load tanks for site:",
            error
          );
          notify({
            message:
              "Unable to load tanks for the selected site. Please try again.",
            type: "error",
            displayTime: 4000,
          });
        } finally {
          setLoading(false);
        }
      }

      setFilteredTanks(tanksForSite);
    },
    [dispatch, tanksAvailable, usingPropTanks]
  );

  return (
    <div className="tank-transfer-form tw-h-full tw-flex tw-flex-col">
      <ScrollView showScrollbar="always" scrollByThumb={true}>
        <div className="tw-p-6">
          <Form
            formData={formData}
            readOnly={combinedLoading}
            showColonAfterLabel={true}
            labelLocation="top"
            onFieldDataChanged={handleChange}
          >
            <GroupItem caption="General Details" colCount={2}>
              <SimpleItem
                dataField="deliveryDate"
                editorType="dxDateBox"
                editorOptions={{
                  value: formData.deliveryDate,
                  max: new Date(),
                  displayFormat: "yyyy-MM-dd HH:mm",
                  type: "datetime",
                  pickerType: "calendar",
                  width: "100%",
                  isValid: hasAttemptedSubmit
                    ? !validationErrors.deliveryDate
                    : true,
                  validationError: validationErrors.deliveryDate
                    ? { message: validationErrors.deliveryDate }
                    : null,
                  validationMessageMode: "always",
                }}
              >
                <Label text="Delivery Date & Time" />
                <RequiredRule message="Date and time are required" />
              </SimpleItem>
              <SimpleItem
                key={`site-${formData.siteId || "empty"}`}
                dataField="siteId"
                editorType="dxSelectBox"
                editorOptions={{
                  items: sitesAvailable,
                  displayExpr: "name",
                  valueExpr: "id",
                  value: formData.siteId,
                  onValueChanged: handleSiteChange,
                  searchEnabled: true,
                  showClearButton: true,
                  width: "100%",
                  placeholder: combinedLoading
                    ? "Loading sites..."
                    : sitesAvailable.length > 0
                    ? "Select site"
                    : "No sites available",
                  isValid: hasAttemptedSubmit ? !validationErrors.siteId : true,
                  validationError: validationErrors.siteId
                    ? { message: validationErrors.siteId }
                    : null,
                  validationMessageMode: "always",
                }}
              >
                <Label text="Site" />
                <RequiredRule message="Site is required" />
              </SimpleItem>
              <SimpleItem
                key={`tank-${formData.siteId || "empty"}-${
                  formData.tankId || "none"
                }`}
                dataField="tankId"
                editorType="dxSelectBox"
                editorOptions={{
                  items: filteredTanks,
                  displayExpr: "name",
                  valueExpr: "id",
                  value: formData.tankId,
                  disabled: !formData.siteId,
                  searchEnabled: true,
                  showClearButton: true,
                  width: "100%",
                  placeholder: !formData.siteId
                    ? "Select site first"
                    : filteredTanks.length > 0
                    ? "Select tank"
                    : "No tanks available",
                  isValid: hasAttemptedSubmit ? !validationErrors.tankId : true,
                  validationError: validationErrors.tankId
                    ? { message: validationErrors.tankId }
                    : null,
                  validationMessageMode: "always",
                }}
              >
                <Label text="Tank" />
                <RequiredRule message="Tank is required" />
              </SimpleItem>
            </GroupItem>
            <GroupItem caption="Delivery Details" colCount={2}>
              <SimpleItem
                dataField="manualDeliveryAmount"
                editorType="dxNumberBox"
                editorOptions={{
                  value: formData.manualDeliveryAmount,
                  width: "100%",
                  format: "#,##0.00",
                  placeholder: "Enter manual delivery amount",
                  isValid: hasAttemptedSubmit
                    ? !validationErrors.manualDeliveryAmount
                    : true,
                  validationError: validationErrors.manualDeliveryAmount
                    ? { message: validationErrors.manualDeliveryAmount }
                    : null,
                  validationMessageMode: "always",
                }}
              >
                <Label text="Manual Delivery Amount (L)" />
                <RequiredRule message="Manual Delivery Amount is required" />
                <NumericRule
                  min={0.01}
                  message="Amount must be greater than 0"
                />
              </SimpleItem>

              <SimpleItem
                dataField="sensorDeliveryAmount"
                editorType="dxNumberBox"
                editorOptions={{
                  value: formData.sensorDeliveryAmount,
                  width: "100%",
                  format: "#,##0.00",
                  placeholder: "Enter sensor delivery amount (optional)",
                }}
              >
                <Label text="Sensor Delivery Amount (L)" />
                <NumericRule min={0} message="Value cannot be negative" />
              </SimpleItem>
            </GroupItem>
            <GroupItem caption="Delivery Measurements" colCount={2}>
              <SimpleItem
                dataField="deliveryTemperature"
                editorType="dxNumberBox"
                editorOptions={{
                  value: formData.deliveryTemperature,
                  width: "100%",
                  format: "#,##0.00",
                  placeholder: "Enter temperature (optional)",
                }}
              >
                <Label text="Delivery Temperature (°C)" />
                <NumericRule min={0} message="Value cannot be negative" />
              </SimpleItem>
              <SimpleItem
                dataField="deliveryDensity"
                editorType="dxNumberBox"
                editorOptions={{
                  value: formData.deliveryDensity,
                  width: "100%",
                  format: "#,##0.0000",
                  placeholder: "Enter density (optional)",
                }}
              >
                <Label text="Delivery Density (kg/L)" />
                <NumericRule min={0} message="Value cannot be negative" />
              </SimpleItem>
              <SimpleItem
                dataField="deliveryMass"
                editorType="dxNumberBox"
                editorOptions={{
                  value: formData.deliveryMass,
                  width: "100%",
                  format: "#,##0.00",
                  placeholder: "Enter mass (optional)",
                }}
              >
                <Label text="Delivery Mass (kg)" />
                <NumericRule min={0} message="Value cannot be negative" />
              </SimpleItem>
            </GroupItem>
            <GroupItem caption="Supplier Details" colCount={2}>
              <SimpleItem
                dataField="supplierId"
                editorType="dxSelectBox"
                editorOptions={{
                  items: suppliers,
                  displayExpr: "name",
                  valueExpr: "id",
                  value: formData.supplierId,
                  searchEnabled: true,
                  showClearButton: true,
                  width: "100%",
                  placeholder: "Select supplier",
                  isValid: hasAttemptedSubmit
                    ? !validationErrors.supplierId
                    : true,
                  validationError: validationErrors.supplierId
                    ? { message: validationErrors.supplierId }
                    : null,
                  validationMessageMode: "always",
                }}
              >
                <Label text="Supplier" />
                <RequiredRule message="Supplier is required" />
              </SimpleItem>
            </GroupItem>
          </Form>

          {/* Historical Entry Information Notice */}
          {formData.deliveryDate &&
            formData.tankId &&
            !isValidating &&
            !showWarning &&
            !validationError &&
            (() => {
              const selectedDate = new Date(formData.deliveryDate);
              const today = new Date();
              const isHistorical =
                selectedDate < new Date(today.setHours(0, 0, 0, 0));

              if (isHistorical && showHistoricalNotice) {
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
                            You are creating a tank delivery for{" "}
                            <strong>{selectedDate.toLocaleDateString()}</strong>{" "}
                            (backdated entry).
                          </p>
                          <p className="tw-text-blue-700 tw-text-sm tw-mt-1">
                            <strong>Impact:</strong> This will recalculate the
                            tank's current stock and affect all subsequent
                            records.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowHistoricalNotice(false)}
                        className="tw-text-blue-600 hover:tw-text-blue-800 tw-transition-colors"
                        title="Dismiss"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          fontSize: "16px",
                        }}
                      >
                        <i className="fa-light fa-times"></i>
                      </button>
                    </div>
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
              className="tw-mb-4"
            />
          )}

          {/* Validating indicator */}
          {isValidating && (
            <div className="tw-mb-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3 tw-flex tw-items-center tw-space-x-3">
              <LoadIndicator height={20} width={20} />
              <span className="tw-text-blue-700 tw-text-sm">
                Validating historical entry...
              </span>
            </div>
          )}

          {/* Backend Error Display */}
          {backendError && (
            <div className="tw-mb-4 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-3">
              <div className="tw-flex tw-items-start">
                <i className="fa-light fa-circle-exclamation tw-text-red-600 tw-mt-0.5 tw-mr-3"></i>
                <div className="tw-flex-1">
                  <h4 className="tw-font-medium tw-text-red-800 tw-mb-1">
                    Error Creating Delivery
                  </h4>
                  <p className="tw-text-red-700 tw-text-sm">
                    {backendError.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
            <Button
              text="Cancel"
              onClick={onCancel}
              disabled={combinedLoading}
              className="tw-min-w-32"
              stylingMode="outlined"
            />
            <Button
              text={isSubmitting ? "Saving Delivery..." : "Save Delivery"}
              onClick={handleSubmit}
              disabled={combinedLoading || isValidating || !canSubmitForm}
              className="tw-min-w-32"
              type="default"
            />
          </div>
        </div>
      </ScrollView>
    </div>
  );
};

export default TankDeliveryForm;
