 //Cursor - Created Vehicle Edit Form component based on Vehicle.cs entity
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Form, {
  ButtonItem,
  GroupItem,
  SimpleItem,
  RequiredRule,
  StringLengthRule,
  RangeRule
} from 'devextreme-react/form';
import { SelectBox, TextBox, NumberBox, CheckBox } from 'devextreme-react';

// Services
import {
  getVehicleTypes,
  getVehicleModels,
  getVehicleManufacturers,
  getSiteList,
  getEmployeeList,
  getExpectedAverageList
} from '../../dataservice';

const VehicleEditForm = ({ vehicle, isEditing, onSave, isSaving }) => {
  const dispatch = useDispatch();

  // State
  const [formData, setFormData] = useState({});
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [vehicleManufacturers, setVehicleManufacturers] = useState([]);
  const [sites, setSites] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [expectedAverages, setExpectedAverages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load form data when vehicle changes
  useEffect(() => {
    if (vehicle) {
      setFormData({
        hyoungNo: vehicle.hyoungNo || '',
        numberPlate: vehicle.numberPlate || '',
        yom: vehicle.yom || '',
        vehicleTypeId: vehicle.vehicleTypeId || null,
        vehicleModelId: vehicle.vehicleModelId || null,
        vehicleManufacturerId: vehicle.vehicleManufacturerId || null,
        workingSiteId: vehicle.workingSiteId || null,
        defaultEmployeeId: vehicle.defaultEmployeeId || null,
        defaultExptdAvgid: vehicle.defaultExptdAvgid || null,
        capacity: vehicle.capacity || '',
        passenger: vehicle.passenger || '',
        currentPhysicalReading: vehicle.currentPhysicalReading || '',
        excessWorkingHrCost: vehicle.excessWorkingHrCost || 0,
        averageKmL: vehicle.averageKmL || false,
        hasGPSInstalled: vehicle.hasGPSInstalled || false,
        isCompanyVehicle: vehicle.isCompanyVehicle || false,
        isActive: vehicle.isActive || true,
        gpsgategeneratedId: vehicle.gpsgategeneratedId || false
      });
    }
  }, [vehicle]);

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        setIsLoading(true);
        const [
          typesData,
          modelsData,
          manufacturersData,
          sitesData,
          employeesData,
          expectedAvgData
        ] = await Promise.all([
          getVehicleTypes(),
          getVehicleModels(),
          getVehicleManufacturers(),
          getSiteList(),
          getEmployeeList(),
          getExpectedAverageList()
        ]);

        setVehicleTypes(typesData);
        setVehicleModels(modelsData);
        setVehicleManufacturers(manufacturersData);
        setSites(sitesData);
        setEmployees(employeesData);
        setExpectedAverages(expectedAvgData);
      } catch (error) {
        console.error('Error loading dropdown data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDropdownData();
  }, []);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
  };

  // Handle field changes
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
        <div className="tw-text-center">
          <i className="fa-light fa-spinner fa-spin tw-text-4xl tw-text-blue-600 tw-mb-4"></i>
          <p className="tw-text-gray-600">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <form id="vehicle-form" onSubmit={handleSubmit}>
      <Form
        formData={formData}
        disabled={!isEditing}
        showColonAfterLabel={true}
        labelLocation="top"
        colCount={2}
      >
        {/* Basic Information Group */}
        <GroupItem caption="Basic Information" colCount={2}>
          <SimpleItem
            dataField="hyoungNo"
            caption="Hyoung No"
            isRequired={true}
            editorOptions={{
              placeholder: "Enter company registration number",
              onValueChanged: (e) => handleFieldChange('hyoungNo', e.value)
            }}
          >
            <RequiredRule message="Hyoung No is required" />
            <StringLengthRule max={50} message="Hyoung No cannot exceed 50 characters" />
          </SimpleItem>

          <SimpleItem
            dataField="numberPlate"
            caption="Number Plate"
            editorOptions={{
              placeholder: "Enter number plate",
              onValueChanged: (e) => handleFieldChange('numberPlate', e.value)
            }}
          >
            <StringLengthRule max={20} message="Number plate cannot exceed 20 characters" />
          </SimpleItem>

          <SimpleItem
            dataField="yom"
            caption="Year of Manufacture"
            editorOptions={{
              placeholder: "Enter year (e.g., 2020)",
              onValueChanged: (e) => handleFieldChange('yom', e.value)
            }}
          >
            <StringLengthRule max={4} message="Year should be 4 digits" />
          </SimpleItem>

          <SimpleItem
            dataField="capacity"
            caption="Capacity"
            editorOptions={{
              placeholder: "Enter vehicle capacity",
              onValueChanged: (e) => handleFieldChange('capacity', e.value)
            }}
          />
        </GroupItem>

        {/* Technical Details Group */}
        <GroupItem caption="Technical Details" colCount={2}>
          <SimpleItem
            dataField="vehicleTypeId"
            caption="Vehicle Type"
            editorType="dxSelectBox"
            editorOptions={{
              dataSource: vehicleTypes,
              valueExpr: "id",
              displayExpr: "name",
              placeholder: "Select vehicle type",
              onValueChanged: (e) => handleFieldChange('vehicleTypeId', e.value)
            }}
          />

          <SimpleItem
            dataField="vehicleManufacturerId"
            caption="Manufacturer"
            editorType="dxSelectBox"
            editorOptions={{
              dataSource: vehicleManufacturers,
              valueExpr: "id",
              displayExpr: "name",
              placeholder: "Select manufacturer",
              onValueChanged: (e) => handleFieldChange('vehicleManufacturerId', e.value)
            }}
          />

          <SimpleItem
            dataField="vehicleModelId"
            caption="Model"
            editorType="dxSelectBox"
            editorOptions={{
              dataSource: vehicleModels,
              valueExpr: "id",
              displayExpr: "name",
              placeholder: "Select model",
              onValueChanged: (e) => handleFieldChange('vehicleModelId', e.value)
            }}
          />

          <SimpleItem
            dataField="passenger"
            caption="Passenger Capacity"
            editorOptions={{
              placeholder: "Enter passenger capacity",
              onValueChanged: (e) => handleFieldChange('passenger', e.value)
            }}
          />
        </GroupItem>

        {/* Operational Details Group */}
        <GroupItem caption="Operational Details" colCount={2}>
          <SimpleItem
            dataField="workingSiteId"
            caption="Working Site"
            editorType="dxSelectBox"
            editorOptions={{
              dataSource: sites,
              valueExpr: "id",
              displayExpr: "name",
              placeholder: "Select working site",
              onValueChanged: (e) => handleFieldChange('workingSiteId', e.value)
            }}
          />

          <SimpleItem
            dataField="defaultEmployeeId"
            caption="Default Employee"
            editorType="dxSelectBox"
            editorOptions={{
              dataSource: employees,
              valueExpr: "id",
              displayExpr: "fullName",
              placeholder: "Select default employee",
              onValueChanged: (e) => handleFieldChange('defaultEmployeeId', e.value)
            }}
          />

          <SimpleItem
            dataField="defaultExptdAvgid"
            caption="Expected Average"
            editorType="dxSelectBox"
            editorOptions={{
              dataSource: expectedAverages,
              valueExpr: "id",
              displayExpr: "expectedAveraged",
              placeholder: "Select expected average",
              onValueChanged: (e) => handleFieldChange('defaultExptdAvgid', e.value)
            }}
          />

          <SimpleItem
            dataField="excessWorkingHrCost"
            caption="Excess Working Hour Cost"
            editorType="dxNumberBox"
            editorOptions={{
              format: "#0.00",
              placeholder: "Enter cost",
              onValueChanged: (e) => handleFieldChange('excessWorkingHrCost', e.value)
            }}
          >
            <RangeRule min={0} message="Cost cannot be negative" />
          </SimpleItem>
        </GroupItem>

        {/* GPS and Tracking Group */}
        <GroupItem caption="GPS & Tracking" colCount={2}>
          <SimpleItem
            dataField="currentPhysicalReading"
            caption="Current Physical Reading"
            editorOptions={{
              placeholder: "Enter current reading",
              onValueChanged: (e) => handleFieldChange('currentPhysicalReading', e.value)
            }}
          />

          <SimpleItem
            dataField="hasGPSInstalled"
            caption="GPS Installed"
            editorType="dxCheckBox"
            editorOptions={{
              onValueChanged: (e) => handleFieldChange('hasGPSInstalled', e.value)
            }}
          />

          <SimpleItem
            dataField="gpsgategeneratedId"
            caption="GPS Gate Generated ID"
            editorType="dxCheckBox"
            editorOptions={{
              onValueChanged: (e) => handleFieldChange('gpsgategeneratedId', e.value)
            }}
          />

          <SimpleItem
            dataField="averageKmL"
            caption="Average Km/L"
            editorType="dxCheckBox"
            editorOptions={{
              onValueChanged: (e) => handleFieldChange('averageKmL', e.value)
            }}
          />
        </GroupItem>

        {/* Status Group */}
        <GroupItem caption="Status" colCount={2}>
          <SimpleItem
            dataField="isCompanyVehicle"
            caption="Company Vehicle"
            editorType="dxCheckBox"
            editorOptions={{
              onValueChanged: (e) => handleFieldChange('isCompanyVehicle', e.value)
            }}
          />

          <SimpleItem
            dataField="isActive"
            caption="Active"
            editorType="dxCheckBox"
            editorOptions={{
              onValueChanged: (e) => handleFieldChange('isActive', e.value)
            }}
          />
        </GroupItem>

        {/* Form Actions */}
        {isEditing && (
          <ButtonItem
            horizontalAlignment="right"
            buttonOptions={{
              text: "Save Vehicle",
              type: "default",
              stylingMode: "contained",
              icon: "fa-light fa-save",
              disabled: isSaving,
              onClick: handleSubmit
            }}
          />
        )}
      </Form>
    </form>
  );
};

export default VehicleEditForm;