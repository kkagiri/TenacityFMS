/**
 * File:          SiteFilterBar.js
 * Purpose:       Search input + Administrator and GPSGate Tag dropdown filters — M365 flat style
 * Dependencies:  m365-shared.scss
 * Last Modified: 2026-02-25
 *
 * Props:
 * - searchText           (string):  Current search text
 * - onSearchChange       (func):    Callback for search text changes
 * - administratorFilter  (string):  Selected administrator ID
 * - onAdministratorChange(func):    Callback for admin filter changes
 * - administrators       (array):   [{ id, name }]
 * - tagFilter            (string):  Selected tag ID
 * - onTagChange          (func):    Callback for tag filter changes
 * - uniqueTags           (array):   [{ id, name, color }]
 */
import React from "react";

const SiteFilterBar = ({
    searchText,
    onSearchChange,
    administratorFilter,
    onAdministratorChange,
    administrators = [],
    tagFilter,
    onTagChange,
    uniqueTags = [],
}) => (
    <div className="m365-site-filters">
        {/* Search */}
        <div className="m365-search" style={{ minWidth: 200, flex: 1, maxWidth: 320 }}>
            <i className="fa-light fa-magnifying-glass m365-search__icon"></i>
            <input
                className="m365-search__input"
                placeholder="Search sites…"
                value={searchText}
                onChange={(e) => onSearchChange(e.target.value)}
            />
        </div>

        {/* Administrator filter */}
        <select
            className="m365-select"
            value={administratorFilter}
            onChange={(e) => onAdministratorChange(e.target.value)}
            style={{ minWidth: 160 }}
        >
            <option value="">All Administrators</option>
            {administrators.map((a) => (
                <option key={a.id} value={a.id}>
                    {a.name}
                </option>
            ))}
        </select>

        {/* GPSGate Tag filter */}
        <select
            className="m365-select"
            value={tagFilter}
            onChange={(e) => onTagChange(e.target.value)}
            style={{ minWidth: 140 }}
        >
            <option value="">All Tags</option>
            {uniqueTags.map((t) => (
                <option key={t.id} value={t.id}>
                    {t.name}
                </option>
            ))}
        </select>
    </div>
);

export default SiteFilterBar;
