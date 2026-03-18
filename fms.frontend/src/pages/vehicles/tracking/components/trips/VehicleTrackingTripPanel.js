/**
 * File: VehicleTrackingTripPanel.js
 * Purpose: Slide-in trip timeline for the tracking workspace, highlighting in-progress trips and recent movement history.
 * Dependencies: React, SlidePanel, trip badge components, vehicleTripUi helpers.
 * Last Modified: 2026-03-11
 */
import React, { useMemo } from "react";
import SlidePanel from "../../../../../components/ui/SlidePanel";
import {
    formatDistance,
    formatDuration,
    formatShortDateTime,
    getPlanMatchConfig,
} from "../../../trips/utils/vehicleTripUi";
import { VehicleTripBadgeCluster } from "../../../trips/components/VehicleTripBadges";
import "./VehicleTrackingTripPanel.scss";

const StatCard = ({ label, value, hint }) => (
    <div className="vehicle-tracking-trip-panel__stat-card">
        <span className="vehicle-tracking-trip-panel__stat-label">{label}</span>
        <strong className="vehicle-tracking-trip-panel__stat-value">{value}</strong>
        {hint ? <span className="vehicle-tracking-trip-panel__stat-hint">{hint}</span> : null}
    </div>
);

const TimelineCard = ({ tripGroup, onOpenTripDetail }) => (
    <article className="vehicle-tracking-trip-panel__timeline-card">
        <div className="vehicle-tracking-trip-panel__timeline-header">
            <div>
                <div className="vehicle-tracking-trip-panel__timeline-title">{tripGroup.vehicleLabel}</div>
                <div className="vehicle-tracking-trip-panel__timeline-route">
                    {tripGroup.originDisplayName} <span>→</span> {tripGroup.destinationDisplayName || "Awaiting destination"}
                </div>
            </div>
            <VehicleTripBadgeCluster
                status={tripGroup.status}
                reconciliationStatus={tripGroup.reconciliationStatus}
                confidenceScore={tripGroup.confidenceScore}
                confidenceBand={tripGroup.confidenceBand}
                anomalyFlags={tripGroup.anomalyFlags}
                compact={true}
            />
        </div>

        <div className="vehicle-tracking-trip-panel__timeline-meta">
            <span>{formatShortDateTime(tripGroup.startTimeUtc)}</span>
            <span>{formatDistance(tripGroup.totalDistanceKm)}</span>
            <span>{formatDuration(tripGroup.totalDurationMinutes)}</span>
            <span>{tripGroup.detectionMode}</span>
        </div>

        <div className="vehicle-tracking-trip-panel__timeline-footer">
            <div className="vehicle-tracking-trip-panel__timeline-hint">
                {tripGroup.planMatchStatus != null ? (() => {
                    const matchCfg = getPlanMatchConfig(tripGroup.planMatchStatus);
                    return (
                        <span className={`vehicle-tracking-trip-panel__timeline-tag vehicle-tracking-trip-panel__timeline-tag--${matchCfg.tone}`}>
                            <i className="fa-light fa-clipboard-check" /> {matchCfg.label}
                        </span>
                    );
                })() : (
                    <span className="vehicle-tracking-trip-panel__timeline-tag">Plan match —</span>
                )}
                {tripGroup.isOutOfBounds ? (
                    <span className="vehicle-tracking-trip-panel__timeline-tag vehicle-tracking-trip-panel__timeline-tag--danger">
                        <i className="fa-light fa-triangle-exclamation" /> Out-of-bounds
                    </span>
                ) : (
                    <span className="vehicle-tracking-trip-panel__timeline-tag">In bounds</span>
                )}
            </div>
            <button
                type="button"
                className="vehicle-tracking-trip-panel__link-btn"
                onClick={() => onOpenTripDetail(tripGroup.vehicleTripGroupId)}
            >
                <i className="fa-light fa-arrow-right" />
                <span>View detail</span>
            </button>
        </div>
    </article>
);

const VehicleTrackingTripPanel = ({
    open,
    onClose,
    inProgressTrips,
    recentTrips,
    isLoading,
    lastUpdated,
    selectedVehicleId,
    selectedVehicleLabel,
    canRecompute,
    onOpenTripDetail,
    onOpenTripsPage,
    onRefresh,
    onRecomputeSelectedVehicle,
    isTripActionLoading = false,
}) => {
    const scopedRecentTrips = useMemo(() => {
        if (!selectedVehicleId) {
            return recentTrips.slice(0, 12);
        }

        return recentTrips.filter((tripGroup) => tripGroup.vehicleId === selectedVehicleId).slice(0, 12);
    }, [recentTrips, selectedVehicleId]);

    const scopedInProgressTrips = useMemo(() => {
        if (!selectedVehicleId) {
            return inProgressTrips;
        }

        return inProgressTrips.filter((tripGroup) => tripGroup.vehicleId === selectedVehicleId);
    }, [inProgressTrips, selectedVehicleId]);

    const headerActions = (
        <div className="vehicle-tracking-trip-panel__header-actions">
            <button type="button" className="vehicle-tracking-trip-panel__header-btn" onClick={onRefresh}>
                <i className="fa-light fa-arrows-rotate" />
                <span>Refresh</span>
            </button>
            <button type="button" className="vehicle-tracking-trip-panel__header-btn" onClick={onOpenTripsPage}>
                <i className="fa-light fa-arrow-up-right-from-square" />
                <span>Open page</span>
            </button>
            {canRecompute && selectedVehicleId ? (
                <button
                    type="button"
                    className="vehicle-tracking-trip-panel__header-btn vehicle-tracking-trip-panel__header-btn--primary"
                    onClick={onRecomputeSelectedVehicle}
                    disabled={isTripActionLoading}
                >
                    <i className={`fa-light ${isTripActionLoading ? "fa-spinner fa-spin" : "fa-route"}`} />
                    <span>{isTripActionLoading ? "Recomputing..." : "Recompute vehicle"}</span>
                </button>
            ) : null}
        </div>
    );

    return (
        <SlidePanel
            open={open}
            onClose={onClose}
            title="Trip timeline"
            width="min(560px, 96vw)"
            panelClassName="vehicle-tracking-trip-panel-shell"
            headerActions={headerActions}
        >
            <div className="vehicle-tracking-trip-panel">
                <section className="vehicle-tracking-trip-panel__hero">
                    <div>
                        <span className="vehicle-tracking-trip-panel__eyebrow">Tracking workspace</span>
                        <h3>{selectedVehicleLabel ? `${selectedVehicleLabel} timeline` : "Fleet trip timeline"}</h3>
                        <p>
                            {lastUpdated ? `Updated ${formatShortDateTime(lastUpdated)}` : "Trip snapshot will appear after the first refresh."}
                        </p>
                    </div>
                </section>

                <section className="vehicle-tracking-trip-panel__stats">
                    <StatCard label="In transit" value={String(scopedInProgressTrips.length)} hint="Persisted in-progress groups" />
                    <StatCard label="Recent trips" value={String(scopedRecentTrips.length)} hint="Last 24 hours" />
                    <StatCard label="Focused vehicle" value={selectedVehicleLabel || "All vehicles"} hint="Tracking page selection" />
                </section>

                <section className="vehicle-tracking-trip-panel__section">
                    <div className="vehicle-tracking-trip-panel__section-header">
                        <h4>Vehicles currently in transit</h4>
                        <p>Origin, live route context, and estimated destination placeholder.</p>
                    </div>
                    {isLoading ? (
                        <div className="vehicle-tracking-trip-panel__empty">
                            <i className="fa-light fa-spinner fa-spin" />
                            <span>Loading trip snapshot…</span>
                        </div>
                    ) : scopedInProgressTrips.length === 0 ? (
                        <div className="vehicle-tracking-trip-panel__empty">
                            <i className="fa-light fa-route" />
                            <span>No in-progress trips are persisted for the active scope.</span>
                        </div>
                    ) : (
                        <div className="vehicle-tracking-trip-panel__timeline-list">
                            {scopedInProgressTrips.map((tripGroup) => (
                                <TimelineCard key={`in-progress-${tripGroup.vehicleTripGroupId}`} tripGroup={tripGroup} onOpenTripDetail={onOpenTripDetail} />
                            ))}
                        </div>
                    )}
                </section>

                <section className="vehicle-tracking-trip-panel__section">
                    <div className="vehicle-tracking-trip-panel__section-header">
                        <h4>Recent trip timeline</h4>
                        <p>Use the side panel drill-down for badges, legs, and override staging.</p>
                    </div>
                    {isLoading ? (
                        <div className="vehicle-tracking-trip-panel__empty">
                            <i className="fa-light fa-spinner fa-spin" />
                            <span>Loading recent trips…</span>
                        </div>
                    ) : scopedRecentTrips.length === 0 ? (
                        <div className="vehicle-tracking-trip-panel__empty">
                            <i className="fa-light fa-timeline" />
                            <span>No recent trip groups were found in the current filter window.</span>
                        </div>
                    ) : (
                        <div className="vehicle-tracking-trip-panel__timeline-list">
                            {scopedRecentTrips.map((tripGroup) => (
                                <TimelineCard key={`recent-${tripGroup.vehicleTripGroupId}`} tripGroup={tripGroup} onOpenTripDetail={onOpenTripDetail} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </SlidePanel>
    );
};

export default VehicleTrackingTripPanel;

/**
 * Inline version of the trip content for use in the dockable panel system.
 * Same data and layout as the slide panel but without the SlidePanel/portal wrapper.
 */
export const VehicleTrackingTripContent = ({
    inProgressTrips,
    recentTrips,
    isLoading,
    lastUpdated,
    selectedVehicleId,
    selectedVehicleLabel,
    onOpenTripDetail,
    onRefresh,
}) => {
    const scopedRecentTrips = useMemo(() => {
        if (!selectedVehicleId) return recentTrips.slice(0, 12);
        return recentTrips.filter((t) => t.vehicleId === selectedVehicleId).slice(0, 12);
    }, [recentTrips, selectedVehicleId]);

    const scopedInProgressTrips = useMemo(() => {
        if (!selectedVehicleId) return inProgressTrips;
        return inProgressTrips.filter((t) => t.vehicleId === selectedVehicleId);
    }, [inProgressTrips, selectedVehicleId]);

    return (
        <div className="vehicle-tracking-trip-panel tw-h-full tw-overflow-auto">
            <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-[#edebe9] tw-bg-[#faf9f8] tw-px-4 tw-py-2">
                <span className="tw-text-[12px] tw-font-semibold tw-text-[#201f1e]">
                    {selectedVehicleLabel ? `${selectedVehicleLabel} timeline` : 'Fleet trip timeline'}
                </span>
                {onRefresh && (
                    <button type="button" className="vehicle-tracking-trip-panel__header-btn" onClick={onRefresh}>
                        <i className="fa-light fa-arrows-rotate" />
                    </button>
                )}
            </div>

            <section className="vehicle-tracking-trip-panel__stats">
                <StatCard label="In transit" value={String(scopedInProgressTrips.length)} hint="Active" />
                <StatCard label="Recent" value={String(scopedRecentTrips.length)} hint="Last 24h" />
            </section>

            <section className="vehicle-tracking-trip-panel__section">
                <div className="vehicle-tracking-trip-panel__section-header">
                    <h4>In transit</h4>
                </div>
                {isLoading ? (
                    <div className="vehicle-tracking-trip-panel__empty">
                        <i className="fa-light fa-spinner fa-spin" /> <span>Loading…</span>
                    </div>
                ) : scopedInProgressTrips.length === 0 ? (
                    <div className="vehicle-tracking-trip-panel__empty">
                        <i className="fa-light fa-route" /> <span>No in-progress trips.</span>
                    </div>
                ) : (
                    <div className="vehicle-tracking-trip-panel__timeline-list">
                        {scopedInProgressTrips.map((tripGroup) => (
                            <TimelineCard key={`ip-${tripGroup.vehicleTripGroupId}`} tripGroup={tripGroup} onOpenTripDetail={onOpenTripDetail} />
                        ))}
                    </div>
                )}
            </section>

            <section className="vehicle-tracking-trip-panel__section">
                <div className="vehicle-tracking-trip-panel__section-header">
                    <h4>Recent trips</h4>
                </div>
                {isLoading ? (
                    <div className="vehicle-tracking-trip-panel__empty">
                        <i className="fa-light fa-spinner fa-spin" /> <span>Loading…</span>
                    </div>
                ) : scopedRecentTrips.length === 0 ? (
                    <div className="vehicle-tracking-trip-panel__empty">
                        <i className="fa-light fa-timeline" /> <span>No recent trips found.</span>
                    </div>
                ) : (
                    <div className="vehicle-tracking-trip-panel__timeline-list">
                        {scopedRecentTrips.map((tripGroup) => (
                            <TimelineCard key={`rc-${tripGroup.vehicleTripGroupId}`} tripGroup={tripGroup} onOpenTripDetail={onOpenTripDetail} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};
