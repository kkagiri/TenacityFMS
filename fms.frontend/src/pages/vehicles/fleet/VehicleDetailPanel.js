/**
 * File:          VehicleDetailPanel.js
 * Purpose:       M365 Admin Center style detail panel for viewing/managing a vehicle.
 *                Follows the same design language as UserDetailPanel — single wide panel,
 *                profile header with action links, tabbed content, drill-down views.
 * Dependencies:  SlidePanel, M365StatusBadge, Redux, vehicle sub-components
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - VehicleDetailPanel(): Slide-in panel with icon header, action bar, and tabbed content
 *   Tabs: General (vehicle info/assignment/settings) | Activity (manage sub-views) | Status (GPS/live)
 *   Actions: Edit, Assign Tag, Expected Average, Open Full Page, Delete
 */
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import notify from "devextreme/ui/notify";

import SlidePanel from "../../../components/ui/SlidePanel";
import M365StatusBadge from "../../../components/m365/M365StatusBadge";

import TagAssignmentForm from "../../../components/Tags/TagAssignmentForm/TagAssignmentForm";
import EnhancedExpectedAverageForm from "../details/components/EnhancedExpectedAverageForm";
import VehicleFormPanel from "./VehicleFormPanel";
import VehicleConsumptionHistory from "../details/components/VehicleConsumptionHistory";
import VehicleGPSInformation from "../details/components/VehicleGPSInformation";
import VehicleFuelingRuleAssignment from "../details/components/VehicleFuelingRuleAssignment";
import VehicleMaintenanceHistory from "../maintenance/VehicleMaintenanceHistory";
import VehicleFuelingHistory from "../maintenance/VehicleFuelingHistory";
import VehicleDocumentsList from "../documents/VehicleDocumentsList";
import VehicleTransferHistory from "../transfers/VehicleTransferHistory";

import {
    getVehicleById,
    updateVehicle,
    deleteVehicle,
} from "../../../redux/actions/vehicleActions";
import { fetchTags } from "../../../redux/actions/tagActions";
import { fetchVehicleTypes } from "../../../redux/actions/vehicleTypeActions";
import { fetchVehicleManufacturers } from "../../../redux/actions/vehicleManufacturerActions";
import { fetchVehicleModels } from "../../../redux/actions/vehicleModelActions";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import axiosInstance from "../../../api/axiosInstance";
import { usePermissions } from "../../../hooks/usePermissions";

import "./VehicleDetailPanel.scss";

/* ── Tab definitions ── */
const PANEL_TABS = [
    { key: "general", label: "General", icon: "fa-light fa-truck" },
    { key: "activity", label: "Applications", icon: "fa-light fa-grid-2" },
    { key: "status", label: "Status", icon: "fa-light fa-signal-stream" },
];

/* ── Drill-down view keys ── */
const VIEWS = {
    NONE: null,
    EDIT: "edit",
    TAG: "tag",
    EXPECTED_AVG: "expectedAvg",
    GPS: "gps",
    CONSUMPTION: "consumption",
    MAINTENANCE: "maintenance",
    FUELING: "fueling",
    DOCUMENTS: "documents",
    FUELING_RULES: "fuelingRules",
    TRANSFERS: "transfers",
};

const VehicleDetailPanel = ({ open, onClose, vehicleId, onVehicleUpdated }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { hasPermission } = usePermissions();
    const isAdmin = hasPermission("_Edit_Vehicle");

    const vehicles = useSelector((state) => state.vehicle.vehicles);
    const tags = useSelector((state) => state.tag.tags);
    const vehicleTypes = useSelector((state) => state.vehicleType.vehicleTypes);
    const vehicleManufacturers = useSelector((state) => state.vehicleManufacturer.manufacturers);
    const vehicleModels = useSelector((state) => state.vehicleModel.vehicleModels);
    const sites = useSelector((state) => state.site?.sites || []);

    useEffect(() => {
        if (!open) return;

        if (!Array.isArray(vehicleTypes) || vehicleTypes.length === 0) {
            dispatch(fetchVehicleTypes());
        }
        if (!Array.isArray(vehicleManufacturers) || vehicleManufacturers.length === 0) {
            dispatch(fetchVehicleManufacturers());
        }
        if (!Array.isArray(vehicleModels) || vehicleModels.length === 0) {
            dispatch(fetchVehicleModels());
        }
        if (!Array.isArray(sites) || sites.length === 0) {
            dispatch(fetchSiteList());
        }
    }, [open, dispatch, vehicleTypes, vehicleManufacturers, vehicleModels, sites]);

    // ── State ──────────────────────────────────────────────────────────────
    const [vehicle, setVehicle] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [gpsData, setGpsData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("general");
    const [editMode, setEditMode] = useState(false);
    const [activeView, setActiveView] = useState(VIEWS.NONE);

    // ── Load vehicle data ──────────────────────────────────────────────────
    const loadVehicle = useCallback(async () => {
        if (!vehicleId) return;
        setIsLoading(true);
        try {
            let data = vehicles.find((v) => v.vehicleId === parseInt(vehicleId));
            if (!data) {
                const res = await dispatch(getVehicleById(vehicleId));
                data = res?.data;
            }
            setVehicle(data);
            dispatch(fetchTags());

            // Load GPS data
            if (data?.hasGPSInstalled) {
                try {
                    const gpsRes = await axiosInstance.get(
                        `/vehicletracking/${vehicleId}/gps-information`
                    );
                    if (gpsRes.data?.isSuccess) setGpsData(gpsRes.data.data);
                } catch {
                    /* GPS data is optional */
                }
            }
        } catch (err) {
            console.error("Error loading vehicle:", err);
            notify("Failed to load vehicle details", "error", 3000);
        } finally {
            setIsLoading(false);
        }
    }, [vehicleId, dispatch, vehicles]);

    // ── Reset on vehicle change ────────────────────────────────────────────
    useEffect(() => {
        if (open && vehicleId) {
            setActiveTab("general");
            setEditMode(false);
            setActiveView(VIEWS.NONE);
            setGpsData(null);
            loadVehicle();
        }
    }, [open, vehicleId, loadVehicle]);

    // ── Helpers ────────────────────────────────────────────────────────────
    const displayName = vehicle
        ? `${vehicle.hyoungNo} — ${vehicle.numberPlate}`
        : "Vehicle";

    const emptyDisplay = "-";

    const hasDisplayValue = (value) => {
        const normalized = typeof value === "string" ? value.trim() : value;
        return (
            Boolean(normalized) &&
            normalized !== emptyDisplay &&
            normalized !== "—" &&
            normalized !== "�"
        );
    };

    const resolveLookupName = (list, id, nameKeys = ["name"]) => {
        const nId = Number(id);
        if (!Number.isFinite(nId)) return "";

        const idKeys = [
            "id",
            "Id",
            "vehicleTypeId",
            "vehicleManufacturerId",
            "vehicleModelId",
        ];

        const match = (Array.isArray(list) ? list : []).find((item) =>
            idKeys.some((key) => Number(item?.[key]) === nId)
        );
        if (!match) return "";

        const keys = Array.isArray(nameKeys) ? nameKeys : [nameKeys];
        const resolvedKey = keys.find((key) => Boolean(match?.[key]));
        return resolvedKey ? match[resolvedKey] : "";
    };

    const vehicleTypeDisplay = useMemo(() => {
        const direct =
            vehicle?.vehicleType?.name ||
            vehicle?.vehicleType?.vehicleTypeName ||
            (typeof vehicle?.vehicleType === "string" ? vehicle?.vehicleType : "") ||
            vehicle?.vehicleTypeName ||
            vehicle?.VehicleTypeName;
        if (direct) return direct;
        return (
            resolveLookupName(
                vehicleTypes,
                vehicle?.vehicleTypeId ?? vehicle?.VehicleTypeId ?? vehicle?.vehicleType?.id,
                ["name", "vehicleTypeName"]
            ) || emptyDisplay
        );
    }, [vehicle, vehicleTypes]);

    const vehicleManufacturerDisplay = useMemo(() => {
        const direct =
            vehicle?.vehicleManufacturer?.name ||
            vehicle?.vehicleManufacturer?.vehicleManufacturerName ||
            (typeof vehicle?.vehicleManufacturer === "string"
                ? vehicle?.vehicleManufacturer
                : "") ||
            vehicle?.vehicleManufacturerName ||
            vehicle?.VehicleManufacturerName;
        if (direct) return direct;
        return (
            resolveLookupName(
                vehicleManufacturers,
                vehicle?.vehicleManufacturerId ??
                    vehicle?.VehicleManufacturerId ??
                    vehicle?.vehicleManufacturer?.id,
                ["name", "vehicleManufacturerName"]
            ) || emptyDisplay
        );
    }, [vehicle, vehicleManufacturers]);

    const vehicleModelDisplay = useMemo(() => {
        const direct =
            vehicle?.vehicleModel?.name ||
            vehicle?.vehicleModel?.vehicleModelName ||
            (typeof vehicle?.vehicleModel === "string" ? vehicle?.vehicleModel : "") ||
            vehicle?.vehicleModelName ||
            vehicle?.VehicleModelName;
        if (direct) return direct;
        return (
            resolveLookupName(
                vehicleModels,
                vehicle?.vehicleModelId ?? vehicle?.VehicleModelId ?? vehicle?.vehicleModel?.id,
                ["name", "vehicleModelName"]
            ) || emptyDisplay
        );
    }, [vehicle, vehicleModels]);

    const workingSiteDisplay = useMemo(() => {
        const direct =
            vehicle?.workingSite?.name ||
            vehicle?.workingSite?.siteName ||
            (typeof vehicle?.workingSite === "string" ? vehicle?.workingSite : "") ||
            vehicle?.workingSiteName ||
            vehicle?.WorkingSiteName;
        if (direct) return direct;
        return (
            resolveLookupName(
                sites,
                vehicle?.workingSiteId ?? vehicle?.WorkingSiteId ?? vehicle?.workingSite?.id,
                ["name", "siteName"]
            ) || "Not Assigned"
        );
    }, [vehicle, sites]);

    const vehicleYearDisplay =
        vehicle?.yom ??
        vehicle?.Yom ??
        vehicle?.yearOfManufacture ??
        vehicle?.YearOfManufacture ??
        vehicle?.manufactureYear ??
        vehicle?.year ??
        emptyDisplay;

    const subtitle = vehicle
        ? [
            hasDisplayValue(vehicleManufacturerDisplay) ? vehicleManufacturerDisplay : "",
            hasDisplayValue(vehicleModelDisplay) ? vehicleModelDisplay : "",
            hasDisplayValue(vehicleYearDisplay) ? vehicleYearDisplay : "",
        ]
            .filter(Boolean)
            .join(" ")
        : "";


    const isActive = vehicle?.isActive ?? true;

    // ── Action handlers ───────────────────────────────────────────────────
    const handleSaveVehicle = useCallback(
        async (formData) => {
            try {
                setIsSaving(true);
                const updateData = {
                    ...vehicle,
                    ...formData,
                    vehicleId: parseInt(vehicleId),
                };
                const response = await dispatch(updateVehicle(vehicleId, updateData));
                if (response.success) {
                    setVehicle((prev) => ({ ...prev, ...formData }));
                    notify("Vehicle updated successfully", "success", 3000);
                    setEditMode(false);
                    onVehicleUpdated?.();
                } else {
                    notify(
                        response.message || "Failed to update vehicle",
                        "error",
                        3000
                    );
                }
            } catch (err) {
                notify(err.message || "Failed to update vehicle", "error", 3000);
            } finally {
                setIsSaving(false);
            }
        },
        [dispatch, vehicleId, vehicle, onVehicleUpdated]
    );

    const handleDelete = useCallback(async () => {
        if (!vehicle) return;
        if (
            !window.confirm(
                `Delete vehicle ${vehicle.hyoungNo} - ${vehicle.numberPlate}? This cannot be undone.`
            )
        )
            return;
        try {
            const response = await dispatch(deleteVehicle(vehicleId));
            if (response?.success) {
                notify("Vehicle deleted", "success", 3000);
                onClose?.();
                onVehicleUpdated?.();
            } else {
                throw new Error(response?.message || "Delete failed");
            }
        } catch (err) {
            notify("Failed to delete vehicle", "error", 3000);
        }
    }, [dispatch, vehicleId, vehicle, onClose, onVehicleUpdated]);

    const handleOpenFullPage = useCallback(() => {
        navigate(`/vehicles/${vehicleId}/details`);
    }, [navigate, vehicleId]);

    const handleRefresh = useCallback(() => {
        if (!vehicleId) return;
        loadVehicle();
        onVehicleUpdated?.();
    }, [vehicleId, loadVehicle, onVehicleUpdated]);

    const handleClose = useCallback(() => {
        if (editMode) {
            if (!window.confirm("You have unsaved changes. Discard them?")) return;
        }
        onClose();
    }, [editMode, onClose]);

    // ── Activity items config ─────────────────────────────────────────────
    const activityItems = useMemo(
        () => [
            {
                key: VIEWS.CONSUMPTION,
                label: "Consumption History",
                icon: "fa-light fa-gas-pump",
                color: "var(--m365-warning, #ca5010)",
                bg: "var(--m365-orange-bg, #fff4ce)",
            },
            {
                key: VIEWS.MAINTENANCE,
                label: "Maintenance History",
                icon: "fa-light fa-wrench",
                color: "#8764b8",
                bg: "#f3f0f9",
            },
            {
                key: VIEWS.FUELING,
                label: "Fueling History",
                icon: "fa-light fa-pump",
                color: "var(--m365-primary, #0078d4)",
                bg: "var(--m365-blue-bg, #deecf9)",
            },
            {
                key: VIEWS.DOCUMENTS,
                label: "Documents",
                icon: "fa-light fa-file-lines",
                color: "var(--m365-success, #107c10)",
                bg: "var(--m365-green-bg, #dff6dd)",
            },
            {
                key: VIEWS.FUELING_RULES,
                label: "Fueling Rules",
                icon: "fa-light fa-gavel",
                color: "#d83b01",
                bg: "#fed9cc",
            },
            {
                key: VIEWS.TRANSFERS,
                label: "Transfer History",
                icon: "fa-light fa-truck-moving",
                color: "var(--m365-primary, #0078d4)",
                bg: "var(--m365-blue-bg, #deecf9)",
            },
        ],
        []
    );

    if (!open) return null;

    // ── Render: General Tab (View) ────────────────────────────────────────
    const renderGeneralView = () => (
        <div className="m365-detail-content">
            {/* Basic Information section */}
            <div className="m365-flat-section m365-flat-section--first">
                <h3 className="m365-flat-section__title">Basic Information</h3>
                <div className="m365-info-grid">
                <div className="m365-info-cell">
                    <span className="m365-info-cell__label">Hyoung No</span>
                    <span className="m365-info-cell__value">
                        {vehicle?.hyoungNo || "—"}
                    </span>
                </div>
                <div className="m365-info-cell">
                    <span className="m365-info-cell__label">Number Plate</span>
                    <span className="m365-info-cell__value">
                        {vehicle?.numberPlate || "—"}
                    </span>
                    {isAdmin && (
                        <button
                            className="m365-info-cell__link"
                            onClick={() => setEditMode(true)}
                        >
                            Manage vehicle
                        </button>
                    )}
                </div>
                <div className="m365-info-cell">
                    <span className="m365-info-cell__label">Type</span>
                    <span className="m365-info-cell__value">
                        {vehicleTypeDisplay}
                    </span>
                </div>
                <div className="m365-info-cell">
                    <span className="m365-info-cell__label">Manufacturer</span>
                    <span className="m365-info-cell__value">
                        {vehicleManufacturerDisplay}
                    </span>
                </div>
                <div className="m365-info-cell">
                    <span className="m365-info-cell__label">Model</span>
                    <span className="m365-info-cell__value">
                        {vehicleModelDisplay}
                    </span>
                </div>
                <div className="m365-info-cell">
                    <span className="m365-info-cell__label">Year</span>
                    <span className="m365-info-cell__value">
                        {vehicleYearDisplay}
                    </span>
                </div>
                </div>
            </div>

            {/* Assignment section */}
            <div className="m365-flat-section">
                <h3 className="m365-flat-section__title">Assignment</h3>
                <div className="m365-info-grid">
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">Default Driver</span>
                        <span className="m365-info-cell__value">
                            {vehicle?.defaultDriver?.name ||
                                vehicle?.defaultDriver?.fullName ||
                                "Not Assigned"}
                        </span>
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">Working Site</span>
                        <span className="m365-info-cell__value">
                            {workingSiteDisplay}
                        </span>
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">Tags</span>
                        <span className="m365-info-cell__value">
                            {vehicle?.tags?.length > 0 ? (
                                <span className="vdp-tag-list">
                                    {vehicle.tags.map((tag, i) => (
                                        <span
                                            key={i}
                                            className="m365-badge m365-badge--primary"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </span>
                            ) : (
                                "No tags"
                            )}
                        </span>
                        {isAdmin && (
                            <button
                                className="m365-info-cell__link"
                                onClick={() => setActiveView(VIEWS.TAG)}
                            >
                                Manage tags
                            </button>
                        )}
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">Company Vehicle</span>
                        <span className="m365-info-cell__value">
                            {vehicle?.isCompanyVehicle ? (
                                <span style={{ color: "var(--m365-success)" }}>
                                    <i
                                        className="fa-light fa-check"
                                        style={{ marginRight: 4 }}
                                    />
                                    Yes
                                </span>
                            ) : (
                                <span style={{ color: "var(--m365-text-tertiary)" }}>
                                    No
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* Settings section */}
            <div className="m365-flat-section">
                <h3 className="m365-flat-section__title">Settings</h3>
                <div className="m365-info-grid">
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">
                            Fuel Tank Capacity
                            <span
                                className="m365-info-tooltip"
                                data-tip="This value hard-limits fueling so transactions cannot exceed the configured tank capacity."
                            >
                                <i className="fa-light fa-circle-info" />
                            </span>
                        </span>
                        <span className="m365-info-cell__value">
                            {vehicle?.fuelTankCapacity
                                ? `${vehicle.fuelTankCapacity} L`
                                : "—"}
                        </span>
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">
                            Full Tank Policy
                            <span
                                className="m365-info-tooltip"
                                data-tip="Require full tank on refuel"
                            >
                                <i className="fa-light fa-circle-info" />
                            </span>
                        </span>
                        <span className="m365-info-cell__value">
                            {vehicle?.isFullTankPolicy ? (
                                <span style={{ color: "var(--m365-success)" }}>
                                    <i
                                        className="fa-light fa-check"
                                        style={{ marginRight: 4 }}
                                    />
                                    Enabled
                                </span>
                            ) : (
                                <span style={{ color: "var(--m365-text-tertiary)" }}>
                                    Disabled
                                </span>
                            )}
                        </span>
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">Cargo Capacity</span>
                        <span className="m365-info-cell__value">
                            {vehicle?.capacity || "—"}
                        </span>
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">Passenger</span>
                        <span className="m365-info-cell__value">
                            {vehicle?.passenger || "—"}
                        </span>
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">Expected Average</span>
                        <span className="m365-info-cell__value">
                            {vehicle?.defaultExptdAvgid || "—"}
                        </span>
                        {isAdmin && (
                            <button
                                className="m365-info-cell__link"
                                onClick={() => setActiveView(VIEWS.EXPECTED_AVG)}
                            >
                                Update expected average
                            </button>
                        )}
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">
                            Km/L Tracking
                            <span
                                className="m365-info-tooltip"
                                data-tip="Track kilometers per liter"
                            >
                                <i className="fa-light fa-circle-info" />
                            </span>
                        </span>
                        <span className="m365-info-cell__value">
                            {vehicle?.averageKmL ? (
                                <span style={{ color: "var(--m365-success)" }}>
                                    <i
                                        className="fa-light fa-check"
                                        style={{ marginRight: 4 }}
                                    />
                                    Enabled
                                </span>
                            ) : (
                                <span style={{ color: "var(--m365-text-tertiary)" }}>
                                    Disabled
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    // ── Render: General Tab (Edit) ────────────────────────────────────────
    const renderGeneralEdit = () => (
        <VehicleFormPanel
            vehicle={vehicle}
            onSubmit={handleSaveVehicle}
            onCancel={() => setEditMode(false)}
            isSaving={isSaving}
        />
    );

    // ── Render: General Tab ───────────────────────────────────────────────
    const renderGeneralTab = () => {
        if (!vehicle) {
            return (
                <div className="m365-empty">
                    <i className="fa-light fa-circle-question m365-empty__icon" />
                    <p className="m365-empty__text">Vehicle not found.</p>
                </div>
            );
        }
        return editMode ? renderGeneralEdit() : renderGeneralView();
    };

    // ── Render: Activity (Applications) Tab ───────────────────────────────
    const renderActivityTab = () => (
        <div className="vdp-app-list">
            {activityItems.map((item) => (
                <button
                    key={item.key}
                    className="vdp-app-row"
                    onClick={() => setActiveView(item.key)}
                    type="button"
                >
                    <i className={`${item.icon} vdp-app-row__icon`} />
                    <span className="vdp-app-row__label">{item.label}</span>
                    <i className="fa-light fa-chevron-right vdp-app-row__arrow" />
                </button>
            ))}
        </div>
    );

    // ── Render: Status Tab ────────────────────────────────────────────────
    const renderStatusTab = () => {
        if (!vehicle?.hasGPSInstalled) {
            return (
                <div className="m365-empty">
                    <i className="fa-light fa-satellite-dish m365-empty__icon" />
                    <p className="m365-empty__text">
                        No GPS device installed on this vehicle
                    </p>
                </div>
            );
        }

        return (
            <div className="m365-detail-content">
                {/* GPS summary card — clickable */}
                <div
                    className="vdp-status-summary vdp-status-summary--clickable"
                    onClick={() => setActiveView(VIEWS.GPS)}
                    role="button"
                    tabIndex={0}
                >
                    <div className="vdp-status-summary__icon">
                        <i className="fa-light fa-satellite-dish" />
                    </div>
                    <div className="vdp-status-summary__content">
                        <span className="vdp-status-summary__title">
                            GPS Information
                        </span>
                        <span className="vdp-status-summary__value">
                            {gpsData?.sensorHealth?.gpsSignalStrength
                                ? `Signal: ${gpsData.sensorHealth.gpsSignalStrength}`
                                : "View GPS details"}
                        </span>
                    </div>
                    <i className="fa-light fa-chevron-right vdp-status-summary__arrow" />
                </div>

                {/* Live status — flat grid */}
                <div className="m365-flat-section">
                    <h3 className="m365-flat-section__title">Live Status</h3>
                    <div className="m365-info-grid">
                        <div className="m365-info-cell">
                            <span className="m365-info-cell__label">GPS Signal</span>
                            <span className="m365-info-cell__value">
                                {gpsData?.sensorHealth?.gpsSignalStrength || "N/A"}
                            </span>
                        </div>
                        <div className="m365-info-cell">
                            <span className="m365-info-cell__label">Ignition</span>
                            <span className="m365-info-cell__value">
                                {gpsData?.sensorHealth?.ignitionStatus !== null &&
                                gpsData?.sensorHealth?.ignitionStatus !== undefined ? (
                                    gpsData.sensorHealth.ignitionStatus ? (
                                        <span className="m365-badge m365-badge--success">
                                            ON
                                        </span>
                                    ) : (
                                        <span className="m365-badge m365-badge--neutral">
                                            OFF
                                        </span>
                                    )
                                ) : (
                                    "N/A"
                                )}
                            </span>
                        </div>
                        <div className="m365-info-cell">
                            <span className="m365-info-cell__label">Fuel Level</span>
                            <span className="m365-info-cell__value">
                                {gpsData?.sensorHealth?.fuelLevel != null
                                    ? `${Math.floor(gpsData.sensorHealth.fuelLevel)} ${gpsData.sensorHealth.fuelLevelUnit || "L"}`
                                    : "N/A"}
                            </span>
                        </div>
                        {gpsData?.address && (
                            <div className="m365-info-cell">
                                <span className="m365-info-cell__label">Location</span>
                                <span className="m365-info-cell__value">
                                    {gpsData.address}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ── View titles for drill-down header ─────────────────────────────────
    const viewTitles = {
        [VIEWS.EDIT]: "Edit Vehicle",
        [VIEWS.TAG]: "Assign Tag",
        [VIEWS.EXPECTED_AVG]: "Expected Average",
        [VIEWS.GPS]: "GPS Information",
        [VIEWS.CONSUMPTION]: "Consumption History",
        [VIEWS.MAINTENANCE]: "Maintenance History",
        [VIEWS.FUELING]: "Fueling History",
        [VIEWS.DOCUMENTS]: "Documents",
        [VIEWS.FUELING_RULES]: "Fueling Rules",
        [VIEWS.TRANSFERS]: "Transfer History",
    };

    const panelTitle = activeView !== VIEWS.NONE
        ? `${displayName} · ${viewTitles[activeView] || "Vehicle"}`
        : editMode
            ? `Edit Vehicle: ${displayName}`
            : displayName;

    // ── Render: Drill-down view (replaces tabs) ──────────────────────────
    const renderDrillDown = () => (
        <div className="vdp-drill-down">
            <button
                className="vdp-drill-down__back"
                onClick={() => setActiveView(VIEWS.NONE)}
            >
                <i className="fa-light fa-arrow-left" />
            </button>

            <h2 className="vdp-drill-down__title">
                {viewTitles[activeView] || ""}
            </h2>

            <div className="vdp-drill-down__content">
                {activeView === VIEWS.GPS && (
                    <VehicleGPSInformation vehicleId={vehicleId} />
                )}
                {activeView === VIEWS.CONSUMPTION && (
                    <VehicleConsumptionHistory vehicleId={vehicleId} />
                )}
                {activeView === VIEWS.MAINTENANCE && (
                    <VehicleMaintenanceHistory vehicleId={vehicleId} />
                )}
                {activeView === VIEWS.FUELING && (
                    <VehicleFuelingHistory vehicleId={vehicleId} />
                )}
                {activeView === VIEWS.DOCUMENTS && (
                    <VehicleDocumentsList vehicleId={vehicleId} />
                )}
                {activeView === VIEWS.FUELING_RULES && (
                    <VehicleFuelingRuleAssignment
                        vehicle={vehicle}
                        canEdit={isAdmin}
                    />
                )}
                {activeView === VIEWS.TRANSFERS && (
                    <VehicleTransferHistory vehicleId={vehicleId} />
                )}
                {activeView === VIEWS.TAG && (
                    <TagAssignmentForm
                        vehicle={vehicle}
                        tags={tags}
                        onClose={() => setActiveView(VIEWS.NONE)}
                        onSuccess={() => {
                            setActiveView(VIEWS.NONE);
                            notify("Tag assigned successfully", "success", 3000);
                            onVehicleUpdated?.();
                        }}
                    />
                )}
                {activeView === VIEWS.EXPECTED_AVG && (
                    <EnhancedExpectedAverageForm
                        vehicle={vehicle}
                        onClose={() => setActiveView(VIEWS.NONE)}
                        onSuccess={(newAvg) => {
                            setVehicle((prev) => ({
                                ...prev,
                                defaultExptdAvgid: newAvg,
                            }));
                            setActiveView(VIEWS.NONE);
                            notify("Expected average updated", "success", 3000);
                            onVehicleUpdated?.();
                        }}
                    />
                )}
            </div>
        </div>
    );

    // ── Main render ───────────────────────────────────────────────────────
    return (
        <SlidePanel
            open={open}
            onClose={handleClose}
            title={panelTitle}
            width={1000}
            headerActions={
                <button
                    className="fms-slide-panel__close"
                    onClick={handleRefresh}
                    aria-label="Refresh"
                    title="Refresh"
                >
                    <i className="fa-light fa-arrows-rotate" />
                </button>
            }
        >
            <div className="vdp-panel-layout">
                {/* Profile header — M365 layout */}
                <div className="m365-detail-profile">
                    <div className="vdp-avatar">
                        <i className="fa-light fa-truck" />
                    </div>
                    <div className="m365-detail-profile__body">
                        <span className="m365-detail-profile__eyebrow">Vehicle overview</span>
                        <div className="m365-detail-profile__meta">
                            <span className="m365-detail-profile__email">
                                {subtitle}
                            </span>
                            <M365StatusBadge isActive={isActive} />
                            {vehicle?.hasGPSInstalled && (
                                <span className="m365-badge m365-badge--primary">
                                    <i className="fa-light fa-satellite" /> GPS
                                </span>
                            )}
                            {vehicle?.isCompanyVehicle && (
                                <span className="m365-badge m365-badge--neutral">
                                    Company
                                </span>
                            )}
                        </div>
                        <p className="m365-detail-profile__description">
                            Review configuration, assignment, live status, and related applications from one panel.
                        </p>
                        {/* Inline action links */}
                        {isAdmin && (
                            <div className="m365-detail-profile__actions">
                                <button
                                    className="m365-action-link"
                                    onClick={() => setEditMode(true)}
                                >
                                    <i className="fa-light fa-pen" />
                                    <span>Edit vehicle</span>
                                </button>
                                <button
                                    className="m365-action-link"
                                    onClick={() => setActiveView(VIEWS.TAG)}
                                >
                                    <i className="fa-light fa-tag" />
                                    <span>Assign tag</span>
                                </button>
                                <button
                                    className="m365-action-link"
                                    onClick={() =>
                                        setActiveView(VIEWS.EXPECTED_AVG)
                                    }
                                >
                                    <i className="fa-light fa-chart-line" />
                                    <span>Expected average</span>
                                </button>
                                <button
                                    className="m365-action-link"
                                    onClick={handleOpenFullPage}
                                >
                                    <i className="fa-light fa-arrow-up-right-from-square" />
                                    <span>Full page</span>
                                </button>
                                <button
                                    className="m365-action-link m365-action-link--danger"
                                    onClick={handleDelete}
                                >
                                    <i className="fa-light fa-trash-can" />
                                    <span>Delete vehicle</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs — hidden during drill-down */}
                {activeView === VIEWS.NONE && (
                    <div className="m365-detail-tabs">
                        {PANEL_TABS.map((tab) => (
                            <button
                                key={tab.key}
                                className={`m365-detail-tab${activeTab === tab.key ? " m365-detail-tab--active" : ""}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Scrollable body */}
                <div className="m365-panel-body">
                    {isLoading ? (
                        <div className="m365-empty">
                            <i className="fa-light fa-spinner fa-spin m365-empty__icon" />
                            <p className="m365-empty__text">
                                Loading vehicle details…
                            </p>
                        </div>
                    ) : activeView !== VIEWS.NONE ? (
                        renderDrillDown()
                    ) : (
                        <>
                            {activeTab === "general" && renderGeneralTab()}
                            {activeTab === "activity" && renderActivityTab()}
                            {activeTab === "status" && renderStatusTab()}
                        </>
                    )}
                </div>


            </div>
        </SlidePanel>
    );
};

export default VehicleDetailPanel;
