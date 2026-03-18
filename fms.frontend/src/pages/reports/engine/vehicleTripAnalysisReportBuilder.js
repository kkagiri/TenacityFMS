/**
 * File: vehicleTripAnalysisReportBuilder.js
 * Purpose: Builds route-analysis report payloads from persisted vehicle trip group responses.
 * Dependencies: Vehicle trip group API response shape.
 * Last Modified: 2026-03-11
 *
 * Key Functions:
 * - mapVehicleTripAnalysis(): Normalizes trip groups into route, anomaly, reconciliation, and readiness sections.
 */

const LOW_CONFIDENCE_THRESHOLD = 0.6;

const numberOrZero = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const roundTo = (value, digits = 2) => {
    const factor = 10 ** digits;
    return Math.round(numberOrZero(value) * factor) / factor;
};

const formatNumber = (value, digits = 2) => (
    numberOrZero(value).toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    })
);

const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString();
};

const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
};

const formatDurationHours = (minutes) => `${formatNumber(numberOrZero(minutes) / 60, 1)} h`;
const formatDurationMinutes = (minutes) => `${formatNumber(minutes, 1)} min`;
const formatDistance = (km) => `${formatNumber(km, 2)} km`;
const formatFuel = (liters) => (liters === null || liters === undefined ? 'N/A' : `${formatNumber(liters, 2)} L`);

const sumBy = (items, selector) => items.reduce((sum, item) => sum + numberOrZero(selector(item)), 0);
const averageBy = (items, selector) => (items.length ? sumBy(items, selector) / items.length : 0);

const getValue = (item, keys, fallback = null) => {
    if (!item || typeof item !== 'object') return fallback;

    const entries = Object.entries(item);
    for (const key of keys) {
        if (item[key] !== undefined && item[key] !== null && item[key] !== '') {
            return item[key];
        }

        const matched = entries.find(([prop]) => prop.toLowerCase() === String(key).toLowerCase());
        if (matched && matched[1] !== undefined && matched[1] !== null && matched[1] !== '') {
            return matched[1];
        }
    }

    return fallback;
};

const normalizeText = (value, fallback = 'Not Available') => {
    if (value === null || value === undefined) return fallback;
    const normalized = String(value).replace(/\s+/g, ' ').trim();
    return normalized || fallback;
};

const MOVEMENT_PROFILE_LABELS = {
    1: 'Geofence',
    2: 'Cluster',
};

const GROUPING_TYPE_LABELS = {
    0: 'None',
    1: 'Single Leg',
    2: 'Round Trip',
    3: 'Load Cycle',
};

const RECONCILIATION_LABELS = {
    0: 'Pending',
    1: 'Confirmed',
    2: 'Split',
    3: 'Merged',
    4: 'Adjusted',
    5: 'Anomaly',
};

const ANOMALY_FLAGS = [
    { value: 1, label: 'Low Confidence' },
    { value: 2, label: 'Unknown Origin / Destination' },
    { value: 4, label: 'GPS Gap Suspected' },
    { value: 8, label: 'Off-Site Idle Suspected' },
    { value: 16, label: 'Unmatched Return' },
];

const decodeAnomalyFlags = (flagValue) => {
    const numericValue = numberOrZero(flagValue);
    if (!numericValue) {
        return ['None'];
    }

    const labels = ANOMALY_FLAGS
        .filter((flag) => (numericValue & flag.value) === flag.value)
        .map((flag) => flag.label);

    return labels.length ? labels : ['None'];
};

const normalizeTripGroup = (record, index) => {
    const vehicleLabel = normalizeText(getValue(record, ['vehicleLabel', 'VehicleLabel']), 'Unknown Vehicle');
    const origin = normalizeText(getValue(record, ['originDisplayName', 'OriginDisplayName']), 'Unknown');
    const destination = normalizeText(getValue(record, ['destinationDisplayName', 'DestinationDisplayName']), 'Unknown');
    const movementProfile = numberOrZero(getValue(record, ['movementProfile', 'MovementProfile']));
    const groupingType = numberOrZero(getValue(record, ['groupingType', 'GroupingType']));
    const reconciliationStatus = numberOrZero(getValue(record, ['reconciliationStatus', 'ReconciliationStatus']));
    const anomalyFlags = numberOrZero(getValue(record, ['anomalyFlags', 'AnomalyFlags']));
    const confidenceScore = numberOrZero(getValue(record, ['confidenceScore', 'ConfidenceScore'], 1));
    const totalDistanceKm = numberOrZero(getValue(record, ['totalDistanceKm', 'TotalDistanceKm']));
    const totalDurationMinutes = numberOrZero(getValue(record, ['totalDurationMinutes', 'TotalDurationMinutes']));
    const totalFuelConsumed = getValue(record, ['totalFuelConsumed', 'TotalFuelConsumed']);
    const tripCount = numberOrZero(getValue(record, ['tripCount', 'TripCount']));
    const detectionMode = normalizeText(getValue(record, ['detectionMode', 'DetectionMode']), 'Geofence');
    const tripDate = getValue(record, ['tripDate', 'TripDate']);
    const startTimeUtc = getValue(record, ['startTimeUtc', 'StartTimeUtc']);
    const endTimeUtc = getValue(record, ['endTimeUtc', 'EndTimeUtc']);
    const routeLabel = `${origin} → ${destination}`;
    const anomalyLabels = decodeAnomalyFlags(anomalyFlags);
    const isLowConfidence = confidenceScore < LOW_CONFIDENCE_THRESHOLD || anomalyLabels.includes('Low Confidence');
    const hasFuel = totalFuelConsumed !== null && totalFuelConsumed !== undefined && totalFuelConsumed !== '';
    const fuelPerKm = hasFuel && totalDistanceKm > 0 ? numberOrZero(totalFuelConsumed) / totalDistanceKm : null;

    return {
        rowNumber: index + 1,
        vehicleTripGroupId: getValue(record, ['vehicleTripGroupId', 'VehicleTripGroupId']),
        vehicleId: getValue(record, ['vehicleId', 'VehicleId']),
        vehicleLabel,
        tripDate,
        tripDateLabel: formatDate(tripDate),
        startTimeUtc,
        startTimeLocal: formatDateTime(startTimeUtc),
        endTimeUtc,
        endTimeLocal: formatDateTime(endTimeUtc),
        originDisplayName: origin,
        destinationDisplayName: destination,
        routeLabel,
        tripCount,
        cycleCount: groupingType === 3 ? 1 : 0,
        roundTripCount: groupingType === 2 ? 1 : 0,
        totalDistanceKm,
        totalDistanceKmDisplay: formatDistance(totalDistanceKm),
        totalDurationMinutes,
        totalDurationDisplay: formatDurationMinutes(totalDurationMinutes),
        totalDurationHoursDisplay: formatDurationHours(totalDurationMinutes),
        totalFuelConsumed: hasFuel ? numberOrZero(totalFuelConsumed) : null,
        totalFuelConsumedDisplay: formatFuel(hasFuel ? totalFuelConsumed : null),
        fuelPerKm,
        fuelPerKmDisplay: fuelPerKm === null ? 'N/A' : `${formatNumber(fuelPerKm, 2)} L/km`,
        movementProfile,
        movementProfileLabel: MOVEMENT_PROFILE_LABELS[movementProfile] || normalizeText(getValue(record, ['movementProfileLabel'])) || 'Unknown',
        detectionMode,
        groupingType,
        groupingTypeLabel: GROUPING_TYPE_LABELS[groupingType] || 'Unknown',
        confidenceScore,
        confidenceScoreDisplay: formatNumber(confidenceScore, 2),
        confidenceBand: normalizeText(getValue(record, ['confidenceBand', 'ConfidenceBand']), 'Unknown'),
        isLowConfidence,
        isLowConfidenceLabel: isLowConfidence ? 'Yes' : 'No',
        anomalyFlags,
        anomalyFlagsLabel: anomalyLabels.join(', '),
        hasAnomaly: anomalyFlags > 0,
        reconciliationStatus,
        reconciliationStatusLabel: RECONCILIATION_LABELS[reconciliationStatus] || 'Unknown',
        productiveMovementStatus: 'Not Available',
        outOfBoundsStatus: 'Not Available',
        sectionLabel: 'Not Available',
        borrowPitLabel: 'Not Available',
        dumpPointLabel: 'Not Available',
        productionStatus: 'Payload data unavailable',
    };
};

const buildRouteSummaries = (records) => {
    const routeMap = new Map();

    records.forEach((record) => {
        const key = [record.routeLabel, record.movementProfileLabel, record.detectionMode].join('|');
        const existing = routeMap.get(key) || {
            routeLabel: record.routeLabel,
            movementProfileLabel: record.movementProfileLabel,
            detectionMode: record.detectionMode,
            tripGroups: 0,
            tripLegs: 0,
            loadCycles: 0,
            roundTrips: 0,
            totalDistanceKm: 0,
            totalDurationMinutes: 0,
            totalFuelConsumed: 0,
            fuelBackedGroups: 0,
            lowConfidenceGroups: 0,
            anomalyGroups: 0,
            confidenceScores: [],
            vehicles: new Set(),
        };

        existing.tripGroups += 1;
        existing.tripLegs += record.tripCount;
        existing.loadCycles += record.cycleCount;
        existing.roundTrips += record.roundTripCount;
        existing.totalDistanceKm += record.totalDistanceKm;
        existing.totalDurationMinutes += record.totalDurationMinutes;
        if (record.totalFuelConsumed !== null) {
            existing.totalFuelConsumed += record.totalFuelConsumed;
            existing.fuelBackedGroups += 1;
        }
        existing.lowConfidenceGroups += record.isLowConfidence ? 1 : 0;
        existing.anomalyGroups += record.hasAnomaly ? 1 : 0;
        existing.confidenceScores.push(record.confidenceScore);
        existing.vehicles.add(record.vehicleId || record.vehicleLabel);
        routeMap.set(key, existing);
    });

    return Array.from(routeMap.values())
        .map((route, index) => {
            const averageConfidence = averageBy(route.confidenceScores, (score) => score);
            const averageFuelPerKm = route.totalDistanceKm > 0 && route.fuelBackedGroups > 0
                ? route.totalFuelConsumed / route.totalDistanceKm
                : null;

            return {
                rowNumber: index + 1,
                routeLabel: route.routeLabel,
                movementProfileLabel: route.movementProfileLabel,
                detectionMode: route.detectionMode,
                vehicleCount: route.vehicles.size,
                tripGroups: route.tripGroups,
                tripLegs: route.tripLegs,
                loadCycles: route.loadCycles,
                roundTrips: route.roundTrips,
                totalDistanceKmDisplay: formatDistance(route.totalDistanceKm),
                totalDurationHoursDisplay: formatDurationHours(route.totalDurationMinutes),
                totalFuelConsumedDisplay: route.fuelBackedGroups > 0 ? formatFuel(route.totalFuelConsumed) : 'N/A',
                averageFuelPerKmDisplay: averageFuelPerKm === null ? 'N/A' : `${formatNumber(averageFuelPerKm, 2)} L/km`,
                averageConfidenceDisplay: formatNumber(averageConfidence, 2),
                lowConfidenceGroups: route.lowConfidenceGroups,
                anomalyGroups: route.anomalyGroups,
            };
        })
        .sort((left, right) => right.tripGroups - left.tripGroups || right.tripLegs - left.tripLegs);
};

const buildReconciliationBreakdown = (records) => {
    const total = records.length || 1;

    return Object.entries(RECONCILIATION_LABELS).map(([numericStatus, label]) => {
        const statusValue = Number(numericStatus);
        const count = records.filter((record) => record.reconciliationStatus === statusValue).length;
        return {
            label,
            count,
            percentageDisplay: `${formatNumber((count / total) * 100, 1)}%`,
        };
    });
};

const buildAnomalyRows = (records) => records
    .filter((record) => record.hasAnomaly || record.isLowConfidence)
    .sort((left, right) => {
        if (left.isLowConfidence !== right.isLowConfidence) {
            return left.isLowConfidence ? -1 : 1;
        }

        return left.confidenceScore - right.confidenceScore;
    })
    .slice(0, 20)
    .map((record, index) => ({
        rowNumber: index + 1,
        vehicleLabel: record.vehicleLabel,
        routeLabel: record.routeLabel,
        tripDateLabel: record.tripDateLabel,
        confidenceScoreDisplay: record.confidenceScoreDisplay,
        confidenceBand: record.confidenceBand,
        reconciliationStatusLabel: record.reconciliationStatusLabel,
        anomalyFlagsLabel: record.anomalyFlagsLabel,
        totalDistanceKmDisplay: record.totalDistanceKmDisplay,
        totalFuelConsumedDisplay: record.totalFuelConsumedDisplay,
    }));

const buildReadinessRows = () => ([
    {
        reportingArea: 'Productive vs Out-of-Bounds Movement',
        status: 'Awaiting trip payload fields',
        detail: 'Current trip APIs do not expose productive / non-productive flags or out-of-bounds events.',
    },
    {
        reportingArea: 'Section / Borrow Pit / Dump Point',
        status: 'Awaiting planning-zone linkage',
        detail: 'Trip payload does not yet include section, borrow pit, or dump point identifiers for zone-level reporting.',
    },
    {
        reportingArea: 'Production Calculation',
        status: 'Unavailable without payload data',
        detail: 'Trip telemetry alone cannot calculate production until payload, tonnage, or standard cycle quantity data is supplied.',
    },
]);

const buildFilterLabels = (records, queryParams = {}) => {
    const uniqueVehicles = Array.from(new Set(records.map((record) => record.vehicleLabel))).filter(Boolean);
    const uniqueSites = Array.from(new Set(records.flatMap((record) => [record.originDisplayName, record.destinationDisplayName]))).filter(Boolean);
    const movementProfileLabel = queryParams.movementProfile !== null && queryParams.movementProfile !== undefined && queryParams.movementProfile !== ''
        ? (MOVEMENT_PROFILE_LABELS[numberOrZero(queryParams.movementProfile)] || `Profile ${queryParams.movementProfile}`)
        : 'All Profiles';
    const detectionModeLabel = queryParams.detectionMode || 'All Modes';
    const reconciliationStatusLabel = queryParams.reconciliationStatus !== null && queryParams.reconciliationStatus !== undefined && queryParams.reconciliationStatus !== ''
        ? (RECONCILIATION_LABELS[numberOrZero(queryParams.reconciliationStatus)] || `Status ${queryParams.reconciliationStatus}`)
        : 'All Statuses';

    return {
        vehicleName: queryParams.vehicleId ? (uniqueVehicles[0] || `Vehicle ${queryParams.vehicleId}`) : 'All Vehicles',
        siteName: queryParams.siteId ? (uniqueSites[0] || `Site ${queryParams.siteId}`) : 'All Sites',
        movementProfileLabel,
        detectionModeLabel,
        reconciliationStatusLabel,
        confidenceFilterLabel:
            queryParams.isLowConfidence === true || queryParams.isLowConfidence === 'true'
                ? 'Low Confidence Only'
                : queryParams.isLowConfidence === false || queryParams.isLowConfidence === 'false'
                    ? 'Standard Confidence Only'
                    : 'All Confidence Bands',
    };
};

export const mapVehicleTripAnalysis = (rawRecords, queryParams = {}) => {
    const records = rawRecords.map(normalizeTripGroup);
    const routeSummaries = buildRouteSummaries(records);
    const reconciliationBreakdown = buildReconciliationBreakdown(records);
    const anomalyRecords = buildAnomalyRows(records);
    const readinessRows = buildReadinessRows();
    const fuelBackedRecords = records.filter((record) => record.totalFuelConsumed !== null);
    const totalDistanceKm = sumBy(records, (record) => record.totalDistanceKm);
    const totalDurationMinutes = sumBy(records, (record) => record.totalDurationMinutes);
    const totalFuelConsumed = sumBy(fuelBackedRecords, (record) => record.totalFuelConsumed);
    const totalTripLegs = sumBy(records, (record) => record.tripCount);
    const lowConfidenceGroups = records.filter((record) => record.isLowConfidence).length;
    const anomalyGroups = records.filter((record) => record.hasAnomaly).length;
    const loadCycles = sumBy(records, (record) => record.cycleCount);
    const roundTrips = sumBy(records, (record) => record.roundTripCount);
    const averageFuelPerKm = totalDistanceKm > 0 && fuelBackedRecords.length > 0
        ? totalFuelConsumed / totalDistanceKm
        : null;
    const filters = buildFilterLabels(records, queryParams);

    return {
        ...filters,
        records,
        routeSummaries,
        anomalyRecords,
        readinessRows,
        reconciliationBreakdown,
        summary: {
            totalRecords: records.length,
            totalTripGroups: records.length,
            totalTripLegs,
            totalLoadCycles: loadCycles,
            totalRoundTrips: roundTrips,
            totalVehicles: new Set(records.map((record) => record.vehicleId || record.vehicleLabel)).size,
            totalRoutes: routeSummaries.length,
            totalDistanceKmDisplay: formatDistance(totalDistanceKm),
            totalDurationHoursDisplay: formatDurationHours(totalDurationMinutes),
            averageDurationMinutesDisplay: formatDurationMinutes(averageBy(records, (record) => record.totalDurationMinutes)),
            averageDistanceKmDisplay: formatDistance(averageBy(records, (record) => record.totalDistanceKm)),
            totalFuelConsumedDisplay: fuelBackedRecords.length > 0 ? formatFuel(totalFuelConsumed) : 'N/A',
            averageFuelPerKmDisplay: averageFuelPerKm === null ? 'N/A' : `${formatNumber(averageFuelPerKm, 2)} L/km`,
            lowConfidenceGroups,
            anomalyGroups,
            fuelBackedGroups: fuelBackedRecords.length,
            missingFuelGroups: records.length - fuelBackedRecords.length,
            productiveMovementDisplay: 'Not Available',
            outOfBoundsDisplay: 'Not Available',
            planningZoneCoverageDisplay: 'Pending planning-zone integration',
            productionAvailabilityDisplay: 'Unavailable without payload / tonnage data',
        },
    };
};

export default mapVehicleTripAnalysis;