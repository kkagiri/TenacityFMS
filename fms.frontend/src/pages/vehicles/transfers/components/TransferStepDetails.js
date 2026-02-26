/**
 * File: TransferStepDetails.js
 * Purpose: Step 1 of Vehicle Transfer wizard — Transfer Info, Driver, Equipment Reading, Departure/Arrival
 * Dependencies: DevExtreme (SelectBox, TextBox, NumberBox, DateBox), EmployeeSearchableSelector
 * Last Modified: 2026-02-26
 *
 * Key Sections:
 * - Transfer Information (sites, date, delivery note, job number)
 * - Driver Information (employee selector + manual entry)
 * - Equipment Reading (current reading, next service, battery, fuel)
 * - Departure / Arrival (times + anti-theft checks)
 */

import React from "react";
import { SelectBox } from "devextreme-react/select-box";
import { TextBox } from "devextreme-react/text-box";
import { NumberBox } from "devextreme-react/number-box";
import { DateBox } from "devextreme-react/date-box";
import EmployeeSearchableSelector from "../../../../components/selectors/EmployeeSearchableSelector";

const READING_UNIT_OPTIONS = [
  { value: "hrs", text: "Hours" },
  { value: "km", text: "Kilometers" },
  { value: "miles", text: "Miles" },
];

const TransferStepDetails = ({ formData, sites, filteredSites, onFieldChange, onDriverChange }) => {
  return (
    <div className="vtf-step">
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-5">
        {/* Transfer Info */}
        <div className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-exchange-alt m365-section-group__icon" />
            <h3 className="m365-section-group__title">Transfer Information</h3>
          </div>
          <div className="m365-section-group__body">
            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              <div className="m365-field">
                <label className="m365-field__label">Delivery Note No.</label>
                <TextBox value={formData.deliveryNoteNumber} onValueChanged={(e) => onFieldChange("deliveryNoteNumber", e.value)} placeholder="e.g., 757431" />
              </div>
              <div className="m365-field">
                <label className="m365-field__label">Transfer Date <span className="tw-text-red-500">*</span></label>
                <DateBox value={formData.transferDate} onValueChanged={(e) => onFieldChange("transferDate", e.value)} type="date" displayFormat="dd/MM/yyyy" />
              </div>
              <div className="m365-field">
                <label className="m365-field__label">From Site <span className="tw-text-red-500">*</span></label>
                <SelectBox dataSource={sites} displayExpr="name" valueExpr="id" value={formData.fromSiteId} onValueChanged={(e) => onFieldChange("fromSiteId", e.value)} searchEnabled placeholder="Select source site" />
              </div>
              <div className="m365-field">
                <label className="m365-field__label">To Site <span className="tw-text-red-500">*</span></label>
                <SelectBox dataSource={filteredSites} displayExpr="name" valueExpr="id" value={formData.toSiteId} onValueChanged={(e) => onFieldChange("toSiteId", e.value)} searchEnabled placeholder="Select destination site" />
              </div>
              <div className="m365-field">
                <label className="m365-field__label">Job Number</label>
                <TextBox value={formData.jobNumber} onValueChanged={(e) => onFieldChange("jobNumber", e.value)} placeholder="e.g., 7818" />
              </div>
            </div>
          </div>
        </div>

        {/* Driver Info */}
        <div className="m365-section-group">
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
                placeholder="Search for driver by name..."
                siteId={formData.fromSiteId}
              />
            </div>
            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              <div className="m365-field">
                <label className="m365-field__label">Driver Name (Manual)</label>
                <TextBox value={formData.driverName} onValueChanged={(e) => onFieldChange("driverName", e.value)} placeholder="e.g., VINCENT" />
              </div>
              <div className="m365-field">
                <label className="m365-field__label">Phone</label>
                <TextBox value={formData.driverPhone} onValueChanged={(e) => onFieldChange("driverPhone", e.value)} placeholder="e.g., 0714079900" />
              </div>
            </div>
          </div>
        </div>

        {/* Equipment Reading */}
        <div className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-gauge m365-section-group__icon" />
            <h3 className="m365-section-group__title">Equipment Reading</h3>
          </div>
          <div className="m365-section-group__body">
            <div className="tw-grid tw-grid-cols-3 tw-gap-4">
              <div className="m365-field">
                <label className="m365-field__label">Current Reading</label>
                <NumberBox value={formData.currentReading} onValueChanged={(e) => onFieldChange("currentReading", e.value)} format="#,##0.##" />
              </div>
              <div className="m365-field">
                <label className="m365-field__label">Unit</label>
                <SelectBox dataSource={READING_UNIT_OPTIONS} displayExpr="text" valueExpr="value" value={formData.readingUnit} onValueChanged={(e) => onFieldChange("readingUnit", e.value)} />
              </div>
              <div className="m365-field">
                <label className="m365-field__label">Next Service At</label>
                <NumberBox value={formData.nextServiceReading} onValueChanged={(e) => onFieldChange("nextServiceReading", e.value)} format="#,##0.##" />
              </div>
            </div>
            <div className="tw-grid tw-grid-cols-3 tw-gap-4 tw-mt-2">
              <div className="m365-field">
                <label className="m365-field__label">Battery Number</label>
                <TextBox value={formData.batteryNumber} onValueChanged={(e) => onFieldChange("batteryNumber", e.value)} />
              </div>
              <div className="m365-field">
                <label className="m365-field__label">Fuel in Tank (L)</label>
                <NumberBox value={formData.fuelInTank} onValueChanged={(e) => onFieldChange("fuelInTank", e.value)} format="#,##0.##" />
              </div>
              <div className="m365-field">
                <label className="m365-field__label">Seal Number</label>
                <TextBox value={formData.sealNumber} onValueChanged={(e) => onFieldChange("sealNumber", e.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Departure / Arrival */}
        <div className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-clock m365-section-group__icon" />
            <h3 className="m365-section-group__title">Departure / Arrival</h3>
          </div>
          <div className="m365-section-group__body">
            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              <div className="m365-field">
                <label className="m365-field__label">Departure Time</label>
                <DateBox value={formData.departureTime} onValueChanged={(e) => onFieldChange("departureTime", e.value)} type="datetime" displayFormat="dd/MM/yyyy HH:mm" />
              </div>
              <div className="m365-field">
                <label className="m365-field__label">Arrival Time</label>
                <DateBox value={formData.arrivalTime} onValueChanged={(e) => onFieldChange("arrivalTime", e.value)} type="datetime" displayFormat="dd/MM/yyyy HH:mm" />
              </div>
            </div>
            <div className="tw-flex tw-gap-6 tw-mt-3">
              <label className="m365-checkbox">
                <input type="checkbox" checked={formData.antiTheftCheckedDeparture} onChange={(e) => onFieldChange("antiTheftCheckedDeparture", e.target.checked)} />
                <span className="m365-checkbox__label">Anti-theft Checked (Departure)</span>
              </label>
              <label className="m365-checkbox">
                <input type="checkbox" checked={formData.keysInEnvelopeChecked} onChange={(e) => onFieldChange("keysInEnvelopeChecked", e.target.checked)} />
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
