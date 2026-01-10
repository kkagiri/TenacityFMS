import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import DataGrid, {
  Column,
  Paging,
  Pager,
  FilterRow,
  HeaderFilter,
} from "devextreme-react/data-grid";
import { Popup } from "devextreme-react/popup";
import { SelectBox } from "devextreme-react/select-box";
import { NumberBox } from "devextreme-react/number-box";
import { CheckBox } from "devextreme-react/check-box";
import { Button } from "devextreme-react/button";
import { LoadIndicator } from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";

import {
  fetchVehicleAssignments,
  fetchAllRuleSets,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  fetchEffectiveRulesForVehicle,
  AssignmentTargetType,
  getTargetTypeDisplayName,
} from "../../../../redux/actions/fuelingRuleActions";
import { fetchTags } from "../../../../redux/actions/tagActions";

import "./VehicleFuelingRuleAssignment.scss";

/**
 * VehicleFuelingRuleAssignment - Manage fueling rule assignments for a specific vehicle
 * Shows direct vehicle assignments and inherited rules from the cascade hierarchy
 * @param {Object} props - Component props
 * @param {Object} props.vehicle - Vehicle object with vehicleId, workingSiteId, vehicleTypeId, etc.
 */
const VehicleFuelingRuleAssignment = ({ vehicle }) => {
  const dispatch = useDispatch();

  // Redux state
  const vehicleAssignments = useSelector(
    (state) => state.fuelingRule.vehicleAssignments?.[vehicle?.vehicleId] || []
  );
  const assignmentsLoading = useSelector(
    (state) => state.fuelingRule.assignmentsLoading
  );
  const ruleSets = useSelector((state) => state.fuelingRule.ruleSets || []);
  const tags = useSelector((state) => state.tag?.tags || []);
  const vehicleEffectiveRules = useSelector(
    (state) => state.fuelingRule.vehicleEffectiveRules?.[vehicle?.vehicleId]
  );

  // Local state
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEffectiveRules, setShowEffectiveRules] = useState(false);
  const [effectiveRulesLoading, setEffectiveRulesLoading] = useState(false);

  // Form state for direct vehicle assignment
  const [formData, setFormData] = useState({
    fuelingRuleSetId: null,
    priority: null,
    isActive: true,
  });

  // Get vehicle's assigned tags
  const vehicleTags = useMemo(() => {
    if (!vehicle?.vehicleId || !tags.length) return [];
    return tags.filter((tag) => tag.vehicleId === vehicle.vehicleId);
  }, [vehicle?.vehicleId, tags]);

  // Load initial data
  useEffect(() => {
    if (vehicle?.vehicleId) {
      dispatch(fetchAllRuleSets());
      dispatch(fetchTags());
      loadAssignments();
    }
  }, [dispatch, vehicle?.vehicleId]);

  const loadAssignments = useCallback(() => {
    if (!vehicle?.vehicleId) return;

    // Get tag ID if vehicle has an assigned tag
    const vehicleTagId = vehicleTags.length > 0 ? vehicleTags[0].id : null;

    dispatch(
      fetchVehicleAssignments(
        vehicle.vehicleId,
        vehicle.workingSiteId,
        vehicleTagId
      )
    );
  }, [dispatch, vehicle?.vehicleId, vehicle?.workingSiteId, vehicleTags]);

  // Load effective rules
  const loadEffectiveRules = useCallback(async () => {
    if (!vehicle?.vehicleId) return;

    setEffectiveRulesLoading(true);
    try {
      const vehicleTagId = vehicleTags.length > 0 ? vehicleTags[0].id : null;
      await dispatch(
        fetchEffectiveRulesForVehicle(
          vehicle.vehicleId,
          vehicle.workingSiteId,
          vehicleTagId
        )
      );
    } catch (error) {
      console.error("Error loading effective rules:", error);
    } finally {
      setEffectiveRulesLoading(false);
    }
  }, [dispatch, vehicle?.vehicleId, vehicle?.workingSiteId, vehicleTags]);

  // Handle add new assignment
  const handleAddClick = () => {
    setFormData({
      fuelingRuleSetId: null,
      priority: 400, // Vehicle priority default
      isActive: true,
    });
    setIsEditing(false);
    setSelectedAssignment(null);
    setShowAddPopup(true);
  };

  // Handle edit assignment
  const handleEditClick = (assignment) => {
    const fuelingRuleSetId =
      assignment.fuelingRuleSetId ?? assignment.FuelingRuleSetId;
    const priority = assignment.priority ?? assignment.Priority;
    const isActive = assignment.isActive ?? assignment.IsActive ?? true;

    setFormData({
      fuelingRuleSetId,
      priority,
      isActive,
    });
    setIsEditing(true);
    setSelectedAssignment(assignment);
    setShowAddPopup(true);
  };

  // Handle save assignment
  const handleSave = async () => {
    if (!formData.fuelingRuleSetId) {
      notify("Please select a rule set", "warning", 3000);
      return;
    }

    try {
      setIsSaving(true);

      const assignmentData = {
        fuelingRuleSetId: formData.fuelingRuleSetId,
        targetType: AssignmentTargetType.Vehicle,
        vehicleId: vehicle.vehicleId,
        priority: formData.priority || 400,
        isActive: formData.isActive,
      };

      let result;
      if (isEditing && selectedAssignment) {
        result = await dispatch(
          updateAssignment(selectedAssignment.id, assignmentData)
        );
      } else {
        result = await dispatch(createAssignment(assignmentData));
      }

      if (result.success) {
        notify(
          isEditing
            ? "Assignment updated successfully"
            : "Assignment created successfully",
          "success",
          3000
        );
        setShowAddPopup(false);
        loadAssignments();
      } else {
        notify(result.error || "Failed to save assignment", "error", 3000);
      }
    } catch (error) {
      notify("An error occurred while saving", "error", 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete assignment
  const handleDelete = async (assignment) => {
    // Only allow deleting direct vehicle assignments
    const targetType = assignment.targetType ?? assignment.TargetType;
    if (targetType !== AssignmentTargetType.Vehicle && targetType !== 4) {
      notify(
        "You can only delete direct vehicle assignments from here. Use the admin panel to manage inherited assignments.",
        "warning",
        4000
      );
      return;
    }

    if (!window.confirm("Are you sure you want to delete this assignment?")) {
      return;
    }

    try {
      const result = await dispatch(deleteAssignment(assignment.id));
      if (result.success) {
        notify("Assignment deleted successfully", "success", 3000);
        loadAssignments();
      } else {
        notify(result.error || "Failed to delete assignment", "error", 3000);
      }
    } catch (error) {
      notify("An error occurred while deleting", "error", 3000);
    }
  };

  // Handle view effective rules
  const handleViewEffectiveRules = async () => {
    await loadEffectiveRules();
    setShowEffectiveRules(true);
  };

  // Render target type cell with badge
  const renderTargetTypeCell = (cellData) => {
    const targetType = cellData.value;
    const displayName = getTargetTypeDisplayName(targetType);

    let bgColor = "tw-bg-gray-100 tw-text-gray-700";
    switch (targetType) {
      case AssignmentTargetType.Site:
      case 1:
        bgColor = "tw-bg-purple-100 tw-text-purple-700";
        break;
      case AssignmentTargetType.VehicleType:
      case 2:
        bgColor = "tw-bg-blue-100 tw-text-blue-700";
        break;
      case AssignmentTargetType.Tag:
      case 3:
        bgColor = "tw-bg-green-100 tw-text-green-700";
        break;
      case AssignmentTargetType.Vehicle:
      case 4:
        bgColor = "tw-bg-orange-100 tw-text-orange-700";
        break;
    }

    return (
      <span
        className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${bgColor}`}
      >
        {displayName}
      </span>
    );
  };

  // Render rule set name
  const renderRuleSetCell = (cellData) => {
    return cellData.data.ruleSetName || "-";
  };

  // Render inheritance indicator
  const renderInheritanceCell = (cellData) => {
    const targetType = cellData.data.targetType ?? cellData.data.TargetType;
    const isDirect =
      targetType === AssignmentTargetType.Vehicle || targetType === 4;

    return isDirect ? (
      <span className="tw-text-green-600 tw-font-medium">
        <i className="fa-light fa-check-circle tw-mr-1"></i>
        Direct
      </span>
    ) : (
      <span className="tw-text-blue-600">
        <i className="fa-light fa-arrow-down tw-mr-1"></i>
        Inherited
      </span>
    );
  };

  // Render actions cell
  const renderActionsCell = (cellData) => {
    const targetType = cellData.data.targetType ?? cellData.data.TargetType;
    const isDirect =
      targetType === AssignmentTargetType.Vehicle || targetType === 4;

    return (
      <div className="tw-flex tw-gap-2">
        {isDirect && (
          <>
            <Button
              icon="edit"
              stylingMode="text"
              hint="Edit"
              onClick={() => handleEditClick(cellData.data)}
            />
            <Button
              icon="trash"
              stylingMode="text"
              hint="Delete"
              onClick={() => handleDelete(cellData.data)}
            />
          </>
        )}
        {!isDirect && (
          <span className="tw-text-xs tw-text-gray-400 tw-italic">
            Manage in Admin
          </span>
        )}
      </div>
    );
  };

  if (!vehicle) {
    return (
      <div className="tw-text-center tw-py-8 tw-text-gray-500">
        No vehicle selected
      </div>
    );
  }

  return (
    <div className="vehicle-fueling-rule-assignment tw-p-4">
      {/* Header */}
      <div className="tw-mb-4 tw-flex tw-flex-col sm:tw-flex-row tw-justify-between tw-items-start sm:tw-items-center tw-gap-3">
        <div>
          <h2 className="tw-text-xl tw-font-semibold tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-gavel tw-text-blue-600"></i>
            Fueling Rules
          </h2>
          <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
            Manage fueling rules assigned to this vehicle
          </p>
        </div>
        <div className="tw-flex tw-gap-2 tw-flex-wrap">
          <Button
            text="Assign Rule"
            icon="plus"
            type="default"
            stylingMode="contained"
            onClick={handleAddClick}
          />
          <Button
            text="View Effective Rules"
            icon="fa-light fa-list-check"
            type="normal"
            stylingMode="outlined"
            onClick={handleViewEffectiveRules}
          />
          <Button
            icon="refresh"
            hint="Refresh"
            stylingMode="text"
            onClick={loadAssignments}
          />
        </div>
      </div>

      {/* Info Box about hierarchy */}
      <div className="tw-mb-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
        <div className="tw-flex tw-items-start tw-gap-2">
          <i className="fa-light fa-info-circle tw-text-blue-600 tw-mt-0.5"></i>
          <div className="tw-text-sm tw-text-blue-800">
            <p className="tw-font-medium tw-mb-1">Rule Inheritance Hierarchy</p>
            <p>
              Fueling rules cascade from Site → Vehicle Type → Tag → Vehicle.
              Direct vehicle assignments have the highest priority (400).
              Inherited rules are shown for reference but can only be managed in
              the Admin panel.
            </p>
          </div>
        </div>
      </div>

      {/* Vehicle Context Info */}
      <div className="tw-mb-4 tw-grid tw-grid-cols-1 sm:tw-grid-cols-3 tw-gap-3">
        <div className="tw-bg-gray-50 tw-rounded-lg tw-p-3 tw-border tw-border-gray-200">
          <div className="tw-text-xs tw-text-gray-500 tw-uppercase tw-mb-1">
            Working Site
          </div>
          <div className="tw-font-medium tw-text-gray-800">
            {vehicle.workingSite?.name ||
              vehicle.workingSiteName ||
              "Not assigned"}
          </div>
        </div>
        <div className="tw-bg-gray-50 tw-rounded-lg tw-p-3 tw-border tw-border-gray-200">
          <div className="tw-text-xs tw-text-gray-500 tw-uppercase tw-mb-1">
            Vehicle Type
          </div>
          <div className="tw-font-medium tw-text-gray-800">
            {vehicle.vehicleType?.name ||
              vehicle.vehicleTypeName ||
              "Not specified"}
          </div>
        </div>
        <div className="tw-bg-gray-50 tw-rounded-lg tw-p-3 tw-border tw-border-gray-200">
          <div className="tw-text-xs tw-text-gray-500 tw-uppercase tw-mb-1">
            Assigned Tags
          </div>
          <div className="tw-font-medium tw-text-gray-800">
            {vehicleTags.length > 0 ? (
              <span className="tw-flex tw-flex-wrap tw-gap-1">
                {vehicleTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="tw-bg-green-100 tw-text-green-700 tw-px-2 tw-py-0.5 tw-rounded-full tw-text-xs"
                  >
                    {tag.name || tag.tagId}
                  </span>
                ))}
              </span>
            ) : (
              <span className="tw-text-gray-400">No tags assigned</span>
            )}
          </div>
        </div>
      </div>

      {/* Data Grid */}
      {assignmentsLoading ? (
        <div className="tw-flex tw-justify-center tw-py-8">
          <LoadIndicator />
        </div>
      ) : vehicleAssignments.length === 0 ? (
        <div className="tw-text-center tw-py-12 tw-bg-gray-50 tw-rounded-lg tw-border tw-border-gray-200">
          <div className="tw-mb-3">
            <i className="fa-light fa-clipboard-list tw-text-4xl tw-text-gray-400"></i>
          </div>
          <p className="tw-text-gray-600 tw-mb-2">
            No fueling rules assigned to this vehicle
          </p>
          <p className="tw-text-sm tw-text-gray-500 tw-mb-4">
            Assign a rule set to control fueling limits and restrictions
          </p>
          <Button
            text="Assign First Rule"
            icon="plus"
            type="default"
            stylingMode="contained"
            onClick={handleAddClick}
          />
        </div>
      ) : (
        <DataGrid
          dataSource={vehicleAssignments}
          showBorders
          columnAutoWidth
          rowAlternationEnabled
          keyExpr="id"
          height={400}
        >
          <Paging defaultPageSize={10} />
          <Pager
            showPageSizeSelector
            allowedPageSizes={[5, 10, 20]}
            showInfo
          />
          <FilterRow visible />
          <HeaderFilter visible />

          <Column dataField="id" caption="ID" width={60} />
          <Column
            dataField="ruleSetName"
            caption="Rule Set"
            cellRender={renderRuleSetCell}
          />
          <Column
            dataField="targetType"
            caption="Source"
            cellRender={renderTargetTypeCell}
            width={120}
          />
          <Column
            caption="Type"
            cellRender={renderInheritanceCell}
            width={100}
            allowFiltering={false}
          />
          <Column dataField="priority" caption="Priority" width={80} />
          <Column
            dataField="isActive"
            caption="Active"
            width={80}
            dataType="boolean"
          />
          <Column
            caption="Actions"
            width={120}
            cellRender={renderActionsCell}
            allowFiltering={false}
            allowSorting={false}
          />
        </DataGrid>
      )}

      {/* Add/Edit Popup */}
      <Popup
        visible={showAddPopup}
        onHiding={() => setShowAddPopup(false)}
        title={isEditing ? "Edit Rule Assignment" : "Assign Rule Set"}
        width={450}
        height="auto"
        showCloseButton
      >
        <div className="tw-p-4">
          <div className="tw-mb-4">
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Rule Set <span className="tw-text-red-500">*</span>
            </label>
            <SelectBox
              items={ruleSets}
              displayExpr="name"
              valueExpr="id"
              value={formData.fuelingRuleSetId}
              onValueChanged={(e) =>
                setFormData({ ...formData, fuelingRuleSetId: e.value })
              }
              placeholder="Select Rule Set"
              searchEnabled
            />
          </div>

          <div className="tw-mb-4">
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Priority
            </label>
            <NumberBox
              value={formData.priority}
              onValueChanged={(e) =>
                setFormData({ ...formData, priority: e.value })
              }
              placeholder="Default: 400 (Vehicle priority)"
              showSpinButtons
              min={0}
              max={1000}
            />
            <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
              Higher priority rules take precedence. Defaults: Site=100,
              VehicleType=200, Tag=300, Vehicle=400
            </p>
          </div>

          <div className="tw-mb-4">
            <CheckBox
              text="Active"
              value={formData.isActive}
              onValueChanged={(e) =>
                setFormData({ ...formData, isActive: e.value })
              }
            />
          </div>

          <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-6">
            <Button
              text="Cancel"
              stylingMode="outlined"
              onClick={() => setShowAddPopup(false)}
            />
            <Button
              text={isSaving ? "Saving..." : "Save"}
              type="default"
              stylingMode="contained"
              onClick={handleSave}
              disabled={isSaving}
            />
          </div>
        </div>
      </Popup>

      {/* Effective Rules Popup */}
      <Popup
        visible={showEffectiveRules}
        onHiding={() => setShowEffectiveRules(false)}
        title={`Effective Rules for ${vehicle?.hyoungNo || 'Vehicle'}`}
        width={600}
        height="auto"
        showCloseButton
      >
        <div className="tw-p-4">
          {effectiveRulesLoading ? (
            <div className="tw-flex tw-justify-center tw-py-8">
              <LoadIndicator />
            </div>
          ) : vehicleEffectiveRules && Object.keys(vehicleEffectiveRules).length > 0 ? (
            <div>
              <div className="tw-mb-4 tw-p-3 tw-bg-green-50 tw-border tw-border-green-200 tw-rounded-lg">
                <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                  <i className="fa-light fa-check-circle tw-text-green-600"></i>
                  <span className="tw-font-medium tw-text-green-800">
                    Effective Rules Calculated
                  </span>
                </div>
                <p className="tw-text-sm tw-text-green-700">
                  These are the merged rules that will be applied during
                  fueling.
                </p>
              </div>

              {/* Display effective rules data */}
              <div className="tw-space-y-3">
                {vehicleEffectiveRules.dailyLimit !== undefined && vehicleEffectiveRules.dailyLimit !== null && (
                  <div className="tw-flex tw-justify-between tw-p-3 tw-bg-gray-50 tw-rounded">
                    <span className="tw-text-gray-600">Daily Limit</span>
                    <span className="tw-font-semibold">
                      {vehicleEffectiveRules.dailyLimit} L
                    </span>
                  </div>
                )}
                {vehicleEffectiveRules.monthlyLimit !== undefined && vehicleEffectiveRules.monthlyLimit !== null && (
                  <div className="tw-flex tw-justify-between tw-p-3 tw-bg-gray-50 tw-rounded">
                    <span className="tw-text-gray-600">Monthly Limit</span>
                    <span className="tw-font-semibold">
                      {vehicleEffectiveRules.monthlyLimit} L
                    </span>
                  </div>
                )}
                {vehicleEffectiveRules.maxRefillsPerDay !== undefined && vehicleEffectiveRules.maxRefillsPerDay !== null && (
                  <div className="tw-flex tw-justify-between tw-p-3 tw-bg-gray-50 tw-rounded">
                    <span className="tw-text-gray-600">
                      Max Refills Per Day
                    </span>
                    <span className="tw-font-semibold">
                      {vehicleEffectiveRules.maxRefillsPerDay}
                    </span>
                  </div>
                )}
                {vehicleEffectiveRules.allowedTimeWindow && (
                  <div className="tw-flex tw-justify-between tw-p-3 tw-bg-gray-50 tw-rounded">
                    <span className="tw-text-gray-600">
                      Allowed Time Window
                    </span>
                    <span className="tw-font-semibold">
                      {vehicleEffectiveRules.allowedTimeWindow.start || 'N/A'} -{" "}
                      {vehicleEffectiveRules.allowedTimeWindow.end || 'N/A'}
                    </span>
                  </div>
                )}
                {vehicleEffectiveRules.sourceRuleSet && (
                  <div className="tw-flex tw-justify-between tw-p-3 tw-bg-blue-50 tw-rounded">
                    <span className="tw-text-blue-600">Source Rule Set</span>
                    <span className="tw-font-semibold tw-text-blue-800">
                      {vehicleEffectiveRules.sourceRuleSet.name || 'Unknown'}
                    </span>
                  </div>
                )}
                {vehicleEffectiveRules.ruleSetName && !vehicleEffectiveRules.sourceRuleSet && (
                  <div className="tw-flex tw-justify-between tw-p-3 tw-bg-blue-50 tw-rounded">
                    <span className="tw-text-blue-600">Rule Set</span>
                    <span className="tw-font-semibold tw-text-blue-800">
                      {vehicleEffectiveRules.ruleSetName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="tw-text-center tw-py-8 tw-text-gray-500">
              <div className="tw-mb-3">
                <i className="fa-light fa-clipboard-list tw-text-4xl"></i>
              </div>
              <p>No effective rules found for this vehicle.</p>
              <p className="tw-text-sm tw-mt-2">
                Assign a rule set to define fueling restrictions.
              </p>
            </div>
          )}

          <div className="tw-flex tw-justify-end tw-mt-6">
            <Button
              text="Close"
              stylingMode="outlined"
              onClick={() => setShowEffectiveRules(false)}
            />
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default VehicleFuelingRuleAssignment;
