/**
 * File: VehicleTransferForm.js
 * Purpose: Multi-step wizard orchestrator for creating/editing vehicle transfer with checkup report.
 *          Auto-saves as Draft on each step transition. Supports resuming existing drafts.
 * Dependencies: DevExtreme, Redux, axiosInstance, Step components
 * Last Modified: 2026-03-02
 *
 * Key Components:
 * - TransferStepDetails: Step 1 (site transfer, driver, equipment reading, departure/arrival)
 * - TransferStepInspection: Step 2 (checkup items, GPS equipment conditional, service filters)
 * - TransferStepApproval: Step 3 (signatures, options, remarks)
 *
 * Draft Flow:
 * - Step 0 → Next: Creates draft via POST /vehicletransfers/draft
 * - Step 1 → Next: Updates draft with inspection data
 * - Step 2 → Submit: Final draft update + POST /{id}/submit-approval
 * - Edit mode: Pass existingTransferId to load and resume an existing draft
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import notify from "devextreme/ui/notify";
import { useSelector, useDispatch } from "react-redux";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import { fetchUsers } from "../../../redux/actions/userActions";
import axiosInstance from "../../../api/axiosInstance";
import TransferStepDetails from "./components/TransferStepDetails";
import TransferStepInspection from "./components/TransferStepInspection";
import TransferStepApproval from "./components/TransferStepApproval";
import GpsIssuePopup from "./components/GpsIssuePopup";
import useVehicleResolution from "./hooks/useVehicleResolution";
import {
  applyCheckupItemUpdate,
  getEmployeePhoneNumber,
  getUserDisplayName,
  getUserId,
  getVehicleDisplayNumber,
  getVehicleRegistrationNumber,
  getVehicleWorkingSiteId,
  normalizeCheckupItemSelection,
  validateTransferDetails,
} from "./vehicleTransferFormUtils";

import "./VehicleTransferForm.scss";

const STEPS = [
  { key: 0, label: "Transfer Details", icon: "fa-light fa-exchange-alt" },
  { key: 1, label: "Equipment Inspection", icon: "fa-light fa-clipboard-check" },
  { key: 2, label: "Approval & Submit", icon: "fa-light fa-signature" },
];

const EDIT_VEHICLE_PERMISSION = "_edit_vehicle";

const VehicleTransferForm = ({ vehicleId, existingTransferId, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const sites = useSelector((state) => state.site?.sites || []);
  const vehicles = useSelector((state) => state.vehicle?.vehicles || []);
  const users = useSelector((state) => state.user?.users || []);
  const currentUser = useSelector((state) => state.auth?.user);
  const myPermissions = useSelector((state) => state.auth?.myPermissions || []);

  const isStandaloneMode = !vehicleId;
  const canManageCheckupTemplates = Array.isArray(myPermissions)
    ? myPermissions.some(
      (permission) =>
        String(permission || "").toLowerCase() === EDIT_VEHICLE_PERMISSION
    )
    : false;

  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(!!existingTransferId);
  const [draftId, setDraftId] = useState(existingTransferId || null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicleId ? parseInt(vehicleId, 10) : null);
  const [tyreDetails, setTyreDetails] = useState([]);
  const [batteryDetails, setBatteryDetails] = useState([]);
  const [serviceFilterParts, setServiceFilterParts] = useState([]);
  const [documentFile, setDocumentFile] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const draftSaveInProgress = useRef(false);
  const preserveLoadedCheckupItemsRef = useRef(false);

  const [formData, setFormData] = useState({
    vehicleId: vehicleId ? parseInt(vehicleId, 10) : null,
    deliveryNoteNumber: "",
    fromSiteId: null,
    toSiteId: null,
    transferDate: new Date(),
    driverId: null,
    driverName: "",
    driverPhone: "",
    jobNumber: "",
    currentReading: null,
    readingUnit: "hrs",
    nextServiceReading: null,
    batteryNumber: "",
    makeModel: "",
    fuelInTank: null,
    sealNumber: "",
    departureTime: null,
    arrivalTime: null,
    antiTheftCheckedDeparture: false,
    antiTheftCheckedArrival: false,
    keysInEnvelopeChecked: false,
    remarks: "",
    senderName: getUserDisplayName(currentUser) || "",
    senderFunction: "",
    receiverName: "",
    receiverFunction: "",
    approvedBy: "",
    approverUserId: null,
    workshopManagerSign: "",
    receiverUserId: null,
    sendEmail: true,
    emailRecipients: "",
    updateOdometer: true,
    createMaintenanceEntry: true,
    // GPS Equipment
    gpsDeviceId: "",
    gpsDeviceCondition: "Good",
    gpsDeviceWorking: true,
    gpsDeviceRemarks: "",
    fuelSensorId: "",
    fuelSensorCondition: "Good",
    fuelSensorWorking: true,
    fuelSensorRemarks: "",
    vehicleManufacturer: "",
    vehicleModelName: "",
  });

  useEffect(() => {
    const parsedVehicleId = vehicleId ? parseInt(vehicleId, 10) : null;
    setSelectedVehicleId(parsedVehicleId);
    setFormData((prev) => ({
      ...prev,
      vehicleId: parsedVehicleId,
    }));
  }, [vehicleId]);

  const { vehicle, hasGps, gpsMapping, gpsInfo, checkupItems, setCheckupItems } =
    useVehicleResolution(selectedVehicleId, vehicles, setFormData, preserveLoadedCheckupItemsRef);

  useEffect(() => {
    dispatch(fetchSiteList());
  }, [dispatch]);

  useEffect(() => {
    if (users.length === 0) {
      dispatch(fetchUsers()).catch(() => { });
    }
  }, [dispatch, users.length]);

  // Load existing transfer for edit mode
  useEffect(() => {
    if (!existingTransferId) return;

    let cancelled = false;
    const loadTransfer = async () => {
      try {
        setIsLoadingDraft(true);
        const response = await axiosInstance.get(`/vehicletransfers/${existingTransferId}`);
        const transfer = response.data?.data || response.data;

        if (cancelled || !transfer) return;

        preserveLoadedCheckupItemsRef.current = Array.isArray(transfer.checkupItems)
          && transfer.checkupItems.length > 0;

        setSelectedVehicleId(transfer.vehicleId);
        setFormData((prev) => ({
          ...prev,
          vehicleId: transfer.vehicleId,
          deliveryNoteNumber: transfer.deliveryNoteNumber || "",
          fromSiteId: transfer.fromSiteId,
          toSiteId: transfer.toSiteId,
          transferDate: transfer.transferDate ? new Date(transfer.transferDate) : new Date(),
          driverId: transfer.driverId,
          driverName: transfer.driverName || "",
          driverPhone: transfer.driverPhone || "",
          jobNumber: transfer.jobNumber || "",
          currentReading: transfer.currentReading,
          readingUnit: transfer.readingUnit || "hrs",
          nextServiceReading: transfer.nextServiceReading,
          batteryNumber: transfer.batteryNumber || "",
          makeModel: transfer.makeModel || "",
          fuelInTank: transfer.fuelInTank,
          sealNumber: transfer.sealNumber || "",
          departureTime: transfer.departureTime ? new Date(transfer.departureTime) : null,
          arrivalTime: transfer.arrivalTime ? new Date(transfer.arrivalTime) : null,
          antiTheftCheckedDeparture: transfer.antiTheftCheckedDeparture || false,
          antiTheftCheckedArrival: transfer.antiTheftCheckedArrival || false,
          keysInEnvelopeChecked: transfer.keysInEnvelopeChecked || false,
          remarks: transfer.remarks || "",
          senderName: transfer.senderName || getUserDisplayName(currentUser) || "",
          senderFunction: transfer.senderFunction || "",
          receiverName: transfer.receiverName || "",
          receiverFunction: transfer.receiverFunction || "",
          approvedBy: transfer.approvedBy || "",
          approverUserId: transfer.approverUserId || null,
          workshopManagerSign: transfer.workshopManagerSign || "",
          receiverUserId: transfer.receiverUserId || null,
          sendEmail: true,
          emailRecipients: "",
          updateOdometer: true,
          createMaintenanceEntry: true,
          gpsDeviceId: transfer.gpsDeviceId || "",
          gpsDeviceCondition: transfer.gpsDeviceCondition || "Good",
          gpsDeviceWorking: transfer.gpsDeviceWorking ?? true,
          gpsDeviceRemarks: transfer.gpsDeviceRemarks || "",
          fuelSensorId: transfer.fuelSensorId || "",
          fuelSensorCondition: transfer.fuelSensorCondition || "Good",
          fuelSensorWorking: transfer.fuelSensorWorking ?? true,
          fuelSensorRemarks: transfer.fuelSensorRemarks || "",
          vehicleManufacturer: transfer.vehicleManufacturer || "",
          vehicleModelName: transfer.vehicleModelName || "",
        }));

        if (transfer.checkupItems?.length) {
          setCheckupItems(transfer.checkupItems.map((item) => normalizeCheckupItemSelection({
            serialNo: item.serialNo,
            description: item.description,
            checkType: item.checkType || "",
            isGood: item.isGood || false,
            isFair: item.isFair || false,
            isDamaged: item.isDamaged || false,
            isWorn: item.isWorn || false,
            wornPercentage: item.wornPercentage,
            remarks: item.remarks || "",
          })));
        }

        if (transfer.tyreDetails?.length) {
          setTyreDetails(transfer.tyreDetails.map((t) => ({
            position: t.position || "",
            brand: t.brand || "",
            size: t.size || "",
            condition: t.condition || 0,
            remarks: t.remarks || "",
          })));
        }

        if (transfer.batteryDetails?.length) {
          setBatteryDetails(transfer.batteryDetails.map((b) => ({
            batteryNumber: b.batteryNumber || "",
            condition: b.condition || "",
            voltage: b.voltage || 0,
            remarks: b.remarks || "",
          })));
        }

        if (transfer.serviceFilterPartsList?.length) {
          setServiceFilterParts(transfer.serviceFilterPartsList.map((s) => ({
            number: s.number,
            description: s.description || "",
            partNumber: s.partNumber || "",
            quantity: s.quantity || 1,
          })));
        }

        setDraftId(transfer.transferId);
      } catch (error) {
        console.error("Failed to load transfer for editing:", error);
        notify("Failed to load transfer data", "error", 3000);
      } finally {
        if (!cancelled) setIsLoadingDraft(false);
      }
    };

    loadTransfer();
    return () => { cancelled = true; };
  }, [existingTransferId]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearValidationErrorsForFields = useCallback((fields) => {
    setValidationErrors((prev) => {
      const next = { ...prev };
      let changed = false;

      fields.forEach((field) => {
        if (next[field]) {
          delete next[field];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, []);

  const handleFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    const fieldsToClear = [field];

    if (field === "fromSiteId" || field === "toSiteId") {
      fieldsToClear.push("fromSiteId", "toSiteId");
    }

    if (field === "departureTime" || field === "arrivalTime") {
      fieldsToClear.push("departureTime", "arrivalTime");
    }

    if (field === "currentReading" || field === "nextServiceReading") {
      fieldsToClear.push("currentReading", "nextServiceReading");
    }

    clearValidationErrorsForFields(fieldsToClear);
  }, [clearValidationErrorsForFields]);

  const validateStep = useCallback((step) => {
    if (step !== 0) {
      return true;
    }

    const errors = validateTransferDetails(formData, isStandaloneMode);

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      notify("Please fix validation errors in Transfer Details", "warning", 3000);
      return false;
    }

    return true;
  }, [formData, isStandaloneMode]);

  /**
   * Builds FormData payload for draft save endpoint.
   * Uses the same field names the backend SaveTransferDraftDTO expects.
   */
  const buildDraftFormData = useCallback(() => {
    const payload = new FormData();

    if (draftId) {
      payload.append("transferId", draftId);
    }

    // Scalar fields from formData (excludes date fields handled separately below)
    const scalarFields = [
      "vehicleId", "deliveryNoteNumber", "fromSiteId", "toSiteId",
      "driverId", "driverName", "driverPhone", "jobNumber",
      "currentReading", "readingUnit", "nextServiceReading",
      "batteryNumber", "makeModel", "fuelInTank", "sealNumber",
      "antiTheftCheckedDeparture", "antiTheftCheckedArrival", "keysInEnvelopeChecked",
      "remarks", "senderName", "senderFunction", "receiverName", "receiverFunction",
      "approvedBy", "workshopManagerSign", "approverUserId", "receiverUserId",
      "sendEmail", "emailRecipients", "updateOdometer", "createMaintenanceEntry",
      "gpsDeviceId", "gpsDeviceCondition", "gpsDeviceWorking", "gpsDeviceRemarks",
      "fuelSensorId", "fuelSensorCondition", "fuelSensorWorking", "fuelSensorRemarks",
      "vehicleManufacturer", "vehicleModelName",
    ];

    scalarFields.forEach((key) => {
      const val = formData[key];
      if (val !== null && val !== undefined && val !== "") {
        payload.append(key, val instanceof Date ? val.toISOString() : val);
      }
    });

    // Date fields
    if (formData.transferDate) {
      payload.append("transferDate", formData.transferDate instanceof Date
        ? formData.transferDate.toISOString()
        : formData.transferDate);
    }
    if (formData.departureTime) {
      payload.append("departureTime", formData.departureTime instanceof Date
        ? formData.departureTime.toISOString()
        : formData.departureTime);
    }
    if (formData.arrivalTime) {
      payload.append("arrivalTime", formData.arrivalTime instanceof Date
        ? formData.arrivalTime.toISOString()
        : formData.arrivalTime);
    }

    // Complex arrays via JSON string fallback setters
    if (checkupItems.length > 0) {
      payload.append("checkupItemsJson", JSON.stringify(checkupItems.map((item) => applyCheckupItemUpdate(item, {}))));
    }
    if (tyreDetails.length > 0) {
      payload.append("tyreDetailsJson", JSON.stringify(tyreDetails));
    }
    if (batteryDetails.length > 0) {
      payload.append("batteryDetailsJson", JSON.stringify(batteryDetails));
    }
    payload.append("serviceFilterPartsJson", JSON.stringify(serviceFilterParts || []));

    // File upload
    if (documentFile) {
      payload.append("documentFile", documentFile);
    }

    return payload;
  }, [formData, draftId, checkupItems, tyreDetails, batteryDetails, serviceFilterParts, documentFile]);

  /**
   * Saves current form state as a draft. Creates new if no draftId, updates if exists.
   * Returns the transfer ID from the response.
   */
  const saveDraftAsync = useCallback(async () => {
    if (draftSaveInProgress.current) return draftId;
    draftSaveInProgress.current = true;

    try {
      setIsSavingDraft(true);
      const payload = buildDraftFormData();

      const response = await axiosInstance.post("/vehicletransfers/draft", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const result = response.data;
      if (result?.isSuccess && result.data?.transferId) {
        const newDraftId = result.data.transferId;
        setDraftId(newDraftId);
        return newDraftId;
      } else {
        throw new Error(result?.message || "Failed to save draft");
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "Failed to save draft";
      notify(msg, "error", 3000);
      throw error;
    } finally {
      setIsSavingDraft(false);
      draftSaveInProgress.current = false;
    }
  }, [buildDraftFormData, draftId]);

  const goNext = async () => {
    if (!validateStep(activeStep)) return;

    try {
      await saveDraftAsync();
      setActiveStep((step) => Math.min(step + 1, STEPS.length - 1));
    } catch {
      // Error already notified via saveDraftAsync
    }
  };

  const goBack = () => {
    setActiveStep((step) => Math.max(step - 1, 0));
  };

  const handleVehicleSelected = useCallback((event) => {
    const nextVehicleId = event?.value ? parseInt(event.value, 10) : null;
    const normalizedVehicleId = Number.isNaN(nextVehicleId) ? null : nextVehicleId;

    preserveLoadedCheckupItemsRef.current = false;

    setSelectedVehicleId(normalizedVehicleId);
    setFormData((prev) => ({
      ...prev,
      vehicleId: normalizedVehicleId,
    }));

    clearValidationErrorsForFields(["vehicleId"]);
  }, [clearValidationErrorsForFields]);

  const handleCheckupItemsChange = useCallback((items) => {
    const normalizedItems = Array.isArray(items)
      ? items.map((item) => applyCheckupItemUpdate(item, {}))
      : [];

    setCheckupItems(normalizedItems);
  }, [setCheckupItems]);

  const handleDriverChange = useCallback(async (event) => {
    const selectedDriverId = event?.value || null;

    if (!selectedDriverId) {
      setFormData((prev) => ({
        ...prev,
        driverId: null,
        driverName: "",
        driverPhone: "",
      }));
      clearValidationErrorsForFields(["driverPhone"]);
      return;
    }

    try {
      const response = await axiosInstance.get(`/employee/${selectedDriverId}`);
      const employee = response.data?.data || response.data?.Data || response.data;

      setFormData((prev) => ({
        ...prev,
        driverId: selectedDriverId,
        driverName: employee?.fullName || employee?.name || "",
        driverPhone: getEmployeePhoneNumber(employee),
      }));

      clearValidationErrorsForFields(["driverPhone"]);
    } catch (error) {
      console.warn("Unable to resolve selected driver:", error);
      setFormData((prev) => ({
        ...prev,
        driverId: selectedDriverId,
        driverName: "",
        driverPhone: "",
      }));
      notify("Unable to load driver phone number", "warning", 3000);
    }
  }, [clearValidationErrorsForFields]);

  const workshopManagerUsers = useMemo(
    () =>
      (Array.isArray(users) ? users : [])
        .filter((user) => user && typeof user === "object")
        .map((user) => ({
          ...user,
          id: getUserId(user),
          displayName: getUserDisplayName(user),
        }))
        .filter((user) => user.id !== null && !user?.isDeleted && user.displayName),
    [users]
  );

  const handleWorkshopManagerChange = useCallback((event) => {
    const selectedManagerId = event?.value ?? null;

    if (selectedManagerId === null || selectedManagerId === undefined || selectedManagerId === "") {
      setFormData((prev) => ({
        ...prev,
        approverUserId: null,
        workshopManagerSign: "",
      }));
      return;
    }

    const selectedManager = workshopManagerUsers.find(
      (user) => String(user.id) === String(selectedManagerId)
    );

    setFormData((prev) => ({
      ...prev,
      approverUserId: selectedManagerId,
      workshopManagerSign: selectedManager?.displayName || "",
    }));
  }, [workshopManagerUsers]);

  const handleReceiverUserChange = useCallback((event) => {
    const selectedUserId = event?.value ?? null;

    if (selectedUserId === null || selectedUserId === undefined || selectedUserId === "") {
      setFormData((prev) => ({
        ...prev,
        receiverUserId: null,
      }));
      return;
    }

    const selectedUser = workshopManagerUsers.find(
      (user) => String(user.id) === String(selectedUserId)
    );

    setFormData((prev) => ({
      ...prev,
      receiverUserId: selectedUserId,
      receiverName: selectedUser?.displayName || prev.receiverName,
    }));
  }, [workshopManagerUsers]);

  const openCheckupTemplateManager = useCallback(() => {
    window.open("/admin/checkup-templates", "_blank", "noopener,noreferrer");
  }, []);

  const handleSubmit = async () => {
    if (!validateStep(0)) {
      setActiveStep(0);
      return;
    }

    try {
      setIsSubmitting(true);

      // Step 1: Final draft save to persist all data
      const transferId = await saveDraftAsync();

      if (!transferId) {
        throw new Error("Draft save failed — no transfer ID returned");
      }

      // Step 2: Find workshop manager email for approval notification
      const selectedManager = workshopManagerUsers.find(
        (u) => String(u.id) === String(formData.approverUserId)
      );

      // Step 3: Submit for approval — transitions Draft → PendingApproval
      const approvalResponse = await axiosInstance.post(
        `/vehicletransfers/${transferId}/submit-approval`,
        {
          workshopManagerEmail: selectedManager?.email || "",
          workshopManagerName: selectedManager?.displayName || formData.workshopManagerSign || "",
          approvalBaseUrl: window.location.origin,
        }
      );

      if (approvalResponse.data?.isSuccess) {
        notify("Transfer submitted for approval", "success", 3000);
        if (onSuccess) {
          onSuccess(approvalResponse.data.data);
        }
      } else {
        throw new Error(approvalResponse.data?.message || "Failed to submit for approval");
      }
    } catch (error) {
      notify(
        error.response?.data?.message || error.message || "Failed to submit transfer",
        "error",
        3000
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // GPS Issue Popup state
  const [showGpsIssuePopup, setShowGpsIssuePopup] = useState(false);

  /**
   * Opens the GPS issue creation popup after ensuring the draft is saved.
   */
  const handleSendGpsForReview = useCallback(async () => {
    try {
      // Ensure draft is saved first so GPS data is persisted
      let currentDraftId = draftId;
      if (!currentDraftId) {
        currentDraftId = await saveDraftAsync();
      }

      if (!currentDraftId) {
        notify("Please save the transfer first", "warning", 3000);
        return;
      }

      setShowGpsIssuePopup(true);
    } catch (error) {
      notify(
        error.response?.data?.message || "Failed to prepare GPS review",
        "error",
        3000
      );
    }
  }, [draftId, saveDraftAsync]);

  const filteredSites = useMemo(
    () => sites.filter((site) => site.id !== formData.fromSiteId),
    [sites, formData.fromSiteId]
  );

  return (
    <div className="vehicle-transfer-form">
      {isLoadingDraft && (
        <div className="tw-absolute tw-inset-0 tw-bg-white tw-bg-opacity-80 tw-z-50 tw-flex tw-items-center tw-justify-center tw-rounded-lg">
          <div className="tw-text-center">
            <i className="fa-light fa-spinner fa-spin tw-text-2xl tw-text-blue-500 tw-mb-2" />
            <p className="tw-text-sm tw-text-gray-500">Loading transfer data...</p>
          </div>
        </div>
      )}
      <div className="vtf-header">
        <div className="vtf-header__title-row">
          <i className="fa-light fa-file-lines vtf-header__icon" />
          <h2 className="vtf-header__title">
            {existingTransferId ? "Edit Transfer Report" : "Plant Equipment Transfer Checkup Report"}
          </h2>
          {draftId && (
            <span className="m365-badge m365-badge--warning tw-ml-3">Draft</span>
          )}
        </div>
        {vehicle && (
          <div className="vtf-header__meta">
            <div className="vtf-header__meta-item">
              <span className="vtf-header__meta-label">Vehicle No</span>
              <span className="vtf-header__meta-value">{getVehicleDisplayNumber(vehicle) || "-"}</span>
            </div>
            <div className="vtf-header__meta-item">
              <span className="vtf-header__meta-label">Reg. No</span>
              <span className="vtf-header__meta-value">{getVehicleRegistrationNumber(vehicle) || "-"}</span>
            </div>
            <div className="vtf-header__meta-item">
              <span className="vtf-header__meta-label">Make / Model</span>
              <span className="vtf-header__meta-value">{formData.makeModel || "-"}</span>
            </div>
            <div className="vtf-header__meta-item">
              <span className="vtf-header__meta-label">Current Site</span>
              <span className="vtf-header__meta-value">
                {sites.find((site) => site.id === getVehicleWorkingSiteId(vehicle))?.name || "N/A"}
              </span>
            </div>
            <div className="vtf-header__meta-item">
              <span className="vtf-header__meta-label">GPS</span>
              <span className={`vtf-header__meta-value ${hasGps ? "vtf-header__meta-value--success" : ""}`}>
                {hasGps ? "GPS Installed" : "GPS Not Installed"}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="vtf-stepper">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.key}>
            <button
              className={`vtf-stepper__step ${activeStep === index ? "vtf-stepper__step--active" : ""} ${activeStep > index ? "vtf-stepper__step--done" : ""}`}
              onClick={() => {
                if (index < activeStep || validateStep(activeStep)) {
                  setActiveStep(index);
                }
              }}
              type="button"
            >
              <span className="vtf-stepper__num">
                {activeStep > index ? <i className="fa-light fa-check" /> : index + 1}
              </span>
              <span className="vtf-stepper__label">{step.label}</span>
            </button>
            {index < STEPS.length - 1 && (
              <span className={`vtf-stepper__line ${activeStep > index ? "vtf-stepper__line--done" : ""}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {activeStep === 0 && (
        <TransferStepDetails
          formData={formData}
          sites={sites}
          filteredSites={filteredSites}
          validationErrors={validationErrors}
          isStandaloneMode={isStandaloneMode}
          onFieldChange={handleFieldChange}
          onVehicleSelected={handleVehicleSelected}
          onDriverChange={handleDriverChange}
        />
      )}

      {activeStep === 1 && (
        <TransferStepInspection
          formData={formData}
          hasGps={hasGps}
          gpsMapping={gpsMapping}
          gpsInfo={gpsInfo}
          checkupItems={checkupItems}
          serviceFilterParts={serviceFilterParts}
          onFieldChange={handleFieldChange}
          onCheckupItemsChange={handleCheckupItemsChange}
          onServiceFilterPartsChange={setServiceFilterParts}
          canManageTemplates={canManageCheckupTemplates}
          onManageTemplates={openCheckupTemplateManager}
          onSendGpsForReview={handleSendGpsForReview}
        />
      )}

      {activeStep === 2 && (
        <TransferStepApproval
          formData={formData}
          workshopManagerUsers={workshopManagerUsers}
          receiverUsers={workshopManagerUsers}
          onFieldChange={handleFieldChange}
          onWorkshopManagerChange={handleWorkshopManagerChange}
          onReceiverUserChange={handleReceiverUserChange}
        />
      )}

      <div className="vtf-nav">
        <div className="vtf-nav__left">
          {activeStep > 0 && (
            <button className="m365-btn m365-btn--ghost" onClick={goBack} type="button" disabled={isSavingDraft}>
              <i className="fa-light fa-arrow-left" /> Back
            </button>
          )}
          {draftId && (
            <span className="tw-text-xs tw-text-gray-400 tw-ml-2">
              <i className="fa-light fa-save tw-mr-1" />
              Draft #{draftId}
            </span>
          )}
        </div>
        <div className="vtf-nav__right">
          <button className="m365-btn m365-btn--ghost" onClick={onClose} disabled={isSubmitting || isSavingDraft} type="button">
            Cancel
          </button>
          {activeStep < STEPS.length - 1 ? (
            <button className="m365-btn m365-btn--primary" onClick={goNext} disabled={isSavingDraft} type="button">
              {isSavingDraft ? (
                <>
                  <i className="fa-light fa-spinner fa-spin" /> Saving...
                </>
              ) : (
                <>
                  Next <i className="fa-light fa-arrow-right" />
                </>
              )}
            </button>
          ) : (
            <button className="m365-btn m365-btn--primary" onClick={handleSubmit} disabled={isSubmitting || isSavingDraft} type="button">
              {isSubmitting ? (
                <>
                  <i className="fa-light fa-spinner fa-spin" /> Submitting...
                </>
              ) : (
                <>
                  <i className="fa-light fa-paper-plane" /> Submit for Approval
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <GpsIssuePopup
        visible={showGpsIssuePopup}
        onHide={() => setShowGpsIssuePopup(false)}
        vehicleId={selectedVehicleId}
        vehicleNumber={getVehicleRegistrationNumber(vehicle)}
        fromSiteId={formData.fromSiteId}
        fromSiteName={sites.find((s) => s.id === formData.fromSiteId)?.name}
        gpsMapping={gpsMapping}
        gpsInfo={gpsInfo}
        gpsCondition={formData.gpsDeviceCondition}
        gpsWorking={formData.gpsDeviceWorking}
        currentUserName={currentUser?.userName}
        onIssueCreated={() => notify("GPS issue created successfully", "success", 3000)}
      />
    </div>
  );
};

export default VehicleTransferForm;
