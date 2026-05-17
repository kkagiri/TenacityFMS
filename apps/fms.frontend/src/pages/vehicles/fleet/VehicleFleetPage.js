/**
 * File:          VehicleFleetPage.js
 * Purpose:       M365 Admin Center style vehicle fleet page with SlidePanel details.
 * Dependencies:  M365PageHeader, SlidePanel, VehicleDataGrid, VehicleDetailPanel
 * Last Modified: 2026-03-25
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
import { usePermissions } from "../../../hooks/usePermissions";
import { EmptyState } from "../../../components/feedback";

import "./VehicleFleetPage.scss";

const VehicleFleetPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const vehicles = useSelector((state) => state.vehicle.vehicles);
  const { hasPermission } = usePermissions();
  const canCreateVehicle = hasPermission("_Create_Vehicle");

  const [showAddPanel, setShowAddPanel] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  // Check for hash navigation on mount
  useEffect(() => {
    if (location.hash === "#vehicleaction" && canCreateVehicle) {
      setShowAddPanel(true);
    } else if (location.hash === "#vehicleaction" && !canCreateVehicle) {
      navigate(location.pathname, { replace: true });
    }
  }, [canCreateVehicle, location, navigate]);

  /* ── Add Vehicle ── */
  const handleAddVehicle = useCallback(() => {
    if (!canCreateVehicle) {
      return;
    }

    setShowAddPanel(true);
    navigate(`${location.pathname}#vehicleaction`, { replace: true });
  }, [canCreateVehicle, navigate, location.pathname]);

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
        {canCreateVehicle && (
          <button className="m365-btn m365-btn--primary" onClick={handleAddVehicle}>
            <i className="fa-light fa-plus" /> Add Vehicle
          </button>
        )}
      </M365PageHeader>

      {/* ── DataGrid ── */}
      <div className="vehicle-fleet-m365__grid">
        {Array.isArray(vehicles) && vehicles.length === 0 ? (
          <EmptyState
            icon="fa-light fa-truck"
            title="No vehicles in your fleet"
            message={
              canCreateVehicle
                ? "Add the first vehicle to begin tracking fuel consumption and trips."
                : "Ask an administrator to add the first vehicle to your fleet."
            }
            actionLabel={canCreateVehicle ? "Add vehicle" : undefined}
            onAction={canCreateVehicle ? handleAddVehicle : undefined}
          />
        ) : (
          <VehicleDataGrid onSelectVehicle={handleSelectVehicle} />
        )}
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
        open={showAddPanel && canCreateVehicle}
        onClose={handleCloseAddPanel}
        title="Add New Vehicle"
        width={720}
      >
        <VehicleAddForm onSave={handleVehicleSaved} onCancel={handleCloseAddPanel} />
      </SlidePanel>
    </div>
  );
};

export default VehicleFleetPage;
