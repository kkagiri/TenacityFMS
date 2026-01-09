import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SelectBox } from "devextreme-react/select-box";
import { DateBox } from "devextreme-react/date-box";
import { Button } from "devextreme-react/button";
import { LoadIndicator } from "devextreme-react/load-indicator";
import { TextBox } from "devextreme-react/text-box";
import DataGrid, {
  Column,
  Paging,
  Scrolling,
} from "devextreme-react/data-grid";
import notify from "devextreme/ui/notify";
import { fetchSiteList } from "../../../../redux/actions/siteActions";
import { fetchVehicleTypes } from "../../../../redux/actions/vehicleTypeActions";
import { fetchVehicleList } from "../../../../redux/actions/vehicleActions";
import {
  simulateFuelingRules,
  fetchAllRuleSets,
} from "../../../../redux/actions/fuelingRuleActions";
import "./RuleSimulator.scss";

/**
 * RuleSimulator - Simulate and visualize which fueling rules apply
 * Allows users to:
 * 1. Select vehicle type, site, and simulate a specific time
 * 2. Select a specific vehicle for more detailed simulation
 * 3. See which rules would apply and whether fueling would be allowed
 */
const RuleSimulator = () => {
  const dispatch = useDispatch();

  // Redux state
  const sites = useSelector((state) => state.site?.sites || []);
  const vehicleTypes = useSelector(
    (state) => state.vehicleType?.vehicleTypes || []
  );
  const vehicles = useSelector((state) => state.vehicle?.vehicles || []);
  const ruleSets = useSelector((state) => state.fuelingRule?.ruleSets || []);

  // Simulation inputs
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [selectedVehicleTypeId, setSelectedVehicleTypeId] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [simulationTime, setSimulationTime] = useState(new Date());

  // Results
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState(null);
  const [vehicleResults, setVehicleResults] = useState([]);

  // Load initial data
  useEffect(() => {
    dispatch(fetchSiteList());
    dispatch(fetchVehicleTypes());
    dispatch(fetchVehicleList());
    dispatch(fetchAllRuleSets());
  }, [dispatch]);

  // Filter vehicles by selected criteria
  const filteredVehicles = useMemo(() => {
    let result = [...vehicles];

    if (selectedSiteId) {
      result = result.filter((v) => v.workingSiteId === selectedSiteId);
    }

    if (selectedVehicleTypeId) {
      result = result.filter((v) => v.vehicleTypeId === selectedVehicleTypeId);
    }

    return result;
  }, [vehicles, selectedSiteId, selectedVehicleTypeId]);

  // Run simulation for selected vehicle
  const runVehicleSimulation = useCallback(async () => {
    if (!selectedVehicleId) {
      notify("Please select a vehicle to simulate", "warning", 3000);
      return;
    }

    setIsSimulating(true);
    try {
      const result = await dispatch(
        simulateFuelingRules(
          selectedVehicleId,
          selectedSiteId,
          simulationTime.toISOString()
        )
      );

      if (result.success) {
        setSimulationResults(result.data);
        notify("Simulation completed successfully", "success", 2000);
      } else {
        notify(result.error || "Simulation failed", "error", 3000);
      }
    } catch (error) {
      notify("Error running simulation: " + error.message, "error", 3000);
    } finally {
      setIsSimulating(false);
    }
  }, [dispatch, selectedVehicleId, selectedSiteId, simulationTime]);

  // Run bulk simulation for all filtered vehicles
  const runBulkSimulation = useCallback(async () => {
    if (filteredVehicles.length === 0) {
      notify("No vehicles match the selected criteria", "warning", 3000);
      return;
    }

    if (filteredVehicles.length > 100) {
      notify("Too many vehicles. Please narrow your selection.", "warning", 3000);
      return;
    }

    setIsSimulating(true);
    setVehicleResults([]);

    try {
      const results = [];
      for (const vehicle of filteredVehicles) {
        try {
          const result = await dispatch(
            simulateFuelingRules(
              vehicle.vehicleId || vehicle.id,
              selectedSiteId,
              simulationTime.toISOString()
            )
          );

          results.push({
            vehicleId: vehicle.vehicleId || vehicle.id,
            hyoungNo: vehicle.hyoungNo || vehicle.numberPlate || `Vehicle ${vehicle.vehicleId}`,
            vehicleTypeName: vehicle.vehicleType?.vehicleTypeName ||
              vehicleTypes.find(vt => vt.vehicleTypeId === vehicle.vehicleTypeId)?.vehicleTypeName ||
              "Unknown",
            siteName: sites.find(s => s.siteId === vehicle.workingSiteId)?.siteName || "N/A",
            isAllowed: result.success ? result.data?.isAllowed : false,
            hasRules: result.success ? result.data?.hasRules : false,
            maxFuelAllowed: result.success ? result.data?.maxFuelAllowed : 0,
            limitingFactor: result.success ? result.data?.limitingFactor : "Error",
            message: result.success ? result.data?.message : result.error,
            appliedRuleSets: result.success ? result.data?.appliedRuleSets : [],
            blockedReason: result.success ? result.data?.blockedReason : null,
          });
        } catch (err) {
          results.push({
            vehicleId: vehicle.vehicleId || vehicle.id,
            hyoungNo: vehicle.hyoungNo || vehicle.numberPlate || `Vehicle ${vehicle.vehicleId}`,
            vehicleTypeName: "Unknown",
            siteName: "N/A",
            isAllowed: false,
            hasRules: false,
            maxFuelAllowed: 0,
            limitingFactor: "Error",
            message: err.message,
            appliedRuleSets: [],
          });
        }
      }

      setVehicleResults(results);
      notify(`Simulated ${results.length} vehicles`, "success", 2000);
    } catch (error) {
      notify("Error running bulk simulation: " + error.message, "error", 3000);
    } finally {
      setIsSimulating(false);
    }
  }, [dispatch, filteredVehicles, selectedSiteId, simulationTime, vehicleTypes, sites]);

  // Reset simulation
  const resetSimulation = () => {
    setSimulationResults(null);
    setVehicleResults([]);
    setSelectedVehicleId(null);
  };

  // Render status badge
  const renderStatusBadge = (isAllowed, hasRules) => {
    if (!hasRules) {
      return (
        <span className="tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium tw-bg-gray-100 tw-text-gray-700">
          <i className="fa-light fa-circle-question"></i>
          No Rules
        </span>
      );
    }
    if (isAllowed) {
      return (
        <span className="tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium tw-bg-green-100 tw-text-green-700">
          <i className="fa-light fa-check-circle"></i>
          Allowed
        </span>
      );
    }
    return (
      <span className="tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium tw-bg-red-100 tw-text-red-700">
        <i className="fa-light fa-times-circle"></i>
        Blocked
      </span>
    );
  };

  // Render applied rules
  const renderAppliedRules = (appliedRuleSets) => {
    if (!appliedRuleSets || appliedRuleSets.length === 0) {
      return <span className="tw-text-gray-400 tw-text-sm">No rules applied</span>;
    }

    return (
      <div className="tw-flex tw-flex-wrap tw-gap-1">
        {appliedRuleSets.map((rs, idx) => (
          <span
            key={idx}
            className="tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-bg-blue-50 tw-text-blue-700 tw-border tw-border-blue-200"
            title={`${rs.targetType}: ${rs.targetName}`}
          >
            <i className={getTargetTypeIcon(rs.targetType)}></i>
            {rs.ruleSetName}
          </span>
        ))}
      </div>
    );
  };

  // Get icon for target type
  const getTargetTypeIcon = (targetType) => {
    switch (targetType?.toLowerCase()) {
      case "site":
        return "fa-light fa-building";
      case "vehicletype":
      case "vehicle type":
        return "fa-light fa-truck";
      case "tag":
        return "fa-light fa-tag";
      case "vehicle":
        return "fa-light fa-car";
      default:
        return "fa-light fa-layer-group";
    }
  };

  // Cell render for status column
  const statusCellRender = (data) => {
    return renderStatusBadge(data.data.isAllowed, data.data.hasRules);
  };

  // Cell render for rules column
  const rulesCellRender = (data) => {
    return renderAppliedRules(data.data.appliedRuleSets);
  };

  return (
    <div className="rule-simulator tw-p-4">
      {/* Header */}
      <div className="tw-mb-6">
        <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-flask tw-text-purple-600"></i>
          Fueling Rule Simulator
        </h2>
        <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
          Simulate which fueling rules would apply to vehicles based on site,
          vehicle type, and time of day
        </p>
      </div>

      {/* Simulation Inputs */}
      <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-mb-6">
        <h3 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-4 tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-sliders"></i>
          Simulation Parameters
        </h3>

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
          {/* Site Selection */}
          <div>
            <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">
              <i className="fa-light fa-building tw-mr-1"></i>
              Site
            </label>
            <SelectBox
              dataSource={sites}
              displayExpr={(item) => item?.siteName || item?.name || ""}
              valueExpr="siteId"
              value={selectedSiteId}
              onValueChanged={(e) => {
                setSelectedSiteId(e.value);
                resetSimulation();
              }}
              placeholder="Select site..."
              showClearButton={true}
              searchEnabled={true}
              className="tw-w-full"
            />
          </div>

          {/* Vehicle Type Selection */}
          <div>
            <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">
              <i className="fa-light fa-truck tw-mr-1"></i>
              Vehicle Type
            </label>
            <SelectBox
              dataSource={vehicleTypes}
              displayExpr={(item) =>
                item?.vehicleTypeName || item?.name || ""
              }
              valueExpr="vehicleTypeId"
              value={selectedVehicleTypeId}
              onValueChanged={(e) => {
                setSelectedVehicleTypeId(e.value);
                resetSimulation();
              }}
              placeholder="All vehicle types..."
              showClearButton={true}
              searchEnabled={true}
              className="tw-w-full"
            />
          </div>

          {/* Simulation Time */}
          <div>
            <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">
              <i className="fa-light fa-clock tw-mr-1"></i>
              Simulation Time
            </label>
            <DateBox
              type="datetime"
              value={simulationTime}
              onValueChanged={(e) => {
                setSimulationTime(e.value);
                resetSimulation();
              }}
              displayFormat="yyyy-MM-dd HH:mm"
              className="tw-w-full"
            />
          </div>

          {/* Specific Vehicle (optional) */}
          <div>
            <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">
              <i className="fa-light fa-car tw-mr-1"></i>
              Specific Vehicle (Optional)
            </label>
            <SelectBox
              dataSource={filteredVehicles}
              displayExpr={(item) =>
                item?.hyoungNo || item?.numberPlate || `Vehicle ${item?.vehicleId}`
              }
              valueExpr="vehicleId"
              value={selectedVehicleId}
              onValueChanged={(e) => setSelectedVehicleId(e.value)}
              placeholder="Select vehicle..."
              showClearButton={true}
              searchEnabled={true}
              className="tw-w-full"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="tw-flex tw-gap-3 tw-mt-4 tw-pt-4 tw-border-t tw-border-gray-100">
          <Button
            text="Simulate Selected Vehicle"
            type="default"
            stylingMode="contained"
            icon="fa-light fa-play"
            onClick={runVehicleSimulation}
            disabled={isSimulating || !selectedVehicleId}
            className="tw-flex tw-items-center tw-gap-2"
          />
          <Button
            text={`Simulate All (${filteredVehicles.length} vehicles)`}
            type="success"
            stylingMode="contained"
            icon="fa-light fa-layer-group"
            onClick={runBulkSimulation}
            disabled={isSimulating || filteredVehicles.length === 0}
            className="tw-flex tw-items-center tw-gap-2"
          />
          <Button
            text="Reset"
            type="normal"
            stylingMode="outlined"
            icon="fa-light fa-refresh"
            onClick={resetSimulation}
            disabled={isSimulating}
          />

          {isSimulating && (
            <div className="tw-flex tw-items-center tw-gap-2 tw-ml-4">
              <LoadIndicator height={20} width={20} />
              <span className="tw-text-sm tw-text-gray-600">Simulating...</span>
            </div>
          )}
        </div>
      </div>

      {/* Single Vehicle Simulation Results */}
      {simulationResults && (
        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-mb-6">
          <h3 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-4 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-clipboard-check"></i>
            Single Vehicle Simulation Result
          </h3>

          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
            {/* Status Card */}
            <div
              className={`tw-p-4 tw-rounded-lg tw-border-2 ${
                simulationResults.isAllowed
                  ? "tw-border-green-200 tw-bg-green-50"
                  : simulationResults.hasRules
                  ? "tw-border-red-200 tw-bg-red-50"
                  : "tw-border-gray-200 tw-bg-gray-50"
              }`}
            >
              <div className="tw-flex tw-items-center tw-gap-3 tw-mb-3">
                <i
                  className={`tw-text-3xl ${
                    simulationResults.isAllowed
                      ? "fa-light fa-check-circle tw-text-green-600"
                      : simulationResults.hasRules
                      ? "fa-light fa-times-circle tw-text-red-600"
                      : "fa-light fa-question-circle tw-text-gray-600"
                  }`}
                ></i>
                <div>
                  <div className="tw-text-lg tw-font-semibold">
                    {simulationResults.isAllowed
                      ? "Fueling Allowed"
                      : simulationResults.hasRules
                      ? "Fueling Blocked"
                      : "No Rules Configured"}
                  </div>
                  <div className="tw-text-sm tw-text-gray-600">
                    {simulationResults.vehicle?.hyoungNo || "Selected Vehicle"}
                  </div>
                </div>
              </div>

              {simulationResults.message && (
                <p className="tw-text-sm tw-text-gray-700 tw-mb-2">
                  {simulationResults.message}
                </p>
              )}

              {simulationResults.blockedReason && (
                <p className="tw-text-sm tw-text-red-600 tw-font-medium">
                  <i className="fa-light fa-exclamation-triangle tw-mr-1"></i>
                  {simulationResults.blockedReason}
                </p>
              )}
            </div>

            {/* Limits Card */}
            <div className="tw-p-4 tw-rounded-lg tw-border tw-border-gray-200 tw-bg-gray-50">
              <div className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-3">
                <i className="fa-light fa-gauge-high tw-mr-1"></i>
                Fuel Limits at Simulated Time
              </div>

              <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                <div>
                  <div className="tw-text-xs tw-text-gray-500">Max Fuel Allowed</div>
                  <div className="tw-text-lg tw-font-semibold tw-text-blue-600">
                    {simulationResults.maxFuelAllowed?.toFixed(1) || 0} L
                  </div>
                </div>
                <div>
                  <div className="tw-text-xs tw-text-gray-500">Limiting Factor</div>
                  <div className="tw-text-sm tw-font-medium">
                    {simulationResults.limitingFactor || "N/A"}
                  </div>
                </div>
                {simulationResults.dailyRemaining != null && (
                  <div>
                    <div className="tw-text-xs tw-text-gray-500">Daily Remaining</div>
                    <div className="tw-text-sm tw-font-medium">
                      {simulationResults.dailyRemaining?.toFixed(1)} L
                    </div>
                  </div>
                )}
                {simulationResults.monthlyRemaining != null && (
                  <div>
                    <div className="tw-text-xs tw-text-gray-500">Monthly Remaining</div>
                    <div className="tw-text-sm tw-font-medium">
                      {simulationResults.monthlyRemaining?.toFixed(1)} L
                    </div>
                  </div>
                )}
              </div>

              {/* Time Window Info */}
              {(simulationResults.timeWindowStart || simulationResults.timeWindowEnd) && (
                <div className="tw-mt-3 tw-pt-3 tw-border-t tw-border-gray-200">
                  <div className="tw-text-xs tw-text-gray-500 tw-mb-1">
                    <i className="fa-light fa-clock tw-mr-1"></i>
                    Time Window
                  </div>
                  <div className="tw-text-sm tw-font-medium">
                    {simulationResults.timeWindowStart} - {simulationResults.timeWindowEnd}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Applied Rule Sets */}
          {simulationResults.appliedRuleSets?.length > 0 && (
            <div className="tw-mt-4 tw-pt-4 tw-border-t tw-border-gray-200">
              <div className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-3">
                <i className="fa-light fa-layer-group tw-mr-1"></i>
                Applied Rule Sets (Priority Order)
              </div>

              <div className="tw-space-y-2">
                {simulationResults.appliedRuleSets.map((rs, idx) => (
                  <div
                    key={idx}
                    className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-blue-50 tw-rounded-lg tw-border tw-border-blue-200"
                  >
                    <div className="tw-flex tw-items-center tw-gap-3">
                      <span className="tw-flex tw-items-center tw-justify-center tw-w-6 tw-h-6 tw-rounded-full tw-bg-blue-200 tw-text-blue-800 tw-text-xs tw-font-bold">
                        {rs.priority}
                      </span>
                      <div>
                        <div className="tw-font-medium tw-text-gray-800">
                          {rs.ruleSetName}
                        </div>
                        <div className="tw-text-xs tw-text-gray-600">
                          <i className={`${getTargetTypeIcon(rs.targetType)} tw-mr-1`}></i>
                          {rs.targetType}: {rs.targetName}
                        </div>
                      </div>
                    </div>
                    {rs.rulesApplied?.length > 0 && (
                      <div className="tw-text-xs tw-text-gray-500">
                        {rs.rulesApplied.length} rule(s)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk Simulation Results Grid */}
      {vehicleResults.length > 0 && (
        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
            <h3 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-table"></i>
              Bulk Simulation Results
            </h3>
            <div className="tw-flex tw-items-center tw-gap-4 tw-text-sm">
              <span className="tw-flex tw-items-center tw-gap-1 tw-text-green-600">
                <i className="fa-light fa-check-circle"></i>
                {vehicleResults.filter((r) => r.isAllowed).length} Allowed
              </span>
              <span className="tw-flex tw-items-center tw-gap-1 tw-text-red-600">
                <i className="fa-light fa-times-circle"></i>
                {vehicleResults.filter((r) => !r.isAllowed && r.hasRules).length} Blocked
              </span>
              <span className="tw-flex tw-items-center tw-gap-1 tw-text-gray-600">
                <i className="fa-light fa-question-circle"></i>
                {vehicleResults.filter((r) => !r.hasRules).length} No Rules
              </span>
            </div>
          </div>

          <DataGrid
            dataSource={vehicleResults}
            showBorders={true}
            showRowLines={true}
            rowAlternationEnabled={true}
            columnAutoWidth={true}
            wordWrapEnabled={true}
            keyExpr="vehicleId"
          >
            <Scrolling mode="virtual" />
            <Paging enabled={true} pageSize={20} />

            <Column
              dataField="hyoungNo"
              caption="Vehicle"
              width={120}
            />
            <Column
              dataField="vehicleTypeName"
              caption="Type"
              width={120}
            />
            <Column
              dataField="siteName"
              caption="Site"
              width={120}
            />
            <Column
              caption="Status"
              width={100}
              cellRender={statusCellRender}
              alignment="center"
            />
            <Column
              dataField="maxFuelAllowed"
              caption="Max Fuel (L)"
              width={100}
              dataType="number"
              format="#,##0.0"
              alignment="right"
            />
            <Column
              dataField="limitingFactor"
              caption="Limiting Factor"
              width={130}
            />
            <Column
              caption="Applied Rules"
              minWidth={200}
              cellRender={rulesCellRender}
            />
            <Column
              dataField="message"
              caption="Details"
              minWidth={150}
            />
          </DataGrid>
        </div>
      )}

      {/* Empty State */}
      {!simulationResults && vehicleResults.length === 0 && (
        <div className="tw-bg-gray-50 tw-rounded-lg tw-border-2 tw-border-dashed tw-border-gray-200 tw-p-8 tw-text-center">
          <i className="fa-light fa-flask tw-text-4xl tw-text-gray-400 tw-mb-3"></i>
          <h3 className="tw-text-lg tw-font-medium tw-text-gray-700 tw-mb-2">
            Ready to Simulate
          </h3>
          <p className="tw-text-sm tw-text-gray-500 tw-max-w-md tw-mx-auto">
            Select a site, vehicle type, and time to see which fueling rules
            would apply. You can simulate a single vehicle or all vehicles
            matching your criteria.
          </p>

          {/* Quick Tips */}
          <div className="tw-mt-6 tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4 tw-text-left tw-max-w-2xl tw-mx-auto">
            <div className="tw-p-3 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200">
              <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                <i className="fa-light fa-clock tw-text-blue-500"></i>
                Time Window Rules
              </div>
              <p className="tw-text-xs tw-text-gray-500">
                Change the simulation time to test time-based restrictions
              </p>
            </div>
            <div className="tw-p-3 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200">
              <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                <i className="fa-light fa-layer-group tw-text-purple-500"></i>
                Rule Cascade
              </div>
              <p className="tw-text-xs tw-text-gray-500">
                See how Site → Vehicle Type → Tag → Vehicle rules cascade
              </p>
            </div>
            <div className="tw-p-3 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200">
              <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                <i className="fa-light fa-list-check tw-text-green-500"></i>
                Bulk Testing
              </div>
              <p className="tw-text-xs tw-text-gray-500">
                Test multiple vehicles at once to verify your rule configuration
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RuleSimulator;
