/**
 * File: CheckupTemplateFormPopup.js
 * Purpose: Popup form component for creating/updating transfer checkup template items.
 * Dependencies: DevExtreme popup/input components
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - CheckupTemplateFormPopup: Editable form for description, criteria, ordering, and active state.
 */
import React from "react";
import { Button } from "devextreme-react/button";
import { Popup, ScrollView } from "devextreme-react";
import { NumberBox } from "devextreme-react/number-box";
import { SelectBox } from "devextreme-react/select-box";
import { Switch } from "devextreme-react/switch";
import { TextBox } from "devextreme-react/text-box";

const toGpsSelectValue = (value) => {
  if (value === true) {
    return "yes";
  }

  if (value === false) {
    return "no";
  }

  return "all";
};

const fromGpsSelectValue = (value) => {
  if (value === "yes") {
    return true;
  }

  if (value === "no") {
    return false;
  }

  return null;
};

const CheckupTemplateFormPopup = ({
  visible,
  editingItem,
  formData,
  vehicleTypes,
  popupModels,
  onClose,
  onSave,
  onChange,
}) => {
  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      dragEnabled={false}
      showCloseButton={true}
      showTitle={true}
      title={editingItem ? "Edit Checkup Template Item" : "Create Checkup Template Item"}
      width="90%"
      maxWidth={700}
      height="auto"
      maxHeight="90%"
    >
      <ScrollView width="100%" height="100%">
        <div className="checkup-template-form tw-p-4">
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
            <div>
              <label className="tw-text-sm tw-font-medium tw-mb-1 tw-block">Serial No</label>
              <NumberBox
                value={formData.serialNo}
                min={1}
                showSpinButtons={true}
                onValueChanged={(event) => onChange("serialNo", event.value || null)}
              />
            </div>

            <div>
              <label className="tw-text-sm tw-font-medium tw-mb-1 tw-block">Sort Order</label>
              <NumberBox
                value={formData.sortOrder}
                min={0}
                showSpinButtons={true}
                onValueChanged={(event) => onChange("sortOrder", event.value || null)}
              />
            </div>

            <div className="md:tw-col-span-2">
              <label className="tw-text-sm tw-font-medium tw-mb-1 tw-block">
                Description <span className="tw-text-red-600">*</span>
              </label>
              <TextBox
                value={formData.description}
                onValueChanged={(event) => onChange("description", event.value || "")}
              />
            </div>

            <div className="md:tw-col-span-2">
              <label className="tw-text-sm tw-font-medium tw-mb-1 tw-block">Check Type</label>
              <TextBox
                value={formData.checkType}
                onValueChanged={(event) => onChange("checkType", event.value || "")}
              />
            </div>

            <div>
              <label className="tw-text-sm tw-font-medium tw-mb-1 tw-block">Vehicle Type</label>
              <SelectBox
                dataSource={vehicleTypes}
                valueExpr="id"
                displayExpr="name"
                value={formData.vehicleTypeId}
                showClearButton={true}
                searchEnabled={true}
                onValueChanged={(event) => {
                  onChange("vehicleTypeId", event.value || null);
                  onChange("vehicleModelId", null);
                }}
              />
            </div>

            <div>
              <label className="tw-text-sm tw-font-medium tw-mb-1 tw-block">Vehicle Model</label>
              <SelectBox
                dataSource={popupModels}
                valueExpr="id"
                displayExpr="name"
                value={formData.vehicleModelId}
                showClearButton={true}
                searchEnabled={true}
                onValueChanged={(event) => onChange("vehicleModelId", event.value || null)}
              />
            </div>

            <div>
              <label className="tw-text-sm tw-font-medium tw-mb-1 tw-block">GPS Criteria</label>
              <SelectBox
                dataSource={[
                  { id: "all", label: "All Vehicles" },
                  { id: "yes", label: "GPS Installed" },
                  { id: "no", label: "No GPS" },
                ]}
                valueExpr="id"
                displayExpr="label"
                value={toGpsSelectValue(formData.hasGps)}
                onValueChanged={(event) => onChange("hasGps", fromGpsSelectValue(event.value))}
              />
            </div>

            <div className="tw-flex tw-items-center tw-gap-2 tw-pt-7">
              <Switch
                value={!!formData.isActive}
                onValueChanged={(event) => onChange("isActive", !!event.value)}
              />
              <span className="tw-text-sm tw-text-gray-700">Active</span>
            </div>
          </div>

          <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6">
            <Button text="Cancel" stylingMode="outlined" onClick={onClose} />
            <Button text="Save" type="default" stylingMode="contained" onClick={onSave} />
          </div>
        </div>
      </ScrollView>
    </Popup>
  );
};

export default CheckupTemplateFormPopup;
