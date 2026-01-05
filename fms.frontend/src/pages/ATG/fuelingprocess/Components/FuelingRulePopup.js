import React, { useEffect, useState } from "react";
import { Popup } from "devextreme-react/popup";
import { SelectBox } from "devextreme-react/select-box";
import { NumberBox } from "devextreme-react/number-box";
import { TextBox } from "devextreme-react/text-box";
import { Button } from "devextreme-react/button";
import LoadIndicator from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllRuleSets,
  assignRuleSetToTag,
  assignRuleSetToVehicle,
  createRuleSet,
  createDailyMonthlyRule,
  fetchEffectiveRulesForVehicle,
} from "../../../../redux/actions/fuelingRuleActions";
import { fetchTagsByVehicleId } from "../../../../redux/actions/tagActions";
import FuelingRulesHelp from "./FuelingRulesHelp";

const FuelingRulePopup = ({
  isVisible,
  onClose,
  vehicleData,
  onRulesAssigned,
}) => {
  const dispatch = useDispatch();
  const ruleSets = useSelector((state) => state.fuelingRule.ruleSets);
  const loading = useSelector((state) => state.fuelingRule.loading);
  const vehicleEffectiveRules = useSelector(
    (state) => state.fuelingRule.vehicleEffectiveRules
  );
  const effectiveRulesLoading = useSelector(
    (state) => state.fuelingRule.effectiveRulesLoading
  );
  const masterTag = useSelector((state) => state.config?.masterTag || "MASTER"); //Cursor

  // Local state
  const [selectedRuleSet, setSelectedRuleSet] = useState(null);
  const [vehicleHasTag, setVehicleHasTag] = useState(false);
  const [vehicleTagId, setVehicleTagId] = useState(null);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [activeTab, setActiveTab] = useState("effective"); // "effective" or "assign"
  const [showHelp, setShowHelp] = useState(false);

  // Get effective rules for current vehicle
  const effectiveRules = vehicleData?.vehicleId
    ? vehicleEffectiveRules[vehicleData.vehicleId]
    : null;

  // Load rule sets and check if vehicle has a tag on component mount
  useEffect(() => {
    if (isVisible && vehicleData) {
      dispatch(fetchAllRuleSets());

      // Check if this vehicle has a tag
      if (vehicleData.vehicleId) {
        checkVehicleTag(vehicleData.vehicleId);

        // Fetch effective rules for this vehicle
        dispatch(
          fetchEffectiveRulesForVehicle(
            vehicleData.vehicleId,
            vehicleData.siteId || null,
            vehicleTagId
          )
        );
      }
    }
  }, [isVisible, vehicleData, dispatch]);

  // Refetch effective rules when tag ID is loaded
  useEffect(() => {
    if (isVisible && vehicleData?.vehicleId && vehicleTagId) {
      dispatch(
        fetchEffectiveRulesForVehicle(
          vehicleData.vehicleId,
          vehicleData.siteId || null,
          vehicleTagId
        )
      );
    }
  }, [vehicleTagId, dispatch]);

  // Check if vehicle has a tag
  const checkVehicleTag = async (vehicleId) => {
    try {
      setIsLoadingTags(true);
      // Get the vehicle's tags
      const tags = await dispatch(fetchTagsByVehicleId(vehicleId));

      if (tags && tags.length > 0) {
        setVehicleHasTag(true);
        setVehicleTagId(tags[0].id); // Use the first tag
      } else {
        setVehicleHasTag(false);
        setVehicleTagId(null);
      }
    } catch (error) {
      console.error("Failed to check vehicle tags:", error);
      setVehicleHasTag(false);
    } finally {
      setIsLoadingTags(false);
    }
  };

  // Handle assign rule set to vehicle's tag or directly to vehicle
  const handleAssignRuleSet = async () => {
    if (!selectedRuleSet) {
      notify("Please select a rule set", "warning", 3000);
      return;
    }

    if (!vehicleData || !vehicleData.vehicleId) {
      notify("Vehicle information is missing", "error", 3000);
      return;
    }

    try {
      setIsAssigning(true);

      let result;

      // If vehicle has a tag, assign rule set to that tag
      if (vehicleHasTag && vehicleTagId) {
        console.log(
          `Assigning rule set ${selectedRuleSet} to tag ${vehicleTagId}`
        );
        result = await dispatch(
          assignRuleSetToTag(selectedRuleSet, vehicleTagId)
        );
      } else {
        // If no tag (company vehicle or no tag assigned), assign rules directly to vehicle
        console.log(
          `Assigning rule set ${selectedRuleSet} directly to vehicle ${vehicleData.vehicleId}`
        );
        result = await dispatch(
          assignRuleSetToVehicle(selectedRuleSet, vehicleData.vehicleId)
        );
      }

      if (result.success) {
        const assignmentMethod =
          vehicleHasTag && vehicleTagId ? "tag" : "vehicle";
        notify(
          `Fueling rule set assigned successfully to ${assignmentMethod}`,
          "success",
          3000
        );

        // Notify parent component if callback provided
        if (onRulesAssigned) {
          onRulesAssigned(vehicleData);
        }

        onClose();
      } else {
        throw new Error(result.error || "Failed to assign rule set");
      }
    } catch (error) {
      console.error("Error assigning rule set:", error);
      notify(
        error.message || "An error occurred while assigning rule set",
        "error",
        3000
      );
    } finally {
      setIsAssigning(false);
    }
  };

  // Render content
  const renderContent = () => {
    if (loading || isLoadingTags) {
      return (
        <div className="loading-container tw-flex tw-justify-center tw-items-center tw-flex-col tw-p-6 tw-h-full">
          <LoadIndicator width={40} height={40} />
          <p className="tw-mt-3">Loading data...</p>
        </div>
      );
    }

    return (
      <div className="fueling-rule-popup-content tw-p-3 sm:tw-p-4 tw-h-full tw-overflow-y-auto tw-overflow-x-hidden">
        {/* Vehicle Info Section */}
        <div className="vehicle-info tw-bg-gray-50 tw-rounded-lg tw-p-3 sm:tw-p-4 tw-mb-4">
          <div className="tw-flex tw-items-center tw-mb-2">
            <i className="fa-light fa-car tw-text-primary tw-mr-2"></i>
            <h4 className="tw-text-base sm:tw-text-lg tw-font-medium tw-m-0">
              Vehicle Information
            </h4>
          </div>

          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-2 sm:tw-gap-4 tw-mt-2">
            <div className="tw-text-sm">
              <span className="tw-text-gray-500">Registration:</span>
              <span className="tw-font-medium tw-ml-2 tw-break-all">
                {vehicleData?.regNumber || vehicleData?.hyoungNo || "N/A"}
              </span>
            </div>

            <div className="tw-text-sm">
              <span className="tw-text-gray-500">Vehicle Type:</span>
              <span className="tw-font-medium tw-ml-2">
                {vehicleData?.isCompanyVehicle
                  ? "Company Vehicle"
                  : vehicleData?.vehicleTypeName || "Regular Vehicle"}
              </span>
            </div>

            <div className="tw-col-span-1 sm:tw-col-span-2 tw-text-sm">
              <span className="tw-text-gray-500">Tag Status:</span>
              <span
                className={`tw-font-medium tw-ml-2 ${
                  vehicleHasTag ? "tw-text-green-600" : "tw-text-amber-600"
                }`}
              >
                {vehicleHasTag ? "Tag Available" : "No Tag - Using Master"}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tw-flex tw-items-center tw-border-b tw-border-gray-200 tw-mb-4">
          <button
            className={`tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-border-b-2 tw-transition-colors ${
              activeTab === "effective"
                ? "tw-border-blue-500 tw-text-blue-600"
                : "tw-border-transparent tw-text-gray-500 hover:tw-text-gray-700"
            }`}
            onClick={() => setActiveTab("effective")}
          >
            <i className="fa-light fa-layer-group tw-mr-2"></i>
            Effective Rules
          </button>
          <button
            className={`tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-border-b-2 tw-transition-colors ${
              activeTab === "assign"
                ? "tw-border-blue-500 tw-text-blue-600"
                : "tw-border-transparent tw-text-gray-500 hover:tw-text-gray-700"
            }`}
            onClick={() => setActiveTab("assign")}
          >
            <i className="fa-light fa-plus-circle tw-mr-2"></i>
            Assign Rules
          </button>
          {/* Help Button */}
          <button
            className="tw-ml-auto tw-px-3 tw-py-2 tw-text-sm tw-text-gray-500 hover:tw-text-blue-600 tw-transition-colors tw-flex tw-items-center tw-gap-1"
            onClick={() => setShowHelp(true)}
            title="Help - Learn about Fueling Rules"
          >
            <i className="fa-light fa-circle-question"></i>
            <span className="tw-hidden sm:tw-inline">Help</span>
          </button>
        </div>

        {/* Help Popup */}
        <FuelingRulesHelp
          visible={showHelp}
          onClose={() => setShowHelp(false)}
        />

        {/* Tab Content */}
        {activeTab === "effective"
          ? renderEffectiveRulesTab()
          : renderAssignRulesTab()}
      </div>
    );
  };

  // Render effective rules tab content
  const renderEffectiveRulesTab = () => {
    if (effectiveRulesLoading) {
      return (
        <div className="tw-flex tw-justify-center tw-items-center tw-py-8">
          <LoadIndicator width={32} height={32} />
          <span className="tw-ml-3 tw-text-gray-600">
            Loading effective rules...
          </span>
        </div>
      );
    }

    if (!effectiveRules || !effectiveRules.hasRules) {
      return (
        <div className="tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded-lg tw-p-4 tw-text-center">
          <i className="fa-light fa-exclamation-triangle tw-text-amber-500 tw-text-3xl tw-mb-2"></i>
          <h4 className="tw-text-base tw-font-semibold tw-text-amber-800 tw-mb-2">
            No Fueling Rules Configured
          </h4>
          <p className="tw-text-sm tw-text-amber-700 tw-mb-3">
            This vehicle has no fueling rules assigned at any level (Site,
            Vehicle Type, Tag, or Vehicle).
          </p>
          <Button
            text="Assign Rules"
            type="default"
            stylingMode="outlined"
            onClick={() => setActiveTab("assign")}
          />
        </div>
      );
    }

    // Helper to get target type label
    const getTargetTypeLabel = (targetType) => {
      const labels = {
        1: "Site",
        2: "Vehicle Type",
        3: "Tag",
        4: "Vehicle",
      };
      return labels[targetType] || "Unknown";
    };

    // Helper to get target type icon
    const getTargetTypeIcon = (targetType) => {
      const icons = {
        1: "fa-light fa-building",
        2: "fa-light fa-truck",
        3: "fa-light fa-tag",
        4: "fa-light fa-car",
      };
      return icons[targetType] || "fa-light fa-circle";
    };

    return (
      <div className="effective-rules-content tw-space-y-4">
        {/* Status Summary */}
        <div
          className={`tw-p-4 tw-rounded-lg tw-border ${
            effectiveRules.isAllowed
              ? "tw-bg-green-50 tw-border-green-200"
              : "tw-bg-red-50 tw-border-red-200"
          }`}
        >
          <div className="tw-flex tw-items-center tw-gap-3">
            <i
              className={`tw-text-2xl ${
                effectiveRules.isAllowed
                  ? "fa-light fa-check-circle tw-text-green-600"
                  : "fa-light fa-times-circle tw-text-red-600"
              }`}
            ></i>
            <div>
              <h4
                className={`tw-font-semibold tw-m-0 ${
                  effectiveRules.isAllowed
                    ? "tw-text-green-800"
                    : "tw-text-red-800"
                }`}
              >
                {effectiveRules.isAllowed
                  ? "Fueling Allowed"
                  : "Fueling Not Allowed"}
              </h4>
              {effectiveRules.maxFuelAllowed !== null &&
                effectiveRules.maxFuelAllowed !== undefined && (
                  <p className="tw-text-sm tw-m-0 tw-mt-1 tw-text-gray-600">
                    Maximum allowed:{" "}
                    <span className="tw-font-semibold">
                      {effectiveRules.maxFuelAllowed}L
                    </span>
                  </p>
                )}
            </div>
          </div>
        </div>

        {/* Merged Limits */}
        {(effectiveRules.dailyLimit > 0 ||
          effectiveRules.monthlyLimit > 0 ||
          effectiveRules.perTransactionLimit > 0) && (
          <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
            <h5 className="tw-text-sm tw-font-semibold tw-text-blue-800 tw-mb-3 tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-gauge-high"></i>
              Effective Limits (Merged)
            </h5>
            <div className="tw-grid tw-grid-cols-3 tw-gap-3">
              {effectiveRules.dailyLimit > 0 && (
                <div className="tw-text-center tw-p-2 tw-bg-white tw-rounded tw-border tw-border-blue-100">
                  <div className="tw-text-lg tw-font-bold tw-text-blue-700">
                    {effectiveRules.dailyLimit}L
                  </div>
                  <div className="tw-text-xs tw-text-gray-500">Daily</div>
                </div>
              )}
              {effectiveRules.monthlyLimit > 0 && (
                <div className="tw-text-center tw-p-2 tw-bg-white tw-rounded tw-border tw-border-blue-100">
                  <div className="tw-text-lg tw-font-bold tw-text-blue-700">
                    {effectiveRules.monthlyLimit}L
                  </div>
                  <div className="tw-text-xs tw-text-gray-500">Monthly</div>
                </div>
              )}
              {effectiveRules.perTransactionLimit > 0 && (
                <div className="tw-text-center tw-p-2 tw-bg-white tw-rounded tw-border tw-border-blue-100">
                  <div className="tw-text-lg tw-font-bold tw-text-blue-700">
                    {effectiveRules.perTransactionLimit}L
                  </div>
                  <div className="tw-text-xs tw-text-gray-500">
                    Per Transaction
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Usage Statistics */}
        {(effectiveRules.dailyUsed > 0 || effectiveRules.monthlyUsed > 0) && (
          <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
            <h5 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3 tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-chart-bar"></i>
              Current Usage
            </h5>
            <div className="tw-grid tw-grid-cols-2 tw-gap-3">
              <div className="tw-p-2 tw-bg-white tw-rounded tw-border">
                <div className="tw-flex tw-justify-between tw-items-center">
                  <span className="tw-text-xs tw-text-gray-500">Today</span>
                  <span className="tw-font-semibold tw-text-gray-700">
                    {effectiveRules.dailyUsed || 0}L
                  </span>
                </div>
                {effectiveRules.dailyLimit > 0 && (
                  <div className="tw-mt-1 tw-h-1.5 tw-bg-gray-200 tw-rounded-full tw-overflow-hidden">
                    <div
                      className="tw-h-full tw-bg-blue-500 tw-rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (effectiveRules.dailyUsed /
                            effectiveRules.dailyLimit) *
                            100
                        )}%`,
                      }}
                    ></div>
                  </div>
                )}
              </div>
              <div className="tw-p-2 tw-bg-white tw-rounded tw-border">
                <div className="tw-flex tw-justify-between tw-items-center">
                  <span className="tw-text-xs tw-text-gray-500">
                    This Month
                  </span>
                  <span className="tw-font-semibold tw-text-gray-700">
                    {effectiveRules.monthlyUsed || 0}L
                  </span>
                </div>
                {effectiveRules.monthlyLimit > 0 && (
                  <div className="tw-mt-1 tw-h-1.5 tw-bg-gray-200 tw-rounded-full tw-overflow-hidden">
                    <div
                      className="tw-h-full tw-bg-blue-500 tw-rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (effectiveRules.monthlyUsed /
                            effectiveRules.monthlyLimit) *
                            100
                        )}%`,
                      }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Applied Rule Sets - Cascade Hierarchy */}
        {effectiveRules.appliedRuleSets &&
          effectiveRules.appliedRuleSets.length > 0 && (
            <div className="tw-bg-gradient-to-br tw-from-indigo-50 tw-to-purple-50 tw-border tw-border-indigo-200 tw-rounded-lg tw-p-4">
              <h5 className="tw-text-sm tw-font-semibold tw-text-indigo-800 tw-mb-3 tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-layer-group"></i>
                Applied Rule Sets (Cascade)
              </h5>
              <div className="tw-space-y-2">
                {effectiveRules.appliedRuleSets
                  .sort((a, b) => (b.priority || 0) - (a.priority || 0))
                  .map((ruleSet, index) => (
                    <div
                      key={ruleSet.ruleSetId || index}
                      className="tw-flex tw-items-center tw-gap-3 tw-p-2 tw-bg-white tw-rounded tw-border tw-border-indigo-100"
                    >
                      <div
                        className={`tw-w-8 tw-h-8 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-white tw-text-xs tw-font-bold ${
                          index === 0 ? "tw-bg-indigo-600" : "tw-bg-indigo-400"
                        }`}
                      >
                        {ruleSet.priority || index + 1}
                      </div>
                      <div className="tw-flex-1">
                        <div className="tw-flex tw-items-center tw-gap-2">
                          <i
                            className={`${getTargetTypeIcon(
                              ruleSet.targetType
                            )} tw-text-indigo-500`}
                          ></i>
                          <span className="tw-font-medium tw-text-gray-800">
                            {ruleSet.ruleSetName}
                          </span>
                        </div>
                        <div className="tw-text-xs tw-text-gray-500">
                          Applied at: {getTargetTypeLabel(ruleSet.targetType)}{" "}
                          level
                          {ruleSet.targetName && ` (${ruleSet.targetName})`}
                        </div>
                      </div>
                      {index === 0 && (
                        <span className="tw-text-xs tw-bg-indigo-100 tw-text-indigo-700 tw-px-2 tw-py-0.5 tw-rounded">
                          Highest Priority
                        </span>
                      )}
                    </div>
                  ))}
              </div>
              <p className="tw-text-xs tw-text-indigo-600 tw-mt-3 tw-italic">
                <i className="fa-light fa-info-circle tw-mr-1"></i>
                Rules are merged from Site → Vehicle Type → Tag → Vehicle.
                Higher priority overrides lower.
              </p>
            </div>
          )}
      </div>
    );
  };

  // Render assign rules tab content
  const renderAssignRulesTab = () => {
    return (
      <div className="assign-ruleset-section tw-space-y-4">
        {!ruleSets || ruleSets.length === 0 ? (
          <div className="no-rules-warning tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded-lg tw-p-4 tw-text-center">
            <i className="fa-light fa-exclamation-triangle tw-text-amber-500 tw-text-3xl tw-mb-2"></i>
            <h4 className="tw-text-base tw-font-semibold tw-text-amber-800 tw-mb-2">
              No Rule Sets Available
            </h4>
            <p className="tw-text-sm tw-text-amber-700 tw-mb-3">
              You need to create fueling rule sets before assigning them to
              vehicles.
            </p>
            <p className="tw-text-xs tw-text-amber-600">
              Go to Tag Management → Fueling Rules to create rule sets.
            </p>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label className="tw-block tw-mb-2 tw-font-medium tw-text-sm sm:tw-text-base">
                Select Rule Set
              </label>
              <SelectBox
                dataSource={ruleSets}
                displayExpr="name"
                valueExpr="id"
                placeholder="Select a rule set"
                value={selectedRuleSet}
                onValueChanged={(e) => setSelectedRuleSet(e.value)}
                showClearButton={true}
                searchEnabled={true}
                height={44}
                dropDownOptions={{
                  width: "auto",
                  minWidth: 250,
                  maxHeight: 300,
                  shading: true,
                  shadingColor: "rgba(0, 0, 0, 0.3)",
                  closeOnOutsideClick: true,
                }}
                itemRender={(item) => (
                  <div className="tw-py-2">
                    <div className="tw-font-medium">{item.name}</div>
                    {item.description && (
                      <div className="tw-text-xs tw-text-gray-500 tw-mt-1">
                        {item.description}
                      </div>
                    )}
                    <div className="tw-text-xs tw-text-gray-400 tw-mt-1">
                      {item.rules?.length || 0} rule(s)
                    </div>
                  </div>
                )}
              />

              {selectedRuleSet &&
                ruleSets.find((r) => r.id === selectedRuleSet) && (
                  <div className="rule-details tw-mt-3 tw-p-3 sm:tw-p-4 tw-bg-gradient-to-br tw-from-blue-50 tw-to-indigo-50 tw-rounded-lg tw-border tw-border-blue-200">
                    <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
                      <i className="fa-light fa-list-check tw-text-blue-600"></i>
                      <h4 className="tw-text-sm sm:tw-text-md tw-font-semibold tw-text-blue-900 tw-m-0">
                        Rule Set Preview
                      </h4>
                    </div>

                    {(() => {
                      const selectedSet = ruleSets.find(
                        (r) => r.id === selectedRuleSet
                      );
                      const hasRules =
                        selectedSet.rules && selectedSet.rules.length > 0;

                      if (!hasRules) {
                        return (
                          <p className="tw-text-sm tw-text-gray-500 tw-italic">
                            This rule set has no configured rules.
                          </p>
                        );
                      }

                      return (
                        <div className="rule-details-grid tw-space-y-3 tw-text-sm">
                          {selectedSet.rules.map((rule, idx) => (
                            <div
                              key={idx}
                              className="rule-item tw-p-2 tw-bg-white tw-rounded tw-border tw-border-blue-100"
                            >
                              <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                                <i
                                  className={`${
                                    rule.discriminator ===
                                    "DailyMonthlyLimitRule"
                                      ? "fa-light fa-gauge-high tw-text-green-600"
                                      : rule.discriminator === "NoOfRefillRule"
                                      ? "fa-light fa-hashtag tw-text-amber-600"
                                      : "fa-light fa-clock tw-text-purple-600"
                                  }`}
                                ></i>
                                <span className="tw-font-semibold tw-text-gray-800 tw-text-xs">
                                  {rule.ruleName || "Unnamed Rule"}
                                </span>
                              </div>

                              {rule.discriminator ===
                                "DailyMonthlyLimitRule" && (
                                <div className="tw-space-y-1 tw-text-xs tw-ml-6">
                                  {rule.dailyLimit > 0 && (
                                    <div className="tw-flex tw-justify-between">
                                      <span className="tw-text-gray-600">
                                        Daily:
                                      </span>
                                      <span className="tw-font-medium tw-text-gray-900">
                                        {rule.dailyLimit}L
                                      </span>
                                    </div>
                                  )}
                                  {rule.monthlyLimit > 0 && (
                                    <div className="tw-flex tw-justify-between">
                                      <span className="tw-text-gray-600">
                                        Monthly:
                                      </span>
                                      <span className="tw-font-medium tw-text-gray-900">
                                        {rule.monthlyLimit}L
                                      </span>
                                    </div>
                                  )}
                                  {rule.fuelingLimit > 0 && (
                                    <div className="tw-flex tw-justify-between">
                                      <span className="tw-text-gray-600">
                                        Per Transaction:
                                      </span>
                                      <span className="tw-font-medium tw-text-gray-900">
                                        {rule.fuelingLimit}L
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {rule.discriminator === "NoOfRefillRule" && (
                                <div className="tw-space-y-1 tw-text-xs tw-ml-6">
                                  {rule.maxRefillsPerDay > 0 && (
                                    <div className="tw-flex tw-justify-between">
                                      <span className="tw-text-gray-600">
                                        Daily Refills:
                                      </span>
                                      <span className="tw-font-medium tw-text-gray-900">
                                        {rule.maxRefillsPerDay}x
                                      </span>
                                    </div>
                                  )}
                                  {rule.maxRefillsPerWeek > 0 && (
                                    <div className="tw-flex tw-justify-between">
                                      <span className="tw-text-gray-600">
                                        Weekly Refills:
                                      </span>
                                      <span className="tw-font-medium tw-text-gray-900">
                                        {rule.maxRefillsPerWeek}x
                                      </span>
                                    </div>
                                  )}
                                  {rule.maxRefillsPerMonth > 0 && (
                                    <div className="tw-flex tw-justify-between">
                                      <span className="tw-text-gray-600">
                                        Monthly Refills:
                                      </span>
                                      <span className="tw-font-medium tw-text-gray-900">
                                        {rule.maxRefillsPerMonth}x
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {rule.discriminator === "TimeWindowRule" && (
                                <div className="tw-text-xs tw-ml-6 tw-text-gray-700">
                                  {rule.startTime} - {rule.endTime}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
            </div>

            <div className="actions tw-mt-4">
              <Button
                text={isAssigning ? "Assigning..." : "Assign Rule Set"}
                type="success"
                stylingMode="contained"
                onClick={handleAssignRuleSet}
                disabled={!selectedRuleSet || isAssigning}
                width="100%"
                height={44}
                icon={isAssigning ? null : "fa-light fa-check"}
              >
                {isAssigning && <LoadIndicator width={20} height={20} />}
              </Button>
            </div>
          </>
        )}

        {(!vehicleHasTag || vehicleData?.isCompanyVehicle) && (
          <div className="master-tag-note tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3 tw-mt-3">
            <div className="tw-flex tw-items-start">
              <i className="fa-light fa-info-circle tw-text-blue-500 tw-mr-2 tw-mt-1 tw-flex-shrink-0"></i>
              <div className="tw-flex-1">
                <h5 className="tw-text-blue-700 tw-font-medium tw-text-xs sm:tw-text-sm tw-m-0">
                  {vehicleHasTag ? "Company Vehicle" : "Direct Rule Assignment"}
                </h5>
                <p className="tw-text-blue-600 tw-text-xs sm:tw-text-sm tw-mt-1 tw-mb-0">
                  {vehicleHasTag
                    ? "Rules will be assigned to the vehicle's tag. When no tag is scanned, the system will use the master tag for authorization."
                    : "This vehicle has no assigned tag. Rules will be assigned directly to the vehicle. The system will use the master tag for fueling authorization."}
                </p>
                <p className="tw-text-blue-600 tw-text-xs sm:tw-text-sm tw-mt-1 tw-mb-0">
                  Master Tag ID:{" "}
                  <span className="tw-font-semibold tw-break-all">
                    {masterTag}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Popup
      visible={isVisible}
      onHiding={onClose}
      title="Vehicle Fueling Rules"
      showCloseButton={true}
      width="95%"
      maxWidth={600}
      height="85vh"
      maxHeight={700}
      className="fueling-rule-popup"
      wrapperAttr={{
        class: "fueling-rule-popup-wrapper",
      }}
    >
      <div className="tw-h-full tw-flex tw-flex-col tw-overflow-hidden">
        {renderContent()}
      </div>
    </Popup>
  );
};

export default FuelingRulePopup;
