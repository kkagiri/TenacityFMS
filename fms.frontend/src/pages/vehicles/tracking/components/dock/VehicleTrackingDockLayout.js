/**
 * File: VehicleTrackingDockLayout.js
 * Purpose: Wraps flexlayout-react to provide the full MDI docking system for vehicle tracking
 * Dependencies: React, flexlayout-react, vehicleTrackingDockConfig
 * Last Modified: 2026-03-17
 *
 * Key Components:
 * - VehicleTrackingDockLayout(): Renders the FlexLayout dock manager with panel factory, tab rendering, and workspace persistence
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Layout, Model, Actions, DockLocation } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import {
    PANEL_REGISTRY,
    createDefaultModel,
    createWorkspaceModel,
    loadDockLayout,
    loadWorkspaceName,
    saveDockLayout,
} from '../../vehicleTrackingDockConfig';
import VehicleTrackingMenuBar from './VehicleTrackingMenuBar';
import './VehicleTrackingDockLayout.scss';

const SAVE_DEBOUNCE_MS = 600;

/**
 * Contextual actions per panel type. Maps panel component id to extra dropdown items.
 * These appear in the ∨ dropdown on each individual tab button.
 */
const PANEL_CONTEXT_ACTIONS = {
    geofence: [
        { id: 'manage-geofences', label: 'Manage Geofences', icon: 'fa-light fa-draw-polygon' },
    ],
    trips: [
        { id: 'refresh-trips', label: 'Refresh Trips', icon: 'fa-light fa-arrows-rotate' },
    ],
    vehicles: [
        { id: 'export-list', label: 'Export List', icon: 'fa-light fa-file-export' },
    ],
};

/**
 * Dropdown that appears when the (∨) button on an individual tab is clicked.
 * Shows panel-specific context actions for that tab's component type.
 */
const TabDropdown = ({ tabNode, model, onClose, onContextAction }) => {
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const component = tabNode.getComponent?.() || null;
    const contextItems = component ? (PANEL_CONTEXT_ACTIONS[component] || []) : [];
    const canPopout = tabNode.isEnablePopout?.() !== false;

    if (contextItems.length === 0 && !canPopout) return null;

    return (
        <div ref={dropdownRef} className="vt-tabset-dropdown" role="menu">
            {canPopout && (
                <button
                    type="button"
                    className="vt-tabset-dropdown__item"
                    onClick={() => {
                        model.doAction(Actions.popoutTab(tabNode.getId()));
                        onClose();
                    }}
                    role="menuitem"
                >
                    <i className="fa-light fa-arrow-up-right-from-square vt-tabset-dropdown__icon" />
                    <span>Pop Out to Window</span>
                </button>
            )}
            {canPopout && contextItems.length > 0 && (
                <div className="vt-tabset-dropdown__separator" />
            )}
            {contextItems.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    className="vt-tabset-dropdown__item"
                    onClick={() => { onContextAction?.(item.id, component); onClose(); }}
                    role="menuitem"
                >
                    <i className={`${item.icon} vt-tabset-dropdown__icon`} />
                    <span>{item.label}</span>
                </button>
            ))}
        </div>
    );
};

const VehicleTrackingDockLayout = ({ panelContentMap }) => {
    const layoutRef = useRef(null);
    const saveTimeoutRef = useRef(null);
    const [activeWorkspace, setActiveWorkspace] = useState(() => loadWorkspaceName());
    const [modelVersion, setModelVersion] = useState(0);
    const [tabDropdown, setTabDropdown] = useState(null);

    const [model] = useState(() => {
        const savedLayout = loadDockLayout();
        try {
            if (savedLayout) {
                return Model.fromJson(savedLayout);
            }
        } catch (error) {
            console.warn('[VehicleTrackingDock] Failed to restore saved layout, using default:', error);
        }
        return Model.fromJson(createDefaultModel());
    });

    const persistLayout = useCallback(() => {
        if (!model) return;
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            try {
                saveDockLayout(model.toJson(), activeWorkspace);
            } catch (error) {
                console.warn('[VehicleTrackingDock] Failed to persist layout:', error);
            }
        }, SAVE_DEBOUNCE_MS);
    }, [activeWorkspace, model]);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const factory = useCallback((node) => {
        const component = node.getComponent();
        const content = panelContentMap?.[component];

        if (content) {
            return (
                <div className="vt-dock-panel-content">
                    {content}
                </div>
            );
        }

        const panelDef = PANEL_REGISTRY[component];
        return (
            <div className="vt-dock-panel-content vt-dock-panel-content--empty">
                <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-text-center">
                    <div className="tw-max-w-xs tw-px-6">
                        <i className={`${panelDef?.icon || 'fa-light fa-window'} tw-mb-3 tw-text-3xl tw-text-[#9aa09d]`}></i>
                        <div className="tw-text-[14px] tw-font-semibold tw-text-[#111813]">{panelDef?.label || component}</div>
                        <div className="tw-mt-1 tw-text-[12px] tw-text-[#5a6360]">Panel content not available</div>
                    </div>
                </div>
            </div>
        );
    }, [panelContentMap]);

    const handleModelChange = useCallback(() => {
        setModelVersion((v) => v + 1);
        persistLayout();
    }, [persistLayout]);

    const titleFactory = useCallback((node) => {
        const component = node.getComponent();
        const panelDef = PANEL_REGISTRY[component];
        if (!panelDef) return undefined;

        return (
            <span className="vt-dock-tab-title">
                <i className={`${panelDef.icon} vt-dock-tab-title__icon`}></i>
                <span>{node.getName()}</span>
            </span>
        );
    }, []);

    const iconFactory = useCallback((node) => {
        const component = node.getComponent();
        const panelDef = PANEL_REGISTRY[component];
        if (!panelDef) return undefined;
        return <i className={panelDef.icon}></i>;
    }, []);

    const openPanelIds = useMemo(() => {
        const ids = new Set();
        if (!model) return [];
        model.visitNodes((node) => {
            if (node.getType() === 'tab') {
                ids.add(node.getId());
            }
        });
        return Array.from(ids);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [model, modelVersion]);

    const handleAddPanel = useCallback((panelId) => {
        if (!model || !layoutRef.current) return;

        // Check if panel already exists — if so focus it
        let existingNode = null;
        model.visitNodes((node) => {
            if (node.getType() === 'tab' && node.getId() === panelId) {
                existingNode = node;
            }
        });

        if (existingNode) {
            model.doAction(Actions.selectTab(panelId));
            return;
        }

        const panelDef = PANEL_REGISTRY[panelId];
        if (!panelDef) return;

        // Find the active tabset or the first tabset to add to
        let targetTabsetId = null;
        model.visitNodes((node) => {
            if (!targetTabsetId && node.getType() === 'tabset') {
                targetTabsetId = node.getId();
            }
        });

        if (targetTabsetId) {
            model.doAction(Actions.addNode(
                {
                    type: 'tab',
                    id: panelId,
                    name: panelDef.label,
                    component: panelDef.component,
                    enableClose: panelDef.enableClose !== false,
                },
                targetTabsetId,
                DockLocation.CENTER,
                -1,
                true,
            ));
        }
    }, [model]);

    const handleMinimizeTabset = useCallback((tabsetNode) => {
        if (!model) return;
        const children = tabsetNode.getChildren();
        for (let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            model.doAction(Actions.moveNode(child.getId(), 'border_bottom', DockLocation.CENTER, -1));
        }
    }, [model]);

    const handleToggleTabDropdown = useCallback((tabNode, event) => {
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        setTabDropdown((prev) => {
            if (prev && prev.tabId === tabNode.getId()) return null;
            return { tabId: tabNode.getId(), tabNode, x: rect.right + 2, y: rect.bottom + 2 };
        });
    }, []);

    const closeTabDropdown = useCallback(() => setTabDropdown(null), []);

    const renderTab = useCallback((node, renderValues) => {
        const component = node.getComponent();
        const panelDef = PANEL_REGISTRY[component];

        // Leading icon
        if (panelDef?.icon) {
            renderValues.leading = <i className={`${panelDef.icon} tw-mr-1.5 tw-text-[11px]`}></i>;
        }

        // Add ∨ dropdown button before the X close button — for tabs with context actions or popout
        const hasContextActions = PANEL_CONTEXT_ACTIONS[component]?.length > 0;
        const canPopout = node.isEnablePopout?.() !== false;
        if (hasContextActions || canPopout) {
            renderValues.buttons.push(
                <div
                    key="tab-dropdown-btn"
                    className="vt-tab-dropdown-btn"
                    title="Panel options"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => handleToggleTabDropdown(node, e)}
                >
                    <i className="fa-light fa-chevron-down" />
                </div>,
            );
        }
    }, [handleToggleTabDropdown]);

    const renderTabSet = useCallback((tabsetNode, renderValues) => {
        // Minimize (–) — always rightmost via CSS order
        renderValues.buttons.push(
            <button
                key="minimize-btn"
                type="button"
                className="vt-tabset-btn vt-tabset-btn--minimize"
                title="Minimize"
                onClick={() => handleMinimizeTabset(tabsetNode)}
            >
                <i className="fa-light fa-window-minimize" />
            </button>,
        );
    }, [handleMinimizeTabset]);

    const handleSelectWorkspace = useCallback((presetKey) => {
        if (!model) return;
        try {
            const presetJson = createWorkspaceModel(presetKey);
            const newModel = Model.fromJson(presetJson);

            // Replace current model by loading a fresh one — we need to re-render
            // FlexLayout doesn't support model swapping, so we persist and reload
            saveDockLayout(presetJson, presetKey);
            setActiveWorkspace(presetKey);
            window.location.reload();
        } catch (error) {
            console.warn('[VehicleTrackingDock] Failed to apply workspace preset:', error);
        }
    }, [model]);

    const handleResetLayout = useCallback(() => {
        try {
            const defaultJson = createDefaultModel();
            saveDockLayout(defaultJson, 'default');
            setActiveWorkspace('default');
            window.location.reload();
        } catch (error) {
            console.warn('[VehicleTrackingDock] Failed to reset layout:', error);
        }
    }, []);

    return (
        <div className="vt-dock-container tw-flex tw-h-full tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-hidden">
            <VehicleTrackingMenuBar
                activeWorkspace={activeWorkspace}
                onAddPanel={handleAddPanel}
                onResetLayout={handleResetLayout}
                onSelectWorkspace={handleSelectWorkspace}
                openPanelIds={openPanelIds}
            />
            <div className="vt-dock-layout tw-flex-1 tw-min-h-0 tw-overflow-hidden">
                <Layout
                    ref={layoutRef}
                    model={model}
                    factory={factory}
                    titleFactory={titleFactory}
                    iconFactory={iconFactory}
                    onModelChange={handleModelChange}
                    onRenderTabSet={renderTabSet}
                    onRenderTab={renderTab}
                    supportsPopout={true}
                    popoutURL={process.env.PUBLIC_URL + '/popout.html'}
                />
            </div>

            {tabDropdown && createPortal(
                <div
                    className="vt-tabset-dropdown-portal"
                    style={{ position: 'fixed', left: tabDropdown.x, top: tabDropdown.y, zIndex: 9999 }}
                >
                    <TabDropdown
                        tabNode={tabDropdown.tabNode}
                        model={model}
                        onClose={closeTabDropdown}
                        onContextAction={(actionId, panelType) => {
                            // Extensible: handle contextual panel actions here
                            console.log('[VehicleTrackingDock] Context action:', actionId, 'panel:', panelType);
                        }}
                    />
                </div>,
                document.body,
            )}
        </div>
    );
};

export default VehicleTrackingDockLayout;
