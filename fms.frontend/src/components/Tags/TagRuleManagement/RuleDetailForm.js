import React, { useState, useEffect, useRef } from "react";
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
  {
    id: "DailyMonthlyLimitRule",
    name: "Daily/Monthly Limits",
    icon: "fa-light fa-gauge-high",
    description: "Set fuel volume limits per day, month, or transaction",
  },
  {
    id: "NoOfRefillRule",
    name: "Refill Count Limits",
    icon: "fa-light fa-hashtag",
    description:
      "Control how many times a vehicle can refuel within a time period",
  },
  {
    id: "TimeWindowRule",
    name: "Time Window Restrictions",
    icon: "fa-light fa-clock",
    description: "Restrict fueling to specific hours and days of the week",
  },
];

// Separate form components to ensure proper cleanup
const DailyMonthlyForm = ({ formData, onFieldChange, validationErrors }) => {
  const formRef = useRef(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (formRef.current) {
        formRef.current = null;
      }
    };
  }, []);

  return (
    <div className="rule-form-wrapper" ref={formRef}>
      <div className="rule-form-info tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3 tw-mb-4">
        <div className="tw-flex tw-items-start tw-gap-2">
          <span className="tw-text-blue-500 tw-text-lg tw-mt-1">
            <i className="fa-light fa-info-circle"></i>
          </span>
          <div>
            <h5 className="tw-text-sm tw-font-semibold tw-text-blue-700 tw-m-0 tw-mb-1">
              Daily/Monthly Fuel Limits
            </h5>
            <p className="tw-text-xs tw-text-blue-600 tw-m-0">
              These limits control how much fuel can be dispensed per day,
              month, and per transaction. Set limits to 0 to disable specific
              restrictions.
            </p>
          </div>
        </div>
      </div>

      <Form
        key={`daily-monthly-${formData.ruleId ?? "new"}-${
          formData.ruleSetId ?? "unset"
        }`}
        formData={formData}
        labelLocation="top"
        showColonAfterLabel={true}
        onFieldDataChanged={(e) => {
          if (e.dataField) {
            onFieldChange("dailyMonthly", e.dataField, e.value);
          }
        }}
      >
        <SimpleItem
          dataField="ruleName"
          label={{ text: "Rule Name" }}
          editorOptions={{
            placeholder: "e.g., Standard Vehicle Limits",
          }}
          isRequired={true}
          validationError={validationErrors.dailyMonthlyRuleName}
        />

        <GroupItem caption="Fuel Volume Limits" cssClass="tw-mb-3">
          <SimpleItem
            dataField="dailyLimit"
            label={{ text: "Daily Limit (Liters)" }}
            editorType="dxNumberBox"
            editorOptions={{
              min: 0,
              showSpinButtons: true,
              placeholder: "Maximum liters per day",
            }}
            validationError={validationErrors.dailyLimit}
            helpText="Total fuel allowed per day"
          />

          <SimpleItem
            dataField="monthlyLimit"
            label={{ text: "Monthly Limit (Liters)" }}
            editorType="dxNumberBox"
            editorOptions={{
              min: 0,
              showSpinButtons: true,
              placeholder: "Maximum liters per month",
            }}
            validationError={validationErrors.monthlyLimit}
            helpText="Total fuel allowed per calendar month"
          />

          <SimpleItem
            dataField="fuelingLimit"
            label={{ text: "Per Transaction Limit (Liters)" }}
            editorType="dxNumberBox"
            editorOptions={{
              min: 0,
              showSpinButtons: true,
              placeholder: "Maximum liters per transaction",
            }}
            validationError={validationErrors.fuelingLimit}
            helpText="Maximum fuel allowed in a single refueling session"
          />
        </GroupItem>
      </Form>

      {/* Native Toggle for Rule Status - outside Form to avoid infinite loop */}
      <div className="tw-mt-4 tw-pt-4 tw-border-t tw-border-gray-200">
        <label className="tw-flex tw-items-center tw-justify-between tw-cursor-pointer">
          <span className="tw-text-sm tw-font-medium tw-text-gray-700">
            Rule Status
          </span>
          <div className="tw-relative">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                onFieldChange("dailyMonthly", "isActive", e.target.checked)
              }
              className="tw-sr-only"
            />
            <div
              className={`tw-w-11 tw-h-6 tw-rounded-full tw-transition-colors ${
                formData.isActive ? "tw-bg-blue-500" : "tw-bg-gray-300"
              }`}
            ></div>
            <div
              className={`tw-absolute tw-top-0.5 tw-left-0.5 tw-w-5 tw-h-5 tw-bg-white tw-rounded-full tw-shadow tw-transition-transform ${
                formData.isActive ? "tw-translate-x-5" : "tw-translate-x-0"
              }`}
            ></div>
          </div>
        </label>
        <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
          {formData.isActive
            ? "Rule is active and will be enforced"
            : "Rule is inactive and will be ignored"}
        </p>
      </div>
    </div>
  );
};

const RefillCountForm = ({ formData, onFieldChange, validationErrors }) => {
  const formRef = useRef(null);

  useEffect(() => {
    return () => {
      if (formRef.current) {
        formRef.current = null;
      }
    };
  }, []);

  return (
    <div className="rule-form-wrapper" ref={formRef}>
      <div className="rule-form-info tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded-lg tw-p-3 tw-mb-4">
        <div className="tw-flex tw-items-start tw-gap-2">
          <span className="tw-text-amber-500 tw-text-lg tw-mt-1">
            <i className="fa-light fa-info-circle"></i>
          </span>
          <div>
            <h5 className="tw-text-sm tw-font-semibold tw-text-amber-700 tw-m-0 tw-mb-1">
              Refill Frequency Control
            </h5>
            <p className="tw-text-xs tw-text-amber-600 tw-m-0">
              Control how many times a vehicle can refuel within specific time
              periods. Set to 0 to disable frequency restrictions for that
              period.
            </p>
          </div>
        </div>
      </div>

      <Form
        key={`refill-count-${formData.ruleId ?? "new"}-${
          formData.ruleSetId ?? "unset"
        }`}
        formData={formData}
        labelLocation="top"
        showColonAfterLabel={true}
        onFieldDataChanged={(e) => {
          if (e.dataField) {
            onFieldChange("refillCount", e.dataField, e.value);
          }
        }}
      >
        <SimpleItem
          dataField="ruleName"
          label={{ text: "Rule Name" }}
          editorOptions={{
            placeholder: "e.g., Standard Refill Frequency",
          }}
          isRequired={true}
          validationError={validationErrors.refillCountRuleName}
        />

        <GroupItem caption="Refill Frequency Limits" cssClass="tw-mb-3">
          <SimpleItem
            dataField="maxRefillsPerDay"
            label={{ text: "Maximum Refills Per Day" }}
            editorType="dxNumberBox"
            editorOptions={{
              min: 0,
              showSpinButtons: true,
              placeholder: "Number of refills per day",
            }}
            validationError={validationErrors.maxRefillsPerDay}
            helpText="How many times vehicle can refuel in one day"
          />

          <SimpleItem
            dataField="maxRefillsPerWeek"
            label={{ text: "Maximum Refills Per Week" }}
            editorType="dxNumberBox"
            editorOptions={{
              min: 0,
              showSpinButtons: true,
              placeholder: "Number of refills per week",
            }}
            validationError={validationErrors.maxRefillsPerWeek}
            helpText="Weekly refueling frequency limit (Monday-Sunday)"
          />

          <SimpleItem
            dataField="maxRefillsPerMonth"
            label={{ text: "Maximum Refills Per Month" }}
            editorType="dxNumberBox"
            editorOptions={{
              min: 0,
              showSpinButtons: true,
              placeholder: "Number of refills per month",
            }}
            validationError={validationErrors.maxRefillsPerMonth}
            helpText="Monthly refueling frequency limit (calendar month)"
          />
        </GroupItem>
      </Form>

      {/* Native Toggle for Rule Status - outside Form to avoid infinite loop */}
      <div className="tw-mt-4 tw-pt-4 tw-border-t tw-border-gray-200">
        <label className="tw-flex tw-items-center tw-justify-between tw-cursor-pointer">
          <span className="tw-text-sm tw-font-medium tw-text-gray-700">
            Rule Status
          </span>
          <div className="tw-relative">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                onFieldChange("refillCount", "isActive", e.target.checked)
              }
              className="tw-sr-only"
            />
            <div
              className={`tw-w-11 tw-h-6 tw-rounded-full tw-transition-colors ${
                formData.isActive ? "tw-bg-blue-500" : "tw-bg-gray-300"
              }`}
            ></div>
            <div
              className={`tw-absolute tw-top-0.5 tw-left-0.5 tw-w-5 tw-h-5 tw-bg-white tw-rounded-full tw-shadow tw-transition-transform ${
                formData.isActive ? "tw-translate-x-5" : "tw-translate-x-0"
              }`}
            ></div>
          </div>
        </label>
        <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
          {formData.isActive
            ? "Rule is active and will be enforced"
            : "Rule is inactive and will be ignored"}
        </p>
      </div>
    </div>
  );
};

const TimeWindowForm = ({ formData, onFieldChange, validationErrors }) => {
  const formRef = useRef(null);

  useEffect(() => {
    return () => {
      if (formRef.current) {
        formRef.current = null;
      }
    };
  }, []);

  return (
    <div className="rule-form-wrapper" ref={formRef}>
      <div className="rule-form-info tw-bg-purple-50 tw-border tw-border-purple-200 tw-rounded-lg tw-p-3 tw-mb-4">
        <div className="tw-flex tw-items-start tw-gap-2">
          <span className="tw-text-purple-500 tw-text-lg tw-mt-1">
            <i className="fa-light fa-info-circle"></i>
          </span>
          <div>
            <h5 className="tw-text-sm tw-font-semibold tw-text-purple-700 tw-m-0 tw-mb-1">
              Time Window Restrictions
            </h5>
            <p className="tw-text-xs tw-text-purple-600 tw-m-0">
              Restrict fueling to specific hours and days of the week. Vehicles
              can only refuel during the allowed time windows on selected days.
            </p>
          </div>
        </div>
      </div>

      <Form
        key={`time-window-${formData.ruleId ?? "new"}-${
          formData.ruleSetId ?? "unset"
        }`}
        formData={formData}
        labelLocation="top"
        showColonAfterLabel={true}
        onFieldDataChanged={(e) => {
          if (e.dataField) {
            onFieldChange("timeWindow", e.dataField, e.value);
          }
        }}
      >
        <SimpleItem
          dataField="ruleName"
          label={{ text: "Rule Name" }}
          editorOptions={{
            placeholder: "e.g., Business Hours Only",
          }}
          isRequired={true}
          validationError={validationErrors.timeWindowRuleName}
        />

        <GroupItem
          caption="Operating Hours"
          cssClass="time-range-group tw-mb-3"
        >
          <SimpleItem
            dataField="startTime"
            label={{ text: "Start Time" }}
            editorType="dxDateBox"
            editorOptions={{
              type: "time",
              pickerType: "calendar",
              placeholder: "Select start time",
            }}
            helpText="Fueling starts from this time"
          />

          <SimpleItem
            dataField="endTime"
            label={{ text: "End Time" }}
            editorType="dxDateBox"
            editorOptions={{
              type: "time",
              pickerType: "calendar",
              placeholder: "Select end time",
            }}
            helpText="Fueling ends at this time"
          />
        </GroupItem>

        <SimpleItem
          dataField="allowedDays"
          label={{ text: "Allowed Days of Week" }}
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
            placeholder: "Select allowed days",
          }}
          validationError={validationErrors.allowedDays}
          helpText="Select all days when fueling is allowed"
        />
      </Form>

      {/* Native Toggle for Rule Status - outside Form to avoid infinite loop */}
      <div className="tw-mt-4 tw-pt-4 tw-border-t tw-border-gray-200">
        <label className="tw-flex tw-items-center tw-justify-between tw-cursor-pointer">
          <span className="tw-text-sm tw-font-medium tw-text-gray-700">
            Rule Status
          </span>
          <div className="tw-relative">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                onFieldChange("timeWindow", "isActive", e.target.checked)
              }
              className="tw-sr-only"
            />
            <div
              className={`tw-w-11 tw-h-6 tw-rounded-full tw-transition-colors ${
                formData.isActive ? "tw-bg-blue-500" : "tw-bg-gray-300"
              }`}
            ></div>
            <div
              className={`tw-absolute tw-top-0.5 tw-left-0.5 tw-w-5 tw-h-5 tw-bg-white tw-rounded-full tw-shadow tw-transition-transform ${
                formData.isActive ? "tw-translate-x-5" : "tw-translate-x-0"
              }`}
            ></div>
          </div>
        </label>
        <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
          {formData.isActive
            ? "Rule is active and will be enforced"
            : "Rule is inactive and will be ignored"}
        </p>
      </div>
    </div>
  );
};

// Helper function to convert time string to Date object
const timeStringToDate = (timeString) => {
  if (!timeString) return new Date();
  const [hours, minutes] = timeString.split(":").map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
};

// Helper function to convert Date object to time string (TimeSpan format with seconds)
const dateToTimeString = (date) => {
  if (!date || !(date instanceof Date)) return "00:00:00";
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}:00`; // Include seconds for TimeSpan format
};

const RuleDetailForm = ({
  isVisible,
  onClose,
  onDataChanged,
  ruleSet,
  rule,
  editMode,
}) => {
  const dispatch = useDispatch();

  const [selectedRuleType, setSelectedRuleType] = useState(
    "DailyMonthlyLimitRule"
  );
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(false);

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
    maxRefillsPerDay: 2,
    maxRefillsPerWeek: 10,
    maxRefillsPerMonth: 30,
    isActive: true,
  });

  // Time window form data
  const [timeWindowFormData, setTimeWindowFormData] = useState({
    ruleSetId: null,
    ruleId: null,
    ruleName: "",
    startTime: timeStringToDate("07:00"),
    endTime: timeStringToDate("18:00"),
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
        // Helper to normalize discriminator - handles both DB values and frontend values
        const normalizeDiscriminator = (disc) => {
          if (!disc) return null;
          const d = disc.toLowerCase();
          if (d.includes("dailymonthly") || d.includes("daily"))
            return "DailyMonthlyLimit";
          if (d.includes("refill") || d.includes("noof")) return "NoOfRefill";
          if (d.includes("time") || d.includes("window")) return "TimeWindow";
          return disc;
        };

        const normalizedType = normalizeDiscriminator(rule.discriminator);

        // Determine rule type and populate the correct form
        if (normalizedType === "DailyMonthlyLimit") {
          setSelectedRuleType("DailyMonthlyLimitRule");
          setDailyMonthlyFormData({
            ruleSetId: ruleSet.id,
            ruleId: rule.id,
            ruleName: rule.ruleName || "",
            dailyLimit: rule.dailyLimitLiter || rule.dailyLimit || 50,
            monthlyLimit: rule.monthlyLimitLiter || rule.monthlyLimit || 500,
            fuelingLimit: rule.fuelingLimit || 100,
            isActive: rule.isActive !== false,
          });
        } else if (normalizedType === "NoOfRefill") {
          setSelectedRuleType("NoOfRefillRule");
          setRefillCountFormData({
            ruleSetId: ruleSet.id,
            ruleId: rule.id,
            ruleName: rule.ruleName || "",
            maxRefillsPerDay: rule.maxRefillsPerDay || 2,
            maxRefillsPerWeek: rule.maxRefillsPerWeek || 10,
            maxRefillsPerMonth: rule.maxRefillsPerMonth || 30,
            isActive: rule.isActive !== false,
          });
        } else if (normalizedType === "TimeWindow") {
          setSelectedRuleType("TimeWindowRule");
          setTimeWindowFormData({
            ruleSetId: ruleSet.id,
            ruleId: rule.id,
            ruleName: rule.ruleName || "",
            startTime: timeStringToDate(rule.startTime || "07:00"),
            endTime: timeStringToDate(rule.endTime || "18:00"),
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

  const handleRuleTypeChange = async (newType) => {
    if (newType && newType !== selectedRuleType) {
      // Set transitioning state to prevent DOM manipulation issues
      setIsTransitioning(true);

      // Clear validation errors
      setValidationErrors({});

      // Use setTimeout to ensure DOM cleanup happens before rendering new form
      await new Promise((resolve) => setTimeout(resolve, 0));

      setSelectedRuleType(newType);
      setIsTransitioning(false);
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
      if (refillCountFormData.maxRefillsPerDay < 0) {
        errors.maxRefillsPerDay = "Daily refill count cannot be negative";
      }
      if (refillCountFormData.maxRefillsPerWeek < 0) {
        errors.maxRefillsPerWeek = "Weekly refill count cannot be negative";
      }
      if (refillCountFormData.maxRefillsPerMonth < 0) {
        errors.maxRefillsPerMonth = "Monthly refill count cannot be negative";
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
              dailyLimitLiter: dailyMonthlyFormData.dailyLimit,
              monthlyLimitLiter: dailyMonthlyFormData.monthlyLimit,
              fuelingLimit: dailyMonthlyFormData.fuelingLimit,
              isActive: dailyMonthlyFormData.isActive,
            })
          );
        } else {
          result = await dispatch(
            createDailyMonthlyRule(ruleSet.id, {
              ruleSetId: ruleSet.id,
              ruleName: dailyMonthlyFormData.ruleName,
              dailyLimitLiter: dailyMonthlyFormData.dailyLimit,
              monthlyLimitLiter: dailyMonthlyFormData.monthlyLimit,
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
              maxRefillsPerDay: refillCountFormData.maxRefillsPerDay,
              maxRefillsPerWeek: refillCountFormData.maxRefillsPerWeek,
              maxRefillsPerMonth: refillCountFormData.maxRefillsPerMonth,
              isActive: refillCountFormData.isActive,
            })
          );
        } else {
          result = await dispatch(
            createRefillCountRule(ruleSet.id, {
              ruleSetId: ruleSet.id,
              ruleName: refillCountFormData.ruleName,
              maxRefillsPerDay: refillCountFormData.maxRefillsPerDay,
              maxRefillsPerWeek: refillCountFormData.maxRefillsPerWeek,
              maxRefillsPerMonth: refillCountFormData.maxRefillsPerMonth,
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
              RuleId: timeWindowFormData.ruleId,
              RuleName: timeWindowFormData.ruleName,
              StartTime: dateToTimeString(timeWindowFormData.startTime),
              EndTime: dateToTimeString(timeWindowFormData.endTime),
              IsActive: timeWindowFormData.isActive,
            })
          );
        } else {
          result = await dispatch(
            createTimeWindowRule(ruleSet.id, {
              RuleSetId: ruleSet.id,
              RuleName: timeWindowFormData.ruleName,
              StartTime: dateToTimeString(timeWindowFormData.startTime),
              EndTime: dateToTimeString(timeWindowFormData.endTime),
              IsActive: timeWindowFormData.isActive,
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
        // Trigger data refresh before closing
        if (onDataChanged) {
          onDataChanged();
        }
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

    // Helper to normalize discriminator
    const normalizeDiscriminator = (disc) => {
      if (!disc) return null;
      const d = disc.toLowerCase();
      if (d.includes("dailymonthly") || d.includes("daily"))
        return "DailyMonthlyLimit";
      if (d.includes("refill") || d.includes("noof")) return "NoOfRefill";
      if (d.includes("time") || d.includes("window")) return "TimeWindow";
      return disc;
    };

    const normalizedType = normalizeDiscriminator(rule.discriminator);

    setLoading(true);
    try {
      let result;

      if (normalizedType === "DailyMonthlyLimit") {
        result = await dispatch(deleteDailyMonthlyRule(rule.id));
      } else if (normalizedType === "NoOfRefill") {
        result = await dispatch(deleteRefillCountRule(rule.id));
      } else if (normalizedType === "TimeWindow") {
        result = await dispatch(deleteTimeWindowRule(rule.id));
      } else {
        throw new Error(`Unknown rule type: ${rule.discriminator}`);
      }

      if (result && result.success) {
        notify("Rule deleted successfully", "success", 2000);
        // Trigger data refresh before closing
        if (onDataChanged) {
          onDataChanged();
        }
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

  return (
    <Popup
      visible={isVisible}
      onHiding={onClose}
      title={`${editMode === "add" ? "Add" : "Edit"} Rule for "${
        ruleSet?.name || "Rule Set"
      }"`}
      showCloseButton={true}
      width={600}
      height="auto"
      maxHeight="90vh"
      className="rule-detail-form-popup"
    >
      <div className="rule-detail-form-container">
        {editMode === "add" && (
          <div className="rule-type-selector tw-mb-4">
            <label className="tw-block tw-mb-3 tw-font-semibold tw-text-gray-700">
              Select Rule Type:
            </label>
            <div className="rule-type-cards tw-grid tw-grid-cols-1 tw-gap-3">
              {RULE_TYPES.map((ruleType) => (
                <div
                  key={ruleType.id}
                  className={`rule-type-card tw-p-3 tw-border-2 tw-rounded-lg tw-cursor-pointer tw-transition-all ${
                    selectedRuleType === ruleType.id
                      ? "tw-border-blue-500 tw-bg-blue-50"
                      : "tw-border-gray-200 tw-bg-white hover:tw-border-gray-300"
                  }`}
                  onClick={() => handleRuleTypeChange(ruleType.id)}
                >
                  <div className="tw-flex tw-items-start tw-gap-3">
                    <div
                      className={`tw-flex-shrink-0 tw-w-10 tw-h-10 tw-rounded-full tw-flex tw-items-center tw-justify-center ${
                        selectedRuleType === ruleType.id
                          ? "tw-bg-blue-500 tw-text-white"
                          : "tw-bg-gray-100 tw-text-gray-600"
                      }`}
                    >
                      <span key={`icon-${ruleType.id}-${selectedRuleType}`}>
                        <i className={`${ruleType.icon} tw-text-lg`}></i>
                      </span>
                    </div>
                    <div className="tw-flex-1">
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <h4
                          className={`tw-text-sm tw-font-semibold tw-m-0 ${
                            selectedRuleType === ruleType.id
                              ? "tw-text-blue-700"
                              : "tw-text-gray-800"
                          }`}
                        >
                          {ruleType.name}
                        </h4>
                        {selectedRuleType === ruleType.id && (
                          <span key={`check-${ruleType.id}`}>
                            <i className="fa-light fa-check-circle tw-text-blue-500"></i>
                          </span>
                        )}
                      </div>
                      <p className="tw-text-xs tw-text-gray-600 tw-m-0 tw-mt-1">
                        {ruleType.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Divider between rule type selector and form */}
        {editMode === "add" && (
          <div className="tw-border-t tw-border-gray-200 tw-my-4"></div>
        )}

        {/* Use a keyed container to force full re-render on type change */}
        {!isTransitioning && (
          <div className="rule-form" key={`form-container-${selectedRuleType}`}>
            {/* Section Header for Rule Configuration */}
            {editMode === "add" && (
              <h4 className="tw-text-base tw-font-semibold tw-text-gray-700 tw-mb-3 tw-flex tw-items-center tw-gap-2">
                <span>
                  <i className="fa-light fa-cog tw-text-gray-500"></i>
                </span>
                Rule Configuration
              </h4>
            )}
            {selectedRuleType === "DailyMonthlyLimitRule" && (
              <DailyMonthlyForm
                formData={dailyMonthlyFormData}
                onFieldChange={handleFieldChange}
                validationErrors={validationErrors}
              />
            )}
            {selectedRuleType === "NoOfRefillRule" && (
              <RefillCountForm
                formData={refillCountFormData}
                onFieldChange={handleFieldChange}
                validationErrors={validationErrors}
              />
            )}
            {selectedRuleType === "TimeWindowRule" && (
              <TimeWindowForm
                formData={timeWindowFormData}
                onFieldChange={handleFieldChange}
                validationErrors={validationErrors}
              />
            )}
          </div>
        )}

        <div className="tw-flex tw-justify-between tw-items-center tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
          <div>
            {editMode === "edit" && (
              <Button
                text="Delete"
                stylingMode="outlined"
                type="danger"
                onClick={handleDelete}
                disabled={loading}
              />
            )}
          </div>
          <div className="tw-flex tw-gap-2">
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
              disabled={loading || isTransitioning}
            />
          </div>
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
