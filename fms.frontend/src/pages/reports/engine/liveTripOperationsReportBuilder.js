/**
 * File: liveTripOperationsReportBuilder.js
 * Purpose: Builds template-ready payloads for the live trip operations report.
 * Dependencies: Live trip operations report API response shape.
 * Last Modified: 2026-03-13
 */

const numberOrZero = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatNumber = (value, digits = 2) => (
    numberOrZero(value).toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    })
);

const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
};

const formatMovementProfile = (value) => {
    const numeric = numberOrZero(value);
    if (numeric === 2) return 'Cluster';
    if (numeric === 1) return 'Geofence';
    return value || 'Unknown';
};

const ANOMALY_FLAGS = [
    { value: 1, label: 'Low Confidence' },
    { value: 2, label: 'Unknown Origin / Destination' },
    { value: 4, label: 'GPS Gap Suspected' },
    { value: 8, label: 'Off-Site Idle Suspected' },
    { value: 16, label: 'Unmatched Return' },
    { value: 32, label: 'Missing Fuel Data' },
    { value: 64, label: 'Negative Fuel Consumption' },
    { value: 128, label: 'Unrealistic Speed' },
    { value: 256, label: 'Asymmetric Cycle' },
    { value: 512, label: 'No Return To Origin' },
    { value: 1024, label: 'Weak Fuel Data' },
    { value: 2048, label: 'Suspicious Fuel Rate' },
];

const decodeAnomalyFlags = (flagValue) => {
    const numeric = numberOrZero(flagValue);
    if (!numeric) return 'None';

    const labels = ANOMALY_FLAGS
        .filter((flag) => (numeric & flag.value) === flag.value)
        .map((flag) => flag.label);

    return labels.length ? labels.join(', ') : 'None';
};

const getContainer = (apiResponse, container) => {
    if (container && typeof container === 'object') {
        return container;
    }

    if (apiResponse?.data && typeof apiResponse.data === 'object') {
        return apiResponse.data;
    }

    return apiResponse || {};
};

export const mapLiveTripOperations = (apiResponse, container, queryParams = {}) => {
    const payload = getContainer(apiResponse, container);
    const summary = payload.summary || payload.Summary || {};
    const travelingVehicles = payload.vehiclesCurrentlyTraveling || payload.VehiclesCurrentlyTraveling || [];
    const activeTrips = payload.activeTripsInProgress || payload.ActiveTripsInProgress || payload.records || payload.Records || [];
    const tripCounts = payload.tripCountsPerVehicle || payload.TripCountsPerVehicle || [];
    const tipperCycles = payload.liveTipperCycleCounts || payload.LiveTipperCycleCounts || [];
    const idleOutsideWorkZones = payload.vehiclesIdleOutsideWorkZones || payload.VehiclesIdleOutsideWorkZones || [];
    const idleThresholdMinutes = payload.idleThresholdMinutes || payload.IdleThresholdMinutes || queryParams.idleThresholdMinutes || 15;

    const mappedTravelingVehicles = travelingVehicles.map((item, index) => ({
        rowNumber: index + 1,
        vehicleLabel: item.vehicleLabel || item.VehicleLabel || 'Unknown Vehicle',
        numberPlate: item.numberPlate || item.NumberPlate || '-',
        movementProfileLabel: formatMovementProfile(item.movementProfile ?? item.MovementProfile),
        detectionMode: item.detectionMode || item.DetectionMode || 'Geofence',
        originDisplayName: item.originDisplayName || item.OriginDisplayName || 'Unknown',
        destinationDisplayName: item.destinationDisplayName || item.DestinationDisplayName || 'Unknown',
        startedAtLocal: formatDateTime(item.startedAtUtc || item.StartedAtUtc),
        lastUpdatedAtLocal: formatDateTime(item.lastUpdatedAtUtc || item.LastUpdatedAtUtc),
        durationDisplay: `${formatNumber(item.durationMinutes || item.DurationMinutes, 1)} min`,
        distanceDisplay: `${formatNumber(item.distanceKm || item.DistanceKm, 2)} km`,
        confidenceBand: item.confidenceBand || item.ConfidenceBand || 'Unknown',
    }));

    const mappedActiveTrips = activeTrips.map((item, index) => ({
        rowNumber: index + 1,
        vehicleLabel: item.vehicleLabel || item.VehicleLabel || 'Unknown Vehicle',
        movementProfileLabel: formatMovementProfile(item.movementProfile ?? item.MovementProfile),
        routeLabel: `${item.originDisplayName || item.OriginDisplayName || 'Unknown'} → ${item.destinationDisplayName || item.DestinationDisplayName || 'Unknown'}`,
        startedAtLocal: formatDateTime(item.startedAtUtc || item.StartedAtUtc),
        lastUpdatedAtLocal: formatDateTime(item.lastUpdatedAtUtc || item.LastUpdatedAtUtc),
        durationDisplay: `${formatNumber(item.durationMinutes || item.DurationMinutes, 1)} min`,
        distanceDisplay: `${formatNumber(item.distanceKm || item.DistanceKm, 2)} km`,
        fuelConsumedDisplay: item.fuelConsumed === null || item.fuelConsumed === undefined || item.FuelConsumed === null || item.FuelConsumed === undefined
            ? 'N/A'
            : `${formatNumber(item.fuelConsumed ?? item.FuelConsumed, 2)} L`,
        confidenceBand: item.confidenceBand || item.ConfidenceBand || 'Unknown',
        anomalyFlagsLabel: decodeAnomalyFlags(item.anomalyFlags ?? item.AnomalyFlags),
        outOfBoundsLabel: (item.isOutOfBounds ?? item.IsOutOfBounds) === true ? 'Yes' : 'No',
    }));

    const mappedTripCounts = tripCounts.map((item, index) => ({
        rowNumber: index + 1,
        vehicleLabel: item.vehicleLabel || item.VehicleLabel || 'Unknown Vehicle',
        tripGroupCount: numberOrZero(item.tripGroupCount || item.TripGroupCount),
        tripLegCount: numberOrZero(item.tripLegCount || item.TripLegCount),
        activeTripCount: numberOrZero(item.activeTripCount || item.ActiveTripCount),
        loadCycleCount: numberOrZero(item.loadCycleCount || item.LoadCycleCount),
        roundTripCount: numberOrZero(item.roundTripCount || item.RoundTripCount),
        totalDistanceDisplay: `${formatNumber(item.totalDistanceKm || item.TotalDistanceKm, 2)} km`,
    }));

    const mappedTipperCycles = tipperCycles.map((item, index) => ({
        rowNumber: index + 1,
        vehicleLabel: item.vehicleLabel || item.VehicleLabel || 'Unknown Vehicle',
        totalCycleCount: numberOrZero(item.totalCycleCount || item.TotalCycleCount),
        completedCycleCount: numberOrZero(item.completedCycleCount || item.CompletedCycleCount),
        activeCycleCount: numberOrZero(item.activeCycleCount || item.ActiveCycleCount),
        totalDistanceDisplay: `${formatNumber(item.totalDistanceKm || item.TotalDistanceKm, 2)} km`,
        lastCycleStartedAtLocal: formatDateTime(item.lastCycleStartedAtUtc || item.LastCycleStartedAtUtc),
    }));

    const mappedIdleOutside = idleOutsideWorkZones.map((item, index) => ({
        rowNumber: index + 1,
        vehicleLabel: item.vehicleLabel || item.VehicleLabel || 'Unknown Vehicle',
        locationDisplayName: item.locationDisplayName || item.LocationDisplayName || 'Unknown',
        startedAtLocal: formatDateTime(item.startedAtUtc || item.StartedAtUtc),
        lastUpdatedAtLocal: formatDateTime(item.lastUpdatedAtUtc || item.LastUpdatedAtUtc),
        idleMinutesDisplay: `${formatNumber(item.idleMinutes || item.IdleMinutes, 1)} min`,
        flagSource: (item.offSiteIdleSuspected ?? item.OffSiteIdleSuspected) === true ? 'Off-site idle anomaly' : 'Out-of-bounds flag',
        anomalyFlagsLabel: decodeAnomalyFlags(item.anomalyFlags ?? item.AnomalyFlags),
    }));

    return {
        idleThresholdMinutes,
        travelingVehicles: mappedTravelingVehicles,
        activeTrips: mappedActiveTrips,
        tripCounts: mappedTripCounts,
        tipperCycles: mappedTipperCycles,
        idleOutsideWorkZones: mappedIdleOutside,
        records: mappedActiveTrips,
        summary: {
            vehiclesCurrentlyTravelingCount: numberOrZero(summary.vehiclesCurrentlyTravelingCount || summary.VehiclesCurrentlyTravelingCount),
            activeTripsInProgressCount: numberOrZero(summary.activeTripsInProgressCount || summary.ActiveTripsInProgressCount),
            vehiclesWithTripCountsCount: numberOrZero(summary.vehiclesWithTripCountsCount || summary.VehiclesWithTripCountsCount),
            liveTipperCycleVehicleCount: numberOrZero(summary.liveTipperCycleVehicleCount || summary.LiveTipperCycleVehicleCount),
            vehiclesIdleOutsideWorkZonesCount: numberOrZero(summary.vehiclesIdleOutsideWorkZonesCount || summary.VehiclesIdleOutsideWorkZonesCount),
            totalTripGroups: numberOrZero(summary.totalTripGroups || summary.TotalTripGroups),
            totalTripLegs: numberOrZero(summary.totalTripLegs || summary.TotalTripLegs),
            totalActiveDistanceDisplay: `${formatNumber(summary.totalActiveDistanceKm || summary.TotalActiveDistanceKm, 2)} km`,
            totalActiveDurationDisplay: `${formatNumber(summary.totalActiveDurationMinutes || summary.TotalActiveDurationMinutes, 1)} min`,
        },
    };
};

export default mapLiveTripOperations;