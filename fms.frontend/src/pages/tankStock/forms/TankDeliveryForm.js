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
    siteId: 0,
    tankId: 0,
    date: new Date().toISOString().slice(0, 16).replace("T", " "),
    manualDeliveryAmount: 0,
    sensorDeliveryAmount: 0,
    deliveryTemperature: 0,
    deliveryDensity: 0,
    deliveryMass: 0,
    stockBeforeDelivery: 0,
    stockAfterDelivery: 0,
    pricePerLiter: 0,
    supplierId: 0,
    lpoNumber: "",
    product: "",
  });

  useEffect(() => {
    const sitesReady = sitesAvailable.length > 0;
    const tanksReady = tanksAvailable.length > 0;

    if (sitesReady && tanksReady) {
      if (!dataLoaded) {
        console.log(
          "[TankDeliveryForm] Using available datasets (sites:%d, tanks:%d)",
          sitesAvailable.length,
          tanksAvailable.length
        );
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
        console.log("[TankDeliveryForm] Data loaded from API");
      } catch (error) {
        console.error("[TankDeliveryForm] Failed to load initial data", error);
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

      // Special handling for product field
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
    },
    [updateFormData]
  );

  const handleSiteChange = useCallback(
    async (e) => {
      const siteId = e?.value ?? null;
      setFormData((prevData) => ({
        ...prevData,
        siteId: siteId,
        tankId: null,
      }));
      setFilteredTanks([]);

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
            console.log(
              "[TankDeliveryForm] Loaded %d tanks from API for site %s",
              tanksForSite.length,
              siteId
            );
          } else {
            console.warn(
              "[TankDeliveryForm] No tanks returned for site %s",
              siteId
            );
          }
        } catch (error) {
          console.error(
            "[TankDeliveryForm] Failed to load tanks for site",
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
    <ScrollView showScrollbar="always" scrollByThumb={true}>
      <Form
        formData={formData}
        readOnly={combinedLoading}
        showColonAfterLabel={true}
        labelLocation="top"
        onFieldDataChanged={handleChange}
      >
        <GroupItem caption="General Details" colCount={2}>
          <SimpleItem
            dataField="date"
            editorType="dxDateBox"
            editorOptions={{
              max: new Date(),
              displayFormat: "yyyy-MM-dd HH:mm",
              type: "datetime",
              // Set pickerType to 'calendar' for better date-time selection UI
              pickerType: "calendar",
            }}
          >
            <RequiredRule message="Date and time are required" />
          </SimpleItem>
          <SimpleItem
            dataField="siteId"
            editorType="dxSelectBox"
            editorOptions={{
              items: sitesAvailable,
              displayExpr: "name",
              valueExpr: "id",
              onValueChanged: handleSiteChange,
              searchEnabled: true,
              placeholder: combinedLoading
                ? "Loading sites..."
                : sitesAvailable.length > 0
                ? "Select site"
                : "No sites available",
            }}
          >
            <Label text="Site" />
          </SimpleItem>
          <SimpleItem
            dataField="tankId"
            editorType="dxSelectBox"
            editorOptions={{
              items: filteredTanks,
              displayExpr: "name",
              valueExpr: "id",
              disabled: !formData.siteId,
              placeholder: !formData.siteId
                ? "Select site first"
                : filteredTanks.length > 0
                ? "Select tank"
                : "No tanks available",
            }}
          ></SimpleItem>
        </GroupItem>
        <GroupItem caption="Delivery Details" colCount={2}>
          <SimpleItem dataField="stockBeforeDelivery" editorType="dxNumberBox">
            <RequiredRule message="Stock Before Delivery is required" />
            <NumericRule min={0} message="Value cannot be negative" />
          </SimpleItem>
          <SimpleItem dataField="stockAfterDelivery" editorType="dxNumberBox">
            <RequiredRule message="Stock After Delivery is required" />
            <NumericRule min={0} message="Value cannot be negative" />
          </SimpleItem>

          <SimpleItem dataField="manualDeliveryAmount" editorType="dxNumberBox">
            <RequiredRule message="Manual Delivery Amount is required" />
            <NumericRule min={0} message="Value cannot be negative" />
          </SimpleItem>

          <SimpleItem dataField="sensorDeliveryAmount" editorType="dxNumberBox">
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
            }}
          >
            <RequiredRule message="Product is required" />
          </SimpleItem>
          <SimpleItem dataField="deliveryTemperature" editorType="dxNumberBox">
            <NumericRule min={0} message="Value cannot be negative" />
          </SimpleItem>
          <SimpleItem dataField="deliveryDensity" editorType="dxNumberBox">
            <NumericRule min={0} message="Value cannot be negative" />
          </SimpleItem>
          <SimpleItem dataField="deliveryMass" editorType="dxNumberBox">
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
            }}
          />
          <SimpleItem dataField="lpoNumber" />
          <SimpleItem
            dataField="pricePerLiter"
            editorType="dxNumberBox"
            editorOptions={{
              format: {
                type: "currency",
                currency: "KES",
                precision: 2,
              },
              placeholder: "Enter price per liter in KES",
            }}
          >
            <Label text="Price per Liter (KES)" />
            <RequiredRule message="Price per liter is required" />
            <NumericRule min={0.01} message="Price must be greater than 0" />
          </SimpleItem>
        </GroupItem>
      </Form>
    </ScrollView>
  );
};

export default TankDeliveryForm;
