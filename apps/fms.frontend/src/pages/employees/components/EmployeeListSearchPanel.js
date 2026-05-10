/**
 * File: EmployeeListSearchPanel.js
 * Purpose: Compact M365 filter panel for the employee list page.
 * Dependencies: React, employeePage.scss M365 classes.
 * Last Modified: 2026-04-25
 *
 * Key Components:
 * - EmployeeListSearchPanel(): Renders search, position, site, status filters, and create action.
 */
import React from "react";

const EmployeeListSearchPanel = ({
    searchText,
    positionFilter,
    siteFilter,
    statusFilter,
    positionOptions,
    statusOptions,
    sites,
    canCreate,
    onSearchTextChange,
    onPositionFilterChange,
    onSiteFilterChange,
    onStatusFilterChange,
    onCreateEmployee,
    toFilterKey,
}) => (
    <section className="employee-page__search-panel">
        <div className="employee-page__search-controls">
            <label className="employee-page__search-field employee-page__search-field--wide">
                <span>Search</span>
                <span className="employee-page__search-input-wrap">
                    <i className="fa-light fa-magnifying-glass" />
                    <input
                        type="search"
                        className="m365-input employee-page__search-input"
                        value={searchText}
                        onChange={(event) => onSearchTextChange(event.target.value)}
                        placeholder="Search by name, work no, position, site"
                    />
                </span>
            </label>

            <label className="employee-page__search-field">
                <span>Position</span>
                <select
                    className="m365-select"
                    value={positionFilter}
                    onChange={(event) => onPositionFilterChange(event.target.value)}
                >
                    <option value="all">All positions</option>
                    {positionOptions.map((position) => (
                        <option key={position} value={toFilterKey(position)}>{position}</option>
                    ))}
                </select>
            </label>

            <label className="employee-page__search-field">
                <span>Site</span>
                <select
                    className="m365-select"
                    value={siteFilter}
                    onChange={(event) => onSiteFilterChange(event.target.value)}
                >
                    <option value="all">All sites</option>
                    <option value="unassigned">No site assigned</option>
                    {sites.map((site) => (
                        <option key={site.id} value={String(site.id)}>{site.name}</option>
                    ))}
                </select>
            </label>

            <label className="employee-page__search-field">
                <span>Status</span>
                <select
                    className="m365-select"
                    value={statusFilter}
                    onChange={(event) => onStatusFilterChange(event.target.value)}
                >
                    <option value="all">All statuses</option>
                    {statusOptions.map((status) => (
                        <option key={status} value={toFilterKey(status)}>{status}</option>
                    ))}
                </select>
            </label>
        </div>

        <div className="employee-page__panel-actions">
            {canCreate && (
                <button type="button" className="m365-btn m365-btn--primary" onClick={onCreateEmployee}>
                    <i className="fa-light fa-user-plus" />
                    Add Employee
                </button>
            )}
        </div>
    </section>
);

export default EmployeeListSearchPanel;