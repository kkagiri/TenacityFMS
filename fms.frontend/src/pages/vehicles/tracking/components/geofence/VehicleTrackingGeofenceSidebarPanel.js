/**
 * File: VehicleTrackingGeofenceSidebarPanel.js
 * Purpose: Provides an embedded geofence groups browser for the tracking sidebar tab.
 * Dependencies: React, VehicleTrackingGeofenceGroupsPanel.scss
 * Last Modified: 2026-03-26
 *
 * Key Components:
 * - VehicleTrackingGeofenceSidebarPanel(): Embedded geofence group list with quick actions.
 */
import React from 'react';
import './VehicleTrackingGeofenceGroupsPanel.scss';

const VehicleTrackingGeofenceSidebarPanel = ({
    canManageGeofences = false,
    groups = [],
    loading = false,
    onAddGeofence,
    onAddGroup,
    onOpenGroup,
    onOpenWindow,
}) => {
    return (
        <div className="vehicle-tracking-geofence-sidebar">
            <div className="vehicle-tracking-geofence-sidebar__header">
                <div>
                    <div className="vehicle-tracking-geofence-sidebar__title">Geofence groups</div>
                    <div className="vehicle-tracking-geofence-sidebar__subtitle">Browse groups without leaving tracking</div>
                </div>
                <button
                    type="button"
                    className="vehicle-tracking-geofence-toolbar-button"
                    onClick={onOpenWindow}
                >
                    <i className="fa-light fa-up-right-from-square"></i>
                    <span>Window</span>
                </button>
            </div>

            <div className="vehicle-tracking-geofence-sidebar__actions">
                <button
                    type="button"
                    className="vehicle-tracking-geofence-toolbar-button"
                    onClick={onAddGroup}
                    disabled={!canManageGeofences}
                    title={canManageGeofences ? 'Create a geofence group' : 'Requires geofence manage permission'}
                >
                    <i className="fa-light fa-folder-plus"></i>
                    <span>Add group</span>
                </button>
                <button
                    type="button"
                    className="vehicle-tracking-geofence-toolbar-button vehicle-tracking-geofence-toolbar-button--primary"
                    onClick={onAddGeofence}
                    disabled={!canManageGeofences}
                    title={canManageGeofences ? 'Create a geofence' : 'Requires geofence manage permission'}
                >
                    <i className="fa-light fa-plus"></i>
                    <span>Add geofence</span>
                </button>
            </div>

            <div className="vehicle-tracking-geofence-sidebar__body">
                {loading ? (
                    <div className="geofence-floating-panel__loading">
                        <i className="fa-light fa-spinner-third fa-spin"></i>
                        Loading geofences...
                    </div>
                ) : groups.length === 0 ? (
                    <div className="vehicle-tracking-geofence-sidebar__empty">
                        <i className="fa-light fa-map-location-dot"></i>
                        <div className="vehicle-tracking-geofence-sidebar__empty-title">No geofence groups loaded</div>
                        <div className="vehicle-tracking-geofence-sidebar__empty-subtitle">Create a group or open the full geofence window.</div>
                    </div>
                ) : (
                    <div>
                        {groups.map((group) => {
                            const count = Array.isArray(group.geofences) ? group.geofences.length : (group.geofenceCount || 0);
                            return (
                                <button
                                    key={group.id}
                                    type="button"
                                    className="vehicle-tracking-geofence-sidebar__card"
                                    onClick={() => onOpenGroup?.(group)}
                                >
                                    <div className="vehicle-tracking-geofence-sidebar__card-main">
                                        <span
                                            className="tw-h-3 tw-w-3 tw-flex-shrink-0 tw-rounded-full tw-border tw-border-gray-300"
                                            style={{ backgroundColor: group.colour || '#9aa09d' }}
                                        />
                                        <div className="tw-min-w-0">
                                            <div className="vehicle-tracking-geofence-sidebar__card-title tw-truncate">{group.name}</div>
                                            <div className="vehicle-tracking-geofence-sidebar__card-meta">
                                                {count} geofences{group.isAllowedForFueling ? ' • Fueling enabled' : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <i className="fa-light fa-chevron-right vehicle-tracking-geofence-sidebar__card-chevron"></i>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VehicleTrackingGeofenceSidebarPanel;