/**
 * File:          useTankData.js
 * Purpose:       Custom hook — data fetching, tree transformation, selection, filtering, and
 *                site summary logic for the Tank Management V2 page.
 * Dependencies:  react, react-redux, tankActions, siteActions
 * Last Modified: 2026-02-26
 *
 * Key Exports:
 * - tanks / sites / loading          Redux data slices
 * - treeData                         Transformed tree rows (site parents + tank children)
 * - selectedTank / selectedSite      Currently selected item
 * - connectionStatuses / uploadStatus  Live PTS signal data
 * - handleSelectItem                 Tree selection handler
 * - handleRefresh / handleDelete / handleUnassign  CRUD helpers
 * - getSiteTanksSummary              Compute site-level tank aggregates
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTanks,
  updateTank,
  deleteTank,
} from "../../../redux/actions/tankActions";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import notify from "devextreme/ui/notify";

/* ── helpers ── */
const normalizeSiteId = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const UNASSIGNED_KEY = "unassigned";

const useTankData = () => {
  const dispatch = useDispatch();

  /* ── redux selectors ── */
  const { tanks, loading: tanksLoading } = useSelector((s) => s.tank);
  const { sites } = useSelector((s) => s.site);
  const { user } = useSelector((s) => s.auth);
  const connectionStatuses = useSelector(
    (s) => s.deviceConnections?.connectionStatuses || {}
  );
  const uploadStatusByDevice = useSelector(
    (s) => s.realtimeStatus?.uploadStatusByDevice || {}
  );

  /* ── local state ── */
  const [selectedTank, setSelectedTank] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  /* ── initial fetch ── */
  useEffect(() => {
    dispatch(fetchTanks());
    dispatch(fetchSiteList());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── inactive-site resolver ── */
  const getInactiveSiteId = useCallback(() => {
    if (!Array.isArray(sites) || sites.length === 0) return null;
    const byName = sites.find((s) => {
      const n = (s?.name || "").trim().toLowerCase();
      return (
        n === "inactive" ||
        n === "inactive site" ||
        n === "unassigned" ||
        n === "unassigned tanks" ||
        n === "no site" ||
        n === "not assigned"
      );
    });
    if (byName?.id) return Number(byName.id);
    const byFlag = sites.find((s) => s?.isActive === false || s?.isActive === 0);
    return byFlag?.id ? Number(byFlag.id) : null;
  }, [sites]);

  /* ── tree-data transformation ── */
  const treeData = useMemo(() => {
    if (!sites || !tanks) return [];
    const rows = [];

    const sitesWithTanks = sites.filter((site) =>
      tanks.some((t) => normalizeSiteId(t.siteId) === normalizeSiteId(site.id))
    );

    sitesWithTanks.forEach((site) => {
      rows.push({
        id: `site_${site.id}`,
        name: site.name,
        type: "site",
        siteId: site.id,
        siteData: site,
      });
    });

    tanks.forEach((tank) => {
      const parentKey = normalizeSiteId(tank.siteId) ?? UNASSIGNED_KEY;
      if (sitesWithTanks.some((s) => normalizeSiteId(s.id) === parentKey)) {
        rows.push({
          id: `tank_${tank.id}`,
          parentId: `site_${parentKey}`,
          name: tank.name,
          type: "tank",
          tankData: tank,
          volume: tank.tankVolume,
          currentStock: tank.currentStock,
        });
      }
    });

    // Unassigned bucket
    const unassigned = tanks.filter((t) => normalizeSiteId(t.siteId) === null);
    if (unassigned.length > 0) {
      rows.push({
        id: `site_${UNASSIGNED_KEY}`,
        name: "Unassigned Tanks",
        type: "site",
        siteId: null,
        siteData: null,
      });
      unassigned.forEach((tank) => {
        rows.push({
          id: `tank_${tank.id}`,
          parentId: `site_${UNASSIGNED_KEY}`,
          name: tank.name,
          type: "tank",
          tankData: tank,
          volume: tank.tankVolume,
          currentStock: tank.currentStock,
        });
      });
    }

    return rows;
  }, [sites, tanks]);

  /* ── selection handler ── */
  const handleSelectItem = useCallback((selectedRowData) => {
    if (!selectedRowData) {
      setSelectedTank(null);
      setSelectedSite(null);
      return;
    }
    if (selectedRowData.type === "tank") {
      setSelectedTank(selectedRowData.tankData);
      setSelectedSite(null);
    } else {
      setSelectedTank(null);
      setSelectedSite(selectedRowData);
    }
  }, []);

  /* ── refresh ── */
  const handleRefresh = useCallback(() => {
    dispatch(fetchTanks());
    dispatch(fetchSiteList());
  }, [dispatch]);

  /* ── delete ── */
  const handleDelete = useCallback(
    async (tank) => {
      if (!tank) return;
      const confirmed = window.confirm(
        `Delete tank "${tank.name}"? This action cannot be undone.`
      );
      if (!confirmed) return;

      setActionLoading(true);
      try {
        const result = await dispatch(deleteTank(tank.id));
        if (result?.success) {
          setSelectedTank(null);
          setSelectedSite(null);
          await dispatch(fetchTanks());
          notify("Tank deleted successfully", "success", 2500);
        } else {
          notify(result?.message || "Failed to delete tank", "error", 3000);
        }
      } catch (err) {
        notify(err.message || "Failed to delete tank", "error", 3000);
      } finally {
        setActionLoading(false);
      }
    },
    [dispatch]
  );

  /* ── unassign ── */
  const handleUnassign = useCallback(
    async (tank) => {
      if (!tank) return;
      const confirmed = window.confirm(
        `Unassign tank "${tank.name}" from its current site?`
      );
      if (!confirmed) return;

      setActionLoading(true);
      try {
        const inactiveSiteId = getInactiveSiteId();
        if (!inactiveSiteId) {
          notify(
            "No inactive/unassigned site found. Create a site named 'Inactive' first.",
            "warning",
            4500
          );
          return;
        }
        const payload = { ...tank, siteId: inactiveSiteId };
        const result = await dispatch(updateTank(tank.id, payload));
        if (result?.success) {
          await dispatch(fetchTanks());
          setSelectedTank({ ...tank, siteId: inactiveSiteId, siteName: "Inactive" });
          notify("Tank moved to inactive site successfully", "success", 3000);
        } else {
          notify("Failed to unassign tank", "error", 3000);
        }
      } catch (err) {
        notify(err.message || "Failed to unassign tank", "error", 3000);
      } finally {
        setActionLoading(false);
      }
    },
    [dispatch, getInactiveSiteId]
  );

  /* ── site summary ── */
  const getSiteTanksSummary = useCallback(
    (siteId) => {
      if (!tanks)
        return {
          tanks: [],
          totalCapacity: 0,
          totalCurrentStock: 0,
          totalAvailable: 0,
          avgFillPercentage: 0,
          tankCount: 0,
        };

      const nId = normalizeSiteId(siteId);
      const siteTanks = tanks.filter(
        (t) => normalizeSiteId(t.siteId) === nId
      );
      const totalCapacity = siteTanks.reduce((s, t) => s + (t.tankVolume || 0), 0);
      const totalCurrentStock = siteTanks.reduce((s, t) => s + (t.currentStock || 0), 0);
      return {
        tanks: siteTanks,
        totalCapacity,
        totalCurrentStock,
        totalAvailable: totalCapacity - totalCurrentStock,
        avgFillPercentage: totalCapacity > 0 ? (totalCurrentStock / totalCapacity) * 100 : 0,
        tankCount: siteTanks.length,
      };
    },
    [tanks]
  );

  /* ── live status helpers ── */
  const selectedTankLiveStatus = selectedTank?.ptsId
    ? uploadStatusByDevice[selectedTank.ptsId]
    : null;
  const selectedTankConnection = selectedTank?.ptsId
    ? connectionStatuses[selectedTank.ptsId]
    : null;

  return {
    /* data */
    tanks,
    sites,
    user,
    treeData,
    loading: tanksLoading || actionLoading,

    /* selection */
    selectedTank,
    selectedSite,
    setSelectedTank,
    setSelectedSite,
    handleSelectItem,

    /* live PTS */
    connectionStatuses,
    uploadStatusByDevice,
    selectedTankLiveStatus,
    selectedTankConnection,

    /* actions */
    handleRefresh,
    handleDelete,
    handleUnassign,
    getSiteTanksSummary,
    dispatch,
  };
};

export default useTankData;
