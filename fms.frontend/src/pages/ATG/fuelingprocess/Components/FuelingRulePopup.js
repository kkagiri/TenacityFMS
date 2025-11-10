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
} from "../../../../redux/actions/fuelingRuleActions";
import { fetchTagsByVehicleId } from "../../../../redux/actions/tagActions";

const FuelingRulePopup = ({ isVisible, onClose, vehicleData, onRulesAssigned }) => {
  const dispatch = useDispatch();
  const ruleSets = useSelector((state) => state.fuelingRule.ruleSets);
  const loading = useSelector((state) => state.fuelingRule.loading);
  const masterTag = useSelector((state) => state.config?.masterTag || "MASTER"); //Cursor

  // Local state
  const [selectedRuleSet, setSelectedRuleSet] = useState(null);
  const [vehicleHasTag, setVehicleHasTag] = useState(false);
  const [vehicleTagId, setVehicleTagId] = useState(null);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Load rule sets and check if vehicle has a tag on component mount
  useEffect(() => {
    if (isVisible && vehicleData) {
      dispatch(fetchAllRuleSets());

      // Check if this vehicle has a tag
      if (vehicleData.vehicleId) {
        checkVehicleTag(vehicleData.vehicleId);
      }
    }
  }, [isVisible, vehicleData, dispatch]);

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
        console.log(`Assigning rule set ${selectedRuleSet} to tag ${vehicleTagId}`);
        result = await dispatch(
          assignRuleSetToTag(selectedRuleSet, vehicleTagId)
        );
      } else {
        // If no tag (company vehicle or no tag assigned), assign rules directly to vehicle
        console.log(`Assigning rule set ${selectedRuleSet} directly to vehicle ${vehicleData.vehicleId}`);
        result = await dispatch(
          assignRuleSetToVehicle(selectedRuleSet, vehicleData.vehicleId)
        );
      }

      if (result.success) {
        const assignmentMethod = vehicleHasTag && vehicleTagId ? "tag" : "vehicle";
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
                {vehicleData?.regNumber || "N/A"}
              </span>
            </div>

            <div className="tw-text-sm">
              <span className="tw-text-gray-500">Vehicle Type:</span>
              <span className="tw-font-medium tw-ml-2">
                {vehicleData?.isCompanyVehicle
                  ? "Company Vehicle"
                  : "Regular Vehicle"}
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

        {/* Assign Rule Set Section */}
        <div className="assign-ruleset-section tw-space-y-4">
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
                <div>
                  {item.name}
                </div>
              )}
            />

            {selectedRuleSet &&
              ruleSets.find((r) => r.id === selectedRuleSet) && (
                <div className="rule-details tw-mt-3 tw-p-3 sm:tw-p-4 tw-bg-gray-50 tw-rounded-lg">
                  <h4 className="tw-text-sm sm:tw-text-md tw-font-medium tw-mb-2">
                    Rule Set Details
                  </h4>
                  <div className="rule-details-grid tw-space-y-2 tw-text-sm">
                    {ruleSets.find((r) => r.id === selectedRuleSet)
                      .dailyMonthlyLimitRule && (
                      <>
                        <div className="detail-row tw-flex tw-justify-between">
                          <span className="label tw-text-gray-600">
                            Daily Limit:
                          </span>
                          <span className="value tw-font-medium">
                            {
                              ruleSets.find((r) => r.id === selectedRuleSet)
                                .dailyMonthlyLimitRule.dailyLimit
                            }
                            L
                          </span>
                        </div>
                        <div className="detail-row tw-flex tw-justify-between">
                          <span className="label tw-text-gray-600">
                            Monthly Limit:
                          </span>
                          <span className="value tw-font-medium">
                            {
                              ruleSets.find((r) => r.id === selectedRuleSet)
                                .dailyMonthlyLimitRule.monthlyLimit
                            }
                            L
                          </span>
                        </div>
                        <div className="detail-row tw-flex tw-justify-between">
                          <span className="label tw-text-gray-600">
                            Transaction Limit:
                          </span>
                          <span className="value tw-font-medium">
                            {
                              ruleSets.find((r) => r.id === selectedRuleSet)
                                .dailyMonthlyLimitRule.fuelingLimit
                            }
                            L
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
          </div>

          <div className="actions tw-mt-4">
            <Button
              text="Assign Rule Set"
              type="success"
              stylingMode="contained"
              onClick={handleAssignRuleSet}
              disabled={!selectedRuleSet || isAssigning}
              width="100%"
              height={44}
              icon="fa-light fa-check"
            >
              {isAssigning && <LoadIndicator width={20} height={20} />}
            </Button>
          </div>

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
                    <span className="tw-font-semibold tw-break-all">{masterTag}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
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
        class: 'fueling-rule-popup-wrapper'
      }}
    >
      <div className="tw-h-full tw-flex tw-flex-col tw-overflow-hidden">
        {renderContent()}
      </div>
    </Popup>
  );
};

export default FuelingRulePopup;
