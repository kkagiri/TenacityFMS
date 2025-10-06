/**
 * File: TankTransferForm.js
 * Purpose: Coordinate tank-to-tank and site-to-site transfers leveraging shared site/tank datasets with validation safeguards.
 * Dependencies: React, Redux Toolkit, DevExtreme components, siteActions, tankActions, tankStockAction
 * Last Modified: 2025-10-06
 *
 * Key Functions/Components:
 * - TankTransferForm: Handles transfer workflow including validation and submission
 * - handleSourceSiteChange: Filters source tanks with API fallback when cache misses occur
 * - handleDestinationSiteChange: Maintains destination tank list honoring transfer type constraints
 */
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Form,
  SimpleItem,
  Label,
  RequiredRule,
  NumericRule,
} from "devextreme-react/form";
import { Button } from "devextreme-react";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import {
  fetchTanks,
  fetctTankbySiteId,
} from "../../../redux/actions/tankActions";
import { createTankTransfer } from "../../../redux/actions/tankStockAction";
import { prepareTankTransferDTO } from "../../../utils/stockDataPreparation";
import LoadIndicator from "devextreme-react/load-indicator";
import ScrollView from "devextreme-react/scroll-view";
import notify from "devextreme/ui/notify";
import "./TankTransferForm.scss";
import { IsolatedForm } from "../../../components/common/SignalRIsolation";

// Future records validation imports
import { useFutureRecordsValidation } from "../../../hooks/useFutureRecordsValidation";
import FutureRecordsWarning from "../../../components/tank-stock/FutureRecordsWarning";

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

  const [filteredSourceTanks, setFilteredSourceTanks] = useState([]);
  const [filteredDestinationTanks, setFilteredDestinationTanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const combinedLoading = isLoading || loading;

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
    sourceSiteId: null,
    sourceTankId: null,
    destinationSiteId: null,
    destinationTankId: null,
    amount: null,
    date: new Date(),
    transferType: "InterTank", // InterTank, InterSite
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showInfoNotice, setShowInfoNotice] = useState(true);
  const [showSourceTankInfo, setShowSourceTankInfo] = useState(false);

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

  useEffect(() => {
    const sitesReady = sitesAvailable.length > 0;
    const tanksReady = tanksAvailable.length > 0;

    if (sitesReady && tanksReady) {
      if (!dataLoaded) {
        console.log(
          "[TankTransferForm] Using available datasets (sites:%d, tanks:%d)",
          sitesAvailable.length,
          tanksAvailable.length
        );
        setDataLoaded(true);
      }
      return;
    }

    console.log("[TankTransferForm] Initializing - fetching sites and tanks");
    const fetchData = async () => {
      try {
        if (!sitesReady && !usingPropSites) {
          await dispatch(fetchSiteList());
        }
        if (!tanksReady && !usingPropTanks) {
          await dispatch(fetchTanks());
        }
        setDataLoaded(true);
        console.log("[TankTransferForm] Data loaded successfully");
      } catch (error) {
        console.error("[TankTransferForm] Error loading data:", error);
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

  const handleSourceSiteChange = useCallback(
    async (e) => {
      const siteId = e?.value ?? null;
      console.log("[TankTransferForm] Source site changed:", siteId);

      setFilteredSourceTanks([]);
      setFormData((prevData) => ({
        ...prevData,
        sourceSiteId: siteId,
        sourceTankId: null,
      }));

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
            console.log(
              "[TankTransferForm] Loaded %d source tanks from API for site %s",
              tanksForSite.length,
              siteId
            );
          } else {
            console.warn(
              "[TankTransferForm] No source tanks returned for site %s",
              siteId
            );
          }
        } catch (error) {
          console.error(
            "[TankTransferForm] Failed to load source tanks",
            error
          );
          showNotification(
            "Unable to load tanks for the selected source site.",
            "error",
            5000
          );
        } finally {
          setLoading(false);
        }
      }

      setFilteredSourceTanks(tanksForSite);
    },
    [dispatch, showNotification, tanksAvailable, usingPropTanks]
  );

  const handleDestinationSiteChange = useCallback(
    async (e) => {
      const siteId = e?.value ?? null;
      console.log("[TankTransferForm] Destination site changed:", siteId);

      setFilteredDestinationTanks([]);
      setFormData((prevData) => ({
        ...prevData,
        destinationSiteId: siteId,
        destinationTankId: null,
      }));

      if (!siteId) {
        return;
      }

      const excludeSourceTank = formData.transferType === "InterTank";
      let tanksForSite = tanksAvailable.filter((tank) => {
        if (tank.siteId !== siteId) return false;
        if (excludeSourceTank && tank.id === formData.sourceTankId) {
          return false;
        }
        return true;
      });

      if (tanksForSite.length === 0 && !usingPropTanks) {
        setLoading(true);
        try {
          const result = await dispatch(fetctTankbySiteId(siteId));
          if (result?.success && Array.isArray(result.data)) {
            tanksForSite = result.data.filter((tank) => {
              if (tank.siteId !== siteId) return false;
              if (excludeSourceTank && tank.id === formData.sourceTankId) {
                return false;
              }
              return true;
            });
            console.log(
              "[TankTransferForm] Loaded %d destination tanks from API for site %s",
              tanksForSite.length,
              siteId
            );
          } else {
            console.warn(
              "[TankTransferForm] No destination tanks returned for site %s",
              siteId
            );
          }
        } catch (error) {
          console.error(
            "[TankTransferForm] Failed to load destination tanks",
            error
          );
          showNotification(
            "Unable to load tanks for the selected destination site.",
            "error",
            5000
          );
        } finally {
          setLoading(false);
        }
      }

      setFilteredDestinationTanks(tanksForSite);
    },
    [
      dispatch,
      showNotification,
      tanksAvailable,
      usingPropTanks,
      formData.transferType,
      formData.sourceTankId,
    ]
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
          validateHistoricalEntry(tankId, updatedData.date, "TransferOut");
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
      validateHistoricalEntry,
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
  }, []);

  const handleDateChange = useCallback(
    (e) => {
      const newDate = e.value;
      setFormData((prevData) => {
        const updatedData = {
          ...prevData,
          date: newDate,
        };

        if (newDate && updatedData.sourceTankId) {
          validateHistoricalEntry(
            updatedData.sourceTankId,
            newDate,
            "TransferOut"
          );
        }

        return updatedData;
      });
    },
    [validateHistoricalEntry]
  );

  const handleAmountChange = useCallback((e) => {
    const amount = e.value;
    setFormData((prevData) => ({
      ...prevData,
      amount: amount,
    }));
  }, []);

  const handleTransferTypeChange = useCallback(
    (e) => {
      const transferType = e.value;
      setFormData((prevData) => {
        const updatedData = {
          ...prevData,
          transferType,
          destinationSiteId:
            transferType === "InterTank" ? prevData.sourceSiteId : null,
          destinationTankId: null,
        };

        if (transferType === "InterTank" && prevData.sourceSiteId) {
          const sourceTanks = filteredSourceTanks.length
            ? filteredSourceTanks
            : tanksAvailable;
          const tanksForSite = sourceTanks.filter(
            (tank) =>
              tank.siteId === prevData.sourceSiteId &&
              tank.id !== prevData.sourceTankId
          );
          setFilteredDestinationTanks(tanksForSite);
        } else if (transferType === "InterSite") {
          setFilteredDestinationTanks([]);
        }

        return updatedData;
      });
    },
    [filteredSourceTanks, tanksAvailable]
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

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      showNotification(
        "Please fix validation errors before submitting",
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
    canSubmit,
    resetValidation,
  ]);

  return (
    <div className="tank-transfer-form tw-h-full tw-flex tw-flex-col">
      <ScrollView
        className="tw-flex-1"
        showScrollbar="onScroll"
        scrollByContent={true}
        scrollByThumb={true}
        bounceEnabled={false}
        useNative={false}
      >
        <div className="tw-p-1">
          {/* Header */}
          <div className="tw-mb-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-2">
              <i className="fa-light fa-exchange tw-mr-2 tw-text-blue-600"></i>
              Tank Transfer Entry
            </h3>
            <p className="tw-text-gray-600 tw-text-sm">
              Transfer fuel between tanks within the same site or across
              different sites.
            </p>
          </div>

          {/* Loading indicator while fetching initial data */}
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

          {/* Source Tank Info Panel */}
          {formData.sourceTankId && showSourceTankInfo && (
            <div className="tw-mb-4 tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-3">
              <div className="tw-flex tw-items-start">
                <i className="fa-light fa-gas-pump tw-text-blue-600 tw-mt-0.5 tw-mr-3"></i>
                <div className="tw-flex-1">
                  <h4 className="tw-font-medium tw-text-gray-800 tw-mb-1">
                    Source Tank Overview
                  </h4>
                  <div className="tw-text-sm">
                    <span className="tw-text-gray-600">Book Balance: </span>
                    <span className="tw-ml-1 tw-font-medium">
                      {formData.sourceTankCurrentStock != null
                        ? `${Number(
                            formData.sourceTankCurrentStock
                          ).toLocaleString()} L`
                        : "N/A"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowSourceTankInfo(false)}
                  className="tw-ml-3 tw-text-gray-500 hover:tw-text-gray-700 tw-transition-colors"
                  title="Dismiss"
                >
                  <i className="fa-light fa-times"></i>
                </button>
              </div>
            </div>
          )}
          <IsolatedForm formId="tank-transfer-form">
            <Form
              readOnly={combinedLoading}
              formData={formData}
              showColonAfterLabel={true}
              labelLocation="top"
              colCount={2}
              className="tw-mb-6"
              scrollingEnabled={false}
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
                  isValid: !validationErrors.date,
                  validationError: validationErrors.date
                    ? { message: validationErrors.date }
                    : null,
                }}
              >
                <Label text="Date & Time" />
                <RequiredRule message="Date is required" />
              </SimpleItem>

              <SimpleItem
                dataField="transferType"
                editorType="dxSelectBox"
                editorOptions={{
                  items: transferTypeOptions,
                  displayExpr: "name",
                  valueExpr: "id",
                  onValueChanged: handleTransferTypeChange,
                  value: formData.transferType,
                  placeholder: "Select transfer type",
                  width: "100%",
                }}
              >
                <Label text="Transfer Type" />
                <RequiredRule message="Transfer type is required" />
              </SimpleItem>

              <SimpleItem
                dataField="sourceSiteId"
                editorType="dxSelectBox"
                editorOptions={{
                  items: sitesAvailable,
                  displayExpr: "name",
                  valueExpr: "id",
                  onValueChanged: handleSourceSiteChange,
                  placeholder: combinedLoading
                    ? "Loading sites..."
                    : sitesAvailable.length > 0
                    ? "Select source site"
                    : "No sites available",
                  searchEnabled: true,
                  width: "100%",
                  dropDownOptions: {
                    container: ".tank-transfer-form",
                    position: {
                      my: "top",
                      at: "bottom",
                      collision: "flip",
                    },
                  },
                  isValid: !validationErrors.sourceSiteId,
                  validationError: validationErrors.sourceSiteId
                    ? { message: validationErrors.sourceSiteId }
                    : null,
                }}
              >
                <Label text="Source Site" />
                <RequiredRule message="Source site is required" />
              </SimpleItem>

              <SimpleItem
                dataField="sourceTankId"
                editorType="dxSelectBox"
                editorOptions={{
                  items: filteredSourceTanks,
                  displayExpr: "name",
                  valueExpr: "id",
                  onValueChanged: handleSourceTankChange,
                  disabled: !formData.sourceSiteId,
                  placeholder: !formData.sourceSiteId
                    ? "Select source site first"
                    : filteredSourceTanks.length === 0
                    ? "No tanks available"
                    : "Select source tank",
                  width: "100%",
                  dropDownOptions: {
                    container: ".tank-transfer-form",
                    position: {
                      my: "top",
                      at: "bottom",
                      collision: "flip",
                    },
                  },
                  isValid: !validationErrors.sourceTankId,
                  validationError: validationErrors.sourceTankId
                    ? { message: validationErrors.sourceTankId }
                    : null,
                }}
              >
                <Label text="Source Tank" />
                <RequiredRule message="Source tank is required" />
              </SimpleItem>

              <SimpleItem
                dataField="destinationSiteId"
                editorType="dxSelectBox"
                editorOptions={{
                  items: sitesAvailable,
                  displayExpr: "name",
                  valueExpr: "id",
                  onValueChanged: handleDestinationSiteChange,
                  searchEnabled: true,
                  disabled: formData.transferType === "InterTank",
                  placeholder:
                    formData.transferType === "InterTank"
                      ? "Same as source site"
                      : combinedLoading
                      ? "Loading sites..."
                      : sitesAvailable.length > 0
                      ? "Select destination site"
                      : "No sites available",
                  width: "100%",
                  dropDownOptions: {
                    container: ".tank-transfer-form",
                    position: {
                      my: "top",
                      at: "bottom",
                      collision: "flip",
                    },
                  },
                  isValid: !validationErrors.destinationSiteId,
                  validationError: validationErrors.destinationSiteId
                    ? { message: validationErrors.destinationSiteId }
                    : null,
                }}
              >
                <Label text="Destination Site" />
                <RequiredRule message="Destination site is required" />
              </SimpleItem>

              <SimpleItem
                dataField="destinationTankId"
                editorType="dxSelectBox"
                editorOptions={{
                  items: filteredDestinationTanks,
                  displayExpr: "name",
                  valueExpr: "id",
                  onValueChanged: handleDestinationTankChange,
                  disabled: !formData.destinationSiteId,
                  placeholder: !formData.destinationSiteId
                    ? "Select destination site first"
                    : filteredDestinationTanks.length === 0
                    ? "No tanks available"
                    : "Select destination tank",
                  width: "100%",
                  dropDownOptions: {
                    container: ".tank-transfer-form",
                    position: {
                      my: "top",
                      at: "bottom",
                      collision: "flip",
                    },
                  },
                  isValid: !validationErrors.destinationTankId,
                  validationError: validationErrors.destinationTankId
                    ? { message: validationErrors.destinationTankId }
                    : null,
                }}
              >
                <Label text="Destination Tank" />
                <RequiredRule message="Destination tank is required" />
              </SimpleItem>

              <SimpleItem
                dataField="amount"
                editorType="dxNumberBox"
                editorOptions={{
                  showSpinButtons: true,
                  value: formData.amount,
                  onValueChanged: handleAmountChange,
                  placeholder: "Enter transfer amount",
                  width: "100%",
                  ...(formData.amount !== null &&
                    formData.amount !== undefined && { format: "#,##0.00" }),
                  isValid: !validationErrors.amount,
                  validationError: validationErrors.amount
                    ? { message: validationErrors.amount }
                    : null,
                }}
              >
                <Label text="Transfer Amount (Liters)" />
                <RequiredRule message="Amount is required" />
                <NumericRule message="Must be a valid number" />
              </SimpleItem>

              {/* Reason removed as not required */}
            </Form>
          </IsolatedForm>
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

          {/* Information Notice - Moved to bottom */}
          {showInfoNotice && (
            <div className="tw-mb-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
              <div className="tw-flex tw-items-start">
                <i className="fa-light fa-info-circle tw-text-blue-600 tw-mt-0.5 tw-mr-3"></i>
                <div className="tw-flex-1">
                  <p className="tw-text-blue-700 tw-text-sm">
                    Transfer fuel between tanks. Amount will be deducted from
                    source tank and added to destination tank. Choose 'Between
                    Tanks' for same site transfers or 'Between Sites' for
                    cross-site transfers.
                  </p>
                </div>
                <button
                  onClick={() => setShowInfoNotice(false)}
                  className="tw-ml-3 tw-text-blue-600 hover:tw-text-blue-800 tw-transition-colors"
                  title="Close information"
                >
                  <i className="fa-light fa-times"></i>
                </button>
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
              text="Save Transfer"
              onClick={handleSubmit}
              disabled={isSubmitting || !canSubmit}
              loading={isSubmitting}
              className="tw-min-w-32"
              type="default"
            >
              <i className="fa-light fa-save tw-mr-2"></i>
              Save Transfer
            </Button>
          </div>
        </div>
      </ScrollView>
    </div>
  );
};

export default TankTransferForm;
