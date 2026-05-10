/**
 * File: VehicleTrackingTabbedPanel.js
 * Purpose: Renders a generic tabbed workspace panel shell for tracking sidebar content.
 * Dependencies: React
 * Last Modified: 2026-03-17
 *
 * Key Components:
 * - VehicleTrackingTabbedPanel(): Shared tab shell for sidebar content such as Vehicles and Geofence.
 */
import React from 'react';

const VehicleTrackingTabbedPanel = ({ activeTabKey, onTabChange, tabs = [] }) => {
    const activeTab = tabs.find((tab) => tab.key === activeTabKey) || tabs[0] || null;

    return (
        <div className="tw-flex tw-h-full tw-min-h-0 tw-flex-col tw-bg-white">
            <div className="tw-flex tw-shrink-0 tw-gap-1 tw-border-b tw-border-[#eceeed] tw-bg-[#faf9f8] tw-p-2">
                {tabs.map((tab) => {
                    const isActive = tab.key === activeTab?.key;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            className={`tw-inline-flex tw-items-center tw-gap-2 tw-rounded-md tw-border tw-px-3 tw-py-1.5 tw-text-[12px] tw-font-medium ${isActive ? 'tw-border-[#0078d4] tw-bg-[#e8f3fc] tw-text-[#005a9e]' : 'tw-border-transparent tw-bg-white tw-text-[#5a6360]'}`}
                            onClick={() => onTabChange?.(tab.key)}
                        >
                            {tab.icon ? <i className={tab.icon}></i> : null}
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>
            <div className="tw-min-h-0 tw-flex-1">
                {activeTab?.content || null}
            </div>
        </div>
    );
};

export default VehicleTrackingTabbedPanel;