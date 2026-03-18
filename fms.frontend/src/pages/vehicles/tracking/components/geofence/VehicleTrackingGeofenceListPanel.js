/**
 * File: VehicleTrackingGeofenceListPanel.js
 * Purpose: Floating panel showing a DataGrid of geofences for a selected group on the tracking page with right-click context menu.
 * Dependencies: React, ReactDOM, devextreme-react/data-grid.
 * Last Modified: 2026-03-18
 *
 * Key Components:
 * - DataGrid with geofence name, type, classification
 * - Right-click context menu: Edit properties, Delete
 * - Header shows group name + color + count
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import './VehicleTrackingGeofenceGroupsPanel.scss';

const PANEL_WIDTH = 480;
const PANEL_GAP = 24;
const MENU_WIDTH = 220;
const MENU_HEIGHT = 120;

const CLASSIFICATION_BADGE = {
  Unknown: { className: 'geofence-classification-badge geofence-classification-badge--unknown' },
  Parking: { className: 'geofence-classification-badge geofence-classification-badge--parking', icon: 'fa-light fa-square-parking' },
  Load: { className: 'geofence-classification-badge geofence-classification-badge--load', icon: 'fa-light fa-truck-loading' },
  Dump: { className: 'geofence-classification-badge geofence-classification-badge--dump', icon: 'fa-light fa-dumpster' },
  Fuel: { className: 'geofence-classification-badge geofence-classification-badge--fuel', icon: 'fa-light fa-gas-pump' },
  Workshop: { className: 'geofence-classification-badge geofence-classification-badge--workshop', icon: 'fa-light fa-wrench' },
};

const TYPE_ICON = {
  Circle: 'fa-circle',
  Polygon: 'fa-draw-polygon',
  Route: 'fa-route',
};

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
  const panelEl = document.querySelector('.geofence-list-panel');
  const currentHeight = panelEl?.getBoundingClientRect?.().height || 520;
  const maxY = Math.max(PANEL_GAP, window.innerHeight - currentHeight - PANEL_GAP);
  return {
    x: Math.min(Math.max(position.x, PANEL_GAP), maxX),
    y: Math.min(Math.max(position.y, PANEL_GAP), maxY),
  };
};

const getDefaultPosition = () => {
  if (typeof window === 'undefined') return { x: PANEL_GAP, y: 88 };
  return clampPosition({ x: window.innerWidth - PANEL_WIDTH - PANEL_GAP - 400, y: 88 });
};

const VehicleTrackingGeofenceListPanel = ({
  open,
  onClose,
  group,
  allGeofences = [],
  saving = false,
  onEditGeofence,
  onDeleteGeofence,
  onGeofenceClick,
}) => {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState(getDefaultPosition);
  const [contextMenu, setContextMenu] = useState(null);
  const [searchText, setSearchText] = useState('');
  const dragStateRef = useRef(null);

  useEffect(() => {
    if (open) {
      setSearchText('');
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
    const handleClick = () => { setContextMenu(null); };
    document.addEventListener('click', handleClick);
    document.addEventListener('contextmenu', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('contextmenu', handleClick);
    };
  }, [contextMenu]);

  const handleHeaderMouseDown = (e) => {
    if (e.button !== 0 || e.target.closest('button') || e.target.closest('input')) return;
    dragStateRef.current = { offsetX: e.clientX - position.x, offsetY: e.clientY - position.y };
  };

  const handleRowContextMenu = useCallback((e, geofence) => {
    e.preventDefault();
    e.stopPropagation();
    const nextPosition = clampMenuPosition(e.clientX, e.clientY);
    setContextMenu({ ...nextPosition, geofence });
  }, []);

  const geofences = useMemo(() => {
    if (!group || !Array.isArray(group.geofences)) return [];
    const groupGeofenceIds = new Set(group.geofences.map((gf) => Number(gf.id)));
    let result = allGeofences.filter((gf) => groupGeofenceIds.has(Number(gf.id)));
    if (searchText.trim()) {
      const term = searchText.toLowerCase();
      result = result.filter((gf) => gf.name?.toLowerCase().includes(term));
    }
    return result;
  }, [allGeofences, group, searchText]);

  if (!open || !group) return null;

  const groupColor = group.colour || '#808080';
  const geofenceCount = geofences.length;

  return ReactDOM.createPortal(
    <aside
      className={`geofence-list-panel${mounted ? ' geofence-list-panel--open' : ''}`}
      role="dialog"
      aria-modal="false"
      aria-label={`Geofences in ${group.name}`}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      {/* Header */}
      <div className="geofence-list-panel__header" onMouseDown={handleHeaderMouseDown}>
        <div className="geofence-panel-shell__header-main">
          <div className="geofence-panel-shell__drag-handle" aria-hidden="true">
            <i className="fa-light fa-grip-dots-vertical"></i>
          </div>
          <span className="tw-w-4 tw-h-4 tw-rounded-full tw-flex-shrink-0 tw-border tw-border-gray-300" style={{ backgroundColor: groupColor }} />
          <div className="geofence-panel-shell__identity">
            <div className="geofence-panel-shell__title tw-truncate">{group.name}</div>
            <div className="geofence-panel-shell__subtitle">{geofenceCount} geofences</div>
          </div>
        </div>
        <div className="geofence-panel-shell__header-actions">
          <button
            type="button"
            className="geofence-list-panel__icon-btn geofence-list-panel__icon-btn--close"
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
            placeholder="Search geofences..."
            className="geofence-floating-panel__search-input"
          />
        </div>
      </div>

      {/* Geofence list */}
      <div className="geofence-list-panel__body">
        {geofences.length === 0 ? (
          <div className="geofence-floating-panel__empty">
            <i className="fa-light fa-map-location-dot"></i>
            <div className="geofence-floating-panel__empty-title">{searchText ? 'No matching geofences' : 'No geofences in this group'}</div>
          </div>
        ) : (
          <div className="tw-py-0.5">
            {/* Column header */}
            <div className="geofence-list-panel__column-header">
              <span className="tw-flex-1 tw-min-w-0">Name</span>
              <span className="geofence-list-panel__type-col">Type</span>
              <span className="geofence-list-panel__classification-col">Classification</span>
            </div>
            {geofences.map((gf) => {
              const classification = gf.classification || 'Unknown';
              const badge = CLASSIFICATION_BADGE[classification] || CLASSIFICATION_BADGE.Unknown;
              const typeIcon = TYPE_ICON[gf.geofenceType] || 'fa-location-dot';
              return (
                <button
                  key={gf.id}
                  type="button"
                  className="geofence-list-panel__geofence-row"
                  onClick={() => onGeofenceClick?.(gf, group)}
                  onContextMenu={(e) => handleRowContextMenu(e, gf)}
                >
                  <div className="tw-flex-1 tw-min-w-0 tw-flex tw-items-center tw-gap-2">
                    <i className={`fa-light ${typeIcon} tw-text-[12px] tw-text-[#0078d4] tw-w-4 tw-text-center tw-flex-shrink-0`}></i>
                    <span className="geofence-floating-panel__row-name tw-truncate">{gf.name}</span>
                  </div>
                  <span className="geofence-list-panel__row-type">{gf.geofenceType || '—'}</span>
                  <span className="geofence-list-panel__row-classification">
                    <span className={badge.className}>
                      {badge.icon ? <i className={badge.icon}></i> : null}
                      {classification}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu ? ReactDOM.createPortal(
        <div
          className="geofence-list-panel__context-menu"
          style={{ position: 'fixed', left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="geofence-list-panel__context-item"
            onClick={() => { setContextMenu(null); onEditGeofence?.(contextMenu.geofence); }}
          >
            <i className="fa-light fa-pen-to-square tw-w-4 tw-text-center"></i>
            <span>Edit properties</span>
          </button>
          <div className="geofence-floating-panel__divider" />
          <button
            type="button"
            className="geofence-list-panel__context-item geofence-list-panel__context-item--danger"
            onClick={() => { setContextMenu(null); onDeleteGeofence?.(contextMenu.geofence); }}
          >
            <i className="fa-light fa-trash tw-w-4 tw-text-center"></i>
            <span>Delete geofence</span>
          </button>
        </div>,
        document.body,
      ) : null}
    </aside>,
    document.body,
  );
};

export default VehicleTrackingGeofenceListPanel;
