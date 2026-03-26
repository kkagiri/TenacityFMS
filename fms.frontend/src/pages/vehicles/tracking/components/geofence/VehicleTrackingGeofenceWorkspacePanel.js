/**
 * File: VehicleTrackingGeofenceWorkspacePanel.js
 * Purpose: Renders geofence groups and group members inside a generic tracking workspace pane.
 * Dependencies: React, VehicleTrackingGeofenceGroupsPanel.scss
 * Last Modified: 2026-03-26
 *
 * Key Components:
 * - VehicleTrackingGeofenceWorkspacePanel(): Embedded geofence browser for workspace pane assignment.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import './VehicleTrackingGeofenceGroupsPanel.scss';

const PANEL_GAP = 24;
const MENU_WIDTH = 220;
const MENU_HEIGHT = 150;

const clampMenuPosition = (x, y, menuWidth = MENU_WIDTH, menuHeight = MENU_HEIGHT) => {
  if (typeof window === 'undefined') {
    return { x, y };
  }

  return {
    x: Math.min(Math.max(x, PANEL_GAP), Math.max(PANEL_GAP, window.innerWidth - menuWidth - PANEL_GAP)),
    y: Math.min(Math.max(y, PANEL_GAP), Math.max(PANEL_GAP, window.innerHeight - menuHeight - PANEL_GAP)),
  };
};

const CLASSIFICATION_BADGE = {
  Unknown: 'geofence-classification-badge geofence-classification-badge--unknown',
  Parking: 'geofence-classification-badge geofence-classification-badge--parking',
  Load: 'geofence-classification-badge geofence-classification-badge--load',
  Dump: 'geofence-classification-badge geofence-classification-badge--dump',
  Fuel: 'geofence-classification-badge geofence-classification-badge--fuel',
  Workshop: 'geofence-classification-badge geofence-classification-badge--workshop',
};

const VehicleTrackingGeofenceWorkspacePanel = ({
  allGeofences = [],
  canManageGeofences = false,
  groups = [],
  loading = false,
  onAddGeofence,
  onAddGroup,
  onDeleteGeofence,
  onDeleteGroup,
  onEditGeofence,
  onEditGroup,
  onGeofenceSelect,
  selectedGroup,
  setSelectedGroup,
}) => {
  const [searchText, setSearchText] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [geofenceContextMenu, setGeofenceContextMenu] = useState(null);

  useEffect(() => {
    if (!contextMenu && !geofenceContextMenu) {
      return undefined;
    }

    const handleClose = () => {
      setContextMenu(null);
      setGeofenceContextMenu(null);
    };

    document.addEventListener('click', handleClose);
    document.addEventListener('contextmenu', handleClose);

    return () => {
      document.removeEventListener('click', handleClose);
      document.removeEventListener('contextmenu', handleClose);
    };
  }, [contextMenu, geofenceContextMenu]);

  const handleGroupContextMenu = useCallback((event, group) => {
    if (!canManageGeofences) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const nextPosition = clampMenuPosition(event.clientX, event.clientY);
    setSelectedGroup(group);
    setGeofenceContextMenu(null);
    setContextMenu({ ...nextPosition, group });
  }, [canManageGeofences, setSelectedGroup]);

  const handleGeofenceContextMenu = useCallback((event, geofence) => {
    if (!canManageGeofences) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const nextPosition = clampMenuPosition(event.clientX, event.clientY, 220, 120);
    setContextMenu(null);
    setGeofenceContextMenu({ ...nextPosition, geofence });
  }, [canManageGeofences]);

  const searchTerm = searchText.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!searchTerm) {
      return groups;
    }

    return groups.filter((group) => {
      if (group.name?.toLowerCase().includes(searchTerm)) return true;
      const memberIds = new Set((Array.isArray(group.geofences) ? group.geofences : []).map((gf) => Number(gf.id)));
      return allGeofences.some((gf) => memberIds.has(Number(gf.id)) && gf.name?.toLowerCase().includes(searchTerm));
    });
  }, [allGeofences, groups, searchTerm]);

  const selectedGroupGeofences = useMemo(() => {
    if (!selectedGroup || !Array.isArray(selectedGroup.geofences)) {
      return [];
    }

    const geofenceIds = new Set(selectedGroup.geofences.map((item) => Number(item.id)));
    let result = allGeofences.filter((item) => geofenceIds.has(Number(item.id)));
    if (searchTerm) {
      result = result.filter((gf) => gf.name?.toLowerCase().includes(searchTerm));
    }
    return result;
  }, [allGeofences, searchTerm, selectedGroup]);

  return (
    <div className="vehicle-tracking-geofence-workspace">
      <div className="vehicle-tracking-geofence-workspace__header">
        <div>
          <div className="vehicle-tracking-geofence-workspace__title">Geofence workspace</div>
          <div className="vehicle-tracking-geofence-workspace__subtitle">Browse groups and geofences in one panel</div>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <button
            type="button"
            className="vehicle-tracking-geofence-toolbar-button"
            onClick={onAddGroup}
            disabled={!canManageGeofences}
            title={canManageGeofences ? 'Create a geofence group' : 'Requires geofence manage permission'}
          >
            <i className="fa-light fa-folder-plus"></i>
            <span>Group</span>
          </button>
          <button
            type="button"
            className="vehicle-tracking-geofence-toolbar-button vehicle-tracking-geofence-toolbar-button--primary"
            onClick={onAddGeofence}
            disabled={!canManageGeofences}
            title={canManageGeofences ? 'Create a geofence' : 'Requires geofence manage permission'}
          >
            <i className="fa-light fa-plus"></i>
            <span>Geofence</span>
          </button>
        </div>
      </div>

      <div className="vehicle-tracking-geofence-workspace__search-wrap">
        <div className="geofence-floating-panel__search tw-flex-1">
          <i className="fa-light fa-search geofence-floating-panel__search-icon"></i>
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search groups or geofences..."
            className="geofence-floating-panel__search-input"
          />
        </div>
      </div>

      <div className="vehicle-tracking-geofence-workspace__layout">
        <div className="vehicle-tracking-geofence-workspace__groups">
          {loading ? (
            <div className="geofence-floating-panel__loading">
              <i className="fa-light fa-spinner-third fa-spin"></i>
              Loading groups...
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="vehicle-tracking-geofence-workspace__empty">
              <i className="fa-light fa-layer-group"></i>
              <div className="vehicle-tracking-geofence-workspace__empty-title">No geofence groups</div>
              <div className="vehicle-tracking-geofence-workspace__empty-subtitle">Create a group or adjust your search.</div>
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isActive = Number(selectedGroup?.id) === Number(group.id);
              const geofenceCount = Array.isArray(group.geofences) ? group.geofences.length : (group.geofenceCount || 0);

              return (
                <div
                  key={group.id}
                  className={`vehicle-tracking-geofence-workspace__group-card${isActive ? ' vehicle-tracking-geofence-workspace__group-card--active' : ''}`}
                  onContextMenu={(event) => handleGroupContextMenu(event, group)}
                >
                  <button
                    type="button"
                    className="vehicle-tracking-geofence-workspace__group-button"
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="vehicle-tracking-geofence-workspace__group-main">
                      <span
                        className="tw-h-3 tw-w-3 tw-flex-shrink-0 tw-rounded-full tw-border tw-border-gray-300"
                        style={{ backgroundColor: group.colour || '#9aa09d' }}
                      />
                      <div className="tw-min-w-0">
                        <div className="vehicle-tracking-geofence-workspace__group-title tw-truncate">{group.name}</div>
                        <div className="vehicle-tracking-geofence-workspace__group-meta">
                          {geofenceCount} geofences{group.isAllowedForFueling ? ' • Fueling enabled' : ''}
                        </div>
                      </div>
                    </div>
                    <i className="fa-light fa-chevron-right geofence-floating-panel__row-chevron"></i>
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="vehicle-tracking-geofence-workspace__details">
          {!selectedGroup ? (
            <div className="vehicle-tracking-geofence-workspace__empty-detail">
              <i className="fa-light fa-map-location-dot"></i>
              <div className="vehicle-tracking-geofence-workspace__empty-title">Select a group</div>
              <div className="vehicle-tracking-geofence-workspace__empty-subtitle">Its geofences will appear here.</div>
            </div>
          ) : selectedGroupGeofences.length === 0 ? (
            <div className="vehicle-tracking-geofence-workspace__empty-detail">
              <i className="fa-light fa-draw-polygon"></i>
              <div className="vehicle-tracking-geofence-workspace__empty-title">No geofences in {selectedGroup.name}</div>
            </div>
          ) : (
            <>
              <div className="vehicle-tracking-geofence-workspace__detail-header">
                <div>
                  <div className="vehicle-tracking-geofence-workspace__detail-heading">{selectedGroup.name}</div>
                  <div className="vehicle-tracking-geofence-workspace__detail-subtitle">{selectedGroupGeofences.length} geofences</div>
                </div>
              </div>
              {selectedGroupGeofences.map((geofence) => {
                const classification = geofence.classification || 'Unknown';
                const badgeClass = CLASSIFICATION_BADGE[classification] || CLASSIFICATION_BADGE.Unknown;
                return (
                  <div
                    key={geofence.id}
                    className="vehicle-tracking-geofence-workspace__geofence-card"
                    onContextMenu={(event) => handleGeofenceContextMenu(event, geofence)}
                  >
                    <button
                      type="button"
                      className="vehicle-tracking-geofence-workspace__geofence-button"
                      onClick={() => onGeofenceSelect?.(geofence, selectedGroup)}
                    >
                      <div className="tw-min-w-0">
                        <div className="vehicle-tracking-geofence-workspace__geofence-title tw-truncate">{geofence.name}</div>
                        <div className="vehicle-tracking-geofence-workspace__geofence-meta tw-flex tw-items-center tw-gap-2">
                          <span>{geofence.geofenceType || 'Unknown type'}</span>
                          <span className={badgeClass}>{classification}</span>
                        </div>
                      </div>
                      <i className="fa-light fa-location-crosshairs tw-text-[12px] tw-text-[#0078d4]"></i>
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {contextMenu ? ReactDOM.createPortal(
        <div
          className="geofence-groups-panel__context-menu"
          style={{ position: 'fixed', left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="geofence-groups-panel__context-item"
            onClick={() => {
              setContextMenu(null);
              onEditGroup?.(contextMenu.group);
            }}
          >
            <i className="fa-light fa-pen-to-square tw-w-4 tw-text-center"></i>
            <span>Edit</span>
          </button>
          <button
            type="button"
            className="geofence-groups-panel__context-item"
            onClick={() => {
              setContextMenu(null);
              setSelectedGroup(contextMenu.group);
            }}
          >
            <i className="fa-light fa-draw-polygon tw-w-4 tw-text-center"></i>
            <span>Draw all geofences</span>
          </button>
          <div className="geofence-floating-panel__divider" />
          <button
            type="button"
            className="geofence-groups-panel__context-item geofence-groups-panel__context-item--danger"
            onClick={() => {
              setContextMenu(null);
              onDeleteGroup?.(contextMenu.group);
            }}
          >
            <i className="fa-light fa-trash tw-w-4 tw-text-center"></i>
            <span>Delete</span>
          </button>
        </div>,
        document.body,
      ) : null}

      {geofenceContextMenu ? ReactDOM.createPortal(
        <div
          className="geofence-list-panel__context-menu"
          style={{ position: 'fixed', left: `${geofenceContextMenu.x}px`, top: `${geofenceContextMenu.y}px` }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="geofence-list-panel__context-item"
            onClick={() => {
              setGeofenceContextMenu(null);
              onEditGeofence?.(geofenceContextMenu.geofence);
            }}
          >
            <i className="fa-light fa-pen-to-square tw-w-4 tw-text-center"></i>
            <span>Edit properties</span>
          </button>
          <div className="geofence-floating-panel__divider" />
          <button
            type="button"
            className="geofence-list-panel__context-item geofence-list-panel__context-item--danger"
            onClick={() => {
              setGeofenceContextMenu(null);
              onDeleteGeofence?.(geofenceContextMenu.geofence);
            }}
          >
            <i className="fa-light fa-trash tw-w-4 tw-text-center"></i>
            <span>Delete geofence</span>
          </button>
        </div>,
        document.body,
      ) : null}
    </div>
  );
};

export default VehicleTrackingGeofenceWorkspacePanel;