/**
 * File:          SitePage.js
 * Purpose:       V2 Site Management page — M365 Admin Center layout with SlidePanel for detail/form views
 * Dependencies:  useSiteData, SlidePanel, SiteCommandBar, SiteTabBar, SiteFilterBar,
 *                SiteList, SiteDetailPanel, SiteFormPanel, M365PageHeader
 * Last Modified: 2026-02-26
 *
 * Key Sections:
 * - M365PageHeader:   Title, site count, command bar
 * - SiteTabBar:       All / Active / Inactive tabs
 * - SiteFilterBar:    Search, Administrator, GPSGate Tag filters
 * - SiteList:         DataGrid (full width — detail is in SlidePanel)
 * - SlidePanel:       Detail view (on row click) or Form view (on Add/Edit)
 */
import React, { useState, useCallback } from "react";
import { LoadPanel } from "devextreme-react/load-panel";
import { usePermissions } from "../../hooks/usePermissions";

// SlidePanel
import SlidePanel from "../../components/ui/SlidePanel";

// Shared M365
import M365PageHeader from "../../components/m365/M365PageHeader";

// Page components
import SiteCommandBar from "./components/SiteCommandBar";
import SiteTabBar from "./components/SiteTabBar";
import SiteFilterBar from "./components/SiteFilterBar";
import SiteList from "./components/SiteList";
import SiteDetailPanel from "./components/SiteDetailPanel";
import SiteFormPanel from "./components/SiteFormPanel";

// Hook
import useSiteData from "./hooks/useSiteData";

// Styles
import "./sitePage.scss";

const SitePage = () => {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("_Manage_Site");

  const {
    // Data
    filteredSites,
    selectedSite,
    loading,
    creating,
    updating,
    deleting,
    users,
    gpsGateTags,
    loadingTags,
    geofences,
    loadingGeofences,
    tabCounts,
    administrators,
    uniqueTags,

    // Filters
    activeTab,
    setActiveTab,
    searchText,
    setSearchText,
    administratorFilter,
    setAdministratorFilter,
    tagFilter,
    setTagFilter,

    // Actions
    handleSelectSite,
    handleRefresh,
    handleDelete,
    handleCreate,
    handleUpdate,
  } = useSiteData();

  /* ── Panel states ── */
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create"); // "create" | "edit"

  /* ── Handlers ── */
  const onRowSelect = useCallback(
    (site) => {
      handleSelectSite(site);
      setFormOpen(false);
      setDetailOpen(true);
    },
    [handleSelectSite]
  );

  const onAdd = useCallback(() => {
    handleSelectSite(null);
    setDetailOpen(false);
    setFormMode("create");
    setFormOpen(true);
  }, [handleSelectSite]);

  const onEdit = useCallback(() => {
    setDetailOpen(false);
    setFormMode("edit");
    setFormOpen(true);
  }, []);

  const onDeleteSite = useCallback(() => {
    if (selectedSite) {
      handleDelete(selectedSite);
      setDetailOpen(false);
    }
  }, [selectedSite, handleDelete]);

  const closeDetail = useCallback(() => setDetailOpen(false), []);

  const detailHeaderActions = canManage ? (
    <>
      <button
        className="m365-btn m365-btn--ghost"
        onClick={onEdit}
        disabled={!selectedSite}
      >
        <i className="fa-light fa-pen-to-square"></i>
        Edit
      </button>
      <button
        className="m365-btn m365-btn--ghost"
        onClick={onDeleteSite}
        disabled={!selectedSite}
        style={selectedSite ? { color: "#d13438" } : undefined}
      >
        <i className="fa-light fa-trash-can"></i>
        Delete
      </button>
    </>
  ) : null;

  const onFormClose = useCallback(() => {
    setFormOpen(false);
    // Re-open detail if we were editing an existing site
    if (formMode === "edit" && selectedSite) {
      setDetailOpen(true);
    }
  }, [formMode, selectedSite]);

  return (
    <div className="m365-site-page">
      {/* ── Page Header + Command Bar ── */}
      <M365PageHeader
        title="Site Management"
        icon="fa-light fa-building"
        count={tabCounts.all}
      >
        <SiteCommandBar
          selectedSite={selectedSite}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDeleteSite}
          onRefresh={handleRefresh}
        />
      </M365PageHeader>

      {/* ── Tab Bar ── */}
      <SiteTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={tabCounts}
      />

      {/* ── Filters ── */}
      <SiteFilterBar
        searchText={searchText}
        onSearchChange={setSearchText}
        administratorFilter={administratorFilter}
        onAdministratorChange={setAdministratorFilter}
        tagFilter={tagFilter}
        onTagChange={setTagFilter}
        administrators={administrators}
        uniqueTags={uniqueTags}
      />

      {/* ── Site List (full width — detail is in SlidePanel) ── */}
      <SiteList
        sites={filteredSites}
        selectedSite={selectedSite}
        onSelect={onRowSelect}
        loading={loading}
      />

      {/* ── Detail SlidePanel ── */}
      <SlidePanel
        open={detailOpen}
        onClose={closeDetail}
        title={selectedSite?.name || "Site Details"}
        width={1000}
        headerActions={detailHeaderActions}
      >
        <SiteDetailPanel site={selectedSite} geofences={geofences} />
      </SlidePanel>

      {/* ── Form SlidePanel ── */}
      <SlidePanel
        open={formOpen}
        onClose={onFormClose}
        title={formMode === "create" ? "Create New Site" : `Edit: ${selectedSite?.name || ""}`}
        width={1000}
      >
        <SiteFormPanel
          mode={formMode}
          site={selectedSite}
          users={users}
          gpsGateTags={gpsGateTags}
          loadingTags={loadingTags}
          geofences={geofences}
          loadingGeofences={loadingGeofences}
          saving={creating || updating}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onClose={onFormClose}
        />
      </SlidePanel>

      {/* ── Global Loading Overlay ── */}
      <LoadPanel
        visible={deleting}
        message="Deleting site…"
        position={{ my: "center", at: "center", of: window }}
      />
    </div>
  );
};

export default SitePage;
