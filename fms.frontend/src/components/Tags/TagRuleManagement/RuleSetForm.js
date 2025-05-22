import React, { useState, useEffect } from "react";
import { Popup } from "devextreme-react/popup";
import { Form, SimpleItem } from "devextreme-react/form";
import { Button } from "devextreme-react/button";
import { TextArea } from "devextreme-react/text-area";
import { LoadPanel } from "devextreme-react/load-panel";
import notify from "devextreme/ui/notify";
import "./TagRuleManagement.scss";

const RuleSetForm = ({ isVisible, onClose, onSave, ruleSet, editMode }) => {
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (ruleSet && editMode === "edit") {
      setFormData({
        id: ruleSet.id,
        name: ruleSet.name || "",
        description: ruleSet.description || "",
      });
    } else {
      // Reset form for new rule set
      setFormData({
        name: "",
        description: "",
      });
    }
  }, [ruleSet, editMode]);

  const handleFieldChange = (fieldName, value) => {
    setFormData({ ...formData, [fieldName]: value });

    // Clear validation error for this field if it exists
    if (validationErrors[fieldName]) {
      const newErrors = { ...validationErrors };
      delete newErrors[fieldName];
      setValidationErrors(newErrors);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name || formData.name.trim() === "") {
      errors.name = "Rule set name is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      notify("Please correct the errors before submitting", "error", 3000);
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving rule set:", error);
      notify("An unexpected error occurred", "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popup
      visible={isVisible}
      onHiding={onClose}
      title={editMode === "add" ? "Add Rule Set" : "Edit Rule Set"}
      showCloseButton={true}
      width={500}
      height={400}
      className="rule-set-form-popup"
    >
      <div className="rule-set-form-container">
        <Form
          formData={formData}
          labelLocation="top"
          showColonAfterLabel={true}
          validationGroup="ruleSetForm"
        >
          <SimpleItem
            dataField="name"
            label={{ text: "Rule Set Name" }}
            editorOptions={{
              placeholder: "Enter rule set name",
              onValueChanged: (e) => handleFieldChange("name", e.value),
            }}
            isRequired={true}
            validationError={validationErrors.name}
          />

          <SimpleItem
            dataField="description"
            label={{ text: "Description" }}
            editorType="dxTextArea"
            editorOptions={{
              placeholder: "Enter description",
              height: 100,
              onValueChanged: (e) => handleFieldChange("description", e.value),
            }}
          />
        </Form>

        <div className="form-info">
          <p className="info-text">
            {editMode === "add"
              ? "After creating the rule set, you can add specific rules to it."
              : "You can modify the rule set details here. To manage rules, return to the main view."}
          </p>
        </div>

        <div className="form-actions">
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
        message="Saving..."
      />
    </Popup>
  );
};

export default RuleSetForm;
