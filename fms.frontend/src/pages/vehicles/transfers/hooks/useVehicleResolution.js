/**
 * File: useVehicleResolution.js
 * Purpose: Custom hook that resolves vehicle context (type, make/model, GPS mapping)
 *          for the Vehicle Transfer wizard. Handles Redux store lookup with API fallback.
 * Dependencies: axiosInstance, vehicleTransferFormUtils
 * Last Modified: 2026-02-26
 *
 * Key Responsibilities:
 * - resolveVehicle: Finds vehicle in Redux store or falls back to API
 * - applyVehicleContext: Populates form fields (makeModel, fromSiteId, readingUnit, GPS)
 * - fetchGpsMapping: Loads active GPS device mapping for a vehicle
 * - loadCheckupTemplate: Fetches or defaults checkup template items by criteria
 */

import { useState, useCallback, useEffect } from "react";
import notify from "devextreme/ui/notify";
import axiosInstance from "../../../../api/axiosInstance";
import {
    buildVehicleMakeModel,
    buildCheckupTemplateItems,
    buildDefaultCheckupItems,
    getVehicleManufacturerName,
    getVehicleModelName,
    getVehicleTypeName,
    isEquipmentVehicle,
} from "../vehicleTransferFormUtils";

/**
 * Resolves vehicle details, GPS mapping, and checkup template for the transfer form.
 *
 * @param {number|null} selectedVehicleId - The currently selected vehicle ID
 * @param {Array} vehicles - Vehicle list from Redux store
 * @param {Function} setFormData - State setter for the parent form data
 * @returns {{ vehicle, hasGps, gpsMapping, checkupItems, setCheckupItems, loadCheckupTemplate }}
 */
const useVehicleResolution = (selectedVehicleId, vehicles, setFormData, preserveLoadedCheckupItemsRef) => {
    const [vehicle, setVehicle] = useState(null);
    const [hasGps, setHasGps] = useState(false);
    const [gpsMapping, setGpsMapping] = useState(null);
    const [gpsInfo, setGpsInfo] = useState(null);
    const [checkupItems, setCheckupItems] = useState([]);

    const resolveGpsIdentifier = useCallback((mapping, info, fallbackValue = "") => {
        const preferredIdentifier = mapping?.deviceIMEI || info?.deviceIMEI || "";
        if (preferredIdentifier) {
            return preferredIdentifier;
        }

        const fallbackIdentifier = typeof fallbackValue === "string" ? fallbackValue.trim() : "";
        if (fallbackIdentifier) {
            return fallbackIdentifier;
        }

        return mapping?.externalDeviceId || "";
    }, []);

    const buildGpsRemarks = useCallback((mapping, info) => {
        const parts = [];

        if (mapping?.deviceName) {
            parts.push(`Mapped device: ${mapping.deviceName}`);
        }

        if (mapping?.deviceIMEI || info?.deviceIMEI) {
            parts.push(`IMEI: ${mapping?.deviceIMEI || info?.deviceIMEI}`);
        }

        if (info?.sensorHealth?.overallHealth) {
            parts.push(`Health: ${info.sensorHealth.overallHealth}`);
        }

        if (typeof info?.isOnline === "boolean") {
            parts.push(`Online: ${info.isOnline ? "Yes" : "No"}`);
        }

        if (info?.lastUpdated) {
            parts.push(`Last update: ${new Date(info.lastUpdated).toLocaleString()}`);
        }

        return parts.join("\n");
    }, []);

    const formatTelemetryVariables = useCallback((telemetryVariables = []) => {
        if (!Array.isArray(telemetryVariables) || telemetryVariables.length === 0) {
            return "No live telemetry variables available.";
        }

        return telemetryVariables
            .filter((variable) => variable?.name)
            .map((variable) => `${variable.name}: ${variable.value ?? "N/A"}`)
            .join("\n");
    }, []);

    const buildFuelSensorRemarks = useCallback((mapping, info) => {
        const parts = [];

        if (mapping?.deviceType) {
            parts.push(`Device type: ${mapping.deviceType}`);
        }

        if (info?.customFuelCalibration) {
            parts.push(`Custom fuel calibration: ${info.customFuelCalibration}`);
        }

        if (info?.sensorHealth?.fuelLevel != null) {
            parts.push(`Fuel level: ${info.sensorHealth.fuelLevel} ${info.sensorHealth.fuelLevelUnit || "Liters"}`);
        }

        if (info?.sensorHealth?.batteryVoltage != null) {
            parts.push(`Battery: ${info.sensorHealth.batteryVoltage}V`);
        }

        if (typeof info?.sensorHealth?.ignitionStatus === "boolean") {
            parts.push(`Ignition: ${info.sensorHealth.ignitionStatus ? "On" : "Off"}`);
        }

        parts.push("All telemetry variables:");
        parts.push(formatTelemetryVariables(info?.telemetryVariables));

        return parts.join("\n");
    }, [formatTelemetryVariables]);

    // ── Checkup Template ──────────────────────────────────
    const loadCheckupTemplate = useCallback(async (criteria = null) => {
        try {
            const params = {};

            if (criteria?.vehicleTypeId) {
                params.vehicleTypeId = criteria.vehicleTypeId;
            }

            if (criteria?.vehicleModelId) {
                params.vehicleModelId = criteria.vehicleModelId;
            }

            if (typeof criteria?.hasGps === "boolean") {
                params.hasGps = criteria.hasGps;
            }

            const response = await axiosInstance.get("/vehicletransfers/checkup-template", { params });
            const templateItems = response.data?.data || response.data?.Data || response.data || [];

            if (Array.isArray(templateItems) && templateItems.length > 0) {
                setCheckupItems(buildCheckupTemplateItems(templateItems));
            } else {
                setCheckupItems(buildDefaultCheckupItems());
            }
        } catch {
            setCheckupItems(buildDefaultCheckupItems());
        }
    }, []);

    // ── GPS Mapping ───────────────────────────────────────
    const fetchGpsMapping = useCallback(async (targetVehicleId) => {
        try {
            const res = await axiosInstance.get("/providers/mappings", { params: { vehicleId: targetVehicleId } });
            const mappings = res.data?.data || res.data?.Data || [];
            const active = Array.isArray(mappings) ? mappings.find((mapping) => mapping.isActive) : null;

            if (active) {
                setGpsMapping(active);
                setFormData((prev) => ({
                    ...prev,
                    gpsDeviceId: resolveGpsIdentifier(active, null, prev.gpsDeviceId),
                }));
            } else {
                setGpsMapping(null);
            }
        } catch (error) {
            console.warn("Could not fetch GPS mapping:", error);
            setGpsMapping(null);
        }
    }, [resolveGpsIdentifier, setFormData]);

    const fetchGpsInfo = useCallback(async (targetVehicleId) => {
        try {
            const response = await axiosInstance.get(`/vehicletracking/${targetVehicleId}/gps-information`);
            const info = response.data?.data || response.data?.Data || response.data || null;
            setGpsInfo(info);
        } catch (error) {
            console.warn("Could not fetch GPS information:", error);
            setGpsInfo(null);
        }
    }, []);

    // ── Apply Vehicle Context ─────────────────────────────
    const applyVehicleContext = useCallback((vehicleData) => {
        if (!vehicleData) {
            return;
        }

        setVehicle(vehicleData);

        const vehicleTypeName = getVehicleTypeName(vehicleData);
        const manufacturerName = getVehicleManufacturerName(vehicleData);
        const modelName = getVehicleModelName(vehicleData);
        const makeModel = buildVehicleMakeModel(vehicleData);
        const isEquipment = isEquipmentVehicle(vehicleTypeName);
        const resolvedVehicleTypeId =
            vehicleData.vehicleTypeId ??
            vehicleData.VehicleTypeId ??
            vehicleData.vehicleType?.id ??
            vehicleData.vehicleType?.Id ??
            null;
        const resolvedVehicleModelId =
            vehicleData.vehicleModelId ??
            vehicleData.VehicleModelId ??
            vehicleData.vehicleModel?.id ??
            vehicleData.vehicleModel?.Id ??
            null;

        setFormData((prev) => ({
            ...prev,
            vehicleId: vehicleData.vehicleId,
            fromSiteId: vehicleData.workingSiteId,
            makeModel,
            vehicleManufacturer: manufacturerName,
            vehicleModelName: modelName,
            currentReading: vehicleData.currentPhysicalReading ? parseFloat(vehicleData.currentPhysicalReading) : null,
            readingUnit: isEquipment ? "hrs" : "km",
        }));

        const gpsInstalled = !!vehicleData.hasGPSInstalled;
        setHasGps(gpsInstalled);
        if (preserveLoadedCheckupItemsRef?.current) {
            preserveLoadedCheckupItemsRef.current = false;
        } else {
            loadCheckupTemplate({
                vehicleTypeId: resolvedVehicleTypeId,
                vehicleModelId: resolvedVehicleModelId,
                hasGps: gpsInstalled,
            });
        }

        if (gpsInstalled) {
            fetchGpsMapping(vehicleData.vehicleId);
            fetchGpsInfo(vehicleData.vehicleId);
        } else {
            setGpsMapping(null);
            setGpsInfo(null);
        }
    }, [fetchGpsInfo, fetchGpsMapping, loadCheckupTemplate, preserveLoadedCheckupItemsRef, setFormData]);

    // ── Resolve Vehicle (store lookup → API fallback) ─────
    useEffect(() => {
        let isMounted = true;

        const resolveVehicle = async () => {
            if (!selectedVehicleId) {
                if (!isMounted) {
                    return;
                }

                setVehicle(null);
                setHasGps(false);
                setGpsMapping(null);
                setGpsInfo(null);
                setFormData((prev) => ({
                    ...prev,
                    vehicleId: null,
                    fromSiteId: null,
                    makeModel: "",
                    vehicleManufacturer: "",
                    vehicleModelName: "",
                    currentReading: null,
                    readingUnit: "hrs",
                }));
                loadCheckupTemplate();
                return;
            }

            const numericVehicleId = parseInt(selectedVehicleId, 10);
            const vehicleFromStore = vehicles.find((item) => item.vehicleId === numericVehicleId);

            if (vehicleFromStore) {
                applyVehicleContext(vehicleFromStore);
                const hasMakeModelInfo = Boolean(buildVehicleMakeModel(vehicleFromStore));
                if (hasMakeModelInfo) {
                    return;
                }
            }

            try {
                const response = await axiosInstance.get(`/vehicle/${numericVehicleId}`);
                const resolvedVehicle = response.data?.data || response.data?.Data || response.data;

                if (isMounted && resolvedVehicle?.vehicleId) {
                    applyVehicleContext(resolvedVehicle);
                }
            } catch (error) {
                console.warn("Unable to resolve selected vehicle:", error);
                if (isMounted) {
                    notify("Unable to load selected vehicle details", "warning", 3000);
                }
            }
        };

        resolveVehicle();

        return () => {
            isMounted = false;
        };
    }, [selectedVehicleId, vehicles, applyVehicleContext, loadCheckupTemplate, setFormData]);

    useEffect(() => {
        if (!hasGps) {
            return;
        }

        setFormData((prev) => {
            const next = { ...prev };

            if (gpsMapping?.externalDeviceId || gpsMapping?.deviceIMEI) {
                next.gpsDeviceId = resolveGpsIdentifier(gpsMapping, gpsInfo, prev.gpsDeviceId);
            }

            if (!prev.fuelSensorId && gpsInfo?.sensorHealth?.fuelLevel != null) {
                next.fuelSensorId = "Detected from live telemetry";
            }

            next.gpsDeviceRemarks = buildGpsRemarks(gpsMapping, gpsInfo);

            next.fuelSensorRemarks = buildFuelSensorRemarks(gpsMapping, gpsInfo);

            return next;
        });
    }, [buildFuelSensorRemarks, buildGpsRemarks, gpsInfo, gpsMapping, hasGps, resolveGpsIdentifier, setFormData]);

    return {
        vehicle,
        hasGps,
        gpsMapping,
        gpsInfo,
        checkupItems,
        setCheckupItems,
        loadCheckupTemplate,
    };
};

export default useVehicleResolution;
