/**
 * File: vehicleTrackingDockConfig.js
 * Purpose: Defines the FlexLayout model configuration, panel registry, and workspace presets for the MDI docking system
 * Dependencies: flexlayout-react
 * Last Modified: 2026-03-17
 *
 * Key Exports:
 * - PANEL_REGISTRY: Available panel definitions with icons, labels, and default placement
 * - WORKSPACE_PRESETS: Named layout configurations that can be saved/restored
 * - createDefaultModel(): Creates the initial FlexLayout JSON model
 * - createWorkspaceModel(): Creates a model from a named workspace preset
 */

const DOCK_LAYOUT_STORAGE_KEY = 'fms_vehicle_tracking_dock_layout';
const DOCK_WORKSPACE_NAME_KEY = 'fms_vehicle_tracking_workspace_name';

export const PANEL_REGISTRY = {
    map: {
        id: 'map',
        label: 'Map',
        icon: 'fa-light fa-map',
        component: 'map',
        enableClose: false,
    },
    vehicles: {
        id: 'vehicles',
        label: 'Vehicles',
        icon: 'fa-light fa-cars',
        component: 'vehicles',
        enableClose: true,
    },
    geofence: {
        id: 'geofence',
        label: 'Geofence',
        icon: 'fa-light fa-draw-polygon',
        component: 'geofence',
        enableClose: true,
    },
    trips: {
        id: 'trips',
        label: 'Trips',
        icon: 'fa-light fa-route',
        component: 'trips',
        enableClose: true,
    },
    detail: {
        id: 'detail',
        label: 'Vehicle Detail',
        icon: 'fa-light fa-car',
        component: 'detail',
        enableClose: true,
    },
    dashboard: {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'fa-light fa-chart-mixed',
        component: 'dashboard',
        enableClose: true,
    },
    tracks: {
        id: 'tracks',
        label: 'Tracks',
        icon: 'fa-light fa-road',
        component: 'tracks',
        enableClose: true,
    },
    trackpoints: {
        id: 'trackpoints',
        label: 'Track Points',
        icon: 'fa-light fa-location-dot',
        component: 'trackpoints',
        enableClose: true,
    },
    trackgraph: {
        id: 'trackgraph',
        label: 'Track Graph',
        icon: 'fa-light fa-chart-line',
        component: 'trackgraph',
        enableClose: true,
    },
};

/**
 * Default layout: Map in the center, Vehicles docked right, Geofence as a tab with Vehicles
 */
const createDefaultLayoutJson = () => ({
    global: {
        tabEnableClose: true,
        tabEnableFloat: true,
        tabEnableRename: false,
        tabSetEnableMaximize: true,
        tabSetEnableClose: false,
        tabSetMinWidth: 180,
        tabSetMinHeight: 120,
        borderMinSize: 100,
        borderBarSize: 32,
        splitterSize: 6,
        splitterExtra: 4,
        tabSetHeaderHeight: 30,
        tabSetTabStripHeight: 30,
        enableEdgeDock: true,
    },
    borders: [
        {
            type: 'border',
            location: 'bottom',
            size: 200,
            children: [],
            barSize: 32,
        },
        {
            type: 'border',
            location: 'left',
            size: 200,
            children: [],
            barSize: 32,
        },
        {
            type: 'border',
            location: 'right',
            size: 200,
            children: [],
            barSize: 32,
        },
    ],
    layout: {
        type: 'row',
        weight: 100,
        children: [
            {
                type: 'row',
                weight: 65,
                children: [
                    {
                        type: 'tabset',
                        weight: 100,
                        id: 'tabset-map',
                        children: [
                            {
                                type: 'tab',
                                id: 'map',
                                name: 'Map',
                                component: 'map',
                                enableClose: false,
                            },
                        ],
                    },
                ],
            },
            {
                type: 'row',
                weight: 35,
                children: [
                    {
                        type: 'tabset',
                        weight: 60,
                        id: 'tabset-sidebar',
                        children: [
                            {
                                type: 'tab',
                                id: 'vehicles',
                                name: 'Vehicles',
                                component: 'vehicles',
                                enableClose: true,
                            },
                            {
                                type: 'tab',
                                id: 'geofence',
                                name: 'Geofence',
                                component: 'geofence',
                                enableClose: true,
                            },
                        ],
                        active: true,
                    },
                    {
                        type: 'tabset',
                        weight: 40,
                        id: 'tabset-detail',
                        children: [
                            {
                                type: 'tab',
                                id: 'dashboard',
                                name: 'Dashboard',
                                component: 'dashboard',
                                enableClose: true,
                            },
                        ],
                    },
                ],
            },
        ],
    },
});

/**
 * Workspace presets
 */
export const WORKSPACE_PRESETS = {
    default: {
        label: 'Default',
        icon: 'fa-light fa-grid-2',
        description: 'Map center, Vehicles + Geofence right, Dashboard below',
        create: createDefaultLayoutJson,
    },
    mapFocused: {
        label: 'Map Focused',
        icon: 'fa-light fa-map',
        description: 'Full-screen map with panels minimised to borders',
        create: () => ({
            global: createDefaultLayoutJson().global,
            borders: [
                {
                    type: 'border',
                    location: 'bottom',
                    size: 200,
                    children: [],
                    barSize: 32,
                },
                {
                    type: 'border',
                    location: 'left',
                    size: 280,
                    children: [
                        {
                            type: 'tab',
                            id: 'vehicles',
                            name: 'Vehicles',
                            component: 'vehicles',
                            enableClose: true,
                        },
                    ],
                    barSize: 32,
                },
                {
                    type: 'border',
                    location: 'right',
                    size: 280,
                    children: [
                        {
                            type: 'tab',
                            id: 'geofence',
                            name: 'Geofence',
                            component: 'geofence',
                            enableClose: true,
                        },
                        {
                            type: 'tab',
                            id: 'dashboard',
                            name: 'Dashboard',
                            component: 'dashboard',
                            enableClose: true,
                        },
                    ],
                    barSize: 32,
                },
            ],
            layout: {
                type: 'row',
                weight: 100,
                children: [
                    {
                        type: 'tabset',
                        weight: 100,
                        id: 'tabset-map',
                        children: [
                            {
                                type: 'tab',
                                id: 'map',
                                name: 'Map',
                                component: 'map',
                                enableClose: false,
                            },
                        ],
                    },
                ],
            },
        }),
    },
    splitView: {
        label: 'Split View',
        icon: 'fa-light fa-columns-3',
        description: 'Three columns: Vehicles, Map, Detail',
        create: () => ({
            global: createDefaultLayoutJson().global,
            borders: [
                {
                    type: 'border',
                    location: 'bottom',
                    size: 200,
                    children: [],
                    barSize: 32,
                },
                {
                    type: 'border',
                    location: 'left',
                    size: 200,
                    children: [],
                    barSize: 32,
                },
                {
                    type: 'border',
                    location: 'right',
                    size: 200,
                    children: [],
                    barSize: 32,
                },
            ],
            layout: {
                type: 'row',
                weight: 100,
                children: [
                    {
                        type: 'tabset',
                        weight: 25,
                        id: 'tabset-sidebar',
                        children: [
                            {
                                type: 'tab',
                                id: 'vehicles',
                                name: 'Vehicles',
                                component: 'vehicles',
                                enableClose: true,
                            },
                            {
                                type: 'tab',
                                id: 'geofence',
                                name: 'Geofence',
                                component: 'geofence',
                                enableClose: true,
                            },
                        ],
                    },
                    {
                        type: 'tabset',
                        weight: 50,
                        id: 'tabset-map',
                        children: [
                            {
                                type: 'tab',
                                id: 'map',
                                name: 'Map',
                                component: 'map',
                                enableClose: false,
                            },
                        ],
                    },
                    {
                        type: 'tabset',
                        weight: 25,
                        id: 'tabset-detail',
                        children: [
                            {
                                type: 'tab',
                                id: 'dashboard',
                                name: 'Dashboard',
                                component: 'dashboard',
                                enableClose: true,
                            },
                            {
                                type: 'tab',
                                id: 'trips',
                                name: 'Trips',
                                component: 'trips',
                                enableClose: true,
                            },
                        ],
                    },
                ],
            },
        }),
    },
    trackAnalysis: {
        label: 'Track Analysis',
        icon: 'fa-light fa-road',
        description: 'Map left, Tracks + TrackPoints right, Graph at bottom',
        create: () => ({
            global: createDefaultLayoutJson().global,
            borders: [
                { type: 'border', location: 'bottom', size: 200, children: [], barSize: 32 },
                { type: 'border', location: 'left', size: 200, children: [], barSize: 32 },
                { type: 'border', location: 'right', size: 200, children: [], barSize: 32 },
            ],
            layout: {
                type: 'row',
                weight: 100,
                children: [
                    {
                        type: 'tabset',
                        weight: 50,
                        id: 'tabset-map',
                        children: [
                            { type: 'tab', id: 'map', name: 'Map', component: 'map', enableClose: false },
                        ],
                    },
                    {
                        type: 'column',
                        weight: 50,
                        children: [
                            {
                                type: 'row',
                                weight: 50,
                                children: [
                                    {
                                        type: 'tabset',
                                        weight: 40,
                                        id: 'tabset-tracks',
                                        children: [
                                            { type: 'tab', id: 'tracks', name: 'Tracks', component: 'tracks', enableClose: true },
                                            { type: 'tab', id: 'vehicles', name: 'Vehicles', component: 'vehicles', enableClose: true },
                                        ],
                                    },
                                    {
                                        type: 'tabset',
                                        weight: 60,
                                        id: 'tabset-trackpoints',
                                        children: [
                                            { type: 'tab', id: 'trackpoints', name: 'Track Points', component: 'trackpoints', enableClose: true },
                                        ],
                                    },
                                ],
                            },
                            {
                                type: 'tabset',
                                weight: 50,
                                id: 'tabset-graph',
                                children: [
                                    { type: 'tab', id: 'trackgraph', name: 'Track Graph', component: 'trackgraph', enableClose: true },
                                    { type: 'tab', id: 'dashboard', name: 'Dashboard', component: 'dashboard', enableClose: true },
                                ],
                            },
                        ],
                    },
                ],
            },
        }),
    },
    monitoring: {
        label: 'Monitoring',
        icon: 'fa-light fa-desktop',
        description: 'Map top, all panels tabbed at bottom',
        create: () => ({
            global: createDefaultLayoutJson().global,
            borders: [
                {
                    type: 'border',
                    location: 'bottom',
                    size: 200,
                    children: [],
                    barSize: 32,
                },
                {
                    type: 'border',
                    location: 'left',
                    size: 200,
                    children: [],
                    barSize: 32,
                },
                {
                    type: 'border',
                    location: 'right',
                    size: 200,
                    children: [],
                    barSize: 32,
                },
            ],
            layout: {
                type: 'row',
                weight: 100,
                children: [
                    {
                        type: 'column',
                        weight: 100,
                        children: [
                            {
                                type: 'tabset',
                                weight: 60,
                                id: 'tabset-map',
                                children: [
                                    {
                                        type: 'tab',
                                        id: 'map',
                                        name: 'Map',
                                        component: 'map',
                                        enableClose: false,
                                    },
                                ],
                            },
                            {
                                type: 'tabset',
                                weight: 40,
                                id: 'tabset-panels',
                                children: [
                                    {
                                        type: 'tab',
                                        id: 'vehicles',
                                        name: 'Vehicles',
                                        component: 'vehicles',
                                        enableClose: true,
                                    },
                                    {
                                        type: 'tab',
                                        id: 'geofence',
                                        name: 'Geofence',
                                        component: 'geofence',
                                        enableClose: true,
                                    },
                                    {
                                        type: 'tab',
                                        id: 'dashboard',
                                        name: 'Dashboard',
                                        component: 'dashboard',
                                        enableClose: true,
                                    },
                                    {
                                        type: 'tab',
                                        id: 'trips',
                                        name: 'Trips',
                                        component: 'trips',
                                        enableClose: true,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        }),
    },
};

export const createDefaultModel = () => createDefaultLayoutJson();

export const createWorkspaceModel = (presetKey) => {
    const preset = WORKSPACE_PRESETS[presetKey];
    if (!preset) {
        return createDefaultLayoutJson();
    }
    return preset.create();
};

export const saveDockLayout = (modelJson, workspaceName = null) => {
    try {
        localStorage.setItem(DOCK_LAYOUT_STORAGE_KEY, JSON.stringify(modelJson));
        if (workspaceName) {
            localStorage.setItem(DOCK_WORKSPACE_NAME_KEY, workspaceName);
        }
    } catch (error) {
        console.warn('[VehicleTrackingDock] Failed to save dock layout:', error);
    }
};

export const loadDockLayout = () => {
    try {
        const raw = localStorage.getItem(DOCK_LAYOUT_STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (error) {
        console.warn('[VehicleTrackingDock] Failed to load dock layout:', error);
        return null;
    }
};

export const loadWorkspaceName = () => {
    try {
        return localStorage.getItem(DOCK_WORKSPACE_NAME_KEY) || 'default';
    } catch {
        return 'default';
    }
};

export const clearDockLayout = () => {
    try {
        localStorage.removeItem(DOCK_LAYOUT_STORAGE_KEY);
        localStorage.removeItem(DOCK_WORKSPACE_NAME_KEY);
    } catch (error) {
        console.warn('[VehicleTrackingDock] Failed to clear dock layout:', error);
    }
};
