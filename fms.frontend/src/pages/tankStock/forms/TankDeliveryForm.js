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
import { SelectBox } from "devextreme-react/select-box";
import { DateBox } from "devextreme-react/date-box";
import { NumberBox } from "devextreme-react/number-box";
import notify from "devextreme/ui/notify";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import {
  fetchTanks,
  fetctTankbySiteId,
} from "../../../redux/actions/tankActions";
import { fetchSuppliers } from "../../../redux/actions/SupplierActions";
import { createDelivery } from "../../../redux/actions/DeliveryActions";
import "./_m365-form-common.scss";
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
    <div className="m365-form-body">
      <div className="m365-form-body__scroll">

        {/* ── General Details ─────────────────────────────── */}
        <div className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-circle-info m365-section-group__icon"></i>
            <span className="m365-section-group__title">General Details</span>
          </div>
          <div className="m365-section-group__body">
            <div className="m365-field-row">
              <div className="m365-field">
                <label className="m365-field__label">
                  Delivery Date &amp; Time <span className="m365-required">*</span>
                </label>
                <DateBox
                  value={formData.deliveryDate}
                  max={new Date()}
                  displayFormat="yyyy-MM-dd HH:mm"
                  type="datetime"
                  pickerType="calendar"
                  width="100%"
                  disabled={combinedLoading}
                  onValueChanged={(e) => handleChange({ dataField: "deliveryDate", value: e.value })}
                  isValid={hasAttemptedSubmit ? !validationErrors.deliveryDate : true}
                  validationError={validationErrors.deliveryDate ? { message: validationErrors.deliveryDate } : null}
                  validationMessageMode="always"
                />
                {hasAttemptedSubmit && validationErrors.deliveryDate && (
                  <span className="m365-field__error">{validationErrors.deliveryDate}</span>
                )}
              </div>
              <div className="m365-field">
                <label className="m365-field__label">
                  Site <span className="m365-required">*</span>
                </label>
                <SelectBox
                  key={`site-${formData.siteId || "empty"}`}
                  items={sitesAvailable}
                  displayExpr="name"
                  valueExpr="id"
                  value={formData.siteId}
                  onValueChanged={handleSiteChange}
                  searchEnabled={true}
                  showClearButton={true}
                  width="100%"
                  disabled={combinedLoading}
                  placeholder={
                    combinedLoading
                      ? "Loading sites..."
                      : sitesAvailable.length > 0
                        ? "Select site"
                        : "No sites available"
                  }
                  isValid={hasAttemptedSubmit ? !validationErrors.siteId : true}
                  validationError={validationErrors.siteId ? { message: validationErrors.siteId } : null}
                  validationMessageMode="always"
                />
                {hasAttemptedSubmit && validationErrors.siteId && (
                  <span className="m365-field__error">{validationErrors.siteId}</span>
                )}
              </div>
            </div>
            <div className="m365-field-row">
              <div className="m365-field">
                <label className="m365-field__label">
                  Tank <span className="m365-required">*</span>
                </label>
                <SelectBox
                  key={`tank-${formData.siteId || "empty"}-${formData.tankId || "none"}`}
                  items={filteredTanks}
                  displayExpr="name"
                  valueExpr="id"
                  value={formData.tankId}
                  disabled={!formData.siteId || combinedLoading}
                  searchEnabled={true}
                  showClearButton={true}
                  width="100%"
                  placeholder={
                    !formData.siteId
                      ? "Select site first"
                      : filteredTanks.length > 0
                        ? "Select tank"
                        : "No tanks available"
                  }
                  onValueChanged={(e) => handleChange({ dataField: "tankId", value: e.value })}
                  isValid={hasAttemptedSubmit ? !validationErrors.tankId : true}
                  validationError={validationErrors.tankId ? { message: validationErrors.tankId } : null}
                  validationMessageMode="always"
                />
                {hasAttemptedSubmit && validationErrors.tankId && (
                  <span className="m365-field__error">{validationErrors.tankId}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Delivery Details ────────────────────────────── */}
        <div className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-truck-ramp-box m365-section-group__icon"></i>
            <span className="m365-section-group__title">Delivery Details</span>
          </div>
          <div className="m365-section-group__body">
            <div className="m365-field-row">
              <div className="m365-field">
                <label className="m365-field__label">
                  Manual Delivery Amount (L) <span className="m365-required">*</span>
                </label>
                <NumberBox
                  value={formData.manualDeliveryAmount}
                  width="100%"
                  format="#,##0.00"
                  placeholder="Enter manual delivery amount"
                  disabled={combinedLoading}
                  onValueChanged={(e) => handleChange({ dataField: "manualDeliveryAmount", value: e.value })}
                  isValid={hasAttemptedSubmit ? !validationErrors.manualDeliveryAmount : true}
                  validationError={validationErrors.manualDeliveryAmount ? { message: validationErrors.manualDeliveryAmount } : null}
                  validationMessageMode="always"
                />
                {hasAttemptedSubmit && validationErrors.manualDeliveryAmount && (
                  <span className="m365-field__error">{validationErrors.manualDeliveryAmount}</span>
                )}
              </div>
              <div className="m365-field">
                <label className="m365-field__label">Sensor Delivery Amount (L)</label>
                <NumberBox
                  value={formData.sensorDeliveryAmount}
                  width="100%"
                  format="#,##0.00"
                  placeholder="Enter sensor delivery amount (optional)"
                  disabled={combinedLoading}
                  onValueChanged={(e) => handleChange({ dataField: "sensorDeliveryAmount", value: e.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Delivery Measurements ───────────────────────── */}
        <div className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-ruler-combined m365-section-group__icon"></i>
            <span className="m365-section-group__title">Delivery Measurements</span>
          </div>
          <div className="m365-section-group__body">
            <div className="m365-field-row">
              <div className="m365-field">
                <label className="m365-field__label">Delivery Temperature (°C)</label>
                <NumberBox
                  value={formData.deliveryTemperature}
                  width="100%"
                  format="#,##0.00"
                  placeholder="Enter temperature (optional)"
                  disabled={combinedLoading}
                  onValueChanged={(e) => handleChange({ dataField: "deliveryTemperature", value: e.value })}
                />
              </div>
              <div className="m365-field">
                <label className="m365-field__label">Delivery Density (kg/L)</label>
                <NumberBox
                  value={formData.deliveryDensity}
                  width="100%"
                  format="#,##0.0000"
                  placeholder="Enter density (optional)"
                  disabled={combinedLoading}
                  onValueChanged={(e) => handleChange({ dataField: "deliveryDensity", value: e.value })}
                />
              </div>
            </div>
            <div className="m365-field-row">
              <div className="m365-field">
                <label className="m365-field__label">Delivery Mass (kg)</label>
                <NumberBox
                  value={formData.deliveryMass}
                  width="100%"
                  format="#,##0.00"
                  placeholder="Enter mass (optional)"
                  disabled={combinedLoading}
                  onValueChanged={(e) => handleChange({ dataField: "deliveryMass", value: e.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Supplier Details ────────────────────────────── */}
        <div className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-building m365-section-group__icon"></i>
            <span className="m365-section-group__title">Supplier Details</span>
          </div>
          <div className="m365-section-group__body">
            <div className="m365-field-row">
              <div className="m365-field">
                <label className="m365-field__label">
                  Supplier <span className="m365-required">*</span>
                </label>
                <SelectBox
                  items={suppliers}
                  displayExpr="name"
                  valueExpr="id"
                  value={formData.supplierId}
                  searchEnabled={true}
                  showClearButton={true}
                  width="100%"
                  placeholder="Select supplier"
                  disabled={combinedLoading}
                  onValueChanged={(e) => handleChange({ dataField: "supplierId", value: e.value })}
                  isValid={hasAttemptedSubmit ? !validationErrors.supplierId : true}
                  validationError={validationErrors.supplierId ? { message: validationErrors.supplierId } : null}
                  validationMessageMode="always"
                />
                {hasAttemptedSubmit && validationErrors.supplierId && (
                  <span className="m365-field__error">{validationErrors.supplierId}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Historical Entry Notice ─────────────────────── */}
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
                <div className="m365-info-banner m365-info-banner--warning">
                  <i className="fa-light fa-calendar-clock m365-info-banner__icon"></i>
                  <div className="m365-info-banner__content">
                    <span className="m365-info-banner__title">Historical Entry Detected</span>
                    <span className="m365-info-banner__text">
                      You are creating a tank delivery for{" "}
                      <strong>{selectedDate.toLocaleDateString()}</strong>{" "}
                      (backdated entry).
                      <br />
                      <strong>Impact:</strong> This will recalculate the tank's
                      current stock and affect all subsequent records.
                    </span>
                  </div>
                  <button
                    className="m365-info-banner__dismiss"
                    onClick={() => setShowHistoricalNotice(false)}
                    title="Dismiss"
                  >
                    <i className="fa-light fa-xmark"></i>
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
          <div className="m365-info-banner m365-info-banner--loading">
            <LoadIndicator height={20} width={20} />
            <div className="m365-info-banner__content">
              <span className="m365-info-banner__text">Validating historical entry...</span>
            </div>
          </div>
        )}

        {/* Backend Error Display */}
        {backendError && (
          <div className="m365-info-banner m365-info-banner--error">
            <i className="fa-light fa-circle-exclamation m365-info-banner__icon"></i>
            <div className="m365-info-banner__content">
              <span className="m365-info-banner__title">Error Creating Delivery</span>
              <span className="m365-info-banner__text">{backendError.message}</span>
            </div>
          </div>
        )}

      </div>

      {/* ── Form Actions ───────────────────────────────── */}
      <div className="m365-form-actions">
        <button
          className="m365-btn m365-btn--ghost"
          onClick={onCancel}
          disabled={combinedLoading}
        >
          Cancel
        </button>
        <button
          className="m365-btn m365-btn--primary"
          onClick={handleSubmit}
          disabled={combinedLoading || isValidating || !canSubmitForm}
        >
          {isSubmitting ? (
            <><i className="fa-light fa-spinner fa-spin"></i> Saving...</>
          ) : (
            "Save Delivery"
          )}
        </button>
      </div>
    </div>
  );
};

export default TankDeliveryForm;
