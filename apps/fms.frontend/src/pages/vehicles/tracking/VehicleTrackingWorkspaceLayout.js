/**
 * File: VehicleTrackingWorkspaceLayout.js
 * Purpose: Provides a configurable split workspace for the vehicle grid and tracking map with drag-guided layout switching and resizing
 * Dependencies: React, VehicleTrackingWorkspaceLayout.scss
 * Last Modified: 2026-03-10
 *
 * Key Functions:
 * - handleResizeStart(): Begins drag resizing for the active layout axis
 * - handleDropZoneDrop(): Repositions a pane into the chosen drop indicator zone
 * - handlePaneDragStart(): Shows layout indicators while a pane is being dragged
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './VehicleTrackingWorkspaceLayout.scss';

const WORKSPACE_LAYOUTS = {
    primaryLeft: {
        direction: 'horizontal',
        order: ['primary', 'secondary'],
        label: 'Primary left',
    },
    secondaryLeft: {
        direction: 'horizontal',
        order: ['secondary', 'primary'],
        label: 'Secondary left',
    },
    primaryTop: {
        direction: 'vertical',
        order: ['primary', 'secondary'],
        label: 'Primary top',
    },
    secondaryTop: {
        direction: 'vertical',
        order: ['secondary', 'primary'],
        label: 'Secondary top',
    },
};

const DEFAULT_LAYOUT_MODE = 'primaryLeft';
const DEFAULT_SPLIT_BY_AXIS = {
    horizontal: 38,
    vertical: 44,
};
const MIN_SPLIT_BY_AXIS = {
    horizontal: 12,
    vertical: 18,
};
const MAX_SPLIT_BY_AXIS = {
    horizontal: 88,
    vertical: 82,
};
const DROP_ZONES = [
    { key: 'left', label: 'Place left', icon: 'fa-left' },
    { key: 'right', label: 'Place right', icon: 'fa-right' },
    { key: 'top', label: 'Place top', icon: 'fa-up' },
    { key: 'bottom', label: 'Place bottom', icon: 'fa-down' },
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const sanitizeWorkspacePreference = (preference) => ({
    layoutMode: preference?.layoutMode && WORKSPACE_LAYOUTS[preference.layoutMode]
        ? preference.layoutMode
        : DEFAULT_LAYOUT_MODE,
    splitByAxis: {
        horizontal: clamp(
            preference?.splitByAxis?.horizontal ?? DEFAULT_SPLIT_BY_AXIS.horizontal,
            MIN_SPLIT_BY_AXIS.horizontal,
            MAX_SPLIT_BY_AXIS.horizontal,
        ),
        vertical: clamp(
            preference?.splitByAxis?.vertical ?? DEFAULT_SPLIT_BY_AXIS.vertical,
            MIN_SPLIT_BY_AXIS.vertical,
            MAX_SPLIT_BY_AXIS.vertical,
        ),
    },
});

const resolveLayoutModeForDropZone = (paneKey, dropZoneKey) => {
    switch (dropZoneKey) {
        case 'left':
            return paneKey === 'primary' ? 'primaryLeft' : 'secondaryLeft';
        case 'right':
            return paneKey === 'primary' ? 'secondaryLeft' : 'primaryLeft';
        case 'top':
            return paneKey === 'primary' ? 'primaryTop' : 'secondaryTop';
        case 'bottom':
            return paneKey === 'primary' ? 'secondaryTop' : 'primaryTop';
        default:
            return DEFAULT_LAYOUT_MODE;
    }
};

const VehicleTrackingWorkspaceLayout = ({
    initialPreference,
    onPreferenceChange,
    paneAssignments,
    paneDefinitions,
}) => {
    const containerRef = useRef(null);
    const resizeStateRef = useRef(null);
    const layoutModeRef = useRef(DEFAULT_LAYOUT_MODE);
    const splitByAxisRef = useRef(DEFAULT_SPLIT_BY_AXIS);
    const initialWorkspacePreference = useMemo(() => sanitizeWorkspacePreference(initialPreference), [initialPreference]);
    const [layoutMode, setLayoutMode] = useState(initialWorkspacePreference.layoutMode);
    const [splitByAxis, setSplitByAxis] = useState(initialWorkspacePreference.splitByAxis);
    const [draggedPaneKey, setDraggedPaneKey] = useState(null);
    const [activeDropZone, setActiveDropZone] = useState(null);

    const activeLayout = useMemo(() => WORKSPACE_LAYOUTS[layoutMode] || WORKSPACE_LAYOUTS[DEFAULT_LAYOUT_MODE], [layoutMode]);
    const activeAxis = activeLayout.direction;
    const firstPaneSize = splitByAxis[activeAxis];
    const orderedVisiblePanes = useMemo(() => {
        const assignments = paneAssignments || { primary: 'vehicle', secondary: 'map' };
        return activeLayout.order
            .map((slotKey) => ({ slotKey, paneKey: assignments[slotKey] || null }))
            .filter((item) => item.paneKey && paneDefinitions?.[item.paneKey]);
    }, [activeLayout.order, paneAssignments, paneDefinitions]);

    useEffect(() => {
        layoutModeRef.current = layoutMode;
    }, [layoutMode]);

    useEffect(() => {
        splitByAxisRef.current = splitByAxis;
    }, [splitByAxis]);

    useEffect(() => {
        setLayoutMode((previous) => previous === initialWorkspacePreference.layoutMode
            ? previous
            : initialWorkspacePreference.layoutMode);

        setSplitByAxis((previous) => {
            const nextHorizontal = initialWorkspacePreference.splitByAxis.horizontal;
            const nextVertical = initialWorkspacePreference.splitByAxis.vertical;

            if (previous.horizontal === nextHorizontal && previous.vertical === nextVertical) {
                return previous;
            }

            return {
                horizontal: nextHorizontal,
                vertical: nextVertical,
            };
        });
    }, [initialWorkspacePreference]);

    const commitPreferenceChange = useCallback((nextLayoutMode = layoutModeRef.current, nextSplitByAxis = splitByAxisRef.current) => {
        if (typeof onPreferenceChange !== 'function') {
            return;
        }

        onPreferenceChange({
            layoutMode: nextLayoutMode,
            splitByAxis: nextSplitByAxis,
        });
    }, [onPreferenceChange]);

    useEffect(() => {
        const handlePointerMove = (event) => {
            const resizeState = resizeStateRef.current;

            if (!resizeState || !containerRef.current) {
                return;
            }

            const rect = containerRef.current.getBoundingClientRect();
            const isHorizontal = resizeState.axis === 'horizontal';
            const totalSize = isHorizontal ? rect.width : rect.height;
            if (!totalSize) {
                return;
            }

            const offset = isHorizontal
                ? event.clientX - rect.left
                : event.clientY - rect.top;

            const nextPercent = clamp(
                (offset / totalSize) * 100,
                isHorizontal ? MIN_SPLIT_BY_AXIS.horizontal : MIN_SPLIT_BY_AXIS.vertical,
                isHorizontal ? MAX_SPLIT_BY_AXIS.horizontal : MAX_SPLIT_BY_AXIS.vertical,
            );

            setSplitByAxis((previous) => ({
                ...previous,
                [resizeState.axis]: nextPercent,
            }));
        };

        const handlePointerUp = () => {
            const wasResizing = Boolean(resizeStateRef.current);
            resizeStateRef.current = null;
            document.body.classList.remove('vehicle-tracking-workspace--resizing');

            if (wasResizing) {
                commitPreferenceChange();
            }
        };

        window.addEventListener('mousemove', handlePointerMove);
        window.addEventListener('mouseup', handlePointerUp);

        return () => {
            window.removeEventListener('mousemove', handlePointerMove);
            window.removeEventListener('mouseup', handlePointerUp);
        };
    }, [commitPreferenceChange]);

    const handleResizeStart = useCallback((event) => {
        resizeStateRef.current = { axis: activeAxis };
        document.body.classList.add('vehicle-tracking-workspace--resizing');
        event.preventDefault();
    }, [activeAxis]);

    const handlePaneDragStart = useCallback((paneKey) => {
        setDraggedPaneKey(paneKey);
        setActiveDropZone(null);
    }, []);

    const handlePaneDragEnd = useCallback(() => {
        setDraggedPaneKey(null);
        setActiveDropZone(null);
    }, []);

    const handleDropZoneDrop = useCallback((dropZoneKey) => {
        if (!draggedPaneKey) {
            setActiveDropZone(null);
            return;
        }

        const nextLayoutMode = resolveLayoutModeForDropZone(draggedPaneKey, dropZoneKey);
        setLayoutMode(nextLayoutMode);
        commitPreferenceChange(nextLayoutMode, splitByAxisRef.current);
        setDraggedPaneKey(null);
        setActiveDropZone(null);
    }, [commitPreferenceChange, draggedPaneKey]);

    const renderPane = useCallback((pane, index, isSinglePane = false) => {
        const paneConfig = paneDefinitions?.[pane.paneKey] || {
            title: pane.paneKey,
            subtitle: '',
            content: null,
        };

        const isFirstPane = index === 0;
        const paneStyle = isSinglePane
            ? { flex: '1 1 auto' }
            : isFirstPane
            ? activeAxis === 'horizontal'
                ? {
                    width: `${firstPaneSize}%`,
                    flex: `0 0 ${firstPaneSize}%`,
                    maxWidth: `${firstPaneSize}%`,
                }
                : {
                    height: `${firstPaneSize}%`,
                    flex: `0 0 ${firstPaneSize}%`,
                    maxHeight: `${firstPaneSize}%`,
                }
            : { flex: '1 1 0%' };

        return (
            <section
                key={pane.slotKey}
                className={`vehicle-tracking-workspace__pane vehicle-tracking-workspace__pane--${pane.paneKey}`}
                style={paneStyle}
            >
                <header
                    className="vehicle-tracking-workspace__pane-header"
                    draggable
                    onDragStart={() => handlePaneDragStart(pane.slotKey)}
                    onDragEnd={handlePaneDragEnd}
                >
                    {(paneConfig.title || paneConfig.subtitle) ? (
                        <div>
                            {paneConfig.title ? <div className="vehicle-tracking-workspace__pane-title">{paneConfig.title}</div> : null}
                            {paneConfig.subtitle ? <div className="vehicle-tracking-workspace__pane-subtitle">{paneConfig.subtitle}</div> : null}
                        </div>
                    ) : <div />}
                </header>
                <div className="vehicle-tracking-workspace__pane-body">
                    {paneConfig.content}
                </div>
            </section>
        );
    }, [activeAxis, firstPaneSize, handlePaneDragEnd, handlePaneDragStart, paneDefinitions]);

    return (
        <div className="vehicle-tracking-workspace">
            <div
                ref={containerRef}
                className={`vehicle-tracking-workspace__surface vehicle-tracking-workspace__surface--${activeAxis}`}
            >
                {orderedVisiblePanes.length === 0 ? (
                    <section className="vehicle-tracking-workspace__pane" style={{ flex: '1 1 auto' }}>
                        <div className="vehicle-tracking-workspace__pane-body tw-flex tw-h-full tw-items-center tw-justify-center tw-bg-white tw-text-center">
                            <div className="tw-max-w-sm tw-px-6 tw-text-[#5a6360]">
                                <i className="fa-light fa-panels-lean-right tw-mb-3 tw-text-3xl tw-text-[#9aa09d]"></i>
                                <div className="tw-text-[15px] tw-font-semibold tw-text-[#111813]">No workspace panes enabled</div>
                                <div className="tw-mt-1 tw-text-[13px]">Open the Panels controller and enable Vehicles or Map to continue.</div>
                            </div>
                        </div>
                    </section>
                ) : orderedVisiblePanes.length === 1 ? (
                    renderPane(orderedVisiblePanes[0], 0, true)
                ) : (
                    <>
                        {renderPane(orderedVisiblePanes[0], 0)}
                        <div
                            className={`vehicle-tracking-workspace__resizer vehicle-tracking-workspace__resizer--${activeAxis}`}
                            onMouseDown={handleResizeStart}
                            role="separator"
                            aria-orientation={activeAxis === 'horizontal' ? 'vertical' : 'horizontal'}
                            aria-label="Resize tracking panels"
                        >
                            <span className="vehicle-tracking-workspace__resizer-handle"></span>
                        </div>
                        {renderPane(orderedVisiblePanes[1], 1)}
                    </>
                )}

                {draggedPaneKey && orderedVisiblePanes.length > 1 && (
                    <div className="vehicle-tracking-workspace__drop-overlay">
                        {DROP_ZONES.map((dropZone) => (
                            <div
                                key={dropZone.key}
                                className={`vehicle-tracking-workspace__drop-zone vehicle-tracking-workspace__drop-zone--${dropZone.key} ${activeDropZone === dropZone.key ? 'is-active' : ''}`}
                                onDragOver={(event) => {
                                    event.preventDefault();
                                    event.dataTransfer.dropEffect = 'move';
                                    if (activeDropZone !== dropZone.key) {
                                        setActiveDropZone(dropZone.key);
                                    }
                                }}
                                onDragEnter={() => setActiveDropZone(dropZone.key)}
                                onDragLeave={() => {
                                    if (activeDropZone === dropZone.key) {
                                        setActiveDropZone(null);
                                    }
                                }}
                                onDrop={(event) => {
                                    event.preventDefault();
                                    handleDropZoneDrop(dropZone.key);
                                }}
                            >
                                <div className="vehicle-tracking-workspace__drop-zone-chip">
                                    <i className={`fa-light ${dropZone.icon}`}></i>
                                    <span>{dropZone.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VehicleTrackingWorkspaceLayout;
