/**
 * File: VehicleEditForm.js
 * Purpose: Display and (optionally) allow editing of a vehicle record within Vehicle Details.
 * Dependencies: DevExtreme Form, Redux actions for dropdown data.
 * Last Modified: 2026-01-15
 *
 * Notes:
 * - Edit controls are gated via `canEdit` (admin-only).
 * - Fixed-location settings were removed from the domain Vehicle entity.
 */
import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import store from "../../../../store"; // Import the Redux store directly
import Form, {
  ButtonItem,
  GroupItem,
  SimpleItem,
  RequiredRule,
  StringLengthRule,
  RangeRule,
} from "devextreme-react/form";
import { SelectBox, TextBox, NumberBox, CheckBox } from "devextreme-react";
import Button from "devextreme-react/button";
import "./VehicleEditForm.scss";

// import Actions
import { fetchVehicleList } from "../../../../redux/actions/vehicleActions";
import { fetchVehicleTypes } from "../../../../redux/actions/vehicleTypeActions";
import { fetchVehicleModels } from "../../../../redux/actions/vehicleModelActions";
import { fetchVehicleManufacturers } from "../../../../redux/actions/vehicleManufacturerActions";
import { fetchSiteList } from "../../../../redux/actions/siteActions";
import { fetchEmployees } from "../../../../redux/actions/employeeActions";
import { fetchExpectedAvg } from "../../../../redux/actions/expectedAvgActions";

const VehicleEditForm = ({
  vehicle,
  isEditing = false,
  onSave,
  isSaving,
  canEdit = true,
}) => {
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
  const [isEditingInternal, setIsEditingInternal] = useState(false);
  const [dropdownDataLoaded, setDropdownDataLoaded] = useState(false); // Add this flag

  // Load form data when vehicle changes - Use vehicle ID as dependency
  useEffect(() => {
    if (vehicle && vehicle.vehicleId) {
      setFormData({
        hyoungNo: vehicle.hyoungNo || "",
        numberPlate: vehicle.numberPlate || "",
        yom: vehicle.yom || "",
        vehicleTypeId: vehicle.vehicleTypeId || null,
        vehicleModelId: vehicle.vehicleModelId || null,
        vehicleManufacturerId: vehicle.vehicleManufacturerId || null,
        workingSiteId: vehicle.workingSiteId || null,
        defaultEmployeeId: vehicle.defaultEmployeeId || null,
        defaultExptdAvgid: vehicle.defaultExptdAvgid || null,
        fuelTankCapacity: vehicle.fuelTankCapacity || null,
        isFullTankPolicy: vehicle.IsFullTankPolicy || false,
        passenger: vehicle.passenger || "",
        currentPhysicalReading: vehicle.currentPhysicalReading || "",
        excessWorkingHrCost: vehicle.excessWorkingHrCost || 0,
        averageKmL: vehicle.averageKmL || false,
        hasGPSInstalled: vehicle.hasGPSInstalled || false,
        isCompanyVehicle: vehicle.isCompanyVehicle || false,
        isActive: vehicle.isActive || true,
        gpsgategeneratedId: vehicle.gpsgategeneratedId || false,
      });
    }
  }, [vehicle?.vehicleId]); // Only depend on vehicle ID

  // Ensure non-editable mode cannot be toggled accidentally
  useEffect(() => {
    if (!canEdit && isEditingInternal) {
      setIsEditingInternal(false);
    }
  }, [canEdit, isEditingInternal]);

  // Load dropdown data - Only load once and use existing data from Redux store when possible
  useEffect(() => {
    const loadDropdownData = async () => {
      // Check if we already have data in the Redux store
      const state = store.getState();
      const hasExistingData =
        state.vehicleType?.vehicleTypes?.length > 0 &&
        state.vehicleModel?.vehicleModels?.length > 0 &&
        state.vehicleManufacturer?.manufacturers?.length > 0 &&
        state.site?.sites?.length > 0 &&
        state.employee?.employees?.length > 0 &&
        state.expectedAvg?.expectedAverages?.length > 0;

      // Skip loading if we've already loaded the data in this component instance
      // or if we already have data in Redux store
      if (dropdownDataLoaded || hasExistingData) {
        // Use existing data from Redux store
        setVehicleTypes(state.vehicleType?.vehicleTypes || []);
        setVehicleModels(state.vehicleModel?.vehicleModels || []);
        setVehicleManufacturers(state.vehicleManufacturer?.manufacturers || []);
        setSites(state.site?.sites || []);
        setEmployees(state.employee?.employees || []);
        setExpectedAverages(state.expectedAvg?.expectedAverages || []);
        setDropdownDataLoaded(true);
        return;
      }

      try {
        setIsLoading(true);
        const [
          typesResponse,
          modelsResponse,
          manufacturersResponse,
          sitesResponse,
          employeesResponse,
          expectedAvgResponse,
        ] = await Promise.all([
          dispatch(fetchVehicleTypes()),
          dispatch(fetchVehicleModels()),
          dispatch(fetchVehicleManufacturers()),
          dispatch(fetchSiteList()),
          dispatch(fetchEmployees()),
          dispatch(fetchExpectedAvg()),
        ]);

        // Extract data from responses
        setVehicleTypes(typesResponse?.data || []);
        setVehicleModels(modelsResponse?.data || []);
        setVehicleManufacturers(manufacturersResponse?.data || []);
        setSites(sitesResponse?.data || []);
        setEmployees(employeesResponse?.data || []);
        setExpectedAverages(expectedAvgResponse?.data || []);

        setDropdownDataLoaded(true); // Mark as loaded
      } catch (error) {
        console.error("Error loading dropdown data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!dropdownDataLoaded) {
      loadDropdownData();
    }
  }, [dispatch, dropdownDataLoaded]); // Only depend on dispatch and the loaded flag

  // Handle form submission
  const handleSubmit = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (onSave) {
      onSave(formData);
      setIsEditingInternal(false); // Close edit mode after save
    }
  };

  // Memoize field change handler
  const handleFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Memoize reset function
  const resetFormData = useCallback(() => {
    if (vehicle) {
      setFormData({
        hyoungNo: vehicle.hyoungNo || "",
        numberPlate: vehicle.numberPlate || "",
        yom: vehicle.yom || "",
        vehicleTypeId: vehicle.vehicleTypeId || null,
        vehicleModelId: vehicle.vehicleModelId || null,
        vehicleManufacturerId: vehicle.vehicleManufacturerId || null,
        workingSiteId: vehicle.workingSiteId || null,
        defaultEmployeeId: vehicle.defaultEmployeeId || null,
        defaultExptdAvgid: vehicle.defaultExptdAvgid || null,
        fuelTankCapacity: vehicle.fuelTankCapacity || null,
        isFullTankPolicy: vehicle.isFullTankPolicy || false,
        passenger: vehicle.passenger || "",
        currentPhysicalReading: vehicle.currentPhysicalReading || "",
        excessWorkingHrCost: vehicle.excessWorkingHrCost || 0,
        averageKmL: vehicle.averageKmL || false,
        hasGPSInstalled: vehicle.hasGPSInstalled || false,
        isCompanyVehicle: vehicle.isCompanyVehicle || false,
        isActive: vehicle.isActive || true,
        gpsgategeneratedId: vehicle.gpsgategeneratedId || false,
      });
    }
  }, [vehicle]);

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

  const isEditMode = canEdit && (isEditing || isEditingInternal);
  const isFormDisabled = !isEditMode;

  return (
    <div
      className={`vehicle-edit-form ${isEditMode ? "vehicle-edit-form--editing" : "vehicle-edit-form--view"
        }`}
    >
      <form id="vehicle-form" onSubmit={handleSubmit}>
        {/* Form Actions - Top of page */}
        <div className="vehicle-edit-form__actions tw-flex tw-items-center tw-justify-between tw-gap-3 tw-mb-4 tw-pb-4 tw-border-b tw-border-gray-200">
          <div className="tw-text-sm tw-text-gray-600">
            {!canEdit ? (
              <span className="tw-inline-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-lock"></i>
                Read-only (admin only)
              </span>
            ) : isEditMode ? (
              <span className="tw-inline-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-pen"></i>
                Editing enabled
              </span>
            ) : (
              <span className="tw-inline-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-eye"></i>
                Viewing
              </span>
            )}
          </div>

          {canEdit && (
            <div className="tw-flex tw-justify-end tw-gap-3">
              {!isEditMode ? (
                <Button
                  text="Edit Vehicle"
                  icon="fa-light fa-edit"
                  type="default"
                  stylingMode="contained"
                  onClick={() => {
                    setIsEditingInternal(true);
                  }}
                  className="tw-bg-blue-600 tw-text-white hover:tw-bg-blue-700 tw-min-w-32"
                />
              ) : (
                <>
                  <Button
                    text="Cancel"
                    icon="fa-light fa-times"
                    type="normal"
                    stylingMode="outlined"
                    onClick={() => {
                      setIsEditingInternal(false);
                      resetFormData();
                    }}
                    disabled={isSaving}
                    className="tw-border-gray-300 tw-text-gray-600 hover:tw-bg-gray-50 tw-min-w-24"
                  />
                  <Button
                    text={isSaving ? "Saving..." : "Save Vehicle"}
                    icon={
                      isSaving
                        ? "fa-light fa-spinner fa-spin"
                        : "fa-light fa-save"
                    }
                    type="success"
                    stylingMode="contained"
                    disabled={isSaving}
                    onClick={handleSubmit}
                    className="tw-bg-green-600 tw-text-white hover:tw-bg-green-700 tw-min-w-32"
                  />
                </>
              )}
            </div>
          )}
        </div>

        <Form
          formData={formData}
          // disabled={isFormDisabled}
          showColonAfterLabel={true}
          labelLocation="top"
          colCount={2}
          readOnly={isFormDisabled}
        >
          {/* Basic Information Group */}
          <GroupItem caption="Basic Information" colCount={2}>
            <SimpleItem
              dataField="hyoungNo"
              caption="Hyoung No"
              isRequired={true}
              editorOptions={{
                placeholder: "Enter company registration number",
                onValueChanged: (e) => handleFieldChange("hyoungNo", e.value),
                readOnly: isFormDisabled,
                stylingMode: isFormDisabled ? "outlined" : "outlined",
              }}
            >
              <RequiredRule message="Hyoung No is required" />
              <StringLengthRule
                max={50}
                message="Hyoung No cannot exceed 50 characters"
              />
            </SimpleItem>

            <SimpleItem
              dataField="numberPlate"
              caption="Number Plate"
              editorOptions={{
                placeholder: "Enter number plate",
                onValueChanged: (e) =>
                  handleFieldChange("numberPlate", e.value),
                readOnly: isFormDisabled,
                stylingMode: isFormDisabled ? "outlined" : "outlined",
              }}
            >
              <StringLengthRule
                max={20}
                message="Number plate cannot exceed 20 characters"
              />
            </SimpleItem>

            <SimpleItem
              dataField="yom"
              caption="Year of Manufacture"
              editorOptions={{
                placeholder: "Enter year (e.g., 2020)",
                onValueChanged: (e) => handleFieldChange("yom", e.value),
                readOnly: isFormDisabled,
                stylingMode: isFormDisabled ? "outlined" : "outlined",
              }}
            >
              <StringLengthRule max={4} message="Year should be 4 digits" />
            </SimpleItem>

            <SimpleItem
              dataField="fuelTankCapacity"
              caption="Full Tank Capacity"
              editorOptions={{
                placeholder: "Enter Fuel tank capacity",
                onValueChanged: (e) =>
                  handleFieldChange("fuelTankCapacity", e.value),
                readOnly: isFormDisabled,
                stylingMode: isFormDisabled ? "outlined" : "outlined",
              }}
            />
            <SimpleItem
              dataField="isFullTankPolicy"
              caption="Full Tank Policy"
              editorType="dxCheckBox"
              editorOptions={{
                onValueChanged: (e) =>
                  handleFieldChange("isFullTankPolicy", e.value),
                readOnly: isFormDisabled,
                stylingMode: isFormDisabled ? "outlined" : "outlined",
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
                onValueChanged: (e) =>
                  handleFieldChange("vehicleTypeId", e.value),
                readOnly: isFormDisabled,
                stylingMode: isFormDisabled ? "outlined" : "outlined",
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
                onValueChanged: (e) =>
                  handleFieldChange("vehicleManufacturerId", e.value),
                readOnly: isFormDisabled,
                stylingMode: isFormDisabled ? "outlined" : "outlined",
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
                onValueChanged: (e) =>
                  handleFieldChange("vehicleModelId", e.value),
                readOnly: isFormDisabled,
                stylingMode: isFormDisabled ? "outlined" : "outlined",
              }}
            />

            <SimpleItem
              dataField="passenger"
              caption="Passenger Capacity"
              editorOptions={{
                placeholder: "Enter passenger capacity",
                onValueChanged: (e) => handleFieldChange("passenger", e.value),
                readOnly: isFormDisabled,
                stylingMode: isFormDisabled ? "outlined" : "outlined",
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
                onValueChanged: (e) =>
                  handleFieldChange("workingSiteId", e.value),
                readOnly: isFormDisabled,
                stylingMode: isFormDisabled ? "outlined" : "outlined",
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
                onValueChanged: (e) =>
                  handleFieldChange("defaultEmployeeId", e.value),
                readOnly: isFormDisabled,
                stylingMode: isFormDisabled ? "outlined" : "outlined",
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
                onValueChanged: (e) =>
                  handleFieldChange("defaultExptdAvgid", e.value),
                readOnly: isFormDisabled,
                stylingMode: isFormDisabled ? "outlined" : "outlined",
              }}
            />

            <SimpleItem
              dataField="excessWorkingHrCost"
              caption="Excess Working Hour Cost"
              editorType="dxNumberBox"
              editorOptions={{
                format: "#0.00",
                placeholder: "Enter cost",
                onValueChanged: (e) =>
                  handleFieldChange("excessWorkingHrCost", e.value),
                readOnly: isFormDisabled,
                stylingMode: isFormDisabled ? "outlined" : "outlined",
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
                onValueChanged: (e) =>
                  handleFieldChange("currentPhysicalReading", e.value),
                readOnly: isFormDisabled,
                stylingMode: isFormDisabled ? "outlined" : "outlined",
              }}
            />

            <SimpleItem
              dataField="hasGPSInstalled"
              caption="GPS Installed"
              editorType="dxCheckBox"
              editorOptions={{
                onValueChanged: (e) =>
                  handleFieldChange("hasGPSInstalled", e.value),
                readOnly: isFormDisabled,
              }}
            />

            <SimpleItem
              dataField="gpsgategeneratedId"
              caption="GPS Gate Generated ID"
              editorType="dxCheckBox"
              editorOptions={{
                onValueChanged: (e) =>
                  handleFieldChange("gpsgategeneratedId", e.value),
                readOnly: isFormDisabled,
              }}
            />

            <SimpleItem
              dataField="averageKmL"
              caption="Average Km/L"
              editorType="dxCheckBox"
              editorOptions={{
                onValueChanged: (e) => handleFieldChange("averageKmL", e.value),
                readOnly: isFormDisabled,
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
                onValueChanged: (e) =>
                  handleFieldChange("isCompanyVehicle", e.value),
                readOnly: isFormDisabled,
              }}
            />

            <SimpleItem
              dataField="isActive"
              caption="Active"
              editorType="dxCheckBox"
              editorOptions={{
                onValueChanged: (e) => handleFieldChange("isActive", e.value),
                readOnly: isFormDisabled,
              }}
            />
          </GroupItem>
        </Form>
      </form>
    </div>
  );
};

export default VehicleEditForm;
