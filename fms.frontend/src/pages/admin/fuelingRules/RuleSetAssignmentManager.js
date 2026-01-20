import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import DataGrid, {
  Column,
  Paging,
  Pager,
  FilterRow,
  HeaderFilter,
  Selection,
  Toolbar,
  Item,
  Editing,
  Popup as GridPopup,
  Form,
} from "devextreme-react/data-grid";
import { Popup } from "devextreme-react/popup";
import { SelectBox } from "devextreme-react/select-box";
import { NumberBox } from "devextreme-react/number-box";
import { CheckBox } from "devextreme-react/check-box";
import { Button } from "devextreme-react/button";
import { LoadIndicator } from "devextreme-react/load-indicator";
import { TagBox } from "devextreme-react/tag-box";
import notify from "devextreme/ui/notify";
import {
  fetchAssignments,
  fetchAllRuleSets,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  bulkCreateAssignments,
  AssignmentTargetType,
  getTargetTypeDisplayName,
} from "../../../redux/actions/fuelingRuleActions";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import { fetchVehicleTypes } from "../../../redux/actions/vehicleTypeActions";
import { fetchVehicleList } from "../../../redux/actions/vehicleActions";
import { fetchTags } from "../../../redux/actions/tagActions";
import FuelingRulesHelp from "../../ATG/fuelingprocess/Components/FuelingRulesHelp";

import "./RuleSetAssignmentManager.scss";

/**
 * RuleSetAssignmentManager - Manage fueling rule set assignments
 * Supports the cascade hierarchy: Site -> VehicleType -> Tag -> Vehicle
 */
const RuleSetAssignmentManager = () => {
  const dispatch = useDispatch();

  // Redux state
  const assignments = useSelector(
    (state) => state.fuelingRule.assignments || []
  );
  const assignmentsLoading = useSelector(
    (state) => state.fuelingRule.assignmentsLoading
  );
  const ruleSets = useSelector((state) => state.fuelingRule.ruleSets || []);
  const sites = useSelector((state) => state.site?.sites || []);
  const vehicleTypes = useSelector(
    (state) => state.vehicleType?.vehicleTypes || []
  );
  const vehicles = useSelector((state) => state.vehicle?.vehicles || []);
  const tags = useSelector((state) => state.tag?.tags || []);

  // Local state
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showBulkPopup, setShowBulkPopup] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Filter state
  const [filterRuleSetId, setFilterRuleSetId] = useState(null);
  const [filterTargetType, setFilterTargetType] = useState(null);
  const [filterIsActive, setFilterIsActive] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    fuelingRuleSetId: null,
    targetType: null,
    siteId: null,
    vehicleTypeId: null,
    vehicleId: null,
    tagId: null,
    priority: null,
    isActive: true,
  });

  // Bulk form state
  const [bulkFormData, setBulkFormData] = useState({
    fuelingRuleSetId: null,
    targetType: null,
    targetIds: [],
    priority: null,
  });

  // Load initial data
  useEffect(() => {
    dispatch(fetchAllRuleSets());
    dispatch(fetchSiteList());
    dispatch(fetchVehicleTypes());
    dispatch(fetchVehicleList());
    dispatch(fetchTags());
    loadAssignments();
  }, [dispatch]);

  const loadAssignments = useCallback(() => {
    const filters = {};
    if (filterRuleSetId) filters.ruleSetId = filterRuleSetId;
    if (filterTargetType !== null) filters.targetType = filterTargetType;
    if (filterIsActive !== null) filters.isActive = filterIsActive;
    dispatch(fetchAssignments(filters));
  }, [dispatch, filterRuleSetId, filterTargetType, filterIsActive]);

  // Reload when filters change
  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // Target type options
  const targetTypeOptions = [
    { id: AssignmentTargetType.Site, name: "Site" },
    { id: AssignmentTargetType.VehicleType, name: "Vehicle Type" },
    { id: AssignmentTargetType.Tag, name: "Tag" },
    { id: AssignmentTargetType.Vehicle, name: "Vehicle" },
  ];

  // Get targets based on selected target type
  const getTargetOptions = (targetType) => {
    // Normalize targetType to number for comparison
    const normalizedType = typeof targetType === 'string' ? parseInt(targetType, 10) : targetType;

    switch (normalizedType) {
      case AssignmentTargetType.Site:
      case 1:
        return sites.map((s) => ({
          id: s.siteId || s.id,
          name: s.siteName || s.name,
        }));
      case AssignmentTargetType.VehicleType:
      case 2:
        return vehicleTypes.map((vt) => ({
          id: vt.vehicleTypeId || vt.id,
          name: vt.vehicleTypeName || vt.name,
        }));
      case AssignmentTargetType.Tag:
      case 3:
        // Tag entity uses: id (PK), name (RFID tag number like "TAG001")
        return tags.map((t) => ({
          id: t.id,
          name: t.name || t.tagName || `Tag ${t.id}`,
        }));
      case AssignmentTargetType.Vehicle:
      case 4:
        return vehicles.map((v) => ({
          id: v.vehicleId || v.id,
          name: v.hyoungNo || v.name || v.numberPlate,
        }));
      default:
        return [];
    }
  };

  // Handle add new assignment
  const handleAddClick = () => {
    setFormData({
      fuelingRuleSetId: null,
      targetType: null,
      siteId: null,
      vehicleTypeId: null,
      vehicleId: null,
      tagId: null,
      priority: null,
      isActive: true,
    });
    setIsEditing(false);
    setSelectedAssignment(null);
    setShowAddPopup(true);
  };

  // Handle edit assignment
  const handleEditClick = (assignment) => {
    // Handle both camelCase and PascalCase property names from API
    const fuelingRuleSetId = assignment.fuelingRuleSetId ?? assignment.FuelingRuleSetId;
    const targetType = assignment.targetType ?? assignment.TargetType;
    const siteId = assignment.siteId ?? assignment.SiteId;
    const vehicleTypeId = assignment.vehicleTypeId ?? assignment.VehicleTypeId;
    const vehicleId = assignment.vehicleId ?? assignment.VehicleId;
    const tagId = assignment.tagId ?? assignment.TagId;
    const priority = assignment.priority ?? assignment.Priority;
    const isActive = assignment.isActive ?? assignment.IsActive ?? true;

    setFormData({
      fuelingRuleSetId,
      targetType,
      siteId,
      vehicleTypeId,
      vehicleId,
      tagId,
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
    if (formData.targetType === null) {
      notify("Please select a target type", "warning", 3000);
      return;
    }

    // Validate that at least one target is selected
    const hasTarget =
      formData.siteId ||
      formData.vehicleTypeId ||
      formData.vehicleId ||
      formData.tagId;
    if (!hasTarget) {
      notify("Please select a target", "warning", 3000);
      return;
    }

    try {
      setIsSaving(true);

      let result;
      if (isEditing && selectedAssignment) {
        result = await dispatch(
          updateAssignment(selectedAssignment.id, formData)
        );
      } else {
        result = await dispatch(createAssignment(formData));
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

  // Handle bulk add
  const handleBulkAddClick = () => {
    setBulkFormData({
      fuelingRuleSetId: null,
      targetType: null,
      targetIds: [],
      priority: null,
    });
    setShowBulkPopup(true);
  };

  // Handle bulk save
  const handleBulkSave = async () => {
    if (!bulkFormData.fuelingRuleSetId) {
      notify("Please select a rule set", "warning", 3000);
      return;
    }
    if (bulkFormData.targetType === null) {
      notify("Please select a target type", "warning", 3000);
      return;
    }
    if (!bulkFormData.targetIds || bulkFormData.targetIds.length === 0) {
      notify("Please select at least one target", "warning", 3000);
      return;
    }

    try {
      setIsSaving(true);
      const result = await dispatch(bulkCreateAssignments(bulkFormData));

      if (result.success) {
        const data = result.data?.data || result.data;
        notify(
          `Bulk assignment complete: ${data.successCount || 0} created, ${
            data.skippedCount || 0
          } skipped`,
          "success",
          4000
        );
        setShowBulkPopup(false);
        loadAssignments();
      } else {
        notify(
          result.error || "Failed to create bulk assignments",
          "error",
          3000
        );
      }
    } catch (error) {
      notify("An error occurred during bulk creation", "error", 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle target type change - reset target IDs
  const handleTargetTypeChange = (value) => {
    setFormData({
      ...formData,
      targetType: value,
      siteId: null,
      vehicleTypeId: null,
      vehicleId: null,
      tagId: null,
    });
  };

  // Handle target selection based on type
  const handleTargetChange = (value) => {
    const updates = { ...formData };
    // Normalize targetType to number for comparison
    const normalizedType = typeof formData.targetType === 'string'
      ? parseInt(formData.targetType, 10)
      : formData.targetType;

    switch (normalizedType) {
      case AssignmentTargetType.Site:
      case 1:
        updates.siteId = value;
        break;
      case AssignmentTargetType.VehicleType:
      case 2:
        updates.vehicleTypeId = value;
        break;
      case AssignmentTargetType.Tag:
      case 3:
        updates.tagId = value;
        break;
      case AssignmentTargetType.Vehicle:
      case 4:
        updates.vehicleId = value;
        break;
    }
    setFormData(updates);
  };

  // Get current target value for form
  const getCurrentTargetValue = () => {
    // Normalize targetType to number for comparison
    const normalizedType = typeof formData.targetType === 'string'
      ? parseInt(formData.targetType, 10)
      : formData.targetType;

    switch (normalizedType) {
      case AssignmentTargetType.Site:
      case 1:
        return formData.siteId;
      case AssignmentTargetType.VehicleType:
      case 2:
        return formData.vehicleTypeId;
      case AssignmentTargetType.Tag:
      case 3:
        return formData.tagId;
      case AssignmentTargetType.Vehicle:
      case 4:
        return formData.vehicleId;
      default:
        return null;
    }
  };

  // Render target type cell
  const renderTargetTypeCell = (cellData) => {
    return getTargetTypeDisplayName(cellData.value);
  };

  // Render target cell
  const renderTargetCell = (cellData) => {
    return cellData.data.targetDisplayName || "-";
  };

  // Render rule set name
  const renderRuleSetCell = (cellData) => {
    return cellData.data.ruleSetName || "-";
  };

  // Render actions cell
  const renderActionsCell = (cellData) => {
    return (
      <div className="tw-flex tw-gap-2">
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
      </div>
    );
  };

  return (
    <div className="tw-p-4 rule-set-assignment-manager">
      <div className="tw-mb-4 tw-flex tw-justify-between tw-items-center">
        <h2 className="tw-text-xl tw-font-semibold">
          <i className="fa-light fa-link tw-mr-2"></i>
          Rule Set Assignments
        </h2>
        <div className="assignment-action-buttons">
          <Button
            text="Add Assignment"
            icon="fa-light fa-plus"
            type="default"
            stylingMode="outlined"
            onClick={handleAddClick}
            hint="Add new assignment"
            className="assignment-action-btn assignment-action-btn--first assignment-action-btn--add"
          />
          <Button
            text="Bulk Assign"
            icon="fa-light fa-copy"
            type="default"
            stylingMode="outlined"
            onClick={handleBulkAddClick}
            hint="Bulk assign rule sets"
            className="assignment-action-btn assignment-action-btn--bulk"
          />
          <Button
            text="Refresh"
            icon="fa-light fa-refresh"
            type="default"
            stylingMode="outlined"
            onClick={loadAssignments}
            hint="Refresh assignments"
            className="assignment-action-btn assignment-action-btn--refresh"
          />
          <Button
            text="Help"
            icon="fa-light fa-circle-question"
            type="default"
            stylingMode="outlined"
            onClick={() => setShowHelp(true)}
            hint="Help - Learn about Fueling Rules"
            className="assignment-action-btn assignment-action-btn--last assignment-action-btn--help"
          />
        </div>
      </div>

      {/* Help Popup */}
      <FuelingRulesHelp visible={showHelp} onClose={() => setShowHelp(false)} />

      {/* Filters */}
      <div className="tw-mb-4 tw-flex tw-gap-4 tw-flex-wrap tw-items-end tw-bg-gray-50 tw-p-3 tw-rounded-lg">
        <div className="tw-flex tw-flex-col">
          <label className="tw-text-sm tw-text-gray-600 tw-mb-1">
            Rule Set
          </label>
          <SelectBox
            items={ruleSets}
            displayExpr="name"
            valueExpr="id"
            value={filterRuleSetId}
            onValueChanged={(e) => setFilterRuleSetId(e.value)}
            placeholder="All Rule Sets"
            showClearButton
            width={200}
          />
        </div>
        <div className="tw-flex tw-flex-col">
          <label className="tw-text-sm tw-text-gray-600 tw-mb-1">
            Target Type
          </label>
          <SelectBox
            items={targetTypeOptions}
            displayExpr="name"
            valueExpr="id"
            value={filterTargetType}
            onValueChanged={(e) => setFilterTargetType(e.value)}
            placeholder="All Types"
            showClearButton
            width={150}
          />
        </div>
        <div className="tw-flex tw-flex-col">
          <label className="tw-text-sm tw-text-gray-600 tw-mb-1">Status</label>
          <SelectBox
            items={[
              { id: true, name: "Active" },
              { id: false, name: "Inactive" },
            ]}
            displayExpr="name"
            valueExpr="id"
            value={filterIsActive}
            onValueChanged={(e) => setFilterIsActive(e.value)}
            placeholder="All"
            showClearButton
            width={120}
          />
        </div>
      </div>

      {/* Data Grid */}
      {assignmentsLoading ? (
        <div className="tw-flex tw-justify-center tw-py-8">
          <LoadIndicator />
        </div>
      ) : (
        <DataGrid
          dataSource={assignments}
          showBorders
          columnAutoWidth
          rowAlternationEnabled
          keyExpr="id"
          height={500}
        >
          <Paging defaultPageSize={20} />
          <Pager
            showPageSizeSelector
            allowedPageSizes={[10, 20, 50]}
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
            caption="Target Type"
            cellRender={renderTargetTypeCell}
            width={120}
          />
          <Column
            dataField="targetDisplayName"
            caption="Target"
            cellRender={renderTargetCell}
          />
          <Column dataField="priority" caption="Priority" width={80} />
          <Column
            dataField="isActive"
            caption="Active"
            width={80}
            dataType="boolean"
          />
          <Column
            dataField="createdAt"
            caption="Created"
            dataType="datetime"
            width={150}
            format="yyyy-MM-dd HH:mm"
          />
          <Column
            caption="Actions"
            width={100}
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
        title={isEditing ? "Edit Assignment" : "Add Assignment"}
        width={500}
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
              Target Type <span className="tw-text-red-500">*</span>
            </label>
            <SelectBox
              items={targetTypeOptions}
              displayExpr="name"
              valueExpr="id"
              value={formData.targetType}
              onValueChanged={(e) => handleTargetTypeChange(e.value)}
              placeholder="Select Target Type"
            />
          </div>

          {formData.targetType !== null && (
            <div className="tw-mb-4">
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
                {getTargetTypeDisplayName(formData.targetType)}{" "}
                <span className="tw-text-red-500">*</span>
              </label>
              <SelectBox
                items={getTargetOptions(formData.targetType)}
                displayExpr="name"
                valueExpr="id"
                value={getCurrentTargetValue()}
                onValueChanged={(e) => handleTargetChange(e.value)}
                placeholder={`Select ${getTargetTypeDisplayName(
                  formData.targetType
                )}`}
                searchEnabled
              />
            </div>
          )}

          <div className="tw-mb-4">
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Priority (optional)
            </label>
            <NumberBox
              value={formData.priority}
              onValueChanged={(e) =>
                setFormData({ ...formData, priority: e.value })
              }
              placeholder="Auto (based on target type)"
              showSpinButtons
              min={0}
              max={1000}
            />
            <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
              Default priorities: Site=100, Vehicle Type=200, Tag=300,
              Vehicle=400
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

      {/* Bulk Add Popup */}
      <Popup
        visible={showBulkPopup}
        onHiding={() => setShowBulkPopup(false)}
        title="Bulk Assign Rule Set"
        width={550}
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
              value={bulkFormData.fuelingRuleSetId}
              onValueChanged={(e) =>
                setBulkFormData({ ...bulkFormData, fuelingRuleSetId: e.value })
              }
              placeholder="Select Rule Set"
              searchEnabled
            />
          </div>

          <div className="tw-mb-4">
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Target Type <span className="tw-text-red-500">*</span>
            </label>
            <SelectBox
              items={targetTypeOptions}
              displayExpr="name"
              valueExpr="id"
              value={bulkFormData.targetType}
              onValueChanged={(e) =>
                setBulkFormData({
                  ...bulkFormData,
                  targetType: e.value,
                  targetIds: [],
                })
              }
              placeholder="Select Target Type"
            />
          </div>

          {bulkFormData.targetType !== null && (
            <div className="tw-mb-4">
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
                Select {getTargetTypeDisplayName(bulkFormData.targetType)}s{" "}
                <span className="tw-text-red-500">*</span>
              </label>
              <TagBox
                items={getTargetOptions(bulkFormData.targetType)}
                displayExpr="name"
                valueExpr="id"
                value={bulkFormData.targetIds}
                onValueChanged={(e) =>
                  setBulkFormData({ ...bulkFormData, targetIds: e.value })
                }
                placeholder={`Select multiple ${getTargetTypeDisplayName(
                  bulkFormData.targetType
                )}s`}
                searchEnabled
                showSelectionControls
                maxDisplayedTags={5}
              />
            </div>
          )}

          <div className="tw-mb-4">
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Priority (optional)
            </label>
            <NumberBox
              value={bulkFormData.priority}
              onValueChanged={(e) =>
                setBulkFormData({ ...bulkFormData, priority: e.value })
              }
              placeholder="Auto (based on target type)"
              showSpinButtons
              min={0}
              max={1000}
            />
          </div>

          <div className="tw-bg-blue-50 tw-p-3 tw-rounded tw-mb-4">
            <p className="tw-text-sm tw-text-blue-800">
              <i className="fa-light fa-info-circle tw-mr-1"></i>
              Existing assignments will be skipped. Only new assignments will be
              created.
            </p>
          </div>

          <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-6">
            <Button
              text="Cancel"
              stylingMode="outlined"
              onClick={() => setShowBulkPopup(false)}
            />
            <Button
              text={isSaving ? "Creating..." : "Create Assignments"}
              type="default"
              stylingMode="contained"
              onClick={handleBulkSave}
              disabled={isSaving}
            />
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default RuleSetAssignmentManager;
