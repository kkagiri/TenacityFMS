/**
 * File: FuelingRulesMain.js
 * Purpose: Route-based shell for fueling rules sub-pages (sidebar-driven navigation).
 * Dependencies: react-router-dom, redux actions, sub-page components
 * Last Modified: 2026-02-27
 *
 * Key Components:
 * - FuelingRulesMain: Renders the active sub-page based on URL path.
 */
import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchAllRuleSets } from "../../../redux/actions/fuelingRuleActions";
import { fetchTags } from "../../../redux/actions/tagActions";
import { fetchVehicleList } from "../../../redux/actions/vehicleActions";
import RuleSetsPage from "./RuleSetsPage";
import LocationGeofencePage from "./LocationGeofencePage";

/**
 * FuelingRulesMain - Route shell for fueling rules module.
 * Sidebar navigation drives sub-page rendering via URL:
 *   /rulesets          → Rule Sets page (tabs: Rule Sets, Assignments, Simulator)
 *   /location-geofence → Location & Geofence
 */
const FuelingRulesMain = () => {
  const dispatch = useDispatch();

  // Load shared data once at mount
  useEffect(() => {
    dispatch(fetchAllRuleSets());
    dispatch(fetchTags());
    dispatch(fetchVehicleList());
  }, [dispatch]);

  return (
    <Routes>
      <Route index element={<Navigate to="rulesets" replace />} />
      <Route path="rulesets" element={<RuleSetsPage />} />
      <Route path="location-geofence" element={<LocationGeofencePage />} />
      <Route path="*" element={<Navigate to="rulesets" replace />} />
    </Routes>
  );
};

export default FuelingRulesMain;
