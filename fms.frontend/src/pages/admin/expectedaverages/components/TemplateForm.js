import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { SelectBox } from "devextreme-react/select-box";
import { NumberBox } from "devextreme-react/number-box";
import { TextBox } from "devextreme-react/text-box";
import { TextArea } from "devextreme-react/text-area";
import { Switch } from "devextreme-react/switch";
import { Button } from "devextreme-react/button";
import notify from "devextreme/ui/notify";

import {
  createTemplate,
  updateTemplate,
  fetchReferenceData,
} from "../../../../redux/slices/expectedFuelAverageSlice";
import { fetchVehicleTypes } from "../../../../redux/actions/vehicleTypeActions";
import { fetchVehicleManufacturers } from "../../../../redux/actions/vehicleManufacturerActions";
import { fetchVehicleModels } from "../../../../redux/actions/vehicleModelActions";
import { fetchSiteList } from "../../../../redux/actions/siteActions";

/**
 * Template Form Component
 * Form for creating and editing expected fuel average templates
 */
const TemplateForm = ({ template, onSave, onCancel }) => {
  const dispatch = useDispatch();

  // Redux state
  const { routes, loadClassifications, usageIntensities } = useSelector(
    (state) => state.expectedFuelAverage
  );

  const vehicleTypes = useSelector(
    (state) => state.vehicleType?.vehicleTypes || []
  );
  const manufacturers = useSelector(
    (state) => state.vehicleManufacturer?.manufacturers || []
  );
  const models = useSelector(
    (state) => state.vehicleModel?.vehicleModels || []
  );
  const sites = useSelector((state) => state.site?.sites || []);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    vehicleTypeId: null,
    vehicleManufacturerId: null,
    vehicleModelId: null,
    yearOfManufacture: "",
    siteId: null,
    fuelRouteId: null,
    loadClassificationId: null,
    usageIntensityId: null,
    isKmPerLiter: true,
    expectedValue: 0,
    minThreshold: null,
    maxThreshold: null,
    tolerancePercent: 10,
    priority: 0,
    isActive: true,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Load reference data on mount
  useEffect(() => {
    if (!vehicleTypes.length) dispatch(fetchVehicleTypes());
    if (!manufacturers.length) dispatch(fetchVehicleManufacturers());
    if (!models.length) dispatch(fetchVehicleModels());
    if (!sites.length) dispatch(fetchSiteList());
    // Load routes, load classifications, usage intensities
    if (
      !routes.length ||
      !loadClassifications.length ||
      !usageIntensities.length
    ) {
      dispatch(fetchReferenceData());
    }
  }, [dispatch]);

  // Initialize form data when template changes
  useEffect(() => {
    if (template) {
      setFormData({
        ...template,
        // Ensure numeric values are numbers
        expectedValue: Number(template.expectedValue),
        minThreshold: template.minThreshold
          ? Number(template.minThreshold)
          : null,
        maxThreshold: template.maxThreshold
          ? Number(template.maxThreshold)
          : null,
        tolerancePercent: Number(template.tolerancePercent),
        priority: Number(template.priority),
      });
    } else {
      // Reset form for new template
      setFormData({
        name: "",
        description: "",
        vehicleTypeId: null,
        vehicleManufacturerId: null,
        vehicleModelId: null,
        yearOfManufacture: "",
        siteId: null,
        fuelRouteId: null,
        loadClassificationId: null,
        usageIntensityId: null,
        isKmPerLiter: true,
        expectedValue: 0,
        minThreshold: null,
        maxThreshold: null,
        tolerancePercent: 10,
        priority: 0,
        isActive: true,
      });
    }
  }, [template]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name) {
      notify("Template name is required", "warning", 3000);
      return false;
    }
    if (!formData.expectedValue || formData.expectedValue <= 0) {
      notify("Expected value must be greater than 0", "warning", 3000);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      let result;
      if (template?.id) {
        result = await dispatch(
          updateTemplate({ id: template.id, data: formData })
        ).unwrap();
      } else {
        result = await dispatch(createTemplate(formData)).unwrap();
      }

      notify("Template saved successfully", "success", 3000);
      if (onSave) onSave(result);
    } catch (error) {
      console.error("Error saving template:", error);
      notify(error || "Failed to save template", "error", 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter models based on selected manufacturer
  const filteredModels = formData.vehicleManufacturerId
    ? models.filter((m) => m.manufacturerId === formData.vehicleManufacturerId)
    : models;

  return (
    <div className="template-form tw-p-4">
      <div className="tw-mb-6">
        <h3 className="tw-text-lg tw-font-semibold tw-mb-4">
          Basic Information
        </h3>
        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
          <div className="tw-col-span-2">
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Template Name *
            </label>
            <TextBox
              value={formData.name}
              onValueChanged={(e) => handleFieldChange("name", e.value)}
              placeholder="e.g., Actros 3340 - Highway - 30t"
              disabled={isLoading}
            />
          </div>

          <div className="tw-col-span-2">
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Description
            </label>
            <TextArea
              value={formData.description}
              onValueChanged={(e) => handleFieldChange("description", e.value)}
              height={60}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Active
            </label>
            <Switch
              value={formData.isActive}
              onValueChanged={(e) => handleFieldChange("isActive", e.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Priority (Higher overrides)
            </label>
            <NumberBox
              value={formData.priority}
              onValueChanged={(e) => handleFieldChange("priority", e.value)}
              min={0}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="tw-mb-6">
        <h3 className="tw-text-lg tw-font-semibold tw-mb-4">
          Vehicle Criteria
        </h3>
        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Vehicle Type
            </label>
            <SelectBox
              dataSource={vehicleTypes}
              valueExpr="id"
              displayExpr="name"
              value={formData.vehicleTypeId}
              onValueChanged={(e) =>
                handleFieldChange("vehicleTypeId", e.value)
              }
              showClearButton={true}
              searchEnabled={true}
              searchMode="contains"
              searchExpr="name"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Manufacturer
            </label>
            <SelectBox
              dataSource={manufacturers}
              valueExpr="id"
              displayExpr="name"
              value={formData.vehicleManufacturerId}
              onValueChanged={(e) => {
                handleFieldChange("vehicleManufacturerId", e.value);
                handleFieldChange("vehicleModelId", null);
              }}
              showClearButton={true}
              searchEnabled={true}
              searchMode="contains"
              searchExpr="name"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Model
            </label>
            <SelectBox
              dataSource={filteredModels}
              valueExpr="id"
              displayExpr="name"
              value={formData.vehicleModelId}
              onValueChanged={(e) =>
                handleFieldChange("vehicleModelId", e.value)
              }
              showClearButton={true}
              searchEnabled={true}
              searchMode="contains"
              searchExpr="name"
              disabled={isLoading || !formData.vehicleManufacturerId}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Year of Manufacture
            </label>
            <TextBox
              value={formData.yearOfManufacture}
              onValueChanged={(e) =>
                handleFieldChange("yearOfManufacture", e.value)
              }
              placeholder="YYYY"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="tw-mb-6">
        <h3 className="tw-text-lg tw-font-semibold tw-mb-4">
          Operational Context
        </h3>
        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Site
            </label>
            <SelectBox
              dataSource={sites}
              valueExpr="id"
              displayExpr="name"
              value={formData.siteId}
              onValueChanged={(e) => handleFieldChange("siteId", e.value)}
              showClearButton={true}
              searchEnabled={true}
              searchMode="contains"
              searchExpr="name"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Route
            </label>
            <SelectBox
              dataSource={routes}
              valueExpr="id"
              displayExpr="name"
              value={formData.fuelRouteId}
              onValueChanged={(e) => handleFieldChange("fuelRouteId", e.value)}
              showClearButton={true}
              searchEnabled={true}
              searchMode="contains"
              searchExpr="name"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Load Classification
            </label>
            <SelectBox
              dataSource={loadClassifications}
              valueExpr="id"
              displayExpr="name"
              value={formData.loadClassificationId}
              onValueChanged={(e) =>
                handleFieldChange("loadClassificationId", e.value)
              }
              showClearButton={true}
              searchEnabled={true}
              searchMode="contains"
              searchExpr="name"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Usage Intensity
            </label>
            <SelectBox
              dataSource={usageIntensities}
              valueExpr="id"
              displayExpr="name"
              value={formData.usageIntensityId}
              onValueChanged={(e) =>
                handleFieldChange("usageIntensityId", e.value)
              }
              showClearButton={true}
              searchEnabled={true}
              searchMode="contains"
              searchExpr="name"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="tw-mb-6">
        <h3 className="tw-text-lg tw-font-semibold tw-mb-4">
          Fuel Consumption Targets
        </h3>
        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
          <div className="tw-col-span-2">
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Measurement Unit
            </label>
            <div className="tw-flex tw-items-center">
              <span
                className={`tw-mr-2 ${
                  !formData.isKmPerLiter ? "tw-font-bold" : ""
                }`}
              >
                L/hr
              </span>
              <Switch
                value={formData.isKmPerLiter}
                onValueChanged={(e) =>
                  handleFieldChange("isKmPerLiter", e.value)
                }
                disabled={isLoading}
              />
              <span
                className={`tw-ml-2 ${
                  formData.isKmPerLiter ? "tw-font-bold" : ""
                }`}
              >
                km/L
              </span>
            </div>
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Expected Value ({formData.isKmPerLiter ? "km/L" : "L/hr"}) *
            </label>
            <NumberBox
              value={formData.expectedValue}
              onValueChanged={(e) =>
                handleFieldChange("expectedValue", e.value)
              }
              format="#0.00"
              min={0}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Tolerance (%)
            </label>
            <NumberBox
              value={formData.tolerancePercent}
              onValueChanged={(e) =>
                handleFieldChange("tolerancePercent", e.value)
              }
              format="#0.00"
              min={0}
              max={100}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Min Threshold (Absolute)
            </label>
            <NumberBox
              value={formData.minThreshold}
              onValueChanged={(e) => handleFieldChange("minThreshold", e.value)}
              format="#0.00"
              min={0}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Max Threshold (Absolute)
            </label>
            <NumberBox
              value={formData.maxThreshold}
              onValueChanged={(e) => handleFieldChange("maxThreshold", e.value)}
              format="#0.00"
              min={0}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
        <Button
          text="Cancel"
          stylingMode="outlined"
          onClick={onCancel}
          disabled={isLoading}
        />
        <Button
          text="Save Template"
          type="default"
          stylingMode="contained"
          onClick={handleSubmit}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default TemplateForm;
