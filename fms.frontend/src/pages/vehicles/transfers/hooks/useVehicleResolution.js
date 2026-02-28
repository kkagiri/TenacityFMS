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
const useVehicleResolution = (selectedVehicleId, vehicles, setFormData) => {
    const [vehicle, setVehicle] = useState(null);
    const [hasGps, setHasGps] = useState(false);
    const [gpsMapping, setGpsMapping] = useState(null);
    const [checkupItems, setCheckupItems] = useState([]);

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
                    gpsDeviceId: active.externalDeviceId || active.deviceIMEI || "",
                    fuelSensorId: active.hasFuelSensor ? (active.fuelSensorType || "Installed") : "",
                }));
            } else {
                setGpsMapping(null);
            }
        } catch (error) {
            console.warn("Could not fetch GPS mapping:", error);
            setGpsMapping(null);
        }
    }, [setFormData]);

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
        loadCheckupTemplate({
            vehicleTypeId: resolvedVehicleTypeId,
            vehicleModelId: resolvedVehicleModelId,
            hasGps: gpsInstalled,
        });

        if (gpsInstalled) {
            fetchGpsMapping(vehicleData.vehicleId);
        } else {
            setGpsMapping(null);
        }
    }, [fetchGpsMapping, loadCheckupTemplate, setFormData]);

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

    return {
        vehicle,
        hasGps,
        gpsMapping,
        checkupItems,
        setCheckupItems,
        loadCheckupTemplate,
    };
};

export default useVehicleResolution;
