import React, { useState, useEffect } from "react";
import { DataGrid } from "devextreme-react";
import {
  Column,
  Paging,
  SearchPanel,
  HeaderFilter,
  Lookup,
} from "devextreme-react/data-grid";
import axiosInstance from "../../../api/axiosInstance";
import notify from "devextreme/ui/notify";

/**
 * Vehicle Assignments Component
 * Assign vehicles to specific tracking providers
 * Phase 7: Admin UI
 */
const VehicleAssignments = () => {
  const [vehicles, setVehicles] = useState([]);
  const [providers, setProviders] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [providersRes, mappingsRes, vehiclesRes] = await Promise.all([
        axiosInstance.get("/api/v1/providers/list"),
        axiosInstance.get("/api/v1/providers/mappings"),
        axiosInstance.get("/api/v1/vehicles"), // Adjust endpoint as needed
      ]);

      if (providersRes.data.Success) {
        setProviders(providersRes.data.Data);
      }

      if (mappingsRes.data.Success) {
        setMappings(mappingsRes.data.Data);
      }

      // For now, use placeholder vehicle data if the endpoint doesn't exist
      if (vehiclesRes.data.Success) {
        setVehicles(vehiclesRes.data.Data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      notify("Failed to load assignment data", "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignProvider = async (vehicleId, providerId) => {
    try {
      const response = await axiosInstance.post("/api/v1/providers/mappings", {
        VehicleId: vehicleId,
        ProviderId: providerId,
      });

      if (response.data.Success) {
        notify("Vehicle assigned successfully", "success", 3000);
        loadData();
      }
    } catch (error) {
      notify("Failed to assign vehicle", "error", 3000);
    }
  };

  const getProviderName = (providerId) => {
    const provider = providers.find((p) => p.ProviderId === providerId);
    return provider ? provider.DisplayName : "Unknown";
  };

  const renderProviderCell = (data) => {
    const mapping = mappings.find(
      (m) => m.VehicleId === data.data.VehicleId && m.IsActive
    );

    return (
      <div className="tw-flex tw-items-center tw-justify-between">
        <span>
          {mapping ? (
            getProviderName(mapping.ProviderId)
          ) : (
            <span className="tw-text-gray-400">Not assigned</span>
          )}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
        <div className="tw-text-center">
          <i className="fa-light fa-spinner-third fa-spin tw-text-4xl tw-text-blue-600"></i>
          <p className="tw-mt-4 tw-text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-p-6">
      <div className="tw-bg-white tw-rounded-lg tw-shadow">
        <div className="tw-p-6 tw-border-b tw-border-gray-200">
          <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
            <i className="fa-light fa-truck tw-mr-2"></i>
            Vehicle-Provider Assignments
          </h2>
          <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
            Assign specific vehicles to tracking providers for granular control
          </p>
        </div>

        <div className="tw-p-6">
          {vehicles.length === 0 ? (
            <div className="tw-text-center tw-py-12">
              <i className="fa-light fa-info-circle tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
              <p className="tw-text-gray-600">
                Vehicle assignment functionality will be available once vehicle
                data is loaded.
              </p>
              <p className="tw-text-sm tw-text-gray-500 tw-mt-2">
                This feature allows you to assign specific vehicles to specific
                tracking providers.
              </p>
            </div>
          ) : (
            <DataGrid
              dataSource={vehicles}
              keyExpr="VehicleId"
              showBorders={true}
              rowAlternationEnabled={true}
              hoverStateEnabled={true}
            >
              <SearchPanel visible={true} />
              <HeaderFilter visible={true} />
              <Paging defaultPageSize={15} />

              <Column dataField="VehicleId" caption="Vehicle ID" width={100} />
              <Column dataField="HyoungNo" caption="Vehicle Name" width={150} />
              <Column
                dataField="NumberPlate"
                caption="Number Plate"
                width={120}
              />
              <Column
                caption="Assigned Provider"
                cellRender={renderProviderCell}
              />
            </DataGrid>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6 tw-mt-6">
        <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
          <div className="tw-flex tw-items-center tw-mb-2">
            <i className="fa-light fa-info-circle tw-text-blue-600 tw-mr-2"></i>
            <h3 className="tw-font-semibold tw-text-blue-900">
              Default Behavior
            </h3>
          </div>
          <p className="tw-text-sm tw-text-blue-800">
            Vehicles without specific assignments use the default provider
            configured in the system.
          </p>
        </div>

        <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded-lg tw-p-4">
          <div className="tw-flex tw-items-center tw-mb-2">
            <i className="fa-light fa-arrows-rotate tw-text-green-600 tw-mr-2"></i>
            <h3 className="tw-font-semibold tw-text-green-900">
              Automatic Failover
            </h3>
          </div>
          <p className="tw-text-sm tw-text-green-800">
            If assigned provider is unhealthy, the system automatically fails
            over to the next available provider.
          </p>
        </div>

        <div className="tw-bg-purple-50 tw-border tw-border-purple-200 tw-rounded-lg tw-p-4">
          <div className="tw-flex tw-items-center tw-mb-2">
            <i className="fa-light fa-chart-line tw-text-purple-600 tw-mr-2"></i>
            <h3 className="tw-font-semibold tw-text-purple-900">Performance</h3>
          </div>
          <p className="tw-text-sm tw-text-purple-800">
            Distribute vehicle load across providers for optimal performance and
            redundancy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VehicleAssignments;
