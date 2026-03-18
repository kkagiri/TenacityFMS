/**
 * File: VehicleTripDetailPanel.js
 * Purpose: Flat, border-separated side panel for reviewing trip-group drill-down details, legs, and planning-readiness placeholders.
 * Dependencies: React, SlidePanel, vehicleTripService, trip badge components.
 * Last Modified: 2026-03-14
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import notify from "devextreme/ui/notify";
import SlidePanel from "../../../../components/ui/SlidePanel";
import { fetchVehicleTripDetail } from "../services/vehicleTripService";
import {
    formatDateTime,
    formatDistance,
    formatDuration,
    formatFuel,
    formatShortDateTime,
} from "../utils/vehicleTripUi";
import { VehicleTripBadgeCluster } from "./VehicleTripBadges";
import VehicleTripPlanningSection from "./VehicleTripPlanningSection";
import VehicleTripRouteMap from "./VehicleTripRouteMap";
import "./VehicleTripDetailPanel.scss";

/** Ensure toUtc is always strictly after fromUtc (backend rejects equal values). */
const ensureTimeRange = (fromUtc, toUtc) => {
    if (!fromUtc) return { fromUtc, toUtc };
    const from = new Date(fromUtc);
    const to = toUtc ? new Date(toUtc) : from;
    if (to <= from) {
        const adjusted = new Date(from.getTime() + 1000);
        return { fromUtc: from.toISOString(), toUtc: adjusted.toISOString() };
    }
    return { fromUtc: from.toISOString(), toUtc: to.toISOString() };
};

const DetailMetric = ({ label, value, hint }) => (
    <div className="vehicle-trip-detail-panel__metric-card">
        <span className="vehicle-trip-detail-panel__metric-label">{label}</span>
        <strong className="vehicle-trip-detail-panel__metric-value">{value}</strong>
        {hint ? <span className="vehicle-trip-detail-panel__metric-hint">{hint}</span> : null}
    </div>
);

const TripLegItem = ({ leg }) => {
    return (
        <article className="vehicle-trip-detail-panel__leg-card">
            <div className="vehicle-trip-detail-panel__leg-header">
                <div>
                    <div className="vehicle-trip-detail-panel__leg-title">Leg {leg.sequenceNo || "—"}</div>
                    <div className="vehicle-trip-detail-panel__leg-route">
                        {leg.originDisplayName} <span>→</span> {leg.destinationDisplayName}
                    </div>
                </div>
                <VehicleTripBadgeCluster
                    status={leg.status}
                    reconciliationStatus={leg.reconciliationStatus}
                    confidenceScore={leg.confidenceScore}
                    confidenceBand={leg.confidenceBand}
                    anomalyFlags={leg.anomalyFlags}
                    compact={true}
                />
            </div>

            <div className="vehicle-trip-detail-panel__leg-grid">
                <div>
                    <div className="vehicle-trip-detail-panel__field-label">Start</div>
                    <div className="vehicle-trip-detail-panel__field-value">{formatDateTime(leg.startTimeUtc)}</div>
                </div>
                <div>
                    <div className="vehicle-trip-detail-panel__field-label">End</div>
                    <div className="vehicle-trip-detail-panel__field-value">{formatDateTime(leg.endTimeUtc)}</div>
                </div>
                <div>
                    <div className="vehicle-trip-detail-panel__field-label">Distance</div>
                    <div className="vehicle-trip-detail-panel__field-value">{formatDistance(leg.distanceKm)}</div>
                </div>
                <div>
                    <div className="vehicle-trip-detail-panel__field-label">Duration</div>
                    <div className="vehicle-trip-detail-panel__field-value">{formatDuration(leg.durationMinutes)}</div>
                </div>
                <div>
                    <div className="vehicle-trip-detail-panel__field-label">Fuel used</div>
                    <div className="vehicle-trip-detail-panel__field-value">{formatFuel(leg.fuelConsumed)}</div>
                </div>
                <div>
                    <div className="vehicle-trip-detail-panel__field-label">Max speed</div>
                    <div className="vehicle-trip-detail-panel__field-value">{leg.maxSpeedKph != null ? `${Number(leg.maxSpeedKph).toFixed(1)} km/h` : "—"}</div>
                </div>
            </div>
        </article>
    );
};

const VehicleTripDetailPanel = ({
    open,
    onClose,
    vehicleTripGroupId,
    canManageTrips = false,
    onRequestOverride,
    onRecompute,
    onReconcile,
}) => {
    const [tripDetail, setTripDetail] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const loadTripDetail = useCallback(async () => {
        if (!open || !vehicleTripGroupId) {
            return;
        }

        try {
            setIsLoading(true);
            const detail = await fetchVehicleTripDetail(vehicleTripGroupId);
            setTripDetail(detail);
        } catch (error) {
            console.error("Error loading trip detail:", error);
            notify(error.message || "Failed to load trip detail", "error", 3000);
            setTripDetail(null);
        } finally {
            setIsLoading(false);
        }
    }, [open, vehicleTripGroupId]);

    useEffect(() => {
        if (!open) {
            setTripDetail(null);
            return;
        }

        loadTripDetail();
    }, [loadTripDetail, open]);

    const headerActions = (
        <div className="vehicle-trip-detail-panel__header-actions">
            <button
                type="button"
                className="vehicle-trip-detail-panel__header-btn"
                onClick={loadTripDetail}
            >
                <i className="fa-light fa-arrows-rotate" />
                <span>Refresh</span>
            </button>
            {canManageTrips ? (
                <button
                    type="button"
                    className="vehicle-trip-detail-panel__header-btn"
                    onClick={async () => {
                        if (!tripDetail || typeof onReconcile !== "function") {
                            return;
                        }

                        const reconcileRange = ensureTimeRange(tripDetail.startTimeUtc, tripDetail.endTimeUtc);
                        await onReconcile({
                            vehicleId: tripDetail.vehicleId,
                            fromUtc: reconcileRange.fromUtc,
                            toUtc: reconcileRange.toUtc,
                        });
                        await loadTripDetail();
                    }}
                >
                    <i className="fa-light fa-check-double" />
                    <span>Reconcile</span>
                </button>
            ) : null}
            {canManageTrips ? (
                <button
                    type="button"
                    className="vehicle-trip-detail-panel__header-btn"
                    onClick={async () => {
                        if (!tripDetail || typeof onRecompute !== "function") {
                            return;
                        }

                        const recomputeRange = ensureTimeRange(tripDetail.startTimeUtc, tripDetail.endTimeUtc);
                        await onRecompute({
                            vehicleId: tripDetail.vehicleId,
                            fromUtc: recomputeRange.fromUtc,
                            toUtc: recomputeRange.toUtc,
                        });
                        await loadTripDetail();
                    }}
                >
                    <i className="fa-light fa-route" />
                    <span>Recompute</span>
                </button>
            ) : null}
            {canManageTrips ? (
                <button
                    type="button"
                    className="vehicle-trip-detail-panel__header-btn vehicle-trip-detail-panel__header-btn--primary"
                    onClick={() => {
                        if (tripDetail && typeof onRequestOverride === "function") {
                            onRequestOverride(tripDetail);
                        }
                    }}
                >
                    <i className="fa-light fa-split" />
                    <span>Override</span>
                </button>
            ) : null}
        </div>
    );

    const summaryMetrics = useMemo(() => {
        if (!tripDetail) {
            return [];
        }

        return [
            {
                label: "Trip count",
                value: String(tripDetail.tripCount || 0),
                hint: tripDetail.groupingTypeLabel,
            },
            {
                label: "Distance",
                value: formatDistance(tripDetail.totalDistanceKm),
                hint: tripDetail.detectionMode,
            },
            {
                label: "Duration",
                value: formatDuration(tripDetail.totalDurationMinutes),
                hint: formatShortDateTime(tripDetail.startTimeUtc),
            },
            {
                label: "Fuel",
                value: formatFuel(tripDetail.totalFuelConsumed),
                hint: "Trip-group total",
            },
        ];
    }, [tripDetail]);

    const isProjectLocation = tripDetail?.classificationSourceType === "ProjectLocation";

    const classificationBadge = useMemo(() => {
        if (!tripDetail) {
            return null;
        }

        return {
            iconClassName: isProjectLocation ? "fa-light fa-diagram-project" : "fa-light fa-building-flag",
            label: isProjectLocation ? "Classification source: Project location" : "Classification source: Site records",
            title: isProjectLocation
                ? `Trip classification is resolved from project-location data${tripDetail.classificationSourceLabel ? ` (${tripDetail.classificationSourceLabel})` : ""}.`
                : "Current trip classification is resolved from Site records linked to geofences.",
        };
    }, [tripDetail, isProjectLocation]);

    return (
        <SlidePanel
            open={open}
            onClose={onClose}
            title="Trip detail"
            width="min(1500px, 94vw)"
            panelClassName="vehicle-trip-detail-panel-shell"
            headerActions={headerActions}
        >
            <div className="vehicle-trip-detail-panel">
                {isLoading ? (
                    <div className="vehicle-trip-detail-panel__empty">
                        <i className="fa-light fa-spinner fa-spin" />
                        <span>Loading trip detail…</span>
                    </div>
                ) : !tripDetail ? (
                    <div className="vehicle-trip-detail-panel__empty">
                        <i className="fa-light fa-route" />
                        <span>Select a trip group to review its leg timeline.</span>
                    </div>
                ) : (
                    <>
                        <section className="vehicle-trip-detail-panel__hero">
                            <div className="vehicle-trip-detail-panel__hero-copy">
                                <span className="vehicle-trip-detail-panel__eyebrow">Vehicle trip management</span>
                                <h3>{tripDetail.vehicleLabel}</h3>
                                <p>
                                    {tripDetail.originDisplayName} <span>→</span> {tripDetail.destinationDisplayName}
                                </p>
                                <div className="vehicle-trip-detail-panel__hero-meta">
                                    <span>{formatDateTime(tripDetail.startTimeUtc)}</span>
                                    <span>{tripDetail.groupingTypeLabel}</span>
                                    <span>{tripDetail.detectionMode}</span>
                                </div>
                                <div className="vehicle-trip-detail-panel__classification-row">
                                    {classificationBadge ? (
                                        <span
                                            className={`vehicle-trip-detail-panel__classification-badge ${isProjectLocation ? "vehicle-trip-detail-panel__classification-badge--project" : "vehicle-trip-detail-panel__classification-badge--site"}`}
                                            title={classificationBadge.title}
                                        >
                                            <i className={classificationBadge.iconClassName}></i>
                                            {classificationBadge.label}
                                        </span>
                                    ) : null}
                                    {tripDetail.classificationSourceType !== "ProjectLocation" ? (
                                        <span
                                            className="vehicle-trip-detail-panel__classification-badge vehicle-trip-detail-panel__classification-badge--reserved"
                                            title="Project-location level classification is reserved and not modeled separately yet."
                                        >
                                            <i className="fa-light fa-clock-rotate-left"></i>
                                            Project locations: Reserved
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                            <VehicleTripBadgeCluster
                                status={tripDetail.status}
                                reconciliationStatus={tripDetail.reconciliationStatus}
                                confidenceScore={tripDetail.confidenceScore}
                                confidenceBand={tripDetail.confidenceBand}
                                anomalyFlags={tripDetail.anomalyFlags}
                            />
                        </section>

                        <section className="vehicle-trip-detail-panel__metrics">
                            {summaryMetrics.map((metric) => (
                                <DetailMetric key={metric.label} {...metric} />
                            ))}
                        </section>

                        <section className="vehicle-trip-detail-panel__section">
                            <div className="vehicle-trip-detail-panel__section-header">
                                <div>
                                    <h4>Trip map</h4>
                                    <p>Visual route view from the stored leg coordinates for this trip group.</p>
                                </div>
                            </div>
                            <VehicleTripRouteMap
                                vehicleTripGroupId={tripDetail.vehicleTripGroupId}
                                trips={tripDetail.trips}
                            />
                        </section>

                        <section className="vehicle-trip-detail-panel__section">
                            <div className="vehicle-trip-detail-panel__section-header">
                                <div>
                                    <h4>Route overview</h4>
                                    <p>Grouped trip facts used by history, tracking, and fuel views.</p>
                                </div>
                            </div>
                            <div className="vehicle-trip-detail-panel__overview-grid">
                                <div>
                                    <div className="vehicle-trip-detail-panel__field-label">Origin</div>
                                    <div className="vehicle-trip-detail-panel__field-value">{tripDetail.originDisplayName}</div>
                                </div>
                                <div>
                                    <div className="vehicle-trip-detail-panel__field-label">Destination</div>
                                    <div className="vehicle-trip-detail-panel__field-value">{tripDetail.destinationDisplayName}</div>
                                </div>
                                <div>
                                    <div className="vehicle-trip-detail-panel__field-label">Start</div>
                                    <div className="vehicle-trip-detail-panel__field-value">{formatDateTime(tripDetail.startTimeUtc)}</div>
                                </div>
                                <div>
                                    <div className="vehicle-trip-detail-panel__field-label">End</div>
                                    <div className="vehicle-trip-detail-panel__field-value">{formatDateTime(tripDetail.endTimeUtc)}</div>
                                </div>
                            </div>
                        </section>

                        <section className="vehicle-trip-detail-panel__section">
                            <div className="vehicle-trip-detail-panel__section-header">
                                <div>
                                    <h4>Planning & bounds</h4>
                                    <p>Project-level classification and zone governance for this trip group.</p>
                                </div>
                            </div>
                            <VehicleTripPlanningSection
                                tripDetail={tripDetail}
                                canManageTrips={canManageTrips}
                                onPlanningLinkUpdated={loadTripDetail}
                            />
                        </section>

                        <section className="vehicle-trip-detail-panel__section">
                            <div className="vehicle-trip-detail-panel__section-header">
                                <div>
                                    <h4>Leg timeline</h4>
                                    <p>Individual trip legs and their confidence, reconciliation, and anomaly markers.</p>
                                </div>
                            </div>
                            <div className="vehicle-trip-detail-panel__leg-list">
                                {tripDetail.trips.length ? (
                                    tripDetail.trips.map((leg) => <TripLegItem key={leg.vehicleTripId || `${leg.sequenceNo}-${leg.startTimeUtc}`} leg={leg} />)
                                ) : (
                                    <div className="vehicle-trip-detail-panel__sub-empty">No trip legs were returned for this group.</div>
                                )}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </SlidePanel>
    );
};

export default VehicleTripDetailPanel;
