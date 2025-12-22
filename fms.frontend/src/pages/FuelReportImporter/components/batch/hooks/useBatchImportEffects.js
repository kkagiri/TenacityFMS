/**
 * File: useBatchImportEffects.js
 * Purpose: Centralized useEffect hooks for BatchImportPage
 * Extracted from: BatchImportPage.js
 *
 * Contains all useEffect hooks:
 * - Data initialization (sites, vehicles)
 * - Navigation blocking during import
 * - SignalR setup
 */

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import notify from "devextreme/ui/notify";

import { fetchSiteList } from "../../../../../redux/actions/siteActions";
import { fetchVehicleList } from "../../../../../redux/actions/vehicleActions";
import useBatchImportSignalR from "../useBatchImportSignalR";

const useBatchImportEffects = ({
  loading,
  setFiles,
  setImportProgress,
  setActiveJobId,
  activeJobIdRef,
  pendingJobsMapRef,
  setPendingJobsMap,
  importResolversRef,
  lockedUrlRef,
  revertingRouteRef,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Load sites and vehicles on mount
  useEffect(() => {
    dispatch(fetchSiteList());
    dispatch(fetchVehicleList());
  }, [dispatch]);

  // Setup SignalR listeners using custom hook
  useBatchImportSignalR({
    setFiles,
    setImportProgress,
    setActiveJobId,
    activeJobIdRef,
    pendingJobsMapRef,
    setPendingJobsMap,
    importResolversRef,
  });

  // Prevent leaving the page while import is running (browser refresh/close)
  useEffect(() => {
    if (!loading) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [loading]);

  // BrowserRouter navigation blocking during import
  useEffect(() => {
    const currentUrl = `${location.pathname}${location.search}${location.hash}`;

    if (!loading) {
      lockedUrlRef.current = null;
      revertingRouteRef.current = false;
      return;
    }

    // Capture the URL where the import started
    if (!lockedUrlRef.current) {
      lockedUrlRef.current = currentUrl;
      return;
    }

    // If route changes during import, revert immediately
    if (
      lockedUrlRef.current !== currentUrl &&
      revertingRouteRef.current === false
    ) {
      revertingRouteRef.current = true;
      notify(
        "Import is running. Please wait until it completes before leaving this page.",
        "warning",
        3000
      );
      navigate(lockedUrlRef.current, { replace: true });

      // Allow future route-change detection after the revert renders
      setTimeout(() => {
        revertingRouteRef.current = false;
      }, 0);
    }
  }, [location, loading, navigate, lockedUrlRef, revertingRouteRef]);
};

export default useBatchImportEffects;
