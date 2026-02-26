/**
 * File:          tankPage.js
 * Purpose:       V2 Tank Management page — M365 Admin Center layout with tree sidebar,
 *                inline detail/site-summary, and SlidePanels for form/history/PTS link
 * Dependencies:  useTankData, SlidePanel, TankCommandBar, TankTreeList,
 *                TankDetailPanel, TankSiteSummary, TankEmptyState,
 *                TankFormPanel, TankHistoryPanel, PTSDeviceLinkPanel, M365PageHeader
 * Last Modified: 2026-02-26
 *
 * Key Sections:
 * - M365PageHeader:   Title, count, command bar
 * - TankTreeList:     Left sidebar — sites + tanks tree
 * - Content Area:     TankDetailPanel | TankSiteSummary | TankEmptyState
 * - SlidePanels:      Form (create/edit), History, PTS Device Link — all width 1000
 */
import React, { useState, useCallback, useMemo } from "react";
import { LoadPanel } from "devextreme-react/load-panel";

// SlidePanel
import SlidePanel from "../../components/ui/SlidePanel";

// Shared M365
import M365PageHeader from "../../components/m365/M365PageHeader";

// Page components
import TankCommandBar from "./components/TankCommandBar";
import TankTreeList from "./components/TankTreeList";
import TankDetailPanel from "./components/TankDetailPanel";
import TankSiteSummary from "./components/TankSiteSummary";
import TankEmptyState from "./components/TankEmptyState";
import TankFormPanel from "./components/TankFormPanel";
import TankHistoryPanel from "./components/TankHistoryPanel";
import PTSDeviceLinkPanel from "./components/PTSDeviceLinkPanel";

// Hook
import useTankData from "./hooks/useTankData";

// Styles
import "./tankPage.scss";

const TankPage = () => {
    const {
        tanks,
        treeData,
        loading,
        selectedTank,
        selectedSite,
        handleSelectItem,
        selectedTankLiveStatus,
        selectedTankConnection,
        handleRefresh,
        handleDelete,
        handleUnassign,
        getSiteTanksSummary,
        dispatch,
    } = useTankData();

    /* ── Panel states ── */
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState("create");
    const [historyOpen, setHistoryOpen] = useState(false);
    const [ptsLinkOpen, setPtsLinkOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    /* ── Command bar handlers ── */
    const onAdd = useCallback(() => {
        setFormMode("create");
        setFormOpen(true);
    }, []);

    const onEdit = useCallback(() => {
        if (!selectedTank) return;
        setFormMode("edit");
        setFormOpen(true);
    }, [selectedTank]);

    const onHistory = useCallback(() => {
        if (selectedTank) setHistoryOpen(true);
    }, [selectedTank]);

    const onLinkPTS = useCallback(() => {
        if (selectedTank) setPtsLinkOpen(true);
    }, [selectedTank]);

    const onUnassign = useCallback(async () => {
        if (!selectedTank) return;
        setActionLoading(true);
        try {
            await handleUnassign();
        } finally {
            setActionLoading(false);
        }
    }, [selectedTank, handleUnassign]);

    const onDelete = useCallback(async () => {
        if (!selectedTank) return;
        setActionLoading(true);
        try {
            await handleDelete();
        } finally {
            setActionLoading(false);
        }
    }, [selectedTank, handleDelete]);

    /* ── Form callbacks ── */
    const onFormSubmit = useCallback(() => {
        setFormOpen(false);
        handleRefresh();
    }, [handleRefresh]);

    const onFormClose = useCallback(() => {
        setFormOpen(false);
    }, []);

    /* ── PTS link callbacks ── */
    const onPTSLinked = useCallback(() => {
        handleRefresh();
    }, [handleRefresh]);

    /* ── Stats ── */
    const criticalCount = useMemo(
        () =>
            Array.isArray(tanks)
                ? tanks.filter(
                    (t) =>
                        t.tankVolume > 0 &&
                        ((t.currentStock || 0) / t.tankVolume) * 100 < 20
                ).length
                : 0,
        [tanks]
    );
    const ptsLinkedCount = useMemo(
        () => (Array.isArray(tanks) ? tanks.filter((t) => t.ptsId).length : 0),
        [tanks]
    );

    /* ── Site summary data ── */
    const siteSummary =
        selectedSite && selectedSite.siteId != null
            ? getSiteTanksSummary(selectedSite.siteId)
            : null;

    const siteTanks = siteSummary?.tanks || [];

    return (
        <div className="m365-tank-page">
            {/* ── Page Header + Command Bar ── */}
            <M365PageHeader
                title="Tank Management"
                icon="fa-light fa-gas-pump"
                count={Array.isArray(tanks) ? tanks.length : 0}
            >
                <TankCommandBar
                    selectedTank={selectedTank}
                    onAdd={onAdd}
                    onEdit={onEdit}
                    onHistory={onHistory}
                    onLinkPTS={onLinkPTS}
                    onUnassign={onUnassign}
                    onDelete={onDelete}
                    onRefresh={handleRefresh}
                />
            </M365PageHeader>

            {/* ── Stats Row ── */}
            <div className="m365-stats-row">
                <div className="m365-stat-item">
                    <span className="m365-stat-item__value">
                        {Array.isArray(tanks) ? tanks.length : 0}
                    </span>
                    <span className="m365-stat-item__label">Total tanks</span>
                </div>
                <div className="m365-stat-item">
                    <span className="m365-stat-item__value">{ptsLinkedCount}</span>
                    <span className="m365-stat-item__label">PTS linked</span>
                </div>
                <div className="m365-stat-item">
                    <span
                        className="m365-stat-item__value"
                        style={criticalCount > 0 ? { color: "var(--m365-error)" } : undefined}
                    >
                        {criticalCount}
                    </span>
                    <span className="m365-stat-item__label">Critical (&lt;20%)</span>
                </div>
            </div>

            {/* ── Body: tree + content ── */}
            <div className="m365-tank-body">
                {/* ── Tree Sidebar ── */}
                <div className="m365-tank-sidebar">
                    <TankTreeList
                        dataSource={treeData}
                        onSelect={handleSelectItem}
                        loading={loading}
                    />
                </div>

                {/* ── Content Area ── */}
                <div className="m365-tank-content">
                    {selectedTank ? (
                        <TankDetailPanel
                            tank={selectedTank}
                            liveStatus={selectedTankLiveStatus}
                            connectionStatus={selectedTankConnection}
                            onEdit={onEdit}
                            onHistory={onHistory}
                            onLinkPTS={onLinkPTS}
                        />
                    ) : selectedSite ? (
                        <TankSiteSummary
                            site={selectedSite}
                            siteSummary={
                                siteSummary
                                    ? {
                                        totalVolume: siteSummary.totalCapacity,
                                        totalStock: siteSummary.totalCurrentStock,
                                        fillPct: siteSummary.avgFillPercentage,
                                        tankCount: siteSummary.tankCount,
                                        gradeBreakdown: [],
                                    }
                                    : null
                            }
                            tanks={siteTanks}
                            onSelectTank={(tank) => handleSelectItem({ type: "tank", tankData: tank })}
                        />
                    ) : (
                        <TankEmptyState />
                    )}
                </div>
            </div>

            {/* ── Form SlidePanel ── */}
            <SlidePanel
                open={formOpen}
                onClose={onFormClose}
                title={formMode === "create" ? "Add New Tank" : `Edit: ${selectedTank?.name || ""}`}
                width={1000}
            >
                <TankFormPanel
                    mode={formMode}
                    tank={formMode === "edit" ? selectedTank : null}
                    onSubmit={onFormSubmit}
                    onClose={onFormClose}
                />
            </SlidePanel>

            {/* ── History SlidePanel ── */}
            <SlidePanel
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                title={`Tank History — ${selectedTank?.name || ""}`}
                width={1000}
            >
                {historyOpen && selectedTank && (
                    <TankHistoryPanel tankId={selectedTank.id} />
                )}
            </SlidePanel>

            {/* ── PTS Device Link SlidePanel ── */}
            <SlidePanel
                open={ptsLinkOpen}
                onClose={() => setPtsLinkOpen(false)}
                title={`Link PTS Device — ${selectedTank?.name || ""}`}
                width={1000}
            >
                {ptsLinkOpen && selectedTank && (
                    <PTSDeviceLinkPanel
                        tank={selectedTank}
                        onLinked={onPTSLinked}
                        onClose={() => setPtsLinkOpen(false)}
                    />
                )}
            </SlidePanel>

            {/* ── Global Loading ── */}
            <LoadPanel
                visible={actionLoading}
                message="Processing…"
                position={{ my: "center", at: "center", of: window }}
            />
        </div>
    );
};

export default TankPage;
