/**
 * File:          useSiteData.js
 * Purpose:       Custom hook that manages site page state — data fetching, filtering, selection
 * Dependencies:  react, react-redux, siteActions, userActions, siteTagApi, geofenceService
 * Last Modified: 2026-02-26
 *
 * Key Functions:
 * - filteredSites:     Sites filtered by active tab, search text, admin, and tag
 * - handleSelectSite:  Set currently selected site
 * - handleRefresh:     Re-fetch site list
 * - handleDelete:      Delete a site with confirmation
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchSiteList,
    createSite,
    updateSite,
    deleteSite,
    fetchSiteStats,
} from "../../../redux/actions/siteActions";
import { fetchUsers } from "../../../redux/actions/userActions";
import { getGpsGateTags } from "../../../api/siteTagApi";
import { getGeofences } from "../../../api/geofenceService";
import notify from "devextreme/ui/notify";

const useSiteData = () => {
    const dispatch = useDispatch();
    const { sites, loading, creating, updating, deleting, siteStats, loadingStats } =
        useSelector((state) => state.site);
    const { users } = useSelector((state) => state.user);

    const [selectedSite, setSelectedSite] = useState(null);
    const [activeTab, setActiveTab] = useState("all"); // "all" | "active" | "inactive"
    const [searchText, setSearchText] = useState("");
    const [administratorFilter, setAdministratorFilter] = useState("");
    const [tagFilter, setTagFilter] = useState("");
    const [gpsGateTags, setGpsGateTags] = useState([]);
    const [loadingTags, setLoadingTags] = useState(false);
    const [geofences, setGeofences] = useState([]);
    const [loadingGeofences, setLoadingGeofences] = useState(false);

    // Load data on mount
    useEffect(() => {
        dispatch(fetchSiteList(true)); // includeInactive for admin view
        dispatch(fetchUsers());
        loadGpsGateTags();
        loadGeofences();
    }, [dispatch]);

    // Fetch stats when a site is selected
    useEffect(() => {
        if (selectedSite?.id) {
            dispatch(fetchSiteStats(selectedSite.id));
        }
    }, [dispatch, selectedSite?.id]);

    const loadGpsGateTags = async () => {
        setLoadingTags(true);
        try {
            const response = await getGpsGateTags();
            if (response?.isSuccess && response.data) {
                setGpsGateTags(response.data);
            } else if (Array.isArray(response?.data)) {
                setGpsGateTags(response.data);
            } else if (Array.isArray(response)) {
                setGpsGateTags(response);
            }
        } catch (error) {
            console.error("Failed to load GPSGate tags:", error);
        } finally {
            setLoadingTags(false);
        }
    };

    const loadGeofences = async () => {
        setLoadingGeofences(true);
        try {
            const data = await getGeofences();
            const polygonGeofences = (Array.isArray(data) ? data : [])
                .filter((g) => String(g?.geofenceType || "").toLowerCase() === "polygon")
                .sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));

            setGeofences(polygonGeofences);
        } catch (error) {
            console.error("Failed to load geofences:", error);
            setGeofences([]);
        } finally {
            setLoadingGeofences(false);
        }
    };

    // Filtered sites via tabs, search, and dropdown filters
    const filteredSites = useMemo(() => {
        if (!Array.isArray(sites)) return [];

        return sites.filter((site) => {
            // Tab filter
            if (activeTab === "active" && !site.isActive) return false;
            if (activeTab === "inactive" && site.isActive) return false;

            // Search filter (name)
            if (searchText && !site.name?.toLowerCase().includes(searchText.toLowerCase())) {
                return false;
            }

            // Administrator filter
            if (administratorFilter && site.siteAdministratorId !== administratorFilter) {
                return false;
            }

            // GPSGate tag filter
            if (tagFilter && String(site.gpsGateTagId) !== String(tagFilter)) {
                return false;
            }

            return true;
        });
    }, [sites, activeTab, searchText, administratorFilter, tagFilter]);

    // Tab counts
    const tabCounts = useMemo(() => {
        if (!Array.isArray(sites)) return { all: 0, active: 0, inactive: 0 };
        return {
            all: sites.length,
            active: sites.filter((s) => s.isActive).length,
            inactive: sites.filter((s) => !s.isActive).length,
        };
    }, [sites]);

    // Unique administrators for filter dropdown
    const administrators = useMemo(() => {
        if (!Array.isArray(sites)) return [];
        const map = new Map();
        sites.forEach((s) => {
            if (s.siteAdministratorId && s.siteAdministratorName) {
                map.set(s.siteAdministratorId, s.siteAdministratorName);
            }
        });
        return Array.from(map, ([id, name]) => ({ id, name }));
    }, [sites]);

    // Unique tags for filter dropdown
    const uniqueTags = useMemo(() => {
        if (!Array.isArray(sites)) return [];
        const map = new Map();
        sites.forEach((s) => {
            if (s.gpsGateTagId && s.gpsGateTagName) {
                map.set(s.gpsGateTagId, { id: s.gpsGateTagId, name: s.gpsGateTagName, color: s.gpsGateTagColor });
            }
        });
        return Array.from(map.values());
    }, [sites]);

    const handleSelectSite = useCallback((site) => {
        setSelectedSite(site);
    }, []);

    const handleRefresh = useCallback(() => {
        dispatch(fetchSiteList(true));
    }, [dispatch]);

    const handleDelete = useCallback(
        async (site) => {
            if (!site) return;
            if (!window.confirm(`Delete site "${site.name}"? This cannot be undone.`)) return;

            const result = await dispatch(deleteSite(site.id));
            if (result.success) {
                notify("Site deleted successfully", "success", 3000);
                setSelectedSite(null);
            } else {
                notify(result.message || "Failed to delete site", "error", 5000);
            }
        },
        [dispatch]
    );

    const handleCreate = useCallback(
        async (formData) => {
            const result = await dispatch(createSite(formData));
            if (result.success) {
                notify("Site created successfully", "success", 3000);
                dispatch(fetchSiteList(true));
            } else {
                notify(
                    result.validationErrors?.join(", ") || result.message || "Failed to create site",
                    "error",
                    5000
                );
            }
            return result;
        },
        [dispatch]
    );

    const handleUpdate = useCallback(
        async (siteId, formData) => {
            const result = await dispatch(updateSite(siteId, formData));
            if (result.success) {
                notify("Site updated successfully", "success", 3000);
                // Refresh list and update selection
                const refreshResult = await dispatch(fetchSiteList(true));
                if (refreshResult?.data) {
                    const updated = refreshResult.data.find((s) => s.id === siteId);
                    if (updated) setSelectedSite(updated);
                }
            } else {
                notify(
                    result.validationErrors?.join(", ") || result.message || "Failed to update site",
                    "error",
                    5000
                );
            }
            return result;
        },
        [dispatch]
    );

    return {
        // Data
        sites,
        filteredSites,
        selectedSite,
        siteStats,
        loadingStats,
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
    };
};

export default useSiteData;
