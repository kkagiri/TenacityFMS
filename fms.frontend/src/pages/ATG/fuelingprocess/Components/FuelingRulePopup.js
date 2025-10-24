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
  createRuleSet,
  createDailyMonthlyRule,
} from "../../../../redux/actions/fuelingRuleActions";
import { fetchTagsByVehicleId } from "../../../../redux/actions/tagActions";

const FuelingRulePopup = ({ isVisible, onClose, vehicleData }) => {
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

  // Handle assign rule set to vehicle's tag
  const handleAssignRuleSet = async () => {
    if (!selectedRuleSet) {
      notify("Please select a rule set", "warning", 3000);
      return;
    }

    try {
      setIsAssigning(true);

      // If vehicle has a tag, assign rule set to that tag
      if (vehicleHasTag && vehicleTagId) {
        const result = await dispatch(
          assignRuleSetToTag(selectedRuleSet, vehicleTagId)
        );

        if (result.success) {
          notify("Fueling rule set assigned successfully", "success", 3000);
          onClose();
        } else {
          throw new Error(result.error || "Failed to assign rule set");
        }
      } else {
        // If no tag, notify about using master tag for authorization
        notify(
          "Vehicle has no tag. Using master tag for authorization.",
          "warning",
          3000
        );
        onClose();
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
        <div className="loading-container tw-flex tw-justify-center tw-items-center tw-flex-col tw-p-6">
          <LoadIndicator width={40} height={40} />
          <p className="tw-mt-3">Loading data...</p>
        </div>
      );
    }

    return (
      <div className="fueling-rule-popup-content tw-p-4">
        {/* Vehicle Info Section */}
        <div className="vehicle-info tw-bg-gray-50 tw-rounded-lg tw-p-4 tw-mb-6">
          <div className="tw-flex tw-items-center tw-mb-2">
            <i className="fa-solid fa-car tw-text-primary tw-mr-2"></i>
            <h4 className="tw-text-lg tw-font-medium tw-m-0">
              Vehicle Information
            </h4>
          </div>

          <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mt-2">
            <div>
              <span className="tw-text-gray-500">Registration:</span>
              <span className="tw-font-medium tw-ml-2">
                {vehicleData?.regNumber || "N/A"}
              </span>
            </div>

            <div>
              <span className="tw-text-gray-500">Vehicle Type:</span>
              <span className="tw-font-medium tw-ml-2">
                {vehicleData?.isCompanyVehicle
                  ? "Company Vehicle"
                  : "Regular Vehicle"}
              </span>
            </div>

            <div className="tw-col-span-2">
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
        <div className="assign-ruleset-section tw-space-y-6">
          <div className="form-group">
            <label className="tw-block tw-mb-2 tw-font-medium">
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
            />

            {selectedRuleSet &&
              ruleSets.find((r) => r.id === selectedRuleSet) && (
                <div className="rule-details tw-mt-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg">
                  <h4 className="tw-text-md tw-font-medium tw-mb-3">
                    Rule Set Details
                  </h4>
                  <div className="rule-details-grid tw-space-y-2">
                    {ruleSets.find((r) => r.id === selectedRuleSet)
                      .dailyMonthlyLimitRule && (
                      <>
                        <div className="detail-row tw-grid tw-grid-cols-2">
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
                        <div className="detail-row tw-grid tw-grid-cols-2">
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
                        <div className="detail-row tw-grid tw-grid-cols-2">
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

          <div className="actions tw-mt-6">
            <Button
              text="Assign Rule Set"
              type="success"
              stylingMode="contained"
              onClick={handleAssignRuleSet}
              disabled={!selectedRuleSet || isAssigning}
              width="100%"
              icon="fa-solid fa-check"
            >
              {isAssigning && <LoadIndicator width={20} height={20} />}
            </Button>
          </div>

          {(!vehicleHasTag || vehicleData?.isCompanyVehicle) && (
            <div className="master-tag-note tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded-lg tw-p-3 tw-mt-4">
              <div className="tw-flex tw-items-start">
                <i className="fa-solid fa-info-circle tw-text-amber-500 tw-mr-2 tw-mt-1"></i>
                <div>
                  <h5 className="tw-text-amber-700 tw-font-medium tw-text-sm tw-m-0">
                    Using Master Tag
                  </h5>
                  <p className="tw-text-amber-600 tw-text-sm tw-mt-1 tw-mb-0">
                    {vehicleData?.isCompanyVehicle
                      ? "This is a company vehicle. When no tag is available, the system will use the master tag for authorization."
                      : "This vehicle has no assigned tag. The system will use the master tag for fueling authorization."}
                  </p>
                  <p className="tw-text-amber-600 tw-text-sm tw-mt-1 tw-mb-0">
                    Master Tag ID:{" "}
                    <span className="tw-font-semibold">{masterTag}</span>
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
      width={600}
      height="auto"
      className="fueling-rule-popup"
    >
      {renderContent()}
    </Popup>
  );
};

export default FuelingRulePopup;
