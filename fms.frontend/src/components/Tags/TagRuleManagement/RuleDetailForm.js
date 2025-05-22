import React, { useState, useEffect } from "react";
import { Popup } from "devextreme-react/popup";
import { Form, SimpleItem, GroupItem } from "devextreme-react/form";
import { Button } from "devextreme-react/button";
import { RadioGroup } from "devextreme-react/radio-group";
import { LoadPanel } from "devextreme-react/load-panel";
import { useDispatch } from "react-redux";
import {
  createDailyMonthlyRule,
  updateDailyMonthlyRule,
  createRefillCountRule,
  updateRefillCountRule,
  createTimeWindowRule,
  updateTimeWindowRule,
  deleteDailyMonthlyRule,
  deleteRefillCountRule,
  deleteTimeWindowRule,
} from "../../../redux/actions/fuelingRuleActions";
import notify from "devextreme/ui/notify";
import "./TagRuleManagement.scss";

const RULE_TYPES = [
  { id: "DailyMonthlyLimitRule", name: "Daily/Monthly Limits" },
  { id: "NoOfRefillRule", name: "Refill Count Limits" },
  { id: "TimeWindowRule", name: "Time Window Restrictions" },
];

const RuleDetailForm = ({ isVisible, onClose, ruleSet, rule, editMode }) => {
  const dispatch = useDispatch();

  const [selectedRuleType, setSelectedRuleType] = useState(
    "DailyMonthlyLimitRule"
  );
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Daily/Monthly form data
  const [dailyMonthlyFormData, setDailyMonthlyFormData] = useState({
    ruleSetId: null,
    ruleId: null,
    ruleName: "",
    dailyLimit: 50,
    monthlyLimit: 500,
    fuelingLimit: 100,
    isActive: true,
  });

  // Refill count form data
  const [refillCountFormData, setRefillCountFormData] = useState({
    ruleSetId: null,
    ruleId: null,
    ruleName: "",
    refillCountDaily: 2,
    refillCountWeekly: 10,
    refillCountMonthly: 30,
    isActive: true,
  });

  // Time window form data
  const [timeWindowFormData, setTimeWindowFormData] = useState({
    ruleSetId: null,
    ruleId: null,
    ruleName: "",
    startTime: "07:00",
    endTime: "18:00",
    allowedDays: [1, 2, 3, 4, 5], // Monday to Friday by default
    isActive: true,
  });

  useEffect(() => {
    if (ruleSet && ruleSet.id) {
      // Set rule set ID for all form types
      setDailyMonthlyFormData((prev) => ({ ...prev, ruleSetId: ruleSet.id }));
      setRefillCountFormData((prev) => ({ ...prev, ruleSetId: ruleSet.id }));
      setTimeWindowFormData((prev) => ({ ...prev, ruleSetId: ruleSet.id }));

      if (rule && editMode === "edit") {
        // Determine rule type and populate the correct form
        if (rule.discriminator === "DailyMonthlyLimitRule") {
          setSelectedRuleType("DailyMonthlyLimitRule");
          setDailyMonthlyFormData({
            ruleSetId: ruleSet.id,
            ruleId: rule.id,
            ruleName: rule.ruleName || "",
            dailyLimit: rule.dailyLimit || 50,
            monthlyLimit: rule.monthlyLimit || 500,
            fuelingLimit: rule.fuelingLimit || 100,
            isActive: rule.isActive !== false,
          });
        } else if (rule.discriminator === "NoOfRefillRule") {
          setSelectedRuleType("NoOfRefillRule");
          setRefillCountFormData({
            ruleSetId: ruleSet.id,
            ruleId: rule.id,
            ruleName: rule.ruleName || "",
            refillCountDaily: rule.refillCountDaily || 2,
            refillCountWeekly: rule.refillCountWeekly || 10,
            refillCountMonthly: rule.refillCountMonthly || 30,
            isActive: rule.isActive !== false,
          });
        } else if (rule.discriminator === "TimeWindowRule") {
          setSelectedRuleType("TimeWindowRule");
          setTimeWindowFormData({
            ruleSetId: ruleSet.id,
            ruleId: rule.id,
            ruleName: rule.ruleName || "",
            startTime: rule.startTime || "07:00",
            endTime: rule.endTime || "18:00",
            allowedDays: Array.isArray(rule.allowedDays)
              ? rule.allowedDays
              : [1, 2, 3, 4, 5],
            isActive: rule.isActive !== false,
          });
        }
      } else {
        // New rule - just use rule set ID
        setSelectedRuleType("DailyMonthlyLimitRule");
      }
    }
  }, [ruleSet, rule, editMode]);

  const handleRuleTypeChange = (e) => {
    if (e && e.value) {
      setSelectedRuleType(e.value);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (selectedRuleType === "DailyMonthlyLimitRule") {
      if (!dailyMonthlyFormData.ruleName) {
        errors.dailyMonthlyRuleName = "Rule name is required";
      }
      if (dailyMonthlyFormData.dailyLimit < 0) {
        errors.dailyLimit = "Daily limit cannot be negative";
      }
      if (dailyMonthlyFormData.monthlyLimit < 0) {
        errors.monthlyLimit = "Monthly limit cannot be negative";
      }
      if (dailyMonthlyFormData.fuelingLimit < 0) {
        errors.fuelingLimit = "Fueling limit cannot be negative";
      }
    } else if (selectedRuleType === "NoOfRefillRule") {
      if (!refillCountFormData.ruleName) {
        errors.refillCountRuleName = "Rule name is required";
      }
      if (refillCountFormData.refillCountDaily < 0) {
        errors.refillCountDaily = "Daily refill count cannot be negative";
      }
      if (refillCountFormData.refillCountWeekly < 0) {
        errors.refillCountWeekly = "Weekly refill count cannot be negative";
      }
      if (refillCountFormData.refillCountMonthly < 0) {
        errors.refillCountMonthly = "Monthly refill count cannot be negative";
      }
    } else if (selectedRuleType === "TimeWindowRule") {
      if (!timeWindowFormData.ruleName) {
        errors.timeWindowRuleName = "Rule name is required";
      }
      if (
        !timeWindowFormData.allowedDays ||
        !Array.isArray(timeWindowFormData.allowedDays) ||
        timeWindowFormData.allowedDays.length === 0
      ) {
        errors.allowedDays = "At least one day must be selected";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (formType, fieldName, value) => {
    if (formType === "dailyMonthly") {
      setDailyMonthlyFormData((prev) => ({ ...prev, [fieldName]: value }));
    } else if (formType === "refillCount") {
      setRefillCountFormData((prev) => ({ ...prev, [fieldName]: value }));
    } else if (formType === "timeWindow") {
      setTimeWindowFormData((prev) => ({ ...prev, [fieldName]: value }));
    }

    // Clear validation error for this field if it exists
    if (validationErrors[fieldName]) {
      const newErrors = { ...validationErrors };
      delete newErrors[fieldName];
      setValidationErrors(newErrors);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      notify("Please correct the errors before submitting", "error", 3000);
      return;
    }

    if (!ruleSet || !ruleSet.id) {
      notify("Cannot save rule: Missing rule set information", "error", 3000);
      return;
    }

    setLoading(true);
    try {
      let result;

      if (selectedRuleType === "DailyMonthlyLimitRule") {
        if (editMode === "edit") {
          if (!dailyMonthlyFormData.ruleId) {
            throw new Error("Missing rule ID for update");
          }
          result = await dispatch(
            updateDailyMonthlyRule(dailyMonthlyFormData.ruleId, {
              ruleId: dailyMonthlyFormData.ruleId,
              ruleName: dailyMonthlyFormData.ruleName,
              dailyLimit: dailyMonthlyFormData.dailyLimit,
              monthlyLimit: dailyMonthlyFormData.monthlyLimit,
              fuelingLimit: dailyMonthlyFormData.fuelingLimit,
              isActive: dailyMonthlyFormData.isActive,
            })
          );
        } else {
          result = await dispatch(
            createDailyMonthlyRule(ruleSet.id, {
              ruleSetId: ruleSet.id,
              ruleName: dailyMonthlyFormData.ruleName,
              dailyLimit: dailyMonthlyFormData.dailyLimit,
              monthlyLimit: dailyMonthlyFormData.monthlyLimit,
              fuelingLimit: dailyMonthlyFormData.fuelingLimit,
              isActive: dailyMonthlyFormData.isActive,
            })
          );
        }
      } else if (selectedRuleType === "NoOfRefillRule") {
        if (editMode === "edit") {
          if (!refillCountFormData.ruleId) {
            throw new Error("Missing rule ID for update");
          }
          result = await dispatch(
            updateRefillCountRule(refillCountFormData.ruleId, {
              ruleId: refillCountFormData.ruleId,
              ruleName: refillCountFormData.ruleName,
              refillCountDaily: refillCountFormData.refillCountDaily,
              refillCountWeekly: refillCountFormData.refillCountWeekly,
              refillCountMonthly: refillCountFormData.refillCountMonthly,
              isActive: refillCountFormData.isActive,
            })
          );
        } else {
          result = await dispatch(
            createRefillCountRule(ruleSet.id, {
              ruleSetId: ruleSet.id,
              ruleName: refillCountFormData.ruleName,
              refillCountDaily: refillCountFormData.refillCountDaily,
              refillCountWeekly: refillCountFormData.refillCountWeekly,
              refillCountMonthly: refillCountFormData.refillCountMonthly,
              isActive: refillCountFormData.isActive,
            })
          );
        }
      } else if (selectedRuleType === "TimeWindowRule") {
        if (editMode === "edit") {
          if (!timeWindowFormData.ruleId) {
            throw new Error("Missing rule ID for update");
          }
          result = await dispatch(
            updateTimeWindowRule(timeWindowFormData.ruleId, {
              ruleId: timeWindowFormData.ruleId,
              ruleName: timeWindowFormData.ruleName,
              startTime: timeWindowFormData.startTime,
              endTime: timeWindowFormData.endTime,
              allowedDays: timeWindowFormData.allowedDays,
              isActive: timeWindowFormData.isActive,
            })
          );
        } else {
          result = await dispatch(
            createTimeWindowRule(ruleSet.id, {
              ruleSetId: ruleSet.id,
              ruleName: timeWindowFormData.ruleName,
              startTime: timeWindowFormData.startTime,
              endTime: timeWindowFormData.endTime,
              allowedDays: timeWindowFormData.allowedDays,
              isActive: timeWindowFormData.isActive,
            })
          );
        }
      }

      if (result && result.success) {
        notify(
          `Rule ${editMode === "add" ? "created" : "updated"} successfully`,
          "success",
          2000
        );
        onClose();
      } else {
        notify(
          result?.error ||
            `Failed to ${editMode === "add" ? "create" : "update"} rule`,
          "error",
          3000
        );
      }
    } catch (error) {
      console.error("Error saving rule:", error);
      notify(error?.message || "An unexpected error occurred", "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!rule || !rule.id) {
      notify("Cannot delete rule: No rule ID provided", "error", 3000);
      return;
    }

    setLoading(true);
    try {
      let result;

      if (rule.discriminator === "DailyMonthlyLimitRule") {
        result = await dispatch(deleteDailyMonthlyRule(rule.id));
      } else if (rule.discriminator === "NoOfRefillRule") {
        result = await dispatch(deleteRefillCountRule(rule.id));
      } else if (rule.discriminator === "TimeWindowRule") {
        result = await dispatch(deleteTimeWindowRule(rule.id));
      } else {
        throw new Error(`Unknown rule type: ${rule.discriminator}`);
      }

      if (result && result.success) {
        notify("Rule deleted successfully", "success", 2000);
        onClose();
      } else {
        notify(result?.error || "Failed to delete rule", "error", 3000);
      }
    } catch (error) {
      console.error("Error deleting rule:", error);
      notify(error?.message || "An unexpected error occurred", "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  // Safety check for rendering
  if (!ruleSet) {
    return null;
  }

  const renderDailyMonthlyForm = () => {
    return (
      <Form
        formData={dailyMonthlyFormData}
        labelLocation="top"
        showColonAfterLabel={true}
      >
        <SimpleItem
          dataField="ruleName"
          label={{ text: "Rule Name" }}
          editorOptions={{
            placeholder: "Enter rule name",
            onValueChanged: (e) =>
              handleFieldChange("dailyMonthly", "ruleName", e.value),
          }}
          isRequired={true}
          validationError={validationErrors.dailyMonthlyRuleName}
        />

        <SimpleItem
          dataField="dailyLimit"
          label={{ text: "Daily Limit (Liters)" }}
          editorType="dxNumberBox"
          editorOptions={{
            min: 0,
            showSpinButtons: true,
            onValueChanged: (e) =>
              handleFieldChange("dailyMonthly", "dailyLimit", e.value),
          }}
          validationError={validationErrors.dailyLimit}
        />

        <SimpleItem
          dataField="monthlyLimit"
          label={{ text: "Monthly Limit (Liters)" }}
          editorType="dxNumberBox"
          editorOptions={{
            min: 0,
            showSpinButtons: true,
            onValueChanged: (e) =>
              handleFieldChange("dailyMonthly", "monthlyLimit", e.value),
          }}
          validationError={validationErrors.monthlyLimit}
        />

        <SimpleItem
          dataField="fuelingLimit"
          label={{ text: "Per Transaction Limit (Liters)" }}
          editorType="dxNumberBox"
          editorOptions={{
            min: 0,
            showSpinButtons: true,
            onValueChanged: (e) =>
              handleFieldChange("dailyMonthly", "fuelingLimit", e.value),
          }}
          validationError={validationErrors.fuelingLimit}
        />

        <SimpleItem
          dataField="isActive"
          label={{ text: "Active" }}
          editorType="dxSwitch"
          editorOptions={{
            switchedOnText: "Yes",
            switchedOffText: "No",
            onValueChanged: (e) =>
              handleFieldChange("dailyMonthly", "isActive", e.value),
          }}
        />
      </Form>
    );
  };

  const renderRefillCountForm = () => {
    return (
      <Form
        formData={refillCountFormData}
        labelLocation="top"
        showColonAfterLabel={true}
      >
        <SimpleItem
          dataField="ruleName"
          label={{ text: "Rule Name" }}
          editorOptions={{
            placeholder: "Enter rule name",
            onValueChanged: (e) =>
              handleFieldChange("refillCount", "ruleName", e.value),
          }}
          isRequired={true}
          validationError={validationErrors.refillCountRuleName}
        />

        <SimpleItem
          dataField="refillCountDaily"
          label={{ text: "Daily Refill Count" }}
          editorType="dxNumberBox"
          editorOptions={{
            min: 0,
            showSpinButtons: true,
            onValueChanged: (e) =>
              handleFieldChange("refillCount", "refillCountDaily", e.value),
          }}
          validationError={validationErrors.refillCountDaily}
        />

        <SimpleItem
          dataField="refillCountWeekly"
          label={{ text: "Weekly Refill Count" }}
          editorType="dxNumberBox"
          editorOptions={{
            min: 0,
            showSpinButtons: true,
            onValueChanged: (e) =>
              handleFieldChange("refillCount", "refillCountWeekly", e.value),
          }}
          validationError={validationErrors.refillCountWeekly}
        />

        <SimpleItem
          dataField="refillCountMonthly"
          label={{ text: "Monthly Refill Count" }}
          editorType="dxNumberBox"
          editorOptions={{
            min: 0,
            showSpinButtons: true,
            onValueChanged: (e) =>
              handleFieldChange("refillCount", "refillCountMonthly", e.value),
          }}
          validationError={validationErrors.refillCountMonthly}
        />

        <SimpleItem
          dataField="isActive"
          label={{ text: "Active" }}
          editorType="dxSwitch"
          editorOptions={{
            switchedOnText: "Yes",
            switchedOffText: "No",
            onValueChanged: (e) =>
              handleFieldChange("refillCount", "isActive", e.value),
          }}
        />
      </Form>
    );
  };

  const renderTimeWindowForm = () => {
    return (
      <Form
        formData={timeWindowFormData}
        labelLocation="top"
        showColonAfterLabel={true}
      >
        <SimpleItem
          dataField="ruleName"
          label={{ text: "Rule Name" }}
          editorOptions={{
            placeholder: "Enter rule name",
            onValueChanged: (e) =>
              handleFieldChange("timeWindow", "ruleName", e.value),
          }}
          isRequired={true}
          validationError={validationErrors.timeWindowRuleName}
        />

        <GroupItem cssClass="time-range-group">
          <SimpleItem
            dataField="startTime"
            label={{ text: "Start Time" }}
            editorType="dxDateBox"
            editorOptions={{
              type: "time",
              pickerType: "calendar",
              onValueChanged: (e) =>
                handleFieldChange("timeWindow", "startTime", e.value),
            }}
          />

          <SimpleItem
            dataField="endTime"
            label={{ text: "End Time" }}
            editorType="dxDateBox"
            editorOptions={{
              type: "time",
              pickerType: "calendar",
              onValueChanged: (e) =>
                handleFieldChange("timeWindow", "endTime", e.value),
            }}
          />
        </GroupItem>

        <SimpleItem
          dataField="allowedDays"
          label={{ text: "Allowed Days" }}
          editorType="dxTagBox"
          editorOptions={{
            items: [
              { id: 0, name: "Sunday" },
              { id: 1, name: "Monday" },
              { id: 2, name: "Tuesday" },
              { id: 3, name: "Wednesday" },
              { id: 4, name: "Thursday" },
              { id: 5, name: "Friday" },
              { id: 6, name: "Saturday" },
            ],
            displayExpr: "name",
            valueExpr: "id",
            onValueChanged: (e) =>
              handleFieldChange("timeWindow", "allowedDays", e.value),
          }}
          validationError={validationErrors.allowedDays}
        />

        <SimpleItem
          dataField="isActive"
          label={{ text: "Active" }}
          editorType="dxSwitch"
          editorOptions={{
            switchedOnText: "Yes",
            switchedOffText: "No",
            onValueChanged: (e) =>
              handleFieldChange("timeWindow", "isActive", e.value),
          }}
        />
      </Form>
    );
  };

  return (
    <Popup
      visible={isVisible}
      onHiding={onClose}
      title={`${editMode === "add" ? "Add" : "Edit"} Rule for "${
        ruleSet?.name || "Rule Set"
      }"`}
      showCloseButton={true}
      width={600}
      height={550}
      className="rule-detail-form-popup"
    >
      <div className="rule-detail-form-container">
        {editMode === "add" && (
          <div className="rule-type-selector">
            <label>Rule Type:</label>
            <RadioGroup
              items={RULE_TYPES}
              value={selectedRuleType}
              valueExpr="id"
              displayExpr="name"
              layout="horizontal"
              onValueChanged={handleRuleTypeChange}
            />
          </div>
        )}

        <div className="rule-form">
          {selectedRuleType === "DailyMonthlyLimitRule" &&
            renderDailyMonthlyForm()}
          {selectedRuleType === "NoOfRefillRule" && renderRefillCountForm()}
          {selectedRuleType === "TimeWindowRule" && renderTimeWindowForm()}
        </div>

        <div className="form-actions">
          {editMode === "edit" && (
            <Button
              text="Delete"
              stylingMode="outlined"
              type="danger"
              onClick={handleDelete}
              disabled={loading}
            />
          )}
          <div className="spacer"></div>
          <Button
            text="Cancel"
            stylingMode="outlined"
            type="normal"
            onClick={onClose}
          />
          <Button
            text="Save"
            type="default"
            stylingMode="contained"
            onClick={handleSubmit}
            disabled={loading}
          />
        </div>
      </div>

      <LoadPanel
        visible={loading}
        showIndicator={true}
        shading={true}
        shadingColor="rgba(0, 0, 0, 0.4)"
        showPane={true}
        message={editMode === "edit" ? "Saving..." : "Creating..."}
      />
    </Popup>
  );
};

export default RuleDetailForm;
