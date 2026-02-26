/**
 * File:          VehicleFleetPage.js
 * Purpose:       M365 Admin Center style vehicle fleet page with SlidePanel details.
 * Dependencies:  M365PageHeader, SlidePanel, VehicleDataGrid, VehicleDetailPanel
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - M365 page header with Add Vehicle action
 * - VehicleDataGrid (row click opens detail panel)
 * - VehicleDetailPanel (SlidePanel for viewing / editing)
 * - Add Vehicle SlidePanel
 */
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import M365PageHeader from "../../../components/m365/M365PageHeader";
import SlidePanel from "../../../components/ui/SlidePanel";
import VehicleDataGrid from "./VehicleDataGrid";
import VehicleAddForm from "./VehicleAddForm";
import VehicleDetailPanel from "./VehicleDetailPanel";

import "./VehicleFleetPage.scss";

const VehicleFleetPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const vehicles = useSelector((state) => state.vehicle.vehicles);

  const [showAddPanel, setShowAddPanel] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  // Check for hash navigation on mount
  useEffect(() => {
    if (location.hash === "#vehicleaction") {
      setShowAddPanel(true);
    }
  }, [location]);

  /* ── Add Vehicle ── */
  const handleAddVehicle = useCallback(() => {
    setShowAddPanel(true);
    navigate(`${location.pathname}#vehicleaction`, { replace: true });
  }, [navigate, location.pathname]);

  const handleCloseAddPanel = useCallback(() => {
    setShowAddPanel(false);
    if (location.hash === "#vehicleaction") {
      navigate(location.pathname, { replace: true });
    }
  }, [navigate, location]);

  const handleVehicleSaved = useCallback(
    (vehicleData) => {
      handleCloseAddPanel();
      if (vehicleData?.vehicleId) {
        setSelectedVehicleId(vehicleData.vehicleId);
      }
    },
    [handleCloseAddPanel]
  );

  /* ── Vehicle selection from grid ── */
  const handleSelectVehicle = useCallback((vehicleId) => {
    setSelectedVehicleId(vehicleId);
  }, []);

  const handleCloseDetailPanel = useCallback(() => {
    setSelectedVehicleId(null);
  }, []);

  /* ── Refresh grid after updates ── */
  const handleVehicleUpdated = useCallback(() => {
    // DataGrid handles its own state via Redux — just close sub-panels
  }, []);

  return (
    <div className="vehicle-fleet-m365">
      {/* ── M365 Page Header ── */}
      <M365PageHeader
        title="Vehicles"
        icon="fa-light fa-truck"
        count={vehicles?.length}
      >
        <button className="m365-btn m365-btn--primary" onClick={handleAddVehicle}>
          <i className="fa-light fa-plus" /> Add Vehicle
        </button>
      </M365PageHeader>

      {/* ── DataGrid ── */}
      <div className="vehicle-fleet-m365__grid">
        <VehicleDataGrid onSelectVehicle={handleSelectVehicle} />
      </div>

      {/* ── Detail Panel ── */}
      <VehicleDetailPanel
        open={selectedVehicleId != null}
        onClose={handleCloseDetailPanel}
        vehicleId={selectedVehicleId}
        onVehicleUpdated={handleVehicleUpdated}
      />

      {/* ── Add Vehicle Panel ── */}
      <SlidePanel
        open={showAddPanel}
        onClose={handleCloseAddPanel}
        title="Add New Vehicle"
        width={720}
      >
        <div className="tw-p-5">
          <VehicleAddForm onSave={handleVehicleSaved} onCancel={handleCloseAddPanel} />
        </div>
      </SlidePanel>
    </div>
  );
};

export default VehicleFleetPage;
