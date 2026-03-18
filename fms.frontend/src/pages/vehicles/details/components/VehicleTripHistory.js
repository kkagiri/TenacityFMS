/**
 * File: VehicleTripHistory.js
 * Purpose: Displays persisted vehicle trip history using the M365 admin template and side-panel drill-down flows.
 * Dependencies: React, notify, vehicleTripService, trip detail and override panels.
 * Last Modified: 2026-03-11
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import notify from "devextreme/ui/notify";
import {
    fetchVehicleTripHistory,
    recomputeVehicleTrips,
} from "../../trips/services/vehicleTripService";
import {
    PLANNING_ENTITY_PLACEHOLDERS,
    buildDateTimeLocalValue,
    formatDateTime,
    formatDistance,
    formatDuration,
    formatFuel,
    parseDateTimeLocalValue,
} from "../../trips/utils/vehicleTripUi";
import { VehicleTripBadgeCluster } from "../../trips/components/VehicleTripBadges";
import VehicleTripDetailPanel from "../../trips/components/VehicleTripDetailPanel";
import VehicleTripOverridePanel from "../../trips/components/VehicleTripOverridePanel";
import "./VehicleTripHistory.scss";

const SummaryCard = ({ label, value, hint }) => (
    <div className="vehicle-trip-history__stat-card">
        <span className="vehicle-trip-history__stat-label">{label}</span>
        <strong className="vehicle-trip-history__stat-value">{value}</strong>
        {hint ? <span className="vehicle-trip-history__stat-hint">{hint}</span> : null}
    </div>
);

const VehicleTripHistory = ({
    vehicleId,
    canRecompute = false,
    canManageTrips = canRecompute,
}) => {
    const [dateFrom, setDateFrom] = useState(() => buildDateTimeLocalValue(new Date(new Date().setDate(new Date().getDate() - 7))));
    const [dateTo, setDateTo] = useState(() => buildDateTimeLocalValue(new Date()));
    const [tripGroups, setTripGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRecomputing, setIsRecomputing] = useState(false);
    const [selectedTripGroupId, setSelectedTripGroupId] = useState(null);
    const [tripDetailForOverride, setTripDetailForOverride] = useState(null);
    const [isOverridePanelOpen, setIsOverridePanelOpen] = useState(false);

    const loadTrips = useCallback(async () => {
        if (!vehicleId) {
            setTripGroups([]);
            return;
        }

        try {
            setIsLoading(true);
            const fromUtc = parseDateTimeLocalValue(dateFrom)?.toISOString();
            const toUtc = parseDateTimeLocalValue(dateTo)?.toISOString();
            const data = await fetchVehicleTripHistory(vehicleId, { fromUtc, toUtc });
            setTripGroups(data);
        } catch (error) {
            console.error("Error loading vehicle trip history:", error);
            notify(error.message || "Failed to load trip history", "error", 3000);
            setTripGroups([]);
        } finally {
            setIsLoading(false);
        }
    }, [dateFrom, dateTo, vehicleId]);

    useEffect(() => {
        loadTrips();
    }, [loadTrips]);

    const handleRecompute = useCallback(async (payload) => {
        if (!canRecompute) {
            notify("Only admins can recompute trips", "warning", 3000);
            return;
        }

        const fromUtc = payload?.fromUtc || parseDateTimeLocalValue(dateFrom)?.toISOString();
        const toUtc = payload?.toUtc || parseDateTimeLocalValue(dateTo)?.toISOString();
        const targetVehicleId = payload?.vehicleId || Number(vehicleId);

        try {
            setIsRecomputing(true);
            const result = await recomputeVehicleTrips({
                vehicleId: targetVehicleId,
                fromUtc,
                toUtc,
            });

            notify(
                `Recompute finished. ${result?.groupsCreated || 0} groups / ${result?.tripsCreated || 0} trips created.`,
                "success",
                4000
            );
            await loadTrips();
        } catch (error) {
            console.error("Error recomputing trips:", error);
            notify(error.message || "Trip recompute failed", "error", 3000);
        } finally {
            setIsRecomputing(false);
        }
    }, [canRecompute, dateFrom, dateTo, loadTrips, vehicleId]);

    const summary = useMemo(() => {
        const totalGroups = tripGroups.length;
        const totalTrips = tripGroups.reduce((sum, item) => sum + Number(item.tripCount || 0), 0);
        const totalDistanceKm = tripGroups.reduce((sum, item) => sum + Number(item.totalDistanceKm || 0), 0);
        const totalFuel = tripGroups.reduce((sum, item) => sum + Number(item.totalFuelConsumed || 0), 0);
        const inProgressCount = tripGroups.filter((item) => item.statusLabel === "In progress").length;

        return {
            totalGroups,
            totalTrips,
            totalDistanceKm,
            totalFuel,
            inProgressCount,
        };
    }, [tripGroups]);

    return (
        <div className="vehicle-trip-history">
            <section className="vehicle-trip-history__toolbar">
                <div className="vehicle-trip-history__toolbar-copy">
                    <span className="vehicle-trip-history__eyebrow">Vehicle trip management</span>
                    <h3>Trip history</h3>
                    <p>Strict M365 admin layout with trip drill-down and override actions opened in side panels.</p>
                </div>

                <div className="vehicle-trip-history__toolbar-actions">
                    <button
                        type="button"
                        className="vehicle-trip-history__btn"
                        onClick={loadTrips}
                        disabled={isLoading || isRecomputing}
                    >
                        <i className="fa-light fa-arrows-rotate" />
                        <span>Refresh</span>
                    </button>
                    <button
                        type="button"
                        className="vehicle-trip-history__btn vehicle-trip-history__btn--primary"
                        onClick={() => handleRecompute()}
                        disabled={isLoading || isRecomputing || !canRecompute}
                    >
                        <i className={`fa-light ${isRecomputing ? "fa-spinner fa-spin" : "fa-route"}`} />
                        <span>{isRecomputing ? "Recomputing..." : "Recompute trips"}</span>
                    </button>
                </div>
            </section>

            <section className="vehicle-trip-history__filters">
                <label className="vehicle-trip-history__field">
                    <span className="vehicle-trip-history__field-label">From</span>
                    <input
                        type="datetime-local"
                        className="vehicle-trip-history__input"
                        value={dateFrom}
                        onChange={(event) => setDateFrom(event.target.value)}
                    />
                </label>
                <label className="vehicle-trip-history__field">
                    <span className="vehicle-trip-history__field-label">To</span>
                    <input
                        type="datetime-local"
                        className="vehicle-trip-history__input"
                        value={dateTo}
                        onChange={(event) => setDateTo(event.target.value)}
                    />
                </label>
            </section>

            <section className="vehicle-trip-history__summary">
                <SummaryCard label="Route groups" value={String(summary.totalGroups)} hint="Unified trip groups" />
                <SummaryCard label="Detected trips" value={String(summary.totalTrips)} hint="Legs inside groups" />
                <SummaryCard label="Distance" value={formatDistance(summary.totalDistanceKm)} hint="Selected period" />
                <SummaryCard label="Fuel" value={formatFuel(summary.totalFuel)} hint="Where telemetry exists" />
                <SummaryCard label="In progress" value={String(summary.inProgressCount)} hint="Current persisted transit" />
            </section>

            <section className="vehicle-trip-history__readiness">
                {PLANNING_ENTITY_PLACEHOLDERS.map((item) => (
                    <div key={item.label} className="vehicle-trip-history__readiness-card">
                        <span className="vehicle-trip-history__section-title">{item.label}</span>
                        <span className="vehicle-trip-history__readiness-value">{item.value}</span>
                    </div>
                ))}
            </section>

            <section className="vehicle-trip-history__list">
                <div className="vehicle-trip-history__list-header">
                    <div>
                        <h4>Trip timeline</h4>
                        <p>Confidence, anomaly, and reconciliation badges are available directly from each card.</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="vehicle-trip-history__empty">
                        <i className="fa-light fa-spinner fa-spin" />
                        <span>Loading trip history…</span>
                    </div>
                ) : tripGroups.length === 0 ? (
                    <div className="vehicle-trip-history__empty">
                        <i className="fa-light fa-route" />
                        <span>No persisted trips were found for the selected period.</span>
                    </div>
                ) : (
                    tripGroups.map((group) => (
                        <article key={group.vehicleTripGroupId} className="vehicle-trip-history__trip-card">
                            <div className="vehicle-trip-history__trip-header">
                                <div>
                                    <div className="vehicle-trip-history__trip-title">
                                        {group.originDisplayName} <span>→</span> {group.destinationDisplayName}
                                    </div>
                                    <div className="vehicle-trip-history__trip-subtitle">
                                        {formatDateTime(group.startTimeUtc)} to {formatDateTime(group.endTimeUtc)}
                                    </div>
                                </div>
                                <VehicleTripBadgeCluster
                                    status={group.status}
                                    reconciliationStatus={group.reconciliationStatus}
                                    confidenceScore={group.confidenceScore}
                                    confidenceBand={group.confidenceBand}
                                    anomalyFlags={group.anomalyFlags}
                                />
                            </div>

                            <div className="vehicle-trip-history__trip-meta">
                                <div>
                                    <span className="vehicle-trip-history__field-label">Trips</span>
                                    <span className="vehicle-trip-history__readiness-value">{group.tripCount}</span>
                                </div>
                                <div>
                                    <span className="vehicle-trip-history__field-label">Distance</span>
                                    <span className="vehicle-trip-history__readiness-value">{formatDistance(group.totalDistanceKm)}</span>
                                </div>
                                <div>
                                    <span className="vehicle-trip-history__field-label">Duration</span>
                                    <span className="vehicle-trip-history__readiness-value">{formatDuration(group.totalDurationMinutes)}</span>
                                </div>
                                <div>
                                    <span className="vehicle-trip-history__field-label">Fuel</span>
                                    <span className="vehicle-trip-history__readiness-value">{formatFuel(group.totalFuelConsumed)}</span>
                                </div>
                                <div>
                                    <span className="vehicle-trip-history__field-label">Movement profile</span>
                                    <span className="vehicle-trip-history__readiness-value">{group.movementProfileLabel}</span>
                                </div>
                                <div>
                                    <span className="vehicle-trip-history__field-label">Grouping</span>
                                    <span className="vehicle-trip-history__readiness-value">{group.groupingTypeLabel}</span>
                                </div>
                            </div>

                            <div className="vehicle-trip-history__trip-footer">
                                <div className="vehicle-trip-history__trip-subtitle">
                                    Plan match and out-of-bounds UX are reserved in the drill-down side panel.
                                </div>
                                <div className="vehicle-trip-history__trip-actions">
                                    <button
                                        type="button"
                                        className="vehicle-trip-history__link-btn"
                                        onClick={() => setSelectedTripGroupId(group.vehicleTripGroupId)}
                                    >
                                        <i className="fa-light fa-sidebar" />
                                        <span>View detail</span>
                                    </button>
                                    {canManageTrips ? (
                                        <button
                                            type="button"
                                            className="vehicle-trip-history__link-btn"
                                            onClick={() => setSelectedTripGroupId(group.vehicleTripGroupId)}
                                        >
                                            <i className="fa-light fa-split" />
                                            <span>Override via detail</span>
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        </article>
                    ))
                )}
            </section>

            <VehicleTripDetailPanel
                open={selectedTripGroupId != null}
                onClose={() => setSelectedTripGroupId(null)}
                vehicleTripGroupId={selectedTripGroupId}
                canManageTrips={canManageTrips}
                onRecompute={handleRecompute}
                onRequestOverride={(detail) => {
                    setTripDetailForOverride(detail);
                    setIsOverridePanelOpen(true);
                }}
            />

            <VehicleTripOverridePanel
                open={isOverridePanelOpen}
                onClose={() => setIsOverridePanelOpen(false)}
                tripDetail={tripDetailForOverride}
                onOverrideSuccess={loadTrips}
            />
        </div>
    );
};

export default VehicleTripHistory;
