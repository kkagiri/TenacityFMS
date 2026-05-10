import React, { useState, useEffect } from "react";
import { Popup } from "devextreme-react/popup";
import { Button } from "devextreme-react/button";
import { CheckBox } from "devextreme-react/check-box";
import { SelectBox } from "devextreme-react/select-box";
import { LoadPanel } from "devextreme-react/load-panel";
import { TextBox } from "devextreme-react/text-box";
import { useDispatch, useSelector } from "react-redux";
import { assignRuleSetToTag } from "../../../redux/actions/fuelingRuleActions";
import notify from "devextreme/ui/notify";
import "./TagRuleManagement.scss";

const TagRuleAssignment = ({ isVisible, onClose, tags, ruleSets }) => {
  const dispatch = useDispatch();
  const vehicles = useSelector((state) => state.vehicle.vehicles || []);

  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [selectedRuleSet, setSelectedRuleSet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterByVehicle, setFilterByVehicle] = useState(null);
  const [filteredTags, setFilteredTags] = useState([]);
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    if (tags && Array.isArray(tags)) {
      let filtered = [...tags];

      // Filter by vehicle if selected
      if (filterByVehicle) {
        filtered = filtered.filter(
          (tag) => tag && tag.vehicleId === filterByVehicle
        );
      }

      // Apply search filter
      if (searchFilter) {
        const searchLower = searchFilter.toLowerCase();
        filtered = filtered.filter(
          (tag) =>
            tag.tagName?.toLowerCase().includes(searchLower) ||
            tag.tagType?.toLowerCase().includes(searchLower)
        );
      }

      setFilteredTags(filtered);
    } else {
      setFilteredTags([]);
    }
  }, [tags, filterByVehicle, searchFilter]);

  const handleVehicleFilterChange = (e) => {
    setFilterByVehicle(e?.value || null);
    setSelectedTagIds([]); // Clear selection when filter changes
  };

  const handleRuleSetChange = (e) => {
    setSelectedRuleSet(e?.value || null);
  };

  const handleTagSelect = (tagId, isSelected) => {
    if (isSelected) {
      setSelectedTagIds((prev) => [...prev, tagId]);
    } else {
      setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
    }
  };

  const handleSearchChange = (e) => {
    setSearchFilter(e.value || "");
  };

  const handleAssignRuleSet = async () => {
    if (!selectedRuleSet) {
      notify("Please select a rule set to assign", "warning", 3000);
      return;
    }

    if (!selectedTagIds || selectedTagIds.length === 0) {
      notify("Please select at least one tag", "warning", 3000);
      return;
    }

    setLoading(true);

    try {
      const failedAssignments = [];
      const selectedTagsData = filteredTags.filter((tag) =>
        selectedTagIds.includes(tag.id)
      );

      // Process each tag sequentially
      for (const tag of selectedTagsData) {
        if (!tag || !tag.id) {
          failedAssignments.push("Invalid tag data");
          continue;
        }

        try {
          const result = await dispatch(
            assignRuleSetToTag(selectedRuleSet, tag.id)
          );
          if (!result || !result.success) {
            failedAssignments.push(
              `${tag.tagName || "Unknown tag"}: ${
                result?.error || "Unknown error"
              }`
            );
          }
        } catch (error) {
          failedAssignments.push(
            `${tag.tagName || "Unknown tag"}: ${
              error?.message || "Unknown error"
            }`
          );
        }
      }

      if (failedAssignments.length === 0) {
        notify(
          `Rule set successfully assigned to ${selectedTagsData.length} tag(s)`,
          "success",
          3000
        );
        onClose();
      } else if (failedAssignments.length < selectedTagsData.length) {
        notify(
          `Rule set assigned to ${
            selectedTagsData.length - failedAssignments.length
          } tag(s). ${failedAssignments.length} failed.`,
          "warning",
          5000
        );
        onClose();
      } else {
        notify("Failed to assign rule set to any tags", "error", 3000);
        console.error("Failed assignments:", failedAssignments);
      }
    } catch (error) {
      console.error("Error in tag assignment process:", error);
      notify(
        "An unexpected error occurred during rule set assignment",
        "error",
        3000
      );
    } finally {
      setLoading(false);
    }
  };

  // Safe access to selected rule set details
  const getSelectedRuleSetDetails = () => {
    if (!selectedRuleSet || !ruleSets || !Array.isArray(ruleSets)) return null;
    return ruleSets.find((r) => r && r.id === selectedRuleSet) || null;
  };

  const selectedRuleSetDetails = getSelectedRuleSetDetails();

  // Get vehicle name helper function
  const getVehicleName = (vehicleId) => {
    if (!vehicleId) return "No vehicle";
    const vehicle = vehicles.find((v) => v && v.vehicleId === vehicleId);
    return vehicle
      ? `${vehicle.numberPlate || "No plate"} (${vehicle.vehicleCode || ""})`
      : "Unknown vehicle";
  };

  // Get rule set name helper function
  const getRuleSetName = (ruleSetId) => {
    if (!ruleSetId) return "None";
    const ruleSet =
      ruleSets && Array.isArray(ruleSets)
        ? ruleSets.find((r) => r && r.id === ruleSetId)
        : null;
    return ruleSet ? ruleSet.name || "Unnamed" : "Unknown";
  };

  return (
    <Popup
      visible={isVisible}
      onHiding={onClose}
      title="Assign Fueling Rules to Tags"
      showCloseButton={true}
      width={800}
      height={600}
      className="tag-rule-assignment-popup"
    >
      <div className="tag-rule-assignment-container">
        {/* Step 1: Rule Set Selection */}
        <div className="step step-rule-selection">
          <h3>Step 1: Select Rule Set</h3>
          <SelectBox
            dataSource={ruleSets || []}
            displayExpr="name"
            valueExpr="id"
            placeholder="Select a rule set"
            value={selectedRuleSet}
            onValueChanged={handleRuleSetChange}
            showClearButton={true}
            searchEnabled={true}
          />

          {selectedRuleSetDetails && (
            <div className="selected-rule-details tw-mt-3 tw-p-4 tw-bg-gradient-to-br tw-from-blue-50 tw-to-indigo-50 tw-rounded-lg tw-border tw-border-blue-200">
              <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
                <i className="fa-light fa-list-check tw-text-blue-600"></i>
                <h4 className="tw-text-base tw-font-semibold tw-text-blue-900 tw-m-0">
                  Selected Rule Set
                </h4>
              </div>

              <div className="tw-space-y-2 tw-mb-3">
                <div className="rule-detail-item">
                  <span className="tw-text-xs tw-text-gray-600 tw-block">Name:</span>
                  <span className="tw-text-sm tw-font-medium tw-text-gray-900">
                    {selectedRuleSetDetails.name || "N/A"}
                  </span>
                </div>
                {selectedRuleSetDetails.description && (
                  <div className="rule-detail-item">
                    <span className="tw-text-xs tw-text-gray-600 tw-block">Description:</span>
                    <span className="tw-text-sm tw-text-gray-700">
                      {selectedRuleSetDetails.description}
                    </span>
                  </div>
                )}
              </div>

              {selectedRuleSetDetails.rules && selectedRuleSetDetails.rules.length > 0 ? (
                <div className="tw-space-y-2">
                  <h5 className="tw-text-xs tw-font-semibold tw-text-gray-700 tw-mb-2 tw-uppercase tw-tracking-wide">
                    Rules in this set ({selectedRuleSetDetails.rules.length})
                  </h5>
                  {selectedRuleSetDetails.rules.map((rule, idx) => (
                    <div key={idx} className="rule-preview tw-p-2 tw-bg-white tw-rounded tw-border tw-border-blue-100">
                      <div className="tw-flex tw-items-center tw-gap-2 tw-mb-1">
                        <i className={`${
                          rule.discriminator === 'DailyMonthlyLimitRule' ? 'fa-light fa-gauge-high tw-text-green-600' :
                          rule.discriminator === 'NoOfRefillRule' ? 'fa-light fa-hashtag tw-text-amber-600' :
                          'fa-light fa-clock tw-text-purple-600'
                        } tw-text-sm`}></i>
                        <span className="tw-font-medium tw-text-xs tw-text-gray-800">
                          {rule.ruleName || 'Unnamed Rule'}
                        </span>
                      </div>

                      {rule.discriminator === 'DailyMonthlyLimitRule' && (
                        <div className="tw-text-xs tw-text-gray-600 tw-ml-5 tw-space-y-0.5">
                          {rule.dailyLimit > 0 && <div>Daily: {rule.dailyLimit}L</div>}
                          {rule.monthlyLimit > 0 && <div>Monthly: {rule.monthlyLimit}L</div>}
                          {rule.fuelingLimit > 0 && <div>Per Transaction: {rule.fuelingLimit}L</div>}
                        </div>
                      )}

                      {rule.discriminator === 'NoOfRefillRule' && (
                        <div className="tw-text-xs tw-text-gray-600 tw-ml-5 tw-space-y-0.5">
                          {rule.maxRefillsPerDay > 0 && <div>Daily: {rule.maxRefillsPerDay}x refills</div>}
                          {rule.maxRefillsPerWeek > 0 && <div>Weekly: {rule.maxRefillsPerWeek}x refills</div>}
                          {rule.maxRefillsPerMonth > 0 && <div>Monthly: {rule.maxRefillsPerMonth}x refills</div>}
                        </div>
                      )}

                      {rule.discriminator === 'TimeWindowRule' && (
                        <div className="tw-text-xs tw-text-gray-600 tw-ml-5">
                          {rule.startTime} - {rule.endTime}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="tw-text-xs tw-text-amber-600 tw-italic tw-flex tw-items-center tw-gap-1">
                  <i className="fa-light fa-exclamation-triangle"></i>
                  <span>This rule set has no configured rules</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Tag Filtering */}
        <div className="step step-tag-filtering">
          <h3>Step 2: Filter Tags</h3>
          <div className="filter-container">
            <div className="filter-row">
              <label>Vehicle:</label>
              <SelectBox
                dataSource={vehicles || []}
                displayExpr={(item) =>
                  item
                    ? `${item.numberPlate || ""} (${item.vehicleCode || ""})`
                    : ""
                }
                valueExpr="vehicleId"
                placeholder="All vehicles"
                value={filterByVehicle}
                onValueChanged={handleVehicleFilterChange}
                showClearButton={true}
                searchEnabled={true}
              />
            </div>
            <div className="filter-row">
              <label>Search:</label>
              <TextBox
                placeholder="Search by tag ID or type"
                onValueChanged={handleSearchChange}
                showClearButton={true}
              />
            </div>
          </div>
        </div>

        {/* Step 3: Select Tags */}
        <div className="step step-tag-selection">
          <h3>Step 3: Select Tags ({selectedTagIds.length} selected)</h3>
          <div className="simple-list-container">
            <div className="list-header">
              <div className="list-header-item checkbox-col">Select</div>
              <div className="list-header-item id-col">Tag ID</div>
              <div className="list-header-item type-col">Type</div>
              <div className="list-header-item vehicle-col">Vehicle</div>
              <div className="list-header-item rule-col">Current Rule Set</div>
            </div>

            <div className="simple-list">
              {filteredTags.length > 0 ? (
                filteredTags.map((tag) => (
                  <div
                    key={tag.id}
                    className={`list-row ${
                      selectedTagIds.includes(tag.id) ? "selected" : ""
                    }`}
                    onClick={() =>
                      handleTagSelect(tag.id, !selectedTagIds.includes(tag.id))
                    }
                  >
                    <div className="list-item checkbox-col">
                      <CheckBox
                        value={selectedTagIds.includes(tag.id)}
                        onValueChanged={(e) => handleTagSelect(tag.id, e.value)}
                      />
                    </div>
                    <div className="list-item id-col">{tag.tagName}</div>
                    <div className="list-item type-col">{tag.tagType}</div>
                    <div className="list-item vehicle-col">
                      {getVehicleName(tag.vehicleId)}
                    </div>
                    <div className="list-item rule-col">
                      {getRuleSetName(tag.fuelRuleSetId)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data-message">
                  No tags match the criteria
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="step form-actions">
          <Button
            text="Cancel"
            stylingMode="outlined"
            type="normal"
            onClick={onClose}
          />
          <Button
            text="Assign Rule Set"
            type="default"
            stylingMode="contained"
            onClick={handleAssignRuleSet}
            disabled={
              !selectedRuleSet ||
              !selectedTagIds ||
              selectedTagIds.length === 0 ||
              loading
            }
            icon="fa-light fa-link"
          />
        </div>
      </div>

      <LoadPanel
        visible={loading}
        showIndicator={true}
        shading={true}
        shadingColor="rgba(0, 0, 0, 0.4)"
        showPane={true}
        message="Assigning rule set to tags..."
      />
    </Popup>
  );
};

export default TagRuleAssignment;
