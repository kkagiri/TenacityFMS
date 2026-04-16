/**
 * File: ClosingStockForm.js
 * Purpose: Manage closing stock entry workflow, reusing shared site/tank datasets and handling validation plus history insights.
 * Dependencies: React, Redux Toolkit, DevExtreme components, tankActions, siteActions, ClosingStockActions, tankVolumeHistoryActions
 * Last Modified: 2025-11-27
 *
 * Key Functions/Components:
 * - ClosingStockForm: Main component orchestrating closing stock submission lifecycle
 * - handleSiteChange: Filters tanks for selected site and primes dependent state
 * - handleTankChange: Retrieves tank metrics and triggers validation/history loads
 * - useTankStockFormData: Shared context for persisting date and site across forms
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import SelectBox from "devextreme-react/select-box";
import DateBox from "devextreme-react/date-box";
import NumberBox from "devextreme-react/number-box";
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
import {
  fetchTankVolumeHistoryByTankId,
  fetchTankVolumeHistoryFiltered,
} from "../../../redux/actions/tankVolumeHistoryActions";
import { createClosingStock } from "../../../redux/actions/ClosingStockActions";
import axiosInstance from "../../../api/axiosInstance";
import { prepareOpeningClosingStockParams } from "../../../utils/stockDataPreparation";
import LoadIndicator from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";
import { confirm } from "devextreme/ui/dialog";
import "./_m365-form-common.scss";

// Future records validation imports
import { useFutureRecordsValidation } from "../../../hooks/useFutureRecordsValidation";
import FutureRecordsWarning from "../../../components/tank-stock/FutureRecordsWarning";
import { useTankStockFormData } from "../shared/context/TankStockFormContext";

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

  // Shared form context for date and site persistence
  const { sharedDate, sharedSiteId, updateDate, updateSiteId } =
    useTankStockFormData();

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

  const [filteredTanks, setFilteredTanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    siteId: prefilledData?.siteId || sharedSiteId || 0, // Use shared site if available
    tankId: prefilledData?.tankId || 0, // ✅ Changed from null to 0 for DevExtreme Form compatibility (Tank ID is int)
    amount: null, // Physical stock measurement
    closingMeter: null, // Closing meter reading (optional)
    bookBalance: null, // Current book balance (read-only)
    physicalStockValue: null, // Current physical stock value (read-only)
    date: prefilledData?.suggestedDate || sharedDate || new Date(), // Use shared date if available
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [showInfoNotice, setShowInfoNotice] = useState(true);
  const [showVolumeHistory, setShowVolumeHistory] = useState(true);
  const [showHistoricalNotice, setShowHistoricalNotice] = useState(true);
  const [backendError, setBackendError] = useState(null);
  const [probeSnapshot, setProbeSnapshot] = useState(null);
  const [isProbeSnapshotLoading, setIsProbeSnapshotLoading] = useState(false);

  const selectedTank = useMemo(
    () => tanksAvailable.find((tank) => tank.id === formData.tankId) || null,
    [tanksAvailable, formData.tankId]
  );

  const normalizedProbePhysicalStockSource = useMemo(() => {
    if (!selectedTank?.probePhysicalStockUpdateSource) {
      return "";
    }

    return String(selectedTank.probePhysicalStockUpdateSource)
      .trim()
      .toLowerCase()
      .replace(/_/g, "-");
  }, [selectedTank?.probePhysicalStockUpdateSource]);

  const isHistoricalSelectedDate = useMemo(() => {
    if (!formData.date) {
      return false;
    }

    const selectedDate = new Date(formData.date);
    if (Number.isNaN(selectedDate.getTime())) {
      return false;
    }

    const selectedDay = new Date(selectedDate);
    const today = new Date();
    selectedDay.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return selectedDay < today;
  }, [formData.date]);

  const displayedPhysicalStockValue = isHistoricalSelectedDate
    ? probeSnapshot?.productVolume ?? null
    : formData.physicalStockValue;

  const displayedPhysicalStockTimestamp = isHistoricalSelectedDate
    ? probeSnapshot?.dateTime ?? null
    : selectedTank?.lastPhysicalStockUpdate ?? null;

  const displayedPhysicalStockSource = isHistoricalSelectedDate
    ? probeSnapshot?.source ?? null
    : selectedTank?.physicalStockSource ?? null;

  const displayedPhysicalStockLabel = isHistoricalSelectedDate
    ? "Physical Stock Value Near Selected Time"
    : "Current Physical Stock Value (Last Recorded)";

  const canUseLatestProbeReading = Boolean(
    selectedTank &&
    selectedTank.usePtsProbeReadings &&
    selectedTank.probeNumber &&
    displayedPhysicalStockValue != null &&
    (!normalizedProbePhysicalStockSource ||
      normalizedProbePhysicalStockSource === "upload-status")
  );

  const loadHistoricalProbeSnapshot = useCallback(async () => {
    if (
      !selectedTank ||
      !selectedTank.usePtsProbeReadings ||
      !selectedTank.probeNumber ||
      (normalizedProbePhysicalStockSource &&
        normalizedProbePhysicalStockSource !== "upload-status") ||
      !formData.date ||
      !isHistoricalSelectedDate
    ) {
      setProbeSnapshot(null);
      return;
    }

    const selectedDate = new Date(formData.date);
    if (Number.isNaN(selectedDate.getTime())) {
      setProbeSnapshot(null);
      return;
    }

    const startDate = new Date(selectedDate);
    startDate.setHours(0, 0, 0, 0);

    setIsProbeSnapshotLoading(true);
    try {
      const response = await axiosInstance.get(
        "/tankstock/upload-status-readings/history",
        {
          params: {
            tankId: selectedTank.id,
            startDate: startDate.toISOString(),
            endDate: selectedDate.toISOString(),
          },
        }
      );

      const payload = response.data?.data ?? response.data?.Data ?? [];
      const readings = Array.isArray(payload) ? payload : [];
      const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;
      const productVolume = latestReading?.productVolume ?? latestReading?.ProductVolume ?? null;

      if (productVolume == null) {
        setProbeSnapshot(null);
        return;
      }

      setProbeSnapshot({
        productVolume,
        dateTime: latestReading?.dateTime ?? latestReading?.DateTime ?? null,
        source: latestReading?.source ?? latestReading?.Source ?? "PTS UploadStatus",
      });
    } catch (error) {
      console.error(
        "ClosingStockForm - Error loading historical probe snapshot:",
        error
      );
      setProbeSnapshot(null);
    } finally {
      setIsProbeSnapshotLoading(false);
    }
  }, [
    formData.date,
    isHistoricalSelectedDate,
    normalizedProbePhysicalStockSource,
    selectedTank,
  ]);

  useEffect(() => {
    loadHistoricalProbeSnapshot();
  }, [loadHistoricalProbeSnapshot]);

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

  // Keep filtered tanks synchronized with store updates and shared context
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

      // Update shared context when date changes
      if (dataField === "date") {
        updateDate(value);
      }

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
    [updateFormData, updateDate]
  );

  const handleSiteChange = useCallback(
    async (e) => {
      const siteId = e?.value ?? null;

      // Update shared context when site changes
      if (siteId !== null) {
        updateSiteId(siteId);
      }

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
    [dispatch, tanksAvailable, usingPropTanks, showNotification, updateSiteId]
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

        // Fetch tank volume history for the selected date
        const selectedDate = formData.date
          ? new Date(formData.date)
          : new Date();
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);

        dispatch(
          fetchTankVolumeHistoryFiltered({
            tankId: tankId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          })
        )
          .then(() => {
            console.log(
              "Tank volume history loaded successfully for date:",
              selectedDate.toLocaleDateString()
            );
          })
          .catch((error) => {
            console.error(
              "ClosingStockForm - Error loading tank volume history:",
              error
            );
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

      // Reload tank volume history for the new date if tank is selected
      if (newDate && formData.tankId) {
        setLoading(true);

        const selectedDate = new Date(newDate);
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);

        dispatch(
          fetchTankVolumeHistoryFiltered({
            tankId: formData.tankId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          })
        )
          .then(() => {
            console.log(
              "Tank volume history reloaded for date:",
              selectedDate.toLocaleDateString()
            );
          })
          .catch((error) => {
            console.error(
              "ClosingStockForm - Error reloading tank volume history:",
              error
            );
            showNotification("Failed to reload tank volume history", "error");
          })
          .finally(() => {
            setLoading(false);
          });

        // Trigger future records validation when date and tank are available
        validateHistoricalEntry(formData.tankId, newDate, "ClosingStock");
      }
    },
    [formData, validateHistoricalEntry, dispatch, showNotification]
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

  const handleUseLatestProbeReading = useCallback(() => {
    if (!canUseLatestProbeReading || displayedPhysicalStockValue == null) {
      showNotification(
        "No saved PTS probe reading is available for this tank.",
        "warning",
        4000
      );
      return;
    }

    setFormData((prev) => ({
      ...prev,
      amount: displayedPhysicalStockValue,
    }));
    setValidationErrors((prev) => ({ ...prev, amount: null }));

    showNotification(
      `Loaded latest saved PTS probe volume: ${Number(
        displayedPhysicalStockValue
      ).toLocaleString()} L`,
      "success",
      3000
    );
  }, [
    canUseLatestProbeReading,
    displayedPhysicalStockValue,
    showNotification,
  ]);

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

  // Clear form data for new entry (preserve site and date)
  const clearFormData = useCallback(() => {
    setFormData((prev) => ({
      siteId: prev.siteId, // Preserve site
      tankId: null,
      amount: null,
      bookBalance: null,
      physicalStockValue: null,
      date: prev.date, // Preserve date
    }));
    setValidationErrors({});
    setHasAttemptedSubmit(false);
    resetValidation();
  }, [resetValidation]);

  // Handle form submission and close
  const handleSubmit = useCallback(async () => {
    setHasAttemptedSubmit(true);
    setBackendError(null);
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
      } else if (
        response.message &&
        response.message.startsWith("UNRECORDED_DELIVERY_WARNING:")
      ) {
        // Closing stock is significantly higher than expected with no delivery recorded
        const warningText = response.message
          .replace("UNRECORDED_DELIVERY_WARNING:", "")
          .trim();
        const confirmed = await confirm(
          warningText + "\n\nDo you want to proceed anyway?",
          "Unrecorded Delivery Warning"
        );
        if (confirmed) {
          const retryResponse = await dispatch(
            createClosingStock({ ...params, confirmOverride: true })
          );
          if (retryResponse.success) {
            showNotification(
              retryResponse.message || "Closing stock created successfully",
              "success",
              3000
            );
            resetValidation();
            if (onCancel) onCancel();
            if (onSubmit) onSubmit(formData);
          } else {
            setBackendError({
              message: retryResponse.message || "Failed to create closing stock",
            });
            showNotification(
              retryResponse.message || "Failed to create closing stock",
              "error",
              5000
            );
          }
        }
      } else {
        setBackendError({
          message: response.message || "Failed to create closing stock",
        });
        showNotification(
          response.message || "Failed to create closing stock",
          "error",
          5000
        );
      }
    } catch (error) {
      console.error("Error creating closing stock:", error);
      setBackendError({
        message:
          error?.response?.data?.message ||
          error?.message ||
          "An unexpected error occurred",
      });
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

  // Handle save and new entry
  const handleSaveAndNew = useCallback(async () => {
    setHasAttemptedSubmit(true);
    setBackendError(null);
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
          response.message ||
          "Closing stock created successfully. Form cleared for new entry.",
          "success",
          3000
        );
        // Reset validation on success
        resetValidation();
        // Clear form for new entry (keeps site and date)
        clearFormData();
      } else if (
        response.message &&
        response.message.startsWith("UNRECORDED_DELIVERY_WARNING:")
      ) {
        // Closing stock is significantly higher than expected with no delivery recorded
        const warningText = response.message
          .replace("UNRECORDED_DELIVERY_WARNING:", "")
          .trim();
        const confirmed = await confirm(
          warningText + "\n\nDo you want to proceed anyway?",
          "Unrecorded Delivery Warning"
        );
        if (confirmed) {
          const retryResponse = await dispatch(
            createClosingStock({ ...params, confirmOverride: true })
          );
          if (retryResponse.success) {
            showNotification(
              retryResponse.message ||
              "Closing stock created successfully. Form cleared for new entry.",
              "success",
              3000
            );
            resetValidation();
            clearFormData();
          } else {
            setBackendError({
              message: retryResponse.message || "Failed to create closing stock",
            });
            showNotification(
              retryResponse.message || "Failed to create closing stock",
              "error",
              5000
            );
          }
        }
      } else {
        setBackendError({
          message: response.message || "Failed to create closing stock",
        });
        showNotification(
          response.message || "Failed to create closing stock",
          "error",
          5000
        );
      }
    } catch (error) {
      console.error("Error creating closing stock:", error);
      setBackendError({
        message:
          error?.response?.data?.message ||
          error?.message ||
          "An unexpected error occurred",
      });
      showNotification("An unexpected error occurred", "error", 3000);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    formData,
    validateForm,
    dispatch,
    canSubmit,
    resetValidation,
    showNotification,
    clearFormData,
  ]);

  return (
    <div className="m365-form-body">
      <div className="m365-form-body__scroll">
        {/* Description */}
        <p style={{ fontSize: 13, color: "#605e5c", marginBottom: 16 }}>
          Record the closing stock amount for the selected tank and date.
        </p>

        {/* Special notice for prefilled closing stock */}
        {prefilledData?.reason && (
          <div className="m365-info-banner">
            <i className="fa-light fa-circle-info m365-info-banner__icon" />
            <div className="m365-info-banner__content">
              <span className="m365-info-banner__text">
                <strong>Required Closing Stock</strong> — {prefilledData.reason}
              </span>
              <span className="m365-info-banner__text" style={{ display: "block", marginTop: 4, fontSize: 12 }}>
                The tank and date have been pre-selected to match the
                existing opening stock. Please enter the appropriate
                closing stock amount for this date.
              </span>
            </div>
          </div>
        )}

        {/* Dismissible Information Notice */}
        {showInfoNotice && (
          <div className="m365-info-banner">
            <i className="fa-light fa-circle-info m365-info-banner__icon" />
            <div className="m365-info-banner__content">
              <span className="m365-info-banner__text">
                <strong>Closing Stock Information</strong> — Closing stock
                represents the fuel quantity available in the tank at the end
                of the specified date and time. This value will be used for
                reconciliation and stock calculations.
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

        {/* Loading indicator */}
        {(loading || isProbeSnapshotLoading) && (
          <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
            <LoadIndicator width={"48px"} height={"48px"} visible={true} />
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

        {/* Site & Tank — 2-column row */}
        <div className="m365-field-row">
          <div className="m365-field">
            <label className="m365-field__label">Site</label>
            <SelectBox
              items={sitesAvailable}
              displayExpr="name"
              valueExpr="id"
              value={formData.siteId}
              onValueChanged={handleSiteChange}
              placeholder={
                !dataLoaded && sitesAvailable.length === 0
                  ? "Loading sites..."
                  : sitesAvailable.length > 0
                    ? "Select a site"
                    : "No sites available"
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

          <div className="m365-field">
            <label className="m365-field__label">Tank</label>
            <SelectBox
              items={filteredTanks}
              displayExpr="name"
              valueExpr="id"
              value={formData.tankId}
              onValueChanged={handleTankChange}
              disabled={!formData.siteId || formData.siteId === 0}
              placeholder={
                !formData.siteId || formData.siteId === 0
                  ? "Select site first"
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
        </div>

        {/* Read-only: Book Balance & Physical Stock Value */}
        {(formData.bookBalance != null || formData.tankId > 0) && (
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

            {formData.tankId > 0 && (
              <div className="m365-field">
                <label className="m365-field__label">
                  {displayedPhysicalStockLabel}
                </label>
                <div>
                  <div
                    className="m365-input"
                    style={{ background: "#f3f2f1", cursor: "default", display: "flex", alignItems: "center", fontWeight: 600 }}
                  >
                    {displayedPhysicalStockValue != null
                      ? Number(displayedPhysicalStockValue).toLocaleString() +
                      " L"
                      : "No physical reading available"}
                  </div>
                  {displayedPhysicalStockTimestamp && (
                    <div style={{ marginTop: 6, fontSize: 12, color: "#605e5c" }}>
                      Saved {new Date(
                        displayedPhysicalStockTimestamp
                      ).toLocaleString()}
                      {displayedPhysicalStockSource
                        ? ` via ${displayedPhysicalStockSource}`
                        : ""}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Amount & Closing Meter — 2-column row */}
        <div className="m365-field-row">
          <div className="m365-field">
            <label className="m365-field__label">
              Physical Stock Amount (Liters)
            </label>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#605e5c" }}>
                {selectedTank?.usePtsProbeReadings && selectedTank?.probeNumber
                  ? isHistoricalSelectedDate
                    ? "You can load the latest saved calibrated volume from UploadStatus history up to the selected date and time."
                    : "You can load the latest saved calibrated volume from the tank's PTS probe reading."
                  : "Manual entry only until this tank is linked to a PTS probe."}
              </span>
              <button
                type="button"
                className="m365-btn m365-btn--ghost"
                onClick={handleUseLatestProbeReading}
                disabled={!canUseLatestProbeReading}
                title={
                  canUseLatestProbeReading
                    ? "Use latest saved PTS probe volume"
                    : "PTS probe reading is not available for this tank"
                }
              >
                <i className="fa-light fa-satellite-dish" style={{ marginRight: 8 }} />
                Use Latest Saved PTS Probe Volume
              </button>
            </div>
            <NumberBox
              showSpinButtons={true}
              value={formData.amount}
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

          <div className="m365-field">
            <label className="m365-field__label">
              Closing Meter Reading (Optional)
            </label>
            <NumberBox
              showSpinButtons={true}
              value={formData.closingMeter || null}
              onValueChanged={(e) =>
                handleChange({ dataField: "closingMeter", value: e.value })
              }
              placeholder="Enter closing meter reading (optional)"
              width="100%"
              {...(formData.closingMeter !== null &&
                formData.closingMeter !== undefined && {
                format: "#,##0.00",
              })}
            />
          </div>
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
                      creating a closing stock for{" "}
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

        {/* Future Records Warning */}
        {(showWarning || validationError) && (
          <>
            <FutureRecordsWarning
              validationResult={validationResult}
              onConfirm={confirmProceed}
              onCancel={cancelProceed}
              isVisible={showWarning || !!validationError}
            />
            {validationError && (
              <div className="m365-info-banner m365-info-banner--error">
                <i className="fa-light fa-triangle-exclamation m365-info-banner__icon" />
                <div className="m365-info-banner__content">
                  <span className="m365-info-banner__text">
                    {validationError}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {backendError && (
          <div className="m365-info-banner m365-info-banner--error">
            <i className="fa-light fa-triangle-exclamation m365-info-banner__icon" />
            <div className="m365-info-banner__content">
              <span className="m365-info-banner__text">
                <strong>Closing Stock Error</strong>
              </span>
              <span className="m365-info-banner__text" style={{ display: "block", marginTop: 4 }}>
                {backendError.message || "An error occurred"}
              </span>
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

        {/* Tank Volume History Section */}
        {formData.siteId > 0 &&
          formData.tankId > 0 &&
          showVolumeHistory && (
            <div className="m365-section-group">
              <div className="m365-section-group__header">
                <i className="fa-light fa-history m365-section-group__icon" />
                <h3 className="m365-section-group__title">Tank Volume History</h3>
                <button
                  className="m365-info-banner__dismiss"
                  onClick={() => setShowVolumeHistory(false)}
                  style={{ marginLeft: "auto" }}
                  title="Hide volume history"
                >
                  <i className="fa-light fa-xmark" />
                </button>
              </div>
              <div className="m365-section-group__body">
                <p style={{ fontSize: 12, color: "#605e5c", marginBottom: 8 }}>
                  Showing transactions for{" "}
                  <strong style={{ color: "#0078d4" }}>
                    {formData.date
                      ? new Date(formData.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                      : new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                  </strong>
                  . Use search and filters to analyze transaction data.
                  Negative values indicate fuel dispensed or transferred out.
                </p>

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
                  >
                    <GroupPanel visible={false} />
                    <Grouping autoExpandAll={false} />
                    <SearchPanel
                      visible={false}
                      highlightCaseSensitive={true}
                    />
                    <ColumnChooser enabled={false} />
                    <HeaderFilter visible={false} />
                    <FilterRow visible={true} />
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
                          style={{
                            fontWeight: 500,
                            color:
                              cellData.value >= 0 ? "#107c10" : "#d13438",
                          }}
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
                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <i
                      className="fa-light fa-inbox"
                      style={{ fontSize: 28, color: "#a19f9d", marginBottom: 8, display: "block" }}
                    />
                    <p style={{ color: "#605e5c", fontSize: 13, margin: 0 }}>
                      No volume history available for this tank
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

      </div>

      {isSubmitting && (
        <div className="m365-info-banner" style={{ alignItems: "center" }}>
          <LoadIndicator height={20} width={20} />
          <div className="m365-info-banner__content">
            <span className="m365-info-banner__text">
              Posting closing stock...
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
          disabled={isSubmitting || !canSubmit}
        >
          <i className="fa-light fa-plus" />
          Save and New
        </button>
        <button
          className="m365-btn m365-btn--primary"
          onClick={handleSubmit}
          disabled={isSubmitting || !canSubmit}
        >
          <i className="fa-light fa-floppy-disk" />
          Save and Close
        </button>
      </div>
    </div>
  );
};

export default ClosingStockForm;
