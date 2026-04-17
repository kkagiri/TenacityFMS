/**
 * File: clusterDetectionPlayground.js
 * Purpose: Replays cluster detection in the browser from loaded track points so threshold changes can be tested without another backend classification pass.
 * Dependencies: None.
 * Last Modified: 2026-03-16
 *
 * Key Functions:
 * - buildClusterSourceKey(): Identifies a loaded track-data session.
 * - buildFrontendClusterPreview(): Builds stops, clusters, and trip legs from track points in the frontend.
 */

const toNumber = (value, fallback = 0) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

const round = (value, decimals = 2) => {
    const factor = 10 ** decimals;
    return Math.round(toNumber(value, 0) * factor) / factor;
};

const sortByTimestamp = (left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();

const normalizeTrackPoints = (trackPoints) => {
    return (Array.isArray(trackPoints) ? trackPoints : [])
        .map((point, index) => {
            const latitude = toNumber(point.latitude ?? point.Latitude, NaN);
            const longitude = toNumber(point.longitude ?? point.Longitude, NaN);
            const timestampValue = point.timestamp ?? point.Timestamp;
            const timestamp = timestampValue ? new Date(timestampValue) : null;

            if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !timestamp || Number.isNaN(timestamp.getTime())) {
                return null;
            }

            return {
                index,
                latitude,
                longitude,
                speed: toNumber(point.speed ?? point.Speed, 0),
                heading: point.heading ?? point.Heading ?? null,
                timestamp,
                address: point.address ?? point.Address ?? null,
                ignitionStatus: point.ignitionStatus ?? point.IgnitionStatus ?? null,
            };
        })
        .filter(Boolean)
        .sort(sortByTimestamp);
};

const haversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const earthRadiusMeters = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180)
        * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMeters * c;
};

const calculateDistanceKm = (points, startIndex, endIndex) => {
    let totalMeters = 0;

    for (let index = startIndex + 1; index <= endIndex; index += 1) {
        totalMeters += haversineDistanceMeters(
            points[index - 1].latitude,
            points[index - 1].longitude,
            points[index].latitude,
            points[index].longitude
        );
    }

    return totalMeters / 1000;
};

const calculateMaxSpeed = (points, startIndex, endIndex) => {
    const speeds = points
        .slice(startIndex, endIndex + 1)
        .map((point) => toNumber(point.speed, 0));

    return speeds.length ? round(Math.max(...speeds), 2) : null;
};

const buildClusterSourceKey = ({ vehicleId, fromUtc, toUtc, maxTrackPoints }) => {
    return [vehicleId || 0, fromUtc || "", toUtc || "", toNumber(maxTrackPoints, 0)].join("|");
};

const extractStops = (points, settings) => {
    const stops = [];
    let currentStop = null;
    let latitudeSum = 0;
    let longitudeSum = 0;
    let pointCount = 0;

    const finalizeStop = () => {
        if (!currentStop || pointCount <= 0) {
            currentStop = null;
            return;
        }

        const durationMinutes = (currentStop.endTimeUtc.getTime() - currentStop.startTimeUtc.getTime()) / 60000;
        if (durationMinutes < settings.minimumStopDurationMinutes) {
            currentStop = null;
            return;
        }

        stops.push({
            ...currentStop,
            durationMinutes: round(durationMinutes, 2),
            latitude: round(latitudeSum / pointCount, 8),
            longitude: round(longitudeSum / pointCount, 8),
        });
        currentStop = null;
    };

    points.forEach((point, index) => {
        if (toNumber(point.speed, 0) <= settings.stopSpeedThresholdKph) {
            if (!currentStop) {
                currentStop = {
                    sequenceNo: stops.length + 1,
                    startTrackIndex: index,
                    endTrackIndex: index,
                    startTimeUtc: point.timestamp,
                    endTimeUtc: point.timestamp,
                    address: point.address,
                };
                latitudeSum = 0;
                longitudeSum = 0;
                pointCount = 0;
            }

            currentStop.endTrackIndex = index;
            currentStop.endTimeUtc = point.timestamp;
            currentStop.address = currentStop.address || point.address;
            latitudeSum += point.latitude;
            longitudeSum += point.longitude;
            pointCount += 1;
            return;
        }

        finalizeStop();
    });

    finalizeStop();
    return stops;
};

const resolveNearestSite = (latitude, longitude, sites, radiusMeters) => {
    let match = null;

    (Array.isArray(sites) ? sites : []).forEach((site) => {
        const siteLatitude = toNumber(site.gpsGeofenceCenterLatitude, NaN);
        const siteLongitude = toNumber(site.gpsGeofenceCenterLongitude, NaN);

        if (!Number.isFinite(siteLatitude) || !Number.isFinite(siteLongitude)) {
            return;
        }

        const distanceMeters = haversineDistanceMeters(latitude, longitude, siteLatitude, siteLongitude);
        if (distanceMeters > radiusMeters) {
            return;
        }

        if (!match || distanceMeters < match.distanceMeters) {
            match = {
                siteId: toNumber(site.siteId, null),
                label: site.label,
                distanceMeters,
            };
        }
    });

    return match;
};

const buildClusters = (stops, sites, settings) => {
    const clusters = [];

    stops.forEach((stop) => {
        let matchedCluster = null;
        let matchedDistance = Number.POSITIVE_INFINITY;

        clusters.forEach((cluster) => {
            const distanceMeters = haversineDistanceMeters(stop.latitude, stop.longitude, cluster.latitude, cluster.longitude);
            if (distanceMeters <= settings.clusterRadiusMeters && distanceMeters < matchedDistance) {
                matchedCluster = cluster;
                matchedDistance = distanceMeters;
            }
        });

        if (!matchedCluster) {
            const nearestSite = resolveNearestSite(stop.latitude, stop.longitude, sites, settings.clusterRadiusMeters);
            const cluster = {
                clusterId: clusters.length + 1,
                latitude: stop.latitude,
                longitude: stop.longitude,
                centerLatitude: stop.latitude,
                centerLongitude: stop.longitude,
                radiusMeters: settings.clusterRadiusMeters,
                visitCount: 1,
                averageDwellMinutes: stop.durationMinutes,
                siteId: nearestSite?.siteId ?? null,
                geofenceId: null,
                label: nearestSite?.label ?? null,
                clusterType: null,
            };

            clusters.push(cluster);
            stop.clusterId = cluster.clusterId;
            return;
        }

        const nextVisitCount = matchedCluster.visitCount + 1;
        matchedCluster.latitude = round(((matchedCluster.latitude * matchedCluster.visitCount) + stop.latitude) / nextVisitCount, 8);
        matchedCluster.longitude = round(((matchedCluster.longitude * matchedCluster.visitCount) + stop.longitude) / nextVisitCount, 8);
        matchedCluster.centerLatitude = matchedCluster.latitude;
        matchedCluster.centerLongitude = matchedCluster.longitude;
        matchedCluster.averageDwellMinutes = round(((matchedCluster.averageDwellMinutes * matchedCluster.visitCount) + stop.durationMinutes) / nextVisitCount, 2);
        matchedCluster.visitCount = nextVisitCount;

        if (!matchedCluster.siteId) {
            const nearestSite = resolveNearestSite(matchedCluster.latitude, matchedCluster.longitude, sites, settings.clusterRadiusMeters);
            if (nearestSite) {
                matchedCluster.siteId = nearestSite.siteId;
                matchedCluster.label = nearestSite.label;
            }
        }

        stop.clusterId = matchedCluster.clusterId;
    });

    return clusters;
};

const applyClusterClassification = (clusters, stops) => {
    if (!clusters.length) {
        return;
    }

    const parkingCluster = [...clusters]
        .sort((left, right) => {
            if (right.averageDwellMinutes !== left.averageDwellMinutes) {
                return right.averageDwellMinutes - left.averageDwellMinutes;
            }
            return right.visitCount - left.visitCount;
        })[0];

    parkingCluster.clusterType = "Parking";

    let loadClusterId = null;
    let dumpClusterId = null;

    [...stops]
        .sort((left, right) => left.startTimeUtc.getTime() - right.startTimeUtc.getTime())
        .forEach((stop) => {
            if (!stop.clusterId || stop.clusterId === parkingCluster.clusterId) {
                return;
            }

            if (!loadClusterId) {
                loadClusterId = stop.clusterId;
                return;
            }

            if (!dumpClusterId && stop.clusterId !== loadClusterId) {
                dumpClusterId = stop.clusterId;
            }
        });

    clusters.forEach((cluster) => {
        if (cluster.clusterId === parkingCluster.clusterId) {
            cluster.clusterType = "Parking";
        } else if (cluster.clusterId === loadClusterId) {
            cluster.clusterType = "Load";
        } else if (cluster.clusterId === dumpClusterId) {
            cluster.clusterType = "Dump";
        } else {
            cluster.clusterType = "Transit";
        }

        if (!cluster.label) {
            cluster.label = cluster.clusterType === "Parking"
                ? "Parking / Depot"
                : cluster.clusterType === "Load"
                    ? "Load cluster"
                    : cluster.clusterType === "Dump"
                        ? "Dump cluster"
                        : `Transit cluster ${cluster.clusterId}`;
        }
    });

    const clusterMap = new Map(clusters.map((cluster) => [cluster.clusterId, cluster]));
    stops.forEach((stop) => {
        const cluster = clusterMap.get(stop.clusterId);
        if (!cluster) {
            return;
        }

        stop.clusterLabel = cluster.label;
        stop.clusterType = cluster.clusterType;
        stop.siteId = cluster.siteId;
        stop.geofenceId = cluster.geofenceId;
    });
};

const toConfidence = (distanceKm, durationMinutes, settings) => {
    const minDistance = Math.max(toNumber(settings.minimumTripDistanceKm, 0), 0.1);
    const minDuration = Math.max(toNumber(settings.minimumTripDurationMinutes, 0), 0.1);
    const distanceScore = Math.min(distanceKm / minDistance, 2);
    const durationScore = Math.min(durationMinutes / minDuration, 2);
    const confidenceScore = round(Math.min((distanceScore + durationScore) / 4, 1), 2);

    return {
        confidenceScore,
        confidenceBand: confidenceScore >= 0.85 ? "High" : confidenceScore >= 0.65 ? "Medium" : "Low",
    };
};

const buildTripLegs = (points, stops, settings) => {
    const tripLegs = [];

    for (let index = 0; index < stops.length - 1; index += 1) {
        const originStop = stops[index];
        const destinationStop = stops[index + 1];

        if (!originStop.clusterId || !destinationStop.clusterId || originStop.clusterId === destinationStop.clusterId) {
            continue;
        }

        const startTrackIndex = Math.max(0, originStop.endTrackIndex);
        const endTrackIndex = Math.min(points.length - 1, destinationStop.startTrackIndex);
        if (endTrackIndex <= startTrackIndex) {
            continue;
        }

        const durationMinutes = (destinationStop.startTimeUtc.getTime() - originStop.endTimeUtc.getTime()) / 60000;
        const distanceKm = calculateDistanceKm(points, startTrackIndex, endTrackIndex);
        if (durationMinutes < settings.minimumTripDurationMinutes || distanceKm < settings.minimumTripDistanceKm) {
            continue;
        }

        const confidence = toConfidence(distanceKm, durationMinutes, settings);
        tripLegs.push({
            startTimeUtc: originStop.endTimeUtc,
            endTimeUtc: destinationStop.startTimeUtc,
            originSiteId: originStop.siteId ?? null,
            destinationSiteId: destinationStop.siteId ?? null,
            originGeofenceId: originStop.geofenceId ?? null,
            destinationGeofenceId: destinationStop.geofenceId ?? null,
            startLatitude: originStop.latitude,
            startLongitude: originStop.longitude,
            endLatitude: destinationStop.latitude,
            endLongitude: destinationStop.longitude,
            distanceKm: round(distanceKm, 2),
            durationMinutes: round(durationMinutes, 2),
            maxSpeedKph: calculateMaxSpeed(points, startTrackIndex, endTrackIndex),
            status: "Completed",
            detectionMode: "FrontendCluster",
            ...confidence,
        });
    }

    return tripLegs;
};

export const buildFrontendClusterPreview = ({ sourcePreview, settings, sites = [] }) => {
    const normalizedSettings = {
        stopSpeedThresholdKph: toNumber(settings?.stopSpeedThresholdKph, 3),
        minimumStopDurationMinutes: toNumber(settings?.minimumStopDurationMinutes, 1.5),
        minimumTripDistanceKm: toNumber(settings?.minimumTripDistanceKm, 0.5),
        minimumTripDurationMinutes: toNumber(settings?.minimumTripDurationMinutes, 2),
        clusterRadiusMeters: toNumber(settings?.clusterRadiusMeters, 150),
        maxTrackPoints: toNumber(settings?.maxTrackPoints, 5000),
    };

    const points = normalizeTrackPoints(sourcePreview?.trackPoints || sourcePreview?.TrackPoints || []);
    const preview = {
        vehicleId: sourcePreview?.vehicleId ?? null,
        vehicleName: sourcePreview?.vehicleName ?? "Selected vehicle",
        fromUtc: sourcePreview?.fromUtc ?? null,
        toUtc: sourcePreview?.toUtc ?? null,
        totalTrackPoints: points.length,
        trackPoints: points,
        settingsStopSpeedThresholdKph: normalizedSettings.stopSpeedThresholdKph,
        settingsMinimumStopDurationMinutes: normalizedSettings.minimumStopDurationMinutes,
        settingsMinimumTripDistanceKm: normalizedSettings.minimumTripDistanceKm,
        settingsMinimumTripDurationMinutes: normalizedSettings.minimumTripDurationMinutes,
        settingsClusterRadiusMeters: normalizedSettings.clusterRadiusMeters,
        settingsMaxTrackPoints: normalizedSettings.maxTrackPoints,
        stops: [],
        stopsDetected: 0,
        clusters: [],
        clustersFormed: 0,
        tripLegs: [],
        tripLegsDetected: 0,
    };

    if (points.length < 2) {
        return preview;
    }

    const stops = extractStops(points, normalizedSettings);
    preview.stops = stops;
    preview.stopsDetected = stops.length;

    if (stops.length < 2) {
        return preview;
    }

    const clusters = buildClusters(stops, sites, normalizedSettings);
    applyClusterClassification(clusters, stops);
    preview.clusters = clusters;
    preview.clustersFormed = clusters.length;

    if (clusters.length < 2) {
        return preview;
    }

    const tripLegs = buildTripLegs(points, stops, normalizedSettings);
    preview.tripLegs = tripLegs;
    preview.tripLegsDetected = tripLegs.length;

    return preview;
};

export { buildClusterSourceKey };