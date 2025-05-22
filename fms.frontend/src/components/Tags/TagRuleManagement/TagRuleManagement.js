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
import RuleSetForm from "./RuleSetForm";
import RuleDetailForm from "./RuleDetailForm";
import notify from "devextreme/ui/notify";
import "./TagRuleManagement.scss";

const TagRuleManagement = () => {
  const dispatch = useDispatch();
  const ruleSets = useSelector((state) => state.fuelingRule.ruleSets || []);
  const loading = useSelector((state) => state.fuelingRule.loading);

  const [selectedRuleSet, setSelectedRuleSet] = useState(null);
  const [isRuleSetFormVisible, setIsRuleSetFormVisible] = useState(false);
  const [isRuleDetailFormVisible, setIsRuleDetailFormVisible] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [editMode, setEditMode] = useState("add"); // 'add' or 'edit'

  useEffect(() => {
    dispatch(fetchAllRuleSets());
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
        notify(result.error || "Failed to delete rule set", "error", 3000);
      }
    } catch (error) {
      console.error("Error deleting rule set:", error);
      notify("An error occurred while deleting rule set", "error", 3000);
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
    console.log("Entering renderRulesDetail", cellData);

    if (!cellData || !cellData.data) {
      console.log("Exiting renderRulesDetail - no cellData.data");
      return null;
    }

    const ruleSet = cellData.data;
    console.log("renderRulesDetail - Processing ruleSet:", ruleSet);

    if (!ruleSet.id) {
      console.log("Exiting renderRulesDetail - ruleSet has no id");
      return <span className="no-rules">Invalid rule set data</span>;
    }

    if (
      !ruleSet.rules ||
      !Array.isArray(ruleSet.rules) ||
      ruleSet.rules.length === 0
    ) {
      console.log(
        "Exiting renderRulesDetail - no rules defined for ruleSet:",
        ruleSet.id
      );
      return <span className="no-rules">No rules defined</span>;
    }

    console.log(
      `renderRulesDetail - Mapping ${ruleSet.rules.length} rules for ruleSet:`,
      ruleSet.id
    );

    try {
      return (
        <div className="rule-details">
          {ruleSet.rules.map((rule, index) => {
            console.log(
              `renderRulesDetail - Mapping rule index ${index}:`,
              rule
            );

            if (!rule) {
              console.log(
                `renderRulesDetail - Rule at index ${index} is null or undefined`
              );
              return null;
            }

            return (
              <div key={rule.id || `rule-index-${index}`} className="rule-item">
                <div className="rule-type">
                  {rule.discriminator || "Unknown"}
                </div>
                <div className="rule-name">
                  {rule.ruleName || "Unnamed Rule"}
                </div>
                <Button
                  icon="edit"
                  onClick={() => handleEditRule(rule, ruleSet)}
                  stylingMode="text"
                  hint="Edit Rule"
                />
              </div>
            );
          })}
        </div>
      );
    } catch (error) {
      console.error("Error in renderRulesDetail:", error);
      return <span className="no-rules">Error rendering rules</span>;
    }
  };

  return (
    <div className="tag-rule-management">
      <div className="section-header">
        <h2>Fueling Rule Sets</h2>
        <Button
          text="Add Rule Set"
          type="default"
          stylingMode="contained"
          icon="plus"
          onClick={handleAddRuleSet}
        />
      </div>

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
