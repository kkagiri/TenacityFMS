/**
 * File: VehicleTrackingGeofenceGroupsPanel.js
 * Purpose: Floating panel listing geofence groups on the tracking page with context menu, add group/geofence controls.
 * Dependencies: React, ReactDOM, VehicleTrackingGeofencePanel shell pattern.
 * Last Modified: 2026-03-18
 *
 * Key Components:
 * - Group list with color dots, fueling indicators, geofence counts
 * - Toolbar: "Add Group", "Add Geofence" buttons
 * - Right-click context menu on groups (Edit, Delete, Toggle Fueling)
 * - Click group → triggers geofence list panel
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import './VehicleTrackingGeofenceGroupsPanel.scss';

const PANEL_WIDTH = 380;
const PANEL_GAP = 24;
const MENU_WIDTH = 220;
const MENU_HEIGHT = 170;

const clampMenuPosition = (x, y, menuWidth = MENU_WIDTH, menuHeight = MENU_HEIGHT) => {
  if (typeof window === 'undefined') {
    return { x, y };
  }

  return {
    x: Math.min(Math.max(x, PANEL_GAP), Math.max(PANEL_GAP, window.innerWidth - menuWidth - PANEL_GAP)),
    y: Math.min(Math.max(y, PANEL_GAP), Math.max(PANEL_GAP, window.innerHeight - menuHeight - PANEL_GAP)),
  };
};

const clampPosition = (position) => {
  if (typeof window === 'undefined') return position;
  const maxX = Math.max(PANEL_GAP, window.innerWidth - PANEL_WIDTH - PANEL_GAP);
  const panelEl = document.querySelector('.geofence-groups-panel');
  const currentHeight = panelEl?.getBoundingClientRect?.().height || 520;
  const maxY = Math.max(PANEL_GAP, window.innerHeight - currentHeight - PANEL_GAP);
  return {
    x: Math.min(Math.max(position.x, PANEL_GAP), maxX),
    y: Math.min(Math.max(position.y, PANEL_GAP), maxY),
  };
};

const getDefaultPosition = () => {
  if (typeof window === 'undefined') return { x: PANEL_GAP, y: 88 };
  return clampPosition({ x: window.innerWidth - PANEL_WIDTH - PANEL_GAP, y: 88 });
};

const VehicleTrackingGeofenceGroupsPanel = ({
  open,
  onClose,
  groups = [],
  allGeofences = [],
  loading = false,
  saving = false,
  onGroupClick,
  onAddGroup,
  onAddGeofence,
  onEditGroup,
  onDeleteGroup,
  onToggleFueling,
}) => {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState(getDefaultPosition);
  const [contextMenu, setContextMenu] = useState(null);
  const [searchText, setSearchText] = useState('');
  const dragStateRef = useRef(null);

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(raf);
    }
    setMounted(false);
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleResize = () => setPosition((c) => clampPosition(c));
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerMove = (e) => {
      if (!dragStateRef.current) return;
      setPosition(clampPosition({
        x: e.clientX - dragStateRef.current.offsetX,
        y: e.clientY - dragStateRef.current.offsetY,
      }));
    };
    const handlePointerUp = () => { dragStateRef.current = null; };
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [open]);

  useEffect(() => {
    if (!contextMenu) return undefined;
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    document.addEventListener('contextmenu', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('contextmenu', handleClick);
    };
  }, [contextMenu]);

  const handleHeaderMouseDown = (e) => {
    if (e.button !== 0 || e.target.closest('button')) return;
    dragStateRef.current = { offsetX: e.clientX - position.x, offsetY: e.clientY - position.y };
  };

  const handleGroupContextMenu = useCallback((e, group) => {
    e.preventDefault();
    e.stopPropagation();
    const nextPosition = clampMenuPosition(e.clientX, e.clientY);
    setContextMenu({ ...nextPosition, group });
  }, []);

  const filteredGroups = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return groups;
    return groups.filter((g) => {
      if (g.name?.toLowerCase().includes(term)) return true;
      const memberIds = new Set((Array.isArray(g.geofences) ? g.geofences : []).map((gf) => Number(gf.id)));
      return allGeofences.some((gf) => memberIds.has(Number(gf.id)) && gf.name?.toLowerCase().includes(term));
    });
  }, [allGeofences, groups, searchText]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <aside
      className={`geofence-groups-panel${mounted ? ' geofence-groups-panel--open' : ''}`}
      role="dialog"
      aria-modal="false"
      aria-label="Geofence Groups"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      {/* Header */}
      <div className="geofence-groups-panel__header" onMouseDown={handleHeaderMouseDown}>
        <div className="geofence-panel-shell__header-main">
          <div className="geofence-panel-shell__drag-handle" aria-hidden="true">
            <i className="fa-light fa-grip-dots-vertical"></i>
          </div>
          <div className="geofence-panel-shell__icon">
            <i className="fa-light fa-layer-group"></i>
          </div>
          <div className="geofence-panel-shell__identity">
            <div className="geofence-panel-shell__title">Geofence Groups</div>
            <div className="geofence-panel-shell__subtitle">{groups.length} groups</div>
          </div>
        </div>
        <div className="geofence-panel-shell__header-actions">
          <button
            type="button"
            className="geofence-groups-panel__icon-btn"
            title="Add Group"
            onClick={onAddGroup}
          >
            <i className="fa-light fa-folder-plus"></i>
          </button>
          <button
            type="button"
            className="geofence-groups-panel__icon-btn"
            title="Add Geofence"
            onClick={onAddGeofence}
          >
            <i className="fa-light fa-plus"></i>
          </button>
          <button
            type="button"
            className="geofence-groups-panel__icon-btn geofence-groups-panel__icon-btn--close"
            title="Close"
            onClick={onClose}
          >
            <i className="fa-light fa-xmark"></i>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="geofence-floating-panel__toolbar">
        <div className="geofence-floating-panel__search">
          <i className="fa-light fa-search geofence-floating-panel__search-icon"></i>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search groups or geofences..."
            className="geofence-floating-panel__search-input"
          />
        </div>
      </div>

      {/* Group List */}
      <div className="geofence-groups-panel__body">
        {loading ? (
          <div className="geofence-floating-panel__loading">
            <i className="fa-light fa-spinner-third fa-spin"></i>
            Loading groups...
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="geofence-floating-panel__empty">
            <i className="fa-light fa-layer-group"></i>
            <div className="geofence-floating-panel__empty-title">{searchText ? 'No matching groups' : 'No groups found'}</div>
            <div className="geofence-floating-panel__empty-subtitle">Sync from GPSGate or create a new group</div>
          </div>
        ) : (
          <div className="tw-py-1">
            {filteredGroups.map((group) => {
              const count = Array.isArray(group.geofences) ? group.geofences.length : (group.geofenceCount || 0);
              return (
                <button
                  key={group.id}
                  type="button"
                  className="geofence-groups-panel__group-row"
                  onClick={() => onGroupClick?.(group)}
                  onContextMenu={(e) => handleGroupContextMenu(e, group)}
                >
                  <div className="geofence-floating-panel__row-main">
                    {group.colour ? (
                      <span
                        className="tw-w-3 tw-h-3 tw-rounded-full tw-flex-shrink-0 tw-border tw-border-gray-300"
                        style={{ backgroundColor: group.colour }}
                      />
                    ) : (
                      <span className="tw-w-3 tw-h-3 tw-rounded-full tw-flex-shrink-0 tw-bg-gray-300" />
                    )}
                    <span className="geofence-floating-panel__row-name tw-truncate">{group.name}</span>
                    {group.isAllowedForFueling && (
                      <span className="geofence-floating-panel__fuel-badge">
                        <i className="fa-light fa-gas-pump"></i>
                      </span>
                    )}
                  </div>
                  <div className="geofence-floating-panel__row-meta">
                    <span className="geofence-floating-panel__row-count">{count}</span>
                    <i className="fa-light fa-chevron-right geofence-floating-panel__row-chevron"></i>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu ? ReactDOM.createPortal(
        <div
          className="geofence-groups-panel__context-menu"
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="geofence-groups-panel__context-item"
            onClick={() => { setContextMenu(null); onGroupClick?.(contextMenu.group); }}
          >
            <i className="fa-light fa-list tw-w-4 tw-text-center"></i>
            <span>View geofences</span>
          </button>
          <button
            type="button"
            className="geofence-groups-panel__context-item"
            onClick={() => { setContextMenu(null); onEditGroup?.(contextMenu.group); }}
          >
            <i className="fa-light fa-pen-to-square tw-w-4 tw-text-center"></i>
            <span>Edit group</span>
          </button>
          <button
            type="button"
            className="geofence-groups-panel__context-item"
            onClick={() => { setContextMenu(null); onToggleFueling?.(contextMenu.group); }}
          >
            <i className="fa-light fa-gas-pump tw-w-4 tw-text-center"></i>
            <span>{contextMenu.group.isAllowedForFueling ? 'Disable fueling' : 'Enable fueling'}</span>
          </button>
          <div className="geofence-floating-panel__divider" />
          <button
            type="button"
            className="geofence-groups-panel__context-item geofence-groups-panel__context-item--danger"
            onClick={() => { setContextMenu(null); onDeleteGroup?.(contextMenu.group); }}
          >
            <i className="fa-light fa-trash tw-w-4 tw-text-center"></i>
            <span>Delete group</span>
          </button>
        </div>,
        document.body,
      ) : null}
    </aside>,
    document.body,
  );
};

export default VehicleTrackingGeofenceGroupsPanel;
