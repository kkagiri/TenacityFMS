/**
 * File:          SiteQuickStats.js
 * Purpose:       2×2 stat cards (Tanks, Vehicles, Staff, PTS) pulled from Redux siteStats
 * Dependencies:  react-redux, SitePage.scss
 * Last Modified: 2026-02-25
 *
 * Props: (none — reads siteStats / loadingStats from Redux)
 */
import React from "react";
import { useSelector } from "react-redux";

const CARDS = [
    {
        key: "tanks",
        label: "Tanks",
        icon: "fa-light fa-gas-pump",
        field: "tankCount",
        modifier: "tanks",
    },
    {
        key: "vehicles",
        label: "Vehicles",
        icon: "fa-light fa-truck",
        field: "vehicleCount",
        modifier: "vehicles",
    },
    {
        key: "staff",
        label: "Staff",
        icon: "fa-light fa-users",
        field: "employeeCount",
        modifier: "staff",
    },
    {
        key: "pts",
        label: "PTS Devices",
        icon: "fa-light fa-microchip",
        field: "ptsDeviceCount",
        modifier: "pts",
    },
];

const SiteQuickStats = () => {
    const { siteStats, loadingStats } = useSelector((state) => state.site);

    return (
        <div className="m365-info-grid">
            {CARDS.map((c) => (
                <div key={c.key} className="m365-info-cell">
                    <span className="m365-info-cell__label">{c.label}</span>
                    <span className="m365-info-cell__value">
                        {loadingStats ? "…" : siteStats?.[c.field] ?? "—"}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default SiteQuickStats;
