/**
 * File:          TankFormPanel.js
 * Purpose:       Create / Edit tank form rendered inside a SlidePanel.
 *                Uses native M365 inputs; DevExtreme SelectBox only for
 *                searchable dropdowns (sites, vehicles).
 * Dependencies:  M365SectionCard, devextreme-react/select-box, tankActions
 * Last Modified: 2026-02-26
 *
 * Props:
 * - mode          ("create" | "edit")
 * - tank          (object | null)
 * - onSubmit      (func): Called after successful create/update
 * - onClose       (func): Close the panel
 */
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SelectBox } from "devextreme-react/select-box";
import notify from "devextreme/ui/notify";
import M365SectionCard from "../../../components/m365/M365SectionCard";
import { createTank, updateTank } from "../../../redux/actions/tankActions";
import { fetchVehicleList } from "../../../redux/actions/vehicleActions";

/* ── constants ── */
const TANK_TYPE_OPTIONS = [
  { value: "Stationary", text: "Stationary (Fixed Location)" },
  { value: "MobileTanker", text: "Mobile Tanker (Moves with Vehicle)" },
];

const PRIORITY_OPTIONS = [
  { value: "High", text: "High" },
  { value: "Medium", text: "Medium" },
  { value: "Low", text: "Low" },
];

const FUEL_GRADES = ["Diesel", "Petrol", "Kerosene"];

const EMPTY_FORM = {
  name: "",
  tankVolume: 0,
  tankHeight: null,
  tankLength: null,
  useBookKeeping: false,
  hasAutomaticBookKeeping: false,
  priority: null,
  siteId: null,
  discrepancyThreshold: null,
  currentStock: 0,
  fuelGradeId: null,
  fuelGradeName: null,
  tankType: "Stationary",
  latitude: null,
  longitude: null,
  linkedVehicleId: null,
  locationValidationRadius: 100,
};

const norm = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

/* ── helpers ── */
const getInactiveSiteId = (sites) => {
  if (!Array.isArray(sites) || sites.length === 0) return null;
  const byName = sites.find((s) => {
    const n = (s?.name || "").trim().toLowerCase();
    return ["inactive", "inactive site", "unassigned", "unassigned tanks", "no site", "not assigned"].includes(n);
  });
  if (byName?.id) return Number(byName.id);
  const flagged = sites.find((s) => s?.isActive === false || s?.isActive === 0);
  return flagged?.id ? Number(flagged.id) : null;
};

const TankFormPanel = ({ mode = "create", tank, onSubmit, onClose }) => {
  const dispatch = useDispatch();
  const { sites } = useSelector((state) => state.site);
  const { vehicles } = useSelector((state) => state.vehicle);
  const { tanks } = useSelector((state) => state.tank);

  const sitesDS = Array.isArray(sites) ? sites : [];
  const vehiclesDS = Array.isArray(vehicles) ? vehicles : [];

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { dispatch(fetchVehicleList()); }, [dispatch]);

  useEffect(() => {
    if (mode === "edit" && tank) {
      setForm({
        ...tank,
        useBookKeeping: tank.useBookKeeping === 1 || tank.useBookKeeping === true,
        hasAutomaticBookKeeping: tank.hasAutomaticBookKeeping === 1 || tank.hasAutomaticBookKeeping === true,
        priority: tank.priority || null,
        fuelGradeId: tank.fuelGradeId || null,
        fuelGradeName: tank.fuelGradeName || null,
        siteId: norm(tank.siteId ?? tank.siteID ?? tank.site?.id),
        tankType: tank.tankType || "Stationary",
        latitude: tank.latitude || null,
        longitude: tank.longitude || null,
        linkedVehicleId: norm(tank.linkedVehicleId ?? tank.vehicleId ?? tank.linkedVehicle?.vehicleId),
        locationValidationRadius: tank.locationValidationRadius ?? 100,
      });
    } else if (mode === "create") {
      setForm(EMPTY_FORM);
    }
  }, [mode, tank]);

  const set = useCallback((field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = "Tank name is required";
    if (!form.tankVolume || form.tankVolume <= 0) e.tankVolume = "Capacity must be > 0";
    if (form.tankType === "MobileTanker" && !form.linkedVehicleId) e.linkedVehicleId = "Vehicle is required for mobile tankers";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const inactiveSiteId = getInactiveSiteId(sitesDS);
    let resolvedSiteId = norm(form.siteId);

    if (!resolvedSiteId) {
      if (!inactiveSiteId) {
        notify("Site is required. Create/select an inactive site named 'Inactive' or 'Unassigned'.", "error", 5000);
        return;
      }
      resolvedSiteId = inactiveSiteId;
    }

    /* one-tank-per-site check removed — sites can have multiple tanks */

    setSaving(true);
    try {
      const payload = {
        id: tank ? tank.id : 0,
        name: form.name,
        tankVolume: form.tankVolume,
        tankHeight: form.tankHeight || null,
        tankLength: form.tankLength || null,
        ptsId: tank?.ptsId || null,
        probeNumber: tank?.probeNumber || null,
        ptsTankId: tank?.ptsTankId || null,
        usePtsProbeReadings: tank?.usePtsProbeReadings || false,
        probePhysicalStockUpdateSource: tank?.probePhysicalStockUpdateSource || null,
        calibrationChartSource: tank?.calibrationChartSource || null,
        productVolumeSource: tank?.productVolumeSource || null,
        useBookKeeping: Boolean(form.useBookKeeping),
        hasAutomaticBookKeeping: Boolean(form.hasAutomaticBookKeeping),
        priority: form.priority || null,
        siteId: resolvedSiteId,
        discrepancyThreshold: form.discrepancyThreshold || null,
        currentStock: form.currentStock || 0,
        fuelGradeId: form.fuelGradeId || null,
        fuelGradeName: form.fuelGradeName || null,
        tankType: form.tankType || "Stationary",
        latitude: form.tankType === "Stationary" ? form.latitude || null : null,
        longitude: form.tankType === "Stationary" ? form.longitude || null : null,
        linkedVehicleId: form.tankType === "MobileTanker" ? norm(form.linkedVehicleId) : null,
        locationValidationRadius: form.locationValidationRadius ?? 100,
      };

      let result;
      if (tank) {
        result = await dispatch(updateTank(tank.id, payload));
      } else {
        result = await dispatch(createTank(payload));
      }

      if (result?.success) {
        onSubmit();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Error saving tank";
      notify(msg, "error", 4000);
    } finally {
      setSaving(false);
    }
  };

  const isCreate = mode === "create";
  const isMobile = form.tankType === "MobileTanker";

  return (
    <div className="m365-tank-form">
      <div className="m365-tank-form__scroller">
        {/* ── Basic Information ── */}
        <M365SectionCard title="Basic Information">
          <div className="tw-space-y-4">
            {/* Name */}
            <div>
              <label className="m365-field__label">
                Tank Name <span style={{ color: "#d13438" }}>*</span>
              </label>
              <input
                className={`m365-input${errors.name ? " m365-input--error" : ""}`}
                placeholder="Enter tank name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                maxLength={255}
              />
              {errors.name && <span className="m365-field__error">{errors.name}</span>}
            </div>

            {/* Site */}
            <div>
              <label className="m365-field__label">Site</label>
              <SelectBox
                dataSource={sitesDS}
                value={form.siteId}
                valueExpr="id"
                displayExpr="name"
                onValueChanged={(e) => set("siteId", e.value)}
                placeholder="Select Site (optional)"
                searchEnabled
                showClearButton
                height={34}
                stylingMode="outlined"
              />
            </div>

            {/* Fuel Grade */}
            <div>
              <label className="m365-field__label">Fuel Grade</label>
              <SelectBox
                dataSource={FUEL_GRADES}
                value={form.fuelGradeName}
                onValueChanged={(e) => set("fuelGradeName", e.value)}
                placeholder="Select Fuel Grade"
                searchEnabled
                showClearButton
                height={34}
                stylingMode="outlined"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="m365-field__label">Priority</label>
              <SelectBox
                dataSource={PRIORITY_OPTIONS}
                value={form.priority}
                valueExpr="value"
                displayExpr="text"
                onValueChanged={(e) => set("priority", e.value)}
                placeholder="Select Priority"
                showClearButton
                height={34}
                stylingMode="outlined"
              />
            </div>
          </div>
        </M365SectionCard>

        {/* ── Dimensions & Capacity ── */}
        <M365SectionCard title="Dimensions & Capacity">
          <div className="tw-space-y-4">
            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              {/* Capacity */}
              <div>
                <label className="m365-field__label">
                  Capacity (L) <span style={{ color: "#d13438" }}>*</span>
                </label>
                <input
                  type="number"
                  className={`m365-input${errors.tankVolume ? " m365-input--error" : ""}`}
                  value={form.tankVolume ?? ""}
                  onChange={(e) => set("tankVolume", Number(e.target.value) || 0)}
                  min={0}
                  step={100}
                />
                {errors.tankVolume && <span className="m365-field__error">{errors.tankVolume}</span>}
              </div>

              {/* Current Stock */}
              <div>
                <label className="m365-field__label">Current Stock (L)</label>
                <input
                  type="number"
                  className="m365-input"
                  value={form.currentStock ?? ""}
                  onChange={(e) => set("currentStock", Number(e.target.value) || 0)}
                  min={0}
                  step={100}
                />
              </div>
            </div>

            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              {/* Height */}
              <div>
                <label className="m365-field__label">Height (m)</label>
                <input
                  type="number"
                  className="m365-input"
                  value={form.tankHeight ?? ""}
                  onChange={(e) => set("tankHeight", e.target.value ? Number(e.target.value) : null)}
                  min={0}
                  step={0.1}
                />
              </div>
              {/* Length */}
              <div>
                <label className="m365-field__label">Length (m)</label>
                <input
                  type="number"
                  className="m365-input"
                  value={form.tankLength ?? ""}
                  onChange={(e) => set("tankLength", e.target.value ? Number(e.target.value) : null)}
                  min={0}
                  step={0.1}
                />
              </div>
            </div>

            {/* Discrepancy Threshold */}
            <div>
              <label className="m365-field__label">Discrepancy Threshold (L)</label>
              <input
                type="number"
                className="m365-input"
                value={form.discrepancyThreshold ?? ""}
                onChange={(e) => set("discrepancyThreshold", e.target.value ? Number(e.target.value) : null)}
                min={0}
                step={10}
              />
            </div>
          </div>
        </M365SectionCard>

        {/* ── Book Keeping ── */}
        <M365SectionCard title="Book Keeping">
          <div className="tw-space-y-3">
            <div className="tw-flex tw-items-center tw-justify-between tw-py-2">
              <div>
                <label className="m365-field__label tw-mb-0">Use Book Keeping</label>
                <p className="m365-field__hint">Enable manual stock tracking</p>
              </div>
              <button
                type="button"
                className={`m365-toggle m365-tank-form__toggle-btn ${form.useBookKeeping ? "m365-toggle--on" : ""}`}
                onClick={() => set("useBookKeeping", !form.useBookKeeping)}
                aria-pressed={form.useBookKeeping}
                title={form.useBookKeeping ? "Disable book keeping" : "Enable book keeping"}
              >
                <span className="m365-toggle__track" />
              </button>
            </div>
            <div className="tw-flex tw-items-center tw-justify-between tw-py-2">
              <div>
                <label className="m365-field__label tw-mb-0">Automatic Book Keeping</label>
                <p className="m365-field__hint">System auto-records stock changes</p>
              </div>
              <button
                type="button"
                className={`m365-toggle m365-tank-form__toggle-btn ${form.hasAutomaticBookKeeping ? "m365-toggle--on" : ""}`}
                onClick={() => set("hasAutomaticBookKeeping", !form.hasAutomaticBookKeeping)}
                aria-pressed={form.hasAutomaticBookKeeping}
                title={form.hasAutomaticBookKeeping ? "Disable automatic book keeping" : "Enable automatic book keeping"}
              >
                <span className="m365-toggle__track" />
              </button>
            </div>
          </div>
        </M365SectionCard>

        {/* ── Location Validation ── */}
        <M365SectionCard title="Location Validation">
          <div className="tw-space-y-4">
            {/* Tank Type */}
            <div>
              <label className="m365-field__label">Tank Type</label>
              <SelectBox
                dataSource={TANK_TYPE_OPTIONS}
                value={form.tankType}
                valueExpr="value"
                displayExpr="text"
                onValueChanged={(e) => set("tankType", e.value)}
                height={34}
                stylingMode="outlined"
              />
            </div>

            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              {/* Validation Radius */}
              <div>
                <label className="m365-field__label">Validation Radius (m)</label>
                <input
                  type="number"
                  className="m365-input"
                  value={form.locationValidationRadius ?? 100}
                  onChange={(e) => set("locationValidationRadius", Number(e.target.value) || 100)}
                  min={0}
                  max={10000}
                  step={10}
                />
              </div>
            </div>

            {/* GPS — stationary only */}
            {!isMobile && (
              <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                <div>
                  <label className="m365-field__label">Latitude (-90 to 90)</label>
                  <input
                    type="text"
                    className="m365-input"
                    placeholder="e.g., -1.28333000"
                    value={form.latitude ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const p = parseFloat(v);
                      if (!isNaN(p) && p >= -90 && p <= 90) set("latitude", p);
                      else if (v === "" || v === null) set("latitude", null);
                    }}
                  />
                </div>
                <div>
                  <label className="m365-field__label">Longitude (-180 to 180)</label>
                  <input
                    type="text"
                    className="m365-input"
                    placeholder="e.g., 36.81667000"
                    value={form.longitude ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const p = parseFloat(v);
                      if (!isNaN(p) && p >= -180 && p <= 180) set("longitude", p);
                      else if (v === "" || v === null) set("longitude", null);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Vehicle — mobile only */}
            {isMobile && (
              <div>
                <label className="m365-field__label">
                  Linked Vehicle <span style={{ color: "#d13438" }}>*</span>
                </label>
                <SelectBox
                  dataSource={vehiclesDS}
                  value={form.linkedVehicleId}
                  valueExpr="vehicleId"
                  displayExpr={(item) =>
                    item
                      ? `${item.vehicleCode || item.registrationNo || "Unknown"} - ${item.vehicleName || item.model || ""}`
                      : ""
                  }
                  onValueChanged={(e) => set("linkedVehicleId", e.value)}
                  placeholder="Select Vehicle"
                  searchEnabled
                  showClearButton
                  height={34}
                  stylingMode="outlined"
                />
                {errors.linkedVehicleId && <span className="m365-field__error">{errors.linkedVehicleId}</span>}
                <p className="m365-field__hint">GPS location comes from this vehicle</p>
              </div>
            )}
          </div>
        </M365SectionCard>

        {/* ── Actions ── */}
      </div>
      <div className="m365-tank-form__actions">
        <button type="button" className="m365-btn m365-btn--ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="m365-btn m365-btn--primary"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving
            ? isCreate ? "Creating…" : "Saving…"
            : isCreate ? "Create Tank" : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default TankFormPanel;
