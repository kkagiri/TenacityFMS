import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Form, {
  SimpleItem,
  GroupItem,
  Label
} from 'devextreme-react/form';
import { SelectBox } from 'devextreme-react/select-box';
import { NumberBox } from 'devextreme-react/number-box';
import { TextBox } from 'devextreme-react/text-box';
import { TextArea } from 'devextreme-react/text-area';
import { Switch } from 'devextreme-react/switch';
import { Button } from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';

import { createTemplate, updateTemplate } from '../../../../redux/slices/expectedFuelAverageSlice';
import { fetchVehicleTypes } from '../../../../redux/actions/vehicleTypeActions';
import { fetchVehicleManufacturers } from '../../../../redux/actions/vehicleManufacturerActions';
import { fetchVehicleModels } from '../../../../redux/actions/vehicleModelActions';
import { fetchSiteList } from '../../../../redux/actions/siteActions';

/**
 * Template Form Component
 * Form for creating and editing expected fuel average templates
 */
const TemplateForm = ({
  template,
  onSave,
  onCancel
}) => {
  const dispatch = useDispatch();

  // Redux state
  const {
    routes,
    loadClassifications,
    usageIntensities
  } = useSelector(state => state.expectedFuelAverage);

  const vehicleTypes = useSelector(state => state.vehicleType?.vehicleTypes || []);
  const manufacturers = useSelector(state => state.vehicleManufacturer?.manufacturers || []);
  const models = useSelector(state => state.vehicleModel?.vehicleModels || []);
  const sites = useSelector(state => state.site?.sites || []);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    vehicleTypeId: null,
    vehicleManufacturerId: null,
    vehicleModelId: null,
    yearOfManufacture: '',
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
    isActive: true
  });

  const [isLoading, setIsLoading] = useState(false);

  // Load reference data on mount
  useEffect(() => {
    if (!vehicleTypes.length) dispatch(fetchVehicleTypes());
    if (!manufacturers.length) dispatch(fetchVehicleManufacturers());
    if (!models.length) dispatch(fetchVehicleModels());
    if (!sites.length) dispatch(fetchSiteList());
  }, [dispatch]);

  // Initialize form data when template changes
  useEffect(() => {
    if (template) {
      setFormData({
        ...template,
        // Ensure numeric values are numbers
        expectedValue: Number(template.expectedValue),
        minThreshold: template.minThreshold ? Number(template.minThreshold) : null,
        maxThreshold: template.maxThreshold ? Number(template.maxThreshold) : null,
        tolerancePercent: Number(template.tolerancePercent),
        priority: Number(template.priority)
      });
    } else {
      // Reset form for new template
      setFormData({
        name: '',
        description: '',
        vehicleTypeId: null,
        vehicleManufacturerId: null,
        vehicleModelId: null,
        yearOfManufacture: '',
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
        isActive: true
      });
    }
  }, [template]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name) {
      notify('Template name is required', 'warning', 3000);
      return false;
    }
    if (!formData.expectedValue || formData.expectedValue <= 0) {
      notify('Expected value must be greater than 0', 'warning', 3000);
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
        result = await dispatch(updateTemplate({ id: template.id, data: formData })).unwrap();
      } else {
        result = await dispatch(createTemplate(formData)).unwrap();
      }

      notify('Template saved successfully', 'success', 3000);
      if (onSave) onSave(result);
    } catch (error) {
      console.error('Error saving template:', error);
      notify(error || 'Failed to save template', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter models based on selected manufacturer
  const filteredModels = formData.vehicleManufacturerId
    ? models.filter(m => m.manufacturerId === formData.vehicleManufacturerId)
    : models;

  return (
    <div className="template-form tw-p-4">
      <Form formData={formData} readOnly={isLoading}>
        <GroupItem caption="Basic Information" colCount={2}>
          <SimpleItem colSpan={2}>
            <TextBox
              value={formData.name}
              onValueChanged={(e) => handleFieldChange('name', e.value)}
              placeholder="e.g., Actros 3340 - Highway - 30t"
            />
            <Label text="Template Name *" />
          </SimpleItem>

          <SimpleItem colSpan={2}>
            <TextArea
              value={formData.description}
              onValueChanged={(e) => handleFieldChange('description', e.value)}
              height={60}
            />
            <Label text="Description" />
          </SimpleItem>

          <SimpleItem>
            <Switch
              value={formData.isActive}
              onValueChanged={(e) => handleFieldChange('isActive', e.value)}
            />
            <Label text="Active" />
          </SimpleItem>

          <SimpleItem>
            <NumberBox
              value={formData.priority}
              onValueChanged={(e) => handleFieldChange('priority', e.value)}
              min={0}
            />
            <Label text="Priority (Higher overrides)" />
          </SimpleItem>
        </GroupItem>

        <GroupItem caption="Vehicle Criteria" colCount={2}>
          <SimpleItem>
            <SelectBox
              dataSource={vehicleTypes}
              valueExpr="id"
              displayExpr="name"
              value={formData.vehicleTypeId}
              onValueChanged={(e) => handleFieldChange('vehicleTypeId', e.value)}
              showClearButton={true}
            />
            <Label text="Vehicle Type" />
          </SimpleItem>

          <SimpleItem>
            <SelectBox
              dataSource={manufacturers}
              valueExpr="id"
              displayExpr="name"
              value={formData.vehicleManufacturerId}
              onValueChanged={(e) => {
                handleFieldChange('vehicleManufacturerId', e.value);
                handleFieldChange('vehicleModelId', null); // Reset model
              }}
              showClearButton={true}
            />
            <Label text="Manufacturer" />
          </SimpleItem>

          <SimpleItem>
            <SelectBox
              dataSource={filteredModels}
              valueExpr="id"
              displayExpr="name"
              value={formData.vehicleModelId}
              onValueChanged={(e) => handleFieldChange('vehicleModelId', e.value)}
              showClearButton={true}
              disabled={!formData.vehicleManufacturerId}
            />
            <Label text="Model" />
          </SimpleItem>

          <SimpleItem>
            <TextBox
              value={formData.yearOfManufacture}
              onValueChanged={(e) => handleFieldChange('yearOfManufacture', e.value)}
              placeholder="YYYY"
            />
            <Label text="Year of Manufacture" />
          </SimpleItem>
        </GroupItem>

        <GroupItem caption="Operational Context" colCount={2}>
          <SimpleItem>
            <SelectBox
              dataSource={sites}
              valueExpr="id"
              displayExpr="name"
              value={formData.siteId}
              onValueChanged={(e) => handleFieldChange('siteId', e.value)}
              showClearButton={true}
            />
            <Label text="Site" />
          </SimpleItem>

          <SimpleItem>
            <SelectBox
              dataSource={routes}
              valueExpr="id"
              displayExpr="name"
              value={formData.fuelRouteId}
              onValueChanged={(e) => handleFieldChange('fuelRouteId', e.value)}
              showClearButton={true}
            />
            <Label text="Route" />
          </SimpleItem>

          <SimpleItem>
            <SelectBox
              dataSource={loadClassifications}
              valueExpr="id"
              displayExpr="name"
              value={formData.loadClassificationId}
              onValueChanged={(e) => handleFieldChange('loadClassificationId', e.value)}
              showClearButton={true}
            />
            <Label text="Load Classification" />
          </SimpleItem>

          <SimpleItem>
            <SelectBox
              dataSource={usageIntensities}
              valueExpr="id"
              displayExpr="name"
              value={formData.usageIntensityId}
              onValueChanged={(e) => handleFieldChange('usageIntensityId', e.value)}
              showClearButton={true}
            />
            <Label text="Usage Intensity" />
          </SimpleItem>
        </GroupItem>

        <GroupItem caption="Fuel Consumption Targets" colCount={2}>
          <SimpleItem colSpan={2}>
            <div className="tw-flex tw-items-center tw-mb-2">
              <span className={`tw-mr-2 ${formData.isKmPerLiter ? 'tw-font-bold' : ''}`}>L/hr</span>
              <Switch
                value={formData.isKmPerLiter}
                onValueChanged={(e) => handleFieldChange('isKmPerLiter', e.value)}
              />
              <span className={`tw-ml-2 ${formData.isKmPerLiter ? 'tw-font-bold' : ''}`}>km/L</span>
            </div>
            <Label text="Measurement Unit" />
          </SimpleItem>

          <SimpleItem>
            <NumberBox
              value={formData.expectedValue}
              onValueChanged={(e) => handleFieldChange('expectedValue', e.value)}
              format="#0.00"
              min={0}
            />
            <Label text={`Expected Value (${formData.isKmPerLiter ? 'km/L' : 'L/hr'}) *`} />
          </SimpleItem>

          <SimpleItem>
            <NumberBox
              value={formData.tolerancePercent}
              onValueChanged={(e) => handleFieldChange('tolerancePercent', e.value)}
              format="#0.00 %"
              min={0}
              max={100}
            />
            <Label text="Tolerance (%)" />
          </SimpleItem>

          <SimpleItem>
            <NumberBox
              value={formData.minThreshold}
              onValueChanged={(e) => handleFieldChange('minThreshold', e.value)}
              format="#0.00"
              min={0}
            />
            <Label text="Min Threshold (Absolute)" />
          </SimpleItem>

          <SimpleItem>
            <NumberBox
              value={formData.maxThreshold}
              onValueChanged={(e) => handleFieldChange('maxThreshold', e.value)}
              format="#0.00"
              min={0}
            />
            <Label text="Max Threshold (Absolute)" />
          </SimpleItem>
        </GroupItem>
      </Form>

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
