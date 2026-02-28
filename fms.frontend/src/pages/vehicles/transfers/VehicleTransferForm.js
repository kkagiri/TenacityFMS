/**
 * File: VehicleTransferForm.js
 * Purpose: Multi-step wizard orchestrator for creating vehicle transfer with checkup report.
 *          Based on H. Young & Co. Plant Equipment Transfer Checkup Report.
 * Dependencies: DevExtreme, Redux, axiosInstance, Step components
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - TransferStepDetails: Step 1 (site transfer, driver, equipment reading, departure/arrival)
 * - TransferStepInspection: Step 2 (checkup items, GPS equipment conditional, service filters)
 * - TransferStepApproval: Step 3 (signatures, document upload, options)
 *
 * GPS Logic: GPS Equipment section only renders when vehicle.hasGPSInstalled is truthy.
 *            Device info is auto-fetched from /api/v1/providers/mappings?vehicleId=X.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import notify from "devextreme/ui/notify";
import { useSelector, useDispatch } from "react-redux";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import { fetchUsers } from "../../../redux/actions/userActions";
import axiosInstance from "../../../api/axiosInstance";
import TransferStepDetails from "./components/TransferStepDetails";
import TransferStepInspection from "./components/TransferStepInspection";
import TransferStepApproval from "./components/TransferStepApproval";
import useVehicleResolution from "./hooks/useVehicleResolution";
import {
  getEmployeePhoneNumber,
  getUserDisplayName,
  getUserId,
  validateTransferDetails,
} from "./vehicleTransferFormUtils";

import "./VehicleTransferForm.scss";

const STEPS = [
  { key: 0, label: "Transfer Details", icon: "fa-light fa-exchange-alt" },
  { key: 1, label: "Equipment Inspection", icon: "fa-light fa-clipboard-check" },
  { key: 2, label: "Approval & Submit", icon: "fa-light fa-signature" },
];

const EDIT_VEHICLE_PERMISSION = "_edit_vehicle";

const VehicleTransferForm = ({ vehicleId, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const sites = useSelector((state) => state.site?.sites || []);
  const vehicles = useSelector((state) => state.vehicle?.vehicles || []);
  const users = useSelector((state) => state.user?.users || []);
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
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicleId ? parseInt(vehicleId, 10) : null);
  const [tyreDetails, setTyreDetails] = useState([]);
  const [batteryDetails, setBatteryDetails] = useState([]);
  const [serviceFilterParts, setServiceFilterParts] = useState([]);
  const [documentFile, setDocumentFile] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

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
    senderName: "",
    senderFunction: "",
    receiverName: "",
    receiverFunction: "",
    approvedBy: "",
    workshopManagerId: null,
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

  const { vehicle, hasGps, gpsMapping, checkupItems, setCheckupItems } =
    useVehicleResolution(selectedVehicleId, vehicles, setFormData);

  useEffect(() => {
    dispatch(fetchSiteList());
  }, [dispatch]);

  useEffect(() => {
    if (users.length === 0) {
      dispatch(fetchUsers());
    }
  }, [dispatch, users.length]);

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

  const goNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((step) => Math.min(step + 1, STEPS.length - 1));
    }
  };

  const goBack = () => {
    setActiveStep((step) => Math.max(step - 1, 0));
  };

  const handleVehicleSelected = useCallback((event) => {
    const nextVehicleId = event?.value ? parseInt(event.value, 10) : null;
    const normalizedVehicleId = Number.isNaN(nextVehicleId) ? null : nextVehicleId;

    setSelectedVehicleId(normalizedVehicleId);
    setFormData((prev) => ({
      ...prev,
      vehicleId: normalizedVehicleId,
    }));

    clearValidationErrorsForFields(["vehicleId"]);
  }, [clearValidationErrorsForFields]);

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
        workshopManagerId: null,
        workshopManagerSign: "",
      }));
      return;
    }

    const selectedManager = workshopManagerUsers.find(
      (user) => String(user.id) === String(selectedManagerId)
    );

    setFormData((prev) => ({
      ...prev,
      workshopManagerId: selectedManagerId,
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
      const submitData = new FormData();

      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          submitData.append(key, formData[key] instanceof Date ? formData[key].toISOString() : formData[key]);
        }
      });

      submitData.append("checkupItems", JSON.stringify(checkupItems));
      if (tyreDetails.length > 0) submitData.append("tyreDetails", JSON.stringify(tyreDetails));
      if (batteryDetails.length > 0) submitData.append("batteryDetails", JSON.stringify(batteryDetails));
      if (serviceFilterParts.length > 0) submitData.append("serviceFilterParts", JSON.stringify(serviceFilterParts));
      if (documentFile) submitData.append("documentFile", documentFile);

      const response = await axiosInstance.post("/vehicletransfers", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.isSuccess) {
        if (onSuccess) {
          onSuccess(response.data.data);
        }
      } else {
        throw new Error(response.data?.message || "Failed to create transfer");
      }
    } catch (error) {
      notify(error.response?.data?.message || error.message || "Failed to create transfer", "error", 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSites = useMemo(
    () => sites.filter((site) => site.id !== formData.fromSiteId),
    [sites, formData.fromSiteId]
  );

  return (
    <div className="vehicle-transfer-form">
      <div className="vtf-header">
        <div className="vtf-header__title-row">
          <i className="fa-light fa-file-lines vtf-header__icon" />
          <h2 className="vtf-header__title">Plant Equipment Transfer Checkup Report</h2>
        </div>
        {vehicle && (
          <div className="vtf-header__meta">
            <div className="vtf-header__meta-item">
              <span className="vtf-header__meta-label">Vehicle No</span>
              <span className="vtf-header__meta-value">{vehicle.hyoungNo}</span>
            </div>
            <div className="vtf-header__meta-item">
              <span className="vtf-header__meta-label">Reg. No</span>
              <span className="vtf-header__meta-value">{vehicle.numberPlate}</span>
            </div>
            <div className="vtf-header__meta-item">
              <span className="vtf-header__meta-label">Make / Model</span>
              <span className="vtf-header__meta-value">{formData.makeModel || "-"}</span>
            </div>
            <div className="vtf-header__meta-item">
              <span className="vtf-header__meta-label">Current Site</span>
              <span className="vtf-header__meta-value">
                {sites.find((site) => site.id === vehicle.workingSiteId)?.name || "N/A"}
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
          checkupItems={checkupItems}
          serviceFilterParts={serviceFilterParts}
          onFieldChange={handleFieldChange}
          onCheckupItemsChange={setCheckupItems}
          onServiceFilterPartsChange={setServiceFilterParts}
          canManageTemplates={canManageCheckupTemplates}
          onManageTemplates={openCheckupTemplateManager}
        />
      )}

      {activeStep === 2 && (
        <TransferStepApproval
          formData={formData}
          workshopManagerUsers={workshopManagerUsers}
          receiverUsers={workshopManagerUsers}
          documentFile={documentFile}
          onFieldChange={handleFieldChange}
          onDocumentChange={setDocumentFile}
          onWorkshopManagerChange={handleWorkshopManagerChange}
          onReceiverUserChange={handleReceiverUserChange}
        />
      )}

      <div className="vtf-nav">
        <div className="vtf-nav__left">
          {activeStep > 0 && (
            <button className="m365-btn m365-btn--ghost" onClick={goBack} type="button">
              <i className="fa-light fa-arrow-left" /> Back
            </button>
          )}
        </div>
        <div className="vtf-nav__right">
          <button className="m365-btn m365-btn--ghost" onClick={onClose} disabled={isSubmitting} type="button">
            Cancel
          </button>
          {activeStep < STEPS.length - 1 ? (
            <button className="m365-btn m365-btn--primary" onClick={goNext} type="button">
              Next <i className="fa-light fa-arrow-right" />
            </button>
          ) : (
            <button className="m365-btn m365-btn--primary" onClick={handleSubmit} disabled={isSubmitting} type="button">
              {isSubmitting ? (
                <>
                  <i className="fa-light fa-spinner fa-spin" /> Submitting...
                </>
              ) : (
                <>
                  <i className="fa-light fa-check" /> Create Transfer
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleTransferForm;
