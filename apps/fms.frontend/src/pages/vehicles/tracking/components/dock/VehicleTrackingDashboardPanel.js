/**
 * File: VehicleTrackingDashboardPanel.js
 * Purpose: Renders a live summary dashboard inside the docked panel system
 * Dependencies: React
 * Last Modified: 2026-03-17
 *
 * Key Components:
 * - VehicleTrackingDashboardPanel(): Displays fleet statistics and trip metrics in a compact dashboard view
 */
import React from 'react';

const StatCard = ({ color, label, value }) => (
    <div className="tw-flex tw-flex-col tw-items-center tw-rounded-lg tw-border tw-border-[#edebe9] tw-bg-white tw-p-3">
        <span className="tw-text-[22px] tw-font-bold" style={{ color }}>{value}</span>
        <span className="tw-mt-1 tw-text-[11px] tw-font-medium tw-text-[#605e5c]">{label}</span>
    </div>
);

const VehicleTrackingDashboardPanel = ({
    inProgressTripCount = 0,
    lowConfidenceCount = 0,
    stats = {},
}) => (
    <div className="tw-flex tw-h-full tw-flex-col tw-overflow-auto tw-bg-[#faf9f8] tw-p-4">
        <div className="tw-mb-4 tw-text-[13px] tw-font-semibold tw-text-[#201f1e]">Fleet Overview</div>
        <div className="tw-grid tw-grid-cols-2 tw-gap-3 lg:tw-grid-cols-3">
            <StatCard label="Total Vehicles" value={stats.total ?? 0} color="#0078d4" />
            <StatCard label="Moving" value={stats.moving ?? 0} color="#107c10" />
            <StatCard label="Online" value={stats.online ?? 0} color="#16a34a" />
            <StatCard label="Offline" value={stats.offline ?? 0} color="#d13438" />
            <StatCard label="In Transit" value={inProgressTripCount} color="#ca5010" />
            <StatCard label="Low Confidence" value={lowConfidenceCount} color="#6b21a8" />
        </div>
    </div>
);

export default React.memo(VehicleTrackingDashboardPanel);
