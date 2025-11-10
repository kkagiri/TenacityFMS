import React, { useState, useEffect } from "react";
import {
  DataGrid,
  Column,
  Paging,
  Pager,
  FilterRow,
  Selection,
  Editing,
  GroupPanel,
  Grouping,
  SearchPanel,
} from "devextreme-react/data-grid";
import { Button } from "devextreme-react/button";
import { LoadPanel } from "devextreme-react/load-panel";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllRuleSets,
  createRuleSet,
  updateRuleSet,
  deleteRuleSet,
} from "../../../redux/actions/fuelingRuleActions";
import { fetchTags } from "../../../redux/actions/tagActions";
import RuleSetForm from "./RuleSetForm";
import RuleDetailForm from "./RuleDetailForm";
import notify from "devextreme/ui/notify";
import "./TagRuleManagement.scss";

const TagRuleManagement = () => {
  const dispatch = useDispatch();
  const ruleSets = useSelector((state) => state.fuelingRule.ruleSets || []);
  const loading = useSelector((state) => state.fuelingRule.loading);
  const tags = useSelector((state) => state.tag.tags || []);

  const [selectedRuleSet, setSelectedRuleSet] = useState(null);
  const [isRuleSetFormVisible, setIsRuleSetFormVisible] = useState(false);
  const [isRuleDetailFormVisible, setIsRuleDetailFormVisible] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [editMode, setEditMode] = useState("add"); // 'add' or 'edit'

  useEffect(() => {
    dispatch(fetchAllRuleSets());
    dispatch(fetchTags());
  }, [dispatch]);

  const handleAddRuleSet = () => {
    setSelectedRuleSet(null);
    setEditMode("add");
    setIsRuleSetFormVisible(true);
  };

  const handleEditRuleSet = (ruleSet) => {
    if (!ruleSet) return;
    setSelectedRuleSet(ruleSet);
    setEditMode("edit");
    setIsRuleSetFormVisible(true);
  };

  const handleDeleteRuleSet = async (ruleSet) => {
    if (!ruleSet || !ruleSet.id) {
      notify("Cannot delete: Invalid rule set", "error", 2000);
      return;
    }

    // Check if rule set is assigned to any tags
    const assignedTags = tags.filter(tag => tag.fuelRuleSetId === ruleSet.id);

    if (assignedTags.length > 0) {
      const tagNames = assignedTags.map(tag => tag.tagName).join(", ");
      notify({
        message: `Cannot delete rule set "${ruleSet.name}". It is currently assigned to ${assignedTags.length} tag(s): ${tagNames.substring(0, 50)}${tagNames.length > 50 ? '...' : ''}. Please unassign it first.`,
        type: "error",
        displayTime: 6000,
        width: 450
      });
      return;
    }

    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete the rule set "${ruleSet.name}"?\n\n` +
      `This rule set contains ${ruleSet.rules?.length || 0} rule(s). This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const result = await dispatch(deleteRuleSet(ruleSet.id));
      if (result.success) {
        notify(
          `Rule set "${ruleSet.name}" deleted successfully`,
          "success",
          2000
        );
        dispatch(fetchAllRuleSets());
      } else {
        // Check for foreign key constraint error
        if (result.error && (result.error.includes("foreign key") || result.error.includes("constraint"))) {
          notify({
            message: `Cannot delete rule set "${ruleSet.name}". It is currently assigned to one or more tags or vehicles. Please unassign it first.`,
            type: "error",
            displayTime: 5000,
            width: 450
          });
        } else {
          notify(result.error || "Failed to delete rule set", "error", 3000);
        }
      }
    } catch (error) {
      console.error("Error deleting rule set:", error);
      const errorMessage = error.message || error.toString();

      if (errorMessage.includes("foreign key") || errorMessage.includes("constraint")) {
        notify({
          message: `Cannot delete rule set "${ruleSet.name}". It is currently in use. Please unassign it from all tags and vehicles first.`,
          type: "error",
          displayTime: 5000,
          width: 450
        });
      } else {
        notify("An error occurred while deleting rule set", "error", 3000);
      }
    }
  };

  const handleRuleSetFormClose = () => {
    setIsRuleSetFormVisible(false);
  };

  const handleRuleSetSave = async (formData) => {
    if (!formData) {
      notify("Invalid form data", "error", 2000);
      return;
    }

    try {
      const result =
        editMode === "add"
          ? await dispatch(createRuleSet(formData))
          : await dispatch(updateRuleSet(formData.id, formData));

      if (result.success) {
        notify(
          `Rule set ${editMode === "add" ? "created" : "updated"} successfully`,
          "success",
          2000
        );
        setIsRuleSetFormVisible(false);
        dispatch(fetchAllRuleSets());
      } else {
        notify(
          result.error ||
            `Failed to ${editMode === "add" ? "create" : "update"} rule set`,
          "error",
          3000
        );
      }
    } catch (error) {
      console.error(
        `Error ${editMode === "add" ? "creating" : "updating"} rule set:`,
        error
      );
      notify("An error occurred", "error", 3000);
    }
  };

  const handleAddRule = (ruleSet) => {
    if (!ruleSet || !ruleSet.id) {
      notify("Cannot add rule to invalid rule set", "error", 2000);
      return;
    }

    setSelectedRuleSet(ruleSet);
    setSelectedRule(null);
    setEditMode("add");
    setIsRuleDetailFormVisible(true);
  };

  const handleEditRule = (rule, ruleSet) => {
    if (!rule || !ruleSet) {
      notify(
        "Cannot edit: Missing rule or rule set information",
        "error",
        2000
      );
      return;
    }

    setSelectedRuleSet(ruleSet);
    setSelectedRule(rule);
    setEditMode("edit");
    setIsRuleDetailFormVisible(true);
  };

  const handleRuleDetailFormClose = () => {
    setIsRuleDetailFormVisible(false);
  };

  const renderRuleSetActions = (cellData) => {
    if (!cellData || !cellData.data) return null;

    const ruleSet = cellData.data;
    return (
      <div className="rule-set-actions">
        <Button
          icon="edit"
          onClick={() => handleEditRuleSet(ruleSet)}
          stylingMode="text"
          hint="Edit Rule Set"
        />
        <Button
          icon="trash"
          onClick={() => handleDeleteRuleSet(ruleSet)}
          stylingMode="text"
          hint="Delete Rule Set"
        />
        <Button
          icon="add"
          onClick={() => handleAddRule(ruleSet)}
          stylingMode="text"
          hint="Add Rule"
        />
      </div>
    );
  };

  const renderRuleCount = (cellData) => {
    if (!cellData || !cellData.data) return null;

    const ruleSet = cellData.data;
    return (
      <div className="rule-count">
        <span className="badge">
          {ruleSet.rules && Array.isArray(ruleSet.rules)
            ? ruleSet.rules.length
            : 0}
        </span>
      </div>
    );
  };

  const renderRulesDetail = (cellData) => {
    if (!cellData || !cellData.data) {
      return null;
    }

    const ruleSet = cellData.data;

    if (!ruleSet.id) {
      return <span className="no-rules tw-text-xs tw-text-red-500">Invalid rule set</span>;
    }

    if (
      !ruleSet.rules ||
      !Array.isArray(ruleSet.rules) ||
      ruleSet.rules.length === 0
    ) {
      return (
        <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-gray-400 tw-italic">
          <i className="fa-light fa-inbox"></i>
          <span>No rules defined</span>
        </div>
      );
    }

    try {
      return (
        <div className="rule-details tw-space-y-2">
          {ruleSet.rules.map((rule, index) => {
            if (!rule) return null;

            const getRuleIcon = () => {
              if (rule.discriminator === 'DailyMonthlyLimitRule') {
                return 'fa-light fa-gauge-high tw-text-green-600';
              } else if (rule.discriminator === 'NoOfRefillRule') {
                return 'fa-light fa-hashtag tw-text-amber-600';
              } else if (rule.discriminator === 'TimeWindowRule') {
                return 'fa-light fa-clock tw-text-purple-600';
              }
              return 'fa-light fa-question-circle tw-text-gray-400';
            };

            const getRuleTypeLabel = () => {
              if (rule.discriminator === 'DailyMonthlyLimitRule') {
                return 'Volume Limits';
              } else if (rule.discriminator === 'NoOfRefillRule') {
                return 'Refill Count';
              } else if (rule.discriminator === 'TimeWindowRule') {
                return 'Time Window';
              }
              return 'Unknown';
            };

            return (
              <div
                key={rule.id || `rule-index-${index}`}
                className="rule-item tw-flex tw-items-center tw-gap-2 tw-p-2 tw-bg-gray-50 tw-rounded tw-border tw-border-gray-200 hover:tw-bg-gray-100 tw-transition-colors"
              >
                <i className={`${getRuleIcon()} tw-text-lg`}></i>
                <div className="tw-flex-1 tw-min-w-0">
                  <div className="tw-font-medium tw-text-sm tw-text-gray-900 tw-truncate">
                    {rule.ruleName || "Unnamed Rule"}
                  </div>
                  <div className="tw-text-xs tw-text-gray-500">
                    {getRuleTypeLabel()}
                    {!rule.isActive && (
                      <span className="tw-ml-2 tw-text-amber-600">
                        <i className="fa-light fa-pause-circle"></i> Inactive
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  icon="edit"
                  onClick={() => handleEditRule(rule, ruleSet)}
                  stylingMode="text"
                  hint="Edit Rule"
                  type="default"
                />
              </div>
            );
          })}
        </div>
      );
    } catch (error) {
      console.error("Error in renderRulesDetail:", error);
      return <span className="no-rules tw-text-xs tw-text-red-500">Error rendering rules</span>;
    }
  };

  return (
    <div className="tag-rule-management tw-p-4">
      <div className="section-header tw-flex tw-flex-col sm:tw-flex-row tw-items-start sm:tw-items-center tw-justify-between tw-mb-4 tw-gap-3">
        <div>
          <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-m-0 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-layer-group tw-text-blue-600"></i>
            Fueling Rule Sets
          </h2>
          <p className="tw-text-sm tw-text-gray-600 tw-mt-1 tw-mb-0">
            Create and manage rule sets to control fuel dispensing
          </p>
        </div>
        <Button
          text="Add Rule Set"
          type="default"
          stylingMode="contained"
          icon="fas fa-plus"
          onClick={handleAddRuleSet}
          height={40}
        />
      </div>

      {ruleSets && ruleSets.length === 0 && !loading && (
        <div className="empty-state tw-bg-gray-50 tw-border-2 tw-border-dashed tw-border-gray-300 tw-rounded-lg tw-p-8 tw-text-center tw-mb-4">
          <i className="fa-light fa-layer-group tw-text-gray-300 tw-text-5xl tw-mb-3"></i>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700 tw-mb-2">
            No Rule Sets Created
          </h3>
          <p className="tw-text-sm tw-text-gray-600 tw-mb-4">
            Get started by creating your first rule set. Rule sets contain multiple rules
            that define fueling restrictions for vehicles.
          </p>
          <Button
            text="Create First Rule Set"
            type="default"
            stylingMode="contained"
            icon="fas fa-plus"
            onClick={handleAddRuleSet}
          />
        </div>
      )}

      <DataGrid
        dataSource={ruleSets || []}
        keyExpr="id"
        showBorders={true}
        columnAutoWidth={true}
        hoverStateEnabled={true}
        noDataText="No rule sets available"
        repaintChangesOnly={true}
        remoteOperations={false}
        onContentReady={() => console.log("DataGrid content ready")}
      >
        <SearchPanel
          visible={true}
          width={240}
          placeholder="Search rule sets..."
        />
        <GroupPanel visible={true} />
        <Grouping autoExpandAll={false} />
        <FilterRow visible={true} />
        <Selection mode="single" />
        <Paging defaultPageSize={10} />
        <Pager
          showPageSizeSelector={true}
          allowedPageSizes={[5, 10, 20, 50]}
          showInfo={true}
        />

        <Column type="buttons" width={120} cellRender={renderRuleSetActions} />
        <Column dataField="name" caption="Rule Set Name" />
        <Column dataField="description" caption="Description" />
        <Column
          caption="Rule Count"
          cellRender={renderRuleCount}
          width={100}
          alignment="center"
        />
        <Column caption="Rules" cellRender={renderRulesDetail} />
      </DataGrid>

      {isRuleSetFormVisible && (
        <RuleSetForm
          isVisible={isRuleSetFormVisible}
          onClose={handleRuleSetFormClose}
          onSave={handleRuleSetSave}
          ruleSet={selectedRuleSet}
          editMode={editMode}
        />
      )}

      {isRuleDetailFormVisible && (
        <RuleDetailForm
          isVisible={isRuleDetailFormVisible}
          onClose={handleRuleDetailFormClose}
          ruleSet={selectedRuleSet}
          rule={selectedRule}
          editMode={editMode}
        />
      )}

      <LoadPanel
        visible={loading}
        showIndicator={true}
        shading={true}
        shadingColor="rgba(0, 0, 0, 0.4)"
        showPane={true}
        message="Loading..."
      />
    </div>
  );
};

export default TagRuleManagement;
