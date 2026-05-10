/**
 * File: VehicleTrackingPage.js
 * Purpose: Composes the vehicle tracking workspace, toolbar, dock panels, and supporting overlays
 * Dependencies: React, DevExtreme controls, tracking workspace panels, useVehicleTrackingPageController
 * Last Modified: 2026-03-23
 *
 * Key Functions:
 * - VehicleTrackingPage(): Renders the tracking toolbar, dock layout, geofence dialog, and trip overlays
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LoadPanel } from 'devextreme-react/load-panel';
import SelectBox from 'devextreme-react/select-box';
import GeofenceCreateForm from '../../../components/geofenceManagement/GeofenceCreateForm';
import VehicleTripDetailPanel from '../trips/components/VehicleTripDetailPanel';
import VehicleTripOverridePanel from '../trips/components/VehicleTripOverridePanel';
import VehicleTrackingDetailPanelContent from './components/detail/VehicleTrackingDetailPanelContent';
import VehicleTrackingDockLayout from './components/dock/VehicleTrackingDockLayout';
import VehicleTrackingDashboardPanel from './components/dock/VehicleTrackingDashboardPanel';
import VehicleTrackingGeofencePanel from './components/geofence/VehicleTrackingGeofencePanel';
import VehicleTrackingGeofenceWorkspacePanel from './components/geofence/VehicleTrackingGeofenceWorkspacePanel';
import VehicleTrackingTripPanel, { VehicleTrackingTripContent } from './components/trips/VehicleTrackingTripPanel';
import VehicleTrackingTripAnalysisPanel from './components/trips/VehicleTrackingTripAnalysisPanel';
import VehicleTrackingTracksPanel from './components/tracks/VehicleTrackingTracksPanel';
import VehicleTrackingTrackPointsPanel from './components/tracks/VehicleTrackingTrackPointsPanel';
import VehicleTrackingGraphPanel from './components/tracks/VehicleTrackingGraphPanel';
import TrackDrawingPlaygroundPopup from './components/tracks/TrackDrawingPlaygroundPopup';
import { VehicleTrackingMapPanel, VehicleTrackingSidebarPanel } from './components/workspace/VehicleTrackingPanels';
import useTrackDrawing from './hooks/useTrackDrawing';
import useVehicleTrackingPageController from './hooks/useVehicleTrackingPageController';
import './VehicleTrackingPage.scss';

const VehicleTrackingPage = () => {
    const [selectedTrackDays, setSelectedTrackDays] = useState([]);
    const [activeTrackPoints, setActiveTrackPoints] = useState([]);
    const [isTrackDrawingPlaygroundVisible, setIsTrackDrawingPlaygroundVisible] = useState(false);
    const [trackReloadToken, setTrackReloadToken] = useState(0);
    const [isTrackPointsLoading, setIsTrackPointsLoading] = useState(false);
    const [pendingTrackAction, setPendingTrackAction] = useState(null);

    const handleTrackDaysSelected = useCallback((days, points = []) => {
        setSelectedTrackDays(days);
        setActiveTrackPoints(points);
        setPendingTrackAction(null);
    }, []);

    const dockLayoutRef = useRef(null);

    const handleRefreshTrackData = useCallback(() => {
        setTrackReloadToken((currentValue) => currentValue + 1);
    }, []);

    const handleOpenTrackDrawingPlayground = useCallback(() => {
        setIsTrackDrawingPlaygroundVisible(true);
    }, []);

    const handleCloseTrackDrawingPlayground = useCallback(() => {
        setIsTrackDrawingPlaygroundVisible(false);
    }, []);

    const {
        dockPanelData,
        geofenceDialogProps,
        geofenceFormProps,
        geofenceWorkspaceProps,
        gridPanelProps,
        handlePageContextMenu,
        loadPanelVisible,
        mapPanelProps,
        toolbarProps,
        tripDetailPanelProps,
        tripOverridePanelProps,
        tripPanelProps,
        focusMapOnCoordinate,
        isTrackingGeofenceLoading,
        mapRef,
    } = useVehicleTrackingPageController();

    const handleGraphPointClick = useCallback((lat, lng) => {
        focusMapOnCoordinate(lat, lng);
    }, [focusMapOnCoordinate]);

    const { drawOptions, setDrawOptions, redrawDrawing, drawingStats } = useTrackDrawing(mapRef, activeTrackPoints);

    const handleTrackPointsLoaded = useCallback((points) => {
        setActiveTrackPoints(points);
    }, []);

    const handleTrackPointLoadingChange = useCallback((loading) => {
        setIsTrackPointsLoading(loading);
    }, []);

    useEffect(() => {
        if (!pendingTrackAction || activeTrackPoints.length === 0) {
            return;
        }

        if (pendingTrackAction === 'draw-map') {
            dockLayoutRef.current?.focusPanel('map');
            redrawDrawing();
        }

        if (pendingTrackAction === 'draw-graph') {
            dockLayoutRef.current?.focusPanel('trackgraph');
        }

        setPendingTrackAction(null);
    }, [activeTrackPoints.length, pendingTrackAction, redrawDrawing]);

    const handleDrawGraph = useCallback(() => {
        if (activeTrackPoints.length > 0) {
            dockLayoutRef.current?.focusPanel('trackgraph');
            return;
        }

        if (selectedTrackDays.length > 0) {
            setPendingTrackAction('draw-graph');
            dockLayoutRef.current?.focusPanel('trackpoints');
        }
    }, [activeTrackPoints.length, selectedTrackDays.length]);

    const handleDrawTracks = useCallback(() => {
        if (activeTrackPoints.length === 0 && selectedTrackDays.length > 0) {
            setPendingTrackAction('draw-map');
            dockLayoutRef.current?.focusPanel('trackpoints');
            return;
        }

        dockLayoutRef.current?.focusPanel('map');
        redrawDrawing();
    }, [activeTrackPoints.length, redrawDrawing, selectedTrackDays.length]);

    const handleDockPanelContextAction = useCallback((actionId, panelType) => {
        if (actionId === 'open-track-drawing-playground' && (panelType === 'tracks' || panelType === 'trackpoints')) {
            handleOpenTrackDrawingPlayground();
        }
    }, [handleOpenTrackDrawingPlayground]);


    const {
        inProgressTrips,
        isTripLoading,
        lastTripUpdated,
        lowConfidenceCount,
        recentTrips,
        refreshTrips,
        selectedVehicle,
        selectedVehicleId,
        selectedVehicleLabel,
        stats,
    } = dockPanelData;

    const { trackedVehicleIds, trackedVehicles } = gridPanelProps;
    const trackedVehiclesLabel = trackedVehicles.length === 1
        ? (trackedVehicles[0]?.trackingCode || `Vehicle #${trackedVehicles[0]?.id}`)
        : trackedVehicles.length > 1
            ? `${trackedVehicles.length} tracked vehicles`
            : null;

    const {
        inProgressTripCount,
        onOpenTripsPage,
        onTrackingViewChange,
        selectedTagId,
        tags,
    } = toolbarProps;

    const dockPanelContentMap = useMemo(() => ({
        dashboard: (
            <VehicleTrackingDashboardPanel
                inProgressTripCount={inProgressTrips.length}
                lowConfidenceCount={lowConfidenceCount}
                stats={stats}
            />
        ),
        detail: (
            <div className="vehicle-tracking-panel vehicle-tracking-panel--docked vehicle-tracking-panel--open">
                <VehicleTrackingDetailPanelContent
                    isDocked={true}
                    vehicleId={selectedVehicleId}
                    vehicleSnapshot={selectedVehicle}
                />
            </div>
        ),
        geofence: <VehicleTrackingGeofenceWorkspacePanel {...geofenceWorkspaceProps} />,
        map: <VehicleTrackingMapPanel {...mapPanelProps} />,
        trips: (
            <VehicleTrackingTripContent
                inProgressTrips={inProgressTrips}
                recentTrips={recentTrips}
                isLoading={isTripLoading}
                lastUpdated={lastTripUpdated}
                selectedVehicleId={selectedVehicleId}
                selectedVehicleLabel={selectedVehicleLabel}
                onOpenTripDetail={tripPanelProps.onOpenTripDetail}
                onRefresh={refreshTrips}
            />
        ),
        vehicles: <VehicleTrackingSidebarPanel {...gridPanelProps} />,
        tracks: (
            <VehicleTrackingTracksPanel
                trackedVehicles={trackedVehicles}
                onTrackDaysSelected={handleTrackDaysSelected}
                drawOptions={drawOptions}
                onDraw={handleDrawTracks}
                onDrawOptionsChange={setDrawOptions}
                reloadToken={trackReloadToken}
            />
        ),
        trackpoints: (
            <VehicleTrackingTrackPointsPanel
                trackedVehicles={trackedVehicles}
                selectedTrackDays={selectedTrackDays}
                prefetchedTrackPoints={activeTrackPoints}
                onTrackPointsLoaded={handleTrackPointsLoaded}
                onTrackPointLoadingChange={handleTrackPointLoadingChange}
                onDrawGraph={handleDrawGraph}
                drawOptions={drawOptions}
                onDraw={handleDrawTracks}
                onDrawOptionsChange={setDrawOptions}
                drawingStats={drawingStats}
                onOpenDrawingPlayground={handleOpenTrackDrawingPlayground}
                onRefreshTrackData={handleRefreshTrackData}
            />
        ),
        trackgraph: (
            <VehicleTrackingGraphPanel
                trackPoints={activeTrackPoints}
                vehicleLabel={trackedVehiclesLabel}
                onPointClick={handleGraphPointClick}
                isLoading={isTrackPointsLoading}
            />
        ),
        tripanalysis: (
            <VehicleTrackingTripAnalysisPanel
                trackedVehicles={trackedVehicles}
                activeTrackPoints={activeTrackPoints}
                mapRef={mapRef}
            />
        ),
    }), [
        activeTrackPoints,
        drawOptions,
        handleDrawTracks,
        setDrawOptions,
        handleDrawGraph,
        handleGraphPointClick,
        handleOpenTrackDrawingPlayground,
        handleRefreshTrackData,
        handleTrackDaysSelected,
        handleTrackPointLoadingChange,
        handleTrackPointsLoaded,
        isTrackPointsLoading,
        selectedTrackDays,
        geofenceWorkspaceProps,
        gridPanelProps,
        inProgressTrips,
        isTripLoading,
        lastTripUpdated,
        lowConfidenceCount,
        mapPanelProps,
        recentTrips,
        refreshTrips,
        selectedVehicle,
        selectedVehicleId,
        selectedVehicleLabel,
        stats,
        trackReloadToken,
        trackedVehicles,
        trackedVehiclesLabel,
        tripPanelProps,
    ]);

    const menuBarContent = useMemo(() => (
        <div className="vehicle-tracking-toolbar__field-group vehicle-tracking-toolbar__field-group--floating">
            <div className="vehicle-tracking-toolbar__select-wrap">
                <SelectBox
                    className="vehicle-tracking-toolbar__selectbox"
                    inputAttr={{
                        id: 'vehicle-tracking-view-selector',
                        'aria-label': 'Vehicle view',
                    }}
                    width="100%"
                    dataSource={tags}
                    value={selectedTagId}
                    valueExpr="id"
                    displayExpr="name"
                    onValueChanged={onTrackingViewChange}
                    searchEnabled={true}
                    searchExpr="name"
                    showClearButton={false}
                    disabled={tags.length === 0}
                    noDataText="No views available"
                    stylingMode="outlined"
                />
            </div>
        </div>
    ), [onTrackingViewChange, selectedTagId, tags]);

    return (
        <div
            className="vehicle-tracking-page tw-flex tw-h-full tw-min-h-0 tw-flex-col tw-overflow-hidden"
            onContextMenu={handlePageContextMenu}
        >
            <LoadPanel visible={loadPanelVisible} />

            <VehicleTrackingDockLayout
                ref={dockLayoutRef}
                menuBarContent={menuBarContent}
                panelContentMap={dockPanelContentMap}
                onPanelContextAction={handleDockPanelContextAction}
            />

            <TrackDrawingPlaygroundPopup
                visible={isTrackDrawingPlaygroundVisible}
                onHiding={handleCloseTrackDrawingPlayground}
                drawOptions={drawOptions}
                onDrawOptionsChange={setDrawOptions}
                drawingStats={drawingStats}
                onRedraw={handleDrawTracks}
            />

            <VehicleTrackingGeofencePanel {...geofenceDialogProps}>
                <div className="tw-bg-[#faf9f8] tw-p-4">
                    {isTrackingGeofenceLoading ? (
                        <div className="tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-p-6 tw-text-sm tw-text-gray-600">
                            Loading geofence setup...
                        </div>
                    ) : (
                        <GeofenceCreateForm {...geofenceFormProps} />
                    )}
                </div>
            </VehicleTrackingGeofencePanel>

            <VehicleTrackingTripPanel {...tripPanelProps} />
            <VehicleTripDetailPanel {...tripDetailPanelProps} />
            <VehicleTripOverridePanel {...tripOverridePanelProps} />
        </div>
    );
};

export default VehicleTrackingPage;