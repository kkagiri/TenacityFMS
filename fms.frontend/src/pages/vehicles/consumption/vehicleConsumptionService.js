/**
 * File: vehicleConsumptionService.js
 * Purpose: Wraps vehicle consumption module API calls and normalizes payloads for the vehicle operations pages.
 * Dependencies: axiosInstance
 * Last Modified: 2026-04-20
 */
import axiosInstance from "../../../api/axiosInstance";

const ensureArray = (payload) => {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    if (Array.isArray(payload?.Data)) {
        return payload.Data;
    }

    return [];
};

const pickValue = (item, keys, fallback = "") => {
    for (const key of keys) {
        if (item?.[key] !== undefined && item?.[key] !== null) {
            return item[key];
        }
    }

    return fallback;
};

const toNumber = (value) => {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
};

const toBoolean = (value, fallback = false) => {
    if (typeof value === "boolean") {
        return value;
    }

    if (value === 1 || value === "1" || value === "true") {
        return true;
    }

    if (value === 0 || value === "0" || value === "false") {
        return false;
    }

    return fallback;
};

const toLocalDateParts = (value) => {
    if (!value) {
        return null;
    }

    if (typeof value === "string") {
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            return {
                year: Number(match[1]),
                month: Number(match[2]),
                day: Number(match[3]),
            };
        }
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
    };
};

export const toLocalInputDateValue = (value) => {
    const parts = toLocalDateParts(value);
    if (!parts) {
        return "";
    }

    return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
};

export const formatDisplayDate = (value) => {
    const parts = toLocalDateParts(value);
    if (!parts) {
        return "-";
    }

    return new Date(parts.year, parts.month - 1, parts.day).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export const formatNumber = (value, precision = 2) =>
    toNumber(value).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: precision,
    });

export const getModeLabel = (isKmPerLiter) => (isKmPerLiter ? "km/L" : "L/hr");

const getDateDaysAgo = (days) => {
    const value = new Date();
    value.setDate(value.getDate() - days);
    return toLocalInputDateValue(value);
};

export const getDefaultConsumptionFilters = () => ({
    startDate: getDateDaysAgo(29),
    endDate: toLocalInputDateValue(new Date()),
    siteId: "",
    vehicleTypeId: "",
    vehicleId: "",
    averageKmL: "",
});

const buildFilterParams = (filters = {}) => {
    const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
    };

    if (filters.siteId) {
        params.siteId = Number(filters.siteId);
    }

    if (filters.vehicleTypeId) {
        params.vehicleTypeId = Number(filters.vehicleTypeId);
    }

    if (filters.vehicleId) {
        params.vehicleId = Number(filters.vehicleId);
    }

    if (filters.averageKmL === "true") {
        params.averageKmL = true;
    } else if (filters.averageKmL === "false") {
        params.averageKmL = false;
    }

    return params;
};

const normalizeSite = (item = {}) => ({
    id: toNumber(pickValue(item, ["id", "Id", "siteId", "SiteId"])),
    name: pickValue(item, ["name", "Name", "siteName", "SiteName"], "Unknown Site"),
});

const normalizeVehicle = (item = {}) => ({
    vehicleId: toNumber(pickValue(item, ["vehicleId", "VehicleId", "id", "Id"])),
    hyoungNo: pickValue(item, ["hyoungNo", "HyoungNo"], ""),
    numberPlate: pickValue(item, ["numberPlate", "NumberPlate"], ""),
    siteId: toNumber(pickValue(item, ["workingSiteId", "WorkingSiteId", "siteId", "SiteId"])),
    siteName: pickValue(item, ["workingSiteName", "WorkingSiteName", "siteName", "SiteName"], ""),
    vehicleTypeId: toNumber(pickValue(item, ["vehicleTypeId", "VehicleTypeId"])),
    vehicleTypeName: pickValue(item, ["vehicleTypeName", "VehicleTypeName", "vehicleType", "VehicleType"], "Unknown"),
    averageKmL: toBoolean(pickValue(item, ["averageKmL", "AverageKmL"], false)),
});

const normalizeAnalytics = (item = {}) => ({
    totalFuel: toNumber(pickValue(item, ["totalFuel", "TotalFuel"])),
    totalDistance: toNumber(pickValue(item, ["totalDistance", "TotalDistance"])),
    totalEngHours: toNumber(pickValue(item, ["totalEngHours", "TotalEngHours"])),
    avgConsumption: toNumber(pickValue(item, ["avgConsumption", "AvgConsumption"])),
    avgSpeed: toNumber(pickValue(item, ["avgSpeed", "AvgSpeed"])),
    totalFuelLost: toNumber(pickValue(item, ["totalFuelLost", "TotalFuelLost"])),
    totalVehicles: toNumber(pickValue(item, ["totalVehicles", "TotalVehicles"])),
    totalRecords: toNumber(pickValue(item, ["totalRecords", "TotalRecords"])),
    dailyData: ensureArray(pickValue(item, ["dailyData", "DailyData"], [])),
    byVehicleType: ensureArray(pickValue(item, ["byVehicleType", "ByVehicleType"], [])),
});

const normalizeModuleRecord = (item = {}) => {
    const isKmPerLiter = toBoolean(pickValue(item, ["isKmPerLiter", "IsKmPerLiter"]), true);
    return {
        id: toNumber(pickValue(item, ["id", "Id"])),
        vehicleId: toNumber(pickValue(item, ["vehicleId", "VehicleId"])),
        hyoungNo: pickValue(item, ["hyoungNo", "HyoungNo"], ""),
        numberPlate: pickValue(item, ["numberPlate", "NumberPlate"], ""),
        vehicleTypeId: toNumber(pickValue(item, ["vehicleTypeId", "VehicleTypeId"])),
        vehicleTypeName: pickValue(item, ["vehicleTypeName", "VehicleTypeName"], "Unknown"),
        siteId: toNumber(pickValue(item, ["siteId", "SiteId"])),
        siteName: pickValue(item, ["siteName", "SiteName"], "Unknown"),
        date: pickValue(item, ["date", "Date"], null),
        employeeName: pickValue(item, ["employeeName", "EmployeeName"], ""),
        expectedAverage: toNumber(pickValue(item, ["expectedAverage", "ExpectedAverage"])),
        actualEfficiency: toNumber(pickValue(item, ["actualEfficiency", "ActualEfficiency"])),
        totalFuel: toNumber(pickValue(item, ["totalFuel", "TotalFuel"])),
        fuelLost: toNumber(pickValue(item, ["fuelLost", "FuelLost"])),
        totalDistance: toNumber(pickValue(item, ["totalDistance", "TotalDistance"])),
        engineHours: toNumber(pickValue(item, ["engineHours", "EngineHours"])),
        maxSpeed: toNumber(pickValue(item, ["maxSpeed", "MaxSpeed"])),
        avgSpeed: toNumber(pickValue(item, ["avgSpeed", "AvgSpeed"])),
        reportReference: pickValue(item, ["reportReference", "ReportReference"], ""),
        comments: pickValue(item, ["comments", "Comments"], ""),
        isKmPerLiter,
        unitLabel: getModeLabel(isKmPerLiter),
    };
};

const normalizeRecordDetail = (item = {}) => ({
    id: toNumber(pickValue(item, ["id", "Id"])),
    vehicleId: toNumber(pickValue(item, ["vehicleId", "VehicleId"])),
    hyoungNo: pickValue(item, ["hyoungNo", "HyoungNo"], ""),
    numberPlate: pickValue(item, ["numberPlate", "NumberPlate"], ""),
    vehicleTypeName: pickValue(item, ["vehicleTypeName", "VehicleTypeName"], "Unknown"),
    vehicleModelName: pickValue(item, ["vehicleModelName", "VehicleModelName"], ""),
    manufacturerName: pickValue(item, ["manufacturerName", "ManufacturerName"], ""),
    siteId: toNumber(pickValue(item, ["siteId", "SiteId"])),
    siteName: pickValue(item, ["siteName", "SiteName"], "Unknown"),
    date: pickValue(item, ["date", "Date"], null),
    sourceDriverName: pickValue(item, ["sourceDriverName", "SourceDriverName"], ""),
    assignedEmployeeName: pickValue(item, ["assignedEmployeeName", "AssignedEmployeeName"], ""),
    expectedAverage: toNumber(pickValue(item, ["expectedAverage", "ExpectedAverage"])),
    actualEfficiency: toNumber(pickValue(item, ["actualEfficiency", "ActualEfficiency"])),
    totalFuel: toNumber(pickValue(item, ["totalFuel", "TotalFuel"])),
    fuelLost: toNumber(pickValue(item, ["fuelLost", "FuelLost"])),
    totalDistance: toNumber(pickValue(item, ["totalDistance", "TotalDistance"])),
    engineHours: toNumber(pickValue(item, ["engineHours", "EngineHours"])),
    maxSpeed: toNumber(pickValue(item, ["maxSpeed", "MaxSpeed"])),
    avgSpeed: toNumber(pickValue(item, ["avgSpeed", "AvgSpeed"])),
    flowMeterFuelUsed: toNumber(pickValue(item, ["flowMeterFuelUsed", "FlowMeterFuelUsed"])),
    flowMeterFuelLost: toNumber(pickValue(item, ["flowMeterFuelLost", "FlowMeterFuelLost"])),
    flowMeterEfficiency: toNumber(pickValue(item, ["flowMeterEfficiency", "FlowMeterEfficiency"])),
    flowMeterEngineHours: toNumber(pickValue(item, ["flowMeterEngineHours", "FlowMeterEngineHours"])),
    reportReference: pickValue(item, ["reportReference", "ReportReference"], ""),
    comments: pickValue(item, ["comments", "Comments"], ""),
    isKmPerLiter: toBoolean(pickValue(item, ["isKmPerLiter", "IsKmPerLiter"]), true),
    isModified: toBoolean(pickValue(item, ["isModified", "IsModified"]), false),
    modifiedDate: pickValue(item, ["modifiedDate", "ModifiedDate"], null),
});

export const getVehicleConsumptionFilterOptions = async () => {
    const [sitesResponse, vehiclesResponse] = await Promise.all([
        axiosInstance.get("/site"),
        axiosInstance.get("/vehicle"),
    ]);

    const sites = ensureArray(sitesResponse.data)
        .map(normalizeSite)
        .filter((item) => item.id > 0)
        .sort((left, right) => left.name.localeCompare(right.name));

    const vehicles = ensureArray(vehiclesResponse.data)
        .map(normalizeVehicle)
        .filter((item) => item.vehicleId > 0)
        .sort((left, right) => (left.hyoungNo || left.numberPlate).localeCompare(right.hyoungNo || right.numberPlate));

    const vehicleTypeMap = new Map();
    vehicles.forEach((vehicle) => {
        if (vehicle.vehicleTypeId > 0 && vehicle.vehicleTypeName) {
            vehicleTypeMap.set(vehicle.vehicleTypeId, {
                id: vehicle.vehicleTypeId,
                name: vehicle.vehicleTypeName,
            });
        }
    });

    const vehicleTypes = Array.from(vehicleTypeMap.values()).sort((left, right) => left.name.localeCompare(right.name));

    return { sites, vehicles, vehicleTypes };
};

export const getVehicleConsumptionModuleData = async (filters = {}) => {
    const params = buildFilterParams(filters);

    const [analyticsResponse, recordsResponse] = await Promise.all([
        axiosInstance.get("/Consumption/gpsAnalytics", { params }),
        axiosInstance.get("/Consumption/records", { params }),
    ]);

    return {
        analytics: normalizeAnalytics(analyticsResponse.data || {}),
        records: ensureArray(recordsResponse.data).map(normalizeModuleRecord),
    };
};

export const getVehicleConsumptionComparisonData = async (filters = {}) => {
    const params = buildFilterParams(filters);
    const response = await axiosInstance.get("/Consumption/records", { params });

    return {
        records: ensureArray(response.data).map(normalizeModuleRecord),
    };
};

export const getVehicleConsumptionRecordDetail = async (consumptionId) => {
    const response = await axiosInstance.get(`/Consumption/recordDetail/${consumptionId}`);
    return normalizeRecordDetail(response.data || {});
};