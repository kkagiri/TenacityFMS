/**
 * File: TankDeliveryForm.js
 * Purpose: Capture tank delivery details while reusing parent-provided site/tank datasets and coordinating supplier lookups.
 * Dependencies: React, Redux Toolkit, DevExtreme Form components, siteActions, tankActions, SupplierActions
 * Last Modified: 2025-10-06
 *
 * Key Functions/Components:
 * - TankDeliveryForm: Main component orchestrating delivery data entry and validation
 * - handleSiteChange: Filters tanks by site with API fallback when local cache is empty
 * - handleChange: Syncs DevExtreme form changes with React state and parent callbacks
 */
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Form,
  SimpleItem,
  GroupItem,
  Label,
  RequiredRule,
  NumericRule,
} from "devextreme-react/form";
import { Button } from "devextreme-react";
import notify from "devextreme/ui/notify";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import {
  fetchTanks,
  fetctTankbySiteId,
} from "../../../redux/actions/tankActions";
import { fetchSuppliers } from "../../../redux/actions/SupplierActions"; // Assuming you have this action
//import './deliveryForm.scss';
import ScrollView from "devextreme-react/scroll-view";

const Products = [
  { id: 1, name: "Diesel" },
  { id: 2, name: "Petrol" },
  { id: 3, name: "Kerosene" },
];

const TankDeliveryForm = ({
  updateFormData,
  isLoading,
  onSubmit,
  onCancel,
  sites: sitesProp = [],
  tanks: tanksProp = [],
}) => {
  const dispatch = useDispatch();
  const sitesState = useSelector((state) => state.site.sites || []);
  const tanksState = useSelector((state) => state.tank.tanks || []);
  const suppliers = useSelector((state) => state.supplier.suppliers || []);
  const [filteredTanks, setFilteredTanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const usingPropSites = Array.isArray(sitesProp) && sitesProp.length > 0;
  const usingPropTanks = Array.isArray(tanksProp) && tanksProp.length > 0;
  const sitesAvailable = usingPropSites ? sitesProp : sitesState;
  const tanksAvailable = usingPropTanks ? tanksProp : tanksState;
  const combinedLoading = isLoading || loading;

  const [formData, setFormData] = useState({
    siteId: null,
    tankId: null,
    deliveryDate: new Date(),
    manualDeliveryAmount: null,
    sensorDeliveryAmount: null,
    deliveryTemperature: null,
    deliveryDensity: null,
    deliveryMass: null,
    stockBeforeDelivery: null,
    stockAfterDelivery: null,
    pricePerLiter: null,
    supplierId: null,
    lponumber: "", // Match DTO field name
    product: "", // This will store the product name (string)
  });

  // Validation errors state for visual feedback
  const [validationErrors, setValidationErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  useEffect(() => {
    const sitesReady = sitesAvailable.length > 0;
    const tanksReady = tanksAvailable.length > 0;

    if (sitesReady && tanksReady) {
      if (!dataLoaded) {
        setDataLoaded(true);
      }
      return;
    }

    const initializeData = async () => {
      try {
        if (!sitesReady && !usingPropSites) {
          await dispatch(fetchSiteList());
        }
        if (!tanksReady && !usingPropTanks) {
          await dispatch(fetchTanks());
        }
        setDataLoaded(true);
      } catch (error) {
        console.error("TankDeliveryForm - Failed to load initial data:", error);
        notify({
          message: "Failed to load delivery form data. Please try again.",
          type: "error",
          displayTime: 4000,
        });
      }
    };

    initializeData();
  }, [
    dispatch,
    sitesAvailable.length,
    tanksAvailable.length,
    dataLoaded,
    usingPropSites,
    usingPropTanks,
  ]);

  useEffect(() => {
    if (!suppliers || suppliers.length === 0) {
      dispatch(fetchSuppliers());
    }
  }, [dispatch, suppliers]);

  useEffect(() => {
    if (!formData.siteId) {
      return;
    }

    const tanksForSite = tanksAvailable.filter(
      (tank) => tank.siteId === formData.siteId
    );

    if (tanksForSite.length > 0) {
      setFilteredTanks(tanksForSite);
    }
  }, [formData.siteId, tanksAvailable]);

  const handleChange = useCallback(
    (e) => {
      const { dataField, value } = e;
      let updatedValue = value;

      // Special handling for product field - convert ID to name for DTO
      if (dataField === "product") {
        updatedValue = Products.find((p) => p.id === value)?.name || "";
      }

      setFormData((prev) => {
        const updated = { ...prev, [dataField]: updatedValue };
        if (typeof updateFormData === "function") {
          updateFormData(updated);
        }
        return updated;
      });

      // Clear validation error for this field when user changes it
      setValidationErrors((prev) => ({ ...prev, [dataField]: null }));
    },
    [updateFormData]
  );

  // Validation function
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.siteId) errors.siteId = "Site is required";
    if (!formData.tankId) errors.tankId = "Tank is required";
    if (!formData.deliveryDate) errors.deliveryDate = "Delivery date is required";
    if (!formData.manualDeliveryAmount || formData.manualDeliveryAmount <= 0)
      errors.manualDeliveryAmount = "Manual delivery amount must be greater than 0";
    if (!formData.product) errors.product = "Product is required";
    if (!formData.supplierId) errors.supplierId = "Supplier is required";
    if (!formData.pricePerLiter || formData.pricePerLiter <= 0)
      errors.pricePerLiter = "Price per liter must be greater than 0";
    if (formData.stockBeforeDelivery === null || formData.stockBeforeDelivery < 0)
      errors.stockBeforeDelivery = "Stock before delivery is required and cannot be negative";
    if (formData.stockAfterDelivery === null || formData.stockAfterDelivery < 0)
      errors.stockAfterDelivery = "Stock after delivery is required and cannot be negative";

    return errors;
  }, [formData]);

  // Handle submit with validation
  const handleSubmit = useCallback(() => {
    setHasAttemptedSubmit(true);
    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      notify({
        message: "Please fill in all required fields correctly",
        type: "error",
        displayTime: 3000,
      });
      return;
    }

    if (onSubmit) {
      onSubmit(formData);
    }
  }, [formData, validateForm, onSubmit]);

  const handleSiteChange = useCallback(
    async (e) => {
      const siteId = e.value;
      setFormData((prevData) => ({
        ...prevData,
        siteId: siteId,
        tankId: null,
      }));
      setFilteredTanks([]);

      // Clear validation errors for site and tank
      setValidationErrors((prev) => ({ ...prev, siteId: null, tankId: null }));

      if (!siteId) {
        return;
      }

      let tanksForSite = tanksAvailable.filter(
        (tank) => tank.siteId === siteId
      );

      if (tanksForSite.length === 0 && !usingPropTanks) {
        setLoading(true);
        try {
          const result = await dispatch(fetctTankbySiteId(siteId));
          if (result?.success && Array.isArray(result.data)) {
            tanksForSite = result.data;
          }
        } catch (error) {
          console.error(
            "TankDeliveryForm - Failed to load tanks for site:",
            error
          );
          notify({
            message:
              "Unable to load tanks for the selected site. Please try again.",
            type: "error",
            displayTime: 4000,
          });
        } finally {
          setLoading(false);
        }
      }

      setFilteredTanks(tanksForSite);
    },
    [dispatch, tanksAvailable, usingPropTanks]
  );

  return (
    <div className="tank-transfer-form tw-h-full tw-flex tw-flex-col">
      <ScrollView showScrollbar="always" scrollByThumb={true}>
        <div className="tw-p-6">
          <Form
            formData={formData}
            readOnly={combinedLoading}
            showColonAfterLabel={true}
            labelLocation="top"
            onFieldDataChanged={handleChange}
          >
        <GroupItem caption="General Details" colCount={2}>
          <SimpleItem
            dataField="deliveryDate"
            editorType="dxDateBox"
            editorOptions={{
              value: formData.deliveryDate,
              max: new Date(),
              displayFormat: "yyyy-MM-dd HH:mm",
              type: "datetime",
              pickerType: "calendar",
              width: "100%",
              isValid: hasAttemptedSubmit ? !validationErrors.deliveryDate : true,
              validationError: validationErrors.deliveryDate
                ? { message: validationErrors.deliveryDate }
                : null,
              validationMessageMode: "always",
            }}
          >
            <Label text="Delivery Date & Time" />
            <RequiredRule message="Date and time are required" />
          </SimpleItem>
          <SimpleItem
            key={`site-${formData.siteId || 'empty'}`}
            dataField="siteId"
            editorType="dxSelectBox"
            editorOptions={{
              items: sitesAvailable,
              displayExpr: "name",
              valueExpr: "id",
              value: formData.siteId,
              onValueChanged: handleSiteChange,
              searchEnabled: true,
              showClearButton: true,
              width: "100%",
              placeholder: combinedLoading
                ? "Loading sites..."
                : sitesAvailable.length > 0
                ? "Select site"
                : "No sites available",
              isValid: hasAttemptedSubmit ? !validationErrors.siteId : true,
              validationError: validationErrors.siteId
                ? { message: validationErrors.siteId }
                : null,
              validationMessageMode: "always",
            }}
          >
            <Label text="Site" />
            <RequiredRule message="Site is required" />
          </SimpleItem>
          <SimpleItem
            key={`tank-${formData.siteId || 'empty'}-${formData.tankId || 'none'}`}
            dataField="tankId"
            editorType="dxSelectBox"
            editorOptions={{
              items: filteredTanks,
              displayExpr: "name",
              valueExpr: "id",
              value: formData.tankId,
              disabled: !formData.siteId,
              searchEnabled: true,
              showClearButton: true,
              width: "100%",
              placeholder: !formData.siteId
                ? "Select site first"
                : filteredTanks.length > 0
                ? "Select tank"
                : "No tanks available",
              isValid: hasAttemptedSubmit ? !validationErrors.tankId : true,
              validationError: validationErrors.tankId
                ? { message: validationErrors.tankId }
                : null,
              validationMessageMode: "always",
            }}
          >
            <Label text="Tank" />
            <RequiredRule message="Tank is required" />
          </SimpleItem>
        </GroupItem>
        <GroupItem caption="Delivery Details" colCount={2}>
          <SimpleItem
            dataField="stockBeforeDelivery"
            editorType="dxNumberBox"
            editorOptions={{
              value: formData.stockBeforeDelivery,
              width: "100%",
              format: "#,##0.00",
              placeholder: "Enter stock before delivery",
              isValid: hasAttemptedSubmit ? !validationErrors.stockBeforeDelivery : true,
              validationError: validationErrors.stockBeforeDelivery
                ? { message: validationErrors.stockBeforeDelivery }
                : null,
              validationMessageMode: "always",
            }}
          >
            <Label text="Stock Before Delivery (L)" />
            <RequiredRule message="Stock Before Delivery is required" />
            <NumericRule min={0} message="Value cannot be negative" />
          </SimpleItem>
          <SimpleItem
            dataField="stockAfterDelivery"
            editorType="dxNumberBox"
            editorOptions={{
              value: formData.stockAfterDelivery,
              width: "100%",
              format: "#,##0.00",
              placeholder: "Enter stock after delivery",
              isValid: hasAttemptedSubmit ? !validationErrors.stockAfterDelivery : true,
              validationError: validationErrors.stockAfterDelivery
                ? { message: validationErrors.stockAfterDelivery }
                : null,
              validationMessageMode: "always",
            }}
          >
            <Label text="Stock After Delivery (L)" />
            <RequiredRule message="Stock After Delivery is required" />
            <NumericRule min={0} message="Value cannot be negative" />
          </SimpleItem>

          <SimpleItem
            dataField="manualDeliveryAmount"
            editorType="dxNumberBox"
            editorOptions={{
              value: formData.manualDeliveryAmount,
              width: "100%",
              format: "#,##0.00",
              placeholder: "Enter manual delivery amount",
              isValid: hasAttemptedSubmit ? !validationErrors.manualDeliveryAmount : true,
              validationError: validationErrors.manualDeliveryAmount
                ? { message: validationErrors.manualDeliveryAmount }
                : null,
              validationMessageMode: "always",
            }}
          >
            <Label text="Manual Delivery Amount (L)" />
            <RequiredRule message="Manual Delivery Amount is required" />
            <NumericRule min={0.01} message="Amount must be greater than 0" />
          </SimpleItem>

          <SimpleItem
            dataField="sensorDeliveryAmount"
            editorType="dxNumberBox"
            editorOptions={{
              value: formData.sensorDeliveryAmount,
              width: "100%",
              format: "#,##0.00",
              placeholder: "Enter sensor delivery amount (optional)",
            }}
          >
            <Label text="Sensor Delivery Amount (L)" />
            <NumericRule min={0} message="Value cannot be negative" />
          </SimpleItem>
        </GroupItem>
        <GroupItem caption="Delivery Measurements" colCount={2}>
          <SimpleItem
            dataField="product"
            editorType="dxSelectBox"
            editorOptions={{
              items: Products,
              displayExpr: "name",
              valueExpr: "id",
              width: "100%",
              placeholder: "Select product type",
              showClearButton: true,
              isValid: hasAttemptedSubmit ? !validationErrors.product : true,
              validationError: validationErrors.product
                ? { message: validationErrors.product }
                : null,
              validationMessageMode: "always",
            }}
          >
            <Label text="Product" />
            <RequiredRule message="Product is required" />
          </SimpleItem>
          <SimpleItem
            dataField="deliveryTemperature"
            editorType="dxNumberBox"
            editorOptions={{
              value: formData.deliveryTemperature,
              width: "100%",
              format: "#,##0.00",
              placeholder: "Enter temperature (optional)",
            }}
          >
            <Label text="Delivery Temperature (°C)" />
            <NumericRule min={0} message="Value cannot be negative" />
          </SimpleItem>
          <SimpleItem
            dataField="deliveryDensity"
            editorType="dxNumberBox"
            editorOptions={{
              value: formData.deliveryDensity,
              width: "100%",
              format: "#,##0.0000",
              placeholder: "Enter density (optional)",
            }}
          >
            <Label text="Delivery Density (kg/L)" />
            <NumericRule min={0} message="Value cannot be negative" />
          </SimpleItem>
          <SimpleItem
            dataField="deliveryMass"
            editorType="dxNumberBox"
            editorOptions={{
              value: formData.deliveryMass,
              width: "100%",
              format: "#,##0.00",
              placeholder: "Enter mass (optional)",
            }}
          >
            <Label text="Delivery Mass (kg)" />
            <NumericRule min={0} message="Value cannot be negative" />
          </SimpleItem>
        </GroupItem>
        <GroupItem caption="Supplier Details" colCount={2}>
          <SimpleItem
            dataField="supplierId"
            editorType="dxSelectBox"
            editorOptions={{
              items: suppliers,
              displayExpr: "name",
              valueExpr: "id",
              value: formData.supplierId,
              searchEnabled: true,
              showClearButton: true,
              width: "100%",
              placeholder: "Select supplier",
              isValid: hasAttemptedSubmit ? !validationErrors.supplierId : true,
              validationError: validationErrors.supplierId
                ? { message: validationErrors.supplierId }
                : null,
              validationMessageMode: "always",
            }}
          >
            <Label text="Supplier" />
            <RequiredRule message="Supplier is required" />
          </SimpleItem>
          <SimpleItem
            dataField="lponumber"
            editorType="dxTextBox"
            editorOptions={{
              value: formData.lponumber,
              placeholder: "Enter LPO number",
              width: "100%",
            }}
          >
            <Label text="LPO Number" />
          </SimpleItem>
          <SimpleItem
            dataField="pricePerLiter"
            editorType="dxNumberBox"
            editorOptions={{
              value: formData.pricePerLiter,
              format: {
                type: "currency",
                currency: "KES",
                precision: 2,
              },
              width: "100%",
              placeholder: "Enter price per liter in KES",
              isValid: hasAttemptedSubmit ? !validationErrors.pricePerLiter : true,
              validationError: validationErrors.pricePerLiter
                ? { message: validationErrors.pricePerLiter }
                : null,
              validationMessageMode: "always",
            }}
          >
            <Label text="Price per Liter (KES)" />
            <RequiredRule message="Price per liter is required" />
            <NumericRule min={0.01} message="Price must be greater than 0" />
          </SimpleItem>
        </GroupItem>
          </Form>

          {/* Action Buttons */}
          <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
            <Button
              text="Cancel"
              onClick={onCancel}
              disabled={combinedLoading}
              className="tw-min-w-32"
              stylingMode="outlined"
            >
              <i className="fa-light fa-times tw-mr-2"></i>
              Cancel
            </Button>
            <Button
              text="Save"
              onClick={handleSubmit}
              disabled={combinedLoading}
              loading={combinedLoading}
              className="tw-min-w-32"
              type="default"
            >
              <i className="fa-light fa-save tw-mr-2"></i>
              Save Delivery
            </Button>
          </div>
        </div>
      </ScrollView>
    </div>
  );
};

export default TankDeliveryForm;
