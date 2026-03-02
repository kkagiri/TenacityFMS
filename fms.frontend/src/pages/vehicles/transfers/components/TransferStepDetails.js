/**
 * File: TransferStepDetails.js
 * Purpose: Step 1 of Vehicle Transfer wizard - Transfer Info, Driver, Equipment Reading, Departure/Arrival
 * Dependencies: DevExtreme (SelectBox, TextBox, NumberBox, DateBox), VehicleSearchableSelector, EmployeeSearchableSelector
 * Last Modified: 2026-03-02
 *
 * Key Sections:
 * - Vehicle Selection (standalone transfer mode)
 * - Transfer Information (sites, date, delivery note, job number)
 * - Driver Information (employee selector + auto-populated phone)
 * - Equipment Reading (current reading, next service, battery, fuel)
 * - Departure / Arrival (times + anti-theft checks)
 */

import React from "react";
import { SelectBox } from "devextreme-react/select-box";
import { TextBox } from "devextreme-react/text-box";
import { NumberBox } from "devextreme-react/number-box";
import { DateBox } from "devextreme-react/date-box";
import VehicleSearchableSelector from "../../../../components/selectors/VehicleSearchableSelector";
import EmployeeSearchableSelector from "../../../../components/selectors/EmployeeSearchableSelector";

const READING_UNIT_OPTIONS = [
  { value: "hrs", text: "Hours" },
  { value: "km", text: "Kilometers" },
  { value: "miles", text: "Miles" },
];

const TransferStepDetails = ({
  formData,
  sites,
  filteredSites,
  validationErrors = {},
  isStandaloneMode,
  onFieldChange,
  onVehicleSelected,
  onDriverChange,
}) => {
  const getFieldClassName = (fieldName) =>
    `m365-field${validationErrors[fieldName] ? " m365-field--error" : ""}`;

  const renderFieldError = (fieldName) =>
    validationErrors[fieldName] ? (
      <span className="m365-field__error">{validationErrors[fieldName]}</span>
    ) : null;

  return (
    <div className="vtf-step">
      {isStandaloneMode && (
        <div className="m365-section-group m365-section-group--allow-overflow tw-mb-5">
          <div className="m365-section-group__header">
            <i className="fa-light fa-truck m365-section-group__icon" />
            <h3 className="m365-section-group__title">Vehicle Selection</h3>
          </div>
          <div className="m365-section-group__body">
            <div className={getFieldClassName("vehicleId")}>
              <label className="m365-field__label">
                Vehicle <span className="tw-text-red-500">*</span>
              </label>
              <VehicleSearchableSelector
                value={formData.vehicleId}
                onValueChanged={onVehicleSelected}
                placeholder="Search vehicle by number, plate, or name"
                isValid={!validationErrors.vehicleId}
                validationError={
                  validationErrors.vehicleId
                    ? { message: validationErrors.vehicleId }
                    : null
                }
              />
              {renderFieldError("vehicleId")}
            </div>
          </div>
        </div>
      )}

      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-5">
        <div className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-exchange-alt m365-section-group__icon" />
            <h3 className="m365-section-group__title">Transfer Information</h3>
          </div>
          <div className="m365-section-group__body">
            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              <div className="m365-field">
                <label className="m365-field__label">Delivery Note No.</label>
                <TextBox
                  value={formData.deliveryNoteNumber}
                  onValueChanged={(event) =>
                    onFieldChange("deliveryNoteNumber", event.value)
                  }
                  placeholder="e.g., 757431"
                />
              </div>
              <div className={getFieldClassName("transferDate")}>
                <label className="m365-field__label">
                  Transfer Date <span className="tw-text-red-500">*</span>
                </label>
                <DateBox
                  value={formData.transferDate}
                  onValueChanged={(event) =>
                    onFieldChange("transferDate", event.value)
                  }
                  type="date"
                  displayFormat="dd/MM/yyyy"
                />
                {renderFieldError("transferDate")}
              </div>
              <div className={getFieldClassName("fromSiteId")}>
                <label className="m365-field__label">
                  From Site <span className="tw-text-red-500">*</span>
                </label>
                <SelectBox
                  dataSource={sites}
                  displayExpr="name"
                  valueExpr="id"
                  value={formData.fromSiteId}
                  onValueChanged={(event) =>
                    onFieldChange("fromSiteId", event.value)
                  }
                  searchEnabled
                  placeholder="Select source site"
                />
                {renderFieldError("fromSiteId")}
              </div>
              <div className={getFieldClassName("toSiteId")}>
                <label className="m365-field__label">
                  To Site <span className="tw-text-red-500">*</span>
                </label>
                <SelectBox
                  dataSource={filteredSites}
                  displayExpr="name"
                  valueExpr="id"
                  value={formData.toSiteId}
                  onValueChanged={(event) =>
                    onFieldChange("toSiteId", event.value)
                  }
                  searchEnabled
                  placeholder="Select destination site"
                />
                {renderFieldError("toSiteId")}
              </div>
              <div className="m365-field">
                <label className="m365-field__label">Job Number</label>
                <TextBox
                  value={formData.jobNumber}
                  onValueChanged={(event) =>
                    onFieldChange("jobNumber", event.value)
                  }
                  placeholder="e.g., 7818"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="m365-section-group m365-section-group--allow-overflow">
          <div className="m365-section-group__header">
            <i className="fa-light fa-id-card m365-section-group__icon" />
            <h3 className="m365-section-group__title">Driver Information</h3>
          </div>
          <div className="m365-section-group__body">
            <div className="m365-field">
              <label className="m365-field__label">Select Driver (Employee)</label>
              <EmployeeSearchableSelector
                value={formData.driverId}
                onValueChanged={onDriverChange}
                placeholder="Search for driver by name or email"
                siteId={formData.fromSiteId}
              />
            </div>
            <div className="tw-grid tw-grid-cols-1 tw-gap-4">
              <div className={getFieldClassName("driverPhone")}>
                <label className="m365-field__label">
                  Phone <span className="tw-text-xs tw-text-gray-400 tw-font-normal">(e.g. +27 812345678)</span>
                </label>
                <TextBox
                  value={formData.driverPhone}
                  onValueChanged={(event) =>
                    onFieldChange("driverPhone", event.value)
                  }
                  placeholder="+27 812345678"
                  mode="tel"
                />
                {renderFieldError("driverPhone")}
              </div>
            </div>
          </div>
        </div>

        <div className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-gauge m365-section-group__icon" />
            <h3 className="m365-section-group__title">Equipment Reading</h3>
          </div>
          <div className="m365-section-group__body">
            <div className="tw-grid tw-grid-cols-3 tw-gap-4">
              <div className={getFieldClassName("currentReading")}>
                <label className="m365-field__label">Current Reading</label>
                <NumberBox
                  value={formData.currentReading}
                  onValueChanged={(event) =>
                    onFieldChange("currentReading", event.value)
                  }
                  format="#,##0.##"
                />
                {renderFieldError("currentReading")}
              </div>
              <div className="m365-field">
                <label className="m365-field__label">Unit</label>
                <SelectBox
                  dataSource={READING_UNIT_OPTIONS}
                  displayExpr="text"
                  valueExpr="value"
                  value={formData.readingUnit}
                  onValueChanged={(event) =>
                    onFieldChange("readingUnit", event.value)
                  }
                />
              </div>
              <div className={getFieldClassName("nextServiceReading")}>
                <label className="m365-field__label">Next Service At</label>
                <NumberBox
                  value={formData.nextServiceReading}
                  onValueChanged={(event) =>
                    onFieldChange("nextServiceReading", event.value)
                  }
                  format="#,##0.##"
                />
                {renderFieldError("nextServiceReading")}
              </div>
            </div>
            <div className="tw-grid tw-grid-cols-3 tw-gap-4 tw-mt-2">
              <div className="m365-field">
                <label className="m365-field__label">Battery Number</label>
                <TextBox
                  value={formData.batteryNumber}
                  onValueChanged={(event) =>
                    onFieldChange("batteryNumber", event.value)
                  }
                />
              </div>
              <div className="m365-field">
                <label className="m365-field__label">Fuel in Tank (L)</label>
                <NumberBox
                  value={formData.fuelInTank}
                  onValueChanged={(event) =>
                    onFieldChange("fuelInTank", event.value)
                  }
                  format="#,##0.##"
                />
              </div>
              <div className="m365-field">
                <label className="m365-field__label">Seal Number</label>
                <TextBox
                  value={formData.sealNumber}
                  onValueChanged={(event) =>
                    onFieldChange("sealNumber", event.value)
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-clock m365-section-group__icon" />
            <h3 className="m365-section-group__title">Departure / Arrival</h3>
          </div>
          <div className="m365-section-group__body">
            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              <div className={getFieldClassName("departureTime")}>
                <label className="m365-field__label">Departure Date</label>
                <DateBox
                  value={formData.departureTime}
                  onValueChanged={(event) =>
                    onFieldChange("departureTime", event.value)
                  }
                  type="date"
                  displayFormat="dd/MM/yyyy"
                />
                {renderFieldError("departureTime")}
              </div>
              <div className={getFieldClassName("arrivalTime")}>
                <label className="m365-field__label">Arrival Date</label>
                <DateBox
                  value={formData.arrivalTime}
                  onValueChanged={(event) =>
                    onFieldChange("arrivalTime", event.value)
                  }
                  type="date"
                  displayFormat="dd/MM/yyyy"
                />
                {renderFieldError("arrivalTime")}
              </div>
            </div>
            <div className="tw-flex tw-gap-6 tw-mt-3">
              <label className="m365-checkbox">
                <input
                  type="checkbox"
                  checked={formData.antiTheftCheckedDeparture}
                  onChange={(event) =>
                    onFieldChange("antiTheftCheckedDeparture", event.target.checked)
                  }
                />
                <span className="m365-checkbox__label">
                  Anti-theft Checked (Departure)
                </span>
              </label>
              <label className="m365-checkbox">
                <input
                  type="checkbox"
                  checked={formData.keysInEnvelopeChecked}
                  onChange={(event) =>
                    onFieldChange("keysInEnvelopeChecked", event.target.checked)
                  }
                />
                <span className="m365-checkbox__label">Keys in Envelope</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferStepDetails;
