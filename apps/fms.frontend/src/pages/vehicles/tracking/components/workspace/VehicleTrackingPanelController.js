/**
 * File: VehicleTrackingPanelController.js
 * Purpose: Provides a single control surface for assigning generic workspace panes and toggling tracking floating panels.
 * Dependencies: React, ReactDOM, VehicleTrackingPanelController.scss
 * Last Modified: 2026-03-17
 *
 * Key Components:
 * - VehicleTrackingPanelController(): Floating controller window for assigning pane content and floating panel visibility.
 */
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import './VehicleTrackingPanelController.scss';

const PANEL_WIDTH = 320;
const PANEL_GAP = 24;

const clampPosition = (position) => {
  if (typeof window === 'undefined') {
    return position;
  }

  const maxX = Math.max(PANEL_GAP, window.innerWidth - PANEL_WIDTH - PANEL_GAP);
  const panelElement = document.querySelector('.vehicle-tracking-panel-controller');
  const currentHeight = panelElement?.getBoundingClientRect?.().height || 420;
  const maxY = Math.max(PANEL_GAP, window.innerHeight - currentHeight - PANEL_GAP);

  return {
    x: Math.min(Math.max(position.x, PANEL_GAP), maxX),
    y: Math.min(Math.max(position.y, PANEL_GAP), maxY),
  };
};

const getDefaultPosition = () => {
  if (typeof window === 'undefined') {
    return { x: PANEL_GAP, y: 88 };
  }

  return clampPosition({
    x: window.innerWidth - PANEL_WIDTH - PANEL_GAP,
    y: 88,
  });
};

const ToggleRow = ({ checked, description, disabled = false, icon, label, onChange }) => (
  <label className={`vehicle-tracking-panel-controller__toggle${disabled ? ' vehicle-tracking-panel-controller__toggle--disabled' : ''}`}>
    <div className="vehicle-tracking-panel-controller__toggle-main">
      <span className="vehicle-tracking-panel-controller__toggle-icon" aria-hidden="true">
        <i className={icon}></i>
      </span>
      <span className="vehicle-tracking-panel-controller__toggle-copy">
        <span className="vehicle-tracking-panel-controller__toggle-label">{label}</span>
        {description ? <span className="vehicle-tracking-panel-controller__toggle-description">{description}</span> : null}
      </span>
    </div>
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
      aria-label={label}
    />
  </label>
);

const PaneOptionSelect = ({ description, icon, label, onChange, options, value }) => (
  <div className="vehicle-tracking-panel-controller__select-row">
    <div className="vehicle-tracking-panel-controller__toggle-main">
      <span className="vehicle-tracking-panel-controller__toggle-icon" aria-hidden="true">
        <i className={icon}></i>
      </span>
      <span className="vehicle-tracking-panel-controller__toggle-copy">
        <span className="vehicle-tracking-panel-controller__toggle-label">{label}</span>
        {description ? <span className="vehicle-tracking-panel-controller__toggle-description">{description}</span> : null}
      </span>
    </div>
    <select
      className="vehicle-tracking-panel-controller__select"
      value={value || ''}
      onChange={(event) => onChange(event.target.value || null)}
      aria-label={label}
    >
      {options.map((option) => (
        <option key={option.value || 'none'} value={option.value || ''}>{option.label}</option>
      ))}
    </select>
  </div>
);

const VehicleTrackingPanelController = ({
  open,
  onClose,
  floatingPanels,
  onAssignWorkspacePane,
  onToggleFloatingPanel,
  workspacePanels,
  selectedVehicleLabel,
  geofenceGroupCount = 0,
  inProgressTripCount = 0,
}) => {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState(getDefaultPosition);
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
    if (!open) {
      return undefined;
    }

    const handleResize = () => setPosition((current) => clampPosition(current));
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerMove = (event) => {
      if (!dragStateRef.current) {
        return;
      }

      setPosition(clampPosition({
        x: event.clientX - dragStateRef.current.offsetX,
        y: event.clientY - dragStateRef.current.offsetY,
      }));
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [open]);

  const handleHeaderMouseDown = (event) => {
    if (event.button !== 0 || event.target.closest('button') || event.target.closest('input')) {
      return;
    }

    dragStateRef.current = {
      offsetX: event.clientX - position.x,
      offsetY: event.clientY - position.y,
    };
  };

  if (!open) {
    return null;
  }

  return ReactDOM.createPortal(
    <aside
      className={`vehicle-tracking-panel-controller${mounted ? ' vehicle-tracking-panel-controller--open' : ''}`}
      role="dialog"
      aria-modal="false"
      aria-label="Tracking panel controller"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div className="vehicle-tracking-panel-controller__header" onMouseDown={handleHeaderMouseDown}>
        <div className="vehicle-tracking-panel-controller__header-main">
          <div className="vehicle-tracking-panel-controller__drag-handle" aria-hidden="true">
            <i className="fa-light fa-grip-dots-vertical"></i>
          </div>
          <div className="vehicle-tracking-panel-controller__icon">
            <i className="fa-light fa-sliders"></i>
          </div>
          <div>
            <div className="vehicle-tracking-panel-controller__title">Panels</div>
            <div className="vehicle-tracking-panel-controller__subtitle">Control workspace and floating windows</div>
          </div>
        </div>
        <button
          type="button"
          className="vehicle-tracking-panel-controller__close"
          title="Close"
          onClick={onClose}
        >
          <i className="fa-light fa-xmark"></i>
        </button>
      </div>

      <div className="vehicle-tracking-panel-controller__body">
        <section className="vehicle-tracking-panel-controller__section">
          <div className="vehicle-tracking-panel-controller__section-title">Workspace</div>
          <PaneOptionSelect
            value={workspacePanels?.primary || 'vehicle'}
            description="Left or top slot"
            icon="fa-light fa-truck"
            label="Primary pane"
            options={[
              { value: 'vehicle', label: 'Vehicle' },
              { value: 'map', label: 'Map' },
              { value: 'geofence', label: 'Geofence' },
              { value: null, label: 'None' },
            ]}
            onChange={(value) => onAssignWorkspacePane('primary', value)}
          />
          <PaneOptionSelect
            value={workspacePanels?.secondary || 'map'}
            description="Right or bottom slot"
            icon="fa-light fa-panels-lean-right"
            label="Secondary pane"
            options={[
              { value: 'map', label: 'Map' },
              { value: 'vehicle', label: 'Vehicle' },
              { value: 'geofence', label: 'Geofence' },
              { value: null, label: 'None' },
            ]}
            onChange={(value) => onAssignWorkspacePane('secondary', value)}
          />
        </section>

        <section className="vehicle-tracking-panel-controller__section">
          <div className="vehicle-tracking-panel-controller__section-title">Floating windows</div>
          <ToggleRow
            checked={floatingPanels.trips}
            description={`${inProgressTripCount} trips in progress`}
            icon="fa-light fa-timeline"
            label="Trip timeline"
            onChange={(checked) => onToggleFloatingPanel('trips', checked)}
          />
          <ToggleRow
            checked={floatingPanels.detail}
            description={selectedVehicleLabel ? `Focused on ${selectedVehicleLabel}` : 'Select a vehicle to enable'}
            disabled={!selectedVehicleLabel && !floatingPanels.detail}
            icon="fa-light fa-circle-info"
            label="Vehicle detail"
            onChange={(checked) => onToggleFloatingPanel('detail', checked)}
          />
          <div className="vehicle-tracking-panel-controller__helper">
            {geofenceGroupCount} geofence groups are available in the workspace pane selector.
          </div>
        </section>
      </div>
    </aside>,
    document.body,
  );
};

export default VehicleTrackingPanelController;