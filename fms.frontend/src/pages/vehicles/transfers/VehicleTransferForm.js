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
 * - TransferStepApproval: Step 3 (signatures, document upload, options, remarks)
 *
 * GPS Logic: GPS Equipment section only renders when vehicle.hasGPSInstalled is truthy.
 *            Device info is auto-fetched from /api/v1/providers/mappings?vehicleId=X.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import notify from "devextreme/ui/notify";
import { useSelector, useDispatch } from "react-redux";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import axiosInstance from "../../../api/axiosInstance";
import TransferStepDetails from "./components/TransferStepDetails";
import TransferStepInspection from "./components/TransferStepInspection";
import TransferStepApproval from "./components/TransferStepApproval";

import "./VehicleTransferForm.scss";

// ── Step definitions ──────────────────────────────────────────
const STEPS = [
  { key: 0, label: "Transfer Details", icon: "fa-light fa-exchange-alt" },
  { key: 1, label: "Equipment Inspection", icon: "fa-light fa-clipboard-check" },
  { key: 2, label: "Approval & Submit", icon: "fa-light fa-signature" },
];

const VehicleTransferForm = ({ vehicleId, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const sites = useSelector((state) => state.site.sites);
  const vehicles = useSelector((state) => state.vehicle.vehicles);

  // ── Wizard state ──────────────────────────────────────────
  const [activeStep, setActiveStep] = useState(0);

  // ── Form state ────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicle, setVehicle] = useState(null);
  const [hasGps, setHasGps] = useState(false);
  const [gpsMapping, setGpsMapping] = useState(null);
  const [checkupItems, setCheckupItems] = useState([]);
  const [tyreDetails, setTyreDetails] = useState([]);
  const [batteryDetails, setBatteryDetails] = useState([]);
  const [serviceFilterParts, setServiceFilterParts] = useState([]);
  const [documentFile, setDocumentFile] = useState(null);

  const [formData, setFormData] = useState({
    vehicleId: vehicleId,
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
    workshopManagerSign: "",
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

  // ── Load sites & checkup template ─────────────────────────
  useEffect(() => {
    dispatch(fetchSiteList());
    loadCheckupTemplate();
  }, [dispatch]);

  // ── Resolve vehicle info ──────────────────────────────────
  useEffect(() => {
    if (vehicleId && vehicles.length > 0) {
      const v = vehicles.find((v) => v.vehicleId === parseInt(vehicleId));
      if (v) {
        setVehicle(v);
        const isEquipment =
          v.vehicleType?.name?.toLowerCase()?.includes("generator") ||
          v.vehicleType?.name?.toLowerCase()?.includes("excavator") ||
          v.vehicleType?.name?.toLowerCase()?.includes("loader") ||
          v.vehicleType?.name?.toLowerCase()?.includes("dozer") ||
          v.vehicleType?.name?.toLowerCase()?.includes("crane") ||
          v.vehicleType?.name?.toLowerCase()?.includes("forklift");

        setFormData((prev) => ({
          ...prev,
          fromSiteId: v.workingSiteId,
          makeModel: `${v.vehicleManufacturer?.name || ""} ${v.vehicleModel?.name || ""}`.trim(),
          vehicleManufacturer: v.vehicleManufacturer?.name || "",
          vehicleModelName: v.vehicleModel?.name || "",
          currentReading: v.currentPhysicalReading ? parseFloat(v.currentPhysicalReading) : null,
          readingUnit: isEquipment ? "hrs" : "km",
        }));

        // Check GPS flag and fetch mapping
        const gpsInstalled = !!v.hasGPSInstalled;
        setHasGps(gpsInstalled);
        if (gpsInstalled) {
          fetchGpsMapping(v.vehicleId);
        }
      }
    }
  }, [vehicleId, vehicles]);

  // ── Fetch GPS provider mapping ────────────────────────────
  const fetchGpsMapping = async (vId) => {
    try {
      const res = await axiosInstance.get("/providers/mappings", { params: { vehicleId: vId } });
      const mappings = res.data?.data || res.data?.Data || [];
      const active = Array.isArray(mappings) ? mappings.find((m) => m.isActive) : null;
      if (active) {
        setGpsMapping(active);
        setFormData((prev) => ({
          ...prev,
          gpsDeviceId: active.externalDeviceId || active.deviceIMEI || "",
          fuelSensorId: active.hasFuelSensor ? (active.fuelSensorType || "Installed") : "",
        }));
      }
    } catch (err) {
      console.warn("Could not fetch GPS mapping:", err);
    }
  };

  const loadCheckupTemplate = async () => {
    try {
      const response = await axiosInstance.get("/vehicletransfers/checkup-template");
      if (response.data) {
        setCheckupItems(
          response.data.map((item) => ({
            ...item,
            isGood: true,
            isFair: false,
            isDamaged: false,
            isWorn: false,
            wornPercentage: null,
            remarks: "",
          }))
        );
      }
    } catch {
      setDefaultCheckupItems();
    }
  };

  const setDefaultCheckupItems = () => {
    const defaults = [
      { serialNo: 1, description: "SUSPENSION", checkType: "CHECK" },
      { serialNo: 2, description: "BRAKES, INDICATORS, GAUGES & FAN BELT", checkType: "CHECK & TEST" },
      { serialNo: 3, description: "COOLING SYSTEM, COOLANT LEVEL & LEAKS", checkType: "CHECK" },
      { serialNo: 4, description: "ENGINE OIL LEVEL & LEAKS", checkType: "CHECK" },
    ].map((item) => ({ ...item, isGood: true, isFair: false, isDamaged: false, isWorn: false, wornPercentage: null, remarks: "" }));
    setCheckupItems(defaults);
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ── Step validation ───────────────────────────────────────
  const validateStep = (step) => {
    if (step === 0) {
      if (!formData.fromSiteId) { notify("Please select the 'From Site'", "warning", 3000); return false; }
      if (!formData.toSiteId) { notify("Please select the 'To Site'", "warning", 3000); return false; }
      if (formData.fromSiteId === formData.toSiteId) { notify("Cannot transfer to the same site", "warning", 3000); return false; }
      if (!formData.transferDate) { notify("Please select the transfer date", "warning", 3000); return false; }
    }
    return true;
  };

  const goNext = () => {
    if (validateStep(activeStep)) setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep(0)) { setActiveStep(0); return; }

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
        onSuccess && onSuccess(response.data.data);
      } else {
        throw new Error(response.data?.message || "Failed to create transfer");
      }
    } catch (error) {
      notify(error.response?.data?.message || error.message || "Failed to create transfer", "error", 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Callbacks for child step components ──────────────────
  const handleDriverChange = useCallback((employeeId, employee) => {
    setFormData((prev) => ({
      ...prev,
      driverId: employeeId,
      driverName: employee?.fullName || employee?.name || "",
      driverPhone: employee?.phoneNumber || "",
    }));
  }, []);

  const filteredSites = useMemo(
    () => sites.filter((s) => s.id !== formData.fromSiteId),
    [sites, formData.fromSiteId]
  );

  // ═══════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="vehicle-transfer-form">
      {/* ── Vehicle Info Banner ─────────────────────────────── */}
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
              <span className="vtf-header__meta-value">{formData.makeModel || "—"}</span>
            </div>
            <div className="vtf-header__meta-item">
              <span className="vtf-header__meta-label">Current Site</span>
              <span className="vtf-header__meta-value">
                {sites.find((s) => s.id === vehicle.workingSiteId)?.name || "N/A"}
              </span>
            </div>
            <div className="vtf-header__meta-item">
              <span className="vtf-header__meta-label">GPS</span>
              <span className={`vtf-header__meta-value ${hasGps ? "vtf-header__meta-value--success" : ""}`}>
                {hasGps ? "Installed" : "Not installed"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Stepper ────────────────────────────────────────── */}
      <div className="vtf-stepper">
        {STEPS.map((step, idx) => (
          <React.Fragment key={step.key}>
            <button
              className={`vtf-stepper__step ${activeStep === idx ? "vtf-stepper__step--active" : ""} ${activeStep > idx ? "vtf-stepper__step--done" : ""}`}
              onClick={() => { if (idx < activeStep || validateStep(activeStep)) setActiveStep(idx); }}
              type="button"
            >
              <span className="vtf-stepper__num">
                {activeStep > idx ? <i className="fa-light fa-check" /> : idx + 1}
              </span>
              <span className="vtf-stepper__label">{step.label}</span>
            </button>
            {idx < STEPS.length - 1 && <span className={`vtf-stepper__line ${activeStep > idx ? "vtf-stepper__line--done" : ""}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* ═══ STEP 1 — Transfer Details ═══════════════════════ */}
      {activeStep === 0 && (
        <TransferStepDetails
          formData={formData}
          sites={sites}
          filteredSites={filteredSites}
          onFieldChange={handleFieldChange}
          onDriverChange={handleDriverChange}
        />
      )}

      {/* ═══ STEP 2 — Equipment Inspection ═══════════════════ */}
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
        />
      )}

      {/* ═══ STEP 3 — Approval & Submit ══════════════════════ */}
      {activeStep === 2 && (
        <TransferStepApproval
          formData={formData}
          documentFile={documentFile}
          onFieldChange={handleFieldChange}
          onDocumentChange={setDocumentFile}
        />
      )}

      {/* ── Step Navigation ────────────────────────────────── */}
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
                <><i className="fa-light fa-spinner fa-spin" /> Submitting...</>
              ) : (
                <><i className="fa-light fa-check" /> Create Transfer</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleTransferForm;
