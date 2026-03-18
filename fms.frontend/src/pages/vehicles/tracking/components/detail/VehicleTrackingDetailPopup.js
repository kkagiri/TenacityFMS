/**
 * File: VehicleTrackingDetailPopup.js
 * Purpose: Floating vehicle tracking detail shell with drag and resize behaviour.
 * Dependencies: React, ReactDOM, VehicleTrackingDetailPanelContent
 * Last Modified: 2026-03-13
 *
 * Key Components:
 * - VehicleTrackingMiniPanel(): Portal wrapper with floating drag and resize behaviour
 * - VehicleTrackingDetailPopup(): Floating detail window that renders shared panel content
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import VehicleTrackingDetailPanelContent from './VehicleTrackingDetailPanelContent';

const DRAG_CLAMP_PADDING = 16;
const PANEL_MIN_WIDTH = 760;
const PANEL_MIN_HEIGHT = 360;

const getContainerBounds = (container) => (
    container
        ? { width: container.offsetWidth, height: container.offsetHeight }
        : { width: window.innerWidth, height: window.innerHeight }
);

const clampPanelPosition = (pos, panelEl, container) => {
    const bounds = getContainerBounds(container);
    const pw = panelEl?.offsetWidth || 900;
    const ph = panelEl?.offsetHeight || 400;
    const minX = DRAG_CLAMP_PADDING;
    const maxX = bounds.width - pw - DRAG_CLAMP_PADDING;
    const minY = DRAG_CLAMP_PADDING;
    const maxY = bounds.height - ph - DRAG_CLAMP_PADDING;
    return {
        x: Math.min(Math.max(pos.x, minX), maxX),
        y: Math.min(Math.max(pos.y, minY), maxY),
    };
};

const clampPanelSize = (size, position, container) => {
    const bounds = getContainerBounds(container);
    const minWidth = Math.min(PANEL_MIN_WIDTH, Math.max(420, bounds.width - (DRAG_CLAMP_PADDING * 2)));
    const minHeight = Math.min(PANEL_MIN_HEIGHT, Math.max(260, bounds.height - (DRAG_CLAMP_PADDING * 2)));
    const maxWidth = Math.max(minWidth, bounds.width - position.x - DRAG_CLAMP_PADDING);
    const maxHeight = Math.max(minHeight, bounds.height - position.y - DRAG_CLAMP_PADDING);

    return {
        width: Math.min(Math.max(size.width, minWidth), maxWidth),
        height: Math.min(Math.max(size.height, minHeight), maxHeight),
    };
};

const VehicleTrackingMiniPanel = ({ open, onClose, containerRef, children }) => {
    const [mounted, setMounted] = useState(false);
    const [dragOffset, setDragOffset] = useState(null); // null = centred (CSS default), {x,y} = dragged
    const [panelSize, setPanelSize] = useState(null);
    const dragStateRef = useRef(null);
    const resizeStateRef = useRef(null);
    const panelRef = useRef(null);

    useEffect(() => {
        if (open) {
            setDragOffset(null); // reset to centred position on each open
            setPanelSize(null);
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

        const handleMouseMove = (event) => {
            if (resizeStateRef.current) {
                const container = containerRef?.current || null;
                const nextSize = clampPanelSize(
                    {
                        width: resizeStateRef.current.startWidth + (event.clientX - resizeStateRef.current.startX),
                        height: resizeStateRef.current.startHeight + (event.clientY - resizeStateRef.current.startY),
                    },
                    resizeStateRef.current.anchorPosition,
                    container,
                );
                setPanelSize(nextSize);
                return;
            }

            if (!dragStateRef.current) {
                return;
            }

            const container = containerRef?.current || null;
            const raw = {
                x: event.clientX - dragStateRef.current.offsetX,
                y: event.clientY - dragStateRef.current.offsetY,
            };

            // Convert from viewport coords to container-relative coords
            const containerRect = container
                ? container.getBoundingClientRect()
                : { left: 0, top: 0 };

            setDragOffset(clampPanelPosition(
                { x: raw.x - containerRect.left, y: raw.y - containerRect.top },
                panelRef.current,
                container,
            ));
        };

        const handleMouseUp = () => {
            dragStateRef.current = null;
            resizeStateRef.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [containerRef, open]);

    useEffect(() => {
        if (!open || (!dragOffset && !panelSize)) {
            return undefined;
        }

        const handleResize = () => {
            const container = containerRef?.current || null;

            setDragOffset((currentOffset) => {
                if (!currentOffset) {
                    return currentOffset;
                }

                return clampPanelPosition(currentOffset, panelRef.current, container);
            });

            setPanelSize((currentSize) => {
                if (!currentSize) {
                    return currentSize;
                }

                const panelRect = panelRef.current?.getBoundingClientRect();
                const containerRect = container?.getBoundingClientRect() || { left: 0, top: 0 };
                const anchorPosition = dragOffset || {
                    x: (panelRect?.left || 0) - containerRect.left,
                    y: (panelRect?.top || 0) - containerRect.top,
                };

                return clampPanelSize(currentSize, anchorPosition, container);
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [containerRef, dragOffset, open, panelSize]);

    const handleHeaderMouseDown = useCallback((event) => {
        if (event.button !== 0 || event.target.closest('button')) {
            return;
        }

        event.preventDefault();

        const container = containerRef?.current || null;
        const containerRect = container?.getBoundingClientRect() || { left: 0, top: 0 };
        const panelRect = panelRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
        const absolutePosition = clampPanelPosition(
            {
                x: panelRect.left - containerRect.left,
                y: panelRect.top - containerRect.top,
            },
            panelRef.current,
            container,
        );

        setDragOffset(absolutePosition);

        dragStateRef.current = {
            offsetX: event.clientX - panelRect.left,
            offsetY: event.clientY - panelRect.top,
        };
    }, [containerRef]);

    const handleResizeMouseDown = useCallback((event) => {
        if (event.button !== 0) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const container = containerRef?.current || null;
        const containerRect = container?.getBoundingClientRect() || { left: 0, top: 0 };
        const panelRect = panelRef.current?.getBoundingClientRect();
        if (!panelRect) {
            return;
        }

        const anchorPosition = {
            x: panelRect.left - containerRect.left,
            y: panelRect.top - containerRect.top,
        };

        setDragOffset(anchorPosition);
        setPanelSize({ width: panelRect.width, height: panelRect.height });

        resizeStateRef.current = {
            startX: event.clientX,
            startY: event.clientY,
            startWidth: panelRect.width,
            startHeight: panelRect.height,
            anchorPosition,
        };
    }, [containerRef]);

    if (!open) {
        return null;
    }

    const portalTarget = containerRef?.current || document.body;

    // When dragged: use absolute top/left; otherwise keep CSS centred default.
    const panelStyle = {
        ...(dragOffset ? { transform: 'none', left: `${dragOffset.x}px`, bottom: 'auto', top: `${dragOffset.y}px` } : {}),
        ...(panelSize ? { width: `${panelSize.width}px`, height: `${panelSize.height}px` } : {}),
    };

    return ReactDOM.createPortal(
        <>
            <div
                className="vehicle-tracking-panel__overlay"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                ref={panelRef}
                className={`vehicle-tracking-panel${mounted ? ' vehicle-tracking-panel--open' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-label="Vehicle tracking details"
                style={panelStyle}
            >
                {React.isValidElement(children)
                    ? React.cloneElement(children, { panelHeaderMouseDown: handleHeaderMouseDown })
                    : children}
                <button
                    type="button"
                    className="vehicle-tracking-panel__resize-handle"
                    aria-label="Resize vehicle tracking details"
                    title="Resize"
                    onMouseDown={handleResizeMouseDown}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </>,
        portalTarget,
    );
};

const VehicleTrackingDetailPopup = ({ open, onClose, vehicleId, vehicleSnapshot, containerRef }) => {
    return (
        <VehicleTrackingMiniPanel open={open} onClose={onClose} containerRef={containerRef}>
            <VehicleTrackingDetailPanelContent
                onClose={onClose}
                panelHeaderMouseDown={null}
                vehicleId={vehicleId}
                vehicleSnapshot={vehicleSnapshot}
            />
        </VehicleTrackingMiniPanel>
    );
};

export default VehicleTrackingDetailPopup;
