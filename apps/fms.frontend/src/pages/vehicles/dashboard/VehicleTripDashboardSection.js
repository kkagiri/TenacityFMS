/**
 * File: VehicleTripDashboardSection.js
 * Purpose: Shows trip-focused dashboard KPIs, in-transit vehicles, and anomaly review shortcuts in the vehicle dashboard.
 * Dependencies: React, dashboardApi, vehicle trip service, React Router.
 * Last Modified: 2026-03-12
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from 'devextreme-react/button';
import LoadIndicator from 'devextreme-react/load-indicator';
import { dashboardApi } from '../../../api/dashboardFactory';
import { fetchVehicleTripList } from '../trips/services/vehicleTripService';
import { getAnomalyItems } from '../trips/utils/vehicleTripUi';
import { vehicleRoutes } from '../utils/navigationHelper';

const readNumber = (payload, fallback = 0) => {
    const value = payload?.current?.value
        ?? payload?.currentValue
        ?? payload?.value
        ?? payload?.summary?.value
        ?? payload?.count
        ?? fallback;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const readRows = (payload) => {
    const rows = payload?.rows ?? payload?.data ?? payload?.items ?? payload?.series ?? [];
    return Array.isArray(rows) ? rows : [];
};

const MetricCard = ({ label, value, hint, icon, tone }) => (
    <div className={`tw-rounded-xl tw-border tw-p-4 ${tone === 'danger' ? 'tw-border-rose-200 tw-bg-rose-50' : tone === 'warning' ? 'tw-border-amber-200 tw-bg-amber-50' : tone === 'success' ? 'tw-border-emerald-200 tw-bg-emerald-50' : 'tw-border-slate-200 tw-bg-slate-50'}`}>
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
            <div>
                <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-500">{label}</div>
                <div className="tw-mt-1 tw-text-2xl tw-font-bold tw-text-slate-900">{value}</div>
                {hint ? <div className="tw-mt-1 tw-text-sm tw-text-slate-600">{hint}</div> : null}
            </div>
            <i className={`${icon} tw-text-lg tw-text-slate-500`} />
        </div>
    </div>
);

const VehicleTripDashboardSection = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [tripVsExpected, setTripVsExpected] = useState(null);
    const [inTransit, setInTransit] = useState(null);
    const [tipperCycles, setTipperCycles] = useState(null);
    const [anomalyGroups, setAnomalyGroups] = useState([]);

    const loadTripDashboard = useCallback(async () => {
        setIsLoading(true);

        try {
            const now = new Date();
            const last24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString();

            const [tripVsExpectedResult, inTransitResult, tipperCyclesResult, tripGroups] = await Promise.all([
                dashboardApi.getWidgetData('trip_count_vs_expected'),
                dashboardApi.getWidgetData('trip_in_transit'),
                dashboardApi.getWidgetData('tipper_cycle_count'),
                fetchVehicleTripList({ fromUtc: last24Hours, toUtc: now.toISOString() }),
            ]);

            setTripVsExpected(tripVsExpectedResult);
            setInTransit(inTransitResult);
            setTipperCycles(tipperCyclesResult);
            setAnomalyGroups(tripGroups.filter((group) => Number(group.reconciliationStatus) === 5 || getAnomalyItems(group.anomalyFlags).length > 0));
        } catch (error) {
            console.error('Error loading trip dashboard section:', error);
            setTripVsExpected(null);
            setInTransit(null);
            setTipperCycles(null);
            setAnomalyGroups([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTripDashboard();
    }, [loadTripDashboard]);

    const inTransitRows = useMemo(() => readRows(inTransit).slice(0, 6), [inTransit]);
    const tripExpectedHint = useMemo(() => {
        const expected = tripVsExpected?.additionalInfo?.expectedTrips
            ?? tripVsExpected?.ExpectedTrips
            ?? tripVsExpected?.expectedTrips
            ?? null;
        return expected != null ? `Expected ${expected}` : 'Today vs planned volume';
    }, [tripVsExpected]);

    return (
        <div className="tw-bg-white tw-rounded-2xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-6 tw-mb-6 tw-space-y-5">
            <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-start lg:tw-justify-between tw-gap-4">
                <div>
                    <h3 className="tw-text-xl tw-font-semibold tw-text-gray-900">Trip operations</h3>
                    <p className="tw-text-sm tw-text-gray-600">Trip execution health, active movement, and anomaly review for the current day.</p>
                </div>
                <div className="tw-flex tw-flex-wrap tw-gap-2">
                    <Button text="Open trips" icon="fa-light fa-route" stylingMode="outlined" onClick={() => navigate(vehicleRoutes.trips)} />
                    <Button text="Review anomalies" icon="fa-light fa-triangle-exclamation" stylingMode="outlined" onClick={() => navigate(`${vehicleRoutes.trips}?anomalies=1`)} />
                    <Button text="Refresh trips" icon="refresh" stylingMode="text" onClick={loadTripDashboard} />
                </div>
            </div>

            {isLoading ? (
                <div className="tw-flex tw-items-center tw-gap-3 tw-rounded-xl tw-border tw-border-dashed tw-border-slate-200 tw-bg-slate-50 tw-p-6">
                    <LoadIndicator width="24px" height="24px" visible={true} />
                    <span className="tw-text-sm tw-text-slate-600">Loading trip dashboard metrics...</span>
                </div>
            ) : (
                <>
                    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 xl:tw-grid-cols-4 tw-gap-4">
                        <MetricCard label="Trips vs expected" value={String(readNumber(tripVsExpected, 0))} hint={tripExpectedHint} icon="fa-light fa-scale-balanced" tone="slate" />
                        <MetricCard label="Vehicles in transit" value={String(readNumber(inTransit, inTransitRows.length))} hint="Persisted in-progress trip groups" icon="fa-light fa-truck-fast" tone="success" />
                        <MetricCard label="Tipper cycles" value={String(readNumber(tipperCycles, 0))} hint="Cycle counter widget" icon="fa-light fa-arrows-repeat" tone="warning" />
                        <MetricCard label="Anomalies" value={String(anomalyGroups.length)} hint="Last 24 hours" icon="fa-light fa-triangle-exclamation" tone="danger" />
                    </div>

                    <div className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-[1.4fr_1fr] tw-gap-4">
                        <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4">
                            <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-mb-3">
                                <div>
                                    <h4 className="tw-text-base tw-font-semibold tw-text-slate-900">Vehicles currently in transit</h4>
                                    <p className="tw-text-sm tw-text-slate-600">Live trip groups reported by the trip dashboard data source.</p>
                                </div>
                                <Button text="Open tracking" icon="fa-light fa-location-dot" stylingMode="text" onClick={() => navigate(vehicleRoutes.tracking)} />
                            </div>
                            {inTransitRows.length === 0 ? (
                                <div className="tw-rounded-lg tw-border tw-border-dashed tw-border-slate-200 tw-bg-white tw-p-4 tw-text-sm tw-text-slate-500">
                                    No vehicles are currently reported as in transit.
                                </div>
                            ) : (
                                <div className="tw-space-y-2">
                                    {inTransitRows.map((row, index) => {
                                        const vehicleLabel = row.vehicleLabel ?? row.vehicleName ?? row.label ?? row.name ?? `Vehicle ${index + 1}`;
                                        const origin = row.originDisplayName ?? row.originName ?? row.origin ?? 'Unknown origin';
                                        const destination = row.destinationDisplayName ?? row.destinationName ?? row.destination ?? 'Destination pending';

                                        return (
                                            <div key={`${vehicleLabel}-${index}`} className="tw-flex tw-items-center tw-justify-between tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-p-3">
                                                <div>
                                                    <div className="tw-text-sm tw-font-semibold tw-text-slate-900">{vehicleLabel}</div>
                                                    <div className="tw-text-sm tw-text-slate-600">{origin} to {destination}</div>
                                                </div>
                                                <i className="fa-light fa-route tw-text-slate-400" />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="tw-rounded-xl tw-border tw-border-rose-200 tw-bg-rose-50 tw-p-4">
                            <div className="tw-mb-3">
                                <h4 className="tw-text-base tw-font-semibold tw-text-rose-950">Anomaly review queue</h4>
                                <p className="tw-text-sm tw-text-rose-700">Trip groups with anomaly flags or anomaly reconciliation in the last 24 hours.</p>
                            </div>
                            {anomalyGroups.length === 0 ? (
                                <div className="tw-rounded-lg tw-border tw-border-dashed tw-border-rose-200 tw-bg-white tw-p-4 tw-text-sm tw-text-rose-700">
                                    No anomalies are queued right now.
                                </div>
                            ) : (
                                <div className="tw-space-y-2">
                                    {anomalyGroups.slice(0, 5).map((group) => (
                                        <div key={group.vehicleTripGroupId} className="tw-rounded-lg tw-border tw-border-rose-100 tw-bg-white tw-p-3">
                                            <div className="tw-text-sm tw-font-semibold tw-text-rose-950">{group.vehicleLabel}</div>
                                            <div className="tw-text-sm tw-text-rose-700">{group.originDisplayName} to {group.destinationDisplayName}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default VehicleTripDashboardSection;