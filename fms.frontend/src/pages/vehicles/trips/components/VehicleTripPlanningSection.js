/**
 * File: VehicleTripPlanningSection.js
 * Purpose: Extracted planning section for trip detail panel — handles cascade SelectBox
 *          pattern (Project → Work day → Work zone → Haul route) and plan match display.
 * Dependencies: React, DevExtreme SelectBox, vehicleTripService, vehicleTripUi.
 * Last Modified: 2026-03-13
 *
 * Key Components:
 * - PlanningEntityRow: Single planning entity with linked/unlinked state and SelectBox control
 * - PlanMatchSummary: Plan match score, out-of-bounds, and productive status display
 * - GeoZoneHits: Origin/destination zone pills with corridor coverage
 * - VehicleTripPlanningSection: Full planning section with placeholder and linked modes
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { SelectBox } from "devextreme-react/select-box";
import notify from "devextreme/ui/notify";
import {
    PLANNING_ENTITY_PLACEHOLDERS,
    PLANNING_GEO_ZONE_TYPES,
    PLANNING_RULE_PLACEHOLDERS,
    PLAN_MATCH_STATUS_MAP,
    getPlanMatchConfig,
} from "../utils/vehicleTripUi";
import {
    fetchProjectLookup,
    fetchProjectWorkDays,
    fetchProjectZones,
    fetchProjectHaulRoutes,
    updateTripPlanningLink,
} from "../services/vehicleTripService";
import "./VehicleTripPlanningSection.scss";

const LinkedBadge = ({ linked, label }) => (
    <span className={`planning-section__linked-badge ${linked ? "planning-section__linked-badge--linked" : "planning-section__linked-badge--unlinked"}`}>
        <i className={linked ? "fa-light fa-check" : "fa-light fa-minus"} />
        {label || (linked ? "Linked" : "Not linked")}
    </span>
);

const PlanMatchSummary = ({ planMatchStatus, planMatchScore, isOutOfBounds, outOfBoundsDuration, outOfBoundsDistance, isProductive }) => {
    const matchConfig = getPlanMatchConfig(planMatchStatus);

    return (
        <div className="planning-section__match-summary">
            <div className="planning-section__match-row">
                <span className="planning-section__field-label">Plan match</span>
                <span className={`planning-section__match-badge planning-section__match-badge--${matchConfig.tone}`}>
                    {matchConfig.label}
                </span>
                {planMatchScore != null && (
                    <span className="planning-section__match-score">score: {Number(planMatchScore).toFixed(2)}</span>
                )}
            </div>
            <div className="planning-section__match-row">
                <span className="planning-section__field-label">Out-of-bounds</span>
                {isOutOfBounds ? (
                    <span className="planning-section__oob-flag">
                        <i className="fa-light fa-triangle-exclamation" />
                        {outOfBoundsDuration ? `${outOfBoundsDuration} min` : ""}{outOfBoundsDuration && outOfBoundsDistance ? " · " : ""}{outOfBoundsDistance ? `${Number(outOfBoundsDistance).toFixed(2)} km` : ""}
                        {!outOfBoundsDuration && !outOfBoundsDistance ? "Flagged" : ""}
                    </span>
                ) : (
                    <span className="planning-section__oob-clear">None</span>
                )}
            </div>
            <div className="planning-section__match-row">
                <span className="planning-section__field-label">Productive</span>
                <span className={isProductive !== false ? "planning-section__productive--yes" : "planning-section__productive--no"}>
                    {isProductive !== false ? "Yes" : "No"}
                    {isProductive !== false && <i className="fa-light fa-check" />}
                </span>
            </div>
        </div>
    );
};

const GeoZoneHits = ({ originZone, destinationZone, corridorZone, corridorCoverage }) => {
    if (!originZone && !destinationZone && !corridorZone) {
        return null;
    }

    const zoneTypeConfig = (typeKey) => PLANNING_GEO_ZONE_TYPES.find((z) => z.key === typeKey) || {};

    return (
        <div className="planning-section__zone-hits">
            <span className="planning-section__field-label">Geo-zones hit</span>
            <div className="planning-section__zone-row">
                {originZone && (
                    <span className="planning-section__zone-pill" style={{ borderColor: zoneTypeConfig(originZone.type)?.color }}>
                        <i className={zoneTypeConfig(originZone.type)?.icon} />
                        {originZone.name}
                    </span>
                )}
                {originZone && destinationZone && <span className="planning-section__zone-arrow">→</span>}
                {destinationZone && (
                    <span className="planning-section__zone-pill" style={{ borderColor: zoneTypeConfig(destinationZone.type)?.color }}>
                        <i className={zoneTypeConfig(destinationZone.type)?.icon} />
                        {destinationZone.name}
                    </span>
                )}
            </div>
            {corridorZone && (
                <div className="planning-section__zone-row">
                    <span className="planning-section__zone-pill" style={{ borderColor: zoneTypeConfig("Corridor")?.color }}>
                        <i className={zoneTypeConfig("Corridor")?.icon} />
                        {corridorZone.name}
                        {corridorCoverage != null && ` (${Math.round(corridorCoverage * 100)}% within)`}
                    </span>
                </div>
            )}
        </div>
    );
};

const VehicleTripPlanningSection = ({
    tripDetail,
    canManageTrips = false,
    onPlanningLinkUpdated,
}) => {
    const [projectOptions, setProjectOptions] = useState([]);
    const [workDayOptions, setWorkDayOptions] = useState([]);
    const [workZoneOptions, setWorkZoneOptions] = useState([]);
    const [haulRouteOptions, setHaulRouteOptions] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [selectedWorkDayId, setSelectedWorkDayId] = useState(null);
    const [selectedWorkZoneId, setSelectedWorkZoneId] = useState(null);
    const [selectedHaulRouteId, setSelectedHaulRouteId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [projectsLoaded, setProjectsLoaded] = useState(false);

    const hasPlanning = Boolean(tripDetail?.projectId);
    const hasPlanMatch = tripDetail?.planMatchStatus != null;

    useEffect(() => {
        setSelectedProjectId(tripDetail?.projectId || null);
        setSelectedWorkDayId(tripDetail?.workDayId || null);
        setSelectedWorkZoneId(tripDetail?.workZoneId || null);
        setSelectedHaulRouteId(tripDetail?.haulRouteId || null);
    }, [tripDetail?.projectId, tripDetail?.workDayId, tripDetail?.workZoneId, tripDetail?.haulRouteId]);

    const loadProjects = useCallback(async () => {
        const siteId = tripDetail?.originSiteId;
        if (!siteId) {
            return;
        }

        try {
            const projects = await fetchProjectLookup(siteId);
            setProjectOptions(projects);
            setProjectsLoaded(true);
        } catch {
            setProjectOptions([]);
            setProjectsLoaded(true);
        }
    }, [tripDetail?.originSiteId]);

    useEffect(() => {
        if (canManageTrips && !projectsLoaded) {
            loadProjects();
        }
    }, [canManageTrips, loadProjects, projectsLoaded]);

    useEffect(() => {
        if (!selectedProjectId) {
            setWorkDayOptions([]);
            setWorkZoneOptions([]);
            setHaulRouteOptions([]);
            return;
        }

        const loadDependents = async () => {
            try {
                const [workDays, zones, routes] = await Promise.all([
                    fetchProjectWorkDays(selectedProjectId, tripDetail?.tripDate),
                    fetchProjectZones(selectedProjectId),
                    fetchProjectHaulRoutes(selectedProjectId),
                ]);
                setWorkDayOptions(workDays);
                setWorkZoneOptions(zones);
                setHaulRouteOptions(routes);

                if (workDays.length === 1) {
                    setSelectedWorkDayId(workDays[0].workDayId);
                }
            } catch {
                setWorkDayOptions([]);
                setWorkZoneOptions([]);
                setHaulRouteOptions([]);
            }
        };

        loadDependents();
    }, [selectedProjectId, tripDetail?.tripDate]);

    const handleProjectChange = useCallback((event) => {
        const newProjectId = event.value;
        setSelectedProjectId(newProjectId);
        setSelectedWorkDayId(null);
        setSelectedWorkZoneId(null);
        setSelectedHaulRouteId(null);
    }, []);

    const handleSavePlanningLink = useCallback(async () => {
        if (!tripDetail?.vehicleTripGroupId) {
            return;
        }

        try {
            setIsSaving(true);
            await updateTripPlanningLink(tripDetail.vehicleTripGroupId, {
                projectId: selectedProjectId,
                workDayId: selectedWorkDayId,
                workZoneId: selectedWorkZoneId,
                haulRouteId: selectedHaulRouteId,
            });
            notify("Planning link updated", "success", 3000);
            if (typeof onPlanningLinkUpdated === "function") {
                onPlanningLinkUpdated();
            }
        } catch (error) {
            notify(error?.message || "Failed to save planning link", "error", 4000);
        } finally {
            setIsSaving(false);
        }
    }, [tripDetail?.vehicleTripGroupId, selectedProjectId, selectedWorkDayId, selectedWorkZoneId, selectedHaulRouteId, onPlanningLinkUpdated]);

    const hasUnsavedChanges = useMemo(() => {
        return (
            selectedProjectId !== (tripDetail?.projectId || null) ||
            selectedWorkDayId !== (tripDetail?.workDayId || null) ||
            selectedWorkZoneId !== (tripDetail?.workZoneId || null) ||
            selectedHaulRouteId !== (tripDetail?.haulRouteId || null)
        );
    }, [selectedProjectId, selectedWorkDayId, selectedWorkZoneId, selectedHaulRouteId, tripDetail]);

    const vehicleAssignmentLabel = useMemo(() => {
        if (!tripDetail?.vehicleAssignmentLabel) {
            return hasPlanning ? "Not assigned" : "Reserved";
        }
        return tripDetail.vehicleAssignmentLabel;
    }, [tripDetail?.vehicleAssignmentLabel, hasPlanning]);

    const vehicleAssignmentActive = Boolean(tripDetail?.vehicleAssignmentActive);

    if (hasPlanning || hasPlanMatch) {
        return (
            <div className="planning-section">
                <div className="planning-section__header">
                    <h4>Planning & bounds</h4>
                    <p>Project-level classification and zone governance for this trip group.</p>
                </div>

                <div className="planning-section__entity-grid">
                    <div className="planning-section__entity-row">
                        <span className="planning-section__field-label">Project</span>
                        {canManageTrips ? (
                            <SelectBox
                                dataSource={projectOptions}
                                valueExpr="projectId"
                                displayExpr="label"
                                value={selectedProjectId}
                                onValueChanged={handleProjectChange}
                                placeholder="Select project..."
                                showClearButton={true}
                                searchEnabled={true}
                                width="100%"
                                disabled={isSaving}
                            />
                        ) : (
                            <span className="planning-section__field-value">{tripDetail?.projectLabel || "Not linked"}</span>
                        )}
                        <LinkedBadge linked={Boolean(selectedProjectId)} />
                    </div>
                    <div className="planning-section__entity-row">
                        <span className="planning-section__field-label">Work day</span>
                        {canManageTrips ? (
                            <SelectBox
                                dataSource={workDayOptions}
                                valueExpr="workDayId"
                                displayExpr="label"
                                value={selectedWorkDayId}
                                onValueChanged={(e) => setSelectedWorkDayId(e.value)}
                                placeholder={selectedProjectId ? "Select work day..." : "Select project first"}
                                showClearButton={true}
                                width="100%"
                                disabled={isSaving || !selectedProjectId}
                            />
                        ) : (
                            <span className="planning-section__field-value">{tripDetail?.workDayLabel || "Not linked"}</span>
                        )}
                        <LinkedBadge linked={Boolean(selectedWorkDayId)} />
                    </div>
                    <div className="planning-section__entity-row">
                        <span className="planning-section__field-label">Work zone</span>
                        {canManageTrips ? (
                            <SelectBox
                                dataSource={workZoneOptions}
                                valueExpr="zoneId"
                                displayExpr="label"
                                value={selectedWorkZoneId}
                                onValueChanged={(e) => setSelectedWorkZoneId(e.value)}
                                placeholder={selectedProjectId ? "Select work zone..." : "Select project first"}
                                showClearButton={true}
                                width="100%"
                                disabled={isSaving || !selectedProjectId}
                            />
                        ) : (
                            <span className="planning-section__field-value">{tripDetail?.workZoneLabel || "Not linked"}</span>
                        )}
                        <LinkedBadge linked={Boolean(selectedWorkZoneId)} />
                    </div>
                    <div className="planning-section__entity-row">
                        <span className="planning-section__field-label">Haul route</span>
                        {canManageTrips ? (
                            <SelectBox
                                dataSource={haulRouteOptions}
                                valueExpr="haulRouteId"
                                displayExpr="label"
                                value={selectedHaulRouteId}
                                onValueChanged={(e) => setSelectedHaulRouteId(e.value)}
                                placeholder={selectedProjectId ? "Select haul route..." : "Select project first"}
                                showClearButton={true}
                                width="100%"
                                disabled={isSaving || !selectedProjectId}
                            />
                        ) : (
                            <span className="planning-section__field-value">{tripDetail?.haulRouteLabel || "Not linked"}</span>
                        )}
                        <LinkedBadge linked={Boolean(selectedHaulRouteId)} />
                    </div>
                    <div className="planning-section__entity-row">
                        <span className="planning-section__field-label">Vehicle assigned</span>
                        <span className="planning-section__field-value">{vehicleAssignmentLabel}</span>
                        <LinkedBadge
                            linked={vehicleAssignmentActive}
                            label={vehicleAssignmentActive ? "Active" : hasPlanning ? "Not assigned" : "Reserved"}
                        />
                    </div>
                </div>

                {canManageTrips && hasUnsavedChanges && (
                    <div className="planning-section__save-bar">
                        <button
                            type="button"
                            className="planning-section__save-btn"
                            onClick={handleSavePlanningLink}
                            disabled={isSaving}
                        >
                            <i className="fa-light fa-floppy-disk" />
                            {isSaving ? "Saving..." : "Save planning link"}
                        </button>
                    </div>
                )}

                <PlanMatchSummary
                    planMatchStatus={tripDetail?.planMatchStatus}
                    planMatchScore={tripDetail?.planMatchScore}
                    isOutOfBounds={tripDetail?.isOutOfBounds}
                    outOfBoundsDuration={tripDetail?.outOfBoundsDurationMinutes}
                    outOfBoundsDistance={tripDetail?.outOfBoundsDistanceKm}
                    isProductive={tripDetail?.isProductive}
                />

                <GeoZoneHits
                    originZone={tripDetail?.originGeoZone}
                    destinationZone={tripDetail?.destinationGeoZone}
                    corridorZone={tripDetail?.corridorGeoZone}
                    corridorCoverage={tripDetail?.corridorCoverage}
                />
            </div>
        );
    }

    return (
        <div className="planning-section planning-section--placeholder">
            <div className="planning-section__header">
                <h4>Planning & bounds readiness</h4>
                <p>Project links, work zones, and out-of-bounds governance.</p>
            </div>
            <div className="planning-section__notice">
                <i className="fa-light fa-circle-info" />
                <span>
                    Current trip classification resolves through linked <strong>Site</strong> records and their assigned geofences.
                    Project-location level classification requires the <strong>planning module</strong> and is not persisted separately yet.
                </span>
            </div>
            <div className="planning-section__placeholder-grid">
                {PLANNING_ENTITY_PLACEHOLDERS.map((item) => (
                    <div key={item.label} className="planning-section__placeholder-card">
                        <div className="planning-section__field-label">{item.label}</div>
                        <div className="planning-section__field-value">{item.value}</div>
                        <div className="planning-section__field-hint">
                            {item.cascade
                                ? `${item.control}, cascaded from ${item.cascade}`
                                : item.control}
                        </div>
                    </div>
                ))}
            </div>
            <div className="planning-section__placeholder-meta">
                <div>
                    <div className="planning-section__field-label">Geo-zone types</div>
                    <div className="planning-section__token-row">
                        {PLANNING_GEO_ZONE_TYPES.map((zone) => (
                            <span key={zone.key} className="planning-section__token" style={{ borderColor: zone.color, color: zone.color }}>
                                <i className={zone.icon} /> {zone.label}
                            </span>
                        ))}
                    </div>
                    <div className="planning-section__field-hint">
                        Manage zone polygons in Planning zones & boundaries tab
                    </div>
                </div>
                <div>
                    <div className="planning-section__field-label">Rules reserved</div>
                    <ul className="planning-section__rule-list">
                        {PLANNING_RULE_PLACEHOLDERS.map((rule) => (
                            <li key={rule.key}>
                                {rule.label}
                                <span className="planning-section__rule-hint"> → {rule.location}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default VehicleTripPlanningSection;
