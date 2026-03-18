import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { DataGrid } from "devextreme-react";
import { Column, Paging, SearchPanel, HeaderFilter, Scrolling } from "devextreme-react/data-grid";
import { SelectBox } from "devextreme-react/select-box";
import { Button } from "devextreme-react/button";
import { Popup } from "devextreme-react/popup";
import { ProgressBar } from "devextreme-react/progress-bar";
import notify from "devextreme/ui/notify";
import {
  fetchProviders,
  fetchProviderMappings,
  bulkAssignVehiclesToProvider,
  bulkUnassignVehiclesFromProvider
} from "../../../redux/actions/providerActions";
import { fetchVehicleList } from "../../../redux/actions/vehicleActions";
import businessSignalRService from "../../../signalR/businessSignalRService";

/**
 * Vehicle Assignments Component
 * Assign vehicles to specific tracking providers
 * Phase 7: Admin UI with real-time progress updates
 */
const VehicleAssignments = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { providers: providersRaw, mappings, providersLoading, mappingsLoading, assigning } = useSelector((s) => s.provider || {});
  const { vehicles: vehiclesRaw, loading: vehiclesLoading } = useSelector((s) => s.vehicle || {});

  // Bulk assignment popup state
  const [bulkPopupVisible, setBulkPopupVisible] = useState(false);
  const [bulkProviderId, setBulkProviderId] = useState(null);

  // Unassign confirmation popup state
  const [unassignConfirmVisible, setUnassignConfirmVisible] = useState(false);
  const [vehicleToUnassign, setVehicleToUnassign] = useState(null);

  // Progress tracking state
  const [progressVisible, setProgressVisible] = useState(false);
  const [progressData, setProgressData] = useState({
    jobId: null,
    operation: "",
    providerName: "",
    totalVehicles: 0,
    processedVehicles: 0,
    successCount: 0,
    failCount: 0,
    progressPercentage: 0,
    estimatedRemainingSeconds: 0,
    isComplete: false
  });

  useEffect(() => {
    dispatch(fetchProviders());
    dispatch(fetchProviderMappings());
    dispatch(fetchVehicleList());
  }, [dispatch]);

  // Listen for SignalR progress updates
  useEffect(() => {
    const unsubscribe = businessSignalRService.on("bulkProviderAssignmentProgress", (data) => {
      console.log("[VehicleAssignments] Progress update:", data);

      setProgressData({
        jobId: data.jobId,
        operation: data.operation,
        providerName: data.providerName,
        totalVehicles: data.totalVehicles,
        processedVehicles: data.processedVehicles,
        successCount: data.successCount,
        failCount: data.failCount,
        progressPercentage: data.progressPercentage,
        estimatedRemainingSeconds: data.estimatedRemainingSeconds,
        isComplete: data.isComplete
      });

      // Show progress popup
      setProgressVisible(true);

      // If complete, refresh mappings and hide after delay
      if (data.isComplete) {
        dispatch(fetchProviderMappings());

        setTimeout(() => {
          setProgressVisible(false);
        }, 3000);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [dispatch]);

  const providers = useMemo(
    () => (providersRaw || []).map((p) => ({
      providerId: p.providerId || p.ProviderId,
      providerName: p.providerName || p.ProviderName,
      displayName: p.displayName || p.DisplayName,
    })),
    [providersRaw]
  );

  const vehicles = useMemo(() => {
    // Merge vehicle data with mapping device info
    return (vehiclesRaw || []).map((v) => {
      const vehicleId = v.vehicleId || v.VehicleId;
      const mapping = (mappings || []).find(
        (m) => (m.vehicleId || m.VehicleId) === vehicleId && (m.isActive ?? m.IsActive)
      );

      return {
        vehicleId,
        hyoungNo: v.hyoungNo || v.HyoungNo,
        numberPlate: v.numberPlate || v.NumberPlate,
        externalDeviceId: mapping?.externalDeviceId || mapping?.ExternalDeviceId || null,
        deviceIMEI: mapping?.deviceIMEI || mapping?.DeviceIMEI || null,
        deviceName: mapping?.deviceName || mapping?.DeviceName || null,
        deviceType: mapping?.deviceType || mapping?.DeviceType || null,
        mappedAt: mapping?.mappedAt || mapping?.MappedAt || null,
      };
    });
  }, [vehiclesRaw, mappings]);

  const loading = providersLoading || mappingsLoading || vehiclesLoading;

  // Assignment actions will be wired via a future UI control (dropdown/button per row)

  const getProviderName = (providerId) => {
    const provider = providers.find((p) => p.providerId === providerId);
    return provider ? provider.displayName : "Unknown";
  };

  const getCurrentProviderId = (vehicleId) => {
    const mapping = (mappings || []).find(
      (m) => m.vehicleId === vehicleId && (m.isActive ?? m.IsActive)
    );
    return mapping ? (mapping.providerId || mapping.ProviderId) : null;
  };

  const handleBulkAssign = async () => {
    if (!bulkProviderId && bulkProviderId !== null) {
      notify("Please select a provider", "warning", 2000);
      return;
    }

    try {
      const vehicleIds = vehicles.map((v) => v.vehicleId);
      const isUnassignment = bulkProviderId === null;

      if (isUnassignment) {
        // Handle unassign all
        const result = await dispatch(bulkUnassignVehiclesFromProvider(vehicleIds));

        // Backend returns 202 Accepted with jobId for async processing
        if (result.jobId) {
          // Initialize progress popup
          setProgressData({
            jobId: result.jobId,
            operation: "BulkUnassign",
            providerName: "None",
            totalVehicles: result.vehicleCount,
            processedVehicles: 0,
            successCount: 0,
            failCount: 0,
            progressPercentage: 0,
            estimatedRemainingSeconds: result.estimatedSeconds || 0,
            isComplete: false
          });
          setProgressVisible(true);

          notify(
            {
              message: `Bulk unassignment started: ${result.vehicleCount} vehicles. Watch the progress bar.`,
              width: 400,
            },
            "info",
            3000
          );
        } else if (result.failCount > 0) {
          // Legacy sync response handling
          notify(`Unassigned ${result.successCount} vehicles. ${result.failCount} failed.`, "warning", 3000);
          dispatch(fetchProviderMappings());
        } else {
          notify(`Successfully unassigned all ${result.successCount} vehicles`, "success", 2000);
          dispatch(fetchProviderMappings());
        }

        setBulkPopupVisible(false);
        setBulkProviderId(null);
        return;
      }

      const assignments = vehicles.map((v) => ({
        vehicleId: v.vehicleId,
        externalDeviceId: v.externalDeviceId,
      }));

      const missingExternalDeviceIds = assignments.filter((assignment) => !assignment.externalDeviceId);
      if (missingExternalDeviceIds.length > 0) {
        notify(
          `${missingExternalDeviceIds.length} vehicles do not have an external device mapping. Map devices first before bulk provider assignment.`,
          "warning",
          3000
        );
        return;
      }

      const result = await dispatch(bulkAssignVehiclesToProvider(assignments, bulkProviderId));

      // Backend now returns 202 Accepted with jobId for async processing
      if (result.jobId) {
        const providerName = providers.find(p => p.providerId === bulkProviderId)?.displayName || "provider";

        // Initialize progress popup
        setProgressData({
          jobId: result.jobId,
          operation: "BulkAssign",
          providerName: providerName,
          totalVehicles: result.vehicleCount,
          processedVehicles: 0,
          successCount: 0,
          failCount: 0,
          progressPercentage: 0,
          estimatedRemainingSeconds: result.estimatedSeconds || 0,
          isComplete: false
        });
        setProgressVisible(true);

        notify(
          {
            message: `Bulk assignment started: ${result.vehicleCount} vehicles to ${providerName}. Watch the progress bar.`,
            width: 400,
          },
          "info",
          3000
        );

        // Refresh mappings multiple times to show progress
        const refreshIntervals = [3000, 10000, 30000, 60000];
        refreshIntervals.forEach(delay => {
          setTimeout(() => {
            dispatch(fetchProviderMappings());
          }, delay);
        });
      } else if (result.failCount > 0) {
        // Legacy sync response handling
        notify(`Assigned ${result.successCount} vehicles. ${result.failCount} failed.`, "warning", 3000);
        dispatch(fetchProviderMappings());
      } else {
        notify(`Successfully assigned all ${result.successCount} vehicles`, "success", 2000);
        dispatch(fetchProviderMappings());
      }

      setBulkPopupVisible(false);
      setBulkProviderId(null);
    } catch (error) {
      notify("Failed to start bulk operation", "error", 3000);
    }
  };

  const handleUnassign = async (vehicleId) => {
    try {
      await dispatch(bulkUnassignVehiclesFromProvider([vehicleId]));
      notify("Vehicle unassigned successfully", "success", 2000);
      // Refresh mappings to show updated assignment
      dispatch(fetchProviderMappings());
      // Close confirmation popup
      setUnassignConfirmVisible(false);
      setVehicleToUnassign(null);
    } catch (error) {
      notify("Failed to unassign vehicle", "error", 3000);
    }
  };

  const renderProviderCell = (data) => {
    const currentProviderId = getCurrentProviderId(data.data.vehicleId);

    return (
      <div className="tw-flex tw-items-center tw-justify-between">
        <span>
          {currentProviderId ? (
            getProviderName(currentProviderId)
          ) : (
            <span className="tw-text-gray-400">Not assigned</span>
          )}
        </span>
      </div>
    );
  };

  const renderActionsCell = (data) => {
    const currentProviderId = getCurrentProviderId(data.data.vehicleId);

    return (
      <div className="tw-flex tw-justify-center">
        {currentProviderId && (
          <Button
            stylingMode="text"
            text="Unassign"
            icon="fa-light fa-circle-xmark"
            onClick={() => {
              setVehicleToUnassign(data.data);
              setUnassignConfirmVisible(true);
            }}
            type="danger"
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
        <div className="tw-text-center">
          <p className="tw-text-2xl tw-font-semibold tw-text-blue-700">Loading…</p>
          <p className="tw-mt-2 tw-text-gray-600">Loading assignments…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-p-6">
      <div className="tw-bg-white tw-rounded-lg tw-shadow">
        <div className="tw-p-6 tw-border-b tw-border-gray-200">
          <div className="tw-flex tw-justify-between tw-items-center">
            <div>
              <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">Vehicle-Provider Assignments</h2>
              <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
                Assign specific vehicles to tracking providers for granular control
              </p>
            </div>
            <div className="tw-flex tw-gap-2">
              <Button
                stylingMode="outlined"
                type="normal"
                text="Map GPS Devices"
                icon="fa-light fa-satellite-dish"
                onClick={() => {
                  navigate("/admin/providers/map-devices");
                }}
                disabled={assigning || providers.length === 0}
              />
              <Button
                stylingMode="outlined"
                type="normal"
                text="Unassign All"
                icon="fa-light fa-circle-xmark"
                onClick={() => {
                  setBulkProviderId(null);
                  setBulkPopupVisible(true);
                }}
                disabled={assigning || vehicles.length === 0}
              />

            </div>
          </div>
        </div>

        <div className="tw-p-6">
          {vehicles.length === 0 ? (
            <div className="tw-text-center tw-py-12">
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
              keyExpr="vehicleId"
              showBorders={true}
              rowAlternationEnabled={true}
              hoverStateEnabled={true}
              repaintChangesOnly={false}
              key={`vehicle-grid-${(mappings || []).length}`}
            >
              <SearchPanel visible={true} />
              <HeaderFilter visible={true} />
              <Scrolling mode="standard" />
              <Paging enabled={true} defaultPageSize={20} pageSizes={[20, 50, 100]} showPageSizeSelector={true} />

              <Column dataField="vehicleId" caption="Vehicle ID" width={100} />
              <Column dataField="hyoungNo" caption="Vehicle Name" width={150} />
              <Column
                dataField="numberPlate"
                caption="Number Plate"
                width={120}
              />
              <Column
                dataField="externalDeviceId"
                caption="Device ID"
                width={120}
                cellRender={(data) => {
                  const deviceId = data.value;
                  return deviceId ? (
                    <span className="tw-text-sm tw-font-mono">{deviceId}</span>
                  ) : (
                    <span className="tw-text-gray-400 tw-text-sm">Not mapped</span>
                  );
                }}
              />
              <Column
                dataField="deviceIMEI"
                caption="Device IMEI"
                width={140}
                cellRender={(data) => {
                  const imei = data.value;
                  return imei ? (
                    <span className="tw-text-sm tw-font-mono">{imei}</span>
                  ) : (
                    <span className="tw-text-gray-400 tw-text-sm">-</span>
                  );
                }}
              />
              <Column
                dataField="deviceName"
                caption="Device Name"
                width={150}
                cellRender={(data) => {
                  const name = data.value;
                  return name || <span className="tw-text-gray-400 tw-text-sm">-</span>;
                }}
              />
              <Column
                dataField="mappedAt"
                caption="Mapped At"
                width={160}
                dataType="datetime"
                cellRender={(data) => {
                  const timestamp = data.value;
                  if (!timestamp) return <span className="tw-text-gray-400 tw-text-sm">-</span>;

                  const date = new Date(timestamp);
                  return (
                    <span className="tw-text-sm">
                      {date.toLocaleDateString()} {date.toLocaleTimeString()}
                    </span>
                  );
                }}
              />
              <Column
                caption="Assigned Provider"
                cellRender={renderProviderCell}
                minWidth={200}
                allowHiding={false}
              />
              <Column
                caption="Actions"
                cellRender={renderActionsCell}
                width={120}
                alignment="center"
                allowHiding={false}
                fixed={true}
                fixedPosition="right"
              />
            </DataGrid>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6 tw-mt-6">
        <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
          <div className="tw-flex tw-items-center tw-mb-2">
            <h3 className="tw-font-semibold tw-text-blue-900">Default Behavior</h3>
          </div>
          <p className="tw-text-sm tw-text-blue-800">
            Vehicles without specific assignments use the default provider
            configured in the system.
          </p>
        </div>

        <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded-lg tw-p-4">
          <div className="tw-flex tw-items-center tw-mb-2">
            <h3 className="tw-font-semibold tw-text-green-900">Automatic Failover</h3>
          </div>
          <p className="tw-text-sm tw-text-green-800">
            If assigned provider is unhealthy, the system automatically fails
            over to the next available provider.
          </p>
        </div>

        <div className="tw-bg-purple-50 tw-border tw-border-purple-200 tw-rounded-lg tw-p-4">
          <div className="tw-flex tw-items-center tw-mb-2">
            <h3 className="tw-font-semibold tw-text-purple-900">Performance</h3>
          </div>
          <p className="tw-text-sm tw-text-purple-800">
            Distribute vehicle load across providers for optimal performance and
            redundancy.
          </p>
        </div>
      </div>

      {/* Bulk Assignment/Unassignment Popup */}
      <Popup
        visible={bulkPopupVisible}
        onHiding={() => {
          setBulkPopupVisible(false);
          setBulkProviderId(undefined);
        }}
        dragEnabled={false}
        closeOnOutsideClick={true}
        showTitle={true}
        title={bulkProviderId === null ? "Unassign All Vehicles" : "Assign All Vehicles to Provider"}
        width={500}
        height="auto"
      >
        <div className="tw-p-4">
          <div className="tw-mb-4">
            {bulkProviderId === null ? (
              <>
                <p className="tw-text-sm tw-text-gray-700 tw-mb-2">
                  This will <strong>remove all provider assignments</strong> from all {vehicles.length} vehicles.
                  They will revert to using the default provider.
                </p>

                <div className="tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded tw-p-3 tw-mb-4">
                  <div className="tw-flex tw-items-start tw-gap-2">
                    <i className="fa-light fa-exclamation-triangle tw-text-amber-600 tw-mt-0.5"></i>
                    <div className="tw-text-sm tw-text-amber-800">
                      <strong>Warning:</strong> All vehicles will use the system default provider after this operation.
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="tw-text-sm tw-text-gray-700 tw-mb-2">
                  This will assign <strong>all {vehicles.length} vehicles</strong> to the selected provider.
                  Existing assignments will be updated.
                </p>

                {vehicles.length > 100 && (
                  <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded tw-p-3 tw-mb-4">
                    <div className="tw-flex tw-items-start tw-gap-2">
                      <i className="fa-light fa-info-circle tw-text-blue-600 tw-mt-0.5"></i>
                      <div className="tw-text-sm tw-text-blue-800">
                        <strong>Large operation:</strong> This will run in the background and may take a few minutes.
                        You can continue using the system while it processes.
                      </div>
                    </div>
                  </div>
                )}

                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Select Provider
                </label>
                <SelectBox
                  dataSource={providers}
                  displayExpr="displayName"
                  valueExpr="providerId"
                  value={bulkProviderId}
                  onValueChanged={(e) => setBulkProviderId(e.value)}
                  placeholder="Choose a provider"
                  searchEnabled={true}
                />
              </>
            )}
          </div>

          <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
            <Button
              stylingMode="text"
              text="Cancel"
              onClick={() => {
                setBulkPopupVisible(false);
                setBulkProviderId(undefined);
              }}
            />
            <Button
              stylingMode="contained"
              type={bulkProviderId === null ? "danger" : "default"}
              text={bulkProviderId === null ? `Unassign ${vehicles.length} Vehicles` : `Assign ${vehicles.length} Vehicles`}
              onClick={handleBulkAssign}
              disabled={(bulkProviderId !== null && !bulkProviderId) || assigning}
            />
          </div>
        </div>
      </Popup>

      {/* Progress Popup */}
      <Popup
        visible={progressVisible}
        onHiding={() => setProgressVisible(false)}
        dragEnabled={false}
        closeOnOutsideClick={false}
        showCloseButton={progressData.isComplete}
        showTitle={true}
        title={progressData.operation === "BulkUnassign" ? "Unassigning Vehicles" : `Assigning Vehicles to ${progressData.providerName}`}
        width={600}
        height="auto"
      >
        <div className="tw-p-6">
          <div className="tw-mb-4">
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-2">
              <span className="tw-text-sm tw-font-medium tw-text-gray-700">
                Progress: {progressData.processedVehicles} / {progressData.totalVehicles} vehicles
              </span>
              <span className="tw-text-sm tw-font-semibold tw-text-blue-600">
                {progressData.progressPercentage}%
              </span>
            </div>

            <ProgressBar
              min={0}
              max={100}
              value={progressData.progressPercentage}
              statusFormat={() => `${progressData.progressPercentage}%`}
              showStatus={false}
            />
          </div>

          <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mb-4">
            <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded tw-p-3">
              <div className="tw-text-xs tw-text-green-600 tw-mb-1">Successful</div>
              <div className="tw-text-2xl tw-font-bold tw-text-green-700">
                {progressData.successCount}
              </div>
            </div>

            <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded tw-p-3">
              <div className="tw-text-xs tw-text-red-600 tw-mb-1">Failed</div>
              <div className="tw-text-2xl tw-font-bold tw-text-red-700">
                {progressData.failCount}
              </div>
            </div>
          </div>

          {!progressData.isComplete && progressData.estimatedRemainingSeconds > 0 && (
            <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded tw-p-3 tw-mb-4">
              <div className="tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-clock tw-text-blue-600"></i>
                <span className="tw-text-sm tw-text-blue-800">
                  Estimated time remaining: {Math.ceil(progressData.estimatedRemainingSeconds)} seconds
                </span>
              </div>
            </div>
          )}

          {progressData.isComplete && (
            <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded tw-p-3 tw-mb-4">
              <div className="tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-check-circle tw-text-green-600"></i>
                <span className="tw-text-sm tw-text-green-800 tw-font-medium">
                  Operation completed successfully!
                </span>
              </div>
            </div>
          )}

          {progressData.isComplete && (
            <div className="tw-flex tw-justify-end tw-mt-4">
              <Button
                stylingMode="contained"
                text="Close"
                onClick={() => setProgressVisible(false)}
              />
            </div>
          )}
        </div>
      </Popup>

      {/* Unassign Confirmation Popup */}
      <Popup
        visible={unassignConfirmVisible}
        onHiding={() => {
          setUnassignConfirmVisible(false);
          setVehicleToUnassign(null);
        }}
        dragEnabled={false}
        closeOnOutsideClick={true}
        showTitle={true}
        title="Confirm Unassign Vehicle"
        width={500}
        height="auto"
      >
        <div className="tw-p-4">
          {vehicleToUnassign && (
            <>
              <div className="tw-mb-4">
                <p className="tw-text-sm tw-text-gray-700 tw-mb-2">
                  Are you sure you want to unassign this vehicle from its provider?
                </p>

                <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded tw-p-3 tw-mb-2">
                  <div className="tw-text-sm">
                    <div className="tw-mb-1">
                      <span className="tw-font-semibold tw-text-gray-700">Vehicle:</span>{' '}
                      <span className="tw-text-gray-900">{vehicleToUnassign.hyoungNo}</span>
                    </div>
                    <div className="tw-mb-1">
                      <span className="tw-font-semibold tw-text-gray-700">Number Plate:</span>{' '}
                      <span className="tw-text-gray-900">{vehicleToUnassign.numberPlate}</span>
                    </div>
                    <div>
                      <span className="tw-font-semibold tw-text-gray-700">Current Provider:</span>{' '}
                      <span className="tw-text-gray-900">{getProviderName(getCurrentProviderId(vehicleToUnassign.vehicleId))}</span>
                    </div>
                  </div>
                </div>

                <div className="tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded tw-p-3">
                  <div className="tw-flex tw-items-start tw-gap-2">
                    <i className="fa-light fa-info-circle tw-text-amber-600 tw-mt-0.5"></i>
                    <div className="tw-text-sm tw-text-amber-800">
                      The vehicle will revert to using the system default provider.
                    </div>
                  </div>
                </div>
              </div>

              <div className="tw-flex tw-justify-end tw-gap-2 tw-pt-4 tw-border-t tw-border-gray-200">
                <Button
                  stylingMode="text"
                  text="Cancel"
                  onClick={() => {
                    setUnassignConfirmVisible(false);
                    setVehicleToUnassign(null);
                  }}
                />
                <Button
                  stylingMode="contained"
                  type="danger"
                  text="Unassign Vehicle"
                  icon="fa-light fa-circle-xmark"
                  onClick={() => handleUnassign(vehicleToUnassign.vehicleId)}
                />
              </div>
            </>
          )}
        </div>
      </Popup>
    </div>
  );
};

export default VehicleAssignments;
