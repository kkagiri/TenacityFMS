/**
 * File: DashboardFilterSection.js
 * Purpose: Fluent-style filter card + quick-filter pills for Issue Dashboard
 * Dependencies: DevExtreme SelectBox, DateBox
 * Last Modified: 2026-02-23
 *
 * Key Components:
 * - DashboardFilterSection: filter card with 6 fields + quick action pills
 */
import React from 'react';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';

const WEEKS_OPTIONS = [
    { value: null, text: 'All Time' },
    { value: 1, text: 'Last Week' },
    { value: 2, text: 'Last 2 Weeks' },
    { value: 4, text: 'Last 4 Weeks' },
    { value: 8, text: 'Last 8 Weeks' },
    { value: 12, text: 'Last 12 Weeks' },
];

const DashboardFilterSection = ({
    filters,
    vehicles,
    sites,
    categories,
    onFilterChange,
    onClearFilters,
}) => {
    return (
        <>
            {/* ── Filters Card ── */}
            <div className="fms-card fms-card--filter tw-mb-3">
                <div className="fms-card__hd">
                    <span className="fms-card__title">
                        <i className="fa-light fa-filter"></i>
                        Filters
                    </span>
                </div>
                <div className="fms-filter-grid">
                    <div className="fms-fg">
                        <label>Vehicle</label>
                        <SelectBox
                            dataSource={vehicles}
                            displayExpr="vehicleCode"
                            valueExpr="vehicleId"
                            value={filters.vehicleId}
                            onValueChanged={(e) => onFilterChange('vehicleId', e.value)}
                            showClearButton
                            placeholder="All Vehicles"
                            searchEnabled
                        />
                    </div>
                    <div className="fms-fg">
                        <label>Site</label>
                        <SelectBox
                            dataSource={sites}
                            displayExpr="name"
                            valueExpr="siteId"
                            value={filters.siteId}
                            onValueChanged={(e) => onFilterChange('siteId', e.value)}
                            showClearButton
                            placeholder="All Sites"
                            searchEnabled
                        />
                    </div>
                    <div className="fms-fg">
                        <label>Category</label>
                        <SelectBox
                            dataSource={categories}
                            displayExpr="name"
                            valueExpr="issueCategoryId"
                            value={filters.categoryId}
                            onValueChanged={(e) => onFilterChange('categoryId', e.value)}
                            showClearButton
                            placeholder="All Categories"
                            searchEnabled
                        />
                    </div>
                    <div className="fms-fg">
                        <label>Period</label>
                        <SelectBox
                            dataSource={WEEKS_OPTIONS}
                            displayExpr="text"
                            valueExpr="value"
                            value={filters.weeksBack}
                            onValueChanged={(e) => onFilterChange('weeksBack', e.value)}
                        />
                    </div>
                    <div className="fms-fg">
                        <label>Start Date</label>
                        <DateBox
                            value={filters.startDate}
                            onValueChanged={(e) => onFilterChange('startDate', e.value)}
                            showClearButton
                            placeholder="From..."
                        />
                    </div>
                    <div className="fms-fg">
                        <label>End Date</label>
                        <DateBox
                            value={filters.endDate}
                            onValueChanged={(e) => onFilterChange('endDate', e.value)}
                            showClearButton
                            placeholder="To..."
                        />
                    </div>
                </div>
                <div className="fms-filter-footer">
                    <button className="fms-clear-btn" onClick={onClearFilters}>
                        Clear All Filters ×
                    </button>
                </div>
            </div>
        </>
    );
};

export default DashboardFilterSection;
