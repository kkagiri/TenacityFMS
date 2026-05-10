/**
 * File: TransferStepInspection.js
 * Purpose: Step 2 of Vehicle Transfer wizard - Equipment Checkup Items, GPS Equipment (conditional), Service Filters
 * Dependencies: DevExtreme (DataGrid, SelectBox, TextBox)
 * Last Modified: 2026-03-02
 *
 * Key Sections:
 * - Equipment Checkup Items (editable DataGrid with condition columns)
 * - GPS Equipment Checkup (conditionally rendered based on hasGps flag)
 *   → References GPS department, sender can send for GPS dept review
 * - Service Filter Parts (editable DataGrid for part numbers)
 *
 * GPS Logic: GPS section only renders when hasGps=true. Device info is auto-populated
 *            from provider mapping data (gpsMapping prop).
 */

import React from "react";
import { SelectBox } from "devextreme-react/select-box";
import { TextArea } from "devextreme-react/text-area";
import { DataGrid } from "devextreme-react/data-grid";
import { Column, Editing, SearchPanel } from "devextreme-react/data-grid";
import { applyCheckupItemUpdate, isPercentageCheckType } from "../vehicleTransferFormUtils";

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
  gpsInfo,
  checkupItems,
  serviceFilterParts,
  onFieldChange,
  onCheckupItemsChange,
  onServiceFilterPartsChange,
  canManageTemplates = false,
  onManageTemplates,
  onSendGpsForReview,
}) => {
  const gpsDeviceLabel = gpsMapping?.deviceName || gpsInfo?.deviceName || formData.gpsDeviceId || "Not mapped";
  const gpsSerialLabel = gpsMapping?.deviceIMEI || gpsInfo?.deviceIMEI || formData.gpsDeviceId || gpsMapping?.externalDeviceId || "Not available";
  const gpsProviderDeviceId = gpsMapping?.externalDeviceId || "";
  const fuelSensorLabel = formData.fuelSensorId || (gpsInfo?.sensorHealth?.fuelLevel != null ? "Detected from live telemetry" : "Not detected");
  const gridServiceFilterParts = serviceFilterParts.map((part) => ({ ...part }));

  return (
    <div className="vtf-step">
      <div className="m365-section-group">
        <div className="m365-section-group__header">
          <i className="fa-light fa-clipboard-check m365-section-group__icon" />
          <h3 className="m365-section-group__title">Equipment Checkup Items</h3>
          <span className="m365-badge m365-badge--neutral tw-ml-2">{checkupItems.length} items</span>
          {canManageTemplates && typeof onManageTemplates === "function" && (
            <button
              type="button"
              className="m365-btn m365-btn--ghost tw-ml-auto"
              onClick={onManageTemplates}
            >
              <i className="fa-light fa-sliders-up tw-mr-1" />
              Manage Templates
            </button>
          )}
        </div>
        <div className="m365-section-group__body tw-p-0">
          <DataGrid
            dataSource={checkupItems}
            showBorders={false}
            showColumnLines={false}
            columnAutoWidth={true}
            allowColumnResizing={true}
            columnResizingMode="widget"
            rowAlternationEnabled={true}
            keyExpr="serialNo"
            height={360}
            onEditorPreparing={(event) => {
              if (event.parentType !== "dataRow" || event.dataField !== "wornPercentage") {
                return;
              }

              const isPercentageRow = isPercentageCheckType(event.row?.data?.checkType);
              event.editorOptions = {
                ...event.editorOptions,
                min: 0,
                max: 100,
                showSpinButtons: true,
                format: "#,##0.##",
                disabled: !isPercentageRow,
              };
            }}
            onRowUpdating={(event) => {
              const currentItem = checkupItems.find((item) => item.serialNo === event.key);
              if (!currentItem) {
                return;
              }

              event.newData = applyCheckupItemUpdate(currentItem, event.newData || {});
            }}
            onRowUpdated={(event) => {
              onCheckupItemsChange(
                checkupItems.map((item) =>
                  item.serialNo === event.key ? applyCheckupItemUpdate(item, event.data || {}) : item
                )
              );
            }}
          >
            <SearchPanel
              visible={true}
              width={240}
              placeholder="Search checkup items..."
            />
            <Editing mode="cell" allowUpdating={true} />
            <Column dataField="serialNo" caption="#" width={40} allowEditing={false} />
            <Column dataField="description" caption="Check-up Description" width={250} allowEditing={false} />
            <Column dataField="checkType" caption="Type" width={80} allowEditing={false} />
            <Column dataField="isGood" caption="Good" dataType="boolean" width={60} />
            <Column dataField="isFair" caption="Fair" dataType="boolean" width={60} />
            <Column dataField="isDamaged" caption="Damaged" dataType="boolean" width={70} />
            <Column dataField="isWorn" caption="Worn" dataType="boolean" width={60} />
            <Column dataField="wornPercentage" caption="%" dataType="number" width={90} />
            <Column dataField="remarks" caption="Remarks" width={150} />
          </DataGrid>
        </div>
      </div>

      {hasGps ? (
        <div className="m365-section-group tw-mt-5">
          <div className="m365-section-group__header">
            <i className="fa-light fa-satellite-dish m365-section-group__icon" />
            <h3 className="m365-section-group__title">GPS Equipment Checkup</h3>
            <span className="m365-badge m365-badge--info tw-ml-2">
              <i className="fa-light fa-building tw-mr-1" />GPS Department
            </span>
            {gpsMapping && (
              <span className="m365-badge m365-badge--success tw-ml-2">
                <i className="fa-light fa-signal tw-mr-1" />Auto-detected
              </span>
            )}
            {typeof onSendGpsForReview === "function" && (
              <button
                type="button"
                className="m365-btn m365-btn--ghost tw-ml-auto"
                onClick={onSendGpsForReview}
                title="Send GPS equipment checkup to GPS department for review and confirmation"
              >
                <i className="fa-light fa-paper-plane tw-mr-1" />
                Send to GPS Dept
              </button>
            )}
          </div>
          <div className="m365-section-group__body">
            <div className="tw-mb-2 tw-p-2 tw-rounded" style={{ backgroundColor: "#f0f6ff", border: "1px solid #c7dff7" }}>
              <span className="tw-text-xs" style={{ color: "#0078d4" }}>
                <i className="fa-light fa-circle-info tw-mr-1" />
                This section is reviewed by the GPS Department. Use "Send to GPS Dept" to request confirmation.
              </span>
            </div>

            <div className="tw-mb-5">
              <h4 className="vtf-subsection-title">
                <i className="fa-light fa-location-dot tw-mr-1" />
                GPS Device
              </h4>
              <div className="tw-grid tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
                <div className="m365-field">
                  <label className="m365-field__label">Mapped GPS Device</label>
                  <div className="m365-input tw-flex tw-items-center tw-bg-gray-50" style={{ minHeight: 34 }}>
                    {gpsDeviceLabel}
                  </div>
                  <span className="m365-field__hint">IMEI / Serial: {gpsSerialLabel}</span>
                  {gpsProviderDeviceId && gpsProviderDeviceId !== gpsSerialLabel && (
                    <span className="m365-field__hint">Provider Device ID: {gpsProviderDeviceId}</span>
                  )}
                </div>
                <div className="m365-field">
                  <label className="m365-field__label">Condition</label>
                  <SelectBox
                    dataSource={CONDITION_OPTIONS}
                    displayExpr="text"
                    valueExpr="value"
                    value={formData.gpsDeviceCondition}
                    onValueChanged={(event) =>
                      onFieldChange("gpsDeviceCondition", event.value)
                    }
                  />
                </div>
                <div className="m365-field">
                  <label className="m365-field__label">Working</label>
                  <label className="m365-checkbox tw-mt-2">
                    <input
                      type="checkbox"
                      checked={formData.gpsDeviceWorking}
                      onChange={(event) =>
                        onFieldChange("gpsDeviceWorking", event.target.checked)
                      }
                    />
                    <span className="m365-checkbox__label">
                      {formData.gpsDeviceWorking ? "Working" : "Not Working"}
                    </span>
                  </label>
                </div>
                <div className="m365-field">
                  <label className="m365-field__label">Remarks</label>
                  <TextArea
                    value={formData.gpsDeviceRemarks}
                    readOnly={true}
                    height={130}
                    autoResizeEnabled={false}
                    stylingMode="outlined"
                    className="vtf-readonly-description"
                    placeholder="GPS device remarks are generated automatically"
                  />
                  <span className="m365-field__hint">Auto-generated from live GPS status, provider mapping, and telemetry variables.</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="vtf-subsection-title">
                <i className="fa-light fa-gas-pump tw-mr-1" />
                Fuel Sensor
              </h4>
              <div className="tw-grid tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
                <div className="m365-field">
                  <label className="m365-field__label">Mapped Fuel Sensor</label>
                  <div className="m365-input tw-flex tw-items-center tw-bg-gray-50" style={{ minHeight: 34 }}>
                    {fuelSensorLabel}
                  </div>
                  <span className="m365-field__hint">Source: active provider mapping</span>
                </div>
                <div className="m365-field">
                  <label className="m365-field__label">Condition</label>
                  <SelectBox
                    dataSource={CONDITION_OPTIONS}
                    displayExpr="text"
                    valueExpr="value"
                    value={formData.fuelSensorCondition}
                    onValueChanged={(event) =>
                      onFieldChange("fuelSensorCondition", event.value)
                    }
                  />
                </div>
                <div className="m365-field">
                  <label className="m365-field__label">Working</label>
                  <label className="m365-checkbox tw-mt-2">
                    <input
                      type="checkbox"
                      checked={formData.fuelSensorWorking}
                      onChange={(event) =>
                        onFieldChange("fuelSensorWorking", event.target.checked)
                      }
                    />
                    <span className="m365-checkbox__label">
                      {formData.fuelSensorWorking ? "Working" : "Not Working"}
                    </span>
                  </label>
                </div>
                <div className="m365-field">
                  <label className="m365-field__label">Remarks</label>
                  <TextArea
                    value={formData.fuelSensorRemarks}
                    readOnly={true}
                    height={170}
                    autoResizeEnabled={false}
                    stylingMode="outlined"
                    className="vtf-readonly-description"
                    placeholder="Fuel sensor remarks are generated automatically"
                  />
                  <span className="m365-field__hint">Shows GPSGate custom fuel calibration and all live telemetry variables.</span>
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

      <div className="m365-section-group tw-mt-5">
        <div className="m365-section-group__header">
          <i className="fa-light fa-filter m365-section-group__icon" />
          <h3 className="m365-section-group__title">Service Filters (Part Numbers)</h3>
        </div>
        <div className="m365-section-group__body tw-p-0">
          <DataGrid
            dataSource={gridServiceFilterParts}
            showBorders={false}
            showColumnLines={false}
            columnAutoWidth={true}
            rowAlternationEnabled={true}
            keyExpr="number"
            height={200}
            onRowInserted={(event) => onServiceFilterPartsChange([...serviceFilterParts, event.data])}
            onRowUpdated={(event) =>
              onServiceFilterPartsChange(
                serviceFilterParts.map((part) =>
                  part.number === event.key ? { ...part, ...event.data } : part
                )
              )
            }
            onRowRemoved={(event) =>
              onServiceFilterPartsChange(
                serviceFilterParts.filter((part) => part.number !== event.key)
              )
            }
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
