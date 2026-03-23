/**
 * File: useVehicleTrackingGeofenceManager.js
 * Purpose: Manages tracking geofence state, CRUD workflows, and form/workspace props for the vehicle tracking page
 * Dependencies: React, geofenceService, geofenceOverlayUtils, DevExtreme notify
 * Last Modified: 2026-03-21
 *
 * Key Functions:
 * - refreshTrackingGeofenceContext(): Loads geofence groups and geofences for the workspace
 * - handleZoomTrackingGeofence(): Enriches and previews a geofence on the map
 * - handleCreateTrackingGeofence(): Persists a new geofence and refreshes the context
 * - handleUpdateTrackingGeofence(): Persists changes to an existing geofence and refreshes the context
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import notify from 'devextreme/ui/notify';
import geofenceService from '../../../../api/geofenceService';
import { resolvePolygonPath, resolveRoutePath } from '../../../../utils/geofenceOverlayUtils';

const emptyTrackingGeofenceShape = {
    centerLatitude: null,
    centerLongitude: null,
    radiusMeters: null,
    coordinates: [],
};

const resolveApiErrorMessage = (error, fallbackMessage) => error?.response?.data?.message || error?.message || fallbackMessage;

const buildShapeFromGeofence = (geofence) => {
    if (!geofence) return emptyTrackingGeofenceShape;

    const type = geofence.geofenceType || 'Circle';
    if (type === 'Circle') {
        return {
            centerLatitude: geofence.centerLatitude ?? null,
            centerLongitude: geofence.centerLongitude ?? null,
            radiusMeters: geofence.radiusMeters ?? null,
            coordinates: [],
        };
    }

    const path = type === 'Polygon' ? resolvePolygonPath(geofence) : resolveRoutePath(geofence);
    const coordinates = path.map((point, index) => ({
        latitude: point.lat,
        longitude: point.lng,
        order: index,
    }));

    let centerLatitude = geofence.centerLatitude;
    let centerLongitude = geofence.centerLongitude;
    if ((centerLatitude == null || centerLongitude == null) && coordinates.length > 0) {
        centerLatitude = coordinates.reduce((sum, point) => sum + point.latitude, 0) / coordinates.length;
        centerLongitude = coordinates.reduce((sum, point) => sum + point.longitude, 0) / coordinates.length;
    }

    return {
        centerLatitude: centerLatitude ?? null,
        centerLongitude: centerLongitude ?? null,
        radiusMeters: type === 'Route' ? (geofence.radiusMeters ?? 50) : null,
        coordinates,
    };
};

const useVehicleTrackingGeofenceManager = ({ getViewportSnapshot, scrollMapIntoView }) => {
    const [isGeofencePanelOpen, setIsGeofencePanelOpen] = useState(false);
    const [trackingGeofenceGroups, setTrackingGeofenceGroups] = useState([]);
    const [trackingGeofences, setTrackingGeofences] = useState([]);
    const [isTrackingGeofenceLoading, setIsTrackingGeofenceLoading] = useState(false);
    const [isTrackingGeofenceSaving, setIsTrackingGeofenceSaving] = useState(false);
    const [isTrackingGeofenceGroupSaving, setIsTrackingGeofenceGroupSaving] = useState(false);
    const [trackingGeofenceType, setTrackingGeofenceType] = useState('Circle');
    const [trackingGeofenceShape, setTrackingGeofenceShape] = useState(emptyTrackingGeofenceShape);
    const [trackingGeofenceViewport, setTrackingGeofenceViewport] = useState(null);
    const [previewGeofence, setPreviewGeofence] = useState(null);
    const [previewColor, setPreviewColor] = useState(null);
    const [editingGeofence, setEditingGeofence] = useState(null);
    const [selectedTrackingGeofenceGroup, setSelectedTrackingGeofenceGroup] = useState(null);

    const resetTrackingGeofenceDraft = useCallback((viewport = null) => {
        setTrackingGeofenceType('Circle');
        setTrackingGeofenceShape(emptyTrackingGeofenceShape);
        setTrackingGeofenceViewport(viewport || null);
    }, []);

    const trackingGeofenceDrawing = useMemo(() => {
        if (!isGeofencePanelOpen) {
            return null;
        }

        return {
            enabled: true,
            geofenceType: trackingGeofenceType,
            shape: trackingGeofenceShape,
            focusViewport: null,
            onShapeChange: setTrackingGeofenceShape,
        };
    }, [isGeofencePanelOpen, trackingGeofenceShape, trackingGeofenceType]);

    const refreshTrackingGeofenceContext = useCallback(async () => {
        setIsTrackingGeofenceLoading(true);

        try {
            const [groups, geofences] = await Promise.all([
                geofenceService.getGeofenceGroups(true),
                geofenceService.getGeofences(),
            ]);

            setTrackingGeofenceGroups(Array.isArray(groups) ? groups : []);
            setTrackingGeofences(Array.isArray(geofences) ? geofences : []);
        } catch (error) {
            console.error('Error loading tracking geofence context:', error);
            notify(error?.message || 'Failed to load geofence setup', 'error', 3000);
        } finally {
            setIsTrackingGeofenceLoading(false);
        }
    }, []);

    const runMutation = useCallback(async ({ action, errorMessage, onAfterSuccess, setBusy, successMessage, useResponseMessage = false }) => {
        setBusy(true);

        try {
            const response = await action();
            if (response?.isSuccess === false) {
                notify(response?.message || errorMessage, 'error', 4000);
                return null;
            }

            const message = useResponseMessage ? (response?.message || successMessage) : successMessage;
            if (message) {
                notify(message, 'success', 3000);
            }

            if (onAfterSuccess) {
                await onAfterSuccess(response);
            }

            return response;
        } catch (error) {
            notify(resolveApiErrorMessage(error, errorMessage), 'error', 4000);
            return null;
        } finally {
            setBusy(false);
        }
    }, []);

    useEffect(() => {
        if (!selectedTrackingGeofenceGroup) {
            return;
        }

        const refreshedGroup = trackingGeofenceGroups.find((group) => group.id === selectedTrackingGeofenceGroup.id);
        if (refreshedGroup) {
            setSelectedTrackingGeofenceGroup(refreshedGroup);
        }
    }, [selectedTrackingGeofenceGroup, trackingGeofenceGroups]);

    useEffect(() => {
        if (trackingGeofenceGroups.length > 0 || isTrackingGeofenceLoading) {
            return;
        }

        refreshTrackingGeofenceContext();
    }, [isTrackingGeofenceLoading, refreshTrackingGeofenceContext, trackingGeofenceGroups.length]);

    const handleCloseGeofencePanel = useCallback(() => {
        setIsGeofencePanelOpen(false);
        setEditingGeofence(null);
        resetTrackingGeofenceDraft(null);
    }, [resetTrackingGeofenceDraft]);

    const handleOpenCreateGeofencePanel = useCallback(() => {
        setPreviewGeofence(null);
        setPreviewColor(null);
        setEditingGeofence(null);
        resetTrackingGeofenceDraft(getViewportSnapshot?.() || null);
        setIsGeofencePanelOpen(true);
    }, [getViewportSnapshot, resetTrackingGeofenceDraft]);

    const handleTrackingGroupClick = useCallback((group) => {
        setSelectedTrackingGeofenceGroup(group);
        setPreviewGeofence(null);
        setPreviewColor(null);
    }, []);

    const handleEditTrackingGroup = useCallback(async (group) => {
        const newName = window.prompt('Group name:', group.name);
        if (newName == null || !newName.trim() || newName.trim() === group.name) {
            return;
        }

        await runMutation({
            action: () => geofenceService.updateGeofenceGroup(group.id, { ...group, name: newName.trim() }),
            errorMessage: 'Failed to update group',
            onAfterSuccess: refreshTrackingGeofenceContext,
            setBusy: setIsTrackingGeofenceGroupSaving,
            successMessage: 'Group updated',
        });
    }, [refreshTrackingGeofenceContext, runMutation]);

    const handleDeleteTrackingGroup = useCallback(async (group) => {
        if (!window.confirm(`Delete group "${group.name}"?`)) {
            return;
        }

        await runMutation({
            action: () => geofenceService.deleteGeofenceGroup(group.id),
            errorMessage: 'Failed to delete group',
            onAfterSuccess: async () => {
                if (selectedTrackingGeofenceGroup?.id === group.id) {
                    setSelectedTrackingGeofenceGroup(null);
                }
                await refreshTrackingGeofenceContext();
            },
            setBusy: setIsTrackingGeofenceGroupSaving,
            successMessage: 'Group deleted',
        });
    }, [refreshTrackingGeofenceContext, runMutation, selectedTrackingGeofenceGroup?.id]);

    const handleToggleTrackingFueling = useCallback(async (group) => {
        await runMutation({
            action: () => geofenceService.updateGroupAllowedForFueling(group.id, !group.isAllowedForFueling),
            errorMessage: 'Failed to update fueling setting',
            onAfterSuccess: refreshTrackingGeofenceContext,
            setBusy: setIsTrackingGeofenceGroupSaving,
            successMessage: `Fueling ${group.isAllowedForFueling ? 'disabled' : 'enabled'} for "${group.name}"`,
        });
    }, [refreshTrackingGeofenceContext, runMutation]);

    const handleAddTrackingGroup = useCallback(async () => {
        const name = window.prompt('New group name:');
        if (!name?.trim()) {
            return;
        }

        await runMutation({
            action: () => geofenceService.createGeofenceGroup({ name: name.trim(), colour: '#3b82f6' }),
            errorMessage: 'Failed to create group',
            onAfterSuccess: refreshTrackingGeofenceContext,
            setBusy: setIsTrackingGeofenceGroupSaving,
            successMessage: 'Group created',
        });
    }, [refreshTrackingGeofenceContext, runMutation]);

    const handleChangeTrackingClassification = useCallback(async (geofence, classification) => {
        await runMutation({
            action: () => geofenceService.updateGeofenceClassification(geofence.id, classification || 'Unknown'),
            errorMessage: 'Failed to update classification',
            onAfterSuccess: refreshTrackingGeofenceContext,
            setBusy: setIsTrackingGeofenceSaving,
            successMessage: `Classification changed to ${classification}`,
        });
    }, [refreshTrackingGeofenceContext, runMutation]);

    const handleZoomTrackingGeofence = useCallback(async (geofence, group = null) => {
        if (!geofence) {
            return;
        }

        const color = group?.colour || selectedTrackingGeofenceGroup?.colour || '#15803d';
        let enrichedGeofence = geofence;

        if (!geofence.geometryJson && geofence.geofenceType !== 'Circle') {
            try {
                const detail = await geofenceService.getGeofenceById(geofence.id);
                if (detail?.geometryJson) {
                    enrichedGeofence = { ...geofence, geometryJson: detail.geometryJson };
                    setTrackingGeofences((previous) => previous.map((item) => (item.id === geofence.id ? enrichedGeofence : item)));
                }
            } catch {
                // Fall back to center point preview when geometry fetch fails.
            }
        }

        setPreviewGeofence(enrichedGeofence);
        setPreviewColor(color);
        scrollMapIntoView?.();
    }, [scrollMapIntoView, selectedTrackingGeofenceGroup?.colour]);

    const handleDeleteTrackingGeofence = useCallback(async (geofence) => {
        if (!window.confirm(`Delete geofence "${geofence.name}"?`)) {
            return;
        }

        await runMutation({
            action: () => geofenceService.deleteGeofence(geofence.id),
            errorMessage: 'Failed to delete geofence',
            onAfterSuccess: async () => {
                setPreviewGeofence((current) => (current && Number(current.id) === Number(geofence.id) ? null : current));
                await refreshTrackingGeofenceContext();
            },
            setBusy: setIsTrackingGeofenceSaving,
            successMessage: 'Geofence deleted',
        });
    }, [refreshTrackingGeofenceContext, runMutation]);

    const handleEditTrackingGeofence = useCallback(async (geofence) => {
        if (!geofence) {
            return;
        }

        try {
            let fullGeofence = geofence;
            if (!geofence.geometryJson && geofence.geofenceType !== 'Circle') {
                const detail = await geofenceService.getGeofenceById(geofence.id);
                if (detail) {
                    fullGeofence = { ...geofence, ...detail };
                }
            }

            const groupIds = trackingGeofenceGroups
                .filter((group) => Array.isArray(group.geofences) && group.geofences.some((item) => Number(item.id) === Number(geofence.id)))
                .map((group) => group.id);

            setEditingGeofence({ ...fullGeofence, groupIds });
            setPreviewGeofence(null);
            setPreviewColor(null);
            setTrackingGeofenceType(fullGeofence.geofenceType || 'Circle');
            setTrackingGeofenceShape(buildShapeFromGeofence(fullGeofence));
            setTrackingGeofenceViewport(getViewportSnapshot?.() || null);
            setIsGeofencePanelOpen(true);
        } catch (error) {
            notify(error?.message || 'Failed to load geofence for editing', 'error', 4000);
        }
    }, [getViewportSnapshot, trackingGeofenceGroups]);

    const handleCreateTrackingGeofence = useCallback(async (payload) => {
        await runMutation({
            action: () => geofenceService.createGeofence(payload),
            errorMessage: 'Failed to create geofence',
            onAfterSuccess: async () => {
                handleCloseGeofencePanel();
                await refreshTrackingGeofenceContext();
            },
            setBusy: setIsTrackingGeofenceSaving,
            successMessage: 'Geofence created successfully',
            useResponseMessage: true,
        });
    }, [handleCloseGeofencePanel, refreshTrackingGeofenceContext, runMutation]);

    const handleUpdateTrackingGeofence = useCallback(async (payload) => {
        if (!editingGeofence) {
            return;
        }

        await runMutation({
            action: () => geofenceService.updateGeofence(editingGeofence.id, payload),
            errorMessage: 'Failed to update geofence',
            onAfterSuccess: async () => {
                handleCloseGeofencePanel();
                await refreshTrackingGeofenceContext();
            },
            setBusy: setIsTrackingGeofenceSaving,
            successMessage: 'Geofence updated successfully',
            useResponseMessage: true,
        });
    }, [editingGeofence, handleCloseGeofencePanel, refreshTrackingGeofenceContext, runMutation]);

    const handleCreateTrackingGeofenceGroup = useCallback(async (payload) => {
        const response = await runMutation({
            action: () => geofenceService.createGeofenceGroup(payload),
            errorMessage: 'Failed to create geofence group',
            setBusy: setIsTrackingGeofenceGroupSaving,
            successMessage: 'Geofence group created successfully',
            useResponseMessage: true,
        });

        if (!response) {
            return null;
        }

        const refreshedGroups = await geofenceService.getGeofenceGroups(true);
        const normalizedGroups = Array.isArray(refreshedGroups) ? refreshedGroups : [];
        setTrackingGeofenceGroups(normalizedGroups);

        const createdGroupId = response?.data?.id || response?.data?.groupId;
        if (createdGroupId != null) {
            return normalizedGroups.find((group) => Number(group.id) === Number(createdGroupId)) || null;
        }

        return normalizedGroups.find((group) => group.name === payload.name) || null;
    }, [runMutation]);

    const handleTrackingGeofenceTypeChange = useCallback((value) => {
        setTrackingGeofenceType(value);
        if (editingGeofence && value === (editingGeofence.geofenceType || 'Circle')) {
            return;
        }

        setTrackingGeofenceShape({
            ...emptyTrackingGeofenceShape,
            radiusMeters: value === 'Route' ? 50 : null,
        });
    }, [editingGeofence]);

    const handleTrackingGeofenceViewportChange = useCallback((viewport) => {
        setTrackingGeofenceViewport(viewport || getViewportSnapshot?.() || null);
    }, [getViewportSnapshot]);

    const handleTrackingGeofenceShapePreviewChange = useCallback((partialShape) => {
        setTrackingGeofenceShape((current) => ({ ...current, ...partialShape }));
    }, []);

    const geofenceWorkspaceProps = useMemo(() => ({
        allGeofences: trackingGeofences,
        groups: trackingGeofenceGroups,
        loading: isTrackingGeofenceLoading,
        onAddGeofence: handleOpenCreateGeofencePanel,
        onAddGroup: handleAddTrackingGroup,
        onChangeClassification: handleChangeTrackingClassification,
        onDeleteGeofence: handleDeleteTrackingGeofence,
        onDeleteGroup: handleDeleteTrackingGroup,
        onEditGeofence: handleEditTrackingGeofence,
        onEditGroup: handleEditTrackingGroup,
        onGeofenceSelect: handleZoomTrackingGeofence,
        onToggleFueling: handleToggleTrackingFueling,
        selectedGroup: selectedTrackingGeofenceGroup,
        setSelectedGroup: handleTrackingGroupClick,
    }), [
        handleAddTrackingGroup,
        handleChangeTrackingClassification,
        handleDeleteTrackingGeofence,
        handleDeleteTrackingGroup,
        handleEditTrackingGeofence,
        handleEditTrackingGroup,
        handleOpenCreateGeofencePanel,
        handleToggleTrackingFueling,
        handleTrackingGroupClick,
        handleZoomTrackingGeofence,
        isTrackingGeofenceLoading,
        selectedTrackingGeofenceGroup,
        trackingGeofenceGroups,
        trackingGeofences,
    ]);

    const geofenceDialogProps = useMemo(() => ({
        onClose: handleCloseGeofencePanel,
        open: isGeofencePanelOpen,
        title: editingGeofence ? 'Edit geofence' : 'Create geofence',
    }), [editingGeofence, handleCloseGeofencePanel, isGeofencePanelOpen]);

    const geofenceFormProps = useMemo(() => ({
        compact: true,
        creatingGroup: isTrackingGeofenceGroupSaving,
        externalShape: trackingGeofenceShape,
        geofenceGroups: trackingGeofenceGroups,
        geofences: trackingGeofences,
        hideMap: true,
        initialData: editingGeofence,
        initialViewport: trackingGeofenceViewport || getViewportSnapshot?.() || null,
        onCancel: handleCloseGeofencePanel,
        onCreateGroup: handleCreateTrackingGeofenceGroup,
        onGeofenceTypeChange: handleTrackingGeofenceTypeChange,
        onMapViewportChange: handleTrackingGeofenceViewportChange,
        onShapePreviewChange: handleTrackingGeofenceShapePreviewChange,
        onSubmit: editingGeofence ? handleUpdateTrackingGeofence : handleCreateTrackingGeofence,
        saving: isTrackingGeofenceSaving,
    }), [
        editingGeofence,
        getViewportSnapshot,
        handleCloseGeofencePanel,
        handleCreateTrackingGeofence,
        handleCreateTrackingGeofenceGroup,
        handleTrackingGeofenceShapePreviewChange,
        handleTrackingGeofenceTypeChange,
        handleTrackingGeofenceViewportChange,
        handleUpdateTrackingGeofence,
        isTrackingGeofenceGroupSaving,
        isTrackingGeofenceSaving,
        trackingGeofenceGroups,
        trackingGeofenceShape,
        trackingGeofenceViewport,
        trackingGeofences,
    ]);

    return {
        geofenceDialogProps,
        geofenceFormProps,
        geofenceWorkspaceProps,
        isTrackingGeofenceLoading,
        previewColor,
        previewGeofence,
        trackingGeofenceDrawing,
    };
};

export default useVehicleTrackingGeofenceManager;