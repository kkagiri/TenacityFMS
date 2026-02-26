/**
 * File: TransferStepInspection.js
 * Purpose: Step 2 of Vehicle Transfer wizard — Equipment Checkup Items, GPS Equipment (conditional), Service Filters
 * Dependencies: DevExtreme (DataGrid, SelectBox, TextBox, Switch)
 * Last Modified: 2026-02-26
 *
 * Key Sections:
 * - Equipment Checkup Items (editable DataGrid with condition columns)
 * - GPS Equipment Checkup (conditionally rendered based on hasGps flag)
 * - Service Filter Parts (editable DataGrid for part numbers)
 *
 * GPS Logic: GPS section only renders when hasGps=true. Device info is auto-populated
 *            from provider mapping data (gpsMapping prop).
 */

import React from "react";
import { SelectBox } from "devextreme-react/select-box";
import { TextBox } from "devextreme-react/text-box";
import { Switch } from "devextreme-react/switch";
import { DataGrid } from "devextreme-react/data-grid";
import { Column, Editing } from "devextreme-react/data-grid";

const CONDITION_OPTIONS = [
  { value: "Good", text: "Good" },
  { value: "Fair", text: "Fair" },
  { value: "Worn", text: "Worn" },
  { value: "Damaged", text: "Damaged" },
];

const TransferStepInspection = ({
  formData,
  hasGps,
  gpsMapping,
  checkupItems,
  serviceFilterParts,
  onFieldChange,
  onCheckupItemsChange,
  onServiceFilterPartsChange,
}) => {
  return (
    <div className="vtf-step">
      {/* Checkup Items */}
      <div className="m365-section-group">
        <div className="m365-section-group__header">
          <i className="fa-light fa-clipboard-check m365-section-group__icon" />
          <h3 className="m365-section-group__title">Equipment Checkup Items</h3>
          <span className="m365-badge m365-badge--neutral tw-ml-2">{checkupItems.length} items</span>
        </div>
        <div className="m365-section-group__body tw-p-0">
          <DataGrid
            dataSource={checkupItems}
            showBorders={false}
            showColumnLines={false}
            columnAutoWidth={true}
            rowAlternationEnabled={true}
            keyExpr="serialNo"
            height={360}
            onRowUpdated={(e) => {
              onCheckupItemsChange(
                checkupItems.map((item) => (item.serialNo === e.key ? { ...item, ...e.data } : item))
              );
            }}
          >
            <Editing mode="cell" allowUpdating={true} />
            <Column dataField="serialNo" caption="#" width={40} allowEditing={false} />
            <Column dataField="description" caption="Check-up Description" width={250} allowEditing={false} />
            <Column dataField="checkType" caption="Type" width={80} allowEditing={false} />
            <Column dataField="isGood" caption="Good" dataType="boolean" width={60} />
            <Column dataField="isFair" caption="Fair" dataType="boolean" width={60} />
            <Column dataField="isDamaged" caption="Damaged" dataType="boolean" width={70} />
            <Column dataField="isWorn" caption="Worn" dataType="boolean" width={60} />
            <Column dataField="wornPercentage" caption="%" dataType="number" width={50} />
            <Column dataField="remarks" caption="Remarks" width={150} />
          </DataGrid>
        </div>
      </div>

      {/* GPS Equipment — CONDITIONAL on hasGPSInstalled */}
      {hasGps ? (
        <div className="m365-section-group tw-mt-5">
          <div className="m365-section-group__header">
            <i className="fa-light fa-satellite-dish m365-section-group__icon" />
            <h3 className="m365-section-group__title">GPS Equipment Checkup</h3>
            {gpsMapping && (
              <span className="m365-badge m365-badge--success tw-ml-2">
                <i className="fa-light fa-signal tw-mr-1" />Auto-detected
              </span>
            )}
          </div>
          <div className="m365-section-group__body">
            {/* GPS Device sub-section */}
            <div className="tw-mb-5">
              <h4 className="vtf-subsection-title">
                <i className="fa-light fa-location-dot tw-mr-1" />
                GPS Device
              </h4>
              <div className="tw-grid tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
                <div className="m365-field">
                  <label className="m365-field__label">Device ID / Serial</label>
                  <TextBox value={formData.gpsDeviceId} onValueChanged={(e) => onFieldChange("gpsDeviceId", e.value)} placeholder="GPS device ID" />
                  {gpsMapping?.deviceIMEI && (
                    <span className="m365-field__hint">IMEI: {gpsMapping.deviceIMEI}</span>
                  )}
                </div>
                <div className="m365-field">
                  <label className="m365-field__label">Condition</label>
                  <SelectBox dataSource={CONDITION_OPTIONS} displayExpr="text" valueExpr="value" value={formData.gpsDeviceCondition} onValueChanged={(e) => onFieldChange("gpsDeviceCondition", e.value)} />
                </div>
                <div className="m365-field">
                  <label className="m365-field__label">Working</label>
                  <div className="tw-flex tw-items-center tw-gap-3 tw-mt-1">
                    <Switch value={formData.gpsDeviceWorking} onValueChanged={(e) => onFieldChange("gpsDeviceWorking", e.value)} />
                    <span className={`m365-badge ${formData.gpsDeviceWorking ? "m365-badge--success" : "m365-badge--error"}`}>
                      {formData.gpsDeviceWorking ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
                <div className="m365-field">
                  <label className="m365-field__label">Remarks</label>
                  <TextBox value={formData.gpsDeviceRemarks} onValueChanged={(e) => onFieldChange("gpsDeviceRemarks", e.value)} placeholder="GPS device remarks" />
                </div>
              </div>
            </div>

            {/* Fuel Sensor sub-section */}
            <div>
              <h4 className="vtf-subsection-title">
                <i className="fa-light fa-gas-pump tw-mr-1" />
                Fuel Sensor
              </h4>
              <div className="tw-grid tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
                <div className="m365-field">
                  <label className="m365-field__label">Sensor ID / Serial</label>
                  <TextBox value={formData.fuelSensorId} onValueChanged={(e) => onFieldChange("fuelSensorId", e.value)} placeholder="Fuel sensor ID" />
                </div>
                <div className="m365-field">
                  <label className="m365-field__label">Condition</label>
                  <SelectBox dataSource={CONDITION_OPTIONS} displayExpr="text" valueExpr="value" value={formData.fuelSensorCondition} onValueChanged={(e) => onFieldChange("fuelSensorCondition", e.value)} />
                </div>
                <div className="m365-field">
                  <label className="m365-field__label">Working</label>
                  <div className="tw-flex tw-items-center tw-gap-3 tw-mt-1">
                    <Switch value={formData.fuelSensorWorking} onValueChanged={(e) => onFieldChange("fuelSensorWorking", e.value)} />
                    <span className={`m365-badge ${formData.fuelSensorWorking ? "m365-badge--success" : "m365-badge--error"}`}>
                      {formData.fuelSensorWorking ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
                <div className="m365-field">
                  <label className="m365-field__label">Remarks</label>
                  <TextBox value={formData.fuelSensorRemarks} onValueChanged={(e) => onFieldChange("fuelSensorRemarks", e.value)} placeholder="Fuel sensor remarks" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="m365-info-banner tw-mt-5">
          <i className="fa-light fa-circle-info m365-info-banner__icon" />
          <div className="m365-info-banner__content">
            <span className="m365-info-banner__text">
              This vehicle does not have GPS equipment installed. GPS checkup section is not required.
            </span>
          </div>
        </div>
      )}

      {/* Service Filter Parts */}
      <div className="m365-section-group tw-mt-5">
        <div className="m365-section-group__header">
          <i className="fa-light fa-filter m365-section-group__icon" />
          <h3 className="m365-section-group__title">Service Filters (Part Numbers)</h3>
        </div>
        <div className="m365-section-group__body tw-p-0">
          <DataGrid
            dataSource={serviceFilterParts}
            showBorders={false}
            showColumnLines={false}
            columnAutoWidth={true}
            rowAlternationEnabled={true}
            keyExpr="number"
            height={200}
            onRowInserted={(e) => onServiceFilterPartsChange([...serviceFilterParts, e.data])}
            onRowRemoved={(e) => onServiceFilterPartsChange(serviceFilterParts.filter((p) => p.number !== e.key))}
          >
            <Editing mode="row" allowAdding={true} allowDeleting={true} allowUpdating={true} />
            <Column dataField="number" caption="#" width={50} />
            <Column dataField="description" caption="Description" width={200} />
            <Column dataField="partNumber" caption="Part Number" width={150} />
            <Column dataField="quantity" caption="Qty" dataType="number" width={60} />
          </DataGrid>
        </div>
      </div>
    </div>
  );
};

export default TransferStepInspection;
