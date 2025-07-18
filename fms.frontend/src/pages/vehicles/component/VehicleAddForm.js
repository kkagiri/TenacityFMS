//Cursor - Created Vehicle Add Form component for adding new vehicles
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Form, {
  GroupItem,
  SimpleItem,
  RequiredRule,
  StringLengthRule,
  RangeRule
} from 'devextreme-react/form';
import notify from 'devextreme/ui/notify';

// Redux Actions
import { createVehicle } from '../../../redux/actions/vehicleActions';
import { fetchVehicleTypes } from '../../../redux/actions/vehicleTypeActions';
import { fetchVehicleManufacturers } from '../../../redux/actions/vehicleManufacturerActions';
import { fetchVehicleModels } from '../../../redux/actions/vehicleModelActions';
import { fetchSiteList } from '../../../redux/actions/siteActions';
import { fetchEmployees } from '../../../redux/actions/employeeActions';
import { fetchExpectedAvg } from '../../../redux/actions/expectedAvgActions';

const VehicleAddForm = ({ onSave, onCancel }) => {
  const dispatch = useDispatch();

  // Redux state
  const {
    vehicleTypes,
    vehicleManufacturers,
    vehicleModels,
    sites,
    employees,
    expectedAverages
  } = useSelector(state => ({
    vehicleTypes: state.vehicleType.vehicleTypes || [],
    vehicleManufacturers: state.vehicleManufacturer.manufacturers || [],
    vehicleModels: state.vehicleModel.vehicleModels || [],
    sites: state.site.sites || [],
    employees: state.employee.employees || [],
    expectedAverages: state.expectedAvg.expectedAverages || []
  }));

  // Local form state
  const [formData, setFormData] = useState({
    hyoungNo: '',
    numberPlate: '',
    yom: '',
    vehicleTypeId: null,
    vehicleModelId: null,
    vehicleManufacturerId: null,
    workingSiteId: null,
    defaultEmployeeId: null,
    defaultExptdAvgid: null,
    capacity: '',
    passenger: '',
    currentPhysicalReading: '',
    excessWorkingHrCost: 0,
    averageKmL: false,
    hasGPSInstalled: false,
    isCompanyVehicle: true,
    isActive: true,
    gpsgategeneratedId: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        setIsLoading(true);

        // Dispatch all actions to load dropdown data
        await Promise.all([
          dispatch(fetchVehicleTypes()),
          dispatch(fetchVehicleModels()),
          dispatch(fetchVehicleManufacturers()),
          dispatch(fetchSiteList()),
          dispatch(fetchEmployees()),
          dispatch(fetchExpectedAvg())
        ]);
      } catch (error) {
        console.error('Error loading dropdown data:', error);
        notify('Error loading form data', 'error', 3000);
      } finally {
        setIsLoading(false);
      }
    };

    loadDropdownData();
  }, [dispatch]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.hyoungNo) {
      notify('Hyoung No is required', 'error', 3000);
      return;
    }

    try {
      setIsSaving(true);
      const result = await dispatch(createVehicle(formData));

      if (result.success) {
        notify('Vehicle created successfully', 'success', 3000);
        if (onSave) {
          // Pass the created vehicle data including the ID for navigation
          onSave({
            vehicleId: result.data?.vehicleId || result.data?.id,
            ...result.data
          });
        }
      } else {
        notify(result.message || 'Error creating vehicle', 'error', 3000);
      }
    } catch (error) {
      console.error('Error creating vehicle:', error);
      notify('Error creating vehicle', 'error', 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle field changes
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
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
    <div className="tw-p-4">
      <form id="vehicle-add-form" onSubmit={handleSubmit}>
        <Form
          formData={formData}
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
                displayExpr: "combinedExpectedAverage",
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
        </Form>

        {/* Form Actions */}
        <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="tw-px-4 tw-py-2 tw-text-gray-600 tw-border tw-border-gray-300 tw-rounded-md hover:tw-bg-gray-50"
            disabled={isSaving}
          >
            <i className="fa-light fa-times tw-mr-2"></i>
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSaving}
            className="tw-px-4 tw-py-2 tw-bg-blue-600 tw-text-white tw-rounded-md hover:tw-bg-blue-700 disabled:tw-opacity-50"
          >
            {isSaving ? (
              <>
                <i className="fa-light fa-spinner fa-spin tw-mr-2"></i>
                Creating...
              </>
            ) : (
              <>
                <i className="fa-light fa-save tw-mr-2"></i>
                Create Vehicle
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleAddForm;