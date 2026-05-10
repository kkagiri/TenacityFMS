/**
 * File: VehicleTrackingGeofencePanel.js
 * Purpose: Right-floating geofence creation panel for the tracking workspace using the same compact visual language as the tracking detail popup.
 * Dependencies: React, ReactDOM.
 * Last Modified: 2026-03-18
 *
 * Key Components:
 * - VehicleTrackingGeofencePanel(): Portal-based floating side panel for tracking geofence creation.
 */
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import './VehicleTrackingGeofencePanel.scss';

const PANEL_WIDTH = 460;
const PANEL_GAP = 24;

const clampPosition = (position) => {
    if (typeof window === 'undefined') {
        return position;
    }

    const maxX = Math.max(PANEL_GAP, window.innerWidth - PANEL_WIDTH - PANEL_GAP);
    const panelElement = document.querySelector('.vehicle-tracking-geofence-panel');
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

const VehicleTrackingGeofencePanel = ({
    open,
    onClose,
    title = 'Create geofence',
    subtitle = 'Define area, group, and fueling behaviour',
    children,
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

        const handleResize = () => {
            setPosition((current) => clampPosition(current));
        };

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

            const nextPosition = clampPosition({
                x: event.clientX - dragStateRef.current.offsetX,
                y: event.clientY - dragStateRef.current.offsetY,
            });
            setPosition(nextPosition);
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
        if (event.button !== 0) {
            return;
        }

        if (event.target.closest('button')) {
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
            className={`vehicle-tracking-geofence-panel${mounted ? ' vehicle-tracking-geofence-panel--open' : ''}`}
            role="dialog"
            aria-modal="false"
            aria-label={title}
            style={{ left: `${position.x}px`, top: `${position.y}px` }}
        >
            <div className="vehicle-tracking-geofence-panel__header" onMouseDown={handleHeaderMouseDown}>
                <div className="vehicle-tracking-geofence-panel__header-main">
                    <div className="vehicle-tracking-geofence-panel__drag-handle" aria-hidden="true">
                        <i className="fa-light fa-grip-dots-vertical"></i>
                    </div>
                    <div className="vehicle-tracking-geofence-panel__icon">
                        <i className="fa-light fa-draw-polygon"></i>
                    </div>
                    <div className="vehicle-tracking-geofence-panel__identity">
                        <div className="vehicle-tracking-geofence-panel__title">{title}</div>
                        {subtitle ? <div className="vehicle-tracking-geofence-panel__subtitle">{subtitle}</div> : null}
                    </div>
                </div>

                <div className="vehicle-tracking-geofence-panel__header-actions">
                    <button
                        type="button"
                        className="vehicle-tracking-geofence-panel__icon-btn vehicle-tracking-geofence-panel__icon-btn--close"
                        title="Close"
                        onClick={onClose}
                    >
                        <i className="fa-light fa-xmark"></i>
                    </button>
                </div>
            </div>

            <div className="vehicle-tracking-geofence-panel__body">
                {children}
            </div>
        </aside>,
        document.body,
    );
};

export default VehicleTrackingGeofencePanel;