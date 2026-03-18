/**
 * File: TankTransferForm.js
 * Purpose: Coordinate tank-to-tank and site-to-site transfers leveraging shared site/tank datasets with validation safeguards.
 * Dependencies: React, Redux Toolkit, DevExtreme components, siteActions, tankActions, tankStockAction
 * Last Modified: 2026-02-10
 *
 * Key Functions/Components:
 * - TankTransferForm: Handles transfer workflow including validation and submission
 * - handleSourceSiteChange: Filters source tanks with API fallback when cache misses occur
 * - handleDestinationSiteChange: Maintains destination tank list honoring transfer type constraints
 * - useTankStockFormData: Shared context for persisting date and site across forms
 */
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SelectBox } from "devextreme-react/select-box";
import { DateBox } from "devextreme-react/date-box";
import { NumberBox } from "devextreme-react/number-box";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import { fetchTanks } from "../../../redux/actions/tankActions";
import { createTankTransfer } from "../../../redux/actions/tankStockAction";
import { prepareTankTransferDTO } from "../../../utils/stockDataPreparation";
import LoadIndicator from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";
import "./_m365-form-common.scss";
import { IsolatedForm } from "../../../components/common/SignalRIsolation";

// Future records validation imports
import { useFutureRecordsValidation } from "../../../hooks/useFutureRecordsValidation";
import FutureRecordsWarning from "../../../components/tank-stock/FutureRecordsWarning";
import { VolumeChangeReasons } from "../../../services/tankStockFutureRecordsService";
import { useTankStockFormData } from "../shared/context/TankStockFormContext";

const TankTransferForm = ({
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
  const [dataLoaded, setDataLoaded] = useState(false);

  // Helper function for notifications with consistent positioning
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

  const usingPropSites = Array.isArray(sitesProp) && sitesProp.length > 0;
  const usingPropTanks = Array.isArray(tanksProp) && tanksProp.length > 0;
  const sitesAvailable = usingPropSites ? sitesProp : sitesState;
  const tanksAvailable = usingPropTanks ? tanksProp : tanksState;

  // ✅ Get shared form data from context
  const {
    date: sharedDate,
    siteId: sharedSiteId,
    updateDate,
    updateSiteId,
  } = useTankStockFormData();

  const [filteredSourceTanks, setFilteredSourceTanks] = useState([]);
  const [filteredDestinationTanks, setFilteredDestinationTanks] = useState([]);
  const [loading] = useState(false);

  const findTankById = useCallback(
    (tankId) => {
      if (!tankId) return undefined;
      return (
        tanksAvailable.find((tank) => tank.id === tankId) ||
        filteredSourceTanks.find((tank) => tank.id === tankId) ||
        filteredDestinationTanks.find((tank) => tank.id === tankId)
      );
    },
    [tanksAvailable, filteredSourceTanks, filteredDestinationTanks]
  );
  const [formData, setFormData] = useState({
    sourceSiteId: sharedSiteId, // Initialize from shared context
    sourceTankId: null,
    destinationSiteId: null,
    destinationTankId: null,
    amount: null,
    date: sharedDate, // Initialize from shared context
    transferType: "InterTank", // InterTank, InterSite
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [showInfoNotice, setShowInfoNotice] = useState(true);
  const [showSourceTankInfo, setShowSourceTankInfo] = useState(false);
  const [showHistoricalNotice, setShowHistoricalNotice] = useState(true);

  useEffect(() => {
    if (formData.transferType !== "InterTank" || !formData.sourceSiteId) {
      return;
    }

    setFormData((prevData) => {
      const needsSiteSync = prevData.destinationSiteId !== prevData.sourceSiteId;
      const needsTankReset = prevData.destinationTankId === prevData.sourceTankId;

      if (!needsSiteSync && !needsTankReset) {
        return prevData;
      }

      return {
        ...prevData,
        destinationSiteId: prevData.sourceSiteId,
        destinationTankId: needsTankReset ? null : prevData.destinationTankId,
      };
    });
  }, [formData.transferType, formData.sourceSiteId, formData.sourceTankId]);

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

  const validateTransferEntry = useCallback(
    async (
      sourceTankId = formData.sourceTankId,
      destinationTankId = formData.destinationTankId,
      entryDate = formData.date
    ) => {
      if (!sourceTankId || !entryDate) {
        resetValidation();
        return;
      }

      const sourceResult = await validateHistoricalEntry(
        sourceTankId,
        entryDate,
        VolumeChangeReasons.TRANSFER_OUT
      );

      const shouldStopAfterSource =
        !sourceResult?.canProceed ||
        sourceResult?.needsUserConfirmation ||
        sourceResult?.validationResult?.config?.showWarning;

      if (shouldStopAfterSource || !destinationTankId) {
        return;
      }

      await validateHistoricalEntry(
        destinationTankId,
        entryDate,
        VolumeChangeReasons.TRANSFER_IN
      );
    },
    [
      formData.sourceTankId,
      formData.destinationTankId,
      formData.date,
      resetValidation,
      validateHistoricalEntry,
    ]
  );

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
        console.error("TankTransferForm - Error loading data:", error);
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
    },
    [updateFormData, updateDate]
  );

  const handleSourceSiteChange = useCallback(
    (e) => {
      const siteId = e?.value ?? null;
      setShowSourceTankInfo(false);

      // ✅ Update shared context when source site changes
      updateSiteId(siteId);

      setFormData((prevData) => {
        const isInterTank = prevData.transferType === "InterTank";

        const updatedData = {
          ...prevData,
          sourceSiteId: siteId,
          sourceTankId: null,
          sourceTankCurrentStock: null,
        };

        if (isInterTank) {
          updatedData.destinationSiteId = siteId;
          updatedData.destinationTankId = null;
        }

        if (!siteId) {
          return {
            ...updatedData,
            destinationSiteId: isInterTank
              ? null
              : updatedData.destinationSiteId,
            destinationTankId: null,
          };
        }

        return updatedData;
      });

      if (!siteId) {
        setFilteredSourceTanks([]);
        setFilteredDestinationTanks([]);
        return;
      }

      const tanksForSite = tanksAvailable.filter(
        (tank) => tank.siteId === siteId
      );
      setFilteredSourceTanks(tanksForSite);

      // When in InterTank mode, ensure destination list mirrors current site selection
      if (formData.transferType === "InterTank") {
        setFilteredDestinationTanks(tanksForSite);
      }
    },
    [formData.transferType, tanksAvailable, updateSiteId]
  );

  const handleDestinationSiteChange = useCallback(
    (e) => {
      const siteId = e.value;
      setFormData((prevData) => ({
        ...prevData,
        destinationSiteId: siteId,
        destinationTankId: null,
      }));

      const tanksForSite = tanksAvailable.filter(
        (tank) => tank.siteId === siteId
      );
      setFilteredDestinationTanks(tanksForSite);
    },
    [tanksAvailable]
  );

  const normalizeTank = (tank) => {
    if (!tank) return { currentStock: null };
    return { currentStock: tank.currentStock ?? tank.CurrentStock ?? null };
  };

  useEffect(() => {
    if (!formData.sourceSiteId) {
      return;
    }

    const tanksForSite = tanksAvailable.filter(
      (tank) => tank.siteId === formData.sourceSiteId
    );

    if (tanksForSite.length > 0) {
      setFilteredSourceTanks(tanksForSite);
    }
  }, [formData.sourceSiteId, tanksAvailable]);

  useEffect(() => {
    if (!formData.destinationSiteId) {
      return;
    }

    const excludeSourceTank = formData.transferType === "InterTank";
    const tanksForSite = tanksAvailable.filter((tank) => {
      if (tank.siteId !== formData.destinationSiteId) return false;
      if (excludeSourceTank && tank.id === formData.sourceTankId) {
        return false;
      }
      return true;
    });

    if (tanksForSite.length > 0) {
      setFilteredDestinationTanks(tanksForSite);
    }
  }, [
    formData.destinationSiteId,
    formData.transferType,
    formData.sourceTankId,
    tanksAvailable,
  ]);

  const handleSourceTankChange = useCallback(
    (e) => {
      const tankId = e.value;
      setFormData((prevData) => {
        const updatedData = {
          ...prevData,
          sourceTankId: tankId,
        };

        if (tankId && updatedData.date) {
          validateTransferEntry(tankId, null, updatedData.date);
        } else {
          resetValidation();
        }

        const selectedTank = findTankById(tankId);
        const norm = normalizeTank(selectedTank);
        updatedData.sourceTankCurrentStock = norm.currentStock;
        setShowSourceTankInfo(!!selectedTank);

        if (
          updatedData.transferType === "InterTank" &&
          updatedData.sourceSiteId
        ) {
          const sourceTanks = filteredSourceTanks.length
            ? filteredSourceTanks
            : tanksAvailable;
          const tanksForSite = sourceTanks.filter(
            (tank) =>
              tank.siteId === updatedData.sourceSiteId && tank.id !== tankId
          );
          setFilteredDestinationTanks(tanksForSite);
          updatedData.destinationTankId = null;
        }

        return updatedData;
      });
    },
    [
      validateTransferEntry,
      resetValidation,
      findTankById,
      filteredSourceTanks,
      tanksAvailable,
    ]
  );

  const handleDestinationTankChange = useCallback((e) => {
    const tankId = e.value;
    setFormData((prevData) => ({
      ...prevData,
      destinationTankId: tankId,
    }));

    // Clear validation errors for this field
    setValidationErrors((prev) => ({ ...prev, destinationTankId: null }));

    validateTransferEntry(formData.sourceTankId, tankId, formData.date);
  }, [formData.sourceTankId, formData.date, validateTransferEntry]);

  const handleDateChange = useCallback(
    (e) => {
      const newDate = e.value;
      updateDate(newDate);

      setFormData((prevData) => {
        const updatedData = {
          ...prevData,
          date: newDate,
        };

        if (newDate && updatedData.sourceTankId) {
          validateTransferEntry(
            updatedData.sourceTankId,
            updatedData.destinationTankId,
            newDate,
          );
        } else {
          resetValidation();
        }

        return updatedData;
      });

      setValidationErrors((prev) => ({ ...prev, date: null }));
    },
    [resetValidation, updateDate, validateTransferEntry]
  );

  const handleAmountChange = useCallback((e) => {
    const amount = e.value;
    setFormData((prevData) => ({
      ...prevData,
      amount: amount,
    }));
  }, []);

  const destinationTankItems =
    formData.transferType === "InterTank"
      ? filteredDestinationTanks.filter(
        (tank) => tank.id !== formData.sourceTankId
      )
      : filteredDestinationTanks;

  const handleTransferTypeChange = useCallback(
    (e) => {
      const transferType = e.value;

      setFormData((prevData) => {
        const updatedData = {
          ...prevData,
          transferType: transferType,
          destinationSiteId:
            transferType === "InterTank" ? prevData.sourceSiteId : null,
          destinationTankId: null,
        };

        // Update destination tanks based on transfer type
        if (transferType === "InterTank" && prevData.sourceSiteId) {
          const tanksForSite = tanksAvailable.filter(
            (tank) =>
              tank.siteId === prevData.sourceSiteId &&
              tank.id !== prevData.sourceTankId
          );
          setFilteredDestinationTanks(tanksForSite);
        } else {
          setFilteredDestinationTanks([]);
        }

        return updatedData;
      });
    },
    [tanksAvailable]
  );

  // reason removed

  const transferTypeOptions = [
    { id: "InterTank", name: "Between Tanks (Same Site)" },
    { id: "InterSite", name: "Between Sites" },
  ];

  // Validation logic
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.sourceSiteId) errors.sourceSiteId = "Source site is required";
    if (!formData.sourceTankId) errors.sourceTankId = "Source tank is required";
    if (!formData.destinationSiteId)
      errors.destinationSiteId = "Destination site is required";
    if (!formData.destinationTankId)
      errors.destinationTankId = "Destination tank is required";
    if (!formData.amount || formData.amount <= 0)
      errors.amount = "Valid transfer amount is required";
    if (!formData.date) errors.date = "Date is required";
    if (formData.sourceTankId === formData.destinationTankId)
      errors.destinationTankId =
        "Destination tank must be different from source tank";

    return errors;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    setHasAttemptedSubmit(true);
    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      showNotification(
        "Please fill in all required fields correctly",
        "error",
        3000
      );
      return;
    }

    // Check if submission is allowed based on future records validation
    if (!canSubmitForm) {
      showNotification(
        "Unable to submit due to future records policy. Please check the warnings above.",
        "error",
        5000
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const preparedData = prepareTankTransferDTO(formData);
      const response = await dispatch(createTankTransfer(preparedData));

      if (response.success) {
        showNotification(
          response.message || "Tank transfer created successfully",
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
          response.message || "Failed to create tank transfer",
          "error",
          5000
        );
      }
    } catch (error) {
      console.error("Error creating tank transfer:", error);
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
    canSubmitForm,
    resetValidation,
    showNotification,
  ]);

  return (
    <div className="m365-form-body">
      <div className="m365-form-body__scroll">

        {/* Loading indicator while fetching initial data */}
        {!dataLoaded &&
          (sitesAvailable.length === 0 || tanksAvailable.length === 0) && (
            <div className="m365-info-banner">
              <LoadIndicator width={"24px"} height={"24px"} visible={true} />
              <div className="m365-info-banner__content">
                <span className="m365-info-banner__text">Loading form data...</span>
              </div>
            </div>
          )}

        {loading && (
          <div className="m365-info-banner">
            <LoadIndicator width={"24px"} height={"24px"} visible={true} />
            <div className="m365-info-banner__content">
              <span className="m365-info-banner__text">Loading...</span>
            </div>
          </div>
        )}

        {/* ── Transfer Type ──────────────────────────────── */}
        <div className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-arrow-right-arrow-left m365-section-group__icon"></i>
            <span className="m365-section-group__title">Transfer Type</span>
          </div>
          <div className="m365-section-group__body">
            <div className="m365-toggle-group">
              <button
                className={`m365-toggle-btn ${formData.transferType === "InterTank" ? "m365-toggle-btn--active" : ""}`}
                onClick={() => handleTransferTypeChange({ value: "InterTank" })}
                disabled={isLoading}
                type="button"
              >
                <i className="fa-light fa-arrows-rotate"></i> Tank to Tank
              </button>
              <button
                className={`m365-toggle-btn ${formData.transferType === "InterSite" ? "m365-toggle-btn--active" : ""}`}
                onClick={() => handleTransferTypeChange({ value: "InterSite" })}
                disabled={isLoading}
                type="button"
              >
                <i className="fa-light fa-building-circle-arrow-right"></i> Site to Site
              </button>
            </div>
          </div>
        </div>

        {/* ── Source ──────────────────────────────────────── */}
        <div className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-arrow-right-from-bracket m365-section-group__icon"></i>
            <span className="m365-section-group__title">Source</span>
          </div>
          <div className="m365-section-group__body">
            <div className="m365-field-row">
              <div className="m365-field">
                <label className="m365-field__label">
                  Source Site <span className="m365-required">*</span>
                </label>
                <SelectBox
                  items={sitesAvailable}
                  displayExpr="name"
                  valueExpr="id"
                  value={formData.sourceSiteId}
                  onValueChanged={handleSourceSiteChange}
                  searchEnabled={true}
                  showClearButton={true}
                  width="100%"
                  disabled={isLoading}
                  placeholder="Select source site"
                  dropDownOptions={{ container: "body" }}
                  isValid={hasAttemptedSubmit ? !validationErrors.sourceSiteId : true}
                  validationError={validationErrors.sourceSiteId ? { message: validationErrors.sourceSiteId } : null}
                  validationMessageMode="always"
                />
                {hasAttemptedSubmit && validationErrors.sourceSiteId && (
                  <span className="m365-field__error">{validationErrors.sourceSiteId}</span>
                )}
              </div>
              <div className="m365-field">
                <label className="m365-field__label">
                  Source Tank <span className="m365-required">*</span>
                </label>
                <SelectBox
                  items={filteredSourceTanks}
                  displayExpr="name"
                  valueExpr="id"
                  value={formData.sourceTankId}
                  onValueChanged={handleSourceTankChange}
                  disabled={!formData.sourceSiteId || isLoading}
                  searchEnabled={true}
                  showClearButton={true}
                  width="100%"
                  placeholder={
                    !formData.sourceSiteId
                      ? "Select source site first"
                      : filteredSourceTanks.length === 0
                        ? "No tanks available"
                        : "Select source tank"
                  }
                  dropDownOptions={{ container: "body" }}
                  isValid={hasAttemptedSubmit ? !validationErrors.sourceTankId : true}
                  validationError={validationErrors.sourceTankId ? { message: validationErrors.sourceTankId } : null}
                  validationMessageMode="always"
                />
                {hasAttemptedSubmit && validationErrors.sourceTankId && (
                  <span className="m365-field__error">{validationErrors.sourceTankId}</span>
                )}
              </div>
            </div>

            {/* Source Tank Info Panel */}
            {formData.sourceTankId && showSourceTankInfo && (
              <div className="m365-tank-info">
                <div className="m365-tank-info__header">
                  <i className="fa-light fa-gas-pump m365-section-group__icon"></i>
                  <span>Source Tank Overview</span>
                  <button
                    className="m365-info-banner__dismiss"
                    onClick={() => setShowSourceTankInfo(false)}
                    title="Dismiss"
                  >
                    <i className="fa-light fa-xmark"></i>
                  </button>
                </div>
                <div className="m365-tank-info__item">
                  <span className="m365-tank-info__label">Book Balance</span>
                  <span className="m365-tank-info__value">
                    {formData.sourceTankCurrentStock != null
                      ? `${Number(formData.sourceTankCurrentStock).toLocaleString()} L`
                      : "N/A"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Destination ────────────────────────────────── */}
        <div className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-arrow-right-to-bracket m365-section-group__icon"></i>
            <span className="m365-section-group__title">Destination</span>
          </div>
          <div className="m365-section-group__body">
            <div className="m365-field-row">
              <div className="m365-field">
                <label className="m365-field__label">
                  Destination Site <span className="m365-required">*</span>
                </label>
                <SelectBox
                  key={`destination-site-${formData.destinationSiteId || "empty"}-${formData.transferType}`}
                  items={sitesAvailable}
                  displayExpr="name"
                  valueExpr="id"
                  value={formData.destinationSiteId}
                  onValueChanged={handleDestinationSiteChange}
                  searchEnabled={true}
                  disabled={formData.transferType === "InterTank" || isLoading}
                  showClearButton={true}
                  width="100%"
                  placeholder="Select destination site"
                  dropDownOptions={{ container: "body" }}
                  isValid={hasAttemptedSubmit ? !validationErrors.destinationSiteId : true}
                  validationError={validationErrors.destinationSiteId ? { message: validationErrors.destinationSiteId } : null}
                  validationMessageMode="always"
                />
                {hasAttemptedSubmit && validationErrors.destinationSiteId && (
                  <span className="m365-field__error">{validationErrors.destinationSiteId}</span>
                )}
                {formData.transferType === "InterTank" && (
                  <span className="m365-field__hint">Auto-set to source site for tank-to-tank transfers</span>
                )}
              </div>
              <div className="m365-field">
                <label className="m365-field__label">
                  Destination Tank <span className="m365-required">*</span>
                </label>
                <SelectBox
                  items={destinationTankItems}
                  displayExpr="name"
                  valueExpr="id"
                  value={formData.destinationTankId}
                  onValueChanged={handleDestinationTankChange}
                  disabled={!formData.destinationSiteId || isLoading}
                  searchEnabled={true}
                  showClearButton={true}
                  width="100%"
                  placeholder="Select destination tank"
                  dropDownOptions={{ container: "body" }}
                  isValid={hasAttemptedSubmit ? !validationErrors.destinationTankId : true}
                  validationError={validationErrors.destinationTankId ? { message: validationErrors.destinationTankId } : null}
                  validationMessageMode="always"
                />
                {hasAttemptedSubmit && validationErrors.destinationTankId && (
                  <span className="m365-field__error">{validationErrors.destinationTankId}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Transfer Details ───────────────────────────── */}
        <div className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-list-check m365-section-group__icon"></i>
            <span className="m365-section-group__title">Transfer Details</span>
          </div>
          <div className="m365-section-group__body">
            <div className="m365-field m365-field--full">
              <label className="m365-field__label">
                Date &amp; Time <span className="m365-required">*</span>
              </label>
              <DateBox
                value={formData.date}
                max={new Date()}
                displayFormat="yyyy-MM-dd HH:mm"
                type="datetime"
                pickerType="calendar"
                width="100%"
                disabled={isLoading}
                onValueChanged={handleDateChange}
                dropDownOptions={{
                  width: "auto",
                  minWidth: 380,
                  maxWidth: 520,
                  wrapperAttr: { class: "datebox-wide" },
                }}
                isValid={hasAttemptedSubmit ? !validationErrors.date : true}
                validationError={validationErrors.date ? { message: validationErrors.date } : null}
                validationMessageMode="always"
              />
              {hasAttemptedSubmit && validationErrors.date && (
                <span className="m365-field__error">{validationErrors.date}</span>
              )}
            </div>
            <div className="m365-field-row">
              <div className="m365-field">
                <label className="m365-field__label">
                  Transfer Amount (Liters) <span className="m365-required">*</span>
                </label>
                <NumberBox
                  showSpinButtons={true}
                  value={formData.amount}
                  onValueChanged={handleAmountChange}
                  placeholder="Enter transfer amount"
                  width="100%"
                  disabled={isLoading}
                  {...(formData.amount !== null &&
                    formData.amount !== undefined && { format: "#,##0.00" })}
                  isValid={hasAttemptedSubmit ? !validationErrors.amount : true}
                  validationError={validationErrors.amount ? { message: validationErrors.amount } : null}
                  validationMessageMode="always"
                />
                {hasAttemptedSubmit && validationErrors.amount && (
                  <span className="m365-field__error">{validationErrors.amount}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Historical Entry Information Notice */}
        {formData.date &&
          formData.sourceTankId &&
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
                  <i className="fa-light fa-calendar-clock m365-info-banner__icon"></i>
                  <div className="m365-info-banner__content">
                    <span className="m365-info-banner__title">Historical Entry Detected</span>
                    <span className="m365-info-banner__text">
                      You are creating a tank transfer for{" "}
                      <strong>{selectedDate.toLocaleDateString()}</strong>{" "}
                      (backdated entry).
                    </span>
                    <span className="m365-info-banner__text">
                      <strong>Impact:</strong> This will recalculate both
                      tanks' current stock and affect all subsequent records.
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

        {/* Validation Error */}
        {validationError && (
          <div className="m365-info-banner m365-info-banner--error">
            <i className="fa-light fa-circle-exclamation m365-info-banner__icon"></i>
            <div className="m365-info-banner__content">
              <span className="m365-info-banner__text">{validationError}</span>
            </div>
          </div>
        )}

        {isValidating && (
          <div className="m365-info-banner">
            <LoadIndicator width={"20px"} height={"20px"} visible={true} />
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
            <i className="fa-light fa-circle-info m365-info-banner__icon"></i>
            <div className="m365-info-banner__content">
              <span className="m365-info-banner__text">
                Transfer fuel between tanks. Amount will be deducted from
                source tank and added to destination tank. Choose 'Tank to Tank'
                for same site transfers or 'Site to Site' for cross-site transfers.
              </span>
            </div>
            <button
              className="m365-info-banner__dismiss"
              onClick={() => setShowInfoNotice(false)}
              title="Dismiss"
            >
              <i className="fa-light fa-xmark"></i>
            </button>
          </div>
        )}

      </div>

      {/* ── Form Actions ───────────────────────────────── */}
      <div className="m365-form-actions">
        <button
          className="m365-btn m365-btn--ghost"
          onClick={onCancel}
          disabled={isSubmitting}
          type="button"
        >
          Cancel
        </button>
        <button
          className="m365-btn m365-btn--primary"
          onClick={handleSubmit}
          disabled={isSubmitting || isValidating || !canSubmitForm}
          type="button"
        >
          {isSubmitting ? (
            <><i className="fa-light fa-spinner fa-spin"></i> Saving...</>
          ) : (
            "Save Transfer"
          )}
        </button>
      </div>
    </div>
  );
};

export default TankTransferForm;
