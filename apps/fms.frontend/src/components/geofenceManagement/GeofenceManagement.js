/**
 * File: GeofenceManagement.js
 * Purpose: Manages geofences, fueling groups, and GPSGate sync operations as a reusable shared workbench.
 * Dependencies: React, devextreme-react, geofenceService, SlidePanel.
 * Last Modified: 2026-03-13
 *
 * Key Components:
 * - GeofenceManagement: Shared geofence workbench used by admin and vehicle-tracking surfaces.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "devextreme-react/button";
import { LoadPanel } from "devextreme-react/load-panel";
import notify from "devextreme/ui/notify";
import { usePermissions } from "../../hooks/usePermissions";
import geofenceService from "../../api/geofenceService";
import SlidePanel from "../ui/SlidePanel";
import SiteGeofenceMapPopup from "../../pages/site/components/SiteGeofenceMapPopup";
import GeofenceCreateForm from "./GeofenceCreateForm";
import GeofenceGroupForm from "./GeofenceGroupForm";
import GeofenceWorksiteForm from "./GeofenceWorksiteForm";
import GeofenceGeofencesTab from "./components/GeofenceGeofencesTab";
import GeofenceGroupsTab from "./components/GeofenceGroupsTab";
import GeofenceSyncTab from "./components/GeofenceSyncTab";
import GeofenceEditForm from "./components/GeofenceEditForm";
import "./GeofenceManagement.scss";

const TAB_CONFIG = [
  { id: "geofences", label: "Geofences", icon: "fa-location-dot" },
  { id: "groups", label: "Allowed Groups", icon: "fa-layer-group" },
  { id: "sync", label: "Sync Groups", icon: "fa-cloud-arrow-down" },
];

const GeofenceManagement = ({
  title = "Fleet Geofences",
  description = "Create geofences on the fleet map, assign them to validation groups, and classify them for vehicle-trip site or project-location logic.",
  createPanelWidth = "min(1280px, 98vw)",
  getCreateMapViewport = null,
  autoOpenCreateOnMount = false,
}) => {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('_Manage_Geofence');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [geofences, setGeofences] = useState([]);
  const [geofenceGroups, setGeofenceGroups] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedTabId, setSelectedTabId] = useState("geofences");
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [selectedGeofenceIds, setSelectedGeofenceIds] = useState([]);
  const [selectedGroupIdsLocal, setSelectedGroupIdsLocal] = useState([]);
  const [showCreateGeofencePanel, setShowCreateGeofencePanel] = useState(false);
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [showWorksitePanel, setShowWorksitePanel] = useState(false);
  const [showMapPreview, setShowMapPreview] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatusMessage, setSyncStatusMessage] = useState("");
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [loadingAvailableGroups, setLoadingAvailableGroups] = useState(false);
  const [createMapViewport, setCreateMapViewport] = useState(null);
  const [createGeofenceShape, setCreateGeofenceShape] = useState(null);
  const [createGeofenceType, setCreateGeofenceType] = useState("Circle");

  const geofencesWithUsage = useMemo(() => {
    const allowedFuelingMap = new Map();

    geofenceGroups.forEach((group) => {
      if (!group?.isAllowedForFueling || !Array.isArray(group?.geofences)) {
        return;
      }

      group.geofences.forEach((geofence) => {
        const geofenceId = Number(geofence?.id);
        if (!Number.isFinite(geofenceId)) {
          return;
        }

        const names = allowedFuelingMap.get(geofenceId) || [];
        names.push(group.name || `Group ${geofenceId}`);
        allowedFuelingMap.set(geofenceId, names);
      });
    });

    return geofences.map((geofence) => {
      const fuelingGroupNames = allowedFuelingMap.get(Number(geofence.id)) || [];
      const tripClassificationLabel = geofence.siteName || geofence.projectLocationName || null;

      return {
        ...geofence,
        fuelingGroupNames,
        fuelingUsageCount: fuelingGroupNames.length,
        isUsedForFuelValidation: fuelingGroupNames.length > 0,
        tripClassificationLabel,
        isUsedForTripClassification: Boolean(geofence.isAssignedToSite || geofence.siteId || tripClassificationLabel),
      };
    });
  }, [geofenceGroups, geofences]);

  const selectedGeofence = geofencesWithUsage.find((item) => item.id === selectedGeofenceIds[0]) || null;
  const selectedGroup = geofenceGroups.find((item) => item.id === selectedGroupIdsLocal[0]) || null;

  const fetchGeofences = useCallback(async () => {
    setLoading(true);
    try {
      const data = await geofenceService.getGeofences();
      setGeofences(data);
      const lastSync = data.reduce((latest, geofence) => {
        if (geofence.lastSyncedAt && (!latest || new Date(geofence.lastSyncedAt) > new Date(latest))) {
          return geofence.lastSyncedAt;
        }
        return latest;
      }, null);
      setLastSyncTime(lastSync);
    } catch (error) {
      console.error("Error fetching geofences:", error);
      notify("Failed to load geofences", "error", 3000);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGeofenceGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await geofenceService.getGeofenceGroups(true);
      setGeofenceGroups(data);
    } catch (error) {
      console.error("Error fetching geofence groups:", error);
      notify("Failed to load geofence groups", "error", 3000);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSites = useCallback(async () => {
    try {
      const data = await geofenceService.getSites(true);
      setSites(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching sites:", error);
      notify("Failed to load sites for trip classification", "error", 3000);
    }
  }, []);

  const fetchAvailableGroups = useCallback(async () => {
    setLoadingAvailableGroups(true);
    try {
      const response = await geofenceService.getAvailableGroups();
      if (response?.isSuccess && response?.data) {
        setAvailableGroups(response.data);
      } else {
        throw new Error(response?.message || "Failed to fetch available groups");
      }
    } catch (error) {
      console.error("Error fetching available groups:", error);
      notify("Failed to load available groups from GPSGate", "error", 3000);
    } finally {
      setLoadingAvailableGroups(false);
    }
  }, []);

  useEffect(() => {
    fetchGeofences();
    fetchGeofenceGroups();
  }, [fetchGeofenceGroups, fetchGeofences]);

  useEffect(() => {
    if (selectedTabId === "sync") {
      fetchAvailableGroups();
    }
  }, [fetchAvailableGroups, selectedTabId]);

  useEffect(() => {
    if (showWorksitePanel && sites.length === 0) {
      fetchSites();
    }
  }, [fetchSites, showWorksitePanel, sites.length]);

  useEffect(() => {
    if (!autoOpenCreateOnMount) {
      return;
    }

    setSelectedTabId("geofences");
    handleOpenCreateGeofencePanel();
  }, [autoOpenCreateOnMount]);

  const handleSyncGeofences = async (forceFullSync = false, groupIds = null) => {
    setShowSyncConfirm(false);

    if (syncing) {
      notify("A sync is already in progress", "warning", 3000);
      return;
    }

    const isSelectiveSync = Array.isArray(groupIds) && groupIds.length > 0;
    setSyncing(true);
    setSyncProgress(0);
    setSyncStatusMessage(isSelectiveSync ? `Starting sync for ${groupIds.length} group(s)...` : "Starting full sync...");

    try {
      const startResponse = await geofenceService.startSyncJob({
        forceFullSync,
        groupIds: isSelectiveSync ? groupIds : null,
      });

      if (!startResponse?.isSuccess || !startResponse?.data?.jobId) {
        throw new Error(startResponse?.message || "Failed to start sync job");
      }

      const finalJob = await geofenceService.pollSyncJobUntilComplete(
        startResponse.data.jobId,
        (job) => {
          setSyncProgress(job.progressPercent || 0);
          setSyncStatusMessage(job.statusMessage || `Syncing... ${job.geofencesSynced || 0} geofences, ${job.groupsSynced || 0} groups`);
        },
        2000,
        180
      );

      notify(`Sync completed: ${finalJob.geofencesSynced} geofences, ${finalJob.groupsSynced} groups synced`, "success", 5000);
      fetchGeofences();
      fetchGeofenceGroups();
      fetchAvailableGroups();
      setSelectedGroupIds([]);
    } catch (error) {
      console.error("Error syncing geofences:", error);
      notify(error.message || "Failed to sync geofences from GPSGate", "error", 5000);
    } finally {
      setSyncing(false);
      setSyncProgress(0);
      setSyncStatusMessage("");
    }
  };

  const handleRefreshCurrentTab = () => {
    switch (selectedTabId) {
      case "geofences":
        fetchGeofences();
        break;
      case "groups":
        fetchGeofenceGroups();
        break;
      case "sync":
        fetchAvailableGroups();
        break;
      default:
        break;
    }
  };

  const handleOpenCreateGeofencePanel = () => {
    setCreateMapViewport(typeof getCreateMapViewport === "function" ? getCreateMapViewport() : null);
    setCreateGeofenceType("Circle");
    setCreateGeofenceShape(null);
    setShowCreateGeofencePanel(true);
  };

  const handleCloseCreateGeofencePanel = () => {
    setShowCreateGeofencePanel(false);
    setCreateGeofenceShape(null);
    setCreateGeofenceType("Circle");
  };

  const handleCreateShapeChange = useCallback((shape) => {
    setCreateGeofenceShape(shape);
  }, []);

  const handleCreateGeofenceTypeChange = useCallback((type) => {
    setCreateGeofenceType(type);
    setCreateGeofenceShape(null);
  }, []);

  const handleCreateShapePreviewChange = useCallback((preview) => {
    if (preview?.radiusMeters !== undefined) {
      setCreateGeofenceShape((prev) => prev ? { ...prev, radiusMeters: preview.radiusMeters } : null);
    }
  }, []);

  const handleCreateGeofence = async (payload) => {
    setSaving(true);
    try {
      const response = await geofenceService.createGeofence(payload);
      if (response?.isSuccess) {
        notify(response.message || "Geofence created successfully", "success", 3000);
        handleCloseCreateGeofencePanel();
        await fetchGeofences();
        await fetchGeofenceGroups();
        if (selectedTabId === "sync") {
          await fetchAvailableGroups();
        }
        return;
      }

      notify(response?.message || "Failed to create geofence", "error", 4000);
    } catch (error) {
      console.error("Error creating geofence:", error);
      notify(error.response?.data?.message || error.message || "Failed to create geofence", "error", 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGeofence = async () => {
    if (!selectedGeofence) {
      notify("Select a geofence first", "warning", 2500);
      return;
    }

    const confirmed = window.confirm(`Delete geofence '${selectedGeofence.name}' from GPSGate and local cache?`);
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    try {
      const response = await geofenceService.deleteGeofence(selectedGeofence.id);
      if (response?.isSuccess) {
        notify(response.message || "Geofence deleted successfully", "success", 3000);
        setSelectedGeofenceIds([]);
        setShowMapPreview(false);
        setShowWorksitePanel(false);
        await fetchGeofences();
        await fetchGeofenceGroups();
        await fetchSites();
        if (selectedTabId === "sync") {
          await fetchAvailableGroups();
        }
        return;
      }

      notify(response?.message || "Failed to delete geofence", "error", 4000);
    } catch (error) {
      console.error("Error deleting geofence:", error);
      notify(error.response?.data?.message || error.message || "Failed to delete geofence", "error", 4000);
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenEditGroup = () => {
    if (!selectedGroup) {
      notify("Select a group first", "warning", 2500);
      return;
    }

    setEditingGroup(selectedGroup);
    setShowGroupPanel(true);
  };

  const handleSaveGroup = async (payload) => {
    setSaving(true);
    try {
      const response = editingGroup
        ? await geofenceService.updateGeofenceGroup(editingGroup.id, payload)
        : await geofenceService.createGeofenceGroup(payload);

      if (response?.isSuccess) {
        notify(response.message || `Group ${editingGroup ? "updated" : "created"} successfully`, "success", 3000);
        setShowGroupPanel(false);
        setEditingGroup(null);
        await fetchGeofenceGroups();
        await fetchGeofences();
        if (selectedTabId === "sync") {
          await fetchAvailableGroups();
        }
        return;
      }

      notify(response?.message || "Failed to save group", "error", 4000);
    } catch (error) {
      console.error("Error saving geofence group:", error);
      notify(error.response?.data?.message || error.message || "Failed to save geofence group", "error", 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (group) => {
    if (!group) {
      return;
    }

    setDeleting(true);
    try {
      const response = await geofenceService.deleteGeofenceGroup(group.id);
      if (response?.isSuccess) {
        notify(response.message || "Group deleted successfully", "success", 3000);
        setShowGroupPanel(false);
        setEditingGroup(null);
        setSelectedGroupIdsLocal([]);
        await fetchGeofenceGroups();
        if (selectedTabId === "sync") {
          await fetchAvailableGroups();
        }
        return;
      }

      notify(response?.message || "Failed to delete group", "error", 4000);
    } catch (error) {
      console.error("Error deleting geofence group:", error);
      notify(error.response?.data?.message || error.message || "Failed to delete group", "error", 4000);
    } finally {
      setDeleting(false);
    }
  };

  const buildSiteUpdatePayload = (siteRecord, geofence) => ({
    name: siteRecord.name,
    isActive: siteRecord.isActive,
    siteAdministratorId: siteRecord.siteAdministratorId || null,
    gpsGateTagId: siteRecord.gpsGateTagId || null,
    gpsGateTagName: siteRecord.gpsGateTagName || null,
    autoUpdateGpsGateTag: siteRecord.autoUpdateGpsGateTag !== false,
    gpsGeofenceId: geofence?.id || null,
    gpsGeofenceName: geofence?.name || null,
    gpsGeofenceType: geofence?.geofenceType || null,
    gpsGeofenceCenterLatitude: geofence?.centerLatitude ?? null,
    gpsGeofenceCenterLongitude: geofence?.centerLongitude ?? null,
  });

  const handleSaveWorksiteClassification = async (siteId) => {
    if (!selectedGeofence) {
      return;
    }

    setSaving(true);
    try {
      if (selectedGeofence.siteId && selectedGeofence.siteId !== siteId) {
        const currentSite = await geofenceService.getSiteById(selectedGeofence.siteId);
        await geofenceService.updateSiteGeofence(selectedGeofence.siteId, buildSiteUpdatePayload(currentSite, null));
      }

      if (siteId) {
        const targetSite = await geofenceService.getSiteById(siteId);
        await geofenceService.updateSiteGeofence(siteId, buildSiteUpdatePayload(targetSite, selectedGeofence));
      }

      notify(siteId ? "Geofence trip classification updated" : "Trip classification removed", "success", 3000);
      setShowWorksitePanel(false);
      await fetchGeofences();
      await fetchSites();
    } catch (error) {
      console.error("Error saving trip classification:", error);
      notify(error.response?.data?.message || error.message || "Failed to save trip classification", "error", 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAllowedForFueling = async (groupId, newValue) => {
    setSaving(true);
    try {
      const response = await geofenceService.updateGroupAllowedForFueling(groupId, newValue);
      if (response?.isSuccess) {
        notify(`Group ${newValue ? "enabled" : "disabled"} for fueling`, "success", 2000);
        setGeofenceGroups((current) => current.map((group) => (group.id === groupId ? { ...group, isAllowedForFueling: newValue } : group)));
      } else {
        notify(response?.message || "Failed to update group", "error", 3000);
      }
    } catch (error) {
      console.error("Error updating group:", error);
      notify("Failed to update group setting", "error", 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditPanel = () => {
    if (!selectedGeofence) {
      notify("Select a geofence first", "warning", 2500);
      return;
    }
    setShowEditPanel(true);
  };

  const handleEditSaved = async () => {
    setShowEditPanel(false);
    await fetchGeofences();
    await fetchGeofenceGroups();
  };

  const formatDateTime = (dateString) => (dateString ? new Date(dateString).toLocaleString() : "-");

  const renderGeofenceTypeCell = (cellData) => {
    const type = cellData.value || "Unknown";
    const iconMap = {
      Circle: "fa-circle",
      Polygon: "fa-draw-polygon",
      Route: "fa-route",
    };

    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <i className={`fa-light ${iconMap[type] || "fa-location-dot"} geofence-type-icon`}></i>
        <span>{type}</span>
      </div>
    );
  };

  const renderActiveCell = (cellData) => (
    <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${cellData.value ? "tw-bg-green-100 tw-text-green-800" : "tw-bg-gray-100 tw-text-gray-600"}`}>
      {cellData.value ? "Active" : "Inactive"}
    </span>
  );

  const renderAllowedForFuelingCell = (cellData) => (
    <div className="tw-flex tw-items-center tw-justify-center">
      <input
        type="checkbox"
        className="tw-h-4 tw-w-4 tw-cursor-pointer"
        checked={cellData.value}
        onChange={() => handleToggleAllowedForFueling(cellData.data.id, !cellData.value)}
        disabled={saving}
        aria-label="Allowed for fueling"
      />
    </div>
  );

  return (
    <div className="geofence-management">
      <LoadPanel visible={loading || saving} message={saving ? "Saving..." : "Loading..."} />

      {syncing && (
        <div className="tw-fixed tw-bottom-4 tw-right-4 tw-z-50 tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-4 tw-w-80 tw-border tw-border-blue-200">
          <div className="tw-flex tw-items-center tw-gap-3 tw-mb-2">
            <i className="fa-light fa-arrows-rotate tw-text-blue-600 tw-animate-spin"></i>
            <span className="tw-font-medium tw-text-gray-800">Syncing Geofences</span>
          </div>
          <div className="tw-text-sm tw-text-gray-600 tw-mb-2">{syncStatusMessage || "Syncing from GPSGate..."}</div>
          <div className="tw-w-full tw-bg-gray-200 tw-rounded-full tw-h-2">
            <div className="tw-bg-blue-600 tw-h-2 tw-rounded-full tw-transition-all tw-duration-300" style={{ width: `${syncProgress}%` }} />
          </div>
          <div className="tw-text-xs tw-text-gray-500 tw-mt-1 tw-text-right">{syncProgress}%</div>
        </div>
      )}

      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-3 tw-mb-3 tw-flex tw-items-center tw-justify-between tw-gap-3 tw-flex-wrap">
        <div>
          <h2 className="tw-text-base tw-font-semibold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-map-location-dot tw-text-blue-600"></i>
            {title}
          </h2>
          <p className="tw-mt-1 tw-text-sm tw-text-gray-600">{description}</p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-3">
          {lastSyncTime && (
            <span className="tw-text-sm tw-text-gray-500">
              <i className="fa-light fa-clock tw-mr-1"></i>
              Last sync: {formatDateTime(lastSyncTime)}
            </span>
          )}
          <Button text="Sync from GPSGate" icon="fa-light fa-arrows-rotate" type="default" stylingMode="contained" onClick={() => setShowSyncConfirm(true)} disabled={syncing || !canManage} />
        </div>
      </div>

      <div className="tw-bg-white tw-rounded-t-lg tw-shadow-sm tw-border-b tw-border-gray-200">
        <div className="tw-flex tw-items-center tw-justify-between tw-px-2">
          <div className="tw-flex tw-items-center tw-gap-1">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTabId(tab.id)}
                className={`tw-relative tw-inline-flex tw-items-center tw-gap-1.5 tw-border-none tw-bg-transparent tw-cursor-pointer tw-px-4 tw-py-2.5 tw-text-[13px] tw-font-medium tw-transition-colors ${selectedTabId === tab.id ? "tw-text-[#0078d4]" : "tw-border-transparent tw-text-gray-600 hover:tw-text-gray-800 hover:tw-bg-gray-50"}`}
              >
                <i className={`fa-light ${tab.icon} tw-text-[13px]`}></i>
                <span>{tab.label}</span>
                {selectedTabId === tab.id && <span className="tw-absolute tw-bottom-0 tw-left-3 tw-right-3 tw-rounded-t" style={{ height: 2, background: "#0078d4" }} />}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefreshCurrentTab}
            className="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-2 tw-text-sm tw-text-gray-600 tw-bg-white hover:tw-text-blue-600 hover:tw-bg-blue-50 tw-rounded tw-border tw-border-gray-300 tw-transition-colors tw-mr-2"
            title="Refresh current tab"
          >
            <i className="fa-light fa-arrows-rotate"></i>
            <span className="tw-hidden sm:tw-inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="tw-bg-white tw-rounded-b-lg tw-shadow-sm">
        {selectedTabId === "geofences" && (
          <GeofenceGeofencesTab
            canManage={canManage}
            deleting={deleting}
            geofences={geofencesWithUsage}
            geofenceGroups={geofenceGroups}
            isCreating={showCreateGeofencePanel}
            createGeofenceType={createGeofenceType}
            createShape={createGeofenceShape}
            onCreateShapeChange={handleCreateShapeChange}
            createMapViewport={createMapViewport}
            onCreate={handleOpenCreateGeofencePanel}
            onCancelCreate={handleCloseCreateGeofencePanel}
            onDelete={handleDeleteGeofence}
            onEdit={handleOpenEditPanel}
            onPreview={() => setShowMapPreview(true)}
            onSelectionChanged={(e) => setSelectedGeofenceIds(e.selectedRowKeys || [])}
            onWorksite={() => setShowWorksitePanel(true)}
            renderActiveCell={renderActiveCell}
            renderGeofenceTypeCell={renderGeofenceTypeCell}
            selectedGeofence={selectedGeofence}
            selectedGeofenceIds={selectedGeofenceIds}
          />
        )}

        {selectedTabId === "groups" && (
          <GeofenceGroupsTab
            canManage={canManage}
            geofenceGroups={geofenceGroups}
            geofences={geofencesWithUsage}
            onCreateGroup={() => {
              setEditingGroup(null);
              setShowGroupPanel(true);
            }}
            onEditGroup={handleOpenEditGroup}
            onSelectionChanged={(e) => setSelectedGroupIdsLocal(e.selectedRowKeys || [])}
            renderActiveCell={renderActiveCell}
            renderAllowedForFuelingCell={renderAllowedForFuelingCell}
            selectedGroup={selectedGroup}
            selectedGroupIds={selectedGroupIdsLocal}
          />
        )}

        {selectedTabId === "sync" && (
          <GeofenceSyncTab
            canManage={canManage}
            availableGroups={availableGroups}
            loadingAvailableGroups={loadingAvailableGroups}
            onSelectionChanged={(e) => setSelectedGroupIds(e.selectedRowKeys || [])}
            onSyncAll={() => setShowSyncConfirm(true)}
            onSyncSelected={() => {
              if (selectedGroupIds.length === 0) {
                notify("Please select at least one group to sync", "warning", 3000);
                return;
              }
              handleSyncGeofences(true, selectedGroupIds);
            }}
            selectedGroupIds={selectedGroupIds}
            syncing={syncing}
          />
        )}
      </div>

      <SlidePanel open={showSyncConfirm} onClose={() => setShowSyncConfirm(false)} title="Full Sync - All Geofences" width={960}>
        <div className="tw-p-5">
          <p className="tw-text-gray-700 tw-mb-3">
            This will sync <strong>all</strong> geofences and groups from GPSGate. This may take a few minutes depending on the number of geofences.
          </p>
          <p className="tw-text-sm tw-text-blue-600 tw-mb-4">
            <i className="fa-light fa-lightbulb tw-mr-1"></i>
            Tip: Use the Sync Groups tab for faster selective sync.
          </p>
          <div className="tw-flex tw-gap-3 tw-justify-end">
            <Button text="Cancel" stylingMode="outlined" onClick={() => setShowSyncConfirm(false)} />
            <Button text="Quick Sync" type="default" stylingMode="contained" onClick={() => handleSyncGeofences(false, null)} />
            <Button text="Full Sync" type="success" stylingMode="contained" onClick={() => handleSyncGeofences(true, null)} />
          </div>
        </div>
      </SlidePanel>

      {showCreateGeofencePanel && (
        <div className="tw-fixed tw-top-[88px] tw-right-6 tw-z-50 tw-w-[420px] tw-bg-white tw-rounded-lg tw-shadow-xl tw-border tw-border-gray-200 tw-overflow-hidden" style={{ maxHeight: "calc(100vh - 120px)" }}>
          <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-bg-[#faf9f8] tw-border-b tw-border-gray-200">
            <h3 className="tw-text-sm tw-font-semibold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-draw-polygon tw-text-blue-600"></i>
              Create geofence
            </h3>
            <button
              type="button"
              onClick={handleCloseCreateGeofencePanel}
              className="tw-flex tw-items-center tw-justify-center tw-w-7 tw-h-7 tw-rounded tw-text-gray-500 hover:tw-bg-gray-100 hover:tw-text-gray-700 tw-border-none tw-bg-transparent tw-cursor-pointer"
            >
              <i className="fa-light fa-xmark"></i>
            </button>
          </div>
          <div className="tw-overflow-y-auto" style={{ maxHeight: "calc(100vh - 180px)" }}>
            <GeofenceCreateForm
              geofenceGroups={geofenceGroups}
              geofences={geofencesWithUsage}
              initialViewport={createMapViewport}
              saving={saving}
              compact={true}
              hideMap={true}
              externalShape={createGeofenceShape}
              onGeofenceTypeChange={handleCreateGeofenceTypeChange}
              onShapePreviewChange={handleCreateShapePreviewChange}
              onCancel={handleCloseCreateGeofencePanel}
              onSubmit={handleCreateGeofence}
            />
          </div>
        </div>
      )}

      <SlidePanel
        open={showGroupPanel}
        onClose={() => {
          setShowGroupPanel(false);
          setEditingGroup(null);
        }}
        title={editingGroup ? "Edit geofence group" : "Create geofence group"}
        width={960}
      >
        <GeofenceGroupForm
          group={editingGroup}
          geofences={geofencesWithUsage}
          saving={saving}
          deleting={deleting}
          onCancel={() => {
            setShowGroupPanel(false);
            setEditingGroup(null);
          }}
          onDelete={handleDeleteGroup}
          onSubmit={handleSaveGroup}
        />
      </SlidePanel>

      <SlidePanel open={showWorksitePanel} onClose={() => setShowWorksitePanel(false)} title="Trip classification" width={720}>
        <GeofenceWorksiteForm geofence={selectedGeofence} sites={sites} saving={saving} onCancel={() => setShowWorksitePanel(false)} onSubmit={handleSaveWorksiteClassification} />
      </SlidePanel>

      <SlidePanel
        open={showEditPanel}
        onClose={() => setShowEditPanel(false)}
        title="Edit geofence"
        width={520}
      >
        <GeofenceEditForm
          geofence={selectedGeofence}
          geofenceGroups={geofenceGroups}
          onSaved={handleEditSaved}
          onCancel={() => setShowEditPanel(false)}
        />
      </SlidePanel>

      <SiteGeofenceMapPopup visible={showMapPreview && !!selectedGeofence} onClose={() => setShowMapPreview(false)} geofence={selectedGeofence} />
    </div>
  );
};

export default GeofenceManagement;