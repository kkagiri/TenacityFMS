/**
 * File:          VehicleFormPanel.js
 * Purpose:       M365 native form for vehicle create/edit, rendered in detail and add panels.
 *                Uses native M365 inputs; DevExtreme SelectBox only for
 *                searchable dropdowns (types, models, manufacturers, sites, employees).
 *                Mirrors the TankFormPanel design pattern.
 * Dependencies:  M365SectionCard, devextreme-react/select-box, Redux actions
 * Last Modified: 2026-02-26
 *
 * Props:
 * - vehicle      (object): The vehicle to edit (null for create mode)
 * - onSubmit     (func):   Called with formData on successful validation
 * - onCancel     (func):   Called when user cancels editing
 * - isSaving     (bool):   Whether a save is in progress
 * - submitLabel  (string): Footer submit button text
 * - savingLabel  (string): Footer submit button text while saving
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { SelectBox } from "devextreme-react/select-box";
import M365SectionCard from "../../../components/m365/M365SectionCard";
import store from "../../../store";

import { fetchVehicleTypes } from "../../../redux/actions/vehicleTypeActions";
import { fetchVehicleModels } from "../../../redux/actions/vehicleModelActions";
import { fetchVehicleManufacturers } from "../../../redux/actions/vehicleManufacturerActions";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import { fetchEmployees } from "../../../redux/actions/employeeActions";
import { fetchExpectedAvg } from "../../../redux/actions/expectedAvgActions";

const MOVEMENT_PROFILE_OPTIONS = [
    { id: 0, name: "Undefined" },
    { id: 1, name: "Geofence" },
    { id: 2, name: "Cluster" },
];

/* ── empty form shape ── */
const buildFormData = (v) => ({
    hyoungNo: v?.hyoungNo || "",
    numberPlate: v?.numberPlate || "",
    yom: v?.yom || "",
    vehicleTypeId: v?.vehicleTypeId || null,
    vehicleModelId: v?.vehicleModelId || null,
    vehicleManufacturerId: v?.vehicleManufacturerId || null,
    workingSiteId: v?.workingSiteId || null,
    defaultEmployeeId: v?.defaultEmployeeId || null,
    defaultExptdAvgid: v?.defaultExptdAvgid || null,
    fuelTankCapacity: v?.fuelTankCapacity || null,
    capacity: v?.capacity || "",
    isFullTankPolicy: v?.isFullTankPolicy || v?.IsFullTankPolicy || false,
    passenger: v?.passenger || "",
    currentPhysicalReading: v?.currentPhysicalReading || "",
    excessWorkingHrCost: v?.excessWorkingHrCost || 0,
    averageKmL: v?.averageKmL || false,
    hasGPSInstalled: v?.hasGPSInstalled || false,
    isCompanyVehicle: v?.isCompanyVehicle || false,
    isActive: v?.isActive ?? true,
    gpsgategeneratedId: v?.gpsgategeneratedId || false,
    movementProfile: v?.movementProfile ?? 1,
});

const VehicleFormPanel = ({
    vehicle,
    onSubmit,
    onCancel,
    isSaving,
    submitLabel = "Save Changes",
    savingLabel = "Saving...",
}) => {
    const dispatch = useDispatch();

    const [form, setForm] = useState(() => buildFormData(vehicle));
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    /* dropdown data */
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [vehicleModels, setVehicleModels] = useState([]);
    const [vehicleManufacturers, setVehicleManufacturers] = useState([]);
    const [sites, setSites] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [expectedAverages, setExpectedAverages] = useState([]);

    const normalizeLookupOptions = (items, config) => {
        const source = Array.isArray(items) ? items : [];
        return source
            .map((item) => {
                const idValue = config.idKeys
                    .map((key) => item?.[key])
                    .find((value) => value !== undefined && value !== null && value !== "");
                const id = Number(idValue);
                if (!Number.isFinite(id)) return null;

                const name = config.nameKeys
                    .map((key) => item?.[key])
                    .find((value) => typeof value === "string" && value.trim().length > 0);
                if (!name) return null;

                return { id, name };
            })
            .filter(Boolean);
    };

    const normalizedVehicleTypes = useMemo(
        () =>
            normalizeLookupOptions(vehicleTypes, {
                idKeys: ["id", "vehicleTypeId", "Id", "VehicleTypeId"],
                nameKeys: ["name", "vehicleTypeName", "Name", "VehicleTypeName"],
            }),
        [vehicleTypes]
    );

    const normalizedVehicleManufacturers = useMemo(
        () =>
            normalizeLookupOptions(vehicleManufacturers, {
                idKeys: ["id", "vehicleManufacturerId", "Id", "VehicleManufacturerId"],
                nameKeys: [
                    "name",
                    "vehicleManufacturerName",
                    "Name",
                    "VehicleManufacturerName",
                ],
            }),
        [vehicleManufacturers]
    );

    const normalizedVehicleModels = useMemo(() => {
        const source = Array.isArray(vehicleModels) ? vehicleModels : [];
        return source
            .map((item) => {
                const idValue = ["id", "vehicleModelId", "Id", "VehicleModelId"]
                    .map((key) => item?.[key])
                    .find((value) => value !== undefined && value !== null && value !== "");
                const id = Number(idValue);
                if (!Number.isFinite(id)) return null;

                const name = ["name", "vehicleModelName", "Name", "VehicleModelName"]
                    .map((key) => item?.[key])
                    .find((value) => typeof value === "string" && value.trim().length > 0);
                if (!name) return null;

                const manufacturerIdValue = [
                    "manufacturerId",
                    "vehicleManufacturerId",
                    "ManufacturerId",
                    "VehicleManufacturerId",
                ]
                    .map((key) => item?.[key])
                    .find((value) => value !== undefined && value !== null && value !== "");
                const manufacturerId = Number(manufacturerIdValue);
                const manufacturerName = [
                    "manufacturerName",
                    "vehicleManufacturerName",
                    "ManufacturerName",
                    "VehicleManufacturerName",
                    "name",
                ]
                    .map((key) => item?.manufacturer?.[key] ?? item?.vehicleManufacturer?.[key] ?? item?.[key])
                    .find((value) => typeof value === "string" && value.trim().length > 0);

                return {
                    id,
                    name,
                    manufacturerId: Number.isFinite(manufacturerId)
                        ? manufacturerId
                        : null,
                    manufacturerName: manufacturerName || null,
                };
            })
            .filter(Boolean);
    }, [vehicleModels]);

    const filteredVehicleModels = useMemo(() => {
        const selectedManufacturerId = Number(form.vehicleManufacturerId);
        if (!Number.isFinite(selectedManufacturerId)) {
            return [];
        }

        const byId = normalizedVehicleModels.filter(
            (model) => Number(model.manufacturerId) === selectedManufacturerId
        );
        if (byId.length > 0) return byId;

        const selectedManufacturerName = normalizedVehicleManufacturers
            .find((manufacturer) => Number(manufacturer.id) === selectedManufacturerId)
            ?.name?.trim()
            ?.toLowerCase();

        if (selectedManufacturerName) {
            const byName = normalizedVehicleModels.filter(
                (model) =>
                    typeof model.manufacturerName === "string" &&
                    model.manufacturerName.trim().toLowerCase() === selectedManufacturerName
            );
            if (byName.length > 0) return byName;
        }

        // Fallback for payloads without manufacturer linkage.
        return normalizedVehicleModels;
    }, [
        normalizedVehicleModels,
        normalizedVehicleManufacturers,
        form.vehicleManufacturerId,
    ]);

    /* ── Initialise form when vehicle changes ── */
    useEffect(() => {
        setForm(buildFormData(vehicle));
        setErrors({});
    }, [vehicle]);

    /* ── Load dropdown data once ── */
    useEffect(() => {
        const load = async () => {
            const state = store.getState();
            const hasData =
                state.vehicleType?.vehicleTypes?.length > 0 &&
                state.vehicleModel?.vehicleModels?.length > 0 &&
                state.vehicleManufacturer?.manufacturers?.length > 0 &&
                state.site?.sites?.length > 0 &&
                state.employee?.employees?.length > 0 &&
                state.expectedAvg?.expectedAverages?.length > 0;

            if (hasData) {
                setVehicleTypes(state.vehicleType.vehicleTypes);
                setVehicleModels(state.vehicleModel.vehicleModels);
                setVehicleManufacturers(state.vehicleManufacturer.manufacturers);
                setSites(state.site.sites);
                setEmployees(state.employee.employees);
                setExpectedAverages(state.expectedAvg.expectedAverages);
                return;
            }

            try {
                setIsLoading(true);
                const [t, mo, ma, s, e, ea] = await Promise.all([
                    dispatch(fetchVehicleTypes()),
                    dispatch(fetchVehicleModels()),
                    dispatch(fetchVehicleManufacturers()),
                    dispatch(fetchSiteList()),
                    dispatch(fetchEmployees()),
                    dispatch(fetchExpectedAvg()),
                ]);
                setVehicleTypes(t?.data || []);
                setVehicleModels(mo?.data || []);
                setVehicleManufacturers(ma?.data || []);
                setSites(s?.data || []);
                setEmployees(e?.data || []);
                setExpectedAverages(ea?.data || []);
            } catch (err) {
                console.error("Error loading dropdown data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [dispatch]);

    /* ── Field setter ── */
    const set = useCallback((field, value) => {
        const idFields = new Set([
            "vehicleTypeId",
            "vehicleModelId",
            "vehicleManufacturerId",
            "workingSiteId",
            "defaultEmployeeId",
            "defaultExptdAvgid",
        ]);

        let nextValue = value;
        if (idFields.has(field)) {
            if (value === "" || value === undefined || value === null) {
                nextValue = null;
            } else {
                const numericValue = Number(value);
                nextValue = Number.isFinite(numericValue) ? numericValue : value;
            }
        }

        setForm((p) => ({ ...p, [field]: nextValue }));
        setErrors((p) => ({ ...p, [field]: "" }));
    }, []);

    useEffect(() => {
        if (!form.vehicleModelId) return;

        const selectedModelId = Number(form.vehicleModelId);
        const stillValid = filteredVehicleModels.some(
            (model) => Number(model.id) === selectedModelId
        );

        if (!stillValid) {
            setForm((prev) => ({ ...prev, vehicleModelId: null }));
            setErrors((prev) => ({ ...prev, vehicleModelId: "" }));
        }
    }, [form.vehicleManufacturerId, form.vehicleModelId, filteredVehicleModels]);

    /* ── Validation ── */
    const validate = () => {
        const e = {};
        if (!form.hyoungNo?.trim()) e.hyoungNo = "Hyoung No is required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    /* ── Submit ── */
    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit(form);
    };

    if (isLoading) {
        return (
            <div className="m365-empty">
                <i className="fa-light fa-spinner fa-spin m365-empty__icon" />
                <p className="m365-empty__text">Loading form data…</p>
            </div>
        );
    }

    return (
        <div className="m365-tank-form">
            <div className="m365-tank-form__scroller">
                {/* ── Basic Information ── */}
                <M365SectionCard title="Basic Information">
                    <div className="tw-space-y-4">
                        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                            {/* Hyoung No */}
                            <div>
                                <label className="m365-field__label">
                                    Hyoung No <span style={{ color: "#d13438" }}>*</span>
                                </label>
                                <input
                                    className={`m365-input${errors.hyoungNo ? " m365-input--error" : ""}`}
                                    placeholder="Enter company registration number"
                                    value={form.hyoungNo}
                                    onChange={(e) => set("hyoungNo", e.target.value)}
                                    maxLength={50}
                                />
                                {errors.hyoungNo && (
                                    <span className="m365-field__error">{errors.hyoungNo}</span>
                                )}
                            </div>

                            {/* Number Plate */}
                            <div>
                                <label className="m365-field__label">Number Plate</label>
                                <input
                                    className="m365-input"
                                    placeholder="Enter number plate"
                                    value={form.numberPlate}
                                    onChange={(e) => set("numberPlate", e.target.value)}
                                    maxLength={20}
                                />
                            </div>
                        </div>

                        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                            {/* Year of Manufacture */}
                            <div>
                                <label className="m365-field__label">Year of Manufacture</label>
                                <input
                                    className="m365-input"
                                    placeholder="e.g. 2020"
                                    value={form.yom}
                                    onChange={(e) => set("yom", e.target.value)}
                                    maxLength={4}
                                />
                            </div>

                            {/* Full Tank Capacity */}
                            <div>
                                <label className="m365-field__label">Fuel Tank Capacity (L)</label>
                                <input
                                    type="number"
                                    className="m365-input"
                                    placeholder="Enter capacity"
                                    value={form.fuelTankCapacity ?? ""}
                                    onChange={(e) =>
                                        set("fuelTankCapacity", e.target.value ? Number(e.target.value) : null)
                                    }
                                    min={0}
                                />
                            </div>
                        </div>
                    </div>
                </M365SectionCard>

                {/* ── Technical Details ── */}
                <M365SectionCard title="Technical Details">
                    <div className="tw-space-y-4">
                        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                            {/* Vehicle Type */}
                            <div>
                                <label className="m365-field__label">Vehicle Type</label>
                                <SelectBox
                                    dataSource={normalizedVehicleTypes}
                                    value={form.vehicleTypeId}
                                    valueExpr="id"
                                    displayExpr="name"
                                    onValueChanged={(e) => set("vehicleTypeId", e.value)}
                                    placeholder="Select vehicle type"
                                    searchEnabled
                                    showClearButton
                                    height={34}
                                    stylingMode="outlined"
                                />
                            </div>

                            {/* Manufacturer */}
                            <div>
                                <label className="m365-field__label">Manufacturer</label>
                                <SelectBox
                                    dataSource={normalizedVehicleManufacturers}
                                    value={form.vehicleManufacturerId}
                                    valueExpr="id"
                                    displayExpr="name"
                                    onValueChanged={(e) => set("vehicleManufacturerId", e.value)}
                                    placeholder="Select manufacturer"
                                    searchEnabled
                                    showClearButton
                                    height={34}
                                    stylingMode="outlined"
                                />
                            </div>
                        </div>

                        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                            {/* Model */}
                            <div>
                                <label className="m365-field__label">Model</label>
                                <SelectBox
                                    dataSource={filteredVehicleModels}
                                    value={form.vehicleModelId}
                                    valueExpr="id"
                                    displayExpr="name"
                                    onValueChanged={(e) => set("vehicleModelId", e.value)}
                                    placeholder={
                                        form.vehicleManufacturerId
                                            ? "Select model"
                                            : "Select manufacturer first"
                                    }
                                    searchEnabled
                                    showClearButton
                                    disabled={!form.vehicleManufacturerId}
                                    height={34}
                                    stylingMode="outlined"
                                />
                            </div>

                            {/* Passenger Capacity */}
                            <div>
                                <label className="m365-field__label">Passenger Capacity</label>
                                <input
                                    className="m365-input"
                                    placeholder="Enter passenger capacity"
                                    value={form.passenger}
                                    onChange={(e) => set("passenger", e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="m365-field__label">Cargo Capacity</label>
                            <input
                                className="m365-input"
                                placeholder="Enter cargo capacity"
                                value={form.capacity}
                                onChange={(e) => set("capacity", e.target.value)}
                            />
                        </div>
                    </div>
                </M365SectionCard>

                {/* ── Operational Details ── */}
                <M365SectionCard title="Operational Details">
                    <div className="tw-space-y-4">
                        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                            {/* Working Site */}
                            <div>
                                <label className="m365-field__label">Working Site</label>
                                <SelectBox
                                    dataSource={sites}
                                    value={form.workingSiteId}
                                    valueExpr="id"
                                    displayExpr="name"
                                    onValueChanged={(e) => set("workingSiteId", e.value)}
                                    placeholder="Select working site"
                                    searchEnabled
                                    showClearButton
                                    height={34}
                                    stylingMode="outlined"
                                />
                            </div>

                            {/* Default Employee */}
                            <div>
                                <label className="m365-field__label">Default Employee</label>
                                <SelectBox
                                    dataSource={employees}
                                    value={form.defaultEmployeeId}
                                    valueExpr="id"
                                    displayExpr="fullName"
                                    onValueChanged={(e) => set("defaultEmployeeId", e.value)}
                                    placeholder="Select default employee"
                                    searchEnabled
                                    showClearButton
                                    height={34}
                                    stylingMode="outlined"
                                />
                            </div>
                        </div>

                        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                            {/* Expected Average */}
                            <div>
                                <label className="m365-field__label">Expected Average</label>
                                <SelectBox
                                    dataSource={expectedAverages}
                                    value={form.defaultExptdAvgid}
                                    valueExpr="id"
                                    displayExpr="expectedAveraged"
                                    onValueChanged={(e) => set("defaultExptdAvgid", e.value)}
                                    placeholder="Select expected average"
                                    searchEnabled
                                    showClearButton
                                    height={34}
                                    stylingMode="outlined"
                                />
                            </div>

                            {/* Excess Working Hour Cost */}
                            <div>
                                <label className="m365-field__label">Excess Working Hour Cost</label>
                                <input
                                    type="number"
                                    className="m365-input"
                                    placeholder="Enter cost"
                                    value={form.excessWorkingHrCost ?? ""}
                                    onChange={(e) =>
                                        set("excessWorkingHrCost", e.target.value ? Number(e.target.value) : 0)
                                    }
                                    min={0}
                                    step={0.01}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="m365-field__label">Movement Profile</label>
                            <SelectBox
                                dataSource={MOVEMENT_PROFILE_OPTIONS}
                                value={form.movementProfile}
                                valueExpr="id"
                                displayExpr="name"
                                onValueChanged={(e) => set("movementProfile", e.value ?? 1)}
                                placeholder="Select movement profile"
                                height={34}
                                stylingMode="outlined"
                            />
                        </div>

                        {/* Current Physical Reading */}
                        <div>
                            <label className="m365-field__label">Current Physical Reading</label>
                            <input
                                className="m365-input"
                                placeholder="Enter current reading"
                                value={form.currentPhysicalReading}
                                onChange={(e) => set("currentPhysicalReading", e.target.value)}
                            />
                        </div>
                    </div>
                </M365SectionCard>

                {/* ── GPS & Tracking ── */}
                <M365SectionCard title="GPS & Tracking">
                    <div className="tw-space-y-3">
                        <div className="tw-flex tw-items-center tw-justify-between tw-py-2">
                            <div>
                                <label className="m365-field__label tw-mb-0">GPS Installed</label>
                                <p className="m365-field__hint">Vehicle has GPS hardware</p>
                            </div>
                            <button
                                type="button"
                                className={`m365-toggle m365-tank-form__toggle-btn ${form.hasGPSInstalled ? "m365-toggle--on" : ""}`}
                                onClick={() => set("hasGPSInstalled", !form.hasGPSInstalled)}
                                aria-pressed={form.hasGPSInstalled}
                            >
                                <span className="m365-toggle__track" />
                            </button>
                        </div>
                        <div className="tw-flex tw-items-center tw-justify-between tw-py-2">
                            <div>
                                <label className="m365-field__label tw-mb-0">GPSGate Generated ID</label>
                                <p className="m365-field__hint">Auto-generated GPSGate identifier</p>
                            </div>
                            <button
                                type="button"
                                className={`m365-toggle m365-tank-form__toggle-btn ${form.gpsgategeneratedId ? "m365-toggle--on" : ""}`}
                                onClick={() => set("gpsgategeneratedId", !form.gpsgategeneratedId)}
                                aria-pressed={form.gpsgategeneratedId}
                            >
                                <span className="m365-toggle__track" />
                            </button>
                        </div>
                        <div className="tw-flex tw-items-center tw-justify-between tw-py-2">
                            <div>
                                <label className="m365-field__label tw-mb-0">Average Km/L</label>
                                <p className="m365-field__hint">Track fuel efficiency in km per litre</p>
                            </div>
                            <button
                                type="button"
                                className={`m365-toggle m365-tank-form__toggle-btn ${form.averageKmL ? "m365-toggle--on" : ""}`}
                                onClick={() => set("averageKmL", !form.averageKmL)}
                                aria-pressed={form.averageKmL}
                            >
                                <span className="m365-toggle__track" />
                            </button>
                        </div>
                    </div>
                </M365SectionCard>

                {/* ── Policy & Status ── */}
                <M365SectionCard title="Policy & Status">
                    <div className="tw-space-y-3">
                        <div className="tw-flex tw-items-center tw-justify-between tw-py-2">
                            <div>
                                <label className="m365-field__label tw-mb-0">Full Tank Policy</label>
                                <p className="m365-field__hint">Require full tank on refuel</p>
                            </div>
                            <button
                                type="button"
                                className={`m365-toggle m365-tank-form__toggle-btn ${form.isFullTankPolicy ? "m365-toggle--on" : ""}`}
                                onClick={() => set("isFullTankPolicy", !form.isFullTankPolicy)}
                                aria-pressed={form.isFullTankPolicy}
                            >
                                <span className="m365-toggle__track" />
                            </button>
                        </div>
                        <div className="tw-flex tw-items-center tw-justify-between tw-py-2">
                            <div>
                                <label className="m365-field__label tw-mb-0">Company Vehicle</label>
                                <p className="m365-field__hint">Belongs to company fleet</p>
                            </div>
                            <button
                                type="button"
                                className={`m365-toggle m365-tank-form__toggle-btn ${form.isCompanyVehicle ? "m365-toggle--on" : ""}`}
                                onClick={() => set("isCompanyVehicle", !form.isCompanyVehicle)}
                                aria-pressed={form.isCompanyVehicle}
                            >
                                <span className="m365-toggle__track" />
                            </button>
                        </div>
                        <div className="tw-flex tw-items-center tw-justify-between tw-py-2">
                            <div>
                                <label className="m365-field__label tw-mb-0">Active</label>
                                <p className="m365-field__hint">Vehicle is available for operations</p>
                            </div>
                            <button
                                type="button"
                                className={`m365-toggle m365-tank-form__toggle-btn ${form.isActive ? "m365-toggle--on" : ""}`}
                                onClick={() => set("isActive", !form.isActive)}
                                aria-pressed={form.isActive}
                            >
                                <span className="m365-toggle__track" />
                            </button>
                        </div>
                    </div>
                </M365SectionCard>
            </div>

            {/* ── Sticky footer ── */}
            <div className="m365-tank-form__actions">
                <button
                    type="button"
                    className="m365-btn m365-btn--ghost"
                    onClick={onCancel}
                    disabled={isSaving}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className="m365-btn m365-btn--primary"
                    onClick={handleSubmit}
                    disabled={isSaving}
                >
                    {isSaving ? savingLabel : submitLabel}
                </button>
            </div>
        </div>
    );
};

export default VehicleFormPanel;

