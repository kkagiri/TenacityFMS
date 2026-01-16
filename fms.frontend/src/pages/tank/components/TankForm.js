/**
 * File: TankForm.js
 * Purpose: Tank create/edit form with validation and location options.
 * Dependencies: react, react-redux, devextreme-react, devextreme/ui/notify
 * Last Modified: 2026-01-16
 *
 * Key Functions/Components:
 * - TankForm: Renders the form for creating or updating a tank
 * - handleSubmit: Validates and submits tank data
 */
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Form,
  Item,
  GroupItem,
  Label,
  RequiredRule,
  NumericRule,
} from "devextreme-react/form";
import { Button } from "devextreme-react/button";
import { SelectBox } from "devextreme-react/select-box";
import notify from "devextreme/ui/notify";
import { createTank, updateTank } from "../../../redux/actions/tankActions";
import { fetchVehicleList } from "../../../redux/actions/vehicleActions";

// Tank type options
const tankTypeOptions = [
  { value: "Stationary", text: "Stationary (Fixed Location)" },
  { value: "MobileTanker", text: "Mobile Tanker (Moves with Vehicle)" },
];

const TankForm = ({ tank, onClose, onSubmit }) => {
  const dispatch = useDispatch();
  const { sites } = useSelector((state) => state.site);
  const { ptsDevices } = useSelector((state) => state.ptsDevice);
  const { vehicles } = useSelector((state) => state.vehicle);

  // DevExtreme editors can throw if `dataSource` is undefined while a value exists.
  // Always provide an array (or empty array) while data is loading.
  const sitesDataSource = Array.isArray(sites) ? sites : [];
  const ptsDevicesDataSource = Array.isArray(ptsDevices) ? ptsDevices : [];
  const vehiclesDataSource = Array.isArray(vehicles) ? vehicles : [];

  const [formData, setFormData] = useState({
    name: "",
    tankVolume: 0,
    tankHeight: null,
    tankLength: null,
    ptsId: null,
    useBookKeeping: false,
    hasAutomaticBookKeeping: false,
    priority: null,
    siteId: null,
    discrepancyThreshold: null,
    currentStock: 0,
    fuelGradeId: null,
    fuelGradeName: null,
    // Location validation fields
    tankType: "Stationary",
    latitude: null,
    longitude: null,
    linkedVehicleId: null,
    locationValidationRadius: 100,
  });

  const [loading, setLoading] = useState(false);

  // Fetch vehicles for the linked vehicle dropdown
  useEffect(() => {
    dispatch(fetchVehicleList());
  }, [dispatch]);

  useEffect(() => {
    if (tank) {
      setFormData({
        ...tank,
        useBookKeeping:
          tank.useBookKeeping === 1 || tank.useBookKeeping === true,
        hasAutomaticBookKeeping:
          tank.hasAutomaticBookKeeping === 1 ||
          tank.hasAutomaticBookKeeping === true,
        priority: tank.priority || null,
        fuelGradeId: tank.fuelGradeId || null,
        fuelGradeName: tank.fuelGradeName || null,
        tankType: tank.tankType || "Stationary",
        latitude: tank.latitude || null,
        longitude: tank.longitude || null,
        linkedVehicleId: tank.linkedVehicleId || null,
        locationValidationRadius: tank.locationValidationRadius ?? 100,
      });
    }
  }, [tank]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.siteId || formData.tankVolume <= 0) {
      notify("Please fill in all required fields", "error");
      return;
    }

    setLoading(true);
    try {
      const dataToSubmit = {
        id: tank ? tank.id : 0,
        name: formData.name,
        tankVolume: formData.tankVolume,
        tankHeight: formData.tankHeight || null,
        tankLength: formData.tankLength || null,
        // Only include ptsId if it's valid and the device exists in our loaded list
        ptsId:
          formData.ptsId &&
          ptsDevicesDataSource.some((d) => d.ptsid === formData.ptsId)
            ? formData.ptsId
            : null,
        useBookKeeping: Boolean(formData.useBookKeeping),
        hasAutomaticBookKeeping: Boolean(formData.hasAutomaticBookKeeping),
        priority: formData.priority || null,
        siteId: formData.siteId,
        discrepancyThreshold: formData.discrepancyThreshold || null,
        currentStock: formData.currentStock || 0,
        // Fuel Grade
        fuelGradeId: formData.fuelGradeId || null,
        fuelGradeName: formData.fuelGradeName || null,
        // Location validation fields
        tankType: formData.tankType || "Stationary",
        latitude:
          formData.tankType === "Stationary" ? formData.latitude || null : null,
        longitude:
          formData.tankType === "Stationary"
            ? formData.longitude || null
            : null,
        linkedVehicleId:
          formData.tankType === "MobileTanker"
            ? formData.linkedVehicleId || null
            : null,
        locationValidationRadius: formData.locationValidationRadius ?? 100,
        // NOTE: lastStockUpdate, physicalStockValue, lastPhysicalStockUpdate, physicalStockSource
        // are NOT sent - they are managed by the system
      };

      // Debug logging
      console.log("Submitting tank data:", dataToSubmit);

      let result;
      if (tank) {
        result = await dispatch(updateTank(tank.id, dataToSubmit));
      } else {
        result = await dispatch(createTank(dataToSubmit));
      }

      if (result?.success) {
        // Call onSubmit to notify parent - parent will handle refresh and notification
        onSubmit();
      }
    } catch (error) {
      console.error("Error saving tank:", error);

      // Handle validation errors
      if (error.validationErrors) {
        const validationMessages = Object.entries(error.validationErrors)
          .map(
            ([field, messages]) =>
              `${field}: ${
                Array.isArray(messages) ? messages.join(", ") : messages
              }`
          )
          .join("\n");
        notify(`Validation errors:\n${validationMessages}`, "error");
      } else if (error.response?.data) {
        // Handle API response errors
        const responseData = error.response.data;
        let errorMessage =
          responseData.title || responseData.message || "Error saving tank";

        if (responseData.errors) {
          const errorDetails = Object.entries(responseData.errors)
            .map(
              ([field, messages]) =>
                `${field}: ${
                  Array.isArray(messages) ? messages.join(", ") : messages
                }`
            )
            .join("\n");
          errorMessage += `\n\nDetails:\n${errorDetails}`;
        }

        notify(errorMessage, "error");
      } else {
        notify(error.message || "Error saving tank", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (e) => {
    e.component.validate();
  };

  return (
    <div className="tank-form tw-flex tw-flex-col tw-h-full tw-max-h-[70vh]">
      <div className="tw-flex-1 tw-overflow-y-auto tw-p-4">
        <Form
          formData={formData}
          onFieldDataChanged={(e) => {
            if (e.dataField) {
              setFormData((prev) => ({
                ...prev,
                [e.dataField]: e.value,
              }));
            }
          }}
        >
          <GroupItem colCount={2}>
            <Item dataField="name" editorType="dxTextBox">
              <Label text="Tank Name" />
              <RequiredRule message="Tank name is required" />
            </Item>

            <Item
              dataField="siteId"
              editorType="dxSelectBox"
              editorOptions={{
                dataSource: sitesDataSource,
                displayExpr: "name",
                valueExpr: "id",
                placeholder: "Select Site",
                wrapItemText: true,
                searchEnabled: true,
                width: "100%",
                dropDownOptions: {
                  wrapperAttr: { class: "tw-max-w-full" },
                },
              }}
            >
              <Label text="Site" />
              <RequiredRule message="Site is required" />
            </Item>
          </GroupItem>

          <GroupItem colCount={2}>
            <Item
              dataField="tankVolume"
              editorType="dxNumberBox"
              editorOptions={{
                min: 0,
                format: "#,##0.## L",
                showSpinButtons: true,
              }}
            >
              <Label text="Tank Capacity (Liters)" />
              <RequiredRule message="Tank capacity is required" />
              <NumericRule message="Capacity must be greater than 0" />
            </Item>

            <Item
              dataField="currentStock"
              editorType="dxNumberBox"
              editorOptions={{
                min: 0,
                format: "#,##0.## L",
                showSpinButtons: true,
              }}
            >
              <Label text="Current Stock (Liters)" />
            </Item>
          </GroupItem>

          <GroupItem colCount={2}>
            <Item
              dataField="tankHeight"
              editorType="dxNumberBox"
              editorOptions={{
                min: 0,
                format: "#,##0.## m",
                showSpinButtons: true,
              }}
            >
              <Label text="Tank Height (meters)" />
            </Item>

            <Item
              dataField="tankLength"
              editorType="dxNumberBox"
              editorOptions={{
                min: 0,
                format: "#,##0.## m",
                showSpinButtons: true,
              }}
            >
              <Label text="Tank Length (meters)" />
            </Item>
          </GroupItem>

          <GroupItem colCount={2}>
            <Item
              dataField="ptsId"
              editorType="dxSelectBox"
              editorOptions={{
                dataSource: ptsDevicesDataSource,
                displayExpr: (item) => {
                  if (!item) return "";
                  const displayName = item.ptsName || item.name || "";
                  const id = item.ptsid ?? "";
                  return displayName && id
                    ? `${displayName} (${id})`
                    : displayName || id;
                },
                valueExpr: "ptsid",
                placeholder: "Select PTS Device (Optional)",
                searchEnabled: true,
                width: "100%",
              }}
            >
              <Label text="PTS Device" />
            </Item>

            <Item
              dataField="discrepancyThreshold"
              editorType="dxNumberBox"
              editorOptions={{
                min: 0,
                format: "#,##0.## L",
                showSpinButtons: true,
              }}
            >
              <Label text="Discrepancy Threshold (Liters)" />
            </Item>
          </GroupItem>

          <Item dataField="useBookKeeping" editorType="dxCheckBox">
            <Label text="Use Book Keeping" />
          </Item>

          <GroupItem colCount={2}>
            <Item dataField="hasAutomaticBookKeeping" editorType="dxCheckBox">
              <Label text="Has Automatic Book Keeping" />
            </Item>

            <Item
              dataField="priority"
              editorType="dxSelectBox"
              editorOptions={{
                dataSource: [
                  { value: "High", text: "High" },
                  { value: "Medium", text: "Medium" },
                  { value: "Low", text: "Low" },
                ],
                displayExpr: "text",
                valueExpr: "value",
                placeholder: "Select Priority",
                showClearButton: true,
                width: "100%",
              }}
            >
              <Label text="Priority" />
            </Item>
          </GroupItem>

          <Item
            dataField="fuelGradeName"
            editorType="dxTextBox"
            editorOptions={{
              placeholder: "e.g., Diesel, Petrol, etc.",
            }}
          >
            <Label text="Fuel Grade" />
          </Item>

          {/* Location Validation Section */}
          <GroupItem caption="Location Validation" cssClass="tw-mt-4">
            <GroupItem colCount={2}>
              <Item
                dataField="tankType"
                editorType="dxSelectBox"
                editorOptions={{
                  dataSource: tankTypeOptions,
                  displayExpr: "text",
                  valueExpr: "value",
                  placeholder: "Select Tank Type",
                  width: "100%",
                }}
              >
                <Label text="Tank Type" />
                <RequiredRule message="Tank type is required" />
              </Item>

              <Item
                dataField="locationValidationRadius"
                editorType="dxNumberBox"
                editorOptions={{
                  min: 0,
                  max: 10000,
                  format: "#,##0 m",
                  showSpinButtons: true,
                  step: 10,
                }}
              >
                <Label text="Location Validation Radius (meters)" />
              </Item>
            </GroupItem>

            {/* GPS Coordinates - Always visible, disabled for Mobile Tanker */}
            <GroupItem colCount={2}>
              <Item
                dataField="latitude"
                editorType="dxTextBox"
                editorOptions={{
                  placeholder: "e.g., -1.28333000",
                  valueChangeEvent: "input",
                  disabled: formData.tankType === "MobileTanker",
                  onValueChanged: (e) => {
                    if (formData.tankType === "MobileTanker") return;
                    const parsed = parseFloat(e.value);
                    if (!isNaN(parsed) && parsed >= -90 && parsed <= 90) {
                      setFormData((prev) => ({ ...prev, latitude: parsed }));
                    } else if (e.value === "" || e.value === null) {
                      setFormData((prev) => ({ ...prev, latitude: null }));
                    }
                  },
                }}
              >
                <Label text="Latitude (-90 to 90)" />
              </Item>

              <Item
                dataField="longitude"
                editorType="dxTextBox"
                editorOptions={{
                  placeholder: "e.g., 36.81667000",
                  valueChangeEvent: "input",
                  disabled: formData.tankType === "MobileTanker",
                  onValueChanged: (e) => {
                    if (formData.tankType === "MobileTanker") return;
                    const parsed = parseFloat(e.value);
                    if (!isNaN(parsed) && parsed >= -180 && parsed <= 180) {
                      setFormData((prev) => ({ ...prev, longitude: parsed }));
                    } else if (e.value === "" || e.value === null) {
                      setFormData((prev) => ({ ...prev, longitude: null }));
                    }
                  },
                }}
              >
                <Label text="Longitude (-180 to 180)" />
              </Item>
            </GroupItem>

            {/* Mobile Tanker Linked Vehicle */}
            {formData.tankType === "MobileTanker" && (
              <GroupItem colCount={1}>
                <Item
                  dataField="linkedVehicleId"
                  editorType="dxSelectBox"
                  editorOptions={{
                    dataSource: vehiclesDataSource,
                    displayExpr: (item) =>
                      item
                        ? `${
                            item.hyoungNo || item.registrationNo || "Unknown"
                          } - ${item.vehicleName || item.model || ""}`
                        : "",
                    valueExpr: "vehicleId",
                    placeholder:
                      "Select Vehicle (GPS location comes from this vehicle)",
                    searchEnabled: true,
                    showClearButton: true,
                    width: "100%",
                  }}
                >
                  <Label text="Linked Vehicle" />
                  <RequiredRule message="Linked vehicle is required for mobile tankers" />
                </Item>
              </GroupItem>
            )}
          </GroupItem>
        </Form>
      </div>

      <div className="tw-flex tw-justify-end tw-gap-2 tw-p-4 tw-border-t tw-bg-white tw-flex-shrink-0">
        <Button text="Cancel" onClick={onClose} type="normal" />
        <Button
          text={tank ? "Update" : "Create"}
          onClick={handleSubmit}
          type="default"
          disabled={loading}
        />
      </div>
    </div>
  );
};

export default TankForm;
